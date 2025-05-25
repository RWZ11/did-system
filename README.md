# 去中心化身份(DID)系统

基于以太坊区块链的去中心化身份管理系统，提供安全的身份注册、验证和管理功能。

## 功能特性

- ✅ **DID注册与管理**：创建、更新和撤销去中心化身份
- 🔒 **安全验证**：基于区块链的不可篡改身份记录
- 🏷️ **身份档案**：支持用户名、头像、标签等个人信息
- 📧 **邮箱验证**：可验证的邮箱地址系统
- 🌐 **社交账号关联**：连接社交媒体账号
- 🔑 **多地址授权**：授权其他地址管理您的DID

## 技术栈

- **智能合约**：Solidity + Hardhat
- **前端**：React + ethers.js
- **区块链**：以太坊兼容网络

## 快速开始

### 前置要求

- Node.js (v18+)
- npm (v9+)
- Git

### 安装步骤

1. 克隆仓库
```bash
git clone https://github.com/your-repo/did-system.git
cd did-system
```

2. 安装依赖
```bash
# 安装合约依赖
npm install

# 安装前端依赖
cd frontend
npm install
```

3. 配置环境

复制`.env.example`文件并重命名为`.env`，然后填写您的配置：
```bash
cp .env.example .env
```

### 运行本地开发环境

1. 启动本地区块链网络
```bash
npx hardhat node
```

2. 部署智能合约（在新终端中）
```bash
npm run deploy
```

3. 启动前端应用
```bash
cd frontend
npm start
```

前端应用将在 [http://localhost:3000](http://localhost:3000) 自动打开。

## 使用指南

### 注册DID
1. 连接钱包
2. 输入您的DID标识符
3. 点击"注册"按钮

### 管理身份档案
- 更新用户名和头像
- 添加/删除标签
- 验证邮箱地址
- 关联社交账号

## 项目结构

```
did-system/
├── contracts/            # 智能合约代码
│   └── DID.sol          # 主合约
├── frontend/            # 前端应用
│   ├── public/          # 静态资源
│   └── src/             # React源代码
├── scripts/             # 部署脚本
├── test/                # 测试文件
└── hardhat.config.js    # Hardhat配置
```


