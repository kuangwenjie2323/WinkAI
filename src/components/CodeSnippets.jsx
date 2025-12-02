import { useStore } from '../store/useStore'
import { Code, Trash2, Copy } from 'lucide-react'
import './CodeSnippets.css'

function CodeSnippets() {
  const { codeSnippets, deleteCodeSnippet } = useStore()

  const handleDelete = (e, snippetId) => {
    e.stopPropagation()
    if (window.confirm('确定要删除这个代码片段吗？')) {
      deleteCodeSnippet(snippetId)
    }
  }

  const handleSnippetClick = (snippet) => {
    // TODO: 插入到输入框
    console.log('Snippet clicked:', snippet)
  }

  const handleCopy = (e, code) => {
    e.stopPropagation()
    navigator.clipboard.writeText(code)
    // TODO: 显示复制成功提示
  }

  const getLanguageColor = (language) => {
    const colors = {
      javascript: '#f7df1e',
      typescript: '#3178c6',
      python: '#3776ab',
      java: '#007396',
      go: '#00add8',
      rust: '#dea584',
      cpp: '#00599c',
      html: '#e34f26',
      css: '#1572b6',
      default: 'var(--text-tertiary)'
    }
    return colors[language?.toLowerCase()] || colors.default
  }

  return (
    <div className="library-container">
      <div className="library-header">
        <span className="library-label">代码片段</span>
        <span className="library-count">{codeSnippets.length}</span>
      </div>

      {codeSnippets.length === 0 ? (
        <div className="library-empty">
          <Code size={40} />
          <p>暂无代码片段</p>
          <span>保存常用代码以便快速插入</span>
        </div>
      ) : (
        <div className="snippets-list">
          {codeSnippets.map((snippet) => (
            <div
              key={snippet.id}
              className="snippet-item"
              onClick={() => handleSnippetClick(snippet)}
            >
              <div className="snippet-header">
                <div className="snippet-title-row">
                  <Code size={14} />
                  <span className="snippet-title">{snippet.title}</span>
                </div>
                <div className="snippet-actions">
                  <button
                    className="snippet-action-btn"
                    onClick={(e) => handleCopy(e, snippet.code)}
                    title="复制代码"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    className="snippet-action-btn delete-btn"
                    onClick={(e) => handleDelete(e, snippet.id)}
                    title="删除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {snippet.language && (
                <div className="snippet-language">
                  <span
                    className="language-dot"
                    style={{ backgroundColor: getLanguageColor(snippet.language) }}
                  />
                  {snippet.language}
                </div>
              )}

              <pre className="snippet-code">
                <code>{snippet.code}</code>
              </pre>

              {snippet.tags && snippet.tags.length > 0 && (
                <div className="snippet-tags">
                  {snippet.tags.map((tag, index) => (
                    <span key={index} className="snippet-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CodeSnippets
