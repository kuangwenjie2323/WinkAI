import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

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

function buildKey(filename = 'file', prefix = 'uploads') {
  const cleanPrefix = prefix.replace(/^\/|\/$/g, '') || 'uploads'
  const baseName = filename.replace(/\.[^/.]+$/, '').replace(/[^\w.-]/g, '-') || 'file'
  const ext = filename.includes('.') ? filename.split('.').pop() : ''
  const suffix = ext ? `.${ext}` : ''
  return `${cleanPrefix}/${Date.now()}-${crypto.randomUUID()}-${baseName}${suffix}`
}

export async function onRequestPost({ request, env }) {
  try {
    const { client, bucket, publicUrl } = requireEnv(env)
    const body = await request.json()
    const { filename = 'file.bin', contentType = 'application/octet-stream', prefix = 'uploads' } = body || {}

    const key = buildKey(filename, prefix)
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    })

    const expiresIn = 3600
    const url = await getSignedUrl(client, command, { expiresIn })
    const assetUrl = publicUrl ? `${publicUrl.replace(/\/$/, '')}/${key}` : `/api/file/${key}`

    return new Response(
      JSON.stringify({
        success: true,
        key,
        putUrl: url,
        headers: { 'Content-Type': contentType },
        expiresIn,
        assetUrl,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
