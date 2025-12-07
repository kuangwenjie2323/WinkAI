import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  S3Client,
} from '@aws-sdk/client-s3'
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

function resolvePartSize(requestedSize) {
  const minSize = 5 * 1024 * 1024 // 5MB S3 minimum for multipart parts
  const defaultSize = 8 * 1024 * 1024
  const maxSize = 15 * 1024 * 1024
  if (!requestedSize || Number.isNaN(requestedSize)) return defaultSize
  return Math.max(minSize, Math.min(maxSize, requestedSize))
}

export async function onRequestPost({ request, env }) {
  try {
    const { client, bucket, publicUrl } = requireEnv(env)
    const body = await request.json()
    const {
      filename = 'file.bin',
      contentType = 'application/octet-stream',
      prefix = 'uploads',
      size,
      partSize: requestedPartSize,
    } = body || {}

    const key = buildKey(filename, prefix)
    const partSize = resolvePartSize(requestedPartSize)
    const totalParts = size ? Math.max(1, Math.ceil(size / partSize)) : 1

    const initCommand = new CreateMultipartUploadCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    })
    const initResult = await client.send(initCommand)
    const uploadId = initResult.UploadId

    const expiresIn = 3600
    const parts = []
    for (let partNumber = 1; partNumber <= totalParts; partNumber += 1) {
      const uploadCommand = new UploadPartCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
        PartNumber: partNumber,
      })
      const url = await getSignedUrl(client, uploadCommand, { expiresIn })
      parts.push({ partNumber, url, expiresIn })
    }

    const assetUrl = publicUrl ? `${publicUrl.replace(/\/$/, '')}/${key}` : `/api/file/${key}`

    return new Response(
      JSON.stringify({
        success: true,
        key,
        uploadId,
        partSize,
        totalParts,
        parts,
        assetUrl,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
