import { useMemo } from 'react'
import { useStore } from '../store/useStore'
import { X, Settings as SettingsIcon, Trash2, Clock, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import './RightPanel.css'

function RightPanel({ isOpen, onClose }) {
  const {
    uiState,
    providers,
    currentProvider,
    currentModel,
    settings,
    setCurrentProvider,
    setCurrentModel,
    updateSettings,
    dynamicModels,
    customModels,
    imageLibrary,
    videoLibrary,
    deleteFromImageLibrary,
    deleteFromVideoLibrary
  } = useStore()
  
  const [copiedId, setCopiedId] = useState(null)

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const provider = providers[currentProvider]

  // 动态生成提供商列表
  const providerEntries = useMemo(
    () => Object.entries(providers || {}),
    [providers]
  )

  // 获取合并后的模型列表（默认 + 动态 + 自定义）
  const getMergedModels = (providerKey) => {
    // 默认模型（从 providers 配置中获取）
    const defaultModels = providers[providerKey]?.models || []

    // 动态获取的模型
    const dynamic = dynamicModels[providerKey] || []

    // 自定义模型
    const custom = customModels[providerKey] || []

    // 合并所有模型
    const allModels = [
      ...defaultModels.map(id => ({ id, name: id })),
      ...dynamic,
      ...custom
    ]

    // 去重（基于 id）
    const uniqueModels = Array.from(
      new Map(allModels.map(m => [m.id, m])).values()
    )

    return uniqueModels
  }

  const mergedModels = getMergedModels(currentProvider)

  // 渲染聊天/通用设置内容
  const renderChatSettings = () => (
    <>
      {/* 模型选择 */}
      <section className="panel-section">
        <div className="control-row">
          <div>
            <p className="section-title">AI 提供商</p>
            <select
              className="panel-select"
              value={currentProvider}
              onChange={(e) => setCurrentProvider(e.target.value)}
            >
              {providerEntries.map(([key, config]) => (
                <option key={key} value={key}>
                  {config.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="section-title">模型</p>
            <select
              className="panel-select"
              value={currentModel || provider?.defaultModel || ''}
              onChange={(e) => setCurrentModel(e.target.value)}
            >
              {mergedModels.length > 0 ? (
                mergedModels.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))
              ) : (
                <option value="">请先配置 API Key</option>
              )}
            </select>
          </div>
        </div>
      </section>

      {/* 参数配置 */}
      <section className="panel-section">
        <div className="section-header">
          <h4>模型参数</h4>
          <span className="section-hint">对齐 Google AI Studio 控制</span>
        </div>
        <div className="param-item">
          <label>
            <span>Temperature</span>
            <span className="param-value">{settings.temperature.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={settings.temperature}
            onChange={(e) => updateSettings({ temperature: parseFloat(e.target.value) })}
          />
        </div>

        <div className="param-item">
          <label>
            <span>Max Tokens</span>
            <span className="param-value">{settings.maxTokens}</span>
          </label>
          <input
            type="range"
            min="100"
            max="32768"
            step="256"
            value={settings.maxTokens}
            onChange={(e) => updateSettings({ maxTokens: parseInt(e.target.value) })}
          />
        </div>
      </section>

      {/* 功能开关 */}
      <section className="panel-section">
        <div className="section-header">
          <h4>安全与功能</h4>
          <button className="link-btn" onClick={() => onClose?.()}>
            编辑
          </button>
        </div>

        <label className="switch-item">
          <input
            type="checkbox"
            checked={settings.streamingEnabled}
            onChange={(e) => updateSettings({ streamingEnabled: e.target.checked })}
          />
          <span>流式输出</span>
        </label>

        <label className="switch-item">
          <input
            type="checkbox"
            checked={settings.enableThinking}
            onChange={(e) => updateSettings({ enableThinking: e.target.checked })}
          />
          <span>思考模式</span>
        </label>

        <label className="switch-item">
          <input
            type="checkbox"
            checked={settings.enableSearch}
            onChange={(e) => updateSettings({ enableSearch: e.target.checked })}
          />
          <span>搜索功能</span>
        </label>
      </section>
    </>
  )

  // 渲染图片历史
  const renderImageHistory = () => (
    <div className="history-list">
      {imageLibrary.length === 0 ? (
        <div className="empty-history">
          <Clock size={48} opacity={0.2} />
          <p>暂无生成记录</p>
        </div>
      ) : (
        [...imageLibrary].reverse().map((img) => (
          <div key={img.id} className="history-item">
            <div className="history-media">
              <img src={img.url} alt={img.prompt} />
            </div>
            <div className="history-info">
              <p className="history-prompt" title={img.prompt}>{img.prompt}</p>
              <div className="history-actions">
                <span className="history-date">{new Date(img.createdAt).toLocaleTimeString()}</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button 
                    className="delete-btn" 
                    onClick={() => handleCopy(img.prompt, img.id)}
                    title="复制提示词"
                  >
                    {copiedId === img.id ? <Check size={14} color="#4caf50" /> : <Copy size={14} />}
                  </button>
                  <button 
                    className="delete-btn" 
                    onClick={() => deleteFromImageLibrary(img.id)}
                    title="删除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )

  // 渲染视频历史
  const renderVideoHistory = () => (
    <div className="history-list">
      {videoLibrary.length === 0 ? (
        <div className="empty-history">
          <Clock size={48} opacity={0.2} />
          <p>暂无生成记录</p>
        </div>
      ) : (
        [...videoLibrary].reverse().map((vid) => (
          <div key={vid.id} className="history-item">
            <div className="history-media">
              <video src={vid.url} controls preload="metadata" />
            </div>
            <div className="history-info">
              <p className="history-prompt" title={vid.prompt}>{vid.prompt}</p>
              <div className="history-actions">
                <span className="history-date">{new Date(vid.createdAt).toLocaleTimeString()}</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button 
                    className="delete-btn" 
                    onClick={() => handleCopy(vid.prompt, vid.id)}
                    title="复制提示词"
                  >
                    {copiedId === vid.id ? <Check size={14} color="#4caf50" /> : <Copy size={14} />}
                  </button>
                  <button 
                    className="delete-btn" 
                    onClick={() => deleteFromVideoLibrary(vid.id)}
                    title="删除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )

  // 根据当前标签页决定显示内容
  const getPanelContent = () => {
    switch (uiState.leftActiveTab) {
      case 'image':
        return {
          title: 'Image History',
          subtitle: 'Generated Images',
          content: renderImageHistory()
        }
      case 'video':
        return {
          title: 'Video History',
          subtitle: 'Generated Videos',
          content: renderVideoHistory()
        }
      case 'chat':
      case 'settings':
      default:
        return {
          title: 'Parameters',
          subtitle: 'Run Settings',
          content: renderChatSettings()
        }
    }
  }

  const { title, subtitle, content } = getPanelContent()

  return (
    <div className={`right-panel ${isOpen ? 'open' : 'closed'}`}>
      {/* 头部 */}
      <div className="panel-header">
        <div>
          <p className="panel-eyebrow">{subtitle}</p>
          <h3>{title}</h3>
        </div>
        <button className="close-btn" onClick={onClose} title="关闭">
          <X size={18} />
        </button>
      </div>

      {/* 内容区域 */}
      <div className="panel-content">
        {content}
      </div>
      
      {/* 简单的内联样式用于历史记录列表 (建议移至 CSS 文件) */}
      <style>{`
        .panel-content {
          flex: 1;
          overflow-y: auto;
        }
        .history-list {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .empty-history {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 0;
          color: var(--text-tertiary);
          gap: 12px;
        }
        .history-item {
          background: var(--bg-tertiary);
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid var(--border-secondary);
        }
        .history-media {
          width: 100%;
          aspect-ratio: 16/9;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .history-media img, .history-media video {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .history-info {
          padding: 12px;
        }
        .history-prompt {
          font-size: 12px;
          color: var(--text-primary);
          margin: 0 0 8px 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.4;
        }
        .history-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .history-date {
          font-size: 10px;
          color: var(--text-tertiary);
        }
        .delete-btn {
          background: none;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          transition: all 0.2s;
        }
        .delete-btn:hover {
          color: #ff4444;
          background: rgba(255, 68, 68, 0.1);
        }
      `}</style>
    </div>
  )
}

export default RightPanel
