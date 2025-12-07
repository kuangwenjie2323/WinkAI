import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import aiService from './aiService'
import { useStore } from '../store/useStore'

// Mock useStore
vi.mock('../store/useStore', () => ({
  useStore: {
    getState: vi.fn()
  }
}))

// Mock 环境变量
const originalEnv = import.meta.env

describe('AIService', () => {
  beforeEach(() => {
    // 重置 useStore mock
    useStore.getState.mockReturnValue({
      providers: {
        openai: { apiKey: 'store-openai-key', baseURL: 'https://store-openai.com' },
        anthropic: { apiKey: 'store-anthropic-key', baseURL: 'https://store-anthropic.com' },
        qwen: { apiKey: 'store-qwen-key', baseURL: 'https://store-qwen.com', defaultModel: 'qwen-plus', models: ['qwen-plus'] },
        doubao: { apiKey: 'store-doubao-key', baseURL: 'https://store-doubao.com', defaultModel: 'doubao-pro-32k', models: ['doubao-pro-32k'] },
        deepseek: { apiKey: 'store-deepseek-key', baseURL: 'https://store-deepseek.com', defaultModel: 'deepseek-chat', models: ['deepseek-chat'] }
      }
    })
    
    // 重置 fetch
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.clearAllMocks()
    import.meta.env = originalEnv
  })

  describe('normalizeEndpoint', () => {
    it('应该移除尾随斜杠', () => {
      expect(aiService.normalizeEndpoint('openai', 'https://api.example.com/')).toBe('https://api.example.com')
      expect(aiService.normalizeEndpoint('openai', 'https://api.example.com///')).toBe('https://api.example.com')
    })

    it('对于 Anthropic 应该移除 /v1', () => {
      expect(aiService.normalizeEndpoint('anthropic', 'https://api.anthropic.com/v1')).toBe('https://api.anthropic.com')
      expect(aiService.normalizeEndpoint('anthropic', 'https://api.anthropic.com/v1/')).toBe('https://api.anthropic.com')
    })

    it('对于非 Anthropic 不应该移除 /v1', () => {
      expect(aiService.normalizeEndpoint('openai', 'https://api.openai.com/v1')).toBe('https://api.openai.com/v1')
    })

    it('应该为 DeepSeek 自动追加 /v1', () => {
      expect(aiService.normalizeEndpoint('deepseek', 'https://api.deepseek.com')).toBe('https://api.deepseek.com/v1')
    })

    it('应该为千问补全 compatible-mode/v1', () => {
      expect(aiService.normalizeEndpoint('qwen', 'https://dashscope.aliyuncs.com')).toBe('https://dashscope.aliyuncs.com/compatible-mode/v1')
      expect(aiService.normalizeEndpoint('qwen', 'https://dashscope.aliyuncs.com/compatible-mode')).toBe('https://dashscope.aliyuncs.com/compatible-mode/v1')
    })

    it('应该为豆包补全 /api/v3', () => {
      expect(aiService.normalizeEndpoint('doubao', 'https://ark.cn-beijing.volces.com')).toBe('https://ark.cn-beijing.volces.com/api/v3')
      expect(aiService.normalizeEndpoint('doubao', 'https://ark.cn-beijing.volces.com/')).toBe('https://ark.cn-beijing.volces.com/api/v3')
    })
  });

  describe('getApiKey', () => {
    it('应该优先使用环境变量', () => {
      // 模拟环境变量
      import.meta.env.VITE_OPENAI_API_KEY = 'env-openai-key'
      expect(aiService.getApiKey('openai')).toBe('env-openai-key')
      delete import.meta.env.VITE_OPENAI_API_KEY
    })

    it('如果没有环境变量，应该使用 Store 中的配置', () => {
      expect(aiService.getApiKey('openai')).toBe('store-openai-key')
    })
  })

  describe('getApiEndpoint', () => {
    it('应该从 store 获取并规范化', () => {
        // 模拟 store 返回带斜杠的 URL
        useStore.getState.mockReturnValue({
            providers: {
                openai: { baseURL: 'https://store-openai.com/' }
            }
        })
        expect(aiService.getApiEndpoint('openai')).toBe('https://store-openai.com')
    })
  })

  describe('testConnection', () => {
    it('应该正确处理 OpenAI 连接测试', async () => {
      // Mock fetch responses
      const mockModelsResponse = {
        ok: true,
        json: async () => ({ data: [{ id: 'gpt-4', created: 123 }] })
      }
      const mockChatResponse = {
        ok: true
      }

      global.fetch
        .mockResolvedValueOnce(mockModelsResponse) // models call
        .mockResolvedValueOnce(mockChatResponse)   // chat call

      // 注意：由于 testConnection 实现中优先使用 getApiKey() (即 store 中的 key)，
      // 这里的 'test-key' 会被 store 中的 'store-openai-key' 覆盖。
      // Endpoint 同理。
      const result = await aiService.testConnection('openai', { apiKey: 'test-key' })
      
      expect(result.success).toBe(true)
      expect(result.provider).toBe('openai')
      expect(result.models).toHaveLength(1)
      expect(result.models[0].id).toBe('gpt-4')
      
      // 验证 fetch 调用
      expect(global.fetch).toHaveBeenCalledTimes(2)
      // 第一次调用：获取模型
      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        'https://store-openai.com/models',
        expect.objectContaining({ headers: { Authorization: 'Bearer store-openai-key' } })
      )
    })
    
    it('应该处理连接失败的情况', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            text: async () => 'Unauthorized',
            status: 401
        })

        const result = await aiService.testConnection('openai', { apiKey: 'wrong-key' })
        
        expect(result.success).toBe(false)
        expect(result.error).toContain('401')
    })

    it('Qwen: 模型列表失败时应该使用预设列表', async () => {
      // 模拟获取模型失败，但聊天调用成功
      global.fetch
        .mockResolvedValueOnce({
          ok: false,
          status: 404,
          text: async () => 'Not Found'
        })
        .mockResolvedValueOnce({ ok: true })

      // 覆盖 store 以确保有默认模型
      useStore.getState.mockReturnValue({
        providers: {
          qwen: {
            apiKey: 'store-qwen-key',
            baseURL: 'https://store-qwen.com/compatible-mode/v1',
            defaultModel: 'qwen-plus',
            models: ['qwen-plus', 'qwen-turbo']
          }
        }
      })

      const result = await aiService.testConnection('qwen', { apiKey: 'manual-key' })

      expect(result.success).toBe(true)
      expect(result.models).toHaveLength(2)
      expect(global.fetch).toHaveBeenCalledTimes(2)
      expect(global.fetch).toHaveBeenLastCalledWith(
        'https://store-qwen.com/compatible-mode/v1/chat/completions',
        expect.any(Object)
      )
    })
  })

  describe('Multi-modal Support', () => {
    const mockImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
    
    it('OpenAI: 应该正确构造多模态消息', async () => {
      const createMock = vi.fn().mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          yield { choices: [{ delta: { content: 'Image received' } }] }
        }
      })
      
      aiService.clients.openai = {
        chat: { completions: { create: createMock } }
      }

      const messages = [{ role: 'user', content: 'Analyze this', images: [mockImage] }]
      const iterator = aiService.streamChatOpenAI(messages, 'gpt-4o')
      await iterator.next()

      expect(createMock).toHaveBeenCalledWith(expect.objectContaining({
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this' },
              { type: 'image_url', image_url: { url: mockImage, detail: 'auto' } }
            ]
          }
        ]
      }))
    })

    it('Anthropic: 应该正确构造多模态消息', async () => {
        const streamMock = vi.fn().mockResolvedValue({
          [Symbol.asyncIterator]: async function* () {
            yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Image received' } }
          }
        })
        
        aiService.clients.anthropic = {
          messages: { stream: streamMock }
        }
  
        const messages = [{ role: 'user', content: 'Analyze this', images: [mockImage] }]
        const iterator = aiService.streamChatAnthropic(messages, 'claude-3-5-sonnet')
        await iterator.next()
  
        expect(streamMock).toHaveBeenCalledWith(expect.objectContaining({
          messages: [
            {
              role: 'user',
              content: [
                { 
                  type: 'image', 
                  source: { 
                    type: 'base64', 
                    media_type: 'image/png', 
                    data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' 
                  } 
                },
                { type: 'text', text: 'Analyze this' }
              ]
            }
          ]
        }))
      })

      it('Google: 应该正确构造多模态消息', async () => {
        const sendMessageStreamMock = vi.fn().mockResolvedValue({
            stream: {
                [Symbol.asyncIterator]: async function* () {
                    yield { text: () => 'Image received' }
                }
            }
        })
        
        const startChatMock = vi.fn().mockReturnValue({
            sendMessageStream: sendMessageStreamMock
        })

        aiService.clients.google = {
            getGenerativeModel: vi.fn().mockReturnValue({
                startChat: startChatMock
            })
        }
  
        // 构造历史消息（带图片）和当前消息（带图片）
        const messages = [
            { role: 'user', content: 'Previous image', images: [mockImage] },
            { role: 'assistant', content: 'Okay' },
            { role: 'user', content: 'Current image', images: [mockImage] }
        ]
        
        const iterator = aiService.streamChatGoogle(messages, 'gemini-1.5-pro')
        await iterator.next()
  
        // 验证历史消息中的图片
        expect(startChatMock).toHaveBeenCalledWith(expect.objectContaining({
            history: expect.arrayContaining([
                expect.objectContaining({
                    role: 'user',
                    parts: expect.arrayContaining([
                        { text: 'Previous image' },
                        { inlineData: { mimeType: 'image/png', data: expect.any(String) } }
                    ])
                })
            ])
        }))

        // 验证当前消息中的图片
        expect(sendMessageStreamMock).toHaveBeenCalledWith(expect.arrayContaining([
            { text: 'Current image' },
            { inlineData: { mimeType: 'image/png', data: expect.any(String) } }
        ]))
      })
  })
})
