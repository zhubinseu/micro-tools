/** @type {import('next').NextConfig} */

// Micro-Tools 采用纯静态导出方案，部署到 Cloudflare Pages
// - 静态资源由 Cloudflare Pages CDN 分发
// - 重度计算（WASM / Web Workers）在客户端浏览器执行
// - 边缘动态能力（短链、统计等）由 functions/ 目录的 Workers 处理
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

  // --------------------------------------------------------------------------
  // Webpack 配置：Web Worker + WebAssembly
  // --------------------------------------------------------------------------
  // 架构说明：
  //
  // Web Worker：
  //   使用原生 `new Worker(new URL('../workers/xxx.worker.ts', import.meta.url))` 语法，
  //   Next.js 14 (webpack 5) 自动将其编译为独立 chunk，无需 worker-loader。
  //   静态导出时，Worker chunk 输出到 _next/static/chunks/ 下，浏览器按需加载。
  //
  // WebAssembly 加载策略（双模式）：
  //
  //   模式 A — 异步 import（推荐，配合 experiments.asyncWebAssembly）：
  //     `import wasmModule from './xxx.wasm'` 会返回一个 Promise<Module>，
  //     webpack 自动处理为异步 chunk。适合在 Worker 内部导入 WASM。
  //
  //   模式 B — 运行时 fetch（兜底，适合 public/wasm/ 下的静态文件）：
  //     将 .wasm 放到 public/wasm/，通过 fetch + WebAssembly.instantiate 加载。
  //     无需 webpack 参与，由 lib/wasm.ts 封装。适合主线程或需动态 URL 的场景。
  //
  // 两种模式可以共存：Worker 内用 import，主线程用 fetch。
  webpack: (config, { isServer }) => {
    // ----------------------------------------------------------------------
    // 启用 WebAssembly 异步加载实验特性
    // 允许 `import wasmModule from './xxx.wasm'` 返回 Promise<WebAssembly.Module>
    // 在 Worker 内部使用时尤其方便：无需手动 fetch，webpack 自动分包
    // ----------------------------------------------------------------------
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      // layers: true, // 如需 monorepo 多层配置可启用
    };

    // ----------------------------------------------------------------------
    // WASM 文件规则（兜底：当不使用 import 而是作为静态资源引用时）
    // 将 .wasm 文件作为 asset/resource 输出到 static/wasm/ 目录
    // ----------------------------------------------------------------------
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/wasm/[name].[hash][ext]',
      },
    });

    // ----------------------------------------------------------------------
    // Web Worker 输出优化
    // 确保 Worker chunk 文件名稳定，便于 CDN 长缓存
    // ----------------------------------------------------------------------
    if (!isServer) {
      // 限制 Worker chunk 的拆分粒度，避免过小 chunk
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization?.splitChunks,
          chunks: 'all',
          // Worker 相关 chunk 单独分组（可选优化）
          cacheGroups: {
            ...config.optimization?.splitChunks?.cacheGroups,
            wasm: {
              test: /\.wasm$/,
              name: 'wasm',
              chunks: 'all',
              enforce: true,
            },
          },
        },
      };
    }

    return config;
  },
};

export default nextConfig;
