import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// 手动管理 Service Worker：先清理旧 SW 再注册，防止之前部署失败的缓存污染
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    // 先注销所有旧 SW
    const oldRegs = await navigator.serviceWorker.getRegistrations()
    await Promise.all(oldRegs.map(r => r.unregister()))
    // 短暂延迟确保注销完成，再注册新 SW
    setTimeout(async () => {
      try {
        await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      } catch (e) {
        console.warn('SW registration failed, running without offline support', e)
      }
    }, 300)
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)
