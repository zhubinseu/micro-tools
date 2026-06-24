# Micro-Tools

> 一组运行在 Cloudflare 边缘的微型在线工具集合 —— 哈希、转换、编码、格式化，全部在浏览器本地完成。

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | **Next.js 14+ (App Router)** | `output: 'export'` 全静态导出 |
| 类型系统 | **TypeScript** | 严格模式 |
| 样式体系 | **Tailwind CSS + Shadcn UI** | 基于 Radix UI 的无样式组件库 |
| 状态管理 | **Zustand** | 轻量级，支持持久化 |
| 部署 | **Cloudflare Pages** | 全球 CDN 静态托管 |
| 边缘计算 | **Cloudflare Workers (Pages Functions)** | `functions/` 目录下的边缘 API |
| 重度计算 | **WebAssembly + Web Workers** | 客户端并行计算 |

## 项目结构

```
.
├── app/                        # Next.js App Router
│   ├── layout.tsx              # 根布局（字体、主题、Header/Footer）
│   ├── page.tsx                # 首页（工具卡片网格）
│   ├── globals.css             # 全局样式 + CSS 变量
│   ├── not-found.tsx           # 404 页面
│   └── tools/
│       ├── page.tsx            # 工具列表页（按分类展示）
│       ├── hash-generator/     # 哈希生成器（Web Worker 示例）
│       ├── base-converter/     # 进制转换器（纯客户端示例）
│       └── [slug]/             # 动态路由兜底（即将上线占位）
├── components/
│   ├── ui/                     # Shadcn UI 组件（Button, Card, Input...）
│   ├── site-header.tsx         # 站点头部（导航 + 主题切换）
│   ├── site-footer.tsx         # 站点底部
│   ├── theme-provider.tsx      # next-themes 主题提供者
│   └── tool-shell.tsx          # 工具页面通用外壳
├── functions/                  # Cloudflare Pages Functions（边缘 API）
│   ├── _middleware.ts          # 全局中间件（CORS + 日志）
│   └── api/
│       ├── health.ts           # /api/health 健康检查
│       └── stats.ts            # /api/stats 工具使用统计（KV）
├── hooks/
│   ├── use-hash-worker.ts      # 哈希计算 Worker Hook
│   └── index.ts
├── lib/
│   ├── utils.ts                # cn() 类名合并工具
│   ├── tools.ts                # 工具注册表（元数据中心）
│   └── wasm.ts                 # WASM 模块加载工具
├── store/                      # Zustand 状态管理
│   ├── tool-store.ts           # 最近使用 / 收藏（持久化）
│   ├── compute-store.ts        # 通用计算状态
│   └── index.ts
├── workers/                    # Web Worker 脚本
│   └── hash.worker.ts          # 哈希计算 Worker
├── wasm/                       # WASM 模块源码与产物
│   └── README.md               # WASM 开发指南
├── next.config.mjs             # Next.js 配置（静态导出 + Worker/WASM loader）
├── tailwind.config.ts          # Tailwind 配置（Shadcn 变量）
├── components.json             # Shadcn UI 配置
├── wrangler.toml               # Cloudflare Pages/Workers 配置
├── tsconfig.json               # TypeScript 配置
└── package.json
```

## 快速开始

### 环境要求

- Node.js >= 18.17
- npm >= 9

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev
# 访问 http://localhost:3000
```

### 构建静态产物

```bash
npm run build
# 产物输出到 out/ 目录
```

### 本地预览静态产物

```bash
npm run preview
```

### 预览边缘函数（含 Pages Functions）

```bash
npm run build
npx wrangler pages dev out --compatibility-date=2024-07-01
```

### 部署到 Cloudflare Pages

```bash
npm run build
npm run deploy
```

## 添加新工具

1. **在 `lib/tools.ts` 注册工具元数据**

   ```typescript
   {
     slug: 'my-tool',
     name: '我的工具',
     description: '工具描述',
     category: 'converter',
     icon: SomeIcon,
     available: true,
   }
   ```

2. **创建工具页面** `app/tools/my-tool/page.tsx`

3. 首页和工具列表页会自动渲染新工具

### 添加 Shadcn UI 组件

项目已预置 Button、Card、Input、Label、Separator、Dropdown-Menu。
如需更多组件，参考 [Shadcn UI 文档](https://ui.shadcn.com/) 手动添加到 `components/ui/`。

### 添加 Web Worker

1. 在 `workers/` 创建 `.worker.ts` 文件
2. 在 `hooks/` 创建对应的 Hook 封装
3. 使用 `new Worker(new URL('../workers/xxx.worker.ts', import.meta.url))` 实例化

### 添加 WASM 模块

参见 `wasm/README.md`。

## 核心设计原则

- **本地优先**：所有计算在浏览器完成，数据不上传
- **边缘加速**：静态资源由 Cloudflare 全球 CDN 分发
- **渐进增强**：Worker / WASM 不可用时回退到主线程
- **类型安全**：TypeScript 严格模式全覆盖
- **可扩展**：工具注册表驱动，新增工具零配置接入

## License

MIT
