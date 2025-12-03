import { useStore } from '../store/useStore'
import {
  Plus,
  MessageSquare,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Image,
  Video,
  Code,
  Sparkles,
  BookOpen,
  FolderDown,
  Library
} from 'lucide-react'
import ImageLibrary from './ImageLibrary'
import VideoLibrary from './VideoLibrary'
import CodeSnippets from './CodeSnippets'
import './LeftSidebar.css'

function LeftSidebar() {
  const {
    sessions,
    currentSessionId,
    uiState,
    setCurrentSession,
    createSession,
    deleteSession,
    setLeftSidebarOpen,
    setLeftActiveTab
  } = useStore()

  const isOpen = uiState.leftSidebarOpen

  const tabs = [
    { id: 'home', label: '概览', desc: '项目摘要', icon: MessageSquare },
    { id: 'prompts', label: '我的 Prompt', desc: '最近的对话与草稿', icon: BookOpen },
    { id: 'tuned', label: '微调模型', desc: '实验模型列表', icon: Sparkles },
    { id: 'settings', label: '设置', desc: '偏好与存储', icon: Code }
  ]

  const tabIds = tabs.map(t => t.id)
  const activeTab = tabIds.includes(uiState.leftActiveTab) ? uiState.leftActiveTab : 'prompts'

  const handleNewChat = () => {
    const newId = createSession('新对话')
    setCurrentSession(newId)
  }

  const handleDeleteSession = (e, sessionId) => {
    e.stopPropagation()
    if (sessions.length <= 1) {
      alert('至少需要保留一个对话')
      return
    }
    if (window.confirm('确定要删除这个对话吗？')) {
      deleteSession(sessionId)
    }
  }

  const toggleSidebar = () => {
    setLeftSidebarOpen(!isOpen)
  }

  const handleTabClick = (tabId) => {
    setLeftActiveTab(tabId)
  }

  const quickActions = [
    { label: '新对话', icon: Plus, onClick: handleNewChat },
    { label: '导入文件', icon: FolderDown, onClick: () => alert('导入功能待实现') },
    { label: '示例库', icon: Library, onClick: () => setLeftActiveTab('home') }
  ]

  // 渲染Tab内容
  const renderTabContent = () => {
    if (activeTab === 'prompts') {
      return (
        <div className="sessions-list">
          <div className="sessions-label">My Prompts</div>
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`session-item ${session.id === currentSessionId ? 'active' : ''}`}
              onClick={() => setCurrentSession(session.id)}
            >
              <MessageSquare size={16} className="session-icon" />
              <span className="session-name">{session.name}</span>
              {sessions.length > 1 && (
                <button
                  className="delete-session-btn"
                  onClick={(e) => handleDeleteSession(e, session.id)}
                  title="删除对话"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )
    }

    if (activeTab === 'home') {
      return <ImageLibrary />
    }

    if (activeTab === 'tuned') {
      return <VideoLibrary />
    }

    if (activeTab === 'settings') {
      return <CodeSnippets />
    }

    return null
  }

  // 渲染折叠状态的Tab图标
  const renderCollapsedTabs = () => {
    return (
      <div className="collapsed-tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              className={`tab-icon-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => handleTabClick(tab.id)}
              title={tab.label}
            >
              <Icon size={20} />
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className={`left-sidebar ${isOpen ? 'open' : 'collapsed'}`}>
      <div className="sidebar-brand">
        <div className="brand-icon">
          <Sparkles size={16} />
        </div>
        {isOpen && (
          <div className="brand-text">
            <div className="brand-title">WinkAI Studio</div>
            <div className="brand-subtitle">Google AI风格工作台</div>
          </div>
        )}
        <button
          className="collapse-toggle"
          onClick={toggleSidebar}
          title={isOpen ? '折叠侧边栏' : '展开侧边栏'}
        >
          {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* 头部：新对话按钮或Tab标签 */}
      {isOpen ? (
        <>
          <div className="sidebar-header">
            <div className="quick-actions">
              {quickActions.map((action) => {
                const Icon = action.icon
                return (
                  <button key={action.label} className="quick-btn" onClick={action.onClick}>
                    <Icon size={16} />
                    <span>{action.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 导航列表 */}
          <div className="nav-list">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => handleTabClick(tab.id)}
                >
                  <div className="nav-icon">
                    <Icon size={16} />
                  </div>
                  <div className="nav-text">
                    <div className="nav-title">{tab.label}</div>
                    <div className="nav-desc">{tab.desc}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </>
      ) : (
        <div className="sidebar-header">
          {activeTab === 'prompts' && (
            <button className="new-chat-icon-btn" onClick={handleNewChat} title="新对话">
              <Plus size={20} />
            </button>
          )}
        </div>
      )}

      {/* 内容区域 */}
      <div className="sidebar-content">
        {isOpen ? renderTabContent() : renderCollapsedTabs()}
      </div>
    </div>
  )
}

export default LeftSidebar
