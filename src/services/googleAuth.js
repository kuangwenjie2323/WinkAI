/**
 * Google OAuth 服务
 * 用于获取 Vertex AI Access Token
 */

// Google OAuth 配置（需要用户在 Google Cloud Console 创建 OAuth 客户端 ID）
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID || ''

// Vertex AI 需要的 OAuth 作用域
const SCOPES = [
  'https://www.googleapis.com/auth/cloud-platform',
  'https://www.googleapis.com/auth/generative-language.tuning'
].join(' ')

class GoogleAuthService {
  constructor() {
    this.tokenClient = null
    this.accessToken = null
    this.tokenExpiry = null
    this.isInitialized = false
    this.initPromise = null
  }

  /**
   * 初始化 Google Identity Services
   */
  async init() {
    // 防止重复初始化
    if (this.initPromise) return this.initPromise
    if (this.isInitialized) return Promise.resolve()

    this.initPromise = new Promise((resolve, reject) => {
      // 检查是否配置了 Client ID
      if (!GOOGLE_CLIENT_ID) {
        console.warn('未配置 VITE_GOOGLE_OAUTH_CLIENT_ID，Vertex AI OAuth 登录不可用')
        resolve()
        return
      }

      // 加载 Google Identity Services 脚本
      if (!document.getElementById('google-gsi-script')) {
        const script = document.createElement('script')
        script.id = 'google-gsi-script'
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.onload = () => this._initTokenClient(resolve, reject)
        script.onerror = () => reject(new Error('加载 Google 登录脚本失败'))
        document.head.appendChild(script)
      } else if (window.google?.accounts?.oauth2) {
        this._initTokenClient(resolve, reject)
      } else {
        // 脚本已存在但还未加载完成，等待
        const checkInterval = setInterval(() => {
          if (window.google?.accounts?.oauth2) {
            clearInterval(checkInterval)
            this._initTokenClient(resolve, reject)
          }
        }, 100)

        setTimeout(() => {
          clearInterval(checkInterval)
          reject(new Error('Google 登录脚本加载超时'))
        }, 10000)
      }
    })

    return this.initPromise
  }

  /**
   * 初始化 Token Client
   */
  _initTokenClient(resolve, reject) {
    try {
      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (response) => {
          if (response.error) {
            console.error('OAuth 错误:', response.error)
            this._onTokenCallback?.(null, response.error)
            return
          }

          this.accessToken = response.access_token
          // Access Token 默认有效期 1 小时
          this.tokenExpiry = Date.now() + (response.expires_in || 3600) * 1000

          this._onTokenCallback?.(this.accessToken, null)
        }
      })

      this.isInitialized = true
      resolve()
    } catch (error) {
      reject(error)
    }
  }

  /**
   * 请求 Access Token（触发 Google 登录弹窗）
   * @returns {Promise<string>} Access Token
   */
  async requestAccessToken() {
    await this.init()

    if (!this.tokenClient) {
      throw new Error('未配置 Google OAuth Client ID (VITE_GOOGLE_OAUTH_CLIENT_ID)')
    }

    // 如果已有有效 Token，直接返回
    if (this.isTokenValid()) {
      return this.accessToken
    }

    return new Promise((resolve, reject) => {
      this._onTokenCallback = (token, error) => {
        this._onTokenCallback = null
        if (error) {
          reject(new Error(`Google 登录失败: ${error}`))
        } else {
          resolve(token)
        }
      }

      // 触发登录弹窗
      this.tokenClient.requestAccessToken({ prompt: 'consent' })
    })
  }

  /**
   * 检查当前 Token 是否有效
   */
  isTokenValid() {
    if (!this.accessToken || !this.tokenExpiry) return false
    // 提前 5 分钟认为过期
    return Date.now() < this.tokenExpiry - 5 * 60 * 1000
  }

  /**
   * 获取当前 Access Token（如果有效）
   */
  getAccessToken() {
    if (this.isTokenValid()) {
      return this.accessToken
    }
    return null
  }

  /**
   * 撤销 Access Token（登出）
   */
  async revokeToken() {
    if (this.accessToken && window.google?.accounts?.oauth2) {
      window.google.accounts.oauth2.revoke(this.accessToken, () => {
        console.log('Google Token 已撤销')
      })
    }

    this.accessToken = null
    this.tokenExpiry = null
  }

  /**
   * 获取登录状态信息
   */
  getStatus() {
    return {
      isConfigured: !!GOOGLE_CLIENT_ID,
      isLoggedIn: this.isTokenValid(),
      tokenExpiry: this.tokenExpiry,
      remainingTime: this.tokenExpiry ? Math.max(0, this.tokenExpiry - Date.now()) : 0
    }
  }
}

// 导出单例
const googleAuthService = new GoogleAuthService()
export default googleAuthService
