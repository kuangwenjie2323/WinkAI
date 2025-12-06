import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'
import { toast } from 'react-hot-toast'
import { X, Settings as SettingsIcon, Cpu, Sliders, LogIn, LogOut, Video } from 'lucide-react'
import aiService from '../services/aiService'
import googleAuthService from '../services/googleAuth'
import './SettingsPanel.css'

function SettingsPanel({ isOpen, onClose }) {
  const { t, i18n } = useTranslation()
  const {
    providers,
    currentProvider,
    currentModel,
    settings,
    setProviderApiKey,
    setProviderBaseURL,
    setProviderApiType,
    setProviderCorsProxyUrl,
    setCurrentProvider,
    setCurrentModel,
    updateSettings,
    testResults,
    setTestResult,
    setDynamicModels,
    googleOAuth,
    setGoogleOAuthStatus
  } = useStore()

  const [activeTab, setActiveTab] = useState('providers')
  const [showApiKey, setShowApiKey] = useState({})
  const [testing, setTesting] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)

  // 初始化和监控 Google OAuth 状态
  useEffect(() => {
    // 初始化 Google Auth Service
    googleAuthService.init().catch(console.error)

    // 定时检查 Token 状态
    const checkInterval = setInterval(() => {
      const status = googleAuthService.getStatus()
      if (googleOAuth.isLoggedIn !== status.isLoggedIn) {
        setGoogleOAuthStatus(status.isLoggedIn, status.tokenExpiry)
      }
    }, 10000)

    return () => clearInterval(checkInterval)
  }, [googleOAuth.isLoggedIn, setGoogleOAuthStatus])

  // Google OAuth 登录
  const handleGoogleLogin = async () => {
    setOauthLoading(true)
    try {
      const token = await googleAuthService.requestAccessToken()
      if (token) {
        const status = googleAuthService.getStatus()
        setGoogleOAuthStatus(true, status.tokenExpiry)
        toast.success('Google 登录成功！')
      }
    } catch (error) {
      toast.error(`Google 登录失败: ${error.message}`)
    } finally {
      setOauthLoading(false)
    }
  }

  // Google OAuth 登出
  const handleGoogleLogout = async () => {
    await googleAuthService.revokeToken()
    setGoogleOAuthStatus(false, null)
    toast.success('已退出 Google 账户')
  }

  // 检查 OAuth Client ID 是否配置
  const isOAuthConfigured = !!import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID

  // 获取环境变量
  const envKeys = {
    openai: import.meta.env.VITE_OPENAI_API_KEY,
    anthropic: import.meta.env.VITE_ANTHROPIC_API_KEY,
    google: import.meta.env.VITE_GOOGLE_API_KEY,
    vertex: import.meta.env.VITE_VERTEX_API_KEY,
    custom: import.meta.env.VITE_CUSTOM_API_KEY
  }

  const handleTestConnection = async (providerKey) => {
    setTesting(true)
    const loadingToast = toast.loading(t('settings.testing'))

    const mergedApiKey = aiService.getApiKey(providerKey)
    const mergedEndpoint = aiService.getApiEndpoint(providerKey)

    const config = {
      apiKey: mergedApiKey,
      endpoint: mergedEndpoint,
      apiType: providers[providerKey].apiType || 'openai',
      corsProxyUrl: providers[providerKey].corsProxyUrl || ''
    }

    try {
      const result = await aiService.testConnection(providerKey, config)
      setTestResult(providerKey, result)

      if (result.success) {
        toast.success(t('settings.test_success'), { id: loadingToast })
        if (result.models && result.models.length > 0) {
          setDynamicModels(providerKey, result.models)
        }
      } else {
        toast.error(`${t('settings.test_fail')}: ${result.error}`, { id: loadingToast })
      }
    } catch (error) {
      setTestResult(providerKey, {
        success: false,
        error: error.message,
        models: []
      })
      toast.error(`${t('common.error')}: ${error.message}`, { id: loadingToast })
    } finally {
      setTesting(false)
    }
  }

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng)
  }

  if (!isOpen) return null

  const provider = providers[currentProvider]
  const effectiveApiKey = aiService.getApiKey(currentProvider)

  const toggleApiKeyVisibility = (providerKey) => {
    setShowApiKey(prev => ({ ...prev, [providerKey]: !prev[providerKey] }))
  }

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        {/* 头部 */}
        <div className="settings-header">
          <div className="settings-title">
            <SettingsIcon size={24} />
            <h2>{t('settings.title')}</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* 标签页 */}
        <div className="settings-tabs">
          <button
            className={`tab-btn ${activeTab === 'providers' ? 'active' : ''}`}
            onClick={() => setActiveTab('providers')}
          >
            <Cpu size={18} />
            {t('settings.tab_providers')}
          </button>
          <button
            className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <Sliders size={18} />
            {t('settings.tab_general')}
          </button>
        </div>

        {/* 内容区域 */}
        <div className="settings-content">
          {activeTab === 'providers' && (
            <div className="settings-section">
              <h3>{t('settings.provider_select')}</h3>

              {/* 提供商选择 */}
              <div className="provider-grid">
                {Object.keys(providers).map((key) => (
                  <button
                    key={key}
                    className={`provider-card ${currentProvider === key ? 'active' : ''}`}
                    onClick={() => setCurrentProvider(key)}
                  >
                    <div className="provider-icon">
                      {key === 'openai' && '🤖'}
                      {key === 'anthropic' && '🧠'}
                      {key === 'google' && '🔷'}
                      {key === 'vertex' && '🎬'}
                      {key === 'custom' && '⚙️'}
                    </div>
                    <div className="provider-name">{providers[key].name}</div>
                    {key === 'vertex' && (
                      <div className="provider-badge">
                        <Video size={12} />
                        <span>Veo</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* API Key 配置 */}
              <div className="form-group">
                <label>
                  {t('settings.api_key_label')}
                  <span className="label-hint">
                    {currentProvider === 'openai' && ' (platform.openai.com)'}
                    {currentProvider === 'anthropic' && ' (console.anthropic.com)'}
                    {currentProvider === 'google' && ' (aistudio.google.com)'}
                    {currentProvider === 'vertex' && ' (console.cloud.google.com)'}
                  </span>
                </label>
                <div className="api-key-group">
                  <div className="input-with-toggle">
                    <input
                      type={showApiKey[currentProvider] ? 'text' : 'password'}
                      value={envKeys[currentProvider] || provider.apiKey || ''}
                      onChange={(e) => setProviderApiKey(currentProvider, e.target.value)}
                      placeholder={envKeys[currentProvider] ? t('settings.api_key_env') : t('settings.api_key_placeholder', { provider: provider.name })}
                      className="api-key-input"
                      disabled={currentProvider !== 'custom' && !!envKeys[currentProvider]}
                    />
                    <button
                      type="button"
                      className="toggle-visibility-btn"
                      onClick={() => toggleApiKeyVisibility(currentProvider)}
                    >
                      {showApiKey[currentProvider] ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  <button
                    className="test-btn"
                    onClick={() => handleTestConnection(currentProvider)}
                    disabled={(currentProvider !== 'custom' && !effectiveApiKey) || testing}
                  >
                    {testing ? t('settings.testing') : t('settings.test_connection')}
                  </button>
                </div>
                {envKeys[currentProvider] && (
                  <div className="env-hint">
                    🔒 {t('settings.api_key_env')}
                  </div>
                )}
                {testResults[currentProvider] && (
                  <div className={`test-result ${testResults[currentProvider].success ? 'success' : 'error'}`}>
                    {testResults[currentProvider].success ? (
                      <>
                        <div className="test-success">
                          ✓ {testResults[currentProvider].message}
                          <span className="response-time">
                            ({testResults[currentProvider].responseTime}ms)
                          </span>
                        </div>
                        {testResults[currentProvider].models?.length > 0 && (
                          <div className="models-list">
                            可用模型: {testResults[currentProvider].models.slice(0, 5).map(m => m.id || m.name).join(', ')}
                            {testResults[currentProvider].models.length > 5 && ` 等${testResults[currentProvider].models.length}个`}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="test-error">
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>✗ {t('settings.test_fail')}</div>
                        <div style={{ fontSize: '0.875rem', opacity: 0.9, wordBreak: 'break-word' }}>
                          {testResults[currentProvider].error}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Vertex AI Google OAuth 登录 */}
              {currentProvider === 'vertex' && (
                <div className="form-group vertex-oauth-section">
                  {/* Project ID 配置 */}
                  <div className="vertex-config">
                    <label>
                      Project ID
                      <span className="label-hint">(Google Cloud 项目ID，必填)</span>
                    </label>
                    <input
                      type="text"
                      value={import.meta.env.VITE_VERTEX_PROJECT_ID || provider.projectId || ''}
                      onChange={(e) => {
                        const { providers: p, setProviderApiKey: s } = useStore.getState()
                        useStore.setState({
                          providers: {
                            ...p,
                            vertex: { ...p.vertex, projectId: e.target.value }
                          }
                        })
                      }}
                      placeholder="your-project-id"
                      className="api-key-input"
                      disabled={!!import.meta.env.VITE_VERTEX_PROJECT_ID}
                    />
                    {import.meta.env.VITE_VERTEX_PROJECT_ID && (
                      <div className="env-hint">🔒 已通过环境变量配置</div>
                    )}
                  </div>

                  <label style={{ marginTop: '16px' }}>
                    Google 账户认证
                    <span className="label-hint">(Vertex AI 需要 OAuth 认证)</span>
                  </label>

                  {!isOAuthConfigured ? (
                    <div className="oauth-warning">
                      <p>⚠️ 未配置 OAuth Client ID</p>
                      <p className="hint">请在环境变量中配置 <code>VITE_GOOGLE_OAUTH_CLIENT_ID</code></p>
                      <p className="hint">在 Google Cloud Console 创建 OAuth 2.0 客户端 ID (Web 应用类型)</p>
                    </div>
                  ) : googleOAuth.isLoggedIn ? (
                    <div className="oauth-status logged-in">
                      <div className="status-info">
                        <span className="status-icon">✓</span>
                        <span>已登录 Google 账户</span>
                        {googleOAuth.tokenExpiry && (
                          <span className="token-expiry">
                            (Token 有效至: {new Date(googleOAuth.tokenExpiry).toLocaleTimeString()})
                          </span>
                        )}
                      </div>
                      <button
                        className="oauth-btn logout"
                        onClick={handleGoogleLogout}
                      >
                        <LogOut size={16} />
                        退出登录
                      </button>
                    </div>
                  ) : (
                    <div className="oauth-status logged-out">
                      <p className="hint">登录 Google 账户以获取 Vertex AI 访问权限（支持 Veo 视频生成）</p>
                      <button
                        className="oauth-btn login google-login-btn"
                        onClick={handleGoogleLogin}
                        disabled={oauthLoading}
                      >
                        <LogIn size={16} />
                        {oauthLoading ? '登录中...' : '使用 Google 账户登录'}
                      </button>
                    </div>
                  )}

                  <div className="vertex-info">
                    <p>💡 Vertex AI 支持的功能：</p>
                    <ul>
                      <li><Video size={14} /> Veo 3.0 / 2.0 视频生成</li>
                      <li>🖼️ Imagen 3.0 图片生成</li>
                      <li>💬 Gemini 2.0 / 1.5 对话</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* 自定义 API URL */}
              {currentProvider === 'custom' && (
                <>
                  <div className="form-group">
                    <label>{t('settings.custom_url')}</label>
                    <input
                      type="url"
                      value={provider.baseURL || ''}
                      onChange={(e) => setProviderBaseURL(currentProvider, e.target.value)}
                      placeholder="https://api.example.com/v1"
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('settings.custom_type')}</label>
                    <select
                      value={provider.apiType || 'openai'}
                      onChange={(e) => setProviderApiType(currentProvider, e.target.value)}
                      className="model-select"
                    >
                      <option value="openai">OpenAI 兼容</option>
                      <option value="anthropic">Anthropic Claude</option>
                      <option value="google">Google Gemini</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>{t('settings.cors_proxy')}</label>
                    <input
                      type="url"
                      value={provider.corsProxyUrl || ''}
                      onChange={(e) => setProviderCorsProxyUrl(currentProvider, e.target.value)}
                      placeholder="https://your-proxy.com/"
                    />
                  </div>
                </>
              )}

              {/* 模型选择 */}
              <div className="form-group">
                <label>{t('settings.model_label')}</label>
                <select
                  value={currentModel || provider.defaultModel || ''}
                  onChange={(e) => setCurrentModel(e.target.value)}
                  className="model-select"
                >
                  {provider.models && provider.models.length > 0 ? (
                    provider.models.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))
                  ) : (
                    <option value="">{t('settings.model_placeholder')}</option>
                  )}
                </select>
              </div>
            </div>
          )}

          {activeTab === 'general' && (
            <div className="settings-section">
              <h3>{t('settings.tab_general')}</h3>

              {/* 语言选择 */}
              <div className="form-group">
                <label>{t('settings.language_label')}</label>
                <select
                  value={i18n.language}
                  onChange={(e) => changeLanguage(e.target.value)}
                  className="model-select"
                >
                  <option value="en">English</option>
                  <option value="zh">中文 (Chinese)</option>
                </select>
              </div>

              {/* Temperature */}
              <div className="form-group">
                <label>
                  {t('settings.temp_label')}
                  <span className="setting-value">{settings.temperature.toFixed(1)}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(e) =>
                    updateSettings({ temperature: parseFloat(e.target.value) })
                  }
                  className="slider"
                />
              </div>

              {/* Max Tokens */}
              <div className="form-group">
                <label>{t('settings.max_tokens_label')}</label>
                <input
                  type="number"
                  value={settings.maxTokens}
                  onChange={(e) =>
                    updateSettings({ maxTokens: parseInt(e.target.value) || 1000 })
                  }
                  min="100"
                  max="32000"
                  step="1000"
                />
                <p className="form-hint">
                  {t('settings.max_tokens_hint') || 'Limit the length of each response (Default: 8192)'}
                </p>
              </div>

              <h3 className="section-title">功能开关</h3>

              {/* 流式输出 */}
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.streamingEnabled}
                    onChange={(e) =>
                      updateSettings({ streamingEnabled: e.target.checked })
                    }
                  />
                  <span>{t('settings.stream_label')}</span>
                </label>
              </div>

              {/* 思考模式 */}
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.enableThinking}
                    onChange={(e) =>
                      updateSettings({ enableThinking: e.target.checked })
                    }
                  />
                  <span>{t('settings.thinking_label')}</span>
                </label>
              </div>

              {/* 自动保存 */}
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.autoSaveHistory}
                    onChange={(e) =>
                      updateSettings({ autoSaveHistory: e.target.checked })
                    }
                  />
                  <span>{t('settings.autosave_label')}</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* 底部信息 */}
        <div className="settings-footer">
          <p className="footer-note">
            {t('settings.local_storage_note')}
          </p>
        </div>
      </div>
    </div>
  )
}

export default SettingsPanel
