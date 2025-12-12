import { useState, useEffect, useRef } from 'react'
import { useStore } from './store/useStore'
import { Toaster, toast } from 'react-hot-toast'
import aiService from './services/aiService'
import LeftSidebar from './components/LeftSidebar'
import TopBar from './components/TopBar'
import ChatContainer from './components/ChatContainer'
import ImageGenContainer from './components/ImageGenContainer'
import VideoGenContainer from './components/VideoGenContainer'
import BatchTaskContainer from './components/BatchTaskContainer'
import ContextCacheContainer from './components/ContextCacheContainer'
import RightPanel from './components/RightPanel'
import SettingsPanel from './components/SettingsPanel'
import ErrorBoundary from './components/ErrorBoundary'
import './App.css'

function App() {
  const { 
    _hasHydrated, 
    uiState, 
    settings, 
    currentProvider,
    currentModel,
    providers,
    updateSettings, 
    setLeftSidebarOpen, 
    setRightPanelOpen,
    setTestResult,
    setDynamicModels
  } = useStore()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const initialTestDone = useRef(false)

  // 检测是否为移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 自动测试连接（仅在应用加载完成且水合后执行一次）
  useEffect(() => {
    if (_hasHydrated && !initialTestDone.current) {
      initialTestDone.current = true
      
      const performAutoTest = async () => {
        const config = providers[currentProvider]
        // 如果没有 API Key 且不是 custom/vertex，通常无法连接，跳过
        // Vertex 可能用 OAuth Token，所以也要允许
        // Custom 可能用本地代理，无 Key 也可以
        if (!config) return

        console.log(`[App] Auto-testing connection for ${currentProvider} (${currentModel})...`)

        try {
          const result = await aiService.testConnection(currentProvider, { 
            testModel: currentModel 
          })
          
          setTestResult(currentProvider, result)
          
          if (result.success) {
            console.log('[App] Auto-test success:', result)
            if (result.models && result.models.length > 0) {
              setDynamicModels(currentProvider, result.models)
            }
          } else {
            console.warn('[App] Auto-test failed:', result.error)
            // 可选：连接失败时提示用户
            // toast.error(`自动连接 ${config.name} 失败: ${result.error}`, { id: 'auto-connect-error' })
          }
        } catch (e) {
          console.error('[App] Auto-test error:', e)
        }
      }

      performAutoTest()
    }
  }, [_hasHydrated, currentProvider, currentModel, providers, setTestResult, setDynamicModels])

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
      case 'batch':
        return <BatchTaskContainer />
      case 'cache':
        return <ContextCacheContainer />
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
