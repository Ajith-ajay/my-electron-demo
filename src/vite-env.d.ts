/// <reference types="vite/client" />

interface IpcApi {
  on: (channel: string, callback: (data: any) => void) => () => void;
  send: (channel: string, data?: any) => void;
}

declare global {
  interface Window {
    ipc: IpcApi;
  }
}
