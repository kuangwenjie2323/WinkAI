export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.WINKAI_BUCKET) {
    return new Response(JSON.stringify({ error: "R2 bucket 'WINKAI_BUCKET' not bound" }), { status: 500 });
  }

  try {
    const { base64, contentType = "image/png", prefix = "misc" } = await request.json();

    if (!base64) {
      return new Response(JSON.stringify({ error: "Missing base64 data" }), { status: 400 });
    }

    // 1. Decode Base64
    // Standardize: remove data:image/png;base64, prefix if present
    const base64Data = base64.replace(/^data:.*,/, '');
    
    // Convert base64 to ArrayBuffer
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }

    // 2. Generate R2 key
    const ext = contentType.split('/')[1] || 'bin';
    const key = `${prefix}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    // 3. Write to R2
    await env.WINKAI_BUCKET.put(key, bytes.buffer, {
      httpMetadata: { contentType },
    });

    // 4. Return key
    return new Response(JSON.stringify({ 
      success: true,
      key,
      url: `/api/file/${key}`
    }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
