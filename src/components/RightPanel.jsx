import { useMemo } from 'react'
import { useStore } from '../store/useStore'
import { X, Settings as SettingsIcon } from 'lucide-react'
import './RightPanel.css'

function RightPanel({ isOpen, onClose }) {
  const {
    providers,
    currentProvider,
    currentModel,
    settings,
    setCurrentProvider,
    setCurrentModel,
    updateSettings,
    dynamicModels,
    customModels
  } = useStore()

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

  return (
    <div className={`right-panel ${isOpen ? 'open' : 'closed'}`}>
      {/* 头部 */}
      <div className="panel-header">
        <div>
          <p className="panel-eyebrow">Run Settings</p>
          <h3>Parameters</h3>
        </div>
        <button className="close-btn" onClick={onClose} title="关闭">
          <X size={18} />
        </button>
      </div>

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
    </div>
  )
}

export default RightPanel
