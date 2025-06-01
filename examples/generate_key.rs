//! 生成 Ed25519 密钥对的示例程序

use ed25519_dalek::SigningKey;
use bs58;
use rand::rngs::OsRng;

fn main() {
    // 生成新的密钥对
    let mut csprng = OsRng{};
    let signing_key = SigningKey::generate(&mut csprng);
    
    // 获取私钥字节（32字节）
    let private_key_bytes = signing_key.to_bytes();
    
    // Base58 编码
    let private_key_base58 = bs58::encode(&private_key_bytes).into_string();
    
    println!("生成的 Ed25519 私钥：");
    println!("原始字节长度: {} 字节", private_key_bytes.len());
    println!("私钥 (Base58): {}", private_key_base58);
}