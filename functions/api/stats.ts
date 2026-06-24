// Cloudflare Pages Function: /api/stats
// 工具使用统计端点 - 演示边缘 KV 写入能力
// 需在 wrangler.toml 中绑定 KV namespace "TOOL_STATS" 后生效

interface StatsRequest {
  slug: string;
  action: 'view' | 'use';
}

export const onRequestPost: PagesFunction = async (context) => {
  const { request, env } = context;

  let body: StatsRequest;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!body.slug || !body.action) {
    return new Response(
      JSON.stringify({ error: 'Missing slug or action' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const key = `stats:${body.slug}:${body.action}`;
  const current = parseInt(
    (await env.TOOL_STATS?.get(key)) ?? '0',
    10
  );

  // KV 是最终一致性存储，适合非精确计数
  await env.TOOL_STATS?.put(key, String(current + 1));

  return new Response(
    JSON.stringify({ ok: true, count: current + 1 }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
};

// 处理 CORS 预检请求
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
};
