# Vercel + Railway 部署指南

本文档对应当前仓库的推荐上线方式：

- `Vercel`：部署前端静态站点
- `Railway`：部署后端代理服务

## 一、部署思路

- 前端只负责渲染页面，并请求后端 `/api/chat`
- 后端持有 `ARK_API_KEY`，并转发请求到 Ark
- 这样可以避免在浏览器暴露真实密钥

## 二、先在本地确认

确保以下命令可正常运行：

```bash
npm install
npm run dev
npm run build
```

本地默认地址：

- 前端：`http://localhost:5173`
- 后端：`http://localhost:8787`

## 三、部署后端到 Railway

### 1. 新建服务

- 打开 Railway
- 选择 `New Project`
- 选择 `Deploy from GitHub repo`
- 选择当前仓库

### 2. Railway 启动配置

- Start Command:

```bash
npm run server
```

- 可选的 Build Command:

```bash
npm install
```

### 3. Railway 环境变量

至少配置以下变量：

```env
ARK_API_KEY=你的 Ark Key
ARK_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
ARK_MODEL=ep-20260520114334-xm6zh
ALLOWED_ORIGIN=https://你的-vercel-域名.vercel.app
```

说明：

- Railway 会自动注入运行端口，线上通常不需要手动设置 `PORT`
- `PORT=8787` 仅建议用于本地开发

如果你绑定了自定义前端域名，把 `ALLOWED_ORIGIN` 改成你的正式域名，例如：

```env
ALLOWED_ORIGIN=https://studio.example.com
```

### 4. 获取 Railway 域名

部署成功后，Railway 会给你一个公开域名，例如：

```text
https://convoai-api-production.up.railway.app
```

你后面需要把这个地址填到 Vercel 的 `VITE_API_BASE_URL`

## 四、部署前端到 Vercel

### 1. 新建项目

- 打开 Vercel
- 选择 `Add New Project`
- 导入当前 GitHub 仓库

### 2. Vercel 构建配置

- Framework Preset：`Vite`
- Build Command：

```bash
npm run build:client
```

- Output Directory：

```text
dist
```

### 3. Vercel 环境变量

添加：

```env
VITE_API_BASE_URL=https://你的-railway-域名/api
```

例如：

```env
VITE_API_BASE_URL=https://convoai-api-production.up.railway.app/api
```

### 4. 重新部署

设置完环境变量后，点击重新部署，让前端拿到新的 API 地址

## 五、上线后自检

部署完成后，建议按顺序检查：

1. 打开 Vercel 前端页面，确认首页可访问
2. 访问 Railway 的健康检查接口：

```text
https://你的-railway-域名/api/health
```

3. 检查返回结果中：
   - `ok` 为 `true`
   - `hasApiKey` 为 `true`
4. 在前端页面实际发送一条消息，确认能正常返回结果

## 六、推荐发布顺序

推荐按这个顺序发版：

1. 先部署 Railway
2. 拿到 Railway 域名
3. 再配置 Vercel 的 `VITE_API_BASE_URL`
4. 最后回到 Railway，把 `ALLOWED_ORIGIN` 改成正式前端域名

## 七、常见问题

### 1. 前端报跨域错误

检查 Railway 的：

```env
ALLOWED_ORIGIN=https://你的前端域名
```

如果前端和后端有多个域名，可以写成逗号分隔：

```env
ALLOWED_ORIGIN=https://a.vercel.app,https://studio.example.com
```

### 2. 页面显示接口失败

优先检查：

- Railway 服务是否启动成功
- `ARK_API_KEY` 是否有效
- `ARK_MODEL` 是否有权限访问
- `VITE_API_BASE_URL` 是否以 `/api` 结尾

### 3. Railway 健康检查正常，但页面请求失败

优先检查：

- Vercel 环境变量是否已经重新部署生效
- `ALLOWED_ORIGIN` 是否填写成了正确的前端域名
- 浏览器控制台里请求的 URL 是否指向 Railway

## 八、当前仓库对应命令

- 本地联调：`npm run dev`
- 前端构建：`npm run build:client`
- 后端启动：`npm run server`

## 九、推荐域名结构

- 前端：`https://studio.example.com`
- 后端：`https://api.example.com`

对应配置：

```env
# Railway
ALLOWED_ORIGIN=https://studio.example.com

# Vercel
VITE_API_BASE_URL=https://api.example.com/api
```
