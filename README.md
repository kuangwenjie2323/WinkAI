# WinkAI - AI Workbench / AI 工作台

![WinkAI](https://img.shields.io/badge/WinkAI-v1.5.0-blueviolet)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)
![License](https://img.shields.io/badge/license-MIT-green)

[English](#english) | [简体中文](#chinese)

---

<a name="english"></a>

## 🌟 Introduction

**WinkAI** is a modern, fully-featured AI chat application designed for power users and developers. It serves as a unified workbench for managing conversations with multiple top-tier LLMs (OpenAI, Anthropic, Google) with true multi-modal capabilities.

**Developed by the GCCK Team** (Gemini, Claude, ChatGPT, karewink).

### ✨ Key Features

- 🤖 **Multi-Model Integration**: Seamlessly switch between GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro, and custom OpenAI-compatible APIs.
- 🖼️ **True Multi-Modal Input**: 
  - Drag & drop images into the chat context.
  - Supports multi-turn conversations with image context (images are treated as first-class citizens in the message history).
- 💬 **Rich Conversation Experience**:
  - Real-time streaming responses with "typewriter" effect.
  - Comprehensive Markdown rendering (tables, math, code blocks).
  - Syntax highlighting for code with one-click copy/download.
- 🌍 **Internationalization (i18n)**: Fully localized in English and Chinese, with auto-detection.
- 📱 **Responsive Design**: Perfectly adapted for desktop and mobile devices (including iOS safe areas).
- 💾 **Local Privacy**: All data (API keys, chat history) is stored locally in your browser via LocalStorage. No middleman servers.
- 📤 **Export & Backup**: Export chat history to Markdown (for sharing) or JSON (for backup).

### 🛠️ Tech Stack

- **Framework**: React 19 + Vite 7
- **State**: Zustand (with persistence)
- **UI**: Lucide React Icons, React Hot Toast
- **Network**: Axios (streaming wrapper)
- **Testing**: Vitest + React Testing Library

### 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd winkai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Configure API Keys**
   - Open the Settings panel (⚙️).
   - Enter your API keys for OpenAI, Anthropic, or Google.
   - Alternatively, create a `.env` file in the root directory:
     ```env
     VITE_OPENAI_API_KEY=sk-...
     VITE_ANTHROPIC_API_KEY=sk-ant-...
     VITE_GOOGLE_API_KEY=AIza...
     ```

---

<a name="chinese"></a>

## 🌟 简介

**WinkAI** 是一个功能完备的现代化 AI 聊天应用，专为开发者和高级用户设计。它提供了一个统一的工作台，让您可以轻松管理与多个顶级大模型（OpenAI, Anthropic, Google）的对话，并支持强大的多模态交互。

**由 GCCK 团队** (Gemini, Claude, ChatGPT, karewink) **联合开发**。

### ✨ 核心特性

- 🤖 **多模型集成**: 无缝切换 GPT-4o, Claude 3.5 Sonnet, Gemini 1.5 Pro 以及任何兼容 OpenAI 格式的自定义 API。
- 🖼️ **真正的多模态输入**: 
  - 支持拖拽上传图片到对话中。
  - 支持带图片上下文的多轮对话（图片被视为消息历史的一等公民，而不仅仅是单次附件）。
- 💬 **极致对话体验**:
  - 类似 ChatGPT 的实时流式打字机效果。
  - 完善的 Markdown 渲染（支持表格、数学公式、代码块）。
  - 代码语法高亮，支持一键复制或下载代码文件。
- 🌍 **国际化 (i18n)**: 完美支持中文和英文界面切换，自动检测浏览器语言。
- 📱 **响应式设计**: 完美适配桌面端和移动端（包含针对 iOS 安全区域的优化）。
- 💾 **本地隐私**: 所有数据（API Key、聊天记录）仅存储在您的浏览器本地 (LocalStorage)，绝不经过任何中间服务器。
- 📤 **导出与备份**: 支持将对话导出为 Markdown（便于分享阅读）或 JSON（用于数据备份）。

### 🛠️ 技术栈

- **核心框架**: React 19 + Vite 7
- **状态管理**: Zustand (带持久化中间件)
- **UI 组件**: Lucide React Icons, React Hot Toast
- **网络层**: Axios (流式请求封装)
- **测试框架**: Vitest + React Testing Library

### 🚀 快速开始

1. **克隆项目**
   ```bash
   git clone <your-repo-url>
   cd winkai
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

4. **配置 API Key**
   - 点击右上角的设置图标 (⚙️)。
   - 输入您的 OpenAI, Anthropic 或 Google API Key。
   - 或者，在根目录创建 `.env` 文件预设 Key：
     ```env
     VITE_OPENAI_API_KEY=sk-...
     VITE_ANTHROPIC_API_KEY=sk-ant-...
     VITE_GOOGLE_API_KEY=AIza...
     ```

---

## 📄 License

MIT License © 2025 GCCK Team