export async function onRequestPost(context) {
  const { request, env } = context;
  
  if (!env.WINKAI_BUCKET) {
    return new Response(JSON.stringify({ error: "R2 bucket 'WINKAI_BUCKET' not bound" }), { status: 500 });
  }

  try {
    const { fileUrl, ext, prefix = "misc" } = await request.json();

    if (!fileUrl) {
      return new Response(JSON.stringify({ error: "Missing fileUrl" }), { status: 400 });
    }

    // 1. Fetch file from URL
    const res = await fetch(fileUrl);
    if (!res.ok) {
      return new Response(JSON.stringify({ error: "Download failed", status: res.status }), { status: 500 });
    }

    const contentType = res.headers.get("content-type") || "application/octet-stream";
    const buf = await res.arrayBuffer();

    // 2. Generate R2 key
    const safeExt = ext || guessExt(contentType) || "bin";
    const key = `${prefix}/${Date.now()}-${crypto.randomUUID()}.${safeExt}`;

    // 3. Write to R2
    await env.WINKAI_BUCKET.put(key, buf, {
      httpMetadata: { contentType },
    });

    // 4. Return key and relative URL (assuming we have a file server endpoint)
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

function guessExt(ct) {
  if (!ct) return null;
  if (ct.startsWith("image/")) return ct.split("/")[1];
  if (ct === "video/mp4") return "mp4";
  return null;
}
