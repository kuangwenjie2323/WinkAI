// ==========================================
// 多模态输入组件示例代码
// 文件: src/components/MultiModalInput.jsx
// ==========================================

import { useState, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import './MultiModalInput.css'

function MultiModalInput({ onSend, disabled }) {
  const [text, setText] = useState('')
  const [images, setImages] = useState([])
  const textareaRef = useRef(null)

  // 处理图片上传
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    onDrop: (acceptedFiles) => {
      acceptedFiles.forEach((file) => {
        const reader = new FileReader()
        reader.onload = () => {
          setImages((prev) => [...prev, reader.result])
        }
        reader.readAsDataURL(file)
      })
    }
  })

  // 发送消息
  const handleSend = () => {
    if (!text.trim() && images.length === 0) return
    if (disabled) return

    onSend({
      text: text.trim(),
      images: images.length > 0 ? images : null
    })

    setText('')
    setImages([])
  }

  // 键盘快捷键
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="multimodal-input">
      {/* 图片预览 */}
      {images.length > 0 && (
        <div className="image-preview-container">
          {images.map((img, idx) => (
            <div key={idx} className="image-preview">
              <img src={img} alt={`预览 ${idx + 1}`} />
              <button
                onClick={() => setImages(images.filter((_, i) => i !== idx))}
                className="remove-image"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="input-row">
        {/* 文件上传按钮 */}
        <div {...getRootProps()} className="upload-button">
          <input {...getInputProps()} />
          <span>📎</span>
        </div>

        {/* 文本输入框 */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息... (Enter发送, Shift+Enter换行)"
          disabled={disabled}
          rows={1}
        />

        {/* 发送按钮 */}
        <button
          onClick={handleSend}
          disabled={disabled || (!text.trim() && images.length === 0)}
          className="send-button"
        >
          <span>📤</span>
        </button>
      </div>
    </div>
  )
}

export default MultiModalInput


// ==========================================
// 设置面板组件示例代码
// 文件: src/components/SettingsPanel.jsx
// ==========================================

import { useState } from 'react'
import { useStore } from '../store/useStore'
import './SettingsPanel.css'

function SettingsPanel({ isOpen, onClose }) {
  const {
    providers,
    currentProvider,
    currentModel,
    settings,
    setProviderApiKey,
    setProviderBaseURL,
    setCurrentProvider,
    setCurrentModel,
    updateSettings
  } = useStore()

  const [activeTab, setActiveTab] = useState('providers')

  if (!isOpen) return null

  const provider = providers[currentProvider]

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        {/* 头部 */}
        <div className="settings-header">
          <h2>设置</h2>
          <button onClick={onClose}>✕</button>
        </div>

        {/* 标签页 */}
        <div className="settings-tabs">
          <button
            className={activeTab === 'providers' ? 'active' : ''}
            onClick={() => setActiveTab('providers')}
          >
            AI 提供商
          </button>
          <button
            className={activeTab === 'general' ? 'active' : ''}
            onClick={() => setActiveTab('general')}
          >
            通用设置
          </button>
        </div>

        {/* 内容 */}
        <div className="settings-content">
          {activeTab === 'providers' && (
            <div>
              {/* 提供商选择 */}
              <div className="form-group">
                <label>AI 提供商</label>
                <select
                  value={currentProvider}
                  onChange={(e) => setCurrentProvider(e.target.value)}
                >
                  {Object.keys(providers).map((key) => (
                    <option key={key} value={key}>
                      {providers[key].name}
                    </option>
                  ))}
                </select>
              </div>

              {/* API Key */}
              <div className="form-group">
                <label>API Key</label>
                <input
                  type="password"
                  value={provider.apiKey}
                  onChange={(e) => setProviderApiKey(currentProvider, e.target.value)}
                  placeholder="输入 API Key"
                />
              </div>

              {/* 模型选择 */}
              <div className="form-group">
                <label>模型</label>
                <select
                  value={currentModel || provider.defaultModel}
                  onChange={(e) => setCurrentModel(e.target.value)}
                >
                  {provider.models.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>

              {/* 自定义 API URL (仅自定义提供商) */}
              {currentProvider === 'custom' && (
                <div className="form-group">
                  <label>API 地址</label>
                  <input
                    type="url"
                    value={provider.baseURL}
                    onChange={(e) => setProviderBaseURL(currentProvider, e.target.value)}
                    placeholder="https://api.example.com/v1"
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'general' && (
            <div>
              {/* 温度 */}
              <div className="form-group">
                <label>Temperature: {settings.temperature}</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(e) =>
                    updateSettings({ temperature: parseFloat(e.target.value) })
                  }
                />
              </div>

              {/* Max Tokens */}
              <div className="form-group">
                <label>Max Tokens</label>
                <input
                  type="number"
                  value={settings.maxTokens}
                  onChange={(e) =>
                    updateSettings({ maxTokens: parseInt(e.target.value) })
                  }
                  min="100"
                  max="32000"
                />
              </div>

              {/* 功能开关 */}
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.streamingEnabled}
                    onChange={(e) =>
                      updateSettings({ streamingEnabled: e.target.checked })
                    }
                  />
                  启用流式输出
                </label>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.enableThinking}
                    onChange={(e) =>
                      updateSettings({ enableThinking: e.target.checked })
                    }
                  />
                  显示思考过程
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SettingsPanel


// ==========================================
// 使用 AI 服务的示例代码
// 在 ChatContainer 中调用
// ==========================================

import { useStore } from '../store/useStore'
import aiService from '../services/aiService'

// 在组件内部
const handleSendMessage = async (input) => {
  const { text, images } = input
  const session = getCurrentSession()
  const provider = getCurrentProvider()
  const model = currentModel || provider.defaultModel

  // 1. 添加用户消息
  const userMessage = {
    id: `msg-${Date.now()}`,
    role: 'user',
    content: text,
    images,
    timestamp: Date.now()
  }
  addMessage(session.id, userMessage)

  // 2. 创建 AI 消息占位符
  const aiMessageId = `msg-${Date.now() + 1}`
  const aiMessage = {
    id: aiMessageId,
    role: 'assistant',
    content: '',
    timestamp: Date.now(),
    isStreaming: true
  }
  addMessage(session.id, aiMessage)

  try {
    // 3. 准备消息历史
    const messages = session.messages.map((msg) => ({
      role: msg.role,
      content: msg.content
    }))
    messages.push({ role: 'user', content: text })

    // 4. 流式调用 AI
    for await (const chunk of aiService.streamChat(
      currentProvider,
      messages,
      model,
      provider,
      settings
    )) {
      if (chunk.type === 'content') {
        // 更新消息内容
        updateMessage(session.id, aiMessageId, {
          content: (aiMessage.content || '') + chunk.content
        })
      } else if (chunk.type === 'done') {
        // 完成流式输出
        updateMessage(session.id, aiMessageId, {
          isStreaming: false
        })
      }
    }
  } catch (error) {
    console.error('AI 调用失败:', error)
    updateMessage(session.id, aiMessageId, {
      content: `错误: ${error.message}`,
      isStreaming: false,
      isError: true
    })
  }
}


// ==========================================
// 环境变量配置示例
// 文件: .env.local
// ==========================================

/*
# OpenAI
VITE_OPENAI_API_KEY=sk-proj-xxxxxxxxxxxx

# Anthropic
VITE_ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx

# Google
VITE_GOOGLE_API_KEY=AIzaxxxxxxxxxxxx

# 自定义 API (可选)
VITE_CUSTOM_API_URL=https://your-api.com/v1
VITE_CUSTOM_API_KEY=your-custom-key
*/


// ==========================================
// 部署到 Vercel 的步骤
// ==========================================

/*
1. 安装 Vercel CLI
   npm install -g vercel

2. 登录 Vercel
   vercel login

3. 部署项目
   vercel

4. 配置环境变量（在 Vercel 后台）
   - 进入项目设置
   - 添加环境变量
   - 重新部署

5. 生产部署
   vercel --prod
*/


// ==========================================
// 部署到 Cloudflare Pages 的步骤
// ==========================================

/*
1. 构建项目
   npm run build

2. 安装 Wrangler
   npm install -g wrangler

3. 登录 Cloudflare
   wrangler login

4. 部署
   wrangler pages deploy dist

5. 配置环境变量（在 Cloudflare 后台）
   - 进入 Pages 项目
   - Settings -> Environment variables
   - 添加变量
*/


// ==========================================
// 常用代码片段
// ==========================================

// 读取本地存储的 API Key
const getApiKeyFromStorage = (provider) => {
  return localStorage.getItem(`${provider}_api_key`)
}

// 保存 API Key 到本地存储
const saveApiKeyToStorage = (provider, apiKey) => {
  localStorage.setItem(`${provider}_api_key`, apiKey)
}

// 图片转 Base64
const imageToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// 压缩图片
const compressImage = (base64, maxWidth = 800) => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      let width = img.width
      let height = img.height

      if (width > maxWidth) {
        height = (height * maxWidth) / width
        width = maxWidth
      }

      canvas.width = width
      canvas.height = height
      ctx.drawImage(img, 0, 0, width, height)

      resolve(canvas.toDataURL('image/jpeg', 0.8))
    }
    img.src = base64
  })
}

// 复制到剪贴板
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('复制失败:', error)
    return false
  }
}

// 导出对话为 Markdown
const exportToMarkdown = (session) => {
  let markdown = `# ${session.name}\n\n`
  markdown += `创建时间: ${new Date(session.createdAt).toLocaleString()}\n\n`

  session.messages.forEach((msg) => {
    markdown += `## ${msg.role === 'user' ? '用户' : 'AI'}\n\n`
    markdown += `${msg.content}\n\n`
    markdown += `---\n\n`
  })

  return markdown
}

// 下载文件
const downloadFile = (content, filename, type = 'text/plain') => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
