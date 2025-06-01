//! 系统错误类型定义

use thiserror::Error;

/// 系统错误类型
#[derive(Debug, Error)]
pub enum Error {
    /// 序列化错误
    #[error("Serialization error: {0}")]
    SerializationError(String),

    /// 数据库错误
    #[error("Database error: {0}")]
    DatabaseError(String),

    /// 区块链错误
    #[error("Blockchain error: {0}")]
    BlockchainError(String),

    /// 未找到
    #[error("Resource not found: {0}")]
    NotFound(String),

    /// 未授权
    #[error("Unauthorized: {0}")]
    Unauthorized(String),

    /// 无效输入
    #[error("Invalid input: {0}")]
    InvalidInput(String),

    /// 内部错误
    #[error("Internal error: {0}")]
    InternalError(String),

    /// 加密错误
    #[error("Crypto error: {0}")]
    CryptoError(String),

    /// 网络错误
    #[error("Network error: {0}")]
    NetworkError(String),

    /// 无效状态
    #[error("Invalid state: {0}")]
    InvalidState(String),
}

/// DID状态
#[derive(Debug, Clone, PartialEq)]
pub enum DIDStatus {
    /// 活跃
    Active,
    /// 已停用
    Deactivated,
}

impl Default for DIDStatus {
    fn default() -> Self {
        Self::Active
    }
}

/// 从字符串转换为DID状态
impl std::str::FromStr for DIDStatus {
    type Err = Error;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "active" => Ok(DIDStatus::Active),
            "deactivated" => Ok(DIDStatus::Deactivated),
            _ => Err(Error::InvalidInput(format!("Invalid DID status: {}", s))),
        }
    }
}