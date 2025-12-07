import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { useStore } from '../store/useStore'
import googleAuthService from './googleAuth'

// 统一的 AI 服务类
class AIService {
  constructor() {
    this.clients = {}
    // 默认 endpoint
    this.defaultEndpoints = {
      openai: 'https://api.openai.com/v1',
      anthropic: 'https://api.anthropic.com',
      google: 'https://generativelanguage.googleapis.com/v1beta',
      vertex: 'https://us-central1-aiplatform.googleapis.com/v1beta',
      custom: ''
    }
  }

  normalizeProxyUrl(url) {
    if (!url) return ''
    return url.endsWith('/') ? url : `${url}/`
  }

  // 规范化 Endpoint，处理重复的 /v1 片段等
  normalizeEndpoint(provider, endpoint) {
    if (!endpoint) return endpoint

    let normalized = endpoint.trim()

    if (provider === 'anthropic') {
      normalized = normalized.replace(/\/+v1\/?$/, '')
    }

    return normalized.replace(/\/+$/, '')
  }

  // 获取 API Key（环境变量优先）
  getApiKey(provider) {
    // 环境变量优先
    const envKey = {
      openai: import.meta.env.VITE_OPENAI_API_KEY,
      anthropic: import.meta.env.VITE_ANTHROPIC_API_KEY,
      google: import.meta.env.VITE_GOOGLE_API_KEY,
      vertex: import.meta.env.VITE_VERTEX_API_KEY,
      custom: import.meta.env.VITE_CUSTOM_API_KEY
    }[provider]

    if (envKey) return envKey

    // 回退到 localStorage
    const { providers } = useStore.getState()
    return providers?.[provider]?.apiKey
  }

  // 获取 API Endpoint（环境变量优先）
  getApiEndpoint(provider) {
    // 环境变量优先
    const envEndpoint = {
      openai: import.meta.env.VITE_OPENAI_API_ENDPOINT,
      anthropic: import.meta.env.VITE_ANTHROPIC_API_ENDPOINT,
      google: import.meta.env.VITE_GOOGLE_API_ENDPOINT,
      vertex: import.meta.env.VITE_VERTEX_API_ENDPOINT,
      custom: import.meta.env.VITE_CUSTOM_API_ENDPOINT
    }[provider]

    if (envEndpoint) return this.normalizeEndpoint(provider, envEndpoint)

    // 回退到用户配置
    const { providers } = useStore.getState()
    const storedEndpoint = providers?.[provider]?.baseURL

    return this.normalizeEndpoint(provider, storedEndpoint || this.defaultEndpoints[provider])
  }

  // 获取 Vertex 配置
  getVertexConfig() {
    const { providers } = useStore.getState()
    const vertexConfig = providers?.vertex || {}
    
    return {
      // 优先使用用户在设置面板配置的值，其次才是环境变量
      projectId: vertexConfig.projectId || import.meta.env.VITE_VERTEX_PROJECT_ID,
      location: vertexConfig.location || import.meta.env.VITE_VERTEX_LOCATION || 'us-central1'
    }
  }

  // 初始化客户端
  initClient(provider, config = {}) {
    const resolvedApiKey = this.getApiKey(provider) || config.apiKey
    const resolvedBaseURL = this.normalizeEndpoint(
      provider,
      this.getApiEndpoint(provider) || config.baseURL || config.endpoint
    )

    if (!resolvedApiKey) {
      throw new Error(`${provider} API Key 未设置`)
    }

    switch (provider) {
      case 'openai':
        this.clients.openai = new OpenAI({
          apiKey: resolvedApiKey,
          baseURL: resolvedBaseURL,
          dangerouslyAllowBrowser: true
        })
        break

      case 'anthropic':
        this.clients.anthropic = new Anthropic({
          apiKey: resolvedApiKey,
          baseURL: resolvedBaseURL,
          dangerouslyAllowBrowser: true
        })
        break

      case 'google':
        this.clients.google = new GoogleGenerativeAI(resolvedApiKey)
        break

      case 'vertex':
        // Vertex 使用 REST，暂不创建 SDK 客户端
        this.clients.vertex = { baseURL: resolvedBaseURL }
        break

      case 'custom':
        // 自定义 API 使用 fetch
        break

      default:
        throw new Error(`不支持的提供商: ${provider}`)
    }
  }

  // 解析 Data URL
  extractBase64(dataUrl) {
    if (!dataUrl) return null
    const matches = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/)
    if (!matches || matches.length !== 3) {
      return null
    }
    return {
      mimeType: matches[1],
      data: matches[2]
    }
  }

  // OpenAI 流式聊天
  async *streamChatOpenAI(messages, model, options = {}) {
    const client = this.clients.openai
    if (!client) throw new Error('OpenAI 客户端未初始化')

    try {
      const formattedMessages = messages.map(msg => {
        // 如果有图片，构造多模态 content
        if (msg.images && msg.images.length > 0) {
          return {
            role: msg.role,
            content: [
              { type: 'text', text: msg.content },
              ...msg.images.map(imgUrl => ({
                type: 'image_url',
                image_url: {
                  url: imgUrl, // OpenAI 直接支持 Data URL
                  detail: 'auto'
                }
              }))
            ]
          }
        }
        // 纯文本消息
        return {
          role: msg.role,
          content: msg.content
        }
      })

      const stream = await client.chat.completions.create({
        model,
        messages: formattedMessages,
        stream: true,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 4096
      })

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content
        if (content) {
          yield { type: 'content', content }
        }

        if (chunk.choices[0]?.finish_reason) {
          yield { type: 'done', reason: chunk.choices[0].finish_reason }
        }
      }
    } catch (error) {
      console.error('OpenAI 流式调用错误:', error)
      throw error
    }
  }

  // Anthropic 流式聊天
  async *streamChatAnthropic(messages, model, options = {}) {
    const client = this.clients.anthropic
    if (!client) throw new Error('Anthropic 客户端未初始化')

    try {
      // 分离系统消息和用户消息
      const systemMessage = messages.find(m => m.role === 'system')
      const chatMessages = messages.filter(m => m.role !== 'system')

      const formattedMessages = chatMessages.map(msg => {
        // 映射角色
        const role = msg.role === 'assistant' ? 'assistant' : 'user'

        // 如果有图片，构造多模态 content
        if (msg.images && msg.images.length > 0) {
          const imageBlocks = msg.images.map(imgUrl => {
            const extracted = this.extractBase64(imgUrl)
            if (!extracted) return null
            return {
              type: 'image',
              source: {
                type: 'base64',
                media_type: extracted.mimeType,
                data: extracted.data
              }
            }
          }).filter(Boolean)

          return {
            role,
            content: [
              ...imageBlocks, // 图片放在前面通常效果更好
              { type: 'text', text: msg.content }
            ]
          }
        }

        // 纯文本
        return {
          role,
          content: msg.content
        }
      })

      const stream = await client.messages.stream({
        model,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7,
        system: systemMessage?.content || undefined,
        messages: formattedMessages
      })

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
          yield { type: 'content', content: event.delta.text }
        }

        if (event.type === 'message_stop') {
          yield { type: 'done', reason: 'stop' }
        }
      }
    } catch (error) {
      console.error('Anthropic 流式调用错误:', error)
      throw error
    }
  }

  // Google Gemini 流式聊天
  async *streamChatGoogle(messages, model, options = {}) {
    const client = this.clients.google
    if (!client) throw new Error('Google 客户端未初始化')

    try {
      const temperature = options.temperature || 0.7
      const maxOutputTokens = options.maxTokens || 4096
      const lastMessage = messages[messages.length - 1]
      const prompt = lastMessage?.content || ''

                // 图片/视频生成模式判断
            // Google AI Studio 支持：Imagen 4、Veo 3、Nano Banana Pro、Gemini Flash Image 等
            const isImagenModel = model.toLowerCase().includes('imagen')
            const isVeoModel = model.toLowerCase().includes('veo')
            const isNanoBanana = model.toLowerCase().includes('nano') || model.includes('gemini-3-pro-image')
            // Gemini 图片生成模型：包含 'image' 或 'flash'
            const isGeminiImageModel = model.includes('gemini') && (model.includes('flash') || model.includes('image'))
      
            if (options.mode === 'image' || options.mode === 'video' || isImagenModel || isVeoModel || isNanoBanana || (options.imageParams && isGeminiImageModel)) {
      
              // Imagen/Veo 使用 predict API (Google AI Studio 也支持)
              if (isImagenModel || isVeoModel) {
                try {
                  const apiKey = this.getApiKey('google')
                  const baseUrl = this.getApiEndpoint('google') || 'https://generativelanguage.googleapis.com/v1beta'
                  
                  // 准备参数
                  const imageParams = options.imageParams || {}
                  const videoParams = options.videoParams || {}
                  
                  // 构建 payload
                  const instance = { prompt }
                  // 支持参考图 (仅视频模式)
                  if (isVeoModel && videoParams.referenceImage) {
                    // Veo API 要求 image 同时包含 bytesBase64Encoded 和 mimeType
                    instance.image = {
                      bytesBase64Encoded: videoParams.referenceImage,
                      mimeType: videoParams.referenceMimeType || 'image/png'
                    }
                  }
      
                  const parameters = {
                    sampleCount: 1
                  }
      
                  // 添加特定参数
                  if (isImagenModel) {
                    parameters.aspectRatio = imageParams.aspectRatio || '1:1'
                  }
                  if (isVeoModel) {
                    parameters.aspectRatio = videoParams.aspectRatio || '16:9'
                    // Veo 3/3.1 只支持 4、6、8 秒，默认 8 秒
                    const validDurations = [4, 6, 8]
                    const requestedDuration = parseInt(videoParams.duration, 10)
                    parameters.durationSeconds = validDurations.includes(requestedDuration) ? requestedDuration : 8
                    if (videoParams.withAudio) {
                      parameters.includeAudio = true
                    }
                    if (videoParams.negativePrompt) {
                      parameters.negativePrompt = videoParams.negativePrompt
                    }
                    console.log('[Google Gen] Veo parameters:', parameters)
                  }
                  
                              // Veo 使用 predictLongRunning，Imagen 使用 predict
                              const method = isVeoModel ? 'predictLongRunning' : 'predict'
                              const endpoint = `${baseUrl}/models/${model}:${method}`
                              console.log(`[Google Gen] Endpoint: ${endpoint}`)
                              
                              const response = await fetch(
                                `${endpoint}?key=${apiKey}`,
                                {
                                  method: 'POST',
                                  headers: { 
                                    'Content-Type': 'application/json',
                                    'x-goog-api-key': apiKey
                                  },
                                  body: JSON.stringify({
                                    instances: [instance],
                                    parameters
                                  })
                                }
                              )
                  
                                          if (!response.ok) {
                                            const errorText = await response.text()
                                            console.error(`[Google Gen] API Error: ${response.status}`, errorText)
                                            
                                            let additionalInfo = ''
                                            if (response.status === 404) {
                                               try {
                                                 // 尝试获取可用模型列表进行诊断
                                                 const modelsResp = await fetch(`${baseUrl}/models?key=${apiKey}`)
                                                 if (modelsResp.ok) {
                                                   const modelsData = await modelsResp.json()
                                                   const availableModels = modelsData.models?.map(m => m.name.replace('models/', '')) || []
                                                   const veoModels = availableModels.filter(m => m.includes('veo') || m.includes('imagen'))
                                                   
                                                   if (availableModels.includes(model)) {
                                                     additionalInfo = `\n\n诊断: 模型 '${model}' 存在于您的可用列表中，但 Endpoint 返回 404。这通常意味着：\n1. 请求的 URL 方法 (${method}) 不正确。\n2. 您使用的代理/VPN 不支持此路径。\n3. 该模型暂时不可用。`
                                                   } else {
                                                     additionalInfo = `\n\n诊断: 模型 '${model}' 未在您的可用模型列表中找到。\n您的账户可用视频/图片模型: ${veoModels.join(', ') || '无'}`
                                                   }
                                                 }
                                               } catch (e) {
                                                 console.warn('诊断模型列表失败', e)
                                               }
                                            }
                              
                                            throw new Error(`API 错误 ${response.status}: ${errorText}${additionalInfo}`)
                                          }                  
                              let data = await response.json()
                  
                              // 如果是 LongRunning 操作，需要轮询
                              if (isVeoModel && data.name && !data.done) {
                                 yield { type: 'content', content: '⏳ 任务已提交，正在生成视频 (预计 1-2 分钟)...\n' }
                                 
                                 const operationName = data.name
                                 // Operation name 通常是 "models/veo.../operations/..."
                                 // 确保 baseUrl 结尾没有斜杠，operationName 开头没有斜杠
                                 const cleanBaseUrl = baseUrl.replace(/\/+$/, '')
                                 const cleanOpName = operationName.replace(/^\/+/, '')
                                 
                                 // 如果 operationName 已经是完整 URL (虽然少见)，直接用
                                 // 否则拼接。注意: 有些情况下 operationName 包含 "v1beta/" 前缀，需留意
                                 // 安全起见，直接使用 name 拼接到 v1beta 后
                                 // 假设 baseUrl 是 https://generativelanguage.googleapis.com/v1beta
                                 const operationUrl = `${cleanBaseUrl}/${cleanOpName}?key=${apiKey}`
                                 
                                 console.log(`[Google Gen] Polling Operation: ${operationUrl}`)
                  
                                 // 轮询逻辑
                                 while (true) {
                                   await new Promise(resolve => setTimeout(resolve, 5000)) // 每 5 秒轮询一次
                                   
                                   const opRes = await fetch(operationUrl, {
                                      headers: { 'x-goog-api-key': apiKey }
                                   })
                                   
                                   if (!opRes.ok) {
                                     const errText = await opRes.text()
                                     throw new Error(`轮询失败 ${opRes.status}: ${errText}`)
                                   }
                                   
                                   data = await opRes.json()
                                   
                                   if (data.done) {
                                     if (data.error) {
                                       throw new Error(`生成失败: ${data.error.message || JSON.stringify(data.error)}`)
                                     }
                                     // 任务完成，data.response 包含结果
                                     if (data.response) {
                                        // data.response 可能是 Any 类型，如果是 JSON 对象则直接使用
                                        // 某些 client 库会自动解包 @type，但在 REST API 中通常直接返回结构
                                        data = data.response
                                     }
                                     break
                                   }
                                 }
                              }

                  // 解析返回数据 - 支持多种格式
                  let videoUrl = null
                  let imageData = null

                  // 格式1: Gemini API Veo 格式 - generateVideoResponse.generatedSamples[0].video.uri
                  if (data.generateVideoResponse?.generatedSamples?.[0]?.video?.uri) {
                    videoUrl = data.generateVideoResponse.generatedSamples[0].video.uri
                    console.log('[Google Gen] 检测到 Gemini API Veo 格式')
                  }
                  // 格式2: Vertex AI 格式 - predictions[0].xxx
                  else if (data.predictions && data.predictions.length > 0) {
                    const prediction = data.predictions[0]

                    if (prediction.bytesBase64Encoded) {
                      imageData = prediction.bytesBase64Encoded
                    } else if (prediction.videoUri) {
                      videoUrl = prediction.videoUri
                    } else if (prediction.assets?.video?.uri) {
                      videoUrl = prediction.assets.video.uri
                    }
                    console.log('[Google Gen] 检测到 Vertex AI 格式')
                  }

                  // 渲染结果
                  if (videoUrl) {
                    // 视频 URL 可能需要认证访问，添加 API key
                    const downloadUrl = videoUrl.includes('?')
                      ? `${videoUrl}&key=${apiKey}`
                      : `${videoUrl}?key=${apiKey}`
                    yield { type: 'content', content: `✅ 视频生成完成！\n\n<video controls src="${downloadUrl}" width="100%"></video>\n\n[下载视频](${downloadUrl})` }
                  } else if (imageData) {
                    const mimeType = isVeoModel ? 'video/mp4' : 'image/png'
                    const url = `data:${mimeType};base64,${imageData}`
                    const markdown = isVeoModel
                      ? `<video controls src="${url}" width="100%"></video>`
                      : `![生成的图片](${url})`
                    yield { type: 'content', content: markdown }
                  } else {
                    console.log('[Google Gen] 未识别的返回结构:', JSON.stringify(data, null, 2))
                    yield { type: 'content', content: `生成完成但未识别返回格式。原始数据:\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`` }
                  }
      
                  yield { type: 'done', reason: 'stop' }
                  return
                } catch (err) {
                  console.error('生成错误:', err)
                  yield { type: 'content', content: `生成失败: ${err.message}\n\n**排查建议:**\n1. 检查 Base URL 是否配置正确 (当前: ${this.getApiEndpoint('google')})\n2. Veo/Imagen 模型在 AI Studio (API Key) 上可能受限或需申请白名单。\n3. 尝试切换到 **Google Vertex AI** 提供商 (需配置 GCP 项目和 OAuth)。` }
                  yield { type: 'done', reason: 'stop' }
                  return
                }
              }        
                // Nano Banana Pro 和 Gemini 图片生成模型使用 generateContent API
                if (isNanoBanana || isGeminiImageModel) {
                  try {
                    const apiKey = this.getApiKey('google')
                    const baseUrl = this.getApiEndpoint('google') || 'https://generativelanguage.googleapis.com/v1beta'
                    const imageParams = options.imageParams || {}
        
                    // 构建 generationConfig，包含 imageConfig
                    const generationConfig = {
                      responseModalities: ['TEXT', 'IMAGE'],
                      // imageConfig 用于控制图片生成参数
                      imageConfig: {
                        aspectRatio: imageParams.aspectRatio || '1:1',
                        imageSize: imageParams.resolution || '1K'  // 支持 1K, 2K, 4K
                      }
                    }
        
                    const endpoint = `${baseUrl}/models/${model}:generateContent`
        
                    const response = await fetch(
                      `${endpoint}?key=${apiKey}`,
                      {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          contents: [{ parts: [{ text: prompt }] }],
                          generationConfig
                        })
                      }
                    )
            if (!response.ok) {
              const errorText = await response.text()
              throw new Error(`API 错误 ${response.status}: ${errorText}`)
            }

            const data = await response.json()
            const parts = data.candidates?.[0]?.content?.parts || []
            let hasImage = false
            for (const part of parts) {
              if (part.inlineData?.data) {
                const mimeType = part.inlineData.mimeType || 'image/png'
                const imageUrl = `data:${mimeType};base64,${part.inlineData.data}`
                yield { type: 'content', content: `![生成的图片](${imageUrl})\n\n` }
                hasImage = true
              } else if (part.text) {
                yield { type: 'content', content: part.text }
              }
            }
            if (!hasImage && parts.length === 0) {
              yield { type: 'content', content: '图片生成失败，请重试' }
            }
            yield { type: 'done', reason: 'stop' }
            return
          } catch (imgError) {
            console.error('Gemini 图片生成错误:', imgError)
            yield { type: 'content', content: `图片生成失败: ${imgError.message}` }
            yield { type: 'done', reason: 'stop' }
            return
          }
        }

        yield { type: 'content', content: `⚠️ 当前模型 \`${model}\` 不支持图片生成。` }
        yield { type: 'done', reason: 'stop' }
        return
      }

      const genModel = client.getGenerativeModel({ model })

      // 构建多模态历史
      const history = messages.slice(0, -1).map(msg => {
        const parts = [{ text: msg.content }]
        if (msg.images && msg.images.length > 0) {
          msg.images.forEach(imgUrl => {
            const extracted = this.extractBase64(imgUrl)
            if (extracted) {
              parts.push({
                inlineData: {
                  mimeType: extracted.mimeType,
                  data: extracted.data
                }
              })
            }
          })
        }
        return {
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts
        }
      })

      const chat = genModel.startChat({
        history,
        generationConfig: {
          temperature,
          maxOutputTokens
        }
      })

      // 构建当前多模态消息
      let currentParts = [{ text: prompt }]
      if (lastMessage.images && lastMessage.images.length > 0) {
        lastMessage.images.forEach(imgUrl => {
          const extracted = this.extractBase64(imgUrl)
          if (extracted) {
            currentParts.push({
              inlineData: {
                mimeType: extracted.mimeType,
                data: extracted.data
              }
            })
          }
        })
      }

      const result = await chat.sendMessageStream(currentParts)

      for await (const chunk of result.stream) {
        const text = chunk.text()
        if (text) {
          yield { type: 'content', content: text }
        }
      }

      yield { type: 'done', reason: 'stop' }
    } catch (error) {
      console.error('Google 流式调用错误:', error)
      throw error
    }
  }

  // 自定义 API 流式聊天
  async *streamChatCustom(messages, model, config, options = {}) {
    const { baseURL, apiKey, corsProxyUrl } = config

    if (!baseURL) {
      throw new Error('自定义 API 地址未设置')
    }

    // 应用 CORS 代理（保持协议，防止缺少斜杠）
    const normalizedBase = this.normalizeEndpoint('custom', baseURL)
    const actualEndpoint = corsProxyUrl
      ? `${this.normalizeProxyUrl(corsProxyUrl)}${normalizedBase}`
      : normalizedBase

    try {
      const response = await fetch(`${actualEndpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': apiKey ? `Bearer ${apiKey}` : ''
        },
        body: JSON.stringify({
          model,
          messages,
          stream: true,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 4096
        })
      })

      if (!response.ok) {
        throw new Error(`自定义 API 调用失败: ${response.statusText}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim() !== '')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              yield { type: 'done', reason: 'stop' }
              return
            }

            try {
              const json = JSON.parse(data)
              const content = json.choices?.[0]?.delta?.content
              if (content) {
                yield { type: 'content', content }
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } catch (error) {
      console.error('自定义 API 流式调用错误:', error)
      throw error
    }
  }

  /**
   * 测试 API 连接
   * @param {string} provider - 'openai' | 'anthropic' | 'google' | 'custom'
   * @param {Object} config - { apiKey, endpoint, apiType }
   * @returns {Promise<Object>} { success, provider, responseTime, models, message, error }
   */
  async testConnection(provider, config = {}) {
    const mergedConfig = {
      ...config,
      apiKey: this.getApiKey(provider) || config.apiKey,
      endpoint: this.normalizeEndpoint(
        provider,
        config.endpoint || config.baseURL || this.getApiEndpoint(provider)
      )
    }
    const startTime = Date.now()

    try {
      let result

      switch (provider) {
        case 'openai':
          result = await this._testOpenAI(mergedConfig)
          break
        case 'anthropic':
          result = await this._testAnthropic(mergedConfig)
          break
        case 'google':
          result = await this._testGoogle(mergedConfig)
          break
        case 'vertex':
          result = await this._testVertex(mergedConfig)
          break
        case 'custom':
          result = await this._testCustom(mergedConfig)
          break
        default:
          throw new Error(`未知的提供商: ${provider}`)
      }

      return {
        success: true,
        provider,
        responseTime: Date.now() - startTime,
        ...result
      }
    } catch (error) {
      return {
        success: false,
        provider,
        responseTime: Date.now() - startTime,
        error: error.message,
        models: []
      }
    }
  }

  async _testOpenAI(config) {
    const endpoint = config.endpoint || 'https://api.openai.com/v1'
    const apiKey = config.apiKey

    if (!apiKey) throw new Error('请提供 OpenAI API Key')

    // 获取模型列表
    const modelsResponse = await fetch(`${endpoint}/models`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    })

    if (!modelsResponse.ok) {
      const error = await modelsResponse.text()
      throw new Error(`API 错误: ${modelsResponse.status} - ${error}`)
    }

    const modelsData = await modelsResponse.json()
    const models = modelsData.data
      .map(m => ({ id: m.id, name: m.id, created: m.created }))
      .sort((a, b) => b.created - a.created)

    // 测试简单调用
    const testResponse = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 5
      })
    })

    if (!testResponse.ok) throw new Error('API 调用测试失败')

    return {
      models,
      message: `成功获取 ${models.length} 个模型`
    }
  }

  async _testAnthropic(config) {
    const endpoint = config.endpoint || 'https://api.anthropic.com'
    const apiKey = config.apiKey

    if (!apiKey) throw new Error('请提供 Anthropic API Key')

    // Anthropic 没有公开的模型列表 API
    const models = [
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' }
    ]

    // 测试调用
    const testResponse = await fetch(`${endpoint}/v1/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }]
      })
    })

    if (!testResponse.ok) {
      const error = await testResponse.text()
      throw new Error(`API 错误: ${testResponse.status} - ${error}`)
    }

    return {
      models,
      message: `连接成功，可用 ${models.length} 个模型`
    }
  }

  async _testGoogle(config) {
    const apiKey = config.apiKey

    if (!apiKey) throw new Error('请提供 Google API Key')

    // 获取模型列表（尊重配置的 baseURL，默认使用 v1beta）
    const base = (config.endpoint || this.defaultEndpoints.google || '').replace(/\/+$/, '')
    const modelsEndpoint = `${base}/models?key=${apiKey}`
    const modelsResponse = await fetch(modelsEndpoint)

    if (!modelsResponse.ok) {
      const errorText = await modelsResponse.text()
      let errorMessage = `API 错误: ${modelsResponse.status}`

      try {
        const errorJson = JSON.parse(errorText)
        // 特殊处理地区限制错误
        if (errorJson.error?.message?.includes('User location is not supported')) {
          errorMessage = '该 API Key 在当前地区不可用,请尝试使用 VPN 或更换地区'
        } else {
          errorMessage += ` - ${errorJson.error?.message || errorText}`
        }
      } catch {
        errorMessage += ` - ${errorText}`
      }

      throw new Error(errorMessage)
    }

    const modelsData = await modelsResponse.json()
    const models = modelsData.models
      // 不进行任何过滤，保留所有可用模型
      .map(m => {
        // 模型 ID：去掉 'models/' 前缀
        const modelId = m.name.replace('models/', '')
        // 优先使用 API 返回的友好名称 (displayName)，如果没有则使用 ID
        const displayName = m.displayName || modelId
        return {
          id: modelId,
          name: displayName
        }
      })
      .sort((a, b) => {
        // 定义优先级权重（越小越靠前）
        const getPriority = (id) => {
          if (id === 'gemini-3-pro-preview') return 0 // 绝对置顶
          
          if (id.includes('veo')) return 2 // 视频模型也很重要
          
          // 降级特定类型模型
          if (id.includes('embedding') || id.includes('robotics') || id.includes('tts')) return 90
          
          // Gemini 3 系列
          if (id.includes('gemini-3') && !id.includes('image')) return 10
          
          // Gemini 2.5 系列
          if (id.includes('gemini-2.5-pro')) return 20
          if (id.includes('gemini-2.5-flash')) return 21
          if (id.includes('gemini-2.5')) return 22

          // 图片专用模型 (Nano Banana 等)
          if (id.includes('image') || id.includes('imagen')) return 80 
          
          return 100 // 其他
        }
        
        const priorityA = getPriority(a.id)
        const priorityB = getPriority(b.id)
        
        if (priorityA !== priorityB) {
          return priorityA - priorityB
        }
        
        return b.id.localeCompare(a.id)
      })

    // 强制添加 gemini-3-pro-preview (如果 API 没返回，但我们确信它可用或想尝试)
    const topModelId = 'gemini-3-pro-preview'
    if (!models.some(m => m.id === topModelId)) {
      models.unshift({
        id: topModelId,
        name: topModelId
      })
    }

    return {
      models,
      message: `成功获取 ${models.length} 个模型`
    }
  }

  // 辅助方法：解析 Google API 错误
  _mapGoogleError(status, errorText) {
    let errorMessage = `API 错误 (${status})`
    let details = ''

    try {
      const errorJson = JSON.parse(errorText)
      const msg = errorJson.error?.message || errorText
      const code = errorJson.error?.code || status
      const statusText = errorJson.error?.status || ''

      details = msg

      switch (parseInt(code)) {
        case 400:
          errorMessage = '请求参数错误 (400 Bad Request)'
          details += '\n\n建议: 检查 Project ID、Region 或模型名称是否正确。'
          break
        case 401:
          errorMessage = '认证失败 (401 Unauthenticated)'
          details += '\n\n建议: OAuth Token 可能无效或已过期，请尝试重新登录 Google 账户。'
          break
        case 403:
          errorMessage = '权限不足 (403 Permission Denied)'
          details += '\n\n建议:\n1. 确保在 Google Cloud Console 中已启用 **Vertex AI API**。\n2. 确保当前账户拥有 **Vertex AI User** 角色。\n3. 检查是否启用了计费账户。\n4. 如果使用 Service Account，请检查 "Service Account Token Creator" 权限。'
          break
        case 404:
          errorMessage = '资源未找到 (404 Not Found)'
          details += '\n\n建议:\n1. 检查 Project ID 是否正确。\n2. 检查 Region (区域) 是否支持该模型 (例如 Veo 通常仅在 us-central1 可用)。\n3. 模型名称拼写错误。'
          break
        case 429:
          errorMessage = '配额超限 (429 Resource Exhausted)'
          details += '\n\n建议: 您已达到 API 调用配额限制，请稍后重试或申请增加配额。'
          break
        case 500:
          errorMessage = '服务器内部错误 (500 Internal Server Error)'
          details += '\n\n建议: Google 服务器暂时出现问题，请稍后重试。'
          break
        case 503:
          errorMessage = '服务不可用 (503 Service Unavailable)'
          details += '\n\n建议: 服务暂时过载或维护中，请稍后重试。'
          break
      }
    } catch (e) {
      details = errorText
    }

    return `${errorMessage}: ${details}`
  }

  async _testVertex(config) {
    const vertexConfig = this.getVertexConfig()
    const projectId = vertexConfig.projectId
    let location = vertexConfig.location || 'asia-southeast1'

    if (!projectId) {
      throw new Error('请配置 Vertex AI 项目ID (VITE_VERTEX_PROJECT_ID 环境变量)')
    }

    // 优先使用 OAuth Token，回退到 API Key
    let accessToken = googleAuthService.getAccessToken()
    const apiKey = config.apiKey

    console.log('[Vertex Test] OAuth Token:', accessToken ? `${accessToken.substring(0, 20)}...` : 'null')
    console.log('[Vertex Test] API Key:', apiKey ? '已配置' : '未配置')
    console.log('[Vertex Test] Project ID:', projectId)
    console.log('[Vertex Test] Location:', location)

    if (!accessToken && !apiKey) {
      throw new Error('请先点击"使用 Google 账户登录"按钮获取 OAuth Token')
    }

    // 推荐的模型列表（用于提供友好的名称和排序）
    const RECOMMENDED_MODELS = {
      // 视频生成
      'veo-3.1-generate-preview': { name: 'Veo 3.1 (视频)', order: 1 },
      'veo-3.0-generate-preview': { name: 'Veo 3 (视频)', order: 2 },
      'veo-3-fast': { name: 'Veo 3 Fast (视频)', order: 3 },
      'veo-2.0-generate-001': { name: 'Veo 2 (视频)', order: 4 },
      // 图片生成
      'imagen-4-ultra': { name: 'Imagen 4 Ultra', order: 10 },
      'imagen-4': { name: 'Imagen 4', order: 11 },
      'imagen-4-fast': { name: 'Imagen 4 Fast', order: 12 },
      'imagen-3.0-generate-002': { name: 'Imagen 3.0', order: 13 },
      'imagen-3.0-fast-generate-001': { name: 'Imagen 3.0 Fast', order: 14 },
      // 对话模型
      'gemini-3-pro-preview': { name: 'Gemini 3 Pro Preview', order: 20 },
      'gemini-2.5-pro': { name: 'Gemini 2.5 Pro', order: 21 },
      'gemini-2.5-flash': { name: 'Gemini 2.5 Flash', order: 22 },
      'gemini-2.0-flash': { name: 'Gemini 2.0 Flash', order: 23 }
    }

    const headers = {
      'Content-Type': 'application/json'
    }

    // 认证方式：优先 OAuth Token，其次 API Key（通过 URL 参数）
    const useOAuth = !!accessToken
    if (useOAuth) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }

    // 定义测试函数
    const tryTest = async (testLocation) => {
      // 使用 v1beta1 API（支持 API Key 认证）
      let endpoint = `https://${testLocation}-aiplatform.googleapis.com/v1beta1/projects/${projectId}/locations/${testLocation}/publishers/google/models/gemini-2.0-flash:generateContent`

      // API Key 通过 URL 参数传递
      if (!useOAuth && apiKey) {
        endpoint += `?key=${apiKey}`
      }

      console.log('[Vertex Test] Endpoint:', endpoint, useOAuth ? '(OAuth)' : '(API Key)')
      return await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'test' }] }],
          generationConfig: { maxOutputTokens: 5 }
        })
      })
    }

    // 第一次尝试
    const originalLocation = location
    let locationFallback = false
    let testResponse = await tryTest(location)

    // 如果 404 且当前不是 us-central1，自动重试 us-central1
    if (!testResponse.ok && testResponse.status === 404 && location !== 'us-central1') {
      console.warn(`[Vertex Test] Location ${location} failed with 404. Retrying with us-central1...`)
      const retryResponse = await tryTest('us-central1')
      testResponse = retryResponse
      if (testResponse.ok) {
        location = 'us-central1' // 更新位置以便显示和后续调用
        locationFallback = true
      }
    }

    if (!testResponse.ok) {
      const errorText = await testResponse.text()
      console.error('[Vertex Test] Error Response:', errorText)
      throw new Error(this._mapGoogleError(testResponse.status, errorText))
    }

    // 连通性测试通过后，尝试动态获取模型列表
    let models = []
    try {
      // 仅获取 Google 发布的模型（使用 v1beta1）
      let listEndpoint = `https://${location}-aiplatform.googleapis.com/v1beta1/projects/${projectId}/locations/${location}/publishers/google/models`
      if (!useOAuth && apiKey) {
        listEndpoint += `?key=${apiKey}`
      }
      console.log('[Vertex Test] Listing models from:', listEndpoint)

      const listResponse = await fetch(listEndpoint, {
        method: 'GET',
        headers
      })

      if (listResponse.ok) {
        const data = await listResponse.json()
        const fetchedModels = data.models || []
        
        // 过滤并映射模型
        models = fetchedModels
          .filter(m => {
             const modelId = m.name.split('/').pop() //获取短 ID
             // 只保留 gemini, imagen, veo 系列
             return /gemini|imagen|veo/i.test(modelId)
          })
          .map(m => {
            const fullId = m.name // e.g., projects/.../publishers/google/models/gemini-1.5-pro
            // Vertex 返回的 name 是全路径，我们需要转成 standard ID 格式
            // 通常我们只需要 publishers/google/models/xxxx
            const shortId = m.name.split('/').pop()
            const standardId = `publishers/google/models/${shortId}`
            
            const recommended = RECOMMENDED_MODELS[shortId]
            
            return {
              id: standardId,
              name: recommended ? recommended.name : (m.displayName || shortId),
              order: recommended ? recommended.order : 999 // 推荐的排前面，其他的排后面
            }
          })
          
        // 补充推荐列表中有但 API 没返回的（防止 API 列表不全或被过滤掉）
        // 或者简单起见，如果 API 调用成功，就以 API 为准？
        // 考虑到兼容性，最好合并。
        Object.keys(RECOMMENDED_MODELS).forEach(key => {
          const standardId = `publishers/google/models/${key}`
          if (!models.find(m => m.id === standardId)) {
            models.push({
              id: standardId,
              name: RECOMMENDED_MODELS[key].name,
              order: RECOMMENDED_MODELS[key].order
            })
          }
        })
        
        // 排序
        models.sort((a, b) => a.order - b.order)

      } else {
        console.warn('[Vertex Test] Failed to list models, using fallback list.', listResponse.status)
        throw new Error('List failed') // 用于触发 catch 走 fallback
      }
    } catch (e) {
      console.warn('[Vertex Test] Fetch models failed, using default list.', e)
      // 回退到默认列表
      models = Object.keys(RECOMMENDED_MODELS).map(key => ({
        id: `publishers/google/models/${key}`,
        name: RECOMMENDED_MODELS[key].name
      })).sort((a, b) => {
         const orderA = RECOMMENDED_MODELS[a.id.split('/').pop()].order
         const orderB = RECOMMENDED_MODELS[b.id.split('/').pop()].order
         return orderA - orderB
      })
    }

    const fallbackNote = locationFallback
      ? `\n⚠️ 注意: ${originalLocation} 区域测试失败，已自动切换到 ${location}`
      : ''

    return {
      models,
      message: `Vertex AI 连接成功 (${accessToken ? 'OAuth Token' : 'API Key'})，项目: ${projectId}，区域: ${location}${fallbackNote}`
    }
  }

  async _testCustom(config) {
    const apiType = config.apiType || 'openai'
    const endpoint = config.endpoint || ''
    const apiKey = config.apiKey
    const corsProxyUrl = config.corsProxyUrl || ''

    if (!apiKey) throw new Error('请提供 API Key')
    if (!endpoint) throw new Error('请提供 API 地址')

    // 如果配置了 CORS 代理，使用用户提供的代理服务器，并规范化斜杠
    const normalizedEndpoint = this.normalizeEndpoint('custom', endpoint)
    const actualEndpoint = corsProxyUrl
      ? `${this.normalizeProxyUrl(corsProxyUrl)}${normalizedEndpoint}`
      : normalizedEndpoint

    // 根据 API 类型路由到对应的测试方法
    const testConfig = {
      ...config,
      apiKey,
      endpoint: actualEndpoint
    }

    try {
      switch (apiType) {
        case 'openai':
          return await this._testOpenAI(testConfig)
        case 'anthropic':
          return await this._testAnthropic(testConfig)
        case 'google':
          return await this._testGoogle(testConfig)
        default:
          throw new Error(`不支持的 API 类型: ${apiType}`)
      }
    } catch (error) {
      // 如果是 fetch 本身失败（网络错误、CORS 等）
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(`网络请求失败: ${error.message}（可能是 CORS 问题或网络不可达）`)
      }
      // 重新抛出其他错误
      throw error
    }
  }

  // 统一的流式聊天接口
  async *streamChat(provider, messages, model, config, options = {}) {
    // 初始化客户端
    this.initClient(provider, config)

    switch (provider) {
      case 'openai':
        yield* this.streamChatOpenAI(messages, model, options)
        break

      case 'anthropic':
        yield* this.streamChatAnthropic(messages, model, options)
        break

      case 'google':
        yield* this.streamChatGoogle(messages, model, options)
        break

      case 'vertex':
        yield* this.streamChatVertex(messages, model, options)
        break

      case 'custom':
        yield* this.streamChatCustom(messages, model, config, options)
        break

      default:
        throw new Error(`不支持的提供商: ${provider}`)
    }
  }

  // Google Vertex AI（REST）流式/非流式
  async *streamChatVertex(messages, model, options = {}) {
    const { projectId, location } = this.getVertexConfig()

    if (!projectId) throw new Error('Vertex 项目ID未配置')

    // 优先使用 OAuth Token，回退到 API Key
    let accessToken = googleAuthService.getAccessToken()
    const apiKey = this.getApiKey('vertex')

    if (!accessToken && !apiKey) {
      throw new Error('请登录 Google 账户或提供 Vertex API Key')
    }

    const lastMessage = messages[messages.length - 1]
    const prompt = lastMessage?.content || ''

    // 检查是否是 Veo 视频生成模型
    const isVeoModel = model.includes('veo')
    // 检查是否是 Imagen 图片生成模型
    const isImagenModel = model.includes('imagen')

    // Veo 视频生成
    if (isVeoModel) {
      yield* this._generateVertexVideo(projectId, location, model, prompt, { accessToken, apiKey }, options.videoParams)
      return
    }

    // Imagen 图片生成
    if (isImagenModel) {
      yield* this._generateVertexImage(projectId, location, model, prompt, { accessToken, apiKey }, options.imageParams)
      return
    }

    // Gemini 对话模型
    const temperature = options.temperature || 0.7
    const maxOutputTokens = options.maxTokens || 2048
    const history = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }))

    // 拼接 endpoint（使用 v1beta1 支持 API Key）
    const baseURL = `https://${location}-aiplatform.googleapis.com/v1beta1`
    const modelPath = `projects/${projectId}/locations/${location}/${model}`
    const useOAuth = !!accessToken
    let url = `${baseURL}/${modelPath}:streamGenerateContent?alt=sse`
    if (!useOAuth && apiKey) {
      url += `&key=${apiKey}`
    }

    const headers = {
      'Content-Type': 'application/json'
    }
    if (useOAuth) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }

    const body = {
      contents: [
        ...history,
        { role: 'user', parts: [{ text: prompt }] }
      ],
      generationConfig: {
        temperature,
        maxOutputTokens
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })

    if (!response.ok || !response.body) {
      const errText = await response.text()
      throw new Error(this._mapGoogleError(response.status, errText))
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const parts = buffer.split('\n')
      buffer = parts.pop() || ''
      for (const line of parts) {
        const trimmed = line.replace(/^data:\s*/, '').trim()
        if (!trimmed) continue
        if (trimmed === '[DONE]') {
          yield { type: 'done', reason: 'stop' }
          return
        }
        try {
          const json = JSON.parse(trimmed)
          const text = json?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || ''
          if (text) {
            yield { type: 'content', content: text }
          }
        } catch (e) {
          console.warn('Vertex SSE parse error', e)
        }
      }
    }

    yield { type: 'done', reason: 'stop' }
  }

  // Vertex AI Veo 视频生成
  async *_generateVertexVideo(projectId, location, model, prompt, auth, videoParams = {}) {
    yield { type: 'content', content: '🎬 正在提交任务至 Vertex AI (Veo)...\n\n' }

    let { accessToken, apiKey } = auth
    
    // 智能认证策略：
    // 1. 如果有 API Key (AIza开头)，优先尝试使用 API Key (因为它永不过期且配置简单)
    // 2. 如果只有 OAuth Token，则使用 Token
    let useOAuth = true
    let token = accessToken
    
    if (apiKey && apiKey.startsWith('AIza')) {
       useOAuth = false
       token = apiKey
    } else if (!accessToken) {
       // 无任何凭证
       throw new Error('未检测到有效的 Vertex 认证凭证 (OAuth Token 或 API Key)')
    }

    const modelName = model.replace('publishers/google/models/', '')
    
    // 构建 Endpoint (Veo 3.1+ 使用 v1beta1 + predictLongRunning)
    const baseUrl = `https://${location}-aiplatform.googleapis.com/v1beta1`
    let endpoint = `${baseUrl}/projects/${projectId}/locations/${location}/publishers/google/models/${modelName}:predictLongRunning`
    
    const headers = {
      'Content-Type': 'application/json'
    }
    
    if (!useOAuth) {
      endpoint += `?key=${token}`
    } else {
      headers['Authorization'] = `Bearer ${token}`
    }

    try {
      const instance = { prompt }
      // 如果有参考图，添加到 payload
      if (videoParams.referenceImage) {
        instance.image = { bytesBase64Encoded: videoParams.referenceImage }
      }

      const parameters = {
        sampleCount: 1,
        aspectRatio: videoParams.aspectRatio || '16:9',
        durationSeconds: parseInt(videoParams.duration || '5', 10),
        includeAudio: !!videoParams.withAudio
      }
      
      // Veo 3.1 参数兼容
      if (modelName.includes('veo-3.1')) {
        if (videoParams.negativePrompt) {
          parameters.negativePrompt = videoParams.negativePrompt
        }
      }

      console.log(`[Vertex Video] Request: ${endpoint} (Auth: ${useOAuth ? 'OAuth' : 'API Key'})`)

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          instances: [instance],
          parameters
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Vertex Video Gen Failed. Status: ${response.status}, Error: ${errorText}`)
        yield { type: 'content', content: `视频生成请求失败 (Vertex):\n${this._mapGoogleError(response.status, errorText)}\n\n请求地址: \`${endpoint}\`` }
        yield { type: 'done', reason: 'error' }
        return
      }

      let data = await response.json()
      
      // 处理 Long Running Operation
      if (data.name && !data.done) {
        yield { type: 'content', content: '⏳ 任务已提交，正在 Vertex AI 上生成视频 (预计 1-2 分钟)... 0%\n' }
        
        const operationName = data.name 
        let pollUrl = `${baseUrl}/${operationName}`
        
        if (!useOAuth) {
          pollUrl += `?key=${token}`
        }
        
        console.log(`[Vertex Video] Polling: ${pollUrl}`)
        
        let attempts = 0
        while (true) {
          await new Promise(resolve => setTimeout(resolve, 5000)) // 5秒轮询
          attempts++
          
          const pollHeaders = useOAuth ? { 'Authorization': `Bearer ${token}` } : {}
          const opRes = await fetch(pollUrl, { headers: pollHeaders })
          
          if (!opRes.ok) {
            const errText = await opRes.text()
            throw new Error(`轮询失败 ${opRes.status}: ${errText}`)
          }
          
          data = await opRes.json()
          
          if (data.done) {
            if (data.error) {
              throw new Error(`Vertex 任务失败: ${data.error.message}`)
            }
            if (data.response) {
               data = data.response
            }
            break
          }
        }
      }

      // 解析结果 (Video)
      if (data.predictions && data.predictions.length > 0) {
        const prediction = data.predictions[0]

        // 1. Base64 视频
        if (prediction.bytesBase64Encoded) {
          const videoUrl = `data:video/mp4;base64,${prediction.bytesBase64Encoded}`
          yield { type: 'content', content: `<video controls src="${videoUrl}" width="100%" style="max-width: 640px; border-radius: 8px;"></video>\n\n` }
        } 
        // 2. Cloud Storage URI (videoUri)
        else if (prediction.videoUri) {
          yield { type: 'content', content: `<video controls src="${prediction.videoUri}" width="100%" style="max-width: 640px; border-radius: 8px;"></video>\n\n[下载视频](${prediction.videoUri})` }
        } 
        // 3. Veo 3.1 结构 (assets.video.uri)
        else if (prediction.assets && prediction.assets.video && prediction.assets.video.uri) {
           const uri = prediction.assets.video.uri
           yield { type: 'content', content: `<video controls src="${uri}" width="100%" style="max-width: 640px; border-radius: 8px;"></video>\n\n[下载视频](${uri})` }
        }
        else {
          console.log('[Vertex Video] Unrecognized prediction:', prediction)
          yield { type: 'content', content: '视频生成成功但未识别到返回数据格式' }
        }
      } else {
        yield { type: 'content', content: '视频生成失败: 未返回 predictions' }
      }
    } catch (error) {
      console.error('[Vertex Video] Error:', error)
      yield { type: 'content', content: `视频生成错误: ${error.message}` }
    }

    yield { type: 'done', reason: 'stop' }
  }

  // Vertex AI Imagen 图片生成
  async *_generateVertexImage(projectId, location, model, prompt, token, imageParams = {}) {
    yield { type: 'content', content: '🖼️ 正在生成图片，请稍候...\n\n' }

    const modelName = model.replace('publishers/google/models/', '')
    const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelName}:predict`

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: imageParams.aspectRatio || '1:1'
          }
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        yield { type: 'content', content: `图片生成失败 (Vertex):\n${this._mapGoogleError(response.status, errorText)}` }
        yield { type: 'done', reason: 'error' }
        return
      }

      const data = await response.json()

      if (data.predictions && data.predictions.length > 0) {
        const prediction = data.predictions[0]

        if (prediction.bytesBase64Encoded) {
          const imageUrl = `data:image/png;base64,${prediction.bytesBase64Encoded}`
          yield { type: 'content', content: `![生成的图片](${imageUrl})\n\n` }
        } else {
          yield { type: 'content', content: '图片生成成功但未识别到返回数据格式' }
        }
      } else {
        yield { type: 'content', content: '图片生成失败，请重试' }
      }
    } catch (error) {
      yield { type: 'content', content: `图片生成错误: ${error.message}` }
    }

    yield { type: 'done', reason: 'stop' }
  }

  // 非流式聊天（兼容接口）
  async chat(provider, messages, model, config, options = {}) {
    let fullContent = ''

    for await (const chunk of this.streamChat(provider, messages, model, config, options)) {
      if (chunk.type === 'content') {
        fullContent += chunk.content
      }
    }

    return {
      content: fullContent,
      role: 'assistant'
    }
  }
}

// 导出单例
const aiService = new AIService()
export default aiService
