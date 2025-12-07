import { useState, useRef, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'
import {
  Plus,
  MessageSquare,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Sparkles,
  Image,
  Video,
  Settings,
  Search,
  X
} from 'lucide-react'
import './LeftSidebar.css'

function LeftSidebar({ onSettingsOpen }) {
  const { t } = useTranslation()
  const {
    sessions,
    currentSessionId,
    uiState,
    setCurrentSession,
    createSession,
    deleteSession,
    updateSessionName,
    setLeftSidebarOpen,
    setLeftActiveTab,
    setSearchQuery
  } = useStore()

  const isOpen = uiState.leftSidebarOpen
  const [editingSessionId, setEditingSessionId] = useState(null)
  const [editingSessionName, setEditingSessionName] = useState('')
  const editInputRef = useRef(null)

  // 搜索过滤会话列表
  const filteredSessions = useMemo(() => {
    const query = uiState.searchQuery?.toLowerCase().trim()
    if (!query) return sessions

    return sessions.filter(session => {
      if (session.name.toLowerCase().includes(query)) return true
      return session.messages.some(msg =>
        msg.content?.toLowerCase().includes(query)
      )
    })
  }, [sessions, uiState.searchQuery])

  useEffect(() => {
    if (editingSessionId && editInputRef.current) {
      editInputRef.current.focus()
    }
  }, [editingSessionId])

  const tabs = [
    { id: 'chat', label: t('sidebar.tab_chat') || 'Chat', desc: 'All conversations', icon: MessageSquare },
    { id: 'image', label: t('sidebar.tab_image') || 'Image', desc: 'Image generation', icon: Image },
    { id: 'video', label: t('sidebar.tab_video') || 'Video', desc: 'Video generation', icon: Video },
    { id: 'settings', label: t('sidebar.tab_settings') || 'Settings', desc: 'App settings', icon: Settings }
  ]

  const tabIds = tabs.map(t => t.id)
  const activeTab = tabIds.includes(uiState.leftActiveTab) ? uiState.leftActiveTab : 'chat'

  const handleNewChat = () => {
    const newId = createSession(t('sidebar.new_chat'))
    setCurrentSession(newId)
    setLeftActiveTab('chat')
  }

  const handleDeleteSession = (e, sessionId) => {
    e.stopPropagation()
    if (sessions.length <= 1) {
      alert(t('sidebar.delete_last_warning'))
      return
    }
    if (window.confirm(t('sidebar.delete_confirm'))) {
      deleteSession(sessionId)
    }
  }

  const handleStartRename = (e, session) => {
    e.stopPropagation()
    setEditingSessionId(session.id)
    setEditingSessionName(session.name)
  }

  const handleRenameChange = (e) => {
    setEditingSessionName(e.target.value)
  }

  const handleRenameSave = (sessionId) => {
    const trimmedName = editingSessionName.trim()
    if (trimmedName && trimmedName !== sessions.find(s => s.id === sessionId)?.name) {
      updateSessionName(sessionId, trimmedName)
    }
    setEditingSessionId(null)
    setEditingSessionName('')
  }

  const handleRenameCancel = () => {
    setEditingSessionId(null)
    setEditingSessionName('')
  }

  const handleKeyDown = (e, sessionId) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleRenameSave(sessionId)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      handleRenameCancel()
    }
  }

  const toggleSidebar = () => {
    setLeftSidebarOpen(!isOpen)
  }

  const handleTabClick = (tabId) => {
    if (tabId === 'settings') {
      if (onSettingsOpen) onSettingsOpen()
      return
    }
    setLeftActiveTab(tabId)
  }

  // 渲染Tab内容
  const renderTabContent = () => {
    if (activeTab === 'chat') {
      return (
        <div className="sessions-list">
          {/* 搜索框 */}
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder={t('sidebar.search_placeholder')}
              value={uiState.searchQuery || ''}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {uiState.searchQuery && (
              <button
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
                type="button"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="sessions-label">
            {uiState.searchQuery
              ? `${t('sidebar.search_results')} (${filteredSessions.length})`
              : 'Chats'
            }
          </div>

          {filteredSessions.map((session) => (
            <div
              key={session.id}
              className={`session-item ${session.id === currentSessionId ? 'active' : ''}`}
              onClick={() => setCurrentSession(session.id)}
            >
              <MessageSquare size={16} className="session-icon" />
              {editingSessionId === session.id ? (
                <input
                  ref={editInputRef}
                  type="text"
                  value={editingSessionName}
                  onChange={handleRenameChange}
                  onBlur={() => handleRenameSave(session.id)}
                  onKeyDown={(e) => handleKeyDown(e, session.id)}
                  className="session-name-input"
                />
              ) : (
                <span className="session-name" title={session.name}>
                  {session.name}
                </span>
              )}
              <div className="session-actions">
                {editingSessionId !== session.id && (
                  <button
                    className="rename-session-btn"
                    onClick={(e) => handleStartRename(e, session)}
                    title={t('common.edit')}
                  >
                    <Pencil size={14} />
                  </button>
                )}
                {sessions.length > 1 && (
                  <button
                    className="delete-session-btn"
                    onClick={(e) => handleDeleteSession(e, session.id)}
                    title={t('common.delete')}
                    disabled={!!editingSessionId}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* 无结果提示 */}
          {uiState.searchQuery && filteredSessions.length === 0 && (
            <div className="no-results">
              <span>{t('sidebar.no_results')}</span>
            </div>
          )}
        </div>
      )
    }

    if (activeTab === 'image') {
      return <div className="sidebar-placeholder">Image History (Coming Soon)</div>
    }

    if (activeTab === 'video') {
      return <div className="sidebar-placeholder">Video History (Coming Soon)</div>
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
            <div className="brand-title">{t('sidebar.brand_title')}</div>
            <div className="brand-subtitle">{t('sidebar.brand_subtitle')}</div>
          </div>
        )}
        <button
          className="collapse-toggle"
          onClick={toggleSidebar}
          title={isOpen ? 'Collapse' : 'Expand'}
        >
          {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>

      {/* 头部：新对话按钮或Tab标签 */}
      {isOpen ? (
        <>
          <div className="sidebar-header">
            <div className="quick-actions">
              <button className="quick-btn" onClick={handleNewChat}>
                <Plus size={16} />
                <span>{t('sidebar.new_chat')}</span>
              </button>
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
            <button className="new-chat-icon-btn" onClick={handleNewChat} title={t('sidebar.new_chat')}>
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
