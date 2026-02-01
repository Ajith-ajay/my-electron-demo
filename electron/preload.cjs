const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('appEnv', {
  isElectron: true,
  platform: process.platform
})

contextBridge.exposeInMainWorld('electronAPI', {
  // Listen for violation events from main process
  onViolation: (callback) => {
    ipcRenderer.on('VIOLATION_DETECTED', (event, data) => {
      callback(data.type, data.message)
    })
  },

  // Listen for focus regain
  onFocusRegained: (callback) => {
    ipcRenderer.on('FOCUS_REGAINED', callback)
  },

  // Register a violation with the main process
  registerViolation: (type, message) => {
    return ipcRenderer.invoke('registerViolation', { type, message })
  },

  // Get current app state
  getViolationStatus: () => {
    return ipcRenderer.invoke('getViolationStatus')
  },

  // Remove violation listener
  offViolation: () => {
    ipcRenderer.removeAllListeners('VIOLATION_DETECTED')
  },

  // ✅ AUTO-UPDATE API
  updates: {
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    downloadUpdate: () => ipcRenderer.invoke('download-update'),
    installUpdate: () => ipcRenderer.invoke('install-update'),
    getAppVersion: () => ipcRenderer.invoke('get-app-version'),
    
    // Event listeners
    onChecking: (callback) => ipcRenderer.on('update-checking', callback),
    onAvailable: (callback) => ipcRenderer.on('update-available', (event, info) => callback(info)),
    onNotAvailable: (callback) => ipcRenderer.on('update-not-available', callback),
    onDownloadProgress: (callback) => ipcRenderer.on('update-download-progress', (event, progress) => callback(progress)),
    onDownloaded: (callback) => ipcRenderer.on('update-downloaded', (event, info) => callback(info)),
    onError: (callback) => ipcRenderer.on('update-error', (event, message) => callback(message)),
    
    // Cleanup
    removeAllListeners: () => {
      ipcRenderer.removeAllListeners('update-checking')
      ipcRenderer.removeAllListeners('update-available')
      ipcRenderer.removeAllListeners('update-not-available')
      ipcRenderer.removeAllListeners('update-download-progress')
      ipcRenderer.removeAllListeners('update-downloaded')
      ipcRenderer.removeAllListeners('update-error')
    }
  },

  // Legacy support for old API
  examSecurity: {
    onViolation: (callback) => {
      ipcRenderer.on('VIOLATION_DETECTED', (event, data) => {
        callback(data.type)
      })
    }
  }
})
