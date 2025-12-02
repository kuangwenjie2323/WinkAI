import { useState, useRef, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Send, X, Image as ImageIcon, Save } from 'lucide-react'
import { useStore } from '../store/useStore'
import './MultiModalInput.css'

function MultiModalInput({ onSend, disabled = false }) {
  const [text, setText] = useState('')
  const [images, setImages] = useState([])
  const textareaRef = useRef(null)
  const { addToImageLibrary } = useStore()

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
            saveToLibrary: false // 默认不保存到库
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
    noKeyboard: true
  })

  // 移除图片
  const removeImage = (id) => {
    setImages(images.filter((img) => img.id !== id))
  }

  // 切换"保存到库"状态
  const toggleSaveToLibrary = (id) => {
    setImages(images.map(img =>
      img.id === id ? { ...img, saveToLibrary: !img.saveToLibrary } : img
    ))
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

  return (
    <div className="multimodal-input-container" {...getRootProps()}>
      {isDragActive && (
        <div className="drag-overlay">
          <div className="drag-content">
            <Upload size={48} />
            <p>释放以上传图片</p>
          </div>
        </div>
      )}

      {/* 图片预览区域 */}
      {images.length > 0 && (
        <div className="image-preview-area">
          {images.map((img) => (
            <div key={img.id} className="image-preview-item">
              <img src={img.preview} alt={img.name} />
              <button
                className="remove-image-btn"
                onClick={() => removeImage(img.id)}
                type="button"
              >
                <X size={16} />
              </button>
              <button
                className={`save-to-library-btn ${img.saveToLibrary ? 'active' : ''}`}
                onClick={() => toggleSaveToLibrary(img.id)}
                type="button"
                title={img.saveToLibrary ? '已标记保存' : '保存到图片库'}
              >
                <Save size={14} />
              </button>
              <div className="image-name">{img.name}</div>
            </div>
          ))}
        </div>
      )}

      {/* 输入区域 */}
      <div className="input-wrapper">
        {/* 上传按钮 */}
        <button
          className="upload-btn"
          onClick={openFilePicker}
          disabled={disabled}
          type="button"
          title="上传图片"
        >
          <ImageIcon size={20} />
        </button>

        {/* 文本输入框 */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
          disabled={disabled}
          className="message-textarea"
          rows={1}
        />

        {/* 发送按钮 */}
        <button
          className="send-btn"
          onClick={handleSend}
          disabled={disabled || (!text.trim() && images.length === 0)}
          type="button"
          title="发送消息"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  )
}

export default MultiModalInput
