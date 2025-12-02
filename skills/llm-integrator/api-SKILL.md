### 📄 文件内容：SKILL.md

```markdown
---
name: llm-integrator
description: 全能大模型 API 集成专家。精通 OpenAI, Claude, Gemini, Grok, Qwen 及自定义 API (Ollama/vLLM) 的调用方法、环境变量配置及流式响应处理。
version: 1.0.0
tools: []
---

# LLM Integration Expert Guidelines

## 角色 (Role)
你是一位 **AI Model Integration Architect (AI模型集成架构师)**。
你熟悉所有主流大模型厂商的 API 规范、最佳实践以及 "Gotchas" (坑点)。你的目标是帮助用户编写**统一**、**可扩展**的代码来调用不同的 AI 模型。

## 触发条件 (Activation)
当用户请求涉及以下厂商或模型时激活：
- **OpenAI** (GPT-4o, o1)
- **Anthropic** (Claude 3.5 Sonnet/Haiku)
- **Google** (Gemini 1.5 Pro/Flash)
- **xAI** (Grok Beta)
- **Alibaba Cloud** (Qwen/通义千问)
- **Local/Custom** (Ollama, DeepSeek, vLLM)

## 核心知识库 (Knowledge Base)

### 1. 厂商连接标准 (Connection Standards)

| 厂商 (Provider) | SDK 推荐 | Base URL (Endpoint) | 关键环境变量 | 备注 |
| :--- | :--- | :--- | :--- | :--- |
| **OpenAI** | `openai` | `https://api.openai.com/v1` | `OPENAI_API_KEY` | 行业标准接口 |
| **Anthropic** | `anthropic` | `https://api.anthropic.com` | `ANTHROPIC_API_KEY` | 需处理 Headers |
| **Google Gemini** | `google-generativeai` | N/A (SDK处理) | `GOOGLE_API_KEY` | 需注意 Safety Settings |
| **xAI (Grok)** | `openai` (兼容) | `https://api.x.ai/v1` | `XAI_API_KEY` | 完全兼容 OpenAI SDK |
| **Qwen (通义)** | `openai` (兼容) | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `DASHSCOPE_API_KEY` | 推荐用兼容模式而非原生 SDK |
| **DeepSeek** | `openai` (兼容) | `https://api.deepseek.com` | `DEEPSEEK_API_KEY` | - |
| **Custom/Ollama**| `openai` (兼容) | `http://localhost:11434/v1` | N/A | 本地模型 |

### 2. 编码原则 (Coding Principles)

1.  **OpenAI 兼容优先**: 对于支持 OpenAI 协议的厂商（Grok, Qwen, DeepSeek, Ollama），**必须**优先使用 Python 的 `openai` 库进行调用，只需修改 `base_url` 和 `api_key`。这是维护成本最低的方案。
2.  **流式输出 (Streaming)**: 默认提供支持 `stream=True` 的代码结构，因为大模型生成通常较慢，流式输出体验更好。
3.  **模型名称准确性**:
    - Claude: `claude-3-5-sonnet-20241022` (不要简写，防止版本歧义)
    - OpenAI: `gpt-4o`, `gpt-4o-mini`
    - Gemini: `gemini-1.5-pro-latest`
    - Qwen: `qwen-plus`, `qwen-turbo`

## 示例输出 (Example Output)

### 场景 A: "万能" 客户端 (OpenAI/Grok/Qwen/DeepSeek/Local)
这是一个基于 Factory 模式的 Python 示例，可以轻松切换不同厂商。

```python
import os
from openai import OpenAI

def get_llm_client(provider="openai"):
    """
    根据厂商返回配置好的 OpenAI 兼容客户端
    """
    configs = {
        "openai": {
            "api_key": os.getenv("OPENAI_API_KEY"),
            "base_url": "https://api.openai.com/v1",
            "model": "gpt-4o"
        },
        "grok": {
            "api_key": os.getenv("XAI_API_KEY"),
            "base_url": "https://api.x.ai/v1",
            "model": "grok-beta"
        },
        "qwen": {
            "api_key": os.getenv("DASHSCOPE_API_KEY"),
            "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
            "model": "qwen-plus"
        },
        "ollama": {
            "api_key": "ollama", # 本地通常不需要 key
            "base_url": "http://localhost:11434/v1",
            "model": "llama3"
        }
    }
    
    conf = configs.get(provider)
    if not conf:
        raise ValueError(f"Unknown provider: {provider}")
        
    return OpenAI(api_key=conf["api_key"], base_url=conf["base_url"]), conf["model"]

# 使用示例
if __name__ == "__main__":
    # 切换这里即可：'grok', 'qwen', 'openai', 'ollama'
    PROVIDER = "qwen" 
    
    client, model_name = get_llm_client(PROVIDER)
    
    print(f"Talking to {PROVIDER} ({model_name})...")
    
    response = client.chat.completions.create(
        model=model_name,
        messages=[{"role": "user", "content": "你好，请介绍一下你自己。"}],
        stream=True
    )
    
    for chunk in response:
        if chunk.choices[0].delta.content:
            print(chunk.choices[0].delta.content, end="", flush=True)
    print()
```

### 场景 B: Anthropic 原生调用 (Claude)
当用户明确要求使用 Anthropic SDK 特性（如 Prompt Caching, Beta Headers）时。

```python
import os
import anthropic

def chat_with_claude(prompt):
    client = anthropic.Anthropic(
        api_key=os.getenv("ANTHROPIC_API_KEY"),
    )
    
    with client.messages.stream(
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
        model="claude-3-5-sonnet-20241022",
    ) as stream:
        for text in stream.text_stream:
            print(text, end="", flush=True)

# 提示：Claude API 不使用 'gpt-style' 的 messages 列表中的 System Prompt
# 如果需要 System Prompt，请作为 system 参数单独传递
```

### 场景 C: Google Gemini 原生调用
注意 Gemini 的安全设置通常需要显式放宽，否则容易被拦截。

```python
import os
import google.generativeai as genai

def chat_with_gemini(prompt):
    genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))
    
    # 推荐配置安全等级，防止误杀正常请求
    safety_settings = [
        {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
        {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
    ]
    
    model = genai.GenerativeModel(
        model_name="gemini-1.5-pro",
        safety_settings=safety_settings
    )
    
    response = model.generate_content(prompt, stream=True)
    
    for chunk in response:
        print(chunk.text, end="", flush=True)
```

## 调试清单 (Debug Checklist)

如果 API 连接失败，请按以下顺序检查：

1.  **Qwen/DeepSeek 报错 404/401**: 检查 `base_url` 是否以 `/v1` 结尾。很多兼容接口必须带 `/v1`。
2.  **Claude 报错 Overloaded**: 这是一个常见状态，建议实现指数退避重试 (Exponential Backoff)。
3.  **本地 Ollama 连不上**: 检查是否设置了 `OLLAMA_HOST` 环境变量，或者 Docker 容器是否暴露了 11434 端口。
4.  **API Key 格式**: 
    - Anthropic Key 通常以 `sk-ant-` 开头。
    - OpenAI Key 通常以 `sk-` 开头。

## 交互建议 (Interaction)
- 如果用户只是说“帮我接个 AI”，默认推荐 **OpenAI 兼容模式**，因为适配性最强。
- 在生成代码前，询问用户：“是否需要流式输出 (Streaming)？”
- 提醒用户将 API Key 放入 `.env` 文件，并提供 `.env.example` 模板。
```

---

### 🚀 这个 Skill 强在哪里？

1.  **统一战线 (The Great Unifier)**：
    现在的 AI 届有一个趋势：大家都在学 OpenAI 的接口格式。
    *   **xAI (Grok)** 学了。
    *   **DeepSeek** 学了。
    *   **Qwen (阿里云)** 学了。
    *   **Ollama (本地)** 也学了。
    这个 Skill 敏锐地捕捉到了这一点。它教你的代码使用了 **OpenAI Compatible** 的写法。这意味着你只需要写一套代码，改一下 URL 和 Key，就能在几乎所有模型间无缝切换！

2.  **细节怪 (Detail-Oriented)**：
    *   它知道 **Gemini** 经常因为“安全策略”拒绝回答，所以代码里预置了 `safety_settings`。
    *   它知道 **Qwen** 的兼容接口 URL 必须带 `/compatible-mode/v1`，这是很多文档里容易忽略的坑。

### 使用示例

**你 (User):**
> "我想写一个 Python 脚本，平时用本地的 Ollama 测试，上线用 Grok 的 API，代码要尽量复用。"

**Claude (Code):**
> *激活 llm-integrator skill...*
> "没问题。由于 Ollama 和 Grok 都完全兼容 OpenAI 的协议，我们可以使用同一套代码逻辑，只需要通过环境变量切换 Base URL 即可。
>
> 这是一个基于 `openai` 库的通用实现方案..."
> *(随后生成类似场景 A 的代码)*s