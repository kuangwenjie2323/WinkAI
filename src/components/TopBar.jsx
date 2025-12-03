import { useStore } from '../store/useStore'
import {
  Settings,
  Sun,
  Moon,
  PanelRightClose,
  PanelRightOpen,
  Trash2,
  ChevronDown,
  Shield,
  User
} from 'lucide-react'
import './TopBar.css'

function TopBar({ onThemeToggle, onSettingsOpen, theme }) {
  const { currentProvider, currentModel, providers, uiState, toggleRightPanel, getCurrentSession, clearSession } = useStore()
  const provider = providers[currentProvider]
  const session = getCurrentSession()

  const handleClear = () => {
    if (session?.messages?.length && window.confirm('确定要清空当前对话吗？')) {
      clearSession(session.id)
    }
  }

  return (
    <div className="topbar">
      <div className="topbar-left">
        <div className="brand">
          <div className="brand-mark">G</div>
          <div className="brand-text">
            <span className="brand-title">Google AI Studio</span>
            <span className="brand-subtitle">Project Console</span>
          </div>
        </div>

        <button className="ghost-btn">
          <span className="ghost-label">Project</span>
          <span className="ghost-value">My Playground</span>
          <ChevronDown size={14} />
        </button>

        <div className="divider" />

        {provider && (
          <div className="model-chip">
            <div className="chip-label">模型</div>
            <div className="chip-value">
              <span>{provider.name}</span>
              <span className="dot">•</span>
              <span>{currentModel || provider.defaultModel}</span>
            </div>
          </div>
        )}
      </div>

      <div className="topbar-center">
        <div className="crumbs">
          <span>My Prompt</span>
          <span className="crumb-sep">›</span>
          <span>Chat Playground</span>
          <button className="link-btn">Edit</button>
        </div>
        <div className="env-pill">
          <Shield size={14} />
          <span>API Key Required</span>
        </div>
      </div>

      <div className="topbar-right">
        <button className="solid-btn">
          Get API Key
        </button>

        <button
          className="icon-btn"
          onClick={handleClear}
          disabled={!session?.messages?.length}
          title="清空对话"
        >
          <Trash2 size={18} />
          <span className="btn-fallback">清空</span>
        </button>

        <button
          className="icon-btn"
          onClick={toggleRightPanel}
          title={uiState.rightPanelOpen ? '关闭控制面板' : '打开控制面板'}
        >
          {uiState.rightPanelOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
          <span className="btn-fallback">面板</span>
        </button>

        <button
          className="icon-btn"
          onClick={onThemeToggle}
          title={theme === 'light' ? '切换到暗色模式' : '切换到亮色模式'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          <span className="btn-fallback">主题</span>
        </button>

        <div className="user-chip">
          <User size={16} />
          <span>Guest</span>
          <button className="icon-btn ghost" onClick={onSettingsOpen} title="设置">
            <Settings size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default TopBar
