import { createRoot } from 'react-dom/client'
import './index.css'
import './axiosConfig' 
import App from './App.jsx'
import { BrowserRouter, HashRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'

// Register service worker only in web (skip in Electron)
if (!(window?.appEnv && window.appEnv.isElectron)) {
  const updateSW = registerSW({
    onNeedRefresh() {
      if (confirm('New content available. Reload?')) {
        updateSW(true)
      }
    },
    onOfflineReady() {
      console.log('App ready to work offline')
    },
  })
}

const Router = (window?.appEnv && window.appEnv.isElectron) ? HashRouter : BrowserRouter

createRoot(document.getElementById('root')).render(
  <Router>
    <App />
  </Router>,
)
