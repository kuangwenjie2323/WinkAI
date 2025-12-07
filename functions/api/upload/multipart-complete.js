import {
  CompleteMultipartUploadCommand,
  S3Client,
} from '@aws-sdk/client-s3'

function requireEnv(env) {
  const { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = env
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
    throw new Error('Missing R2 credentials or bucket (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET)')
  }
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  })
  return { client, bucket: R2_BUCKET, publicUrl: env.R2_PUBLIC_URL }
}

export async function onRequestPost({ request, env }) {
  try {
    const { client, bucket, publicUrl } = requireEnv(env)
    const body = await request.json()
    const { key, uploadId, parts } = body || {}

    if (!key || !uploadId || !Array.isArray(parts) || parts.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing key, uploadId, or parts' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const normalizedParts = parts.map((p) => ({
      PartNumber: p.partNumber,
      ETag: p.eTag || p.ETag,
    })).filter((p) => p.PartNumber && p.ETag)

    if (normalizedParts.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid parts provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const command = new CompleteMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: normalizedParts },
    })

    await client.send(command)
    const assetUrl = publicUrl ? `${publicUrl.replace(/\/$/, '')}/${key}` : `/api/file/${key}`

    return new Response(
      JSON.stringify({ success: true, key, assetUrl }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
