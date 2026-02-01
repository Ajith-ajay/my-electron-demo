// Preload: expose limited environment info if needed
import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('appEnv', {
  isElectron: true
})
