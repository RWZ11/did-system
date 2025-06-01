# 去中心化身份管理系统

基于CORD区块链框架和Cryptid DID实现的去中心化身份管理系统。本系统提供了完整的DID（去中心化身份标识符）生命周期管理功能，包括创建、解析、更新和停用DID。

## 系统架构

系统主要由以下模块组成：

1. **DID模块**
   - DID文档的核心数据结构
   - DID生命周期管理功能
   - 身份验证和授权

2. **区块链模块**
   - 与CORD区块链的交互
   - DID文档的链上存储和检索
   - 交易处理和状态同步

3. **API模块**
   - RESTful API接口
   - 请求处理和响应格式化
   - 错误处理

4. **数据库模块**
   - 本地数据存储
   - DID文档缓存
   - 状态管理

5. **工具模块**
   - 密钥管理
   - 签名验证
   - 辅助功能

## 技术栈

- Rust编程语言
- Substrate区块链框架
- SQLite数据库
- Axum Web框架

## API接口

### 1. 创建DID

```http
POST /did/create
Content-Type: application/json

{
    "controller_key": "<base58编码的控制者私钥>"
}
```

### 2. 解析DID

```http
GET /did/resolve
Content-Type: application/json

{
    "did": "did:cord:<identifier>"
}
```

### 3. 更新DID

```http
POST /did/update
Content-Type: application/json

{
    "did": "did:cord:<identifier>",
    "controller_key": "<base58编码的控制者私钥>",
    "document": {
        // 更新后的DID文档内容
    }
}
```

### 4. 停用DID

```http
POST /did/deactivate
Content-Type: application/json

{
    "did": "did:cord:<identifier>",
    "controller_key": "<base58编码的控制者私钥>"
}
```

## 安装和运行

1. 安装Rust和Cargo
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

2. 克隆项目
```bash
git clone <repository_url>
cd did-system
```

3. 编译项目
```bash
cargo build --release
```

4. 运行服务
```bash
cargo run --release
```

服务默认在 `http://localhost:3000` 启动。

## 开发说明

1. **项目结构**
```
src/
├── api/            # API接口处理
├── blockchain/     # 区块链交互
├── did/            # DID核心功能
├── db/            # 数据库操作
├── types.rs       # 类型定义
├── utils.rs       # 工具函数
└── main.rs        # 程序入口
```

2. **开发环境要求**
- Rust 1.70.0 或更高版本
- SQLite 3.x
- 可访问的CORD节点

3. **测试**
```bash
cargo test
```

## 安全性考虑

1. 私钥安全
   - 私钥永远不会以明文形式存储
   - 所有私钥操作都在内存中进行

2. 数据完整性
   - 使用区块链确保DID文档的不可篡改性
   - 本地数据库用于缓存，提供快速访问

3. 访问控制
   - 基于密码学验证确保只有授权用户可以修改DID
   - API接口实现了适当的访问控制

## 贡献指南

1. Fork项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

MIT License