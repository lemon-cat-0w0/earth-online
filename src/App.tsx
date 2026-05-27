import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import TodoPage from './pages/TodoPage'
import DiaryPage from './pages/DiaryPage'
import HobbyPage from './pages/HobbyPage'
import GoalPage from './pages/GoalPage'
import FinancePage from './pages/FinancePage'
import ExplorePage from './pages/ExplorePage'

const tabs = [
  { path: '/', label: '待办', icon: '☑' },
  { path: '/diary', label: '日记', icon: '📝' },
  { path: '/hobby', label: '爱好', icon: '🎯' },
  { path: '/goal', label: '目标', icon: '⭐' },
  { path: '/finance', label: '理财', icon: '💰' },
  { path: '/explore', label: '探索', icon: '🔍' },
] as const

function TabBar() {
  const location = useLocation()
  const navigate = useNavigate()
  const current = location.pathname === '/' ? '/' : '/' + location.pathname.split('/')[1]

  return (
    <nav className="safe-bottom fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-warm-200 z-50">
      <div className="flex justify-around items-center h-14 max-w-lg mx-auto">
        {tabs.map(tab => {
          const active = current === tab.path
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center gap-0.5 w-14 h-full transition-colors ${
                active ? 'text-leaf-500' : 'text-warm-400'
              }`}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              <span className="text-[11px] leading-none">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default function App() {
  // 注册 PWA 更新
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        if (regs.length > 0) {
          regs[0].addEventListener('updatefound', () => {
            const worker = regs[0].installing
            if (worker) {
              worker.addEventListener('statechange', () => {
                if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                  if (confirm('有新版本可用，是否刷新？')) {
                    window.location.reload()
                  }
                }
              })
            }
          })
        }
      })
    }
  }, [])

  return (
    <div className="min-h-dvh pb-14 max-w-lg mx-auto bg-warm-50">
      <header className="safe-top sticky top-0 z-40 bg-warm-50/90 backdrop-blur-md border-b border-transparent">
        <div className="h-12 flex items-center px-5">
          <h1 className="text-base font-medium text-warm-800">地球Online指南</h1>
        </div>
      </header>
      <main className="px-4 py-3">
        <Routes>
          <Route path="/" element={<TodoPage />} />
          <Route path="/diary/*" element={<DiaryPage />} />
          <Route path="/hobby/*" element={<HobbyPage />} />
          <Route path="/goal/*" element={<GoalPage />} />
          <Route path="/finance/*" element={<FinancePage />} />
          <Route path="/explore" element={<ExplorePage />} />
        </Routes>
      </main>
      <TabBar />
    </div>
  )
}
