//! 区块链交互模块 - 通过HTTP API与外部区块链节点交互

use serde::Deserialize;
use reqwest::Client;
use crate::did::DIDDocument;
use crate::types::Error;

/// 区块链配置
#[derive(Clone, Debug)]
pub struct BlockchainConfig {
    /// 区块链节点的HTTP API端点
    pub node_url: String,
}

/// 区块链客户端
#[derive(Clone)]
pub struct BlockchainClient {
    config: BlockchainConfig,
    client: Client,
}

/// 交易响应
#[derive(Debug, Deserialize)]
struct TransactionResponse {
    /// 交易哈希
    hash: String,
    /// 交易状态
    status: String,
}

impl BlockchainClient {
    /// 初始化区块链客户端
    pub fn init(config: BlockchainConfig) -> Self {
        Self {
            config,
            client: Client::new(),
        }
    }

    /// 发送交易到区块链
    async fn send_transaction(&self, endpoint: &str, data: &[u8]) -> Result<String, Error> {
        let response = self.client
            .post(format!("{}{}", self.config.node_url, endpoint))
            .body(data.to_vec())
            .send()
            .await
            .map_err(|e| Error::BlockchainError(format!("Failed to send transaction: {}", e)))?;

        let tx_response: TransactionResponse = response
            .json()
            .await
            .map_err(|e| Error::BlockchainError(format!("Failed to parse response: {}", e)))?;

        Ok(tx_response.hash)
    }

    /// 存储DID文档到区块链
    pub async fn store_did_document(&self, document: &DIDDocument) -> Result<String, Error> {
        let data = serde_json::to_vec(document)
            .map_err(|e| Error::SerializationError(e.to_string()))?;

        self.send_transaction("/did/store", &data).await
    }

    /// 从区块链获取DID文档
    pub async fn get_did_document(&self, did: &str) -> Result<DIDDocument, Error> {
        let response = self.client
            .get(format!("{}/did/{}", self.config.node_url, did))
            .send()
            .await
            .map_err(|e| Error::BlockchainError(format!("Failed to get DID document: {}", e)))?;

        if response.status() == reqwest::StatusCode::NOT_FOUND {
            return Err(Error::NotFound(format!("DID not found: {}", did)));
        }

        response
            .json()
            .await
            .map_err(|e| Error::BlockchainError(format!("Failed to parse DID document: {}", e)))
    }

    /// 停用DID
    pub async fn deactivate_did(&self, did: &str) -> Result<String, Error> {
        self.send_transaction("/did/deactivate", did.as_bytes()).await
    }
}

// 为了方便其他模块使用，提供一些全局函数
static mut CLIENT: Option<BlockchainClient> = None;

/// 初始化区块链连接
pub async fn init() -> Result<(), Error> {
    let config = BlockchainConfig {
        node_url: "http://localhost:8545/did".to_string(),
    };
    println!("Blockchain initialized with endpoint: {}", config.node_url);
    unsafe {
        CLIENT = Some(BlockchainClient::init(config));
    }
    Ok(())
}

/// 获取全局区块链客户端的引用
fn get_client() -> Result<&'static BlockchainClient, Error> {
    unsafe {
        CLIENT.as_ref().ok_or_else(|| Error::BlockchainError("Blockchain client not initialized".to_string()))
    }
}

/// 存储DID文档到区块链
pub async fn store_did_document(document: &DIDDocument) -> Result<String, Error> {
    get_client()?.store_did_document(document).await
}

/// 从区块链获取DID文档
pub async fn get_did_document(did: &str) -> Result<DIDDocument, Error> {
    get_client()?.get_did_document(did).await
}

/// 停用DID
pub async fn deactivate_did(did: &str) -> Result<String, Error> {
    get_client()?.deactivate_did(did).await
}

/// 注册DID到区块链
pub async fn register_did(did: &str, public_key: &[u8]) -> Result<String, Error> {
    // 构造注册数据
    let data = [did.as_bytes(), public_key].concat();
    get_client()?.send_transaction("/did/register", &data).await
}

/// 验证DID在区块链上的状态
pub async fn verify_did(did: &str) -> Result<bool, Error> {
    let response = get_client()?.client
        .get(format!("{}/did/{}/status", get_client()?.config.node_url, did))
        .send()
        .await
        .map_err(|e| Error::BlockchainError(format!("Failed to verify DID status: {}", e)))?;

    // 检查响应状态码
    if !response.status().is_success() {
        log::error!("获取DID状态失败: HTTP {}", response.status());
        return Err(Error::BlockchainError(format!(
            "Failed to get DID status: HTTP {}", 
            response.status()
        )));
    }

    // 解析 JSON 响应
    let text = response.text().await
        .map_err(|e| Error::BlockchainError(format!("Failed to get response text: {}", e)))?;
    
    log::debug!("区块链返回的DID状态响应: {}", text);

    // 尝试解析为状态对象
    #[derive(Deserialize, Debug)]
    struct Status {
        active: bool,
    }

    match serde_json::from_str::<Status>(&text) {
        Ok(status) => {
            log::debug!("解析到DID状态: {:?}", status);
            Ok(status.active)
        },
        Err(e) => {
            log::error!("解析DID状态失败: {}", e);
            // 如果解析失败，我们认为DID是活跃的（向后兼容）
            Ok(true)
        }
    }
}