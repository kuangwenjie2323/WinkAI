# WinkAI UI 升级指南

将现有 UI 升级为 tweakcn.com + Google Gemini 风格

## 🎨 设计目标

1. **参考 tweakcn.com**
   - OKLch 色彩空间（更现代的色彩系统）
   - 极简设计风格
   - 优雅的暗色/亮色主题切换
   - 细腻的阴影和圆角

2. **参考 Google Gemini 布局**
   - 左侧可收起的会话列表（Sidebar）
   - 中央主聊天区域
   - 底部固定输入框
   - 顶部简洁的工具栏

## 📐 新布局结构

```
┌─────────────────────────────────────────────────┐
│  [☰] WinkAI    [Model]    [⚙️] [🌙]           │ ← 顶栏
├──────────┬──────────────────────────────────────┤
│          │                                      │
│  会话列表  │          聊天消息区域                 │
│          │                                      │
│  • 新对话  │          [欢迎界面/消息列表]           │
│  • 对话1  │                                      │
│  • 对话2  │                                      │
│          │                                      │
│          ├──────────────────────────────────────┤
│          │  [输入框]  [📎] [🎤] [📤]           │ ← 底部输入
└──────────┴──────────────────────────────────────┘
```

## 🎯 具体改动步骤

### 步骤 1: 更新全局主题系统

创建 `src/styles/theme.css`:

```css
:root {
  /* OKLch 色彩空间 - 亮色主题 */
  --bg-primary: oklch(1 0 0);              /* 纯白 */
  --bg-secondary: oklch(0.98 0 0);         /* 浅灰 */
  --bg-tertiary: oklch(0.96 0 0);

  --text-primary: oklch(0.15 0 0);         /* 深灰文本 */
  --text-secondary: oklch(0.45 0 0);
  --text-tertiary: oklch(0.65 0 0);

  --border: oklch(0.9 0 0);
  --accent: oklch(0.55 0.2 264);           /* 蓝紫色 */

  --radius: 0.625rem;                      /* 10px */
}

[data-theme="dark"] {
  --bg-primary: oklch(0.15 0 0);
  --bg-secondary: oklch(0.18 0 0);
  --bg-tertiary: oklch(0.21 0 0);

  --text-primary: oklch(0.98 0 0);
  --text-secondary: oklch(0.7 0 0);
  --text-tertiary: oklch(0.5 0 0);

  --border: oklch(0.25 0 0);
  --accent: oklch(0.65 0.2 264);
}
```

### 步骤 2: 创建侧边栏组件

创建 `src/components/Sidebar.jsx`:

```jsx
import { useState } from 'react'
import { useStore } from '../store/useStore'
import { Plus, MessageSquare, Menu, X } from 'lucide-react'
import './Sidebar.css'

function Sidebar({ isOpen, onToggle }) {
  const { sessions, currentSessionId, setCurrentSession, createSession } = useStore()

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      {/* 侧边栏头部 */}
      <div className="sidebar-header">
        <button className="sidebar-toggle" onClick={onToggle}>
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        {isOpen && (
          <button className="new-chat-btn" onClick={() => createSession()}>
            <Plus size={18} />
            新对话
          </button>
        )}
      </div>

      {/* 会话列表 */}
      {isOpen && (
        <div className="sessions-list">
          {sessions.map((session) => (
            <button
              key={session.id}
              className={`session-item ${session.id === currentSessionId ? 'active' : ''}`}
              onClick={() => setCurrentSession(session.id)}
            >
              <MessageSquare size={16} />
              <span className="session-name">{session.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default Sidebar
```

### 步骤 3: 重构主布局

更新 `src/App.jsx`:

```jsx
import { useState } from 'react'
import Sidebar from './components/Sidebar'
import ChatContainer from './components/ChatContainer'
import TopBar from './components/TopBar'
import './App.css'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [theme, setTheme] = useState('light')

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
  }

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="main-content">
        <TopBar onThemeToggle={toggleTheme} theme={theme} />
        <ChatContainer />
      </div>
    </div>
  )
}

export default App
```

### 步骤 4: 创建顶部栏

创建 `src/components/TopBar.jsx`:

```jsx
import { useStore } from '../store/useStore'
import { Settings, Sun, Moon } from 'lucide-react'
import './TopBar.css'

function TopBar({ onThemeToggle, onSettingsOpen, theme }) {
  const { getCurrentProvider, currentModel } = useStore()
  const provider = getCurrentProvider()

  return (
    <div className="topbar">
      <div className="topbar-left">
        <h1 className="app-title">WinkAI</h1>
        <div className="model-badge">
          {provider?.name} · {currentModel || provider?.defaultModel}
        </div>
      </div>

      <div className="topbar-right">
        <button className="icon-btn" onClick={onThemeToggle}>
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <button className="icon-btn" onClick={onSettingsOpen}>
          <Settings size={18} />
        </button>
      </div>
    </div>
  )
}

export default TopBar
```

### 步骤 5: 更新样式文件

#### `src/components/Sidebar.css`:

```css
.sidebar {
  height: 100vh;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
}

.sidebar.open {
  width: 260px;
}

.sidebar.closed {
  width: 60px;
}

.sidebar-header {
  padding: 1rem;
  display: flex;
  gap: 0.5rem;
  border-bottom: 1px solid var(--border);
}

.sidebar-toggle {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  padding: 0.5rem;
  border-radius: var(--radius);
  transition: all 0.2s;
}

.sidebar-toggle:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.new-chat-btn {
  flex: 1;
  background: var(--accent);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.new-chat-btn:hover {
  background: var(--accent-hover);
}

.sessions-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.session-item {
  width: 100%;
  background: transparent;
  border: none;
  padding: 0.75rem;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--text-secondary);
  text-align: left;
  transition: all 0.2s;
}

.session-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.session-item.active {
  background: var(--accent-light);
  color: var(--accent);
}

.session-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.875rem;
}
```

#### `src/components/TopBar.css`:

```css
.topbar {
  height: 60px;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border);
  padding: 0 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.app-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.model-badge {
  font-size: 0.75rem;
  color: var(--text-tertiary);
  padding: 0.25rem 0.75rem;
  background: var(--bg-secondary);
  border-radius: var(--radius-full);
}

.topbar-right {
  display: flex;
  gap: 0.5rem;
}

.icon-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  padding: 0.5rem;
  border-radius: var(--radius);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}
```

#### `src/App.css`:

```css
.app-container {
  display: flex;
  height: 100vh;
  background: var(--bg-primary);
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
```

### 步骤 6: 更新 ChatContainer 样式

简化 ChatContainer，移除渐变背景，采用纯色：

```css
.chat-container-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}

.messages-area-new {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  background: var(--bg-primary);
}

/* 移除渐变，使用纯色 */
.welcome-screen {
  color: var(--text-primary);
  /* 移除白色文字，使用主题色 */
}
```

## 🎨 色彩方案对比

### 当前（渐变风格）:
- 背景：紫色渐变 `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- 卡片：白色半透明
- 强调色：紫色

### 升级后（极简风格）:
- 背景：纯色（白/黑）
- 卡片：浅灰色
- 强调色：蓝紫色 OKLch
- 支持亮色/暗色主题无缝切换

## 📝 实施建议

### 快速实施（推荐）:
1. 先实现主题系统（CSS Variables）
2. 添加侧边栏组件
3. 重构主布局
4. 逐步更新各个子组件

### 渐进式实施:
1. 保留现有 UI
2. 创建新的 `v2` 组件目录
3. 并行开发新 UI
4. 完成后切换

## 🔄 主题切换功能

在 `src/store/useStore.js` 中添加:

```javascript
// 添加主题状态
theme: 'light',

setTheme: (theme) => {
  set({ theme })
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('theme', theme)
}
```

## 🚀 下一步

1. 是否要我立即实施这些改动？
2. 还是希望保留当前 UI，只是参考设计？
3. 或者您想先看到某个特定组件的改造？

请告诉我您的选择，我可以：
- ✅ 立即开始实施完整的 UI 升级
- ✅ 只实施部分关键改动
- ✅ 创建一个新的分支保留原 UI
