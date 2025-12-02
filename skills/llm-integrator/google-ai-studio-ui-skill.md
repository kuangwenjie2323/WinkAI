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

### 🎨 这个 Skill 的亮点

1.  **颜色精确**: 我使用了 Google AI Studio 真实的十六进制色值（例如背景 `#131314` 和 输入框背景 `#1e1f20`），而不是普通的黑色。
2.  **组件还原**:
    *   **Input Box**: 还原了那种“悬浮胶囊”或“大圆角矩形”的输入框风格，并且把发送按钮放在了框内。
    *   **Settings Panel**: 还原了右侧参数面板的经典布局（System Prompt 在最上面，下面是 Slider）。
3.  **布局逻辑**: 使用了 Flexbox (`flex-1`, `flex-shrink-0`) 来确保中间的内容区是自适应宽度的，而左右侧边栏是固定宽度的。

你可以直接对 Claude 说：
> **"用 `ui-ai-studio` 帮我生成一个布局，中间要支持图片上传预览。"**

它就会基于上面的模板进行修改。