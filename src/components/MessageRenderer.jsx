import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import 'highlight.js/styles/github-dark.css'
import './MessageRenderer.css'

// 消息渲染组件
function MessageRenderer({ message }) {
  const { role, content, images, thinking, isStreaming } = message

  return (
    <div className={`message-renderer ${role}`}>
      <div className="message-avatar">
        {role === 'user' ? '👤' : '🤖'}
      </div>

      <div className="message-content-wrapper">
        {/* 思考过程 */}
        {thinking && (
          <div className="thinking-block">
            <div className="thinking-header">
              <span className="thinking-icon">💭</span>
              <span>思考中...</span>
            </div>
            <div className="thinking-content">{thinking}</div>
          </div>
        )}

        {/* 图片预览 */}
        {images && images.length > 0 && (
          <div className="message-images">
            {images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`上传的图片 ${idx + 1}`}
                className="message-image"
              />
            ))}
          </div>
        )}

        {/* 消息内容 */}
        <div className="message-text">
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
              img({ node, ...props }) {
                return <img {...props} className="markdown-image" loading="lazy" />
              }
            }}
          >
            {content}
          </ReactMarkdown>

          {/* 流式输出光标 */}
          {isStreaming && <span className="streaming-cursor">▊</span>}
        </div>

        {/* 时间戳 */}
        <div className="message-timestamp">
          {new Date(message.timestamp).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </div>
  )
}

export default MessageRenderer
