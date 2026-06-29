// functions/api/data.js
// MUST be at exactly: functions/api/data.js in your GitHub repo
// (the app calls /api/data — this file handles that URL)

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-User-Code',
};

export const onRequest = async (context) => {
  const { request, env } = context;

  // CORS preflight
  if (request.method === 'OPTIONS')
    return new Response(null, { status: 204, headers: CORS });

  // Works with BOTH binding names: "TRACKER_KV" or "Tracker_KV"
  const kv = env.TRACKER_KV || env.Tracker_KV;

  if (!kv) {
    return new Response(
      JSON.stringify({ error: 'KV not bound. Go to Cloudflare → Pages → your project → Settings → Functions → KV namespace bindings → add TRACKER_KV' }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  }

  const code = (request.headers.get('X-User-Code') || '').trim().toUpperCase();
  if (!code || code.length < 4)
    return new Response(JSON.stringify({ error: 'Provide sync code' }),
      { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });

  const key = `ca:${code}`;

  if (request.method === 'GET') {
    const raw = await kv.get(key);
    return new Response(raw || '{}',
      { headers: { ...CORS, 'Content-Type': 'application/json' } });
  }

  if (request.method === 'POST') {
    const body = await request.text();
    try { JSON.parse(body); } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }
    await kv.put(key, body);
    return new Response(JSON.stringify({ ok: true, at: new Date().toISOString() }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } });
  }

  return new Response('Method not allowed', { status: 405 });
};
