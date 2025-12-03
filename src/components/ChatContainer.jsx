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
    generationMode,
    setGenerationMode,
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
    const trimmedText = text.trim()
    if (!trimmedText && (!images || images.length === 0)) return

    if (!mergedApiKey && currentProvider !== 'custom') {
      alert(`请先在设置中配置 ${provider?.name} 的 API Key`)
      setSettingsOpen(true)
      return
    }

    // 创建用户消息
    const modePrefix = generationMode === 'chat'
      ? ''
      : generationMode === 'image'
        ? '[Image Generation] '
        : '[Video Generation] '

    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: `${modePrefix}${trimmedText}`,
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
      messages.push({ role: 'user', content: `${modePrefix}${trimmedText}` })

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
          <div className="mode-switch">
            {[
              { id: 'chat', label: '对话' },
              { id: 'image', label: '图片' },
              { id: 'video', label: '视频' }
            ].map(mode => (
              <button
                key={mode.id}
                className={`mode-pill ${generationMode === mode.id ? 'active' : ''}`}
                onClick={() => setGenerationMode(mode.id)}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 消息区域 */}
      <div className="messages-area-new">
        {!session?.messages?.length ? (
          <div className="ai-studio-wireframe">
            <div className="wire-row">
              <div className="wire-card">
                <div className="wire-header">
                  <span className="wire-label">System Instructions (Optional)</span>
                  <button className="link-btn">Edit</button>
                </div>
                <p className="wire-body">You are a helpful coder that writes concise, well-documented code samples.</p>
              </div>
            </div>

            <div className="wire-row two-col">
              <div className="wire-card user">
                <div className="wire-header">
                  <span className="wire-label">User</span>
                </div>
                <p className="wire-body">Write a Python function that returns "Hello, world!".</p>
              </div>
              <div className="wire-card model">
                <div className="wire-header">
                  <span className="wire-label">Model Output</span>
                </div>
                <pre className="wire-code">
{`def hello_world():
    return "Hello, world!"`}
                </pre>
              </div>
            </div>

            <div className="wire-input">
              <input placeholder="Type something..." />
              <button className="wire-send">
                <Settings size={16} />
                Run
              </button>
            </div>
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
        <MultiModalInput onSend={handleSend} disabled={isLoading} mode={generationMode} />
      </div>

      {/* 设置面板 */}
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

export default ChatContainer
