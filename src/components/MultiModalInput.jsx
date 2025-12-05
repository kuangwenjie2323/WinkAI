import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Plus, Play, ChevronDown, Cpu, ImageIcon } from 'lucide-react'
import { useStore } from '../store/useStore'
import './MultiModalInput.css'

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function MultiModalInput({ onSend, disabled = false, mode = 'chat' }) {
  const { t } = useTranslation()
  const [text, setText] = useState('')
  const [images, setImages] = useState([])
  const [modelMenuOpen, setModelMenuOpen] = useState(false)
  const textareaRef = useRef(null)
  const modelMenuRef = useRef(null)

  const {
    addToImageLibrary,
    currentProvider,
    currentModel,
    providers,
    dynamicModels,
    customModels,
    setCurrentModel
  } = useStore()

  // 合并模型列表
  const mergedModels = useMemo(() => {
    const defaults = providers?.[currentProvider]?.models || []
    const dynamic = dynamicModels?.[currentProvider] || []
    const custom = customModels?.[currentProvider] || []
    const all = [
      ...defaults.map(id => ({ id, name: id })),
      ...dynamic,
      ...custom
    ]
    return Array.from(new Map(all.map(m => [m.id, m])).values())
  }, [providers, dynamicModels, customModels, currentProvider])

  const provider = providers?.[currentProvider]
  const displayModel = currentModel || provider?.defaultModel || ''
  // 截断显示的模型名称
  const shortModelName = displayModel.length > 16 ? displayModel.slice(0, 14) + '...' : displayModel

  const trimmedText = text.trim()
  const sendDisabled = disabled || (!trimmedText && images.length === 0)

  // 点击外部关闭模型菜单
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target)) {
        setModelMenuOpen(false)
      }
    }
    if (modelMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [modelMenuOpen])

  // 处理图片上传
  const onDrop = useCallback((acceptedFiles) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        setImages((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            file,
            preview: reader.result,
            name: file.name,
            size: file.size,
            saveToLibrary: false
          }
        ])
      }
      reader.readAsDataURL(file)
    })
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg']
    },
    noClick: true,
    noKeyboard: true,
    disabled: mode === 'video'
  })

  const { onClick: _dropzoneOnClick, ...dropzoneRootProps } = getRootProps()

  // 移除图片
  const removeImage = (id) => {
    setImages(images.filter((img) => img.id !== id))
  }

  // 发送消息
  const handleSend = () => {
    const trimmedText = text.trim()
    if (!trimmedText && images.length === 0) return
    if (disabled) return

    // 保存标记为"保存到库"的图片
    images.forEach(img => {
      if (img.saveToLibrary) {
        addToImageLibrary({
          name: img.name,
          url: img.preview,
          size: img.size
        })
      }
    })

    onSend({
      text: trimmedText,
      images: images.length > 0 ? images.map((img) => img.preview) : null
    })

    setText('')
    setImages([])
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  // 键盘事件
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // 自动调整文本框高度
  const handleTextChange = (e) => {
    setText(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }

  // 打开文件选择器
  const openFilePicker = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true
    input.onchange = (e) => {
      const files = Array.from(e.target.files)
      files.forEach((file) => {
        const reader = new FileReader()
        reader.onload = () => {
          setImages((prev) => [
            ...prev,
            {
              id: Date.now() + Math.random(),
              file,
              preview: reader.result,
              name: file.name,
              size: file.size,
              saveToLibrary: false
            }
          ])
        }
        reader.readAsDataURL(file)
      })
    }
    input.click()
  }

  // 选择模型
  const handleSelectModel = (modelId) => {
    setCurrentModel(modelId)
    setModelMenuOpen(false)
  }

  return (
    <div className="multimodal-input-container" {...dropzoneRootProps}>
      <input {...getInputProps()} style={{ display: 'none' }} />
      {isDragActive && (
        <div className="drag-overlay">
          <div className="drag-content">
            <Upload size={48} />
            <p>{t('chat.drag_drop')}</p>
          </div>
        </div>
      )}

      {/* 附件缩略图区域 - 改进样式 */}
      {images.length > 0 && (
        <div className="attachments-bar">
          {images.map((img) => (
            <div key={img.id} className="attachment-chip">
              <div className="attachment-thumb">
                <img src={img.preview} alt={img.name} />
              </div>
              <div className="attachment-info">
                <span className="attachment-name">{img.name}</span>
                <span className="attachment-size">{formatFileSize(img.size)}</span>
              </div>
              <button
                className="attachment-remove"
                onClick={() => removeImage(img.id)}
                type="button"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 输入区域 */}
      <div className="input-wrapper">
        {/* 模型选择按钮 */}
        <div className="model-selector" ref={modelMenuRef}>
          <button
            className="model-trigger"
            onClick={() => setModelMenuOpen(!modelMenuOpen)}
            type="button"
            title={displayModel}
          >
            <Cpu size={14} />
            <span className="model-name">{shortModelName}</span>
            <ChevronDown size={12} className={modelMenuOpen ? 'rotated' : ''} />
          </button>
          {modelMenuOpen && (
            <div className="model-menu">
              {mergedModels.map((m) => (
                <button
                  key={m.id}
                  className={`model-option ${m.id === displayModel ? 'active' : ''}`}
                  onClick={() => handleSelectModel(m.id)}
                >
                  {m.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 上传按钮 */}
        {mode !== 'video' && (
          <button
            className="upload-btn"
            onClick={openFilePicker}
            disabled={disabled}
            type="button"
            title={t('sidebar.import_file')}
          >
            <Plus size={20} />
          </button>
        )}

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={
            mode === 'image'
              ? t('chat.input_placeholder_image')
              : mode === 'video'
                ? t('chat.input_placeholder_video')
                : t('chat.input_placeholder')
          }
          disabled={disabled}
          className="message-textarea"
          rows={1}
        />

        {/* Run 按钮 - Google AI Studio 风格 */}
        <button
          className="run-btn"
          onClick={handleSend}
          disabled={sendDisabled}
          type="button"
          title={t('chat.run_tooltip') || 'Run (Enter)'}
        >
          <Play size={20} fill="currentColor" />
        </button>
      </div>
    </div>
  )
}

export default MultiModalInput
