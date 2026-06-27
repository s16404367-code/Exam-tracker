const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-User-Code',
};

export const onRequest = async ({ request, env }) => {
  if (request.method === 'OPTIONS')
    return new Response(null, { status: 204, headers: CORS });

  const code = (request.headers.get('X-User-Code') || '').trim().toUpperCase();
  if (!code || code.length < 4)
    return json({ error: 'Provide a sync code (min 4 chars)' }, 400);

  const key = `ca:${code}`;

  if (request.method === 'GET') {
    const raw = await env.TRACKER_KV.get(key);
    return json(raw ? JSON.parse(raw) : {});
  }

  if (request.method === 'POST') {
    const body = await request.text();
    try { JSON.parse(body); } catch {
      return json({ error: 'Invalid JSON' }, 400);
    }
    await env.TRACKER_KV.put(key, body, { expirationTtl: 60 * 60 * 24 * 365 }); // 1 year
    return json({ ok: true, savedAt: new Date().toISOString() });
  }

  return new Response('Method not allowed', { status: 405 });
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
