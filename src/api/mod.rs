//! API模块 - 提供HTTP API接口

use axum::{
    response::Json,
    routing::{get, post, put, delete},
    Router,
};
use serde::Serialize;
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use crate::types::Error;

pub mod did;

/// API错误响应
#[derive(Debug, Serialize)]
pub struct ApiError {
    pub message: String,
    pub code: u16,
}

/// API响应
#[derive(Debug, Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<ApiError>,
}

/// 应用状态
#[derive(Clone)]
pub struct AppState {
    // 可以添加数据库连接池等共享状态
}

/// 健康检查接口
pub async fn health_check() -> Json<ApiResponse<String>> {
    Json(ApiResponse {
        success: true,
        data: Some("DID System is running".to_string()),
        error: None,
    })
}

/// 创建API路由
pub fn create_router() -> Router {
    let state = Arc::new(AppState {});
    
    Router::new()
        .route("/health", get(health_check))
        .route("/did", post(did::create_did))
        .route("/did/:did", get(did::resolve_did))
        .route("/did/:did", put(did::update_did))
        .route("/did/:did", delete(did::deactivate_did))
        .layer(CorsLayer::permissive())
        .with_state(state)
}

/// 错误转换
impl From<Error> for ApiError {
    fn from(err: Error) -> Self {
        let (message, code) = match err {
            Error::NotFound(msg) => (msg, 404),
            Error::InvalidInput(msg) => (msg, 400),
            Error::Unauthorized(msg) => (msg, 401),
            Error::InvalidState(msg) => (msg, 409),
            Error::DatabaseError(msg) => (format!("Database error: {}", msg), 500),
            Error::BlockchainError(msg) => (format!("Blockchain error: {}", msg), 500),
            Error::CryptoError(msg) => (format!("Crypto error: {}", msg), 500),
            Error::SerializationError(msg) => (format!("Serialization error: {}", msg), 500),
            Error::NetworkError(msg) => (format!("Network error: {}", msg), 500),
            Error::InternalError(msg) => (format!("Internal error: {}", msg), 500),
        };
        
        ApiError { message, code }
    }
}