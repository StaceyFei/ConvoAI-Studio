# ConvoAI Studio

一个基于 `Vite + React + Express` 的对话式 AI 配置工作台。

## 项目结构

- `src/`：前端应用
- `server/index.js`：后端代理服务，负责调用 Ark 接口
- `.env.example`：本地与线上环境变量示例

## 本地开发

1. 复制环境变量模板：

```bash
cp .env.example .env
```

2. 填写 `.env` 中的 `ARK_API_KEY`

3. 启动前后端联调：

```bash
npm install
npm run dev
```

4. 访问：

```text
http://localhost:5173
```

## 常用命令

```bash
npm run dev
npm run build
npm run build:client
npm run server
npm run preview
```

## 环境变量

```env
ARK_API_KEY=your_ark_api_key_here
ARK_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
ARK_MODEL=ep-20260520114334-xm6zh
PORT=8787
ALLOWED_ORIGIN=http://localhost:5173
VITE_API_BASE_URL=/api
```

## 部署

- 前端建议部署到 `Vercel`
- 后端建议部署到 `Railway`
- 详细步骤见 [DEPLOY_VERCEL_RAILWAY.md](file:///Users/bytedance/Desktop/对话式AI/ConvoAI-Studio-Clean/DEPLOY_VERCEL_RAILWAY.md)
