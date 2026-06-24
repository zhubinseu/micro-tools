# Micro-Tools 项目初始化参考文档

> **角色**: Expert Frontend Architect (Next.js/TypeScript)
> **场景**: micro-tools 聚合网站，Next.js 14+ 静态导出方案
> **主题**: dark-mode-first slate theme
> **结构**: `src/` 目录分层，核心系统布局与工具组件分离

---

## 1. 完整文件夹结构

```
micro-tools/
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   └── wasm/                    # WASM 模块静态资源
│       └── .gitkeep
│
├── src/
│   ├── app/                     # ── App Router 核心系统布局 ──
│   │   ├── layout.tsx           # 根布局（主题 Provider + 字体 + Header/Footer）
│   │   ├── page.tsx             # 首页（工具卡片网格）
│   │   ├── globals.css          # 全局样式（slate 主题 CSS 变量）
│   │   ├── not-found.tsx        # 404 页面
│   │   │
│   │   └── tools/
│   │       ├── page.tsx         # 工具列表页
│   │       └── [slug]/
│   │           └── page.tsx     # 动态路由（generateStaticParams 预渲染）
│   │
│   ├── components/
│   │   ├── shared/              # ── 跨工具共享的系统级组件 ──
│   │   │   ├── site-header.tsx  # 顶部导航栏
│   │   │   ├── site-footer.tsx  # 页脚
│   │   │   ├── theme-provider.tsx  # next-themes 主题 Provider
│   │   │   ├── theme-toggle.tsx    # 明暗切换按钮
│   │   │   ├── tool-shell.tsx      # 工具页面通用外壳
│   │   │   ├── workspace.tsx       # 统一工作区（分栏+工具栏+历史）
│   │   │   ├── workspace-panel.tsx # 工作区面板容器
│   │   │   ├── tool-loader.tsx     # next/dynamic 动态加载器
│   │   │   └── icon-resolver.tsx   # 字符串图标名 → lucide 组件
│   │   │
│   │   └── ui/                  # ── Shadcn UI 基础原语 ──
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── separator.tsx
│   │       ├── dropdown-menu.tsx
│   │       └── tooltip.tsx
│   │
│   ├── tools/                   # ── 工具组件（每个工具一个文件）──
│   │   ├── base64-codec.tsx     # Base64 编解码
│   │   ├── url-encoder.tsx      # URL 编解码
│   │   ├── word-counter.tsx     # 字数统计
│   │   ├── base-converter.tsx   # 进制转换
│   │   └── hash-generator.tsx   # 哈希生成器
│   │
│   ├── config/                  # ── 配置中心 ──
│   │   ├── registry.ts          # 工具注册表（ToolMeta[] 元数据中心）
│   │   └── site.ts              # 站点元数据（名称、描述、导航）
│   │
│   ├── hooks/                   # ── 自定义 Hooks ──
│   │   ├── use-tool-history.ts  # 每工具 localStorage 历史记录
│   │   ├── use-fullscreen.ts    # Fullscreen API 封装
│   │   └── use-hash-worker.ts   # Web Worker 哈希计算
│   │
│   ├── lib/                     # ── 工具函数库 ──
│   │   ├── utils.ts             # cn() 类名合并
│   │   ├── wasm.ts              # WASM 模块加载器
│   │   └── worker-types.ts      # Worker 共享类型
│   │
│   ├── store/                   # ── 状态管理（Zustand）──
│   │   ├── tool-store.ts        # 工具使用记录 + 收藏
│   │   └── index.ts
│   │
│   ├── workers/                 # ── Web Worker 脚本（tsc exclude）──
│   │   └── hash.worker.ts
│   │
│   └── types/                   # ── 全局类型定义 ──
│       └── index.ts
│
├── functions/                   # Cloudflare Pages Functions（边缘 API）
│   ├── _middleware.ts
│   └── api/
│       ├── health.ts
│       └── stats.ts
│
├── components.json              # Shadcn UI 配置
├── next.config.js               # Next.js 配置（output: 'export'）
├── tsconfig.json
├── tailwind.config.ts           # Tailwind + slate 主题
├── postcss.config.js
├── package.json
├── .eslintrc.json
├── .gitignore
├── .nvmrc
└── README.md
```

**分层原则**：
- `src/app/` → 核心系统布局（路由、页面骨架），不含业务逻辑
- `src/components/shared/` → 跨工具共享的系统级组件（导航、主题、工作区外壳）
- `src/components/ui/` → Shadcn UI 无样式原语（可被任何组件复用）
- `src/tools/` → 工具业务组件（每个工具独立，只负责交互逻辑）
- `src/config/` → 配置中心（注册表、站点元数据）
- `src/hooks/` → 可复用的自定义 Hooks
- `src/lib/` → 纯工具函数（无 React 依赖）
- `src/store/` → Zustand 状态管理

---

## 2. package.json

```json
{
  "name": "micro-tools",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "deploy": "next build && wrangler pages deploy out"
  },
  "dependencies": {
    "next": "^14.2.35",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "next-themes": "^0.3.0",
    "zustand": "^4.5.4",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-dropdown-menu": "^2.1.1",
    "@radix-ui/react-tooltip": "^1.1.2",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-label": "^2.1.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.4.0",
    "lucide-react": "^0.427.0"
  },
  "devDependencies": {
    "typescript": "^5.5.4",
    "@types/node": "^20.14.14",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "tailwindcss": "^3.4.7",
    "tailwindcss-animate": "^1.0.7",
    "postcss": "^8.4.40",
    "autoprefixer": "^10.4.19",
    "eslint": "^8.57.0",
    "eslint-config-next": "^14.2.35",
    "wrangler": "^3.70.0"
  },
  "engines": {
    "node": ">=18.18.0"
  }
}
```

**关键依赖说明**：
- `next@14.2.35`：最新安全补丁版本（14.2.5 有 XSS 漏洞）
- `next-themes`：dark-mode-first 主题切换核心库
- `zustand`：轻量状态管理，配合 persist 中间件持久化到 localStorage
- `@radix-ui/*`：Shadcn UI 底层无样式组件原语
- `wrangler`：Cloudflare Pages 部署 CLI

---

## 3. next.config.js

```javascript
/** @type {import('next').NextConfig} */

// Micro-Tools 采用纯静态导出方案
// - 静态资源部署到 Cloudflare Pages CDN
// - 重度计算（WASM / Web Workers）在客户端浏览器执行
// - 边缘动态能力（如统计）由 functions/ 目录的 Workers 处理
const nextConfig = {
  // 启用静态 HTML 导出，产物输出到 out/ 目录
  output: 'export',

  // 静态导出时关闭图片优化（Cloudflare Pages 不支持服务端优化）
  images: {
    unoptimized: true,
  },

  // 开发环境严格模式
  reactStrictMode: true,

  // 为静态导出页面生成 trailingSlash，便于 CDN 路由
  // /tools/base64 → /tools/base64/index.html
  trailingSlash: true,

  // Web Worker 与 WASM 加载：
  // - Worker：使用原生 `new Worker(new URL('../workers/xxx.worker.ts', import.meta.url))`
  //   Next.js 14 (webpack 5) 自动编译为独立 chunk，无需 worker-loader
  // - WASM：放置在 public/wasm/，通过 fetch + WebAssembly.instantiate 加载
  webpack: (config) => {
    // WASM 文件作为静态资源输出（仅当通过 import 引入时生效）
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/wasm/[name].[hash][ext]',
      },
    });
    return config;
  },
};

export default nextConfig;
```

---

## 4. tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "out", ".next", "src/workers", "functions"]
}
```

**注意**：`src/workers` 被排除在 tsc 检查外，因为 Web Worker 使用 `DedicatedWorkerGlobalScope` 全局类型，会与 DOM 类型冲突。共享类型提取到 `src/lib/worker-types.ts`。

---

## 5. tailwind.config.ts（dark-mode-first slate 主题）

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  // next-themes 通过 class 策略切换：在 <html> 上添加/移除 .dark 类
  darkMode: ['class'],

  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/tools/**/*.{ts,tsx}',
    './src/config/**/*.{ts,tsx}',
  ],

  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },

    extend: {
      fontFamily: {
        // 系统字体栈，避免构建时依赖 Google Fonts CDN
        sans: [
          'system-ui', '-apple-system', 'BlinkMacSystemFont',
          'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial',
          'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei',
          'sans-serif',
        ],
        mono: [
          'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco',
          'Consolas', 'Liberation Mono', 'Courier New', 'monospace',
        ],
      },

      // slate 主题色板（HSL 值，对应 globals.css 中的 CSS 变量）
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },

      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },

      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)', opacity: '0' },
          to: { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-down': {
          from: { transform: 'translateY(-8px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'scale-in': {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
      },

      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-in-right': 'slide-in-right 0.25s ease-out',
        'slide-in-down': 'slide-in-down 0.2s ease-out',
        'scale-in': 'scale-in 0.15s ease-out',
      },
    },
  },

  plugins: [require('tailwindcss-animate')],
};

export default config;
```

---

## 6. src/app/globals.css（dark-mode-first slate 主题）

**核心区别**：`:root` 定义的是**深色**变量（dark-mode-first），`.light` 类覆盖为浅色。这与传统 light-first 相反——默认渲染深色，用户主动切换才变浅。

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  /*
   * Dark-mode-first slate 主题
   * :root 默认就是深色模式（slate 950 系列背景）
   * .light 类显式切换到浅色模式
   *
   * 色板来源：Tailwind slate（HSL 215-222 系列）
   * 搭配 next-themes 的 class 策略：<html class="dark"> 为深色，<html class="light"> 为浅色
   */

  :root,
  .dark {
    /* 背景：slate-950 (#020817) → HSL(222.2, 84%, 4.9%) */
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;

    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;

    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;

    /* 主色：slate-50 作为深色背景上的高对比前景 */
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;

    /* 次要色：slate-800 */
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;

    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;

    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;

    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;

    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }

  /* 浅色模式：显式通过 .light 类启用 */
  .light {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;

    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;

    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;

    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;

    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;

    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
  }

  --radius: 0.5rem;
}

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    font-feature-settings: 'rlig' 1, 'calt' 1;
  }

  /* 自定义滚动条（深色模式优化） */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    @apply bg-transparent;
  }

  ::-webkit-scrollbar-thumb {
    @apply rounded-full bg-muted-foreground/30;
  }

  ::-webkit-scrollbar-thumb:hover {
    @apply bg-muted-foreground/50;
  }
}
```

---

## 7. src/components/shared/theme-provider.tsx

```tsx
'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>;

/**
 * 主题 Provider
 *
 * dark-mode-first 配置：
 *   - defaultTheme="dark"：首次访问默认深色
 *   - enableSystem={false}：不跟随系统偏好，强制以 dark 为默认
 *   - attribute="class"：在 <html> 上切换 .dark / .light 类
 *   - disableTransitionOnChange：切换时禁用过渡，避免闪烁
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
```

---

## 8. src/components/shared/theme-toggle.tsx

```tsx
'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * 明暗主题切换按钮
 * dark-mode-first：默认深色，点击切换到浅色
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // 避免 SSR 水合不匹配：挂载后才渲染图标
  React.useEffect(() => setMounted(true), []);

  const isDark = theme === 'dark';

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label={isDark ? '切换到浅色模式' : '切换到深色模式'}
            className="h-9 w-9"
          >
            {mounted ? (
              isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )
            ) : (
              <div className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {isDark ? '浅色模式' : '深色模式'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
```

---

## 9. src/app/layout.tsx（初始根布局）

```tsx
import type { Metadata, Viewport } from 'next';
import './globals.css';

import { ThemeProvider } from '@/components/shared/theme-provider';
import { SiteHeader } from '@/components/shared/site-header';
import { SiteFooter } from '@/components/shared/site-footer';
import { siteConfig } from '@/config/site';

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.author }],
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#020817' },
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider>
          <div className="relative flex min-h-screen flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**要点**：
- `<html lang="zh-CN" suppressHydrationWarning>`：`suppressHydrationWarning` 是 next-themes 必需的，避免主题类名注入导致的水合警告
- `ThemeProvider` 包裹整个应用，`defaultTheme="dark"` 实现 dark-mode-first
- `Viewport` 中 `themeColor` 配合深色模式，移动端浏览器地址栏适配
- 系统字体栈（非 `next/font/google`），避免构建时依赖 Google Fonts CDN

---

## 10. src/config/site.ts

```typescript
export const siteConfig = {
  name: 'Micro-Tools',
  description: '一组运行在浏览器边缘的微型在线工具集合，全部本地计算，数据不离开设备',
  url: 'https://micro-tools.example.com',
  author: 'Micro-Tools',
  keywords: [
    '在线工具', 'micro tools', 'base64', 'url encode',
    'hash', 'sha256', '字数统计', '进制转换',
  ],
  nav: [
    { title: '首页', href: '/' },
    { title: '所有工具', href: '/tools' },
  ],
} as const;

export type SiteConfig = typeof siteConfig;
```

---

## 11. src/config/registry.ts（工具注册表）

```typescript
import type { LucideIcon } from 'lucide-react';
import { Hash, Binary, ArrowLeftRight, Link2, Type } from 'lucide-react';

export type ToolRuntime = 'client' | 'edge';

export type ToolCategory =
  | 'crypto' | 'converter' | 'encoder' | 'formatter' | 'generator';

/**
 * 工具元数据接口
 * 每个字段都是可序列化纯数据，注册表不依赖任何 React 运行时
 */
export interface ToolMeta {
  id: string;              // URL slug
  name: string;            // 显示名称
  description: string;     // 一句话描述
  category: ToolCategory;
  keywords: string[];      // 搜索关键词
  icon: string;            // lucide-react 图标名（字符串，由 icon-resolver 解析）
  componentPath: string;   // 组件路径（文档参考）
  runtime: ToolRuntime;    // 'client' = 浏览器端，'edge' = Cloudflare Workers
}

export const TOOL_CATEGORIES: Record<ToolCategory, { label: string; description: string }> = {
  crypto: { label: '加密与哈希', description: '哈希计算、摘要生成等密码学相关工具' },
  converter: { label: '转换器', description: '单位、进制、时间等数值与格式转换' },
  encoder: { label: '编解码', description: 'Base64、URL、Hex 等编解码工具' },
  formatter: { label: '格式化', description: 'JSON、XML、SQL 等代码格式化工具' },
  generator: { label: '生成器', description: 'UUID、密码、Lorem 等内容生成工具' },
};

export const TOOL_REGISTRY: ToolMeta[] = [
  {
    id: 'base64-codec',
    name: 'Base64 编解码',
    description: '文本与 Base64 之间的双向编解码，支持 UTF-8',
    category: 'encoder',
    keywords: ['base64', 'encode', 'decode', '编码', '解码'],
    icon: 'Binary',
    componentPath: '@/tools/base64-codec',
    runtime: 'client',
  },
  {
    id: 'url-encoder',
    name: 'URL 编解码',
    description: 'URL 编码与解码，支持 encodeURIComponent / encodeURI 两种模式',
    category: 'encoder',
    keywords: ['url', 'uri', 'encode', 'decode', 'percent', '编码', '解码'],
    icon: 'Link2',
    componentPath: '@/tools/url-encoder',
    runtime: 'client',
  },
  {
    id: 'word-counter',
    name: '字数统计器',
    description: '实时统计字符数、单词数、行数、句子数及预计阅读时间',
    category: 'converter',
    keywords: ['word', 'count', 'character', '字数', '统计', '阅读时间'],
    icon: 'Type',
    componentPath: '@/tools/word-counter',
    runtime: 'client',
  },
];

export function getToolById(id: string): ToolMeta | undefined {
  return TOOL_REGISTRY.find((t) => t.id === id);
}

export function getAllTools(): ToolMeta[] {
  return TOOL_REGISTRY;
}

export function getToolsByCategory(): Record<ToolCategory, ToolMeta[]> {
  const grouped = {} as Record<ToolCategory, ToolMeta[]>;
  for (const key of Object.keys(TOOL_CATEGORIES) as ToolCategory[]) {
    grouped[key] = TOOL_REGISTRY.filter((t) => t.category === key);
  }
  return grouped;
}
```

---

## 12. src/components/shared/site-header.tsx

```tsx
import Link from 'next/link';
import { Wrench } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { siteConfig } from '@/config/site';

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-primary" />
          <span className="font-semibold">{siteConfig.name}</span>
        </Link>

        <nav className="flex items-center gap-1">
          {siteConfig.nav.map((item) => (
            <Button key={item.href} asChild variant="ghost" size="sm">
              <Link href={item.href}>{item.title}</Link>
            </Button>
          ))}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
```

---

## 13. src/app/page.tsx（首页）

```tsx
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { resolveIcon } from '@/components/shared/icon-resolver';
import { getAllTools } from '@/config/registry';
import { siteConfig } from '@/config/site';

export default function HomePage() {
  const tools = getAllTools();

  return (
    <div className="container py-16">
      {/* Hero */}
      <section className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          微型工具，<span className="text-primary">边缘运行</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          {siteConfig.description}
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/tools">
              浏览全部工具
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* 工具卡片网格 */}
      <section className="mt-20">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => {
            const Icon = resolveIcon(tool.icon);
            return (
              <Link key={tool.id} href={`/tools/${tool.id}`}>
                <Card className="h-full transition-all hover:border-primary/50 hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-base">{tool.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{tool.description}</CardDescription>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
```

---

## 14. components.json（Shadcn UI 配置）

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "shared": "@/components/shared",
    "tools": "@/tools",
    "config": "@/config",
    "hooks": "@/hooks",
    "lib": "@/lib"
  }
}
```

**注意**：`baseColor: "slate"` 确保 `npx shadcn@latest add` 新增组件时使用 slate 色板。

---

## 15. 与当前项目的差异对照

| 维度 | 当前项目 | 本参考文档 |
|------|---------|-----------|
| 目录结构 | 扁平（`app/`, `components/`） | `src/` 分层（`src/app/`, `src/components/shared/`, `src/tools/`） |
| 主题策略 | light-first（`:root` 浅色，`.dark` 深色） | **dark-mode-first**（`:root` 深色，`.light` 浅色） |
| 默认主题 | 跟随系统 | 强制深色（`defaultTheme="dark"`, `enableSystem={false}`） |
| 色板 | zinc（HSL 222） | **slate**（HSL 215-222，`components.json` baseColor） |
| 配置位置 | `lib/registry.ts` | `src/config/registry.ts` + `src/config/site.ts` |
| next.config | `.mjs` | `.js`（ESM 语法相同） |
| 主题切换 | DropdownMenu | `ThemeToggle` 按钮（更简洁） |

---

## 16. 迁移注意事项（若将来应用到现有项目）

1. **目录迁移**：移动 `app/` → `src/app/`，`components/` → `src/components/`，更新 `tsconfig.json` 的 `paths` 和所有 `@/` 导入路径
2. **主题切换**：修改 `globals.css`，将 `:root` 改为深色变量，浅色移到 `.light`；更新 `theme-provider.tsx` 的 `defaultTheme`
3. **next-themes 安装**：`npm install next-themes`
4. **Shadcn baseColor**：更新 `components.json` 的 `baseColor` 为 `slate`，后续新增组件自动使用 slate
5. **分组件迁移**：建议逐个工具迁移到 Workspace 架构，确保构建验证通过后再迁移下一个

---

*本文档为纯参考性质，未修改任何现有项目文件。*
