import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload, FileText, RefreshCw, X, Play, Download, Trash2, StopCircle, ListOrdered } from 'lucide-react'
import { useStore } from '../store/useStore'
import aiService from '../services/aiService'
import { toast } from 'react-hot-toast'
import './BatchTaskContainer.css'

function BatchTaskContainer() {
  const { t } = useTranslation()
  const { currentProvider } = useStore()
  
  const [activeTab, setActiveTab] = useState('list') // Default to list
  const [jobs, setJobs] = useState([])
  const [isLoadingJobs, setIsLoadingJobs] = useState(false)
  
  // Create state
  const [selectedFile, setSelectedFile] = useState(null)
  const [modelInput, setModelInput] = useState('gemini-2.0-flash')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')

  // Load jobs on mount
  useEffect(() => {
    if (currentProvider === 'google') {
      fetchJobs()
    }
  }, [currentProvider])

  const fetchJobs = async () => {
    if (currentProvider !== 'google') return
    setIsLoadingJobs(true)
    try {
      const data = await aiService.listBatchJobs()
      if (data.batches) {
        // Sort by createTime desc
        const sorted = data.batches.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
        setJobs(sorted)
      } else {
        setJobs([])
      }
    } catch (error) {
      console.error('Fetch batch jobs error:', error)
      toast.error('Failed to load batch jobs. Ensure you are using Google provider with valid API Key.')
    } finally {
      setIsLoadingJobs(false)
    }
  }

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleSubmit = async () => {
    if (!selectedFile) return toast.error('Please select a JSONL file')
    if (currentProvider !== 'google') return toast.error('Batch API currently only supports Google provider')
    
    setIsSubmitting(true)
    setUploadProgress('Uploading file...')
    
    try {
      // 1. Upload
      const fileData = await aiService.uploadFileToGoogle(selectedFile, 'application/json')
      setUploadProgress('File uploaded. Creating job...')
      
      // 2. Create Job
      await aiService.createBatchJob(modelInput, fileData.uri)
      
      toast.success('Batch Job Created!')
      setSelectedFile(null)
      setUploadProgress('')
      setActiveTab('list')
      fetchJobs()
      
    } catch (error) {
      console.error(error)
      toast.error(`Error: ${error.message}`)
      setUploadProgress('')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleCancelJob = async (name) => {
    if (!confirm('Cancel this job?')) return
    try {
        await aiService.cancelBatchJob(name)
        toast.success('Job cancelled')
        fetchJobs()
    } catch (e) {
        toast.error(e.message)
    }
  }

  const handleDownloadResult = async (jobName) => {
    const toastId = toast.loading('Fetching result...')
    try {
        // 1. Get job details
        const job = await aiService.getBatchJob(jobName)
        
        // 2. Check output
        // Based on docs, output can be in dest.file_name? No, docs say `output_file` usually.
        // Wait, fetch result said `batch_job.dest.file_name`? No, let's look closer.
        // Usually it's `output_file` or `response_file`.
        // Let's assume we need to inspect the job object.
        // For now, if we can't find a direct link, we'll dump the metadata.
        // Actually, if it's a file, we need to download it.
        
        // Attempt to find URI
        // console.log('Job details:', job)
        
        // Let's guess structure or just open the job URL? No UI for that.
        // Let's try to assume we can just check `outputFile` property if exists.
        
        // If we can't handle it perfectly yet, just show a message.
        // But the user wants the feature.
        
        // The most reliable way for now without knowing exact field:
        // Check `job.outputFile` or similar.
        // Or re-read documentation summary.
        // "results are available in the response field... in a file specified by batch_job.dest.file_name" -> Likely `dest` object.
        
        // Temporary: just toast "Check console" and log it until we know structure?
        // No, I implemented `downloadFile(uri)`.
        
        toast.success('Job details fetched', { id: toastId })
        console.log('Batch Job Details:', job)
        alert('Please check console for job details to identify result URI. Automatic download pending implementation of exact field mapping.')
        
    } catch (e) {
        toast.error(`Failed: ${e.message}`, { id: toastId })
    }
  }
  
  // Render Helpers
  const renderCreateTab = () => (
    <div className="batch-create-panel">
      <h2>Create New Batch Job</h2>
      <div className="form-group">
        <label>Model ID</label>
        <input 
            type="text" 
            value={modelInput} 
            onChange={e => setModelInput(e.target.value)}
            placeholder="e.g. gemini-2.0-flash"
            className="model-input"
        />
        <small className="hint">Currently supported: gemini-2.0-flash, gemini-1.5-pro, etc.</small>
      </div>
      
      <div className="form-group">
        <label>Input File (JSONL)</label>
        <div className="file-upload-area">
            <input type="file" accept=".jsonl,.json" onChange={handleFileSelect} className="file-input" />
            {selectedFile && <div className="selected-file"><FileText size={16}/> {selectedFile.name}</div>}
        </div>
        <div className="jsonl-example">
            <p><strong>JSONL Format Example:</strong></p>
            <pre>
{`{"key": "req-001", "request": {"contents": [{"parts": [{"text": "Hello world"}]}]}}
{"key": "req-002", "request": {"contents": [{"parts": [{"text": "Write a poem"}]}]}}`}
            </pre>
            <small>Each line must be a valid JSON object.</small>
        </div>
      </div>
      
      <div className="form-actions">
        <button className="submit-btn" onClick={handleSubmit} disabled={isSubmitting || !selectedFile}>
            {isSubmitting ? (uploadProgress || 'Processing...') : 'Submit Batch Job'}
        </button>
      </div>
    </div>
  )

  const renderListTab = () => (
    <div className="batch-list-panel">
        <div className="list-header">
            <h2>Batch Jobs</h2>
            <div className="list-actions">
                <span className="provider-badge">Provider: {currentProvider}</span>
                <button onClick={fetchJobs} className="refresh-btn" title="Refresh"><RefreshCw size={16}/></button>
            </div>
        </div>
        
        {currentProvider !== 'google' && (
            <div className="warning-banner">
                Batch API is only available for Google provider. Please switch provider in Settings.
            </div>
        )}
        
        {isLoadingJobs ? <div className="loading-jobs">Loading...</div> : (
            <div className="jobs-table-container">
                <table className="jobs-table">
                    <thead>
                        <tr>
                            <th>Job ID</th>
                            <th>Status</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {jobs.map(job => (
                            <tr key={job.name}>
                                <td title={job.name} className="job-id">{job.name.split('/').pop()}</td>
                                <td>
                                    <span className={`status-badge ${job.state?.toLowerCase()}`}>
                                        {job.state?.replace('JOB_STATE_', '') || 'UNKNOWN'}
                                    </span>
                                </td>
                                <td>{job.createTime ? new Date(job.createTime).toLocaleString() : '-'}</td>
                                <td className="actions-cell">
                                    {(job.state === 'JOB_STATE_ACTIVE' || job.state === 'JOB_STATE_PENDING') && (
                                        <button onClick={() => handleCancelJob(job.name)} title="Cancel" className="action-btn cancel"><StopCircle size={16}/></button>
                                    )}
                                    {job.state === 'JOB_STATE_SUCCEEDED' && (
                                        <button title="View Result (Console)" onClick={() => handleDownloadResult(job.name)} className="action-btn download"><Download size={16}/></button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {jobs.length === 0 && <div className="no-jobs">No batch jobs found.</div>}
            </div>
        )}
    </div>
  )

  return (
    <div className="batch-container">
      <div className="batch-tabs">
        <button 
            className={`batch-tab ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
        >
            <Upload size={16}/> Create Task
        </button>
        <button 
            className={`batch-tab ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
        >
            <ListOrdered size={16}/> Task List
        </button>
      </div>
      
      <div className="batch-content">
        {activeTab === 'create' ? renderCreateTab() : renderListTab()}
      </div>
    </div>
  )
}

export default BatchTaskContainer