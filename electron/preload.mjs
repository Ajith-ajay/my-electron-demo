"use strict";
const electron = require("electron");
const api = {
  /**
   * Provide an easy way to listen to IPC events.
   */
  on: (channel, callback) => {
    const subscription = (_event, ...args) => callback(args[0]);
    electron.ipcRenderer.on(channel, subscription);
    return () => {
      electron.ipcRenderer.removeListener(channel, subscription);
    };
  },
  /**
   * Provide an easy way to send IPC messages.
   */
  send: (channel, data) => {
    electron.ipcRenderer.send(channel, data);
  }
};
electron.contextBridge.exposeInMainWorld("ipc", api);
