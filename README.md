# cstd-design

`cstd-design` 是个人使用的中文 AI 工作台，站点名称为“奶黄包”。前端使用 React + Vite，后端使用 Cloudflare Pages Functions，数据保存在 D1，媒体文件保存在私有 R2。

## 功能

- 单密码登录，一年有效期 HttpOnly Cookie。
- 咨询：流式聊天、会话搜索、自动标题、重命名、删除、停止、重新生成、编辑旧消息、分支切换、Markdown/GFM/表格/代码高亮/代码复制/KaTeX/Mermaid。
- 图片：文生图、图生图、多图参考合成，每次生成 1 张，支持 `1024x1024`、`1024x768`、`768x1024`。
- 视频：文生视频、图生视频、多图引导、关键帧、单任务轮询、横版/竖版画幅、FPS/负面提示词/种子高级选项。
- 素材库：上传、预览、下载、选择为参考图、永久删除。

## Cloudflare

项目使用以下绑定：

- D1：`cstd-design`，绑定名 `DB`
- R2：`cstd-design-media`，绑定名 `MEDIA_BUCKET`
- Pages：`cstd-design`
- 域名：`design.custard.top`

运行时 Secrets：

- `AGNES_API_KEY`
- `APP_PASSWORD_HASH`
- `SESSION_SECRET`
- `LOGIN_HASH_SECRET`
- `ASSET_CAPABILITY_SECRET`

## 本地开发

```bash
npm ci
npm test
npm run typecheck:functions
npm run lint
npm run build
```

本地 Pages Functions 调试：

```bash
npm run build
npx wrangler d1 migrations apply cstd-design --local
npm run pages:dev
```

复制 `.dev.vars.example` 为 `.dev.vars` 后填入本地 secret。不要提交 `.dev.vars` 或任何 API Key。

## 部署

推送 `main` 会触发 `.github/workflows/pages.yml`：

1. Secret scan
2. `npm ci`
3. 单元测试
4. Functions 类型检查
5. ESLint
6. Vite build
7. D1 migration
8. Wrangler Pages direct upload

GitHub Actions 需要仓库 secrets：

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Cloudflare Pages 项目本身需要上面的运行时 Secrets。
