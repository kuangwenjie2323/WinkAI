import { useState, useRef, useEffect } from 'react'
import { useStore } from '../store/useStore'
import aiService from '../services/aiService'
import MessageRenderer from './MessageRenderer'
import MultiModalInput from './MultiModalInput'
import SettingsPanel from './SettingsPanel'
import { Settings } from 'lucide-react'
import './ChatContainer.css'

function ChatContainer() {
  const {
    getCurrentSession,
    getCurrentProvider,
    currentProvider,
    currentModel,
    settings,
    addMessage,
    updateMessage
  } = useStore()

  const [isLoading, setIsLoading] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const messagesEndRef = useRef(null)
  const session = getCurrentSession()
  const provider = getCurrentProvider()
  const mergedApiKey = aiService.getApiKey(currentProvider)
  const mergedEndpoint = aiService.getApiEndpoint(currentProvider)
  const providerConfig = {
    ...(provider || {}),
    apiKey: mergedApiKey,
    baseURL: mergedEndpoint
  }

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [session?.messages])

  // 发送消息
  const handleSend = async (input) => {
    const { text, images } = input

    if (!mergedApiKey && currentProvider !== 'custom') {
      alert(`请先在设置中配置 ${provider?.name} 的 API Key`)
      setSettingsOpen(true)
      return
    }

    // 创建用户消息
    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      images,
      timestamp: Date.now()
    }
    addMessage(session.id, userMessage)

    // 创建AI消息占位符
    const aiMessageId = `msg-${Date.now() + 1}`
    const aiMessage = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true
    }
    addMessage(session.id, aiMessage)

    setIsLoading(true)

    try {
      // 准备消息历史
      const messages = session.messages.map((msg) => ({
        role: msg.role,
        content: msg.content
      }))
      messages.push({ role: 'user', content: text })

      const model = currentModel || provider.defaultModel

      if (settings.streamingEnabled) {
        // 流式输出
        let fullContent = ''
        for await (const chunk of aiService.streamChat(
          currentProvider,
          messages,
          model,
          providerConfig,
          {
            temperature: settings.temperature,
            maxTokens: settings.maxTokens
          }
        )) {
          if (chunk.type === 'content') {
            fullContent += chunk.content
            updateMessage(session.id, aiMessageId, {
              content: fullContent
            })
          } else if (chunk.type === 'done') {
            updateMessage(session.id, aiMessageId, {
              isStreaming: false
            })
          }
        }
      } else {
        // 非流式
        const response = await aiService.chat(
          currentProvider,
          messages,
          model,
          providerConfig,
          {
            temperature: settings.temperature,
            maxTokens: settings.maxTokens
          }
        )
        updateMessage(session.id, aiMessageId, {
          content: response.content,
          isStreaming: false
        })
      }
    } catch (error) {
      console.error('AI调用失败:', error)
      updateMessage(session.id, aiMessageId, {
        content: `❌ 错误: ${error.message}`,
        isStreaming: false,
        isError: true
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="chat-container-wrapper">
      <div className="canvas-header">
        <div className="canvas-titles">
          <div className="eyebrow">Run</div>
          <h2 className="canvas-title">Gemini 调试面板</h2>
          <p className="canvas-subtitle">Google AI Studio 风格的多模态对话体验</p>
        </div>
        <div className="canvas-chips">
          <span className="canvas-chip">
            提供商 · {provider?.name}
          </span>
          <span className="canvas-chip">
            模型 · {currentModel || provider?.defaultModel}
          </span>
          <span className={`canvas-chip ${settings.streamingEnabled ? 'chip-on' : 'chip-off'}`}>
            流式 {settings.streamingEnabled ? '开启' : '关闭'}
          </span>
        </div>
      </div>

      {/* 消息区域 */}
      <div className="messages-area-new">
        {!session?.messages?.length ? (
          <div className="welcome-screen">
            <div className="welcome-icon">🤖</div>
            <h2>欢迎使用 WinkAI</h2>
            <p>一个功能强大的多模态 AI Agent</p>
            <div className="feature-list">
              <div className="feature-item">💬 支持多个 AI 提供商</div>
              <div className="feature-item">🖼️ 图片识别和分析</div>
              <div className="feature-item">⚡ 实时流式输出</div>
              <div className="feature-item">📝 Markdown 和代码高亮</div>
            </div>
            {!mergedApiKey && currentProvider !== 'custom' && (
              <button className="setup-btn" onClick={() => setSettingsOpen(true)}>
                <Settings size={18} />
                开始配置
              </button>
            )}
          </div>
        ) : (
          <div className="messages-list-new">
            {session.messages.map((message) => (
              <MessageRenderer key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <div className="input-area-new">
        <MultiModalInput onSend={handleSend} disabled={isLoading} />
      </div>

      {/* 设置面板 */}
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

export default ChatContainer
