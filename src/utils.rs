//! 工具函数模块 - 实现通用的辅助功能

use ed25519_dalek::{SigningKey, VerifyingKey, Signature, Verifier};
use rand::rngs::OsRng;
use std::time::{SystemTime, UNIX_EPOCH};
use sha2::Digest;

/// 生成新的密钥对
pub fn generate_keypair() -> SigningKey {
    let mut csprng = OsRng{};
    SigningKey::generate(&mut csprng)
}

/// 验证签名
pub fn verify_signature(
    message: &[u8],
    signature: &[u8],
    public_key: &[u8],
) -> Result<bool, String> {
    // 检查公钥长度
    if public_key.len() != 32 {
        return Err("Invalid public key length".to_string());
    }

    // 转换为固定长度数组
    let mut key_bytes = [0u8; 32];
    key_bytes.copy_from_slice(public_key);

    // 创建验证密钥
    let verifying_key = VerifyingKey::from_bytes(&key_bytes)
        .map_err(|e| format!("Invalid public key: {}", e))?;

    // 检查签名长度
    if signature.len() != 64 {
        return Err("Invalid signature length".to_string());
    }

    // 转换为固定长度数组
    let mut sig_bytes = [0u8; 64];
    sig_bytes.copy_from_slice(signature);

    // 创建签名对象并验证
    let sig = Signature::from_bytes(&sig_bytes);
    
    Ok(verifying_key.verify(message, &sig).is_ok())
}

/// 获取当前时间戳（秒）
pub fn current_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

/// Base58编码
pub fn encode_base58(data: &[u8]) -> String {
    bs58::encode(data).into_string()
}

/// Base58解码
pub fn decode_base58(encoded: &str) -> Result<Vec<u8>, String> {
    bs58::decode(encoded)
        .into_vec()
        .map_err(|e| format!("Failed to decode base58: {}", e))
}

/// 生成随机字节
pub fn generate_random_bytes(length: usize) -> Vec<u8> {
    use rand::RngCore;
    let mut rng = OsRng{};
    let mut bytes = vec![0u8; length];
    rng.fill_bytes(&mut bytes);
    bytes
}

/// 计算SHA-256哈希
pub fn sha256(data: &[u8]) -> Vec<u8> {
    use sha2::{Sha256, Digest};
    let mut hasher = Sha256::new();
    hasher.update(data);
    hasher.finalize().to_vec()
}

/// 计算RIPEMD-160哈希
pub fn ripemd160(data: &[u8]) -> Vec<u8> {
    ripemd::Ripemd160::digest(data).to_vec()
}

/// 计算双重SHA-256哈希
pub fn double_sha256(data: &[u8]) -> Vec<u8> {
    sha256(&sha256(data))
}

/// 计算SHA-256和RIPEMD-160的组合哈希
pub fn hash160(data: &[u8]) -> Vec<u8> {
    ripemd160(&sha256(data))
}

/// 生成随机盐值
pub fn generate_salt() -> Vec<u8> {
    generate_random_bytes(32)
}

/// 检查字符串是否为有效的Base58编码
pub fn is_valid_base58(encoded: &str) -> bool {
    decode_base58(encoded).is_ok()
}

/// 检查字符串是否为有效的十六进制编码
pub fn is_valid_hex(hex: &str) -> bool {
    hex.len() % 2 == 0 && hex.chars().all(|c| c.is_ascii_hexdigit())
}

/// 将字节数组转换为十六进制字符串
pub fn to_hex(bytes: &[u8]) -> String {
    bytes.iter()
        .map(|b| format!("{:02x}", b))
        .collect()
}

/// 将十六进制字符串转换为字节数组
pub fn from_hex(hex: &str) -> Result<Vec<u8>, String> {
    if !is_valid_hex(hex) {
        return Err("Invalid hex string".to_string());
    }

    let mut bytes = Vec::with_capacity(hex.len() / 2);
    for i in (0..hex.len()).step_by(2) {
        let byte = u8::from_str_radix(&hex[i..i + 2], 16)
            .map_err(|e| format!("Failed to parse hex: {}", e))?;
        bytes.push(byte);
    }
    Ok(bytes)
}