import { useState, useRef, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'
import { toast } from 'react-hot-toast'
import aiService from '../services/aiService'
import { MessageRenderer, MessageGroup } from './MessageRenderer'
import MultiModalInput from './MultiModalInput'
import SettingsPanel from './SettingsPanel'
import './ChatContainer.css'

const MESSAGES_PER_GROUP = 25

function ChatContainer() {
  const { t } = useTranslation()
  const {
    getCurrentSession,
    getCurrentProvider,
    currentProvider,
    currentModel,
    settings,
    generationMode,
    providers,
    dynamicModels,
    customModels,
    setCurrentProvider,
    setCurrentModel,
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
  const session = getCurrentSession()
  const provider = getCurrentProvider()
  const mergedModels = useMemo(() => {
    const defaults = providers?.[currentProvider]?.models || []
    const dynamic = dynamicModels?.[currentProvider] || []
    const custom = customModels?.[currentProvider] || []
    const all = [
      ...defaults.map(id => ({ id, name: id })),
      ...dynamic,
      ...custom
    ]
    return Array.from(new Map(all.map(m => [m.id, m])).values())
  }, [providers, dynamicModels, customModels, currentProvider])
  const mergedApiKey = aiService.getApiKey(currentProvider)
  const mergedEndpoint = aiService.getApiEndpoint(currentProvider)
  const providerConfig = {
    ...(provider || {}),
    apiKey: mergedApiKey,
    baseURL: mergedEndpoint,
    projectId: provider?.projectId,
    location: provider?.location
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
      toast.error(t('settings.api_key_placeholder', { provider: provider?.name }))
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
        content: msg.content,
        images: msg.images
      }))
      messages.push({ role: 'user', content: `${modePrefix}${trimmedText}`, images })

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
            enableSearch: settings.enableSearch,
            mode: generationMode
          }
        )) {
          if (chunk.type === 'content') {
            fullContent += chunk.content
            updateMessage(session.id, aiMessageId, {
              content: fullContent
            })
          } else if (chunk.type === 'usage') {
            updateMessage(session.id, aiMessageId, {
              usage: chunk.usage
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
            enableSearch: settings.enableSearch,
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
      toast.error(`${t('common.error')}: ${error.message}`)
      updateMessage(session.id, aiMessageId, {
        content: `❌ ${t('common.error')}: ${error.message}`,
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
    <div className="chat-container-wrapper">
      {/* 消息区域 */}
      <div className="messages-area-new">
        {!session?.messages?.length ? (
          <div className="welcome-screen">
            <div className="welcome-icon">✨</div>
            <h2>{t('chat.welcome_title')}</h2>
            <p>{t('chat.welcome_desc')}</p>
            <div className="feature-list">
              <div className="feature-item">💬 {t('chat.feature_chat')}</div>
              <div className="feature-item">🖼️ {t('chat.feature_image_gen')}</div>
              <div className="feature-item">📷 {t('chat.feature_image_vision')}</div>
              <div className="feature-item">🎬 {t('chat.feature_video')}</div>
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
      <div className="input-area-new">
        <MultiModalInput onSend={handleSend} disabled={isLoading} mode={generationMode} />
      </div>

      {/* 设置面板 */}
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

export default ChatContainer