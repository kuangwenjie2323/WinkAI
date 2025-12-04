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
  })
})
