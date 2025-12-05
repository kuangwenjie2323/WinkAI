/**
 * 清新简约插画风格头像组件
 * Fresh & Minimalist Illustration Avatar
 * 适配深色主题
 */

// 用户头像 - 清新简约人物
export function UserAvatar({ size = 40, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* 背景渐变 - 清新蓝绿色 */}
        <linearGradient id="userBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#2DD4BF" />
        </linearGradient>
        {/* 肤色渐变 */}
        <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
        {/* 头发渐变 */}
        <linearGradient id="hairGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6B7280" />
          <stop offset="100%" stopColor="#4B5563" />
        </linearGradient>
      </defs>

      {/* 背景圆 */}
      <circle cx="20" cy="20" r="20" fill="url(#userBgGrad)" />

      {/* 身体 - 简约衣服 */}
      <ellipse cx="20" cy="38" rx="14" ry="10" fill="#E0F2FE" />

      {/* 脖子 */}
      <rect x="17" y="24" width="6" height="4" rx="2" fill="url(#skinGrad)" />

      {/* 头部 */}
      <circle cx="20" cy="16" r="9" fill="url(#skinGrad)" />

      {/* 头发 */}
      <path
        d="M11 14 Q11 6 20 6 Q29 6 29 14 Q29 9 20 9 Q11 9 11 14"
        fill="url(#hairGrad)"
      />
      {/* 刘海 */}
      <path
        d="M14 12 Q16 10 20 10 Q24 10 26 12"
        stroke="url(#hairGrad)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />

      {/* 眼睛 */}
      <ellipse cx="16.5" cy="15" rx="1.5" ry="2" fill="#1E293B" />
      <ellipse cx="23.5" cy="15" rx="1.5" ry="2" fill="#1E293B" />
      {/* 眼睛高光 */}
      <circle cx="17" cy="14.5" r="0.6" fill="white" />
      <circle cx="24" cy="14.5" r="0.6" fill="white" />

      {/* 腮红 */}
      <ellipse cx="13" cy="18" rx="2" ry="1.2" fill="#FDA4AF" opacity="0.5" />
      <ellipse cx="27" cy="18" rx="2" ry="1.2" fill="#FDA4AF" opacity="0.5" />

      {/* 微笑 */}
      <path
        d="M17 20 Q20 22.5 23 20"
        stroke="#92400E"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}

// AI 头像 - 清新智能助手
export function AIAvatar({ size = 40, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* 背景渐变 - 清新紫粉色 */}
        <linearGradient id="aiBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A78BFA" />
          <stop offset="100%" stopColor="#F472B6" />
        </linearGradient>
        {/* 面部渐变 */}
        <linearGradient id="faceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FAFAFA" />
          <stop offset="100%" stopColor="#E5E7EB" />
        </linearGradient>
        {/* 眼睛发光 */}
        <linearGradient id="eyeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#818CF8" />
        </linearGradient>
      </defs>

      {/* 背景圆 */}
      <circle cx="20" cy="20" r="20" fill="url(#aiBgGrad)" />

      {/* 外圈装饰 */}
      <circle
        cx="20"
        cy="20"
        r="17"
        fill="none"
        stroke="white"
        strokeWidth="0.5"
        opacity="0.3"
      />

      {/* 头部/面部 */}
      <circle cx="20" cy="18" r="11" fill="url(#faceGrad)" />

      {/* 耳朵/天线 */}
      <circle cx="9" cy="14" r="3" fill="url(#faceGrad)" />
      <circle cx="31" cy="14" r="3" fill="url(#faceGrad)" />
      <circle cx="9" cy="14" r="1.5" fill="url(#eyeGlow)" />
      <circle cx="31" cy="14" r="1.5" fill="url(#eyeGlow)" />

      {/* 眼睛 */}
      <ellipse cx="15" cy="17" rx="3" ry="3.5" fill="url(#eyeGlow)" />
      <ellipse cx="25" cy="17" rx="3" ry="3.5" fill="url(#eyeGlow)" />
      {/* 眼睛高光 */}
      <circle cx="16" cy="16" r="1" fill="white" />
      <circle cx="26" cy="16" r="1" fill="white" />
      <circle cx="14.5" cy="18" r="0.5" fill="white" opacity="0.6" />
      <circle cx="24.5" cy="18" r="0.5" fill="white" opacity="0.6" />

      {/* 微笑嘴巴 */}
      <path
        d="M15 23 Q20 26 25 23"
        stroke="#6366F1"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />

      {/* 腮红 */}
      <ellipse cx="11" cy="20" rx="2" ry="1" fill="#FBCFE8" opacity="0.6" />
      <ellipse cx="29" cy="20" rx="2" ry="1" fill="#FBCFE8" opacity="0.6" />

      {/* 顶部光点装饰 */}
      <circle cx="20" cy="5" r="1.5" fill="white" opacity="0.8" />
      <circle cx="15" cy="7" r="1" fill="white" opacity="0.5" />
      <circle cx="25" cy="7" r="1" fill="white" opacity="0.5" />

      {/* 身体轮廓 */}
      <path
        d="M13 29 Q13 32 20 33 Q27 32 27 29"
        fill="url(#faceGrad)"
      />
    </svg>
  )
}

export default { UserAvatar, AIAvatar }
