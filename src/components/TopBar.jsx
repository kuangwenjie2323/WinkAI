import { useStore } from '../store/useStore'
import { Settings, Sun, Moon, PanelRightClose, PanelRightOpen, Trash2 } from 'lucide-react'
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
        <h1 className="app-title">WinkAI</h1>
        {provider && (
          <div className="model-badge">
            {provider.name} · {currentModel || provider.defaultModel}
          </div>
        )}
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

        <button className="icon-btn" onClick={onSettingsOpen} title="设置">
          <Settings size={18} />
        </button>
      </div>
    </div>
  )
}

export default TopBar
