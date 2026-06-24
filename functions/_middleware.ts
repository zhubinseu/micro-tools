// Cloudflare Pages Function: _middleware.ts
// 全局中间件：为所有 /api/* 请求统一注入 CORS 与日志

export const onRequest: PagesFunction = async (context) => {
  const { request, next } = context;
  const url = new URL(request.url);

  // 记录请求（生产环境可接入 Cloudflare Analytics）
  console.log(`[edge] ${request.method} ${url.pathname}`);

  // 对 /api/* 路径统一设置 CORS（具体方法级 CORS 由各端点补充）
  if (url.pathname.startsWith('/api/')) {
    const response = await next();
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    return response;
  }

  return next();
};
