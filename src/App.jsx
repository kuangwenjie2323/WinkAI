import { useState, useEffect } from 'react'
import { useStore } from './store/useStore'
import LeftSidebar from './components/LeftSidebar'
import TopBar from './components/TopBar'
import ChatContainer from './components/ChatContainer'
import RightPanel from './components/RightPanel'
import SettingsPanel from './components/SettingsPanel'
import './App.css'

function App() {
  const { uiState, settings, updateSettings } = useStore()
  const [settingsOpen, setSettingsOpen] = useState(false)

  // 应用主题
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme)
  }, [settings.theme])

  const toggleTheme = () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light'
    updateSettings({ theme: newTheme })
  }

  // 计算容器类名
  const containerClasses = [
    'app-container',
    !uiState.leftSidebarOpen && 'left-collapsed',
    !uiState.rightPanelOpen && 'right-collapsed'
  ].filter(Boolean).join(' ')

  return (
    <div className={containerClasses}>
      {/* 左侧导航栏 */}
      <LeftSidebar />

      {/* 中间主内容区 */}
      <div className="main-content">
        <TopBar
          theme={settings.theme}
          onThemeToggle={toggleTheme}
          onSettingsOpen={() => setSettingsOpen(true)}
        />

        <ChatContainer />
      </div>

      {/* 右侧控制面板 */}
      <RightPanel
        isOpen={uiState.rightPanelOpen}
        onClose={() => useStore.getState().setRightPanelOpen(false)}
      />

      {/* 设置面板（模态） */}
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  )
}

export default App
