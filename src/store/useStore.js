import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 全局状态管理
export const useStore = create(
  persist(
    (set, get) => ({
      // AI 提供商配置
      providers: {
        openai: {
          name: 'OpenAI',
          apiKey: '',
          baseURL: 'https://api.openai.com/v1',
          models: ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
          defaultModel: 'gpt-4o',
          supportsVision: true,
          supportsStreaming: true
        },
        anthropic: {
          name: 'Anthropic Claude',
          apiKey: '',
          baseURL: 'https://api.anthropic.com/v1',
          models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
          defaultModel: 'claude-3-5-sonnet-20241022',
          supportsVision: true,
          supportsStreaming: true
        },
        google: {
          name: 'Google Gemini',
          apiKey: '',
          baseURL: 'https://generativelanguage.googleapis.com/v1beta',
          models: [
            'gemini-3-pro-preview',
            'gemini-2.5-flash',
            'gemini-2.5-pro',
            'gemini-2.0-flash',
            'gemini-2.0-flash-exp',
            'gemini-1.5-pro',
            'gemini-1.5-flash'
          ],
          defaultModel: 'gemini-3-pro-preview',
          supportsVision: true,
          supportsStreaming: true
        },
        custom: {
          name: '自定义 API',
          apiKey: '',
          baseURL: '',
          models: [],
          defaultModel: '',
          supportsVision: false,
          supportsStreaming: false
        }
      },

      // 当前选择的提供商
      currentProvider: 'openai',
      currentModel: '',

      // 聊天会话
      sessions: [{
        id: 'default',
        name: '新对话',
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      }],
      currentSessionId: 'default',

      // 应用设置
      settings: {
        theme: 'dark',
        temperature: 0.7,
        maxTokens: 4096,
        enableSearch: true,
        enableThinking: true,
        streamingEnabled: true,
        autoSaveHistory: true
      },

      // UI状态（持久化到localStorage）
      uiState: {
        leftSidebarOpen: true,
        leftActiveTab: 'sessions',  // 'sessions' | 'images' | 'videos' | 'code'
        rightPanelOpen: true  // 右侧面板默认展开
      },

      // 图像库（持久化）
      imageLibrary: [],

      // 视频库（持久化）
      videoLibrary: [],

      // 代码片段（持久化）
      codeSnippets: [],

      // API 测试结果（不持久化）
      testResults: {
        openai: null,
        anthropic: null,
        google: null,
        custom: null
      },

      // 动态获取的模型列表（不持久化）
      dynamicModels: {
        openai: [],
        anthropic: [],
        google: [],
        custom: []
      },

      // 自定义模型（持久化）
      customModels: {
        openai: [],
        anthropic: [],
        google: [],
        custom: []
      },

      // Actions
      setProviderApiKey: (provider, apiKey) => set((state) => ({
        providers: {
          ...state.providers,
          [provider]: {
            ...state.providers[provider],
            apiKey
          }
        }
      })),

      setProviderBaseURL: (provider, baseURL) => set((state) => ({
        providers: {
          ...state.providers,
          [provider]: {
            ...state.providers[provider],
            baseURL
          }
        }
      })),

      setCurrentProvider: (provider) => {
        const state = get()
        const defaultModel = state.providers[provider]?.defaultModel || ''
        set({ currentProvider: provider, currentModel: defaultModel })
      },

      setCurrentModel: (model) => set({ currentModel: model }),

      addMessage: (sessionId, message) => set((state) => ({
        sessions: state.sessions.map(session =>
          session.id === sessionId
            ? {
                ...session,
                messages: [...session.messages, message],
                updatedAt: Date.now()
              }
            : session
        )
      })),

      updateMessage: (sessionId, messageId, updates) => set((state) => ({
        sessions: state.sessions.map(session =>
          session.id === sessionId
            ? {
                ...session,
                messages: session.messages.map(msg =>
                  msg.id === messageId ? { ...msg, ...updates } : msg
                ),
                updatedAt: Date.now()
              }
            : session
        )
      })),

      createSession: (name = '新对话') => {
        const newSession = {
          id: `session-${Date.now()}`,
          name,
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
        set((state) => ({
          sessions: [...state.sessions, newSession],
          currentSessionId: newSession.id
        }))
        return newSession.id
      },

      deleteSession: (sessionId) => set((state) => ({
        sessions: state.sessions.filter(s => s.id !== sessionId),
        currentSessionId: state.currentSessionId === sessionId
          ? (state.sessions.find(s => s.id !== sessionId)?.id || '')
          : state.currentSessionId
      })),

      setCurrentSession: (sessionId) => set({ currentSessionId: sessionId }),

      clearSession: (sessionId) => set((state) => ({
        sessions: state.sessions.map(session =>
          session.id === sessionId
            ? { ...session, messages: [], updatedAt: Date.now() }
            : session
        )
      })),

      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),

      getCurrentSession: () => {
        const state = get()
        return state.sessions.find(s => s.id === state.currentSessionId) || state.sessions[0]
      },

      getCurrentProvider: () => {
        const state = get()
        return state.providers[state.currentProvider]
      },

      // UI状态管理Actions
      setLeftSidebarOpen: (open) => set((state) => ({
        uiState: { ...state.uiState, leftSidebarOpen: open }
      })),

      setLeftActiveTab: (tab) => set((state) => ({
        uiState: { ...state.uiState, leftActiveTab: tab }
      })),

      toggleRightPanel: () => set((state) => ({
        uiState: { ...state.uiState, rightPanelOpen: !state.uiState.rightPanelOpen }
      })),

      setRightPanelOpen: (open) => set((state) => ({
        uiState: { ...state.uiState, rightPanelOpen: open }
      })),

      // 图像库管理
      addToImageLibrary: (image) => set((state) => ({
        imageLibrary: [...state.imageLibrary, { ...image, id: `img-${Date.now()}`, createdAt: Date.now() }]
      })),

      deleteFromImageLibrary: (imageId) => set((state) => ({
        imageLibrary: state.imageLibrary.filter(img => img.id !== imageId)
      })),

      // 视频库管理
      addToVideoLibrary: (video) => set((state) => ({
        videoLibrary: [...state.videoLibrary, { ...video, id: `vid-${Date.now()}`, createdAt: Date.now() }]
      })),

      deleteFromVideoLibrary: (videoId) => set((state) => ({
        videoLibrary: state.videoLibrary.filter(vid => vid.id !== videoId)
      })),

      // 代码片段管理
      addCodeSnippet: (snippet) => set((state) => ({
        codeSnippets: [...state.codeSnippets, { ...snippet, id: `code-${Date.now()}`, createdAt: Date.now() }]
      })),

      deleteCodeSnippet: (snippetId) => set((state) => ({
        codeSnippets: state.codeSnippets.filter(snip => snip.id !== snippetId)
      })),

      updateCodeSnippet: (snippetId, updates) => set((state) => ({
        codeSnippets: state.codeSnippets.map(snip =>
          snip.id === snippetId ? { ...snip, ...updates } : snip
        )
      })),

      // API 测试管理
      setTestResult: (provider, result) => set((state) => ({
        testResults: { ...state.testResults, [provider]: result }
      })),

      setDynamicModels: (provider, models) => set((state) => ({
        dynamicModels: { ...state.dynamicModels, [provider]: models }
      })),

      addCustomModel: (provider, model) => set((state) => ({
        customModels: {
          ...state.customModels,
          [provider]: [...state.customModels[provider], model]
        }
      })),

      removeCustomModel: (provider, modelId) => set((state) => ({
        customModels: {
          ...state.customModels,
          [provider]: state.customModels[provider].filter(m => m.id !== modelId)
        }
      }))
    }),
    {
      name: 'winkai-storage',
      partialize: (state) => ({
        providers: state.providers,
        currentProvider: state.currentProvider,
        currentModel: state.currentModel,
        sessions: state.sessions,
        currentSessionId: state.currentSessionId,
        settings: state.settings,
        uiState: state.uiState,  // 持久化 UI 状态
        imageLibrary: state.imageLibrary,
        videoLibrary: state.videoLibrary,
        codeSnippets: state.codeSnippets,
        customModels: state.customModels
      })
    }
  )
)
