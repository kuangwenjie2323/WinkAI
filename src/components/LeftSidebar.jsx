import { useStore } from '../store/useStore'
import { Plus, MessageSquare, Trash2, ChevronLeft, ChevronRight, Image, Video, Code } from 'lucide-react'
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
  const activeTab = uiState.leftActiveTab || 'sessions'

  const tabs = [
    { id: 'sessions', label: '会话', icon: MessageSquare },
    { id: 'images', label: '图片', icon: Image },
    { id: 'videos', label: '视频', icon: Video },
    { id: 'code', label: '代码', icon: Code }
  ]

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

  // 渲染Tab内容
  const renderTabContent = () => {
    switch (activeTab) {
      case 'sessions':
        return (
          <div className="sessions-list">
            <div className="sessions-label">最近对话</div>
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
      case 'images':
        return <ImageLibrary />
      case 'videos':
        return <VideoLibrary />
      case 'code':
        return <CodeSnippets />
      default:
        return null
    }
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
      {/* 头部：新对话按钮或Tab标签 */}
      {isOpen ? (
        <>
          <div className="sidebar-header">
            {activeTab === 'sessions' && (
              <button className="new-chat-btn" onClick={handleNewChat} title="新对话">
                <Plus size={18} />
                <span>新对话</span>
              </button>
            )}
          </div>

          {/* Tab导航 */}
          <div className="sidebar-tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => handleTabClick(tab.id)}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </>
      ) : (
        <div className="sidebar-header">
          {activeTab === 'sessions' && (
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

      {/* 折叠按钮 */}
      <div className="sidebar-footer">
        <button className="collapse-btn" onClick={toggleSidebar} title={isOpen ? '折叠侧边栏' : '展开侧边栏'}>
          {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>
    </div>
  )
}

export default LeftSidebar
