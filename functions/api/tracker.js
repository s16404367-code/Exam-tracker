export async function onRequest(context) {
  const { Tracker_KV } = context.env;
  
  // Example: read a key
  const value = await Tracker_KV.get("my-key");
  
  // Example: write a key
  // await Tracker_KV.put("my-key", "some-value");
  
  return new Response(JSON.stringify({ value }), {
    headers: { "Content-Type": "application/json" }
  });
}
