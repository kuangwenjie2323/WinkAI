import { useState } from 'react'
import { useStore } from '../store/useStore'
import { toast } from 'react-hot-toast'
import { X, Settings as SettingsIcon, Cpu, Sliders } from 'lucide-react'
import aiService from '../services/aiService'
import './SettingsPanel.css'

function SettingsPanel({ isOpen, onClose }) {
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
    setDynamicModels
  } = useStore()

  const [activeTab, setActiveTab] = useState('providers')
  const [showApiKey, setShowApiKey] = useState({})
  const [testing, setTesting] = useState(false)

  // 获取环境变量
  const envKeys = {
    openai: import.meta.env.VITE_OPENAI_API_KEY,
    anthropic: import.meta.env.VITE_ANTHROPIC_API_KEY,
    google: import.meta.env.VITE_GOOGLE_API_KEY,
    custom: import.meta.env.VITE_CUSTOM_API_KEY
  }

  const handleTestConnection = async (providerKey) => {
    setTesting(true)
    const loadingToast = toast.loading('正在测试连接...')

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
        toast.success('连接成功！', { id: loadingToast })
        if (result.models && result.models.length > 0) {
          setDynamicModels(providerKey, result.models)
        }
      } else {
        toast.error(`连接失败: ${result.error}`, { id: loadingToast })
      }
    } catch (error) {
      setTestResult(providerKey, {
        success: false,
        error: error.message,
        models: []
      })
      toast.error(`错误: ${error.message}`, { id: loadingToast })
    } finally {
      setTesting(false)
    }
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
            <h2>设置</h2>
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
            AI 提供商
          </button>
          <button
            className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <Sliders size={18} />
            通用设置
          </button>
        </div>

        {/* 内容区域 */}
        <div className="settings-content">
          {activeTab === 'providers' && (
            <div className="settings-section">
              <h3>选择 AI 提供商</h3>

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
                      {key === 'custom' && '⚙️'}
                    </div>
                    <div className="provider-name">{providers[key].name}</div>
                  </button>
                ))}
              </div>

              {/* API Key 配置 */}
              <div className="form-group">
                <label>
                  API Key
                  <span className="label-hint">
                    {currentProvider === 'openai' && ' (从 platform.openai.com 获取)'}
                    {currentProvider === 'anthropic' && ' (从 console.anthropic.com 获取)'}
                    {currentProvider === 'google' && ' (从 makersuite.google.com 获取)'}
                  </span>
                </label>
                <div className="api-key-group">
                  <div className="input-with-toggle">
                    <input
                      type={showApiKey[currentProvider] ? 'text' : 'password'}
                      value={envKeys[currentProvider] || provider.apiKey || ''}
                      onChange={(e) => setProviderApiKey(currentProvider, e.target.value)}
                      placeholder={envKeys[currentProvider] ? '使用环境变量配置' : `输入 ${provider.name} API Key`}
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
                    {testing ? '测试中...' : '测试'}
                  </button>
                </div>
                {envKeys[currentProvider] && (
                  <div className="env-hint">
                    🔒 使用环境变量配置
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
                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>✗ 连接失败</div>
                        <div style={{ fontSize: '0.875rem', opacity: 0.9, wordBreak: 'break-word' }}>
                          {testResults[currentProvider].error}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 自定义 API URL */}
              {currentProvider === 'custom' && (
                <>
                  <div className="form-group">
                    <label>API 地址</label>
                    <input
                      type="url"
                      value={provider.baseURL || ''}
                      onChange={(e) => setProviderBaseURL(currentProvider, e.target.value)}
                      placeholder="https://api.example.com/v1"
                    />
                    <p className="form-hint">自定义 API 接口地址</p>
                  </div>

                  <div className="form-group">
                    <label>API 类型</label>
                    <select
                      value={provider.apiType || 'openai'}
                      onChange={(e) => setProviderApiType(currentProvider, e.target.value)}
                      className="model-select"
                    >
                      <option value="openai">OpenAI 兼容</option>
                      <option value="anthropic">Anthropic Claude</option>
                      <option value="google">Google Gemini</option>
                    </select>
                    <p className="form-hint">
                      选择自定义 API 使用的协议格式
                    </p>
                  </div>

                  <div className="form-group">
                    <label>CORS 代理地址（可选）</label>
                    <input
                      type="url"
                      value={provider.corsProxyUrl || ''}
                      onChange={(e) => setProviderCorsProxyUrl(currentProvider, e.target.value)}
                      placeholder="https://your-proxy.com/"
                    />
                    <p className="form-hint">
                      如果遇到 CORS 跨域问题，请配置你自己的代理服务器地址。格式: https://proxy.com/
                    </p>
                  </div>
                </>
              )}

              {/* 模型选择 */}
              <div className="form-group">
                <label>模型</label>
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
                    <option value="">请先配置自定义模型</option>
                  )}
                </select>
                <p className="form-hint">
                  {provider.supportsVision && '✓ 支持图片识别'}
                  {provider.supportsStreaming && ' · ✓ 支持流式输出'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'general' && (
            <div className="settings-section">
              <h3>模型参数</h3>

              {/* Temperature */}
              <div className="form-group">
                <label>
                  Temperature
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
                <p className="form-hint">
                  较低值更确定性，较高值更随机 (推荐: 0.7)
                </p>
              </div>

              {/* Max Tokens */}
              <div className="form-group">
                <label>Max Tokens</label>
                <input
                  type="number"
                  value={settings.maxTokens}
                  onChange={(e) =>
                    updateSettings({ maxTokens: parseInt(e.target.value) || 1000 })
                  }
                  min="100"
                  max="32000"
                  step="100"
                />
                <p className="form-hint">
                  单次响应的最大长度 (推荐: 4096)
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
                  <span>启用流式输出</span>
                </label>
                <p className="form-hint">实时显示 AI 响应，提升体验</p>
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
                  <span>显示思考过程</span>
                </label>
                <p className="form-hint">展示 AI 的推理步骤（部分模型支持）</p>
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
                  <span>自动保存对话历史</span>
                </label>
                <p className="form-hint">将对话保存到本地存储</p>
              </div>
            </div>
          )}
        </div>

        {/* 底部信息 */}
        <div className="settings-footer">
          <p className="footer-note">
            💡 API Key 仅保存在浏览器本地，不会上传到服务器
          </p>
        </div>
      </div>
    </div>
  )
}

export default SettingsPanel
