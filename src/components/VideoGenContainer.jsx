import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'
import { Play, Settings2, Type, Image as ImageIcon, Film, ChevronDown, Check } from 'lucide-react'
import aiService from '../services/aiService'
import './VideoGenContainer.css'

function VideoGenContainer() {
  const { t } = useTranslation()
  const { providers, currentProvider } = useStore()
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [videoUrl, setVideoUrl] = useState(null)
  const [aspectRatio, setAspectRatio] = useState('16:9')
  const [resolution, setResolution] = useState('720p')
  const [model, setModel] = useState('veo-2.0-generate-001')
  
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

  // 视频模型列表
  const videoModels = [
    'veo-2.0-generate-001',
    'veo-3.0-generate-preview'
  ]

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setIsGenerating(true)
    setVideoUrl(null)

    try {
      const messages = [{ role: 'user', content: prompt }]
      const providerConfig = providers[currentProvider] || {}
      
      const iterator = aiService.streamChatVertex(messages, model, {
        projectId: providerConfig.projectId,
        location: providerConfig.location
      })
      
      for await (const chunk of iterator) {
        if (chunk.type === 'content') {
          console.log('Chunk:', chunk)
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
                <option key={m} value={m}>{m}</option>
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
        </div>

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
            type="text" 
            placeholder="Describe the video you want to create..." 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            disabled={isGenerating}
          />
          
          <button className="settings-btn" title="Advanced Settings">
            <Settings2 size={18} />
          </button>
          
          <button 
            className="generate-btn" 
            onClick={handleGenerate}
            disabled={!prompt || isGenerating}
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
