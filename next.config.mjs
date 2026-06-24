/** @type {import('next').NextConfig} */

// Micro-Tools 采用纯静态导出方案，部署到 Cloudflare Pages
// 重度计算（WASM / Web Workers）在客户端浏览器执行
// 边缘动态能力（如短链、统计）由 functions/ 目录下的 Workers 处理
const nextConfig = {
  // 启用静态 HTML 导出，产物输出到 out/ 目录
  output: 'export',

  // 静态导出时关闭图片优化（Cloudflare Pages 不支持服务端优化）
  images: {
    unoptimized: true,
  },

  // 开发环境下便于排查问题
  reactStrictMode: true,

  // 为静态导出的页面生成 trailingSlash，便于 Cloudflare Pages 路由
  trailingSlash: true,

  // Web Worker 与 WASM 加载说明：
  // - Web Worker：使用原生 `new Worker(new URL('../workers/xxx.worker.ts', import.meta.url))` 语法，
  //   Next.js 14 (webpack 5) 会自动将其编译为独立 chunk，无需 worker-loader。
  // - WASM 文件：放置在 public/wasm/ 目录，通过 fetch + WebAssembly.instantiate 加载，
  //   无需 webpack 处理。如需 import wasm，可在下方按需添加 asset/resource 规则。
  webpack: (config) => {
    // WASM 文件处理：使用 asset/resource 直接输出原文件（仅当通过 import 引入时生效）
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
