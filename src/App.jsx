import { useState, useEffect } from 'react'
import { useStore } from './store/useStore'
import { Toaster } from 'react-hot-toast'
import LeftSidebar from './components/LeftSidebar'
import TopBar from './components/TopBar'
import ChatContainer from './components/ChatContainer'
import ImageGenContainer from './components/ImageGenContainer'
import VideoGenContainer from './components/VideoGenContainer'
import RightPanel from './components/RightPanel'
import SettingsPanel from './components/SettingsPanel'
import ErrorBoundary from './components/ErrorBoundary'
import './App.css'

function App() {
  const { _hasHydrated, uiState, settings, updateSettings, setLeftSidebarOpen, setRightPanelOpen } = useStore()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // 检测是否为移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 等待状态水合完成
  if (!_hasHydrated) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  // 应用主题
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme)
  }, [settings.theme])

  const toggleTheme = () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light'
    updateSettings({ theme: newTheme })
  }

  // 关闭所有侧边栏（移动端点击遮罩时）
  const closeSidebars = () => {
    if (isMobile) {
      setLeftSidebarOpen(false)
      setRightPanelOpen(false)
    }
  }

  // 判断是否显示遮罩
  const showOverlay = isMobile && (uiState.leftSidebarOpen || uiState.rightPanelOpen)

  // 计算容器类名
  const containerClasses = [
    'app-container',
    !uiState.leftSidebarOpen && 'left-collapsed',
    !uiState.rightPanelOpen && 'right-collapsed',
    isMobile && 'mobile'
  ].filter(Boolean).join(' ')

  // 渲染主内容
  const renderMainContent = () => {
    switch (uiState.leftActiveTab) {
      case 'image':
        return <ImageGenContainer />
      case 'video':
        return <VideoGenContainer />
      case 'chat':
      case 'settings':
      default:
        return <ChatContainer />
    }
  }

  return (
    <div className={containerClasses}>
      <Toaster position="top-center" toastOptions={{
        style: {
          background: settings.theme === 'dark' ? '#333' : '#fff',
          color: settings.theme === 'dark' ? '#fff' : '#333',
        }
      }} />
      {/* 移动端遮罩层 */}
      {showOverlay && <div className="overlay" onClick={closeSidebars} />}

      {/* 左侧导航栏 */}
      <LeftSidebar onSettingsOpen={() => setSettingsOpen(true)} />

      {/* 中间主内容区 */}
      <div className="main-content">
        <TopBar
          theme={settings.theme}
          onThemeToggle={toggleTheme}
          onSettingsOpen={() => setSettingsOpen(true)}
        />
        {/* 使用 ErrorBoundary 包裹主内容 */}
        <ErrorBoundary>
          {renderMainContent()}
        </ErrorBoundary>
      </div>

      {/* Right control panel - Shown for Chat, Image, Video, and Settings */}
      {['chat', 'image', 'video', 'settings'].includes(uiState.leftActiveTab) && (
        <RightPanel
          isOpen={uiState.rightPanelOpen}
          onClose={() => setRightPanelOpen(false)}
        />
      )}

      {/* 设置面板（模态） */}
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  )
}

export default App
