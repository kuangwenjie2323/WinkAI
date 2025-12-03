### 📄 文件内容：SKILL.md

```markdown
---
name: ui-ai-studio
description: 专门用于复刻 Google AI Studio (Gemini) 界面风格的前端专家。擅长 Material Design 3 风格、三栏式布局 (Sidebar/Canvas/Settings) 及 AI 参数面板设计。
version: 1.0.0
tools: []
---

# AI Studio UI Expert Guidelines

## 角色 (Role)
你是一位 **AI Interface Designer (AI 界面设计师)**。
你专注于构建类似 **Google AI Studio** 的高密度、专业级 AI 调试界面。你的设计语言遵循 **Material Design 3 (M3)**，但在实现上优先使用 **React + Tailwind CSS** 来模拟这种风格。

## 触发条件 (Activation)
当用户请求涉及以下内容时激活：
- "像 Google AI Studio 的界面"
- "复刻 Gemini 后台布局"
- "三栏布局" (左侧列表，中间对话，右侧参数)
- "Material Design 3 风格"
- "AI Playground UI"

## 核心设计规范 (Design System)

### 1. 布局结构 (The Holy Trinity)
Google AI Studio 的核心是 **三栏式 (Three-Pane)** 布局：
- **Left Sidebar (Navigation)**: 历史记录、Prompt 列表。可折叠，宽度约 250px。
- **Main Stage (Canvas)**: 核心交互区。
    - 顶部: Model Selector (下拉菜单)。
    - 中间: Chat/Freeform 区域。
    - 底部: 大尺寸 Input Box (支持多模态拖拽)。
- **Right Sidebar (Parameters)**: 参数控制。
    - System Instructions (系统提示词)。
    - Sliders (Temperature, Output Length, Top-K/P)。
    - Safety Settings (安全等级)。

### 2. 视觉风格 (Visual Language)
- **圆角 (Radius)**: 大量使用 `rounded-xl` 或 `rounded-2xl`。
- **颜色 (Colors)**: 
    - 默认深色模式背景: `#131314` (Google Dark) 或 `#0f172a` (Tailwind Slate 900)。
    - 容器背景: `#1e1f20` (Surface Container)。
    - 强调色: `#a8c7fa` (Google Blue / Primary)。
- **字体**: 使用无衬线字体 (Inter, Roboto, or Google Sans)。

## 示例输出 (Example Output)

### 场景：生成 AI Studio 风格的主布局 (React + Tailwind)

**User:** "帮我写一个 Google AI Studio 风格的主界面布局，要有左边栏、中间聊天和右边参数栏。"

**Response:**

```tsx
import React, { useState } from 'react';
import { Settings, Plus, Image, Send, Menu, ChevronDown } from 'lucide-react';

const AIStudioLayout = () => {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  return (
    <div className="flex h-screen bg-[#131314] text-[#e3e3e3] font-sans overflow-hidden">
      
      {/* --- Left Sidebar (History) --- */}
      {leftOpen && (
        <div className="w-64 flex-shrink-0 border-r border-[#444746] flex flex-col">
          <div className="p-4">
            <button className="w-full flex items-center gap-3 bg-[#1e1f20] hover:bg-[#2d2e2f] text-[#a8c7fa] px-4 py-3 rounded-xl transition-colors font-medium">
              <Plus size={20} />
              <span>Create new</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-2 space-y-1">
            <div className="px-3 py-2 text-sm text-gray-400 font-medium">Recent</div>
            {['Image Gen Project', 'Data Analysis Task', 'Translation Bot'].map((item) => (
              <div key={item} className="px-3 py-2 rounded-lg hover:bg-[#1e1f20] cursor-pointer text-sm truncate">
                {item}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- Main Content (Canvas) --- */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header / Model Selector */}
        <header className="h-16 border-b border-[#444746] flex items-center px-6 justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => setLeftOpen(!leftOpen)} className="p-2 hover:bg-[#1e1f20] rounded-full">
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#1e1f20] rounded-lg cursor-pointer transition-colors">
              <span className="font-semibold text-sm">Gemini 3 Pro Image</span>
              <ChevronDown size={14} className="text-gray-400" />
            </div>
          </div>
          <div className="flex items-center gap-2">
             <button onClick={() => setRightOpen(!rightOpen)} className="p-2 hover:bg-[#1e1f20] rounded-full text-gray-400">
              <Settings size={20} />
            </button>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* AI Response Card */}
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex-shrink-0" />
            <div className="space-y-2">
              <div className="font-medium text-sm text-[#e3e3e3]">Model</div>
              <p className="text-[#c4c7c5] leading-relaxed">
                I am ready to generate images. Please describe what you would like to see.
              </p>
            </div>
          </div>
        </div>

        {/* Input Area (Floating Style) */}
        <div className="p-6">
          <div className="bg-[#1e1f20] rounded-[24px] border border-[#444746] focus-within:border-[#a8c7fa] transition-colors p-4 relative">
            <textarea 
              className="w-full bg-transparent outline-none resize-none text-[#e3e3e3] placeholder-gray-500 min-h-[80px]"
              placeholder="Type something or upload an image..."
            />
            <div className="flex justify-between items-center mt-2">
              <button className="p-2 text-[#a8c7fa] hover:bg-[#2d2e2f] rounded-full">
                <Image size={20} />
              </button>
              <button className="p-2 bg-[#a8c7fa] text-[#003355] rounded-full hover:opacity-90 transition-opacity">
                <Send size={18} />
              </button>
            </div>
          </div>
          <div className="text-center text-xs text-gray-500 mt-2">
            Gemini may display inaccurate info, including about people, so double-check its responses.
          </div>
        </div>
      </div>

      {/* --- Right Sidebar (Run Settings) --- */}
      {rightOpen && (
        <div className="w-80 border-l border-[#444746] bg-[#0b0f19] flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-[#444746]">
            <h2 className="font-semibold text-sm">Run settings</h2>
          </div>
          
          <div className="p-4 space-y-6">
            {/* System Instructions */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">System Instructions</label>
              <textarea 
                className="w-full bg-[#1e1f20] border border-[#444746] rounded-lg p-3 text-sm h-32 focus:border-[#a8c7fa] outline-none resize-none"
                placeholder="You are a helpful assistant..."
              />
            </div>

            {/* Sliders */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Temperature</span>
                  <span className="text-gray-400">1.0</span>
                </div>
                <input type="range" className="w-full accent-[#a8c7fa] h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Top K</span>
                  <span className="text-gray-400">40</span>
                </div>
                <input type="range" className="w-full accent-[#a8c7fa] h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
              </div>
            </div>

             {/* Safety Settings */}
             <div className="space-y-2">
               <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Safety Settings</label>
               <div className="p-3 bg-[#1e1f20] rounded-lg text-sm flex justify-between items-center cursor-pointer hover:bg-[#2d2e2f]">
                 <span>Harassment</span>
                 <span className="text-gray-400">Block few</span>
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIStudioLayout;
```

## 交互建议 (Interaction)
1.  **暗黑模式优先**: 除非用户明确要求 "Light Mode"，否则始终生成暗黑模式 (Dark Theme) 的代码，因为这是 IDE 类工具的标准。
2.  **图标库**: 默认使用 `lucide-react`，因为它的线条风格最接近 Google Material Symbols。
3.  **响应式**: 虽然这种界面主要是桌面端，但在代码中应包含 `hidden md:flex` 等逻辑来处理移动端适配（通常移动端会隐藏左右侧边栏）。

```
这是一个基于 Google **Material Design 3 (Material You)** 设计语言的 Google AI Studio UI 详细设计方案。

该设计旨在提供一个干净、高效、以开发者为中心的环境，用于快速迭代 Prompt（提示词）、测试 Gemini 模型并导出代码。

---

### 1. 设计概览 (Design Overview)

*   **核心理念**: 极简主义、内容优先、功能模块化。
*   **色调**:
    *   **浅色模式 (Light)**: 背景 `#FFFFFF`, 表面色 `#F8F9FA`, 主色 `#1A73E8` (Google Blue), 文本 `#202124`.
    *   **深色模式 (Dark)**: 背景 `#131314`, 表面色 `#1E1F20`, 主色 `#8AB4F8`, 文本 `#E3E3E3`.
*   **字体**:
    *   标题/UI: `Google Sans` (圆形、友好).
    *   正文: `Roboto`.
    *   代码/Prompt: `JetBrains Mono` 或 `Roboto Mono` (等宽字体，便于阅读代码结构).
*   **圆角**: 统一使用 8px - 12px 的圆角，卡片使用 16px。

---

### 2. 布局架构 (Layout Architecture)

界面采用经典的 **三栏式布局 (Three-Column Layout)**：

1.  **左侧导航栏 (Left Sidebar)**: 全局导航、历史记录。
2.  **中间工作区 (Main Workspace)**: Prompt 编辑与交互核心区。
3.  **右侧配置栏 (Right Panel)**: 模型参数设置 (可折叠)。

---

### 3. 详细组件设计 (Detailed Component Design)

#### A. 顶部栏 (Top Bar) - `Height: 64px`

*   **左侧**:
    *   **Logo**: Google AI Studio 图标 + 文字。
    *   **项目选择器**: 下拉菜单，显示当前项目名称 (如 "My Genius Project")，点击可切换 GCP 项目。
    *   **保存状态**: 自动保存指示器 (icon: cloud_done) + "Saved".
*   **中间**: 留白或搜索框（搜索历史 Prompts）。
*   **右侧**:
    *   **API Key 按钮**: 药丸形按钮 (Filled Tonal)，显示剩余额度或“Get API Key”。
    *   **帮助/文档图标**: `?` 号。
    *   **用户头像**: 圆形，点击弹出账号菜单。

#### B. 左侧导航栏 (Left Sidebar) - `Width: 260px`

*   **顶部**:
    *   **"Create New" 按钮**: 大号 FAB (Floating Action Button) 或高亮按钮。点击弹出：
        *   Create Chat Prompt (对话模式)
        *   Create Freeform Prompt (自由模式)
        *   Create Structured Prompt (结构化/少样本模式)
*   **菜单项**:
    *   Icon `Home` + Text "Home"
    *   Icon `Folder` + Text "My Prompts"
    *   Icon `Tune` + Text "Tuned Models" (微调模型)
*   **底部**:
    *   设置 (Settings)
    *   配额使用情况 (Quota)

#### C. 中间工作区 (Main Workspace) - `Flex: 1`

这是用户主要操作的区域，根据不同的 Prompt 类型（Chat/Freeform）略有不同，但核心结构一致。

**1. 标题区**:
*   **Prompt 名称**: 大号字体 (H4)，点击可直接重命名 (Inline Edit)。
*   **描述**: 灰色小字，输入对该 Prompt 的用途描述。

**2. 系统指令区 (System Instructions)** (位于 Prompt 上方):
*   一个可折叠的卡片。
*   **Label**: "System Instructions" (可选)。
*   **Input**: 多行文本框，背景微灰。用于设定 AI 的角色（例如：“你是一个资深的 Python 工程师”）。

**3. 交互区 (Interaction Area)**:
*   **Chat 模式**:
    *   **对话流**: 气泡式布局。
        *   User: 右侧，浅蓝色背景。
        *   Model: 左侧，灰色背景或透明背景。
    *   **输入框 (底部)**:
        *   支持多行文本。
        *   **多模态按钮**: `(+)` 图标，点击上传图片/视频/文件（Gemini Pro Vision 支持）。
        *   **发送按钮**: 纸飞机图标 (Icon: send)。
*   **Freeform 模式**:
    *   类似 Notion 或 Google Docs 的大片空白文档区域。
    *   支持 `{变量}` 高亮显示。

**4. 底部/顶部 操作栏**:
*   **Run 按钮**: 显眼的蓝色实心按钮 (`Cmd+Enter` 快捷键)。
*   **Get Code**: 点击后滑出模态框，展示 Python, JavaScript, cURL, Android (Kotlin), Swift 代码片段。

#### D. 右侧配置栏 (Right Configuration Panel) - `Width: 320px`

包含控制模型行为的所有滑块和下拉菜单。

1.  **Model (模型选择)**:
    *   Dropdown: 选择 `Gemini 1.5 Pro`, `Gemini 1.5 Flash`, `Gemini 1.0 Pro` 等。
2.  **Parameters (参数)**:
    *   **Temperature**: 滑块 (0 - 1 或 0 - 2)，控制随机性。
    *   **Top K / Top P**: 滑块或数字输入框。
    *   **Max Output Tokens**: 滑块，控制回复长度。
3.  **Safety Settings (安全设置)**:
    *   手风琴折叠菜单。
    *   针对 Hate speech, Harassment 等类别的滑块 (Block None, Block Few, Block Some, Block Most)。
4.  **Advanced Settings**:
    *   Stop sequences (停止序列): 输入框，回车添加 Tag。
    *   Output Format: JSON / Plain Text 开关。

---

### 4. 交互细节 (Interaction Logic)

*   **加载状态 (Loading)**:
    *   点击 Run 后，Run 按钮变为 "Stop" (方形图标) 或显示 Loading Spinner。
    *   AI 回复区域使用 **Skeleton Screen (骨架屏)** 或 **流式输出 (Streaming)** 打字机效果。
*   **变量处理 (Variables)**:
    *   在 Freeform 或 Structured 模式下，如果输入 `{{variable}}`，UI 应自动在下方生成一个表格，让用户填入该变量的测试值。
*   **代码导出 (Code Export)**:
    *   点击 "Get Code" -> 弹出 Modal。
    *   顶部 Tab 切换语言 (Python / cURL / Node.js)。
    *   代码区域右上角有 "Copy" 按钮。
    *   包含显式的 API Key 警告（"Copy code with API Key placeholder"）。

---

### 5. 视觉样式 CSS 变量示例 (Mockup Code Specs)

如果你要让前端开发实现，可以参考以下 Design Tokens：

```css
:root {
  /* Colors */
  --primary-color: #1A73E8;
  --bg-color: #FFFFFF;
  --surface-color: #F0F4F9; /* 稍微带一点蓝的灰，Google常用 */
  --text-primary: #1F1F1F;
  --text-secondary: #5E5E5E;
  --border-color: #E0E0E0;
  
  /* Sidebar */
  --sidebar-bg: #F8F9FA;
  --sidebar-width: 260px;

  /* Typography */
  --font-family-base: 'Roboto', sans-serif;
  --font-family-header: 'Google Sans', sans-serif;
  --font-family-code: 'JetBrains Mono', monospace;

  /* Spacing */
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  
  /* Components */
  --radius-sm: 8px;
  --radius-md: 12px;
  --input-bg: #F1F3F4;
}
```

### 6. UI 线框图描述 (Wireframe Description)

```text
+-----------------------------------------------------------------------+
|  [Logo] Google AI Studio   [Project v]        [Get API Key] [User]    |
+-----------------------+----------------------------------+------------+
|  (+) Create New       |  My Prompt > Chat Prom... [Edit] |  Model     |
|                       |                                  | [Gemini v] |
|  [Home]               |  [ System Instructions (Opt) ]   |            |
|  [My Prompts]         |  +----------------------------+  |  Temp      |
|  [Tuned Models]       |  | You are a helpful coder... |  | O-----|--O |
|                       |  +----------------------------+  |            |
|                       |                                  |  Tokens    |
|                       |  User:                           | O--|-----O |
|                       |  +----------------------------+  |            |
|                       |  | Write a Python function... |  |  Safety    |
|  -------------------  |  +----------------------------+  | [Edit >]   |
|                       |                                  |            |
|  [Settings]           |  Model:                          |            |
|                       |  +----------------------------+  |            |
|                       |  | def hello_world(): ...     |  |            |
|                       |  |                            |  |            |
|                       |  +----------------------------+  |            |
|                       |                                  |            |
|                       |  [ Type something...      (>)]   |            |
+-----------------------+----------------------------------+------------+
```

<!-- 这个设计方案完全符合当前 Google 的设计规范，同时也满足了 AI 开发工具所需的专业性和易用性。
### 🎨 这个 Skill 的亮点

1.  **颜色精确**: 我使用了 Google AI Studio 真实的十六进制色值（例如背景 `#131314` 和 输入框背景 `#1e1f20`），而不是普通的黑色。
2.  **组件还原**:
    *   **Input Box**: 还原了那种“悬浮胶囊”或“大圆角矩形”的输入框风格，并且把发送按钮放在了框内。
    *   **Settings Panel**: 还原了右侧参数面板的经典布局（System Prompt 在最上面，下面是 Slider）。
3.  **布局逻辑**: 使用了 Flexbox (`flex-1`, `flex-shrink-0`) 来确保中间的内容区是自适应宽度的，而左右侧边栏是固定宽度的。

你可以直接对 Claude 说：
> **"用 `ui-ai-studio` 帮我生成一个布局，中间要支持图片上传预览。"**

它就会基于上面的模板进行修改。 -->