import React, { useState, useEffect } from 'react';
import './App.css';

// This is a simplified version of the UpdateInfo from electron-updater
interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes?: string | any[];
}

declare global {
  interface Window {
    ipc: {
      on: (channel: string, callback: (data: any) => void) => () => void;
      send: (channel: string, data?: any) => void;
    };
  }
}

function App() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Listen for update available
    const unsubscribeUpdateAvailable = window.ipc.on('update-available', (info: UpdateInfo) => {
      setUpdateInfo(info);
      setError(null);
    });

    // Listen for download progress
    const unsubscribeProgress = window.ipc.on('update-download-progress', (progress: { percent: number }) => {
      setIsDownloading(true);
      setDownloadProgress(progress.percent);
    });

    // Listen for update downloaded
    const unsubscribeUpdateDownloaded = window.ipc.on('update-downloaded', () => {
      setUpdateDownloaded(true);
      setIsDownloading(false);
    });

    // Listen for update errors
    const unsubscribeError = window.ipc.on('update-error', (errorMessage: string) => {
      setError(errorMessage);
      setIsDownloading(false);
    });

    // Cleanup listeners on component unmount
    return () => {
      unsubscribeUpdateAvailable();
      unsubscribeProgress();
      unsubscribeUpdateDownloaded();
      unsubscribeError();
    };
  }, []);

  const handleDownloadUpdate = () => {
    if (updateInfo) {
      window.ipc.send('download-update');
    }
  };

  const handleRestartApp = () => {
    window.ipc.send('restart-app');
  };

  const renderUpdateUI = () => {
    if (error) {
      return (
        <div className="update-container error">
          <h3>Update Failed</h3>
          <p>Could not fetch or download the update. Please check your connection or the repository settings.</p>
          <pre>{error}</pre>
        </div>
      );
    }

    if (updateDownloaded) {
      return (
        <div className="update-container">
          <h3>Update Ready to Install</h3>
          <p>Version {updateInfo?.version} has been downloaded.</p>
          <button onClick={handleRestartApp} className="update-button">
            Restart and Install
          </button>
        </div>
      );
    }

    if (isDownloading) {
      return (
        <div className="update-container">
          <h3>Downloading Update...</h3>
          <progress value={downloadProgress} max="100"></progress>
          <p>{Math.round(downloadProgress)}%</p>
        </div>
      );
    }

    if (updateInfo) {
      return (
        <div className="update-container">
          <h3>A new update is available!</h3>
          <p>Version {updateInfo.version} is ready to be downloaded.</p>
          <button onClick={handleDownloadUpdate} className="update-button">
            Download Update
          </button>
        </div>
      );
    }

    return (
        <div className="update-container">
            <p>You are running the latest version.</p>
        </div>
    );
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src="/vite.svg" className="logo" alt="Vite logo" />
        <h1>My Profile</h1>
      </header>
      <main>
        <div className="profile-card">
          <div className="profile-avatar">
            <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="User Avatar" />
          </div>
          <div className="profile-info">
            <h2>Ajith Ajay</h2>
            <p>Software Engineer</p>
            <p>Creating awesome apps with Electron and React.</p>
          </div>
        </div>
        <div className="updater-section">
          <h2>Application Updater</h2>
          {renderUpdateUI()}
        </div>
      </main>
    </div>
  );
}

export default App;