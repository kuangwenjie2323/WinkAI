import { useStore } from '../store/useStore'
import { Plus, MessageSquare, Trash2 } from 'lucide-react'
import './Sidebar.css'

function Sidebar({ isOpen }) {
  const {
    sessions,
    currentSessionId,
    setCurrentSession,
    createSession,
    deleteSession
  } = useStore()

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

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      {/* 新对话按钮 */}
      <div className="sidebar-header">
        <button className="new-chat-btn" onClick={handleNewChat} title="新对话">
          {isOpen ? (
            <>
              <Plus size={18} />
              <span>新对话</span>
            </>
          ) : (
            <Plus size={20} />
          )}
        </button>
      </div>

      {/* 会话列表 */}
      {isOpen && (
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
      )}
    </div>
  )
}

export default Sidebar
