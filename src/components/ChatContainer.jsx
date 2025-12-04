import { useState, useRef, useEffect, useMemo } from 'react'
import { useStore } from '../store/useStore'
import aiService from '../services/aiService'
import { MessageRenderer, MessageGroup } from './MessageRenderer'
import MultiModalInput from './MultiModalInput'
import SettingsPanel from './SettingsPanel'
import { Settings } from 'lucide-react'
import './ChatContainer.css'

const MESSAGES_PER_GROUP = 25

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
    updateMessage,
    deleteMessagesAfter
  } = useStore()

  const [isLoading, setIsLoading] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [editContent, setEditContent] = useState('')
  const [expandedGroups, setExpandedGroups] = useState({})
  const messagesEndRef = useRef(null)
  const inputAreaRef = useRef(null)
  const chatWrapperRef = useRef(null)
  const session = getCurrentSession()
  const provider = getCurrentProvider()
  const mergedApiKey = aiService.getApiKey(currentProvider)
  const mergedEndpoint = aiService.getApiEndpoint(currentProvider)
  const providerConfig = {
    ...(provider || {}),
    apiKey: mergedApiKey,
    baseURL: mergedEndpoint
  }

  // 计算消息分组
  const messageGroups = useMemo(() => {
    if (!session?.messages?.length) return []
    const totalMessages = session.messages.length
    const totalGroups = Math.ceil(totalMessages / MESSAGES_PER_GROUP)
    return Array.from({ length: totalGroups }, (_, i) => i)
  }, [session?.messages?.length])

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [session?.messages])

  useEffect(() => {
    const updateComposerHeight = () => {
      const composerHeight = inputAreaRef.current?.offsetHeight || 0
      if (chatWrapperRef.current) {
        chatWrapperRef.current.style.setProperty('--composer-height', `${composerHeight}px`)
      }
    }

    updateComposerHeight()
    window.addEventListener('resize', updateComposerHeight)

    return () => {
      window.removeEventListener('resize', updateComposerHeight)
    }
  }, [session?.messages?.length, isLoading])

  // 切换分组展开状态
  const toggleGroupExpanded = (groupIndex) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupIndex]: !prev[groupIndex]
    }))
  }

  // 发送消息的核心逻辑
  const sendMessageCore = async (text, images = null, messageHistory = null) => {
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
      const baseMessages = messageHistory || session.messages
      const messages = baseMessages.map((msg) => ({
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
            maxTokens: settings.maxTokens,
            mode: generationMode
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
            maxTokens: settings.maxTokens,
            mode: generationMode
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

  // 发送消息
  const handleSend = async (input) => {
    const { text, images } = input
    await sendMessageCore(text, images)
  }

  // 编辑消息
  const handleEdit = (message) => {
    setEditingMessageId(message.id)
    // 移除模式前缀
    const content = message.content
      .replace(/^\[Image Generation\] /, '')
      .replace(/^\[Video Generation\] /, '')
    setEditContent(content)
  }

  // 保存编辑并重新生成
  const handleEditSave = async () => {
    if (!editingMessageId || !editContent.trim()) return

    // 找到被编辑消息的索引
    const messageIndex = session.messages.findIndex(m => m.id === editingMessageId)
    if (messageIndex === -1) return

    // 删除该消息及之后的所有消息
    const messagesBeforeEdit = session.messages.slice(0, messageIndex)

    // 清除编辑状态
    const contentToSend = editContent.trim()
    setEditingMessageId(null)
    setEditContent('')

    // 删除该消息及之后的消息
    if (deleteMessagesAfter) {
      deleteMessagesAfter(session.id, editingMessageId)
    }

    // 发送编辑后的消息
    await sendMessageCore(contentToSend, null, messagesBeforeEdit)
  }

  // 取消编辑
  const handleEditCancel = () => {
    setEditingMessageId(null)
    setEditContent('')
  }

  // 重新生成
  const handleRegenerate = async (message) => {
    // 找到该 AI 消息对应的用户消息
    const messageIndex = session.messages.findIndex(m => m.id === message.id)
    if (messageIndex <= 0) return

    // 找到前一条用户消息
    let userMessageIndex = messageIndex - 1
    while (userMessageIndex >= 0 && session.messages[userMessageIndex].role !== 'user') {
      userMessageIndex--
    }

    if (userMessageIndex < 0) return

    const userMessage = session.messages[userMessageIndex]
    const messagesBeforeRegenerate = session.messages.slice(0, userMessageIndex)

    // 删除从用户消息开始的所有消息
    if (deleteMessagesAfter) {
      deleteMessagesAfter(session.id, userMessage.id)
    }

    // 重新发送用户消息
    const content = userMessage.content
      .replace(/^\[Image Generation\] /, '')
      .replace(/^\[Video Generation\] /, '')

    await sendMessageCore(content, userMessage.images, messagesBeforeRegenerate)
  }

  return (
    <div className="chat-container-wrapper" ref={chatWrapperRef}>
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
            {messageGroups.length <= 1 ? (
              // 少于25条消息，直接显示
              session.messages.map((message) => (
                <MessageRenderer
                  key={message.id}
                  message={message}
                  onEdit={handleEdit}
                  onRegenerate={handleRegenerate}
                  isEditing={editingMessageId === message.id}
                  editContent={editContent}
                  onEditChange={setEditContent}
                  onEditSave={handleEditSave}
                  onEditCancel={handleEditCancel}
                />
              ))
            ) : (
              // 超过25条消息，分组显示
              messageGroups.map((groupIndex) => (
                <MessageGroup
                  key={groupIndex}
                  messages={session.messages}
                  groupIndex={groupIndex}
                  totalGroups={messageGroups.length}
                  isExpanded={expandedGroups[groupIndex] || false}
                  onToggle={() => toggleGroupExpanded(groupIndex)}
                  onEdit={handleEdit}
                  onRegenerate={handleRegenerate}
                  isEditing={editingMessageId}
                  editContent={editContent}
                  onEditChange={setEditContent}
                  onEditSave={handleEditSave}
                  onEditCancel={handleEditCancel}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 输入区域 */}
      <div className="input-area-new" ref={inputAreaRef}>
        <MultiModalInput onSend={handleSend} disabled={isLoading} mode={generationMode} />
      </div>

      {/* 设置面板 */}
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

export default ChatContainer
