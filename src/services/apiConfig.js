// API 配置文件
export const API_CONFIG = {
  // 这里可以配置不同的 AI 服务提供商
  providers: {
    openai: {
      name: 'OpenAI',
      baseURL: 'https://api.openai.com/v1',
      models: ['gpt-3.5-turbo', 'gpt-4']
    },
    qwen: {
      name: '通义千问',
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      models: ['qwen-plus', 'qwen-turbo']
    },
    doubao: {
      name: '豆包',
      baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
      models: ['doubao-pro-32k', 'doubao-lite-32k']
    },
    deepseek: {
      name: 'DeepSeek',
      baseURL: 'https://api.deepseek.com/v1',
      models: ['deepseek-chat', 'deepseek-coder']
    },
    anthropic: {
      name: 'Anthropic',
      baseURL: 'https://api.anthropic.com/v1',
      models: ['claude-3-opus', 'claude-3-sonnet']
    },
    local: {
      name: '本地模型',
      baseURL: 'http://localhost:11434',
      models: ['llama2', 'mistral']
    }
  },

  // 默认配置
  defaultProvider: 'openai',
  defaultModel: 'gpt-3.5-turbo',

  // 请求配置
  timeout: 30000,
  maxRetries: 3
}

// 获取 API 密钥（从环境变量或本地存储）
export const getApiKey = (provider) => {
  // 优先从环境变量获取
  if (import.meta.env[`VITE_${provider.toUpperCase()}_API_KEY`]) {
    return import.meta.env[`VITE_${provider.toUpperCase()}_API_KEY`]
  }

  // 从本地存储获取
  return localStorage.getItem(`${provider}_api_key`)
}

// 保存 API 密钥到本地存储
export const saveApiKey = (provider, apiKey) => {
  localStorage.setItem(`${provider}_api_key`, apiKey)
}

// 获取当前使用的提供商
export const getCurrentProvider = () => {
  return localStorage.getItem('current_provider') || API_CONFIG.defaultProvider
}

// 设置当前使用的提供商
export const setCurrentProvider = (provider) => {
  localStorage.setItem('current_provider', provider)
}

// 获取当前使用的模型
export const getCurrentModel = () => {
  return localStorage.getItem('current_model') || API_CONFIG.defaultModel
}

// 设置当前使用的模型
export const setCurrentModel = (model) => {
  localStorage.setItem('current_model', model)
}
