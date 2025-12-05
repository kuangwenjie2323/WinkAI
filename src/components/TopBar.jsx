import { useState, useRef, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'
import aiService from '../services/aiService'
import { exportToMarkdown, exportToJson } from '../utils/exportUtils'
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
  ChevronDown,
  Download,
  FileJson
} from 'lucide-react'
import './TopBar.css'

function TopBar({ onThemeToggle, onSettingsOpen, theme }) {
  const { t } = useTranslation()
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
    if (session?.messages?.length && window.confirm(t('topbar.clear_confirm'))) {
      clearSession(session.id)
    }
  }

  const handleExportMarkdown = () => {
    if (session?.messages?.length) {
      exportToMarkdown(session.messages, session.name)
    }
  }

  const handleExportJson = () => {
    if (session?.messages?.length) {
      exportToJson(session.messages, session.name)
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
          title={t('topbar.menu')}
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
              {generationMode === 'chat' ? t('chat.model_mode_chat') : generationMode === 'image' ? t('chat.model_mode_image') : t('chat.model_mode_video')}
            </span>
            <ChevronDown size={12} className={configOpen ? 'rotated' : ''} />
          </button>
          {/* 移动端遮罩层 */}
          {configOpen && <div className="config-overlay" onClick={() => setConfigOpen(false)} />}
          {configOpen && (
            <div className="config-menu">
              <div className="config-row">
                <label>{t('settings.tab_providers')}</label>
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
                <label>{t('settings.model_label')}</label>
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
                <label>{t('chat.feature_chat')}</label> {/* 这里可能复用 label 或专门建一个 mode label */}
                <div className="mode-switch">
                  {[
                    { id: 'chat', label: t('chat.model_mode_chat') },
                    { id: 'image', label: t('chat.model_mode_image') },
                    { id: 'video', label: t('chat.model_mode_video') }
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
                <label>{t('settings.tab_general')}</label>
                <div className="toggle-list">
                  <button
                    className={`mini-toggle ${settings.streamingEnabled ? 'on' : ''}`}
                    onClick={() => updateSettings({ streamingEnabled: !settings.streamingEnabled })}
                  >
                    {t('settings.stream_label')}
                  </button>
                  <button
                    className={`mini-toggle ${settings.enableThinking ? 'on' : ''}`}
                    onClick={() => updateSettings({ enableThinking: !settings.enableThinking })}
                  >
                    {t('settings.thinking_label')}
                  </button>
                  <button
                    className={`mini-toggle ${settings.enableSearch ? 'on' : ''}`}
                    onClick={() => updateSettings({ enableSearch: !settings.enableSearch })}
                  >
                    {t('settings.search_label')}
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
          onClick={handleExportJson}
          disabled={!session?.messages?.length}
          title={t('topbar.export_json')}
        >
          <FileJson size={18} />
        </button>

        <button
          className="icon-btn"
          onClick={handleExportMarkdown}
          disabled={!session?.messages?.length}
          title={t('topbar.export_markdown')}
        >
          <Download size={18} />
        </button>

        <button
          className="icon-btn"
          onClick={handleClear}
          disabled={!session?.messages?.length}
          title={t('topbar.clear_chat')}
        >
          <Trash2 size={18} />
        </button>

        <button
          className="icon-btn"
          onClick={toggleRightPanel}
          title={uiState.rightPanelOpen ? t('topbar.close_panel') : t('topbar.open_panel')}
        >
          {uiState.rightPanelOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
        </button>

        <button
          className="icon-btn"
          onClick={onThemeToggle}
          title={t('topbar.toggle_theme')}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        <button
          className="icon-btn"
          onClick={onSettingsOpen}
          title={t('topbar.settings')}
        >
          <Settings size={18} />
        </button>
      </div>
    </div>
  )
}

export default TopBar
