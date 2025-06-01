//! DID相关的HTTP接口处理函数

use axum::extract::{Path, Json};
use axum::http::StatusCode;
use ed25519_dalek::{SigningKey, KEYPAIR_LENGTH};
use serde::Deserialize;
use crate::did::{self, DIDDocument, PublicKeyInfo};
use crate::types::Error;
use crate::api::{ApiResponse, ApiError};
use crate::db;
use crate::utils;

/// 创建DID请求
#[derive(Debug, Deserialize)]
pub struct CreateDIDRequest {
    /// 签名密钥（Base58编码）
    pub signing_key: String,
}

/// 更新DID请求
#[derive(Debug, Deserialize)]
pub struct UpdateDIDRequest {
    /// 签名密钥（Base58编码）
    pub signing_key: String,
    /// 更新后的DID文档
    pub document: DIDDocument,
}

/// 停用DID请求
#[derive(Debug, Deserialize)]
pub struct DeactivateDIDRequest {
    /// 签名密钥（Base58编码）
    pub signing_key: String,
}

/// 创建DID处理函数
pub async fn create_did(
    Json(request): Json<CreateDIDRequest>,
) -> Result<(StatusCode, Json<ApiResponse<DIDDocument>>), (StatusCode, Json<ApiResponse<()>>)> {
    match process_create_did(request).await {
        Ok(document) => Ok((StatusCode::CREATED, Json(ApiResponse {
            success: true,
            data: Some(document),
            error: None,
        }))),
        Err(e) => {
            let api_error: ApiError = e.into();
            Err((StatusCode::from_u16(api_error.code).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR),
                Json(ApiResponse {
                    success: false,
                    data: None,
                    error: Some(api_error),
                })))
        }
    }
}

async fn process_create_did(request: CreateDIDRequest) -> Result<DIDDocument, Error> {
    log::info!("开始处理创建DID请求");
    log::debug!("收到的签名密钥: {}", request.signing_key);
    
    // Base58解码签名密钥
    let key_bytes = match bs58::decode(&request.signing_key).into_vec() {
        Ok(bytes) => {
            log::debug!("Base58解码成功，密钥字节长度: {}", bytes.len());
            if bytes.len() != 32 {
                log::error!("私钥长度错误：期望32字节，实际{}字节", bytes.len());
                return Err(Error::InvalidInput(
                    format!("Ed25519私钥长度必须为32字节，实际为{}字节", bytes.len())
                ));
            }
            bytes
        },
        Err(e) => {
            log::error!("Base58解码失败: {}", e);
            return Err(Error::InvalidInput(format!("无效的Base58编码: {}", e)));
        }
    };

    // 创建签名密钥
    let signing_key = {
        let key_array: [u8; 32] = key_bytes.try_into().map_err(|_| {
            log::error!("无法将字节转换为固定长度数组");
            Error::InvalidInput("无法处理私钥数据".to_string())
        })?;
        
        SigningKey::from_bytes(&key_array)
    };

    // 获取验证密钥（公钥）
    let verifying_key = signing_key.verifying_key();
    let public_key_bytes = verifying_key.to_bytes();
    let public_key_base58 = bs58::encode(&public_key_bytes).into_string();

    // 生成DID
    let did = format!("did:web:{}", public_key_base58);
    log::debug!("生成的DID: {}", did);

    // 创建DID文档
    let document = DIDDocument {
        id: did.clone(),
        public_keys: vec![PublicKeyInfo {
            id: format!("{}#keys-1", did),
            type_: "Ed25519VerificationKey2020".to_string(),
            controller: did.clone(),
            public_key_base58: public_key_base58.clone(),
        }],
        authentication: vec![format!("{}#keys-1", did)],
        services: vec![],
        created: utils::current_timestamp(),
        updated: utils::current_timestamp(),
    };

    // 存储DID文档
    db::store_did_document(&did, &document)?;

    log::info!("DID创建成功: {}", did);
    Ok(document)
}

/// 解析DID处理函数
pub async fn resolve_did(
    Path(did): Path<String>,
) -> Result<(StatusCode, Json<ApiResponse<DIDDocument>>), (StatusCode, Json<ApiResponse<()>>)> {
    match did::resolve_did(&did).await {
        Ok(document) => Ok((StatusCode::OK, Json(ApiResponse {
            success: true,
            data: Some(document),
            error: None,
        }))),
        Err(e) => {
            let api_error: ApiError = e.into();
            Err((StatusCode::from_u16(api_error.code).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR),
                Json(ApiResponse {
                    success: false,
                    data: None,
                    error: Some(api_error),
                })))
        }
    }
}

/// 更新DID处理函数
pub async fn update_did(
    Path(did): Path<String>,
    Json(request): Json<UpdateDIDRequest>,
) -> Result<(StatusCode, Json<ApiResponse<DIDDocument>>), (StatusCode, Json<ApiResponse<()>>)> {
    match process_update_did(did, request).await {
        Ok(document) => Ok((StatusCode::OK, Json(ApiResponse {
            success: true,
            data: Some(document),
            error: None,
        }))),
        Err(e) => {
            let api_error: ApiError = e.into();
            Err((StatusCode::from_u16(api_error.code).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR),
                Json(ApiResponse {
                    success: false,
                    data: None,
                    error: Some(api_error),
                })))
        }
    }
}

async fn process_update_did(did: String, request: UpdateDIDRequest) -> Result<DIDDocument, Error> {
    // 解码签名密钥
    let key_bytes = bs58::decode(&request.signing_key)
        .into_vec()
        .map_err(|e| Error::InvalidInput(format!("Invalid signing key encoding: {}", e)))?;

    if key_bytes.len() != KEYPAIR_LENGTH {
        return Err(Error::InvalidInput("Invalid signing key length".to_string()));
    }

    let mut bytes = [0u8; KEYPAIR_LENGTH];
    bytes.copy_from_slice(&key_bytes);

    let signing_key = SigningKey::from_keypair_bytes(&bytes)
        .map_err(|e| Error::InvalidInput(format!("Invalid signing key: {}", e)))?;

    // 更新DID文档
    did::update_did(&did, &signing_key, request.document).await
}

/// 停用DID处理函数
pub async fn deactivate_did(
    Path(did): Path<String>,
    Json(request): Json<DeactivateDIDRequest>,
) -> Result<(StatusCode, Json<ApiResponse<()>>), (StatusCode, Json<ApiResponse<()>>)> {
    match process_deactivate_did(did, request).await {
        Ok(()) => Ok((StatusCode::OK, Json(ApiResponse {
            success: true,
            data: Some(()),
            error: None,
        }))),
        Err(e) => {
            let api_error: ApiError = e.into();
            Err((StatusCode::from_u16(api_error.code).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR),
                Json(ApiResponse {
                    success: false,
                    data: None,
                    error: Some(api_error),
                })))
        }
    }
}

async fn process_deactivate_did(did: String, request: DeactivateDIDRequest) -> Result<(), Error> {
    // 解码签名密钥
    let key_bytes = bs58::decode(&request.signing_key)
        .into_vec()
        .map_err(|e| Error::InvalidInput(format!("Invalid signing key encoding: {}", e)))?;

    if key_bytes.len() != KEYPAIR_LENGTH {
        return Err(Error::InvalidInput("Invalid signing key length".to_string()));
    }

    let mut bytes = [0u8; KEYPAIR_LENGTH];
    bytes.copy_from_slice(&key_bytes);

    let signing_key = SigningKey::from_keypair_bytes(&bytes)
        .map_err(|e| Error::InvalidInput(format!("Invalid signing key: {}", e)))?;

    // 停用DID
    did::deactivate_did(&did, &signing_key).await
}