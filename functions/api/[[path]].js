// Cloudflare Pages Functions CORS 代理
// 路径: /api/* 会被代理到目标 API

export async function onRequest(context) {
  const { request, env } = context
  const url = new URL(request.url)

  // 从路径中提取目标路径
  // 例如: /api/v1/models -> /v1/models
  const targetPath = url.pathname.replace(/^\/api/, '')

  // 目标 API 地址 (你的 Claw Run API)
  const targetUrl = `https://enkitghgvkqs.ap-northeast-1.clawcloudrun.com${targetPath}${url.search}`

  // CORS 预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400',
      }
    })
  }

  // 构建代理请求
  const proxyRequest = new Request(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.arrayBuffer() : null
  })

  try {
    // 发送请求到目标 API
    const response = await fetch(proxyRequest)

    // 创建新的响应,添加 CORS 头
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: new Headers(response.headers)
    })

    // 添加 CORS 头
    newResponse.headers.set('Access-Control-Allow-Origin', '*')
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    newResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')

    return newResponse
  } catch (error) {
    return new Response(JSON.stringify({
      error: '代理请求失败',
      message: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
}
