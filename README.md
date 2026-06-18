# cstd-design — 私人中文创作工作台

`cstd-design` 是一个面向个人的中文 AI 创作工作台，提供智能对话、图片生成、视频生成和素材管理能力。所有数据私有存储，单密码访问。

**技术栈**：React 19 + TypeScript + Vite 前端 · Cloudflare Pages Functions 后端 · D1 数据库 · R2 媒体存储 · Agnes AI 推理 API

## 功能

### 🤖 智能对话
- 流式 SSE 聊天，120 秒超时保护
- 自动生成会话标题
- 对话分支：编辑历史消息重新发送、分支切换保留上下文
- 持久化消息线程：针对任意消息添加、编辑、删除跟进回复，D1 跨刷新保存
- 线程中心：集中查看活跃线程、最近回复并快速跳转到原消息
- 消息复制、重新生成、停止生成
- Markdown 渲染：GFM 表格、代码高亮 + 一键复制、KaTeX 公式、Mermaid 图表
- 消息时间戳（相对时间）
- 侧边栏会话搜索（200ms 防抖）+ Ctrl+K 快捷聚焦
- 会话列表直接删除（hover 出现删除按钮）
- 右侧信息面板可折叠
- 对话切换骨架屏加载

### 🖼️ 图片生成
- 文生图 / 图生图 / 多图参考合成
- 支持 `1024x1024`、`1024x768`、`768x1024` 三种尺寸
- 6 种风格预设：写实、动漫、油画、水彩、素描、无风格
- 最近生成结果内嵌预览 + 提交提示词回溯
- 上传参考图（拖拽支持），最多 4 张

### 🎬 视频生成
- 文生视频 / 图生视频 / 多图引导 / 关键帧模式
- 三种预设时长：约 5 秒 / 约 10 秒 / 约 18 秒
- 横版 `1152x768` / 竖版 `768x1152` 画幅
- FPS、负面提示词、种子种子高级选项
- 任务状态彩色徽章（排队/进行中/完成/失败）
- 3 秒轮询，连续 10 次失败自动停止
- 完成后内嵌视频预览

### 📁 素材库
- 上传（PNG/JPEG/WebP/MP4，内容自动检测）
- 多选 + Shift 范围选择 + 全选 + 批量删除
- 按类型筛选（全部/上传/图片/视频）
- 文件统计（数量 + 总大小）
- 预览弹窗（图片/视频）+ 错误 fallback
- Hover 高亮 + 微动效
- 素材删除确认弹窗 + 加载状态

### 🔐 安全
- 单密码 PBKDF2-SHA256 登录
- 1 年有效期 HttpOnly Secure Cookie 会话
- IP 指纹登录限流（指数退避）
- API 级别速率限制（聊天/图片/视频/上传/清空）
- 401 自动登出，无冗余 Toast
- 内容类型 Magic Bytes 检测

### 🌙 体验
- 浅色/深色主题（跟随系统 + 手动切换）
- 暗色模式首次加载无闪白（内联脚本）
- 移动端响应式布局：底部 Tab 图标导航、侧边栏抽屉滑入动画
- Toast 通知系统（成功/错误/信息，自动消失）
- 自定义确认弹窗替代浏览器原生 confirm
- 键盘快捷键：`Ctrl+K` 搜索会话
- 启动画面加载动画
- 100+ 轮产品级迭代打磨

## 技术栈

| 层 | 技术 |
|----|------|
| 前端框架 | React 19 |
| 构建工具 | Vite 8 + TypeScript 6 |
| 样式 | 纯 CSS（CSS 变量 + flexbox/grid）|
| 图标 | lucide-react |
| Markdown | react-markdown + rehype/rehype/remark |
| 图表 | Mermaid 11（按需加载）|
| 后端 | Cloudflare Pages Functions |
| 数据库 | D1（SQLite）|
| 存储 | R2 |
| AI API | Agnes AI（apihub.agnes-ai.com）|
| Schema | Zod 4 |
| 测试 | Vitest + Testing Library |
| CI/CD | GitHub Actions + Cloudflare Pages |

## 本地开发

### 前置条件

- Node.js 24+
- npm
- Cloudflare 账号（用于部署）

### 安装

```bash
npm ci
```

### 配置环境变量

```bash
cp .dev.vars.example .dev.vars
```

编辑 `.dev.vars`，填入所需密钥（参见下方环境变量说明）。

### 本地调试

```bash
# 构建前端
npm run build

# 本地 D1 迁移
npx wrangler d1 migrations apply cstd-design --local

# 启动本地 Pages 开发服务器
npm run pages:dev
```

### 运行测试

```bash
npm test                          # 单元测试
npm run lint                      # ESLint（0 警告通过）
npm run typecheck:functions       # Functions 类型检查
npm run build                     # 完整构建（tsc -b && vite build）
```

## 环境变量

| 变量 | 必须 | 说明 |
|------|------|------|
| `APP_PASSWORD_HASH` | ✅ | APP 密码 PBKDF2 哈希值 |
| `SESSION_SECRET` | ✅ | 会话签名密钥（随机字符串）|
| `LOGIN_HASH_SECRET` | ✅ | 登录限流指纹哈希密钥 |
| `ASSET_CAPABILITY_SECRET` | ✅ | 素材访问令牌签名密钥 |
| `UPSTREAM_API_KEY` | ✅ | Agnes AI API 密钥 |
| `AGNES_API_KEY` | ❌ | 旧别名，兼容 Fallback |

## Cloudflare 绑定

| 绑定 | 名称 | 说明 |
|------|------|------|
| D1 | `DB` | `cstd-design` 数据库 |
| R2 | `MEDIA_BUCKET` | `cstd-design-media` 存储桶 |
| Pages | — | `cstd-design` 项目 |
| 域名 | — | `design.custard.top` |

## 部署

推送 `main` 分支会自动触发 `.github/workflows/pages.yml`：

1. Gitleaks 密钥扫描
2. `npm ci` 安装依赖
3. `npm test` 单元测试
4. `npm run typecheck:functions` Functions 类型检查
5. `npm run lint` ESLint 检查
6. `npm run build` 生产构建
7. D1 远程迁移
8. Wrangler Pages 部署

GitHub Actions 需要配置仓库 secrets：

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Cloudflare Pages 项目本身需要配置上面的运行时 Secrets。

## 项目结构

```
├── src/                    # 前端源码
│   ├── App.tsx             # 根组件（认证、路由、布局）
│   ├── api.ts             # API 客户端（REST + SSE）
│   ├── app-state.ts       # 状态工具函数
│   ├── types.ts           # TypeScript 类型定义
│   ├── constants.ts       # 共享常量
│   └── components/        # UI 组件（25 个）
├── functions/              # Cloudflare Pages Functions
│   ├── api/               # API 端点（12 个文件）
│   └── _shared/           # 共享逻辑（10 个文件）
├── .github/workflows/     # CI/CD
└── dist/                  # 构建产物
```

## 贡献指南

本项目为个人项目，不开放外部贡献。如有问题请提交 Issue。
