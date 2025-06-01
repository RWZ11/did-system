# DID System Frontend

这是去中心化身份系统（DID System）的前端项目，使用React、TypeScript和Ant Design构建。

## 功能特性

- 创建DID：生成新的去中心化身份标识符
- 解析DID：查询并验证DID文档信息
- 更新DID：修改DID文档内容
- 现代化UI：基于Ant Design的用户友好界面
- 响应式设计：支持各种设备尺寸

## 技术栈

- React 18
- TypeScript 4.9+
- Vite 5.0
- Ant Design 5.0
- Tailwind CSS
- Axios

## 开发环境要求

- Node.js 16+
- npm 7+ 或 yarn 1.22+

## 安装和运行

1. 安装依赖：
```bash
npm install
# 或
yarn
```

2. 启动开发服务器：
```bash
npm run dev
# 或
yarn dev
```

3. 构建生产版本：
```bash
npm run build
# 或
yarn build
```

4. 预览生产构建：
```bash
npm run preview
# 或
yarn preview
```

## 项目结构

```
├── src/
│   ├── components/     # 可复用组件
│   ├── pages/         # 页面组件
│   ├── services/      # API服务
│   ├── types/         # TypeScript类型定义
│   ├── App.tsx        # 应用程序入口组件
│   └── main.tsx       # 应用程序入口文件
├── public/           # 静态资源
├── index.html        # HTML模板
├── vite.config.ts    # Vite配置
├── tailwind.config.js # Tailwind CSS配置
└── tsconfig.json     # TypeScript配置
```

## API接口

前端通过以下API与后端通信：

- POST /api/did/create - 创建新的DID
- GET /api/did/:did - 解析DID文档
- PUT /api/did/:did - 更新DID文档
- DELETE /api/did/:did - 停用DID

## 开发指南

1. 本地开发时，API请求会通过Vite的代理功能转发到后端服务器（默认：http://localhost:3000）

2. 修改API地址：在`vite.config.ts`中更新proxy配置

3. 添加新页面：
   - 在`src/pages`创建新的页面组件
   - 在`App.tsx`中添加路由配置

4. 样式开发：
   - 使用Tailwind CSS的工具类
   - 在`src/index.css`中添加自定义样式
   - 使用Ant Design的组件和主题定制

## 注意事项

1. 确保后端服务器已启动并正常运行
2. 签名密钥必须是Base58编码的Ed25519私钥
3. DID标识符格式必须符合规范（例如：did:example:123...）
4. 注意保护用户的私钥信息，避免在前端存储敏感数据

## 贡献指南

1. Fork本仓库
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

MIT License