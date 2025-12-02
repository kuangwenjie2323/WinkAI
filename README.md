# WinkAI - 多模态 AI Agent 应用

一个功能完整的现代化 AI 聊天应用，支持多个 AI 提供商、图片识别、实时流式输出和 Markdown 渲染。

![WinkAI](https://img.shields.io/badge/WinkAI-v1.0.0-blue)
![React](https://img.shields.io/badge/React-19.2.0-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-7.2.6-646CFF?logo=vite)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ 特性

- 🤖 **多 AI 提供商支持**
  - OpenAI (GPT-4, GPT-3.5)
  - Anthropic Claude (Claude 3.5 Sonnet, Opus, Haiku)
  - Google Gemini (Gemini 2.0 Flash, 1.5 Pro)
  - 自定义 API（兼容 OpenAI 格式）

- 💬 **强大的对话功能**
  - 实时流式输出
  - Markdown 渲染
  - 代码语法高亮
  - 代码一键复制

- 🖼️ **多模态输入**
  - 图片上传和识别
  - 拖拽上传支持
  - 多图预览

- ⚙️ **灵活配置**
  - Temperature 调节
  - Max Tokens 设置
  - 流式输出开关
  - 本地数据持久化

- 🎨 **现代化 UI**
  - 渐变背景设计
  - 流畅动画效果
  - 响应式布局
  - 暗色代码主题

- 🚀 **一键部署**
  - Vercel 部署支持
  - Cloudflare Pages 支持

## 📦 技术栈

- **前端框架**: React 19 + Vite 7
- **状态管理**: Zustand
- **Markdown**: react-markdown + remark-gfm + rehype-highlight
- **AI SDK**:
  - `openai` - OpenAI 官方 SDK
  - `@anthropic-ai/sdk` - Anthropic 官方 SDK
  - `@google/generative-ai` - Google AI SDK
- **UI 组件**: lucide-react (图标)
- **文件上传**: react-dropzone
- **样式**: CSS3 + 自定义样式

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd winkai
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:5173](http://localhost:5173)

### 4. 配置 API Key

1. 点击右上角的设置图标 ⚙️
2. 选择 AI 提供商
3. 输入对应的 API Key
4. 选择模型
5. 开始对话！

## 🔑 获取 API Key

### OpenAI
1. 访问 [platform.openai.com](https://platform.openai.com)
2. 注册/登录账号
3. 进入 API Keys 页面
4. 创建新的 API Key

### Anthropic Claude
1. 访问 [console.anthropic.com](https://console.anthropic.com)
2. 注册/登录账号
3. 进入 API Keys 页面
4. 创建新的 API Key

### Google Gemini
1. 访问 [makersuite.google.com](https://makersuite.google.com)
2. 登录 Google 账号
3. 获取 API Key

## 💡 使用说明

### 基本对话
1. 在输入框输入文本
2. 按 **Enter** 发送（Shift+Enter 换行）
3. 实时查看 AI 响应

### 图片识别
1. 点击 📎 图标或拖拽图片到输入区域
2. 添加描述文字
3. 发送消息进行图片分析

### Markdown 和代码
- AI 响应自动渲染 Markdown 格式
- 代码块自动高亮
- 点击代码块右上角复制按钮

### 设置调整
- **Temperature**: 控制回复的随机性（0-2）
- **Max Tokens**: 控制回复的最大长度
- **流式输出**: 实时显示 AI 生成过程
- **思考模式**: 显示 AI 推理步骤（部分模型）

## 📁 项目结构

```
winkai/
├── src/
│   ├── components/           # React 组件
│   │   ├── ChatContainer.jsx        # 主聊天容器
│   │   ├── ChatContainer.css
│   │   ├── MessageRenderer.jsx      # 消息渲染（Markdown）
│   │   ├── MessageRenderer.css
│   │   ├── MultiModalInput.jsx      # 多模态输入
│   │   ├── MultiModalInput.css
│   │   ├── SettingsPanel.jsx        # 设置面板
│   │   └── SettingsPanel.css
│   ├── services/             # 服务层
│   │   ├── aiService.js             # AI 服务（流式）
│   │   └── apiConfig.js             # API 配置
│   ├── store/                # 状态管理
│   │   └── useStore.js              # Zustand Store
│   ├── App.jsx               # 应用主组件
│   ├── App.css
│   ├── main.jsx              # 入口文件
│   └── index.css             # 全局样式
├── public/                   # 静态资源
├── package.json              # 依赖配置
├── vite.config.js           # Vite 配置
└── vercel.json              # Vercel 部署配置
```

## 🌐 部署

### 部署到 Vercel

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署
vercel

# 生产部署
vercel --prod
```

### 部署到 Cloudflare Pages

#### 前置要求
- Node.js 20+
- Wrangler CLI: `npm install -g wrangler`

#### 部署步骤

1. **构建项目**
   ```bash
   npm run build
   ```

2. **使用 Wrangler 部署**
   ```bash
   # 首次部署
   wrangler login
   wrangler pages deploy dist
   ```

3. **配置环境变量（可选）**

   在 Cloudflare Dashboard 中设置环境变量：
   - `VITE_OPENAI_API_KEY` - OpenAI API Key
   - `VITE_ANTHROPIC_API_KEY` - Anthropic API Key
   - `VITE_GOOGLE_API_KEY` - Google AI API Key
   - `VITE_CUSTOM_API_KEY` - 自定义 API Key

   **优势**：
   - 环境变量优先于 UI 配置
   - 更安全，不在浏览器存储
   - 支持团队共享配置

   如不设置，用户可在 UI 中输入 API Key。

#### 自动部署

连接 GitHub 仓库后，Cloudflare Pages 会自动部署：
- **主分支推送** → 生产环境
- **Pull Request** → 预览环境

#### 构建配置
- **构建命令**: `npm run build`
- **输出目录**: `dist`
- **Node 版本**: 20.x
- **环境变量**: 参见 `.env.example`

## ⚠️ 注意事项

### API Key 安全
- API Key 仅保存在浏览器本地存储
- 不会上传到任何服务器
- 生产环境建议使用后端代理

### 成本控制
- 合理设置 Max Tokens
- 监控 API 使用量
- 优先使用更经济的模型

### 浏览器兼容性
- 推荐使用最新版 Chrome/Edge/Firefox
- 需要支持 ES2020+ 特性
- 需要支持 async generators

## 🛠️ 开发

### 安装开发依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

### 代码检查

```bash
npm run lint
```

## 📝 待实现功能

- [ ] 多会话管理
- [ ] 对话搜索
- [ ] 对话导出（Markdown/JSON）
- [ ] 语音输入/输出
- [ ] 视频分析
- [ ] 文件分析（PDF, Word）
- [ ] 工具调用（Function Calling）
- [ ] Web 搜索集成
- [ ] 主题切换
- [ ] 多语言支持

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可

MIT License

## 🙏 致谢

- [OpenAI](https://openai.com) - GPT 模型
- [Anthropic](https://anthropic.com) - Claude 模型
- [Google](https://ai.google) - Gemini 模型
- [React](https://react.dev) - UI 框架
- [Vite](https://vitejs.dev) - 构建工具
- [Zustand](https://zustand-demo.pmnd.rs/) - 状态管理

---

**当前版本**: v1.0.0
**最后更新**: 2025-12-01
**开发者**: Your Name

如有问题或建议，请提交 Issue 或联系开发者。
