import { useStore } from '../store/useStore'
import { Video, Trash2, Play } from 'lucide-react'
import './VideoLibrary.css'

function VideoLibrary() {
  const { videoLibrary, deleteFromVideoLibrary } = useStore()

  const handleDelete = (e, videoId) => {
    e.stopPropagation()
    if (window.confirm('确定要删除这个视频吗？')) {
      deleteFromVideoLibrary(videoId)
    }
  }

  const handleVideoClick = (video) => {
    // TODO: 插入到输入框或预览
    console.log('Video clicked:', video)
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="library-container">
      <div className="library-header">
        <span className="library-label">视频库</span>
        <span className="library-count">{videoLibrary.length}</span>
      </div>

      {videoLibrary.length === 0 ? (
        <div className="library-empty">
          <Video size={40} />
          <p>暂无视频</p>
          <span>上传视频时选择"保存到库"</span>
        </div>
      ) : (
        <div className="library-grid">
          {videoLibrary.map((video) => (
            <div
              key={video.id}
              className="library-item video-item"
              onClick={() => handleVideoClick(video)}
            >
              <div className="library-item-preview">
                {video.thumbnail ? (
                  <img src={video.thumbnail} alt={video.name} />
                ) : (
                  <div className="video-placeholder">
                    <Video size={32} />
                  </div>
                )}
                <div className="video-play-overlay">
                  <Play size={24} />
                </div>
                {video.duration && (
                  <div className="video-duration">
                    {formatDuration(video.duration)}
                  </div>
                )}
              </div>
              <div className="library-item-info">
                <span className="library-item-name">{video.name}</span>
                <span className="library-item-size">
                  {(video.size / 1024 / 1024).toFixed(1)}MB
                </span>
              </div>
              <button
                className="library-item-delete"
                onClick={(e) => handleDelete(e, video.id)}
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

export default VideoLibrary
