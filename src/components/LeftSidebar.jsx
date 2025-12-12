import { useState, useRef, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'
import {
  Settings,
  Search,
  X,
  ListOrdered,
  Database
} from 'lucide-react'
import './LeftSidebar.css'

function LeftSidebar({ onSettingsOpen }) {
// ...
  const tabs = [
    { id: 'chat', label: t('sidebar.tab_chat') || 'Chat', desc: 'All conversations', icon: MessageSquare },
    { id: 'image', label: t('sidebar.tab_image') || 'Image', desc: 'Image generation', icon: Image },
    { id: 'video', label: t('sidebar.tab_video') || 'Video', desc: 'Video generation', icon: Video },
    { id: 'batch', label: 'Batch', desc: 'Batch operations', icon: ListOrdered },
    { id: 'cache', label: 'Cache', desc: 'Context Caching', icon: Database },
    { id: 'settings', label: t('sidebar.tab_settings') || 'Settings', desc: 'App settings', icon: Settings }
  ]
// ...
    if (activeTab === 'batch') {
        return <div className="sidebar-placeholder">Batch Jobs History (Coming Soon)</div>
    }

    if (activeTab === 'cache') {
        return <div className="sidebar-placeholder">Context Cache Management</div>
    }

    return null

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
