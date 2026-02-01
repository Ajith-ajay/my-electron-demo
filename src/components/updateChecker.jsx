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
  console.log("Checking Update for you Ajith ....");
  

  // ✅ ADDED: Track retry attempts
  const [retryCount, setRetryCount] = useState(0)
  const MAX_RETRY_ATTEMPTS = 3

  useEffect(() => {
    // Only run in Electron
    if (!window.electronAPI?.updates) return

    const { updates } = window.electronAPI

    // Get current app version on mount
    updates.getAppVersion().then(version => {
      setUpdateStatus(prev => ({ ...prev, currentVersion: version }))
    })

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

    updates.checkForUpdates()

    // Cleanup
    return () => {
      updates.removeAllListeners()
    }
  }, [])

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

  const popupTitle = updateStatus.error
    ? 'Update Failed'
    : updateStatus.downloaded
      ? 'Update Ready'
      : updateStatus.downloading
        ? 'Downloading Update'
        : 'Update Available'

  const popupMessage = updateStatus.error
    ? `${updateStatus.error}${updateStatus.retrying ? ` (Retry ${retryCount}/${MAX_RETRY_ATTEMPTS})` : ''}`
    : updateStatus.downloaded
      ? `Version ${updateStatus.version} is ready to install.`
      : updateStatus.downloading
        ? `Downloading... ${updateStatus.progress}%`
        : `New version ${updateStatus.version} is available (current ${updateStatus.currentVersion}).`

  const accentColor = updateStatus.error
    ? '#dc2626'
    : updateStatus.downloaded
      ? '#fdcc03'
      : '#800000'

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
    >
      <style>{`
        @keyframes updatePopupIn {
          0% { opacity: 0; transform: translateY(-20px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes updateGlow {
          0%, 100% { box-shadow: 0 10px 40px rgba(128, 0, 0, 0.3); }
          50% { box-shadow: 0 15px 50px rgba(128, 0, 0, 0.5); }
        }
        @keyframes shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
      `}</style>

      <div
        style={{
          width: 'min(480px, 92vw)',
          background: 'linear-gradient(135deg, #ffffff 0%, #fefbf4 100%)',
          borderRadius: '12px',
          padding: '28px',
          color: '#333',
          border: '3px solid #d1876f',
          animation: 'updatePopupIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1), updateGlow 3s ease-in-out infinite',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
          position: 'relative'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '5px',
            borderTopLeftRadius: '10px',
            borderTopRightRadius: '10px',
            background: `linear-gradient(90deg, ${accentColor}, #fdcc03)`
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '10px',
              background: `linear-gradient(135deg, ${accentColor}15, ${accentColor}25)`,
              display: 'grid',
              placeItems: 'center',
              color: accentColor,
              fontWeight: 700,
              fontSize: '24px',
              border: `2px solid ${accentColor}40`
            }}
          >
            ⟳
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#800000', marginBottom: '2px' }}>{popupTitle}</div>
            <div style={{ fontSize: '13px', color: '#666', fontWeight: 500 }}>QA Examination Platform</div>
          </div>
        </div>

        <div style={{ fontSize: '15px', lineHeight: 1.6, color: '#555', marginBottom: '20px', fontWeight: 500 }}>
          {popupMessage}
        </div>

        {updateStatus.downloading && (
          <div
            style={{
              width: '100%',
              height: '10px',
              borderRadius: '999px',
              background: '#f0ecec',
              overflow: 'hidden',
              marginBottom: '20px',
              border: '1px solid #ddd'
            }}
          >
            <div
              style={{
                width: `${updateStatus.progress}%`,
                height: '100%',
                background: `linear-gradient(90deg, #800000, #fdcc03, #800000)`,
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s linear infinite',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          {updateStatus.error && retryCount < MAX_RETRY_ATTEMPTS && (
            <button
              onClick={handleRetry}
              style={{
                padding: '11px 18px',
                borderRadius: '6px',
                border: '1px solid #dc2626',
                background: 'white',
                color: '#dc2626',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#dc2626'
                e.target.style.color = 'white'
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'white'
                e.target.style.color = '#dc2626'
              }}
            >
              Retry
            </button>
          )}

          {updateStatus.available && !updateStatus.downloading && !updateStatus.downloaded && (
            <button
              onClick={handleDownload}
              style={{
                padding: '11px 22px',
                borderRadius: '6px',
                border: 'none',
                background: '#800000',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#600000'
                e.target.style.transform = 'translateY(-1px)'
              }}
              onMouseOut={(e) => {
                e.target.style.background = '#800000'
                e.target.style.transform = 'translateY(0)'
              }}
            >
              Download Update
            </button>
          )}

          {updateStatus.downloaded && (
            <button
              onClick={handleInstall}
              style={{
                padding: '11px 22px',
                borderRadius: '6px',
                border: 'none',
                background: '#800000',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#600000'
                e.target.style.transform = 'translateY(-1px)'
              }}
              onMouseOut={(e) => {
                e.target.style.background = '#800000'
                e.target.style.transform = 'translateY(0)'
              }}
            >
              Install & Restart
            </button>
          )}

          <button
            onClick={handleDismiss}
            style={{
              padding: '11px 16px',
              borderRadius: '6px',
              border: '1px solid #aaa',
              background: 'white',
              color: '#666',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#f5f5f5'
              e.target.style.borderColor = '#888'
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'white'
              e.target.style.borderColor = '#aaa'
            }}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}

export default UpdateChecker