import { useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import { Copy, Check, Edit2, RefreshCw, ChevronDown, ChevronUp, Code, Download, Eye } from 'lucide-react'
import 'highlight.js/styles/github-dark.css'
import './MessageRenderer.css'

// 解析内容中的 base64 图片
function parseGeneratedImages(content) {
  const imageRegex = /!\[([^\]]*)\]\((data:image\/[^)]+)\)/g
  const images = []
  let match

  while ((match = imageRegex.exec(content)) !== null) {
    images.push({
      alt: match[1],
      src: match[2]
    })
  }

  // 移除图片 markdown 语法，返回纯文本内容
  const textContent = content.replace(imageRegex, '').trim()

  return { images, textContent }
}

// 复制按钮组件
function CopyButton({ text, className = '' }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('复制失败:', err)
    }
  }, [text])

  return (
    <button
      className={`copy-btn ${copied ? 'copied' : ''} ${className}`}
      onClick={handleCopy}
      title={copied ? t('chat.copied') : t('chat.copy_code')}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      <span>{copied ? t('chat.copied') : t('chat.copy_code')}</span>
    </button>
  )
}

// 消息渲染组件 - Google AI Studio 风格
function MessageRenderer({
  message,
  onEdit,
  onRegenerate,
  isEditing = false,
  editContent = '',
  onEditChange,
  onEditSave,
  onEditCancel
}) {
  const { t } = useTranslation()
  const { role, content, images, thinking, isStreaming, isError } = message

  // 解析生成的图片
  const { images: generatedImages, textContent } = parseGeneratedImages(content || '')
  const hasGeneratedImages = generatedImages.length > 0

  // 生成状态显示
  const renderStreamingStatus = (compact = false) => {
    if (!isStreaming) return null

    return (
      <div className={`streaming-status ${compact ? 'compact' : ''}`}>
        <div className="streaming-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
        {!compact && <span className="streaming-text">{t('common.loading')}</span>}
      </div>
    )
  }

  return (
    <div className={`message-item ${role} ${isError ? 'error' : ''} ${isStreaming ? 'streaming' : ''}`}>
      {/* 角色标签 */}
      <div className="message-role-header">
        <div className="message-header-left">
          <div className={`message-avatar ${role}`}>
            <span className="avatar-symbol">{role === 'assistant' ? '✨' : '👤'}</span>
          </div>
          <div className="message-author">
            <div className="author-name-row">
              <span className="author-name">{role === 'user' ? 'User' : 'Wink AI'}</span>
              {role === 'assistant' && <span className="author-badge">APP</span>}
            </div>
            <div className="author-meta">
              <span className="role-label">{role === 'user' ? 'User' : 'Assistant'}</span>
              {isStreaming && renderStreamingStatus(true)}
            </div>
          </div>
        </div>
        <div className="message-header-actions">
          <span className="message-time">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
          {/* 用户消息的操作按钮 */}
          {role === 'user' && !isStreaming && onEdit && (
            <button
              className="action-btn"
              onClick={() => onEdit(message)}
              title={t('common.edit')}
            >
              <Edit2 size={14} />
            </button>
          )}
          {/* AI 消息的复制和重新生成按钮 */}
          {role === 'assistant' && !isStreaming && content && (
            <>
              <CopyButton text={content} className="action-btn" />
              {onRegenerate && (
                <button
                  className="action-btn"
                  onClick={() => onRegenerate(message)}
                  title={t('chat.regenerate')}
                >
                  <RefreshCw size={14} />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* 编辑模式 */}
      {isEditing ? (
        <div className="message-edit-area">
          <textarea
            className="edit-textarea"
            value={editContent}
            onChange={(e) => onEditChange(e.target.value)}
            autoFocus
          />
          <div className="edit-actions">
            <button className="edit-cancel-btn" onClick={onEditCancel}>
              {t('common.cancel')}
            </button>
            <button className="edit-save-btn" onClick={onEditSave}>
              {t('common.save')}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 思考过程 */}
          {thinking && (
            <div className="thinking-block">
              <div className="thinking-header">
                <span className="thinking-icon">💭</span>
                <span>{t('settings.thinking_label')}</span>
              </div>
              <div className="thinking-content">{thinking}</div>
            </div>
          )}

          {/* 用户上传的图片 */}
          {images && images.length > 0 && (
            <div className="uploaded-images">
              {images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Image ${idx + 1}`}
                  className="uploaded-image"
                />
              ))}
            </div>
          )}

          {/* AI 生成的图片 - 单独渲染 */}
          {hasGeneratedImages && (
            <div className="generated-images">
              {generatedImages.map((img, idx) => (
                <div key={idx} className="generated-image-container">
                  <img
                    src={img.src}
                    alt={img.alt || 'Generated Image'}
                    className="generated-image"
                  />
                  <div className="image-actions">
                    <a
                      href={img.src}
                      download={`generated-image-${Date.now()}.png`}
                      className="download-btn"
                    >
                      {t('common.export')}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 消息文本内容 */}
          {(textContent || !hasGeneratedImages) && (
            <div className="message-body">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight, rehypeRaw]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    const codeString = String(children).replace(/\n$/, '')
                    const language = match ? match[1] : 'code'

                    // 下载代码文件
                    const handleDownload = () => {
                      const ext = language === 'javascript' ? 'js' :
                                  language === 'typescript' ? 'ts' :
                                  language === 'python' ? 'py' :
                                  language === 'html' ? 'html' :
                                  language === 'css' ? 'css' :
                                  language === 'json' ? 'json' :
                                  language === 'markdown' ? 'md' :
                                  language === 'java' ? 'java' :
                                  language === 'go' ? 'go' :
                                  language === 'rust' ? 'rs' :
                                  language === 'ruby' ? 'rb' :
                                  language === 'php' ? 'php' :
                                  language === 'swift' ? 'swift' :
                                  language === 'kotlin' ? 'kt' :
                                  language === 'shell' || language === 'bash' ? 'sh' :
                                  'txt'
                      const blob = new Blob([codeString], { type: 'text/plain' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = `code-${Date.now()}.${ext}`
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                      URL.revokeObjectURL(url)
                    }

                    return !inline ? (
                      <div className="code-block">
                        <div className="code-header">
                          <div className="code-language-wrapper">
                            <Code size={14} className="code-icon" />
                            <span className="code-language">{language}</span>
                          </div>
                          <div className="code-actions">
                            <button
                              className="code-action-btn"
                              onClick={handleDownload}
                              title={t('common.export')}
                            >
                              <Download size={14} />
                            </button>
                            <CopyButton text={codeString} />
                          </div>
                        </div>
                        <pre className={className}>
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                      </div>
                    ) : (
                      <code className="inline-code" {...props}>
                        {children}
                      </code>
                    )
                  },
                  a({ node, children, ...props }) {
                    return (
                      <a {...props} target="_blank" rel="noopener noreferrer">
                        {children}
                      </a>
                    )
                  },
                  img({ node, src, alt, ...props }) {
                    // 处理可能遗漏的 base64 图片
                    if (src && src.startsWith('data:image/')) {
                      return (
                        <div className="generated-image-container inline">
                          <img src={src} alt={alt || 'Image'} className="generated-image" />
                        </div>
                      )
                    }
                    return <img src={src} alt={alt} {...props} className="markdown-image" loading="lazy" />
                  }
                }}
              >
                {textContent || content}
              </ReactMarkdown>

              {/* 流式输出光标 */}
              {isStreaming && <span className="streaming-cursor"></span>}
            </div>
          )}

          {/* 消息底部复制按钮（整条消息） */}
          {role === 'assistant' && !isStreaming && textContent && (
            <div className="message-footer">
              <CopyButton text={textContent || content} className="footer-copy-btn" />
            </div>
          )}
        </>
      )}
    </div>
  )
}

// 消息分组组件 - 25条消息为一组
function MessageGroup({ messages, groupIndex, totalGroups, isExpanded, onToggle, ...messageProps }) {
  const { t } = useTranslation()
  const startIndex = groupIndex * 25
  const endIndex = Math.min(startIndex + 25, messages.length)
  const groupMessages = messages.slice(startIndex, endIndex)
  const isLatestGroup = groupIndex === totalGroups - 1

  // 最新的组默认展开，历史组默认折叠
  if (!isLatestGroup && !isExpanded) {
    return (
      <div className="message-group collapsed">
        <button className="group-toggle" onClick={onToggle}>
          <ChevronDown size={16} />
          <span>Show messages {startIndex + 1} - {endIndex} ({groupMessages.length})</span>
        </button>
      </div>
    )
  }

  return (
    <div className="message-group">
      {!isLatestGroup && (
        <button className="group-toggle expanded" onClick={onToggle}>
          <ChevronUp size={16} />
          <span>Hide messages {startIndex + 1} - {endIndex}</span>
        </button>
      )}
      {groupMessages.map((message) => (
        <MessageRenderer key={message.id} message={message} {...messageProps} />
      ))}
    </div>
  )
}

export { MessageRenderer, MessageGroup, CopyButton }
export default MessageRenderer
