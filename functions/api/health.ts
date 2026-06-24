// Cloudflare Pages Function: /api/health
// 边缘健康检查端点，验证 Worker 运行状态与就近节点信息

export const onRequest: PagesFunction = async () => {
  return new Response(
    JSON.stringify({
      status: 'ok',
      service: 'micro-tools',
      timestamp: Date.now(),
      // cf 对象包含 Cloudflare 边缘节点信息（仅在生产环境可用）
      colo: (globalThis as any).cf?.colo ?? 'unknown',
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    }
  );
};
