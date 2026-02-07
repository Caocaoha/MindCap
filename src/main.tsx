import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App' // <-- Quan trọng: Không có dấu ngoặc nhọn {}
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)