import userAvatarImg from '../assets/user_avatar.png'
import aiAvatarImg from '../assets/ai_avatar.png'

/**
 * 头像组件 - 使用自定义插图
 */

// 用户头像
export function UserAvatar({ size = 40, className = '' }) {
  return (
    <img
      src={userAvatarImg}
      alt="User"
      width={size}
      height={size}
      className={className}
      style={{ 
        width: size, 
        height: size, 
        borderRadius: '50%', 
        objectFit: 'cover',
        display: 'block'
      }}
    />
  )
}

// AI 头像
export function AIAvatar({ size = 40, className = '' }) {
  return (
    <img
      src={aiAvatarImg}
      alt="AI"
      width={size}
      height={size}
      className={className}
      style={{ 
        width: size, 
        height: size, 
        borderRadius: '50%', 
        objectFit: 'cover',
        display: 'block'
      }}
    />
  )
}

export default { UserAvatar, AIAvatar }