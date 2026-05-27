import { useState, useMemo, useEffect, useRef } from 'react'
import { Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { db, exportAllData, importAllData } from '../db'
import { useLiveQuery } from 'dexie-react-hooks'

/* ========== 年月快速选择器 ========== */
function YearMonthPicker({
  year,
  month,
  onChange,
  onClose,
}: {
  year: number
  month: number
  onChange: (y: number, m: number) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    setTimeout(() => document.addEventListener('click', handleClick), 0)
    return () => document.removeEventListener('click', handleClick)
  }, [onClose])

  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  return (
    <div
      ref={ref}
      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white rounded-2xl shadow-xl border border-warm-200 p-4 w-72"
    >
      {/* 年份导航 */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <button onClick={() => onChange(year - 10, month)} className="btn btn-ghost p-1.5 text-base text-warm-500 hover:text-warm-700" title="前移10年">
          «
        </button>
        <button onClick={() => onChange(year - 1, month)} className="btn btn-ghost p-1.5 text-lg text-warm-500 hover:text-warm-700" title="前移1年">
          ‹
        </button>
        <span className="text-lg font-semibold text-warm-800 min-w-[80px] text-center select-none">
          {year}
        </span>
        <button onClick={() => onChange(year + 1, month)} className="btn btn-ghost p-1.5 text-lg text-warm-500 hover:text-warm-700" title="后移1年">
          ›
        </button>
        <button onClick={() => onChange(year + 10, month)} className="btn btn-ghost p-1.5 text-base text-warm-500 hover:text-warm-700" title="后移10年">
          »
        </button>
      </div>

      {/* 月份网格 */}
      <div className="grid grid-cols-4 gap-1.5">
        {months.map(m => {
          const isActive = m === month
          const isCurrent = m === new Date().getMonth() + 1 && year === new Date().getFullYear()
          return (
            <button
              key={m}
              onClick={() => {
                onChange(year, m)
                setTimeout(onClose, 150)
              }}
              className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-leaf-100 text-leaf-700'
                  : isCurrent
                  ? 'bg-warm-50 text-warm-600 ring-1 ring-leaf-200'
                  : 'text-warm-500 hover:bg-warm-50'
              }`}
            >
              {m}月
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ========== 数据备份（隐藏式） ========== */
function BackupDrawer() {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState('')
  const [importJson, setImportJson] = useState('')

  const handleExport = async () => {
    try {
      const json = await exportAllData()
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `earth-online-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      setStatus('导出成功！文件已下载。')
    } catch {
      setStatus('导出失败，请重试。')
    }
    setTimeout(() => setStatus(''), 3000)
  }

  const handleImport = async () => {
    if (!importJson.trim()) return
    if (!confirm('⚠️ 导入将覆盖所有现有数据，确定继续？')) return
    const success = await importAllData(importJson)
    setStatus(success ? '导入成功！页面即将刷新。' : '导入失败：数据格式不正确。')
    if (success) setTimeout(() => window.location.reload(), 1500)
    setTimeout(() => setStatus(''), 5000)
  }

  return (
    <div className="mt-6 border-t border-warm-100 pt-4">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-warm-400 hover:text-warm-600 transition-colors flex items-center gap-1"
      >
        <span>数据备份与恢复</span>
        <span className={`transition-transform ${open ? 'rotate-90' : ''}`}>▸</span>
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          <div className="card">
            <p className="text-sm text-warm-700 mb-3">导出全部数据为 JSON 文件，可存入 iCloud 或电脑。</p>
            <button onClick={handleExport} className="btn btn-primary w-full">导出数据</button>
          </div>

          <div className="card">
            <p className="text-sm text-warm-700 mb-2">从备份文件恢复数据（将覆盖当前所有数据）</p>
            <textarea
              className="input-field min-h-[80px] text-xs font-mono resize-none"
              placeholder="粘贴备份 JSON 内容..."
              value={importJson}
              onChange={e => setImportJson(e.target.value)}
            />
            <button
              onClick={handleImport}
              disabled={!importJson.trim()}
              className="btn btn-ghost w-full mt-2 text-blush-500 disabled:opacity-30"
            >
              导入并恢复
            </button>
          </div>

          {status && (
            <div className={`card text-center text-sm ${status.includes('成功') ? 'text-leaf-600' : 'text-blush-500'}`}>
              {status}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ========== 日历视图 ========== */
function CalendarView() {
  const navigate = useNavigate()
  const [yearMonth, setYearMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() + 1 }
  })
  const [pickerOpen, setPickerOpen] = useState(false)

  const startDate = `${yearMonth.year}-${String(yearMonth.month).padStart(2, '0')}-01`
  const endDate = `${yearMonth.year}-${String(yearMonth.month).padStart(2, '0')}-31`

  const diaries = useLiveQuery(
    () => db.diaries.where('date').between(startDate, endDate, true, true).toArray(),
    [yearMonth]
  ) ?? []

  const diarySet = useMemo(() => new Set(diaries.map(d => d.date)), [diaries])

  const daysInMonth = new Date(yearMonth.year, yearMonth.month, 0).getDate()
  const firstDayOfWeek = new Date(yearMonth.year, yearMonth.month - 1, 1).getDay()

  const prevMonth = () => {
    setYearMonth(prev =>
      prev.month === 1 ? { year: prev.year - 1, month: 12 } : { ...prev, month: prev.month - 1 }
    )
  }
  const nextMonth = () => {
    setYearMonth(prev =>
      prev.month === 12 ? { year: prev.year + 1, month: 1 } : { ...prev, month: prev.month + 1 }
    )
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div>
      {/* 头部 */}
      <div className="flex items-center justify-between mb-4 relative">
        <button onClick={prevMonth} className="btn btn-ghost p-2 text-xl">‹</button>

        <button
          onClick={() => setPickerOpen(!pickerOpen)}
          className="text-base font-medium text-warm-800 hover:text-leaf-600 transition-colors px-2 py-1 rounded-lg hover:bg-warm-50"
        >
          {yearMonth.year}年{yearMonth.month}月
        </button>

        <button onClick={nextMonth} className="btn btn-ghost p-2 text-xl">›</button>

        {pickerOpen && (
          <YearMonthPicker
            year={yearMonth.year}
            month={yearMonth.month}
            onChange={(y, m) => setYearMonth({ year: y, month: m })}
            onClose={() => setPickerOpen(false)}
          />
        )}
      </div>

      {/* 星期表头 */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['日', '一', '二', '三', '四', '五', '六'].map(d => (
          <div key={d} className="text-center text-xs text-warm-400 py-1">{d}</div>
        ))}
      </div>

      {/* 日期网格 */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const dateStr = `${yearMonth.year}-${String(yearMonth.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const hasDiary = diarySet.has(dateStr)
          const isToday = dateStr === today
          return (
            <button
              key={day}
              onClick={() => navigate(`/diary/${dateStr}`)}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-colors ${
                isToday ? 'bg-leaf-100 text-leaf-700 font-medium' :
                hasDiary ? 'bg-warm-100 text-warm-700' : 'text-warm-500 hover:bg-warm-50'
              }`}
            >
              <span>{day}</span>
              {hasDiary && <span className="w-1 h-1 rounded-full bg-leaf-400 mt-0.5" />}
            </button>
          )
        })}
      </div>

      {/* 快速入口 + 备份 */}
      <div className="mt-6">
        <button
          onClick={() => navigate(`/diary/${today}`)}
          className="btn btn-primary w-full"
        >
          今天 — 写日记
        </button>
      </div>

      <BackupDrawer />
    </div>
  )
}

/* ========== 日记编辑器 ========== */
function DiaryEditor() {
  const { date } = useParams<{ date: string }>()
  const navigate = useNavigate()
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  const diary = useLiveQuery(() => db.diaries.get(date ?? ''), [date])

  useEffect(() => {
    if (diary) {
      setContent(diary.content)
    } else {
      setContent('')
    }
  }, [diary, date])

  const diaryDates = useLiveQuery(async () => {
    const all = await db.diaries.orderBy('date').toArray()
    return all.filter(d => d.content.trim()).map(d => d.date)
  }, []) ?? []

  const currentIdx = diaryDates.indexOf(date ?? '')
  const prevDate = currentIdx > 0 ? diaryDates[currentIdx - 1] : null
  const nextDate = currentIdx < diaryDates.length - 1 ? diaryDates[currentIdx + 1] : null

  const save = async () => {
    if (!date) return
    setSaving(true)
    await db.diaries.put({ date, content, updatedAt: Date.now() })
    setSaving(false)
  }

  const handleSave = () => {
    save()
  }

  // 自动保存
  useEffect(() => {
    if (!date || !content) return
    const timer = setTimeout(save, 2000)
    return () => clearTimeout(timer)
  }, [content, date])

  if (!date) return null

  const displayDate = new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => navigate('/diary')} className="btn btn-ghost p-2 text-warm-500">← 日历</button>
        <div className="flex gap-1">
          <button
            onClick={() => prevDate && navigate(`/diary/${prevDate}`)}
            disabled={!prevDate}
            className={`btn btn-ghost p-2 ${!prevDate ? 'opacity-30' : ''}`}
          >
            ‹
          </button>
          <button
            onClick={() => nextDate && navigate(`/diary/${nextDate}`)}
            disabled={!nextDate}
            className={`btn btn-ghost p-2 ${!nextDate ? 'opacity-30' : ''}`}
          >
            ›
          </button>
        </div>
      </div>

      <p className="text-sm text-warm-500 mb-4">{displayDate}</p>

      <textarea
        className="input-field min-h-[50vh] resize-none text-[15px] leading-relaxed"
        placeholder="今天发生了什么..."
        value={content}
        onChange={e => setContent(e.target.value)}
      />

      <div className="flex gap-2 mt-3">
        <button onClick={handleSave} className="btn btn-primary flex-1">
          {saving ? '保存中...' : '保存'}
        </button>
        {prevDate && (
          <button onClick={() => navigate(`/diary/${prevDate}`)} className="btn btn-ghost">
            ← 上一篇
          </button>
        )}
        {nextDate && (
          <button onClick={() => navigate(`/diary/${nextDate}`)} className="btn btn-ghost">
            下一篇 →
          </button>
        )}
      </div>

      {!diary?.content?.trim() && (
        <p className="text-xs text-warm-400 text-center mt-8">输入内容后自动保存</p>
      )}
    </div>
  )
}

export default function DiaryPage() {
  return (
    <Routes>
      <Route path="/" element={<CalendarView />} />
      <Route path="/:date" element={<DiaryEditor />} />
    </Routes>
  )
}
