
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export const api = {
  /**
   * Provide an easy way to listen to IPC events.
   */
  on: (channel: string, callback: (data: any) => void) => {
    const subscription = (_event: IpcRendererEvent, ...args: any[]) => callback(args[0]);
    ipcRenderer.on(channel, subscription);
    // Return a function to unsubscribe
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
  /**
   * Provide an easy way to send IPC messages.
   */
  send: (channel: string, data?: any) => {
    ipcRenderer.send(channel, data);
  },
};

contextBridge.exposeInMainWorld('ipc', api);
