//! DID系统主程序

mod api;
mod blockchain;
mod db;
mod did;
mod types;
mod utils;

use std::net::SocketAddr;
use tokio;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 初始化日志
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("debug"))
        .format_timestamp_secs()
        .init();
    
    println!("Starting DID System...");
    
    // 初始化数据库
    db::init_database()?;
    println!("Database initialized");
    
    // 初始化区块链连接
    blockchain::init().await?;
    println!("Blockchain connection initialized");
    
    // 创建API路由
    let app = api::create_router();
    
    // 启动服务器
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("DID System running on http://{}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    
    Ok(())
}
