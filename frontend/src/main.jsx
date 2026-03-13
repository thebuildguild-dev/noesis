import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AppRouter } from './router.jsx'
import { ToastContainer } from './components/ui/Toast.jsx'
import { AgentNotificationContainer } from './components/ui/AgentNotification.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppRouter />
      <ToastContainer />
      <AgentNotificationContainer />
    </BrowserRouter>
  </React.StrictMode>
)
