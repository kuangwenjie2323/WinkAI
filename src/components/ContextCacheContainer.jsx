import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Database, Plus, Trash2, Copy, RefreshCw, Upload, FileText, X } from 'lucide-react'
import { useStore } from '../store/useStore'
import aiService from '../services/aiService'
import { toast } from 'react-hot-toast'
import './ContextCacheContainer.css'

function ContextCacheContainer() {
  const { currentProvider } = useStore()
  const [activeTab, setActiveTab] = useState('list')
  const [caches, setCaches] = useState([])
  const [loading, setLoading] = useState(false)
  
  // Create Form
  const [model, setModel] = useState('models/gemini-1.5-flash-001')
  const [sysInst, setSysInst] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [ttl, setTtl] = useState('300s') // 5 mins default
  const [file, setFile] = useState(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (currentProvider === 'google') {
      fetchCaches()
    }
  }, [currentProvider])

  const fetchCaches = async () => {
    if (currentProvider !== 'google') return
    setLoading(true)
    try {
      const data = await aiService.listCachedContents()
      if (data.cachedContents) {
        setCaches(data.cachedContents)
      } else {
        setCaches([])
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to list caches')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (name) => {
    if (!confirm('Delete this cache?')) return
    try {
      await aiService.deleteCachedContent(name)
      toast.success('Deleted')
      fetchCaches()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const handleCopy = (name) => {
    navigator.clipboard.writeText(name)
    toast.success('Copied Cache Name')
  }

  const handleCreate = async () => {
    if (!model) return toast.error('Model is required')
    setCreating(true)
    try {
      let contents = []
      
      // Upload file if selected
      if (file) {
        toast.loading('Uploading file...', { id: 'upload' })
        const fileData = await aiService.uploadFileToGoogle(file)
        contents.push({
            role: 'user',
            parts: [{
                fileData: {
                    mimeType: file.type || 'application/pdf',
                    fileUri: fileData.uri
                }
            }]
        })
      }

      // If no file, strictly speaking we need some content?
      // Documentation says: "Cached content can be used as a prefix". 
      // Often used with system instruction or large text.
      // If just system instruction, contents can be empty? Let's try.
      // API might require contents.
      
      const params = {
        model,
        displayName: displayName || undefined,
        systemInstruction: sysInst || undefined,
        ttl,
        contents: contents.length > 0 ? contents : undefined
      }

      toast.loading('Creating cache...', { id: 'upload' })
      const res = await aiService.createCachedContent(params)
      toast.success('Cache Created!', { id: 'upload' })
      
      setActiveTab('list')
      fetchCaches()
      
      // Reset form
      setFile(null)
      setSysInst('')
      setDisplayName('')
    } catch (error) {
      toast.error(error.message, { id: 'upload' })
    } finally {
      setCreating(false)
    }
  }

  const renderCreate = () => (
    <div className="cache-create-panel">
      <h2>Create Context Cache</h2>
      
      <div className="form-group">
        <label>Model</label>
        <select value={model} onChange={e => setModel(e.target.value)} className="form-select">
            <option value="models/gemini-1.5-flash-001">Gemini 1.5 Flash</option>
            <option value="models/gemini-1.5-pro-001">Gemini 1.5 Pro</option>
            <option value="models/gemini-2.0-flash-exp">Gemini 2.0 Flash Exp</option>
        </select>
      </div>

      <div className="form-group">
        <label>Display Name (Optional)</label>
        <input 
            className="form-input"
            value={displayName} 
            onChange={e => setDisplayName(e.target.value)} 
            placeholder="e.g. Project Manual"
        />
      </div>

      <div className="form-group">
        <label>System Instruction (Optional)</label>
        <textarea 
            className="form-textarea"
            value={sysInst} 
            onChange={e => setSysInst(e.target.value)}
            placeholder="You are an expert on..."
            rows={4}
        />
      </div>

      <div className="form-group">
        <label>Content File (Optional)</label>
        <div className="file-upload-box">
            <input type="file" onChange={e => setFile(e.target.files[0])} />
            {file && <div className="file-chip"><FileText size={14}/> {file.name}</div>}
        </div>
        <small className="hint">Supported: PDF, Text, Video, Audio. (Max 2GB)</small>
      </div>

      <div className="form-group">
        <label>TTL (Time to Live)</label>
        <select value={ttl} onChange={e => setTtl(e.target.value)} className="form-select">
            <option value="300s">5 Minutes</option>
            <option value="600s">10 Minutes</option>
            <option value="3600s">1 Hour</option>
            <option value="86400s">24 Hours</option>
        </select>
      </div>

      <button className="create-btn" onClick={handleCreate} disabled={creating}>
        {creating ? 'Creating...' : 'Create Cache'}
      </button>
    </div>
  )

  const renderList = () => (
    <div className="cache-list-panel">
      <div className="list-header">
        <h2>Active Caches</h2>
        <button className="refresh-btn" onClick={fetchCaches}><RefreshCw size={16}/></button>
      </div>

      {currentProvider !== 'google' && (
        <div className="warning-banner">Only available for Google provider.</div>
      )}

      {loading ? <p>Loading...</p> : (
        <div className="cache-table-wrapper">
            <table className="cache-table">
                <thead>
                    <tr>
                        <th>Name/Display</th>
                        <th>Model</th>
                        <th>Expires</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {caches.map(c => (
                        <tr key={c.name}>
                            <td>
                                <div className="cache-name">{c.displayName || '(No Name)'}</div>
                                <div className="cache-id" title={c.name}>{c.name.split('/').pop()}</div>
                            </td>
                            <td>{c.model?.split('/').pop()}</td>
                            <td>{c.expireTime ? new Date(c.expireTime).toLocaleTimeString() : '-'}</td>
                            <td>
                                <button className="action-btn" onClick={() => handleCopy(c.name)} title="Copy ID"><Copy size={14}/></button>
                                <button className="action-btn delete" onClick={() => handleDelete(c.name)} title="Delete"><Trash2 size={14}/></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {caches.length === 0 && <div className="empty-state">No active caches.</div>}
        </div>
      )}
    </div>
  )

  return (
    <div className="context-cache-container">
      <div className="cache-tabs">
        <button className={`cache-tab ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>
            <Database size={16}/> List
        </button>
        <button className={`cache-tab ${activeTab === 'create' ? 'active' : ''}`} onClick={() => setActiveTab('create')}>
            <Plus size={16}/> Create
        </button>
      </div>
      <div className="cache-content">
        {activeTab === 'list' ? renderList() : renderCreate()}
      </div>
    </div>
  )
}

export default ContextCacheContainer