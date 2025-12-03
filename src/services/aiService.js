import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { useStore } from '../store/useStore'

// 统一的 AI 服务类
class AIService {
  constructor() {
    this.clients = {}
    // 默认 endpoint
    this.defaultEndpoints = {
      openai: 'https://api.openai.com/v1',
      anthropic: 'https://api.anthropic.com',
      google: 'https://generativelanguage.googleapis.com/v1beta',
      custom: ''
    }
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
      custom: import.meta.env.VITE_CUSTOM_API_ENDPOINT
    }[provider]

    if (envEndpoint) return this.normalizeEndpoint(provider, envEndpoint)

    // 回退到用户配置
    const { providers } = useStore.getState()
    const storedEndpoint = providers?.[provider]?.baseURL

    return this.normalizeEndpoint(provider, storedEndpoint || this.defaultEndpoints[provider])
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

      case 'custom':
        // 自定义 API 使用 fetch
        break

      default:
        throw new Error(`不支持的提供商: ${provider}`)
    }
  }

  // OpenAI 流式聊天
  async *streamChatOpenAI(messages, model, options = {}) {
    const client = this.clients.openai
    if (!client) throw new Error('OpenAI 客户端未初始化')

    try {
      const stream = await client.chat.completions.create({
        model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
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

      const stream = await client.messages.stream({
        model,
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7,
        system: systemMessage?.content || undefined,
        messages: chatMessages.map(msg => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        }))
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
      const genModel = client.getGenerativeModel({ model })

      // 转换消息格式
      const history = messages.slice(0, -1).map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }))

      const lastMessage = messages[messages.length - 1]

      const chat = genModel.startChat({
        history,
        generationConfig: {
          temperature: options.temperature || 0.7,
          maxOutputTokens: options.maxTokens || 4096
        }
      })

      const result = await chat.sendMessageStream(lastMessage.content)

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

    // 应用 CORS 代理
    const actualEndpoint = corsProxyUrl ? `${corsProxyUrl}${baseURL}` : baseURL

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
      .filter(m => m.id.includes('gpt'))
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
      .filter(m => m.name.includes('gemini'))
      .map(m => ({
        id: m.name.replace('models/', ''),
        name: m.displayName || m.name
      }))

    return {
      models,
      message: `成功获取 ${models.length} 个模型`
    }
  }

  async _testCustom(config) {
    const apiType = config.apiType || 'openai'
    const endpoint = config.endpoint || ''
    const apiKey = config.apiKey
    const corsProxyUrl = config.corsProxyUrl || ''

    if (!apiKey) throw new Error('请提供 API Key')
    if (!endpoint) throw new Error('请提供 API 地址')

    // 如果配置了 CORS 代理，使用用户提供的代理服务器
    const actualEndpoint = corsProxyUrl ? `${corsProxyUrl}${endpoint}` : endpoint

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

      case 'custom':
        yield* this.streamChatCustom(messages, model, config, options)
        break

      default:
        throw new Error(`不支持的提供商: ${provider}`)
    }
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
