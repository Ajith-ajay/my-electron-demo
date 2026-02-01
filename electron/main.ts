
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url'
import update from 'electron-updater';
const { autoUpdater } = update;

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └─── electron
// │ │    ├── main.js
// │ │    └── preload.js
// │ │
// │ └─── renderer
// │    ├── assets
// │    └── index.html

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

process.env.DIST = path.join(__dirname, '../renderer');
process.env.PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public');


let win: BrowserWindow | null;
// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

// Configure update provider
autoUpdater.autoDownload = false; // We want to control the download
autoUpdater.autoInstallOnAppQuit = true;


function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.PUBLIC!, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // --- Updater Event Handlers ---
  autoUpdater.on('update-available', (info) => {
    win?.webContents.send('update-available', info);
  });

  autoUpdater.on('update-not-available', () => {
    win?.webContents.send('update-not-available');
  });

  autoUpdater.on('download-progress', (progressObj) => {
    win?.webContents.send('update-download-progress', progressObj);
  });

  autoUpdater.on('update-downloaded', () => {
    win?.webContents.send('update-downloaded');
  });

  autoUpdater.on('error', (err) => {
    win?.webContents.send('update-error', err.message);
  });


  // --- IPC Handlers ---
  ipcMain.on('check-for-updates', () => {
    autoUpdater.checkForUpdates();
  });

  ipcMain.on('download-update', () => {
    autoUpdater.downloadUpdate();
  });

  ipcMain.on('restart-app', () => {
    autoUpdater.quitAndInstall();
  });


  // --- Window Loading ---
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/renderer/index.html')
    win.loadFile(path.join(process.env.DIST!, 'index.html'));
  }

   // Open devTools in development
  if (!app.isPackaged) {
    win.webContents.openDevTools();
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  createWindow();
  // Check for updates on startup
  autoUpdater.checkForUpdates();
});
