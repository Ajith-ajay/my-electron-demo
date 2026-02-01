import axios from 'axios'

// Configure axios baseURL for Electron
if (window?.appEnv && window.appEnv.isElectron) {
  // Build-time API URL
  const apiFromEnv = import.meta.env.VITE_API_URL

  console.log(apiFromEnv);
  console.log("new version");

  // Decide API base URL
  axios.defaults.baseURL = apiFromEnv

  axios.defaults.withCredentials = true
}

export default axios