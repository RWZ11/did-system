//! 数据库模块 - 实现本地数据存储

use rusqlite::{Connection, params};
use crate::did::DIDDocument;
use crate::types::Error;

/// 初始化数据库
pub fn init_database() -> Result<(), Error> {
    let conn = Connection::open("did.db")
        .map_err(|e| Error::DatabaseError(format!("Failed to open database: {}", e)))?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS did_documents (
            did TEXT PRIMARY KEY,
            document TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        )",
        [],
    ).map_err(|e| Error::DatabaseError(format!("Failed to create table: {}", e)))?;

    Ok(())
}

/// 存储DID文档
pub fn store_did_document(did: &str, document: &DIDDocument, is_update: bool) -> Result<(), Error> {
    let conn = Connection::open("did.db")
        .map_err(|e| Error::DatabaseError(format!("Failed to open database: {}", e)))?;

    // 检查DID是否存在
    let mut stmt = conn.prepare(
        "SELECT COUNT(*) FROM did_documents WHERE did = ?"
    ).map_err(|e| Error::DatabaseError(format!("Failed to prepare statement: {}", e)))?;

    let count: i64 = stmt.query_row(params![did], |row| row.get(0))
        .map_err(|e| Error::DatabaseError(format!("Failed to check DID existence: {}", e)))?;

    // 如果是创建操作且DID已存在，返回错误
    if !is_update && count > 0 {
        return Err(Error::InvalidInput(format!("DID already exists: {}", did)));
    }
    // 如果是更新操作且DID不存在，返回错误
    if is_update && count == 0 {
        return Err(Error::NotFound(format!("DID not found: {}", did)));
    }

    let document_json = serde_json::to_string(document)
        .map_err(|e| Error::SerializationError(e.to_string()))?;

    // 根据操作类型选择SQL语句
    let sql = if is_update {
        "UPDATE did_documents SET document = ?, updated_at = ? WHERE did = ?"
    } else {
        "INSERT INTO did_documents (did, document, created_at, updated_at) VALUES (?, ?, ?, ?)"
    };

    if is_update {
        conn.execute(
            sql,
            params![document_json, document.updated, did],
        )
    } else {
        conn.execute(
            sql,
            params![did, document_json, document.created, document.updated],
        )
    }.map_err(|e| Error::DatabaseError(format!("Failed to store document: {}", e)))?;

    Ok(())
}

/// 获取DID文档
pub fn get_did_document(did: &str) -> Result<Option<DIDDocument>, Error> {
    let conn = Connection::open("did.db")
        .map_err(|e| Error::DatabaseError(format!("Failed to open database: {}", e)))?;

    let mut stmt = conn.prepare(
        "SELECT document FROM did_documents WHERE did = ? AND is_active = 1"
    ).map_err(|e| Error::DatabaseError(format!("Failed to prepare statement: {}", e)))?;

    let mut rows = stmt.query(params![did])
        .map_err(|e| Error::DatabaseError(format!("Failed to execute query: {}", e)))?;

    if let Some(row) = rows.next()
        .map_err(|e| Error::DatabaseError(format!("Failed to fetch row: {}", e)))? {
        let document_json: String = row.get(0)
            .map_err(|e| Error::DatabaseError(format!("Failed to get document: {}", e)))?;

        let document = serde_json::from_str(&document_json)
            .map_err(|e| Error::SerializationError(e.to_string()))?;

        Ok(Some(document))
    } else {
        Ok(None)
    }
}

/// 停用DID
pub fn deactivate_did(did: &str) -> Result<(), Error> {
    let conn = Connection::open("did.db")
        .map_err(|e| Error::DatabaseError(format!("Failed to open database: {}", e)))?;

    conn.execute(
        "UPDATE did_documents SET is_active = 0 WHERE did = ?",
        params![did],
    ).map_err(|e| Error::DatabaseError(format!("Failed to deactivate DID: {}", e)))?;

    Ok(())
}