const config = {
  app: {
    name: window.__APP_CONFIG__?.APP_NAME ?? import.meta.env.VITE_APP_NAME,
    backendUrl: (window.__APP_CONFIG__?.BACKEND_URL ?? import.meta.env.VITE_BACKEND_URL)?.replace(
      /\/$/,
      ''
    )
  }
}

export default config
