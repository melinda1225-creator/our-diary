import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { SITE_TITLE } from './config.js'
import './index.css'

document.title = SITE_TITLE

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
