//! DID模块 - 实现DID的核心功能

use ed25519_dalek::SigningKey;
use serde::{Deserialize, Serialize};
use crate::blockchain;
use crate::db;
use crate::types::Error;
use crate::utils;

/// DID文档结构
#[derive(Debug, Serialize, Deserialize)]
pub struct DIDDocument {
    /// DID标识符
    pub id: String,
    /// 公钥列表
    pub public_keys: Vec<PublicKeyInfo>,
    /// 认证方法
    pub authentication: Vec<String>,
    /// 服务端点
    pub services: Vec<Service>,
    /// 创建时间
    pub created: u64,
    /// 更新时间
    pub updated: u64,
}

/// 公钥信息
#[derive(Debug, Serialize, Deserialize)]
pub struct PublicKeyInfo {
    pub id: String,
    pub type_: String,
    pub controller: String,
    pub public_key_base58: String,
}

/// 服务端点
#[derive(Debug, Serialize, Deserialize)]
pub struct Service {
    pub id: String,
    pub type_: String,
    pub endpoint: String,
}

/// 创建新的DID
pub async fn create_did(signing_key: &SigningKey) -> Result<DIDDocument, Error> {
    // 获取验证密钥（公钥）
    let verifying_key = signing_key.verifying_key();
    let public_key_bytes = verifying_key.to_bytes();
    
    // 生成DID标识符
    let did = format!("did:example:{}", utils::encode_base58(&public_key_bytes));
    
    // 创建公钥信息
    let key_id = format!("{}{}", did, "#keys-1");
    let public_key_info = PublicKeyInfo {
        id: key_id.clone(),
        type_: "Ed25519VerificationKey2020".to_string(),
        controller: did.clone(),
        public_key_base58: utils::encode_base58(&public_key_bytes),
    };
    
    // 创建DID文档
    let timestamp = utils::current_timestamp();
    let document = DIDDocument {
        id: did.clone(),
        public_keys: vec![public_key_info],
        authentication: vec![key_id],
        services: Vec::new(),
        created: timestamp,
        updated: timestamp,
    };
    
    // 将DID文档保存到数据库
    db::store_did_document(&did, &document)?;
    
    // 将DID注册到区块链
    blockchain::register_did(&did, &public_key_bytes).await?;
    
    Ok(document)
}

/// 解析DID
pub async fn resolve_did(did: &str) -> Result<DIDDocument, Error> {
    log::debug!("开始解析DID: {}", did);
    
    // 从数据库中获取DID文档
    match db::get_did_document(did)? {
        Some(document) => {
            log::debug!("从数据库中找到DID文档");
            
            // 暂时跳过区块链状态检查，因为我们还没有完全实现区块链集成
            // TODO: 在区块链集成完成后恢复状态检查
            // let is_active = blockchain::verify_did(did).await?;
            // if !is_active {
            //     return Err(Error::InvalidState("DID is deactivated".to_string()));
            // }
            
            Ok(document)
        },
        None => {
            log::error!("DID不存在: {}", did);
            Err(Error::NotFound(format!("DID not found: {}", did)))
        }
    }
}

/// 更新DID文档
pub async fn update_did(
    did: &str,
    signing_key: &SigningKey,
    mut document: DIDDocument,
) -> Result<DIDDocument, Error> {
    // 验证DID所有权
    verify_did_ownership(did, signing_key)?;
    
    // 验证DID在区块链上的状态
    let is_active = blockchain::verify_did(did).await?;
    if !is_active {
        return Err(Error::InvalidState("DID is deactivated".to_string()));
    }
    
    // 更新时间戳
    document.updated = utils::current_timestamp();
    
    // 更新数据库中的DID文档
    db::store_did_document(did, &document)?;
    
    Ok(document)
}

/// 停用DID
pub async fn deactivate_did(did: &str, signing_key: &SigningKey) -> Result<(), Error> {
    // 验证DID所有权
    verify_did_ownership(did, signing_key)?;
    
    // 在区块链上停用DID
    blockchain::deactivate_did(did).await?;
    
    Ok(())
}

/// 验证DID所有权
fn verify_did_ownership(did: &str, signing_key: &SigningKey) -> Result<(), Error> {
    // 获取DID文档
    let document = db::get_did_document(did)?
        .ok_or_else(|| Error::NotFound(format!("DID not found: {}", did)))?;
    
    // 获取验证密钥
    let verifying_key = signing_key.verifying_key();
    let public_key_bytes = verifying_key.to_bytes();
    let public_key_base58 = utils::encode_base58(&public_key_bytes);
    
    // 验证公钥是否匹配
    if !document.public_keys.iter().any(|key| key.public_key_base58 == public_key_base58) {
        return Err(Error::Unauthorized("Invalid signing key".to_string()));
    }
    
    Ok(())
}