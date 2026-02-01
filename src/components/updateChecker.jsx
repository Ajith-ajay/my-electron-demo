import { useEffect, useState } from 'react'

const UpdateChecker = () => {
  const [updateStatus, setUpdateStatus] = useState({
    checking: false,
    available: false,
    downloading: false,
    downloaded: false,
    progress: 0,
    version: null,
    currentVersion: null,
    error: null,
    retrying: false
  })
  console.log("Checking Update for you ....");
  

  // ✅ ADDED: Track retry attempts
  const [retryCount, setRetryCount] = useState(0)
  const MAX_RETRY_ATTEMPTS = 3

  useEffect(() => {
    // Only run in Electron
    if (!window.electronAPI?.updates) return

    const { updates } = window.electronAPI

    // Setup listeners
    updates.onChecking(() => {
      setUpdateStatus(prev => ({ ...prev, checking: true, retrying: false }))
    })

    updates.onAvailable((info) => {
      setUpdateStatus(prev => ({
        ...prev,
        checking: false,
        available: true,
        version: info.version
      }))
    })

    updates.onNotAvailable(() => {
      setUpdateStatus(prev => ({ ...prev, checking: false, available: false }))
    })

    updates.onDownloadProgress((progress) => {
      setUpdateStatus(prev => ({
        ...prev,
        downloading: true,
        progress: Math.round(progress.percent)
      }))
    })

    updates.onDownloaded((info) => {
      setUpdateStatus(prev => ({
        ...prev,
        downloading: false,
        downloaded: true,
        version: info.version
      }))
    })

    updates.onError((message) => {
      setUpdateStatus(prev => ({
        ...prev,
        checking: false,
        downloading: false,
        error: message,
        retrying: true
      }))
      
      // ✅ ADDED: Auto-retry on error (with limit)
      if (retryCount < MAX_RETRY_ATTEMPTS) {
        setTimeout(() => {
          console.log(`[Update] Auto-retrying... (${retryCount + 1}/${MAX_RETRY_ATTEMPTS})`)
          setRetryCount(prev => prev + 1)
          window.electronAPI.updates.checkForUpdates()
        }, 3000) // Wait 3 seconds before retry
      }
    })

    // Cleanup
    return () => {
      updates.removeAllListeners()
    }
  }, [retryCount])

  const handleDownload = async () => {
    try {
      await window.electronAPI.updates.downloadUpdate()
    } catch (error) {
      console.error('Download failed:', error)
      setUpdateStatus(prev => ({ ...prev, error: 'Failed to start download' }))
    }
  }

  const handleInstall = () => {
    window.electronAPI.updates.installUpdate()
  }

  const handleDismiss = () => {
    setUpdateStatus(prev => ({ ...prev, available: false, error: null }))
    setRetryCount(0)
  }

  // ✅ ADDED: Manual retry button
  const handleRetry = async () => {
    setRetryCount(0)
    setUpdateStatus(prev => ({ ...prev, error: null }))
    await window.electronAPI.updates.checkForUpdates()
  }

  // Don't render if no update info to show
  if (!updateStatus.available && !updateStatus.downloading && !updateStatus.downloaded && !updateStatus.error) {
    return null
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: updateStatus.error ? '#f44336' : updateStatus.downloaded ? '#FF9800' : '#4CAF50',
        color: 'white',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '15px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
      }}
    >
      <span style={{ flex: 1, textAlign: 'center', fontWeight: '500' }}>
        {updateStatus.error && `Update Error: ${updateStatus.error}${updateStatus.retrying ? ` (Retry ${retryCount}/${MAX_RETRY_ATTEMPTS})` : ''}`}
        {updateStatus.checking && 'Checking for updates...'}
        {updateStatus.available && !updateStatus.downloading && `New version ${updateStatus.version} available! (Current: ${updateStatus.currentVersion})`}
        {updateStatus.downloading && `Downloading update: ${updateStatus.progress}%`}
        {updateStatus.downloaded && 'Update ready to install!'}
      </span>

      {updateStatus.available && !updateStatus.downloading && !updateStatus.downloaded && (
        <button
          onClick={handleDownload}
          style={{
            padding: '6px 20px',
            backgroundColor: 'white',
            color: '#4CAF50',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Download Update
        </button>
      )}

      {updateStatus.downloaded && (
        <button
          onClick={handleInstall}
          style={{
            padding: '6px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Install & Restart
        </button>
      )}

      {updateStatus.error && retryCount < MAX_RETRY_ATTEMPTS && (
        <button
          onClick={handleRetry}
          style={{
            padding: '6px 20px',
            backgroundColor: 'white',
            color: '#f44336',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Retry
        </button>
      )}

      <button
        onClick={handleDismiss}
        style={{
          padding: '6px 12px',
          backgroundColor: 'transparent',
          color: 'white',
          border: '1px solid white',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        ✕
      </button>
    </div>
  )
}

export default UpdateChecker