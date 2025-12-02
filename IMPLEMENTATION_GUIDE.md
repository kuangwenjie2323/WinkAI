# WinkAI 多模态 Agent 完整实施指南

## 📋 项目概述

WinkAI 是一个功能完整的多模态 AI Agent 应用，支持：
- 🤖 多个 AI 提供商（OpenAI, Anthropic, Google Gemini, 自定义 API）
- 💬 实时流式输出
- 🖼️ 图片上传和视觉识别
- 💭 思考模式显示
- 📝 Markdown 和代码高亮
- 🔍 搜索功能（待实现）
- 📁 文件上传处理
- 🌐 可部署到 Cloudflare/Vercel

## ✅ 已完成的工作

### 1. 依赖安装
```json
{
  "dependencies": {
    "axios": "^1.13.2",
    "lucide-react": "^0.555.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-markdown": "^9.0.2",
    "remark-gfm": "^4.0.1",
    "rehype-highlight": "^7.0.2",
    "rehype-raw": "^7.0.1",
    "@google/generative-ai": "^0.21.0",
    "openai": "^4.76.1",
    "@anthropic-ai/sdk": "^0.35.0",
    "zustand": "^5.0.3",
    "react-dropzone": "^14.3.7"
  }
}
```

### 2. 项目结构
```
src/
├── components/
│   ├── ChatContainer.jsx         # 主聊天容器
│   ├── MessageRenderer.jsx       # ✅ 消息渲染组件（Markdown + 代码高亮）
│   ├── MultiModalInput.jsx       # ⏳ 多模态输入组件
│   ├── SettingsPanel.jsx         # ⏳ 设置面板
│   └── SessionList.jsx           # ⏳ 会话列表
├── services/
│   ├── aiService.js              # ✅ AI服务（支持流式输出）
│   └── apiConfig.js              # 配置文件
├── store/
│   └── useStore.js               # ✅ 全局状态管理（Zustand）
├── hooks/
│   └── useChat.js                # ⏳ 聊天钩子
└── App.jsx
```

### 3. 核心功能

#### ✅ 全局状态管理 (src/store/useStore.js)
- 多提供商配置（OpenAI, Anthropic, Google, Custom）
- 会话管理
- 设置管理
- 本地持久化

#### ✅ AI 服务 (src/services/aiService.js)
- 支持 OpenAI 流式输出
- 支持 Anthropic Claude 流式输出
- 支持 Google Gemini 流式输出
- 支持自定义 API 流式输出
- 统一的接口设计

#### ✅ 消息渲染 (src/components/MessageRenderer.jsx)
- Markdown 渲染
- 代码语法高亮
- 代码块复制功能
- 图片预览
- 思考过程显示
- 流式输出光标

## 🚀 下一步实施步骤

### 步骤 1: 创建多模态输入组件

需要创建 `src/components/MultiModalInput.jsx`:

**功能:**
- 文本输入框
- 图片上传（拖拽或点击）
- 文件上传
- 语音输入（可选）
- 发送按钮

**技术:**
- 使用 `react-dropzone` 处理文件上传
- 使用 FileReader API 读取图片并转为 base64
- 支持多图上传预览

### 步骤 2: 更新 ChatContainer 组件

需要重写 `src/components/ChatContainer.jsx`:

**功能:**
- 集成全局状态管理
- 使用 `aiService` 进行流式对话
- 显示消息列表（使用 `MessageRenderer`）
- 使用 `MultiModalInput` 作为输入
- 实时更新流式输出的消息

**关键代码结构:**
```jsx
import { useStore } from '../store/useStore'
import aiService from '../services/aiService'
import MessageRenderer from './MessageRenderer'
import MultiModalInput from './MultiModalInput'

function ChatContainer() {
  const {
    getCurrentSession,
    getCurrentProvider,
    addMessage,
    updateMessage,
    settings
  } = useStore()

  const handleSend = async (text, images) => {
    // 1. 添加用户消息
    // 2. 创建AI消息占位符
    // 3. 调用 aiService.streamChat()
    // 4. 逐字更新AI消息内容
  }

  return (
    <div className="chat-container">
      {/* 消息列表 */}
      {/* 多模态输入 */}
    </div>
  )
}
```

### 步骤 3: 创建设置面板

创建 `src/components/SettingsPanel.jsx`:

**功能:**
- API Key 配置（OpenAI, Anthropic, Google）
- 自定义 API 地址配置
- 模型选择
- 温度、Max Tokens 设置
- 功能开关（搜索、思考模式、流式输出）

### 步骤 4: 创建会话管理

创建 `src/components/SessionList.jsx`:

**功能:**
- 显示所有会话
- 切换会话
- 新建会话
- 删除会话
- 重命名会话

### 步骤 5: 部署配置

#### Vercel 部署
已创建 `vercel.json`，只需:
```bash
npm install -g vercel
vercel
```

#### Cloudflare Pages 部署
创建 `wrangler.toml`:
```toml
name = "winkai"
pages_build_output_dir = "dist"

[build]
command = "npm run build"
```

然后:
```bash
npm run build
npx wrangler pages deploy dist
```

## 📦 完整文件清单

### 需要创建的组件文件

1. **src/components/MultiModalInput.jsx** - 多模态输入
2. **src/components/MultiModalInput.css** - 样式
3. **src/components/SettingsPanel.jsx** - 设置面板
4. **src/components/SettingsPanel.css** - 样式
5. **src/components/SessionList.jsx** - 会话列表
6. **src/components/SessionList.css** - 样式
7. **src/components/MessageRenderer.css** - 消息渲染样式
8. **src/hooks/useChat.js** - 聊天逻辑钩子

### 需要更新的文件

1. **src/components/ChatContainer.jsx** - 重写为完整版本
2. **src/components/ChatContainer.css** - 更新样式
3. **src/App.jsx** - 添加设置面板、会话列表
4. **src/index.css** - 添加全局主题变量

## 🔑 环境变量配置

创建 `.env.local` 文件:

```env
# OpenAI
VITE_OPENAI_API_KEY=your_openai_api_key

# Anthropic
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key

# Google
VITE_GOOGLE_API_KEY=your_google_api_key

# 自定义 API（可选）
VITE_CUSTOM_API_URL=https://your-custom-api.com
VITE_CUSTOM_API_KEY=your_custom_api_key
```

## 💡 使用建议

### 快速开始

1. **配置 API Key**
   - 点击右上角设置按钮
   - 选择提供商
   - 输入 API Key
   - 选择模型

2. **开始对话**
   - 在输入框输入文本
   - 或拖拽图片到输入区域
   - 按 Enter 或点击发送

3. **查看流式输出**
   - AI 回复会实时逐字显示
   - 支持 Markdown 格式
   - 代码会自动高亮

### 高级功能

1. **多会话管理**
   - 左侧会话列表
   - 可创建多个对话
   - 每个对话独立保存

2. **思考模式**
   - 在设置中启用
   - AI 会显示思考过程

3. **图片识别**
   - 上传图片
   - 使用支持视觉的模型（GPT-4V, Claude 3, Gemini Pro Vision）

## 🎯 待实现功能

- [ ] 搜索功能（集成 Tavily/Bing Search API）
- [ ] 工具调用（Function Calling）
- [ ] 语音输入/输出
- [ ] 视频处理
- [ ] 文件分析（PDF, Word, Excel）
- [ ] 对话导出（Markdown, JSON）
- [ ] 主题切换（亮色/暗色）
- [ ] 多语言支持

## 📝 注意事项

1. **API Key 安全性**
   - 不要将 API Key 提交到 Git
   - 使用环境变量或用户输入
   - 生产环境建议使用后端代理

2. **成本控制**
   - 设置合理的 Max Tokens
   - 监控 API 使用量
   - 考虑使用更便宜的模型

3. **性能优化**
   - 使用流式输出提升体验
   - 图片压缩后再上传
   - 会话历史定期清理

## 🤝 需要帮助？

如果您需要我帮助实现任何部分，请告诉我：
1. 完整的 MultiModalInput 组件
2. 重写的 ChatContainer 组件
3. 设置面板和会话管理
4. 或者任何其他功能

我会按照这个架构继续开发！
