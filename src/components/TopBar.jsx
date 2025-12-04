import { useState, useRef, useEffect, useMemo } from 'react'
import { useStore } from '../store/useStore'
import aiService from '../services/aiService'
import {
  Settings,
  Sun,
  Moon,
  PanelRightClose,
  PanelRightOpen,
  Trash2,
  Sparkles,
  Menu,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react'
import './TopBar.css'

function TopBar({ onThemeToggle, onSettingsOpen, theme }) {
  const {
    uiState,
    toggleRightPanel,
    setLeftSidebarOpen,
    getCurrentSession,
    clearSession,
    getCurrentProvider,
    currentProvider,
    currentModel,
    settings,
    generationMode,
    setGenerationMode,
    providers,
    dynamicModels,
    customModels,
    setCurrentProvider,
    setCurrentModel,
    updateSettings
  } = useStore()
  const session = getCurrentSession()
  const provider = getCurrentProvider()

  const [configOpen, setConfigOpen] = useState(false)
  const configRef = useRef(null)

  // 合并模型列表
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

  // 点击外部关闭配置菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (configRef.current && !configRef.current.contains(event.target)) {
        setConfigOpen(false)
      }
    }
    if (configOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [configOpen])

  const handleClear = () => {
    if (session?.messages?.length && window.confirm('确定要清空当前对话吗？')) {
      clearSession(session.id)
    }
  }

  const toggleLeftSidebar = () => {
    setLeftSidebarOpen(!uiState.leftSidebarOpen)
  }

  return (
    <div className="topbar">
      <div className="topbar-left">
        {/* 移动端菜单按钮 */}
        <button
          className="icon-btn menu-btn"
          onClick={toggleLeftSidebar}
          title="菜单"
        >
          <Menu size={20} />
        </button>

        <div className="brand">
          <div className="brand-mark">
            <Sparkles size={18} />
          </div>
          <span className="brand-title">WinkAI</span>
        </div>

        {/* 配置下拉框 */}
        <div className="config-dropdown" ref={configRef}>
          <button className="config-trigger" onClick={() => setConfigOpen(!configOpen)}>
            <SlidersHorizontal size={14} />
            <span className="config-summary">
              {provider?.name} · {currentModel || provider?.defaultModel}
            </span>
            <span className="config-mode">
              {generationMode === 'chat' ? '对话' : generationMode === 'image' ? '图片' : '视频'}
            </span>
            <ChevronDown size={12} className={configOpen ? 'rotated' : ''} />
          </button>
          {configOpen && (
            <div className="config-menu">
              <div className="config-row">
                <label>提供商</label>
                <select
                  value={currentProvider}
                  onChange={(e) => setCurrentProvider(e.target.value)}
                >
                  {Object.entries(providers || {}).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.name}</option>
                  ))}
                </select>
              </div>
              <div className="config-row">
                <label>模型</label>
                <select
                  value={currentModel || provider?.defaultModel || ''}
                  onChange={(e) => setCurrentModel(e.target.value)}
                >
                  {mergedModels.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="config-row">
                <label>模式</label>
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
              <div className="config-row toggles">
                <label>功能</label>
                <div className="toggle-list">
                  <button
                    className={`mini-toggle ${settings.streamingEnabled ? 'on' : ''}`}
                    onClick={() => updateSettings({ streamingEnabled: !settings.streamingEnabled })}
                  >
                    流式
                  </button>
                  <button
                    className={`mini-toggle ${settings.enableThinking ? 'on' : ''}`}
                    onClick={() => updateSettings({ enableThinking: !settings.enableThinking })}
                  >
                    思考
                  </button>
                  <button
                    className={`mini-toggle ${settings.enableSearch ? 'on' : ''}`}
                    onClick={() => updateSettings({ enableSearch: !settings.enableSearch })}
                  >
                    搜索
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="topbar-right">
        <button
          className="icon-btn"
          onClick={handleClear}
          disabled={!session?.messages?.length}
          title="清空对话"
        >
          <Trash2 size={18} />
        </button>

        <button
          className="icon-btn"
          onClick={toggleRightPanel}
          title={uiState.rightPanelOpen ? '关闭控制面板' : '打开控制面板'}
        >
          {uiState.rightPanelOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
        </button>

        <button
          className="icon-btn"
          onClick={onThemeToggle}
          title={theme === 'light' ? '切换到暗色模式' : '切换到亮色模式'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <button
          className="icon-btn"
          onClick={onSettingsOpen}
          title="设置"
        >
          <Settings size={18} />
        </button>
      </div>
    </div>
  )
}

export default TopBar
