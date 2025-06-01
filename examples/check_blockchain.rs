//! 检查区块链连接状态的示例程序

use reqwest::Client;
use serde_json::json;
use tokio;

#[tokio::main]
async fn main() {
    println!("正在检查区块链连接状态...");
    
    let client = Client::new();
    let blockchain_url = "http://localhost:8545";

    let payload = json!({
        "jsonrpc": "2.0",
        "method": "web3_clientVersion",
        "params": [],
        "id": 1
    });

    match client.post(blockchain_url)
        .json(&payload)
        .send()
        .await {
        Ok(response) => {
            if response.status().is_success() {
                let text = response.text().await.unwrap_or_default();
                println!("区块链连接正常，响应: {}", text);
            } else {
                println!("区块链连接异常，状态码: {}", response.status());
            }
        },
        Err(e) => println!("区块链连接失败: {}", e),
    }
}