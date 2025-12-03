import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
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

// 消息渲染组件 - Google AI Studio 风格
function MessageRenderer({ message }) {
  const { role, content, images, thinking, isStreaming } = message

  // 解析生成的图片
  const { images: generatedImages, textContent } = parseGeneratedImages(content || '')
  const hasGeneratedImages = generatedImages.length > 0

  return (
    <div className={`message-item ${role}`}>
      {/* 角色标签 */}
      <div className="message-role-header">
        <span className="role-label">{role === 'user' ? 'User' : 'Model'}</span>
        <span className="message-time">
          {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </span>
      </div>

      {/* 思考过程 */}
      {thinking && (
        <div className="thinking-block">
          <div className="thinking-header">
            <span className="thinking-icon">💭</span>
            <span>思考过程</span>
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
              alt={`上传的图片 ${idx + 1}`}
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
                alt={img.alt || '生成的图片'}
                className="generated-image"
              />
              <div className="image-actions">
                <a
                  href={img.src}
                  download={`generated-image-${Date.now()}.png`}
                  className="download-btn"
                >
                  下载
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
                return !inline ? (
                  <div className="code-block">
                    <div className="code-header">
                      <span className="code-language">{match ? match[1] : 'code'}</span>
                      <button
                        className="code-copy"
                        onClick={() => {
                          navigator.clipboard.writeText(String(children))
                        }}
                      >
                        复制
                      </button>
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
                      <img src={src} alt={alt || '图片'} className="generated-image" />
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
          {isStreaming && <span className="streaming-cursor">▊</span>}
        </div>
      )}
    </div>
  )
}

export default MessageRenderer
