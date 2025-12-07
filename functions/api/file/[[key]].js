export async function onRequestGet(context) {
  const { params, env } = context;
  const key = params.key; // "folder/filename.ext" if passing full path? Cloudflare path params might separate by slashes

  // NOTE: If key contains slashes (e.g. "misc/123.png"), standard [key].js might only capture "misc".
  // A better approach for paths with slashes is [[path]].js or carefully encoding the key.
  // However, since we defined key as `prefix/timestamp-uuid.ext`, it contains a slash.
  // We should probably use a search param `?key=...` or handle the path carefully.
  // But let's try to assume the client requests `/api/file/folder/file.ext`.
  // In `functions/api/file/[...key].js` (catch all) would be better.
  
  // Since I am creating `[key].js` inside `functions/api/file/`, let's see how Cloudflare handles it.
  // If I create `functions/api/file/[[path]].js`, I can capture the full path.
  
  if (!env.WINKAI_BUCKET) {
    return new Response("R2 bucket not bound", { status: 500 });
  }

  // If using [[path]].js, path is an array
  let objectKey = key;
  if (Array.isArray(key)) {
    objectKey = key.join('/');
  }

  const object = await env.WINKAI_BUCKET.get(objectKey);

  if (object === null) {
    return new Response("Object Not Found", { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);

  return new Response(object.body, {
    headers,
  });
}
