import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'
import { Play, Settings2, Type, Image as ImageIcon, Download, Check, X } from 'lucide-react'
import aiService from '../services/aiService'
import './VideoGenContainer.css' // 复用 Video Studio 的样式以保持一致
import './ImageGenContainer.css'

function ImageGenContainer() {
  const { t } = useTranslation()
  const { providers, currentProvider, dynamicModels, addToImageLibrary } = useStore()
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0) // 进度
  const [imageUrl, setImageUrl] = useState(null)
  
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [model, setModel] = useState('gemini-3-pro-image-preview')

  // 高级设置
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [negativePrompt, setNegativePrompt] = useState('')
  const advancedSettingsRef = useRef(null)

  // 模式选择 (暂只支持 Text to Image)
  const [modeMenuOpen, setModeMenuOpen] = useState(false)
  const modeMenuRef = useRef(null)

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modeMenuRef.current && !modeMenuRef.current.contains(event.target)) {
        setModeMenuOpen(false)
      }
      if (advancedSettingsRef.current && !advancedSettingsRef.current.contains(event.target)) {
        setShowAdvancedSettings(false)
      }
    }
    if (modeMenuOpen || showAdvancedSettings) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [modeMenuOpen, showAdvancedSettings])

  const handleDownload = (url) => {
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = `image-${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  // 动态获取图片模型列表
  const getImageModels = () => {
    // 默认回退列表 - Google AI Studio 支持的图片生成模型
    const fallbackModels = [
      { id: 'gemini-3-pro-image-preview', name: 'Nano Banana Pro' },
      { id: 'gemini-2.0-flash-exp-image-generation', name: 'Gemini 2.0 Flash Image' },
      { id: 'imagen-4', name: 'Imagen 4' },
      { id: 'imagen-4-ultra', name: 'Imagen 4 Ultra' },
      { id: 'imagen-4-fast', name: 'Imagen 4 Fast' },
      { id: 'imagen-3.0-generate-002', name: 'Imagen 3.0' }
    ]

    // 获取当前提供商的动态模型
    const models = dynamicModels?.[currentProvider] || []

    // 过滤出图片模型 (包含 'imagen' 或 'image' 或 'nano')
    const dynamicImageModels = models.filter(m => {
      const id = m.id.toLowerCase()
      return id.includes('imagen') || id.includes('image') || id.includes('nano')
    }).map(m => ({
      id: m.id,
      name: m.name || m.id
    }))

    if (dynamicImageModels.length > 0) {
      // 合并列表：动态模型优先，去重
      const combined = [...dynamicImageModels]
      fallbackModels.forEach(fm => {
        const exists = combined.some(dm => dm.id.includes(fm.id))
        if (!exists) {
          combined.push(fm)
        }
      })
      return combined
    }

    return fallbackModels
  }

  const imageModels = getImageModels()

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setIsGenerating(true)
    setProgress(0)
    setImageUrl(null)
    
    // 模拟进度条 (图片生成较快，步长稍大)
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 98) return prev
        const remaining = 98 - prev
        const increment = Math.max(1, Math.random() * (remaining / 5))
        return Math.min(98, prev + increment)
      })
    }, 200)

    let fullText = ''
    let imgFound = false

    try {
      const messages = [{ role: 'user', content: prompt }]
      const providerConfig = providers[currentProvider] || {}
      
      const iterator = aiService.streamChat(
        currentProvider,
        messages, 
        model, 
        {
          projectId: providerConfig.projectId,
          location: providerConfig.location,
          apiKey: providerConfig.apiKey
        },
        {
          imageParams: {
            aspectRatio
          }
        }
      )
      
      for await (const chunk of iterator) {
        if (chunk.type === 'content') {
          console.log('Chunk:', chunk)
          
          // 尝试提取图片 URL (支持 R2 URL, HTTP URL, Data URL)
          // 匹配 Markdown 图片语法: ![alt](url)
          const imgMatch = chunk.content.match(/!\[.*?\]\((.*?)\)/)
          
          if (imgMatch && imgMatch[1]) {
             const url = imgMatch[1]
             setImageUrl(url)
             imgFound = true
             setProgress(100)

             // 保存到历史记录
             addToImageLibrary({
               url,
               prompt,
               model,
               createdAt: Date.now()
             })
          }
          // 兼容纯 Data URL (如果某些模型直接返回)
          else if (chunk.content.includes('data:image')) {
             const srcMatch = chunk.content.match(/(data:image\/[^"\s)]+)/)
             if (srcMatch && srcMatch[1]) {
               const url = srcMatch[1]
               setImageUrl(url)
               imgFound = true
               setProgress(100)
               addToImageLibrary({ url, prompt, model, createdAt: Date.now() })
             }
          }
          else {
            fullText += chunk.content
          }
        }
      }

      if (!imgFound && fullText.trim()) {
        alert('生成未返回图片，可能是模型拒绝或返回了纯文本: \n' + fullText)
      }
    } catch (error) {
      console.error('Image generation failed:', error)
      alert('生成失败: ' + error.message)
    } finally {
      clearInterval(progressInterval)
      setIsGenerating(false)
      if (!imgFound) setProgress(0)
    }
  }

  return (
    <div className="video-studio-container"> {/* 复用 Video Studio 的容器样式 */}
      {/* 顶部标题 */}
      <div className="video-studio-header">
        <h1>Imagen Studio</h1>
      </div>

      {/* 主预览区 */}
      <div className="video-preview-stage">
        {imageUrl ? (
          <div className="generated-image-wrapper" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            <img src={imageUrl} alt="Generated" style={{ maxHeight: '100%', maxWidth: '100%', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }} />
            <button 
              className="download-btn-overlay"
              onClick={() => handleDownload(imageUrl)}
              title="Download Image"
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'rgba(0,0,0,0.6)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backdropFilter: 'blur(4px)',
                zIndex: 10
              }}
            >
              <Download size={16} />
              <span style={{ fontSize: '12px', fontWeight: 500 }}>Download</span>
            </button>
          </div>
        ) : (
          <div className="empty-state">
            <p>Type in the prompt box to start</p>
            <div className="arrow-down">↓</div>
          </div>
        )}
        
        {isGenerating && (
          <div className="generating-overlay">
            <div className="spinner"></div>
            <p>Generating image... {Math.round(progress)}%</p>
          </div>
        )}
      </div>

      {/* 底部控制栏 */}
      <div className="video-controls-bar">
        {/* 参数设置行 */}
        <div className="params-row">
          <div className="param-group">
            <label>Model</label>
            <select value={model} onChange={(e) => setModel(e.target.value)}>
              {imageModels.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          
          <div className="param-separator"></div>

          <div className="param-group">
            <label>Aspect Ratio</label>
            <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
              <option value="1:1">Square (1:1)</option>
              <option value="16:9">Landscape (16:9)</option>
              <option value="9:16">Portrait (9:16)</option>
              <option value="3:4">Portrait (3:4)</option>
              <option value="4:3">Landscape (4:3)</option>
            </select>
          </div>
        </div>

        {/* 输入框行 */}
        <div className="video-input-wrapper">
          {/* 模式选择 (UI 占位) */}
          <div className="mode-selector">
            <button className="mode-trigger">
              <Type size={16} />
              <span>Text to Image</span>
            </button>
          </div>

          <input 
            type="text" 
            placeholder="Describe the image you want to create..." 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            disabled={isGenerating}
          />
          
          <div className="settings-btn-wrapper" ref={advancedSettingsRef}>
            <button
              className={`settings-btn ${showAdvancedSettings ? 'active' : ''}`}
              title="Advanced Settings"
              onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            >
              <Settings2 size={18} />
            </button>

            {showAdvancedSettings && (
              <div className="advanced-settings-panel">
                <div className="panel-header">
                  <span>高级设置</span>
                  <button className="close-btn" onClick={() => setShowAdvancedSettings(false)}>
                    <X size={16} />
                  </button>
                </div>
                <div className="panel-content">
                  <div className="setting-item">
                    <label>负面提示词</label>
                    <textarea
                      placeholder="描述不想出现的内容..."
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            className="generate-btn"
            onClick={handleGenerate}
            disabled={!prompt || isGenerating}
          >
            <Play size={18} fill="currentColor" />
          </button>
        </div>

        <div className="footer-note">
          Imagen is a paid-only model. You will be charged on your Cloud project.
        </div>
      </div>
    </div>
  )
}

export default ImageGenContainer
