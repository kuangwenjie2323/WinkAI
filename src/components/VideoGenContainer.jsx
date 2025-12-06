import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'
import { Play, Settings2, Type, Image as ImageIcon, Film, ChevronDown, Check, X, Upload } from 'lucide-react'
import aiService from '../services/aiService'
import './VideoGenContainer.css'

function VideoGenContainer() {
  const { t } = useTranslation()
  const { providers, currentProvider, dynamicModels } = useStore()
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [videoUrl, setVideoUrl] = useState(null)
  
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [resolution, setResolution] = useState('720p')
  const [duration, setDuration] = useState('5')
  const [withAudio, setWithAudio] = useState(false)
  const [model, setModel] = useState('veo-3.0-generate-preview')
  
  // 参考图
  const [referenceImage, setReferenceImage] = useState(null) // base64 string (no prefix)
  const [referencePreview, setReferencePreview] = useState(null) // data url
  const fileInputRef = useRef(null)

  // 输入模式：text, frames, references
  const [inputMode, setInputMode] = useState('text')
  const [modeMenuOpen, setModeMenuOpen] = useState(false)
  const modeMenuRef = useRef(null)

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modeMenuRef.current && !modeMenuRef.current.contains(event.target)) {
        setModeMenuOpen(false)
      }
    }
    if (modeMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [modeMenuOpen])

  // 处理图片上传
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target.result
      setReferencePreview(dataUrl)
      // 移除 data:image/xxx;base64, 前缀
      const base64 = dataUrl.split(',')[1]
      setReferenceImage(base64)
    }
    reader.readAsDataURL(file)
  }

  // 移除图片
  const removeReferenceImage = () => {
    setReferenceImage(null)
    setReferencePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 动态获取视频模型列表
  const getVideoModels = () => {
    // 默认回退列表
    const fallbackModels = [
      { id: 'veo-3.0-generate-preview', name: 'Veo 3.0' },
      { id: 'veo-2.0-generate-001', name: 'Veo 2.0' }
    ]

    // 获取当前提供商的动态模型
    const models = dynamicModels?.[currentProvider] || []
    
    // 过滤出视频模型 (包含 'veo')
    const dynamicVideoModels = models.filter(m => 
      m.id.toLowerCase().includes('veo')
    ).map(m => ({
      id: m.id,
      name: m.name || m.id
    }))

    if (dynamicVideoModels.length > 0) {
      // 合并列表：动态模型优先，去重
      const combined = [...dynamicVideoModels]
      fallbackModels.forEach(fm => {
        // 如果动态列表里没有这个 ID，就加进去 (作为补充)
        // 注意：Vertex API 返回的 ID 通常是 publishers/google/models/veo...
        // 而我们 hardcode 的是短 ID。这里做个简单匹配：
        // 如果 dynamicModel.id 包含 fallbackModel.id，就算存在
        const exists = combined.some(dm => dm.id.includes(fm.id))
        if (!exists) {
          combined.push(fm)
        }
      })
      return combined
    }

    return fallbackModels
  }

  const videoModels = getVideoModels()

  const handleGenerate = async () => {
    if (!prompt.trim() && !referenceImage) return
    setIsGenerating(true)
    setVideoUrl(null)

    try {
      const messages = [{ role: 'user', content: prompt }]
      const providerConfig = providers[currentProvider] || {}
      
      const iterator = aiService.streamChatVertex(messages, model, {
        projectId: providerConfig.projectId,
        location: providerConfig.location,
        videoParams: {
          aspectRatio,
          resolution,
          duration,
          withAudio,
          referenceImage // 传入参考图
        }
      })
      
      for await (const chunk of iterator) {
        if (chunk.type === 'content') {
          console.log('Chunk:', chunk)
          // 处理返回的视频内容
          // 这里的 chunk.content 可能是 markdown 格式的视频链接或 HTML
          // 我们需要解析它
          if (chunk.content.includes('<video')) {
             const srcMatch = chunk.content.match(/src="([^"]+)"/)
             if (srcMatch && srcMatch[1]) {
               setVideoUrl(srcMatch[1])
             }
          }
        }
      }
    } catch (error) {
      console.error('Video generation failed:', error)
      alert('生成失败: ' + error.message)
    } finally {
      setIsGenerating(false)
    }
  }

  const inputModes = [
    { id: 'text', label: 'Text to Video', icon: Type },
    { id: 'frames', label: 'Frames to Video', icon: ImageIcon },
    { id: 'references', label: 'References to Video', icon: Film }
  ]

  const currentMode = inputModes.find(m => m.id === inputMode)

  return (
    <div className="video-studio-container">
      {/* 顶部标题 */}
      <div className="video-studio-header">
        <h1>Veo Studio</h1>
      </div>

      {/* 主预览区 */}
      <div className="video-preview-stage">
        {videoUrl ? (
          <video src={videoUrl} controls autoPlay loop className="generated-video" />
        ) : (
          <div className="empty-state">
            <p>Type in the prompt box to start</p>
            <div className="arrow-down">↓</div>
          </div>
        )}
        
        {isGenerating && (
          <div className="generating-overlay">
            <div className="spinner"></div>
            <p>Generating video...</p>
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
              {videoModels.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          
          <div className="param-separator"></div>

          <div className="param-group">
            <label>Aspect Ratio</label>
            <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value)}>
              <option value="16:9">Landscape (16:9)</option>
              <option value="9:16">Portrait (9:16)</option>
              <option value="1:1">Square (1:1)</option>
            </select>
          </div>

          <div className="param-separator"></div>

          <div className="param-group">
            <label>Resolution</label>
            <select value={resolution} onChange={(e) => setResolution(e.target.value)}>
              <option value="720p">720p</option>
              <option value="1080p">1080p</option>
            </select>
          </div>

          <div className="param-separator"></div>

          <div className="param-group">
            <label>Duration</label>
            <select value={duration} onChange={(e) => setDuration(e.target.value)}>
              <option value="5">5s (Default)</option>
              <option value="4">4s</option>
              <option value="8">8s</option>
            </select>
          </div>

          <div className="param-separator"></div>

          <div className="param-group checkbox-group">
            <label htmlFor="audio-toggle" style={{cursor:'pointer', display:'flex', alignItems:'center', gap:'6px'}}>
              <input 
                id="audio-toggle"
                type="checkbox" 
                checked={withAudio} 
                onChange={(e) => setWithAudio(e.target.checked)}
              />
              Audio
            </label>
          </div>
        </div>

        {/* 参考图预览区域 */}
        {referencePreview && (
          <div className="reference-preview-area" style={{ padding: '0 16px 8px', display: 'flex', gap: '8px' }}>
             <div className="ref-image-card" style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)' }}>
                <img src={referencePreview} alt="Ref" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button 
                  onClick={removeReferenceImage}
                  style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', color: 'white', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <X size={12} />
                </button>
             </div>
          </div>
        )}

        {/* 输入框行 */}
        <div className="video-input-wrapper">
          {/* 模式选择 */}
          <div className="mode-selector" ref={modeMenuRef}>
            <button 
              className="mode-trigger" 
              onClick={() => setModeMenuOpen(!modeMenuOpen)}
            >
              <currentMode.icon size={16} />
              <span>{currentMode.label}</span>
              {/* <ChevronDown size={12} /> */}
            </button>
            
            {modeMenuOpen && (
              <div className="mode-menu">
                {inputModes.map(m => (
                  <button 
                    key={m.id} 
                    className={`mode-option ${inputMode === m.id ? 'active' : ''}`}
                    onClick={() => {
                      setInputMode(m.id)
                      setModeMenuOpen(false)
                    }}
                  >
                    <m.icon size={16} />
                    <span>{m.label}</span>
                    {inputMode === m.id && <Check size={14} className="check-icon" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            style={{ display: 'none' }}
          />
          
          <button 
            className="settings-btn" 
            title="Add Reference Image"
            onClick={() => fileInputRef.current?.click()}
            style={{ marginRight: '8px', color: referenceImage ? '#4caf50' : 'inherit' }}
          >
            <ImageIcon size={18} />
          </button>

          <input 
            type="text" 
            placeholder="Describe the video you want to create..." 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            disabled={isGenerating}
          />
          
          <button 
            className="generate-btn" 
            onClick={handleGenerate}
            disabled={(!prompt && !referenceImage) || isGenerating}
          >
            <Play size={18} fill="currentColor" />
          </button>
        </div>
        
        <div className="footer-note">
          Veo is a paid-only model. You will be charged on your Cloud project.
        </div>
      </div>
    </div>
  )
}

export default VideoGenContainer
