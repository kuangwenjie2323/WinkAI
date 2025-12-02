import { useStore } from '../store/useStore'
import { Image, Trash2, Upload } from 'lucide-react'
import './ImageLibrary.css'

function ImageLibrary() {
  const { imageLibrary, deleteFromImageLibrary } = useStore()

  const handleDelete = (e, imageId) => {
    e.stopPropagation()
    if (window.confirm('确定要删除这张图片吗？')) {
      deleteFromImageLibrary(imageId)
    }
  }

  const handleImageClick = (image) => {
    // TODO: 插入到输入框或预览
    console.log('Image clicked:', image)
  }

  return (
    <div className="library-container">
      <div className="library-header">
        <span className="library-label">图片库</span>
        <span className="library-count">{imageLibrary.length}</span>
      </div>

      {imageLibrary.length === 0 ? (
        <div className="library-empty">
          <Image size={40} />
          <p>暂无图片</p>
          <span>上传图片时选择"保存到库"</span>
        </div>
      ) : (
        <div className="library-grid">
          {imageLibrary.map((image) => (
            <div
              key={image.id}
              className="library-item"
              onClick={() => handleImageClick(image)}
            >
              <div className="library-item-preview">
                <img src={image.url} alt={image.name} />
              </div>
              <div className="library-item-info">
                <span className="library-item-name">{image.name}</span>
                <span className="library-item-size">
                  {(image.size / 1024).toFixed(1)}KB
                </span>
              </div>
              <button
                className="library-item-delete"
                onClick={(e) => handleDelete(e, image.id)}
                title="删除"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ImageLibrary
