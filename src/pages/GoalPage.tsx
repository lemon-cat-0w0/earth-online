import { useState, useEffect } from 'react'
import { Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { db, type Goal, type GoalTodo } from '../db'
import { useLiveQuery } from 'dexie-react-hooks'

type GoalType = 'long' | 'mid'

function PlanetLayout({ goals, onGoalClick }: { goals: Goal[]; onGoalClick: (id: number) => void }) {
  const count = goals.length
  if (count === 0) return null

  const cx = 160
  const cy = 160
  const baseR = count <= 3 ? 80 : count <= 5 ? 95 : 105
  const itemR = 44

  return (
    <div className="flex justify-center">
      <svg viewBox="0 0 320 320" className="w-full max-w-[320px] h-auto">
        {/* 中心星球 */}
        <circle cx={cx} cy={cy} r={44} fill="#e6f0dc" stroke="#8bb563" strokeWidth="1.5" />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="28" fill="#3d2e22">🌏</text>
        <text x={cx} y={cy + 24} textAnchor="middle" fontSize="12" fill="#6d9848">核心</text>

        {/* 轨道 */}
        <circle cx={cx} cy={cy} r={baseR} fill="none" stroke="#edd9b3" strokeWidth="0.5" strokeDasharray="4,3" opacity="0.7" />

        {/* 目标卫星 */}
        {goals.map((goal, i) => {
          const angle = (2 * Math.PI * i) / count - Math.PI / 2
          const gx = cx + baseR * Math.cos(angle)
          const gy = cy + baseR * Math.sin(angle)

          // 连线
          const lx = cx + 44 * Math.cos(angle)
          const ly = cy + 44 * Math.sin(angle)

          return (
            <g key={goal.id} className="cursor-pointer" onClick={() => onGoalClick(goal.id!)}>
              <line x1={lx} y1={ly} x2={gx} y2={gy} stroke="#d4b896" strokeWidth="0.5" opacity="0.5" />
              <circle cx={gx} cy={gy} r={itemR} fill="#ffffff" stroke="#b89a7a" strokeWidth="0.8" />
              <circle cx={gx} cy={gy} r={itemR - 2} fill="#faf3e6" opacity="0.6" />
              <text
                x={gx}
                y={gy - 2}
                textAnchor="middle"
                fontSize="11"
                fill="#5c4534"
                fontWeight="500"
              >
                {goal.name.length > 5 ? goal.name.slice(0, 5) + '..' : goal.name}
              </text>
              <text x={gx} y={gy + 14} textAnchor="middle" fontSize="10" fill="#b89a7a">
                {goal.progress}/10
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function GoalList() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<GoalType>('long')
  const goals = useLiveQuery(() => db.goals.where('type').equals(tab).sortBy('order'), [tab]) ?? []
  const [newName, setNewName] = useState('')

  const addGoal = async () => {
    const name = newName.trim()
    if (!name) return
    const maxOrder = goals.length > 0 ? Math.max(...goals.map(g => g.order)) : 0
    await db.goals.add({ name, type: tab, progress: 0, notes: '', order: maxOrder + 1 })
    setNewName('')
  }

  const deleteGoal = async (id: number) => {
    await db.goalTodos.where('goalId').equals(id).delete()
    await db.goals.delete(id)
  }

  return (
    <div>
      <div className="flex gap-1 mb-4 bg-warm-100 rounded-xl p-1">
        <button
          onClick={() => setTab('long')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'long' ? 'bg-white text-leaf-600 shadow-sm' : 'text-warm-500'
          }`}
        >
          长期目标
        </button>
        <button
          onClick={() => setTab('mid')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'mid' ? 'bg-white text-sky-600 shadow-sm' : 'text-warm-500'
          }`}
        >
          中期目标
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          className="input-field flex-1"
          placeholder={`添加${tab === 'long' ? '长期' : '中期'}目标...`}
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addGoal()}
        />
        <button onClick={addGoal} className="btn btn-primary px-4">添加</button>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-12 text-warm-400">
          <p className="text-3xl mb-2">⭐</p>
          <p>还没有{tab === 'long' ? '长期' : '中期'}目标</p>
        </div>
      ) : (
        <>
          <PlanetLayout goals={goals} onGoalClick={(id) => navigate(`/goal/${tab}/${id}`)} />

          <div className="mt-4 space-y-1.5">
            {goals.map(goal => (
              <div key={goal.id} className="card flex items-center gap-3 py-3">
                <button
                  onClick={() => navigate(`/goal/${tab}/${goal.id}`)}
                  className="flex-1 text-left"
                >
                  <span className="text-[15px] text-warm-800">{goal.name}</span>
                  <div className="flex items-center gap-2 mt-1.5">
                    {/* 微型进度条 */}
                    <div className="flex gap-0.5">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-sm ${i < goal.progress ? 'bg-leaf-400' : 'bg-warm-100'}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-warm-400">{goal.progress}/10</span>
                  </div>
                </button>
                <button onClick={() => deleteGoal(goal.id!)} className="text-warm-300 text-sm">✕</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function GoalDetail() {
  const { type, id } = useParams<{ type: string; id: string }>()
  const navigate = useNavigate()
  const goal = useLiveQuery(() => db.goals.get(Number(id)), [id])
  const todos = useLiveQuery(() =>
    db.goalTodos.where('goalId').equals(Number(id)).sortBy('order'), [id]
  ) ?? []
  const [noteText, setNoteText] = useState('')
  const [newTodo, setNewTodo] = useState('')

  const appendNote = async () => {
    const text = noteText.trim()
    if (!text || !goal) return
    const current = goal.notes || ''
    const timestamp = new Date().toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    const newNotes = current ? `${current}\n\n--- ${timestamp} ---\n${text}` : text
    await db.goals.update(goal.id!, { notes: newNotes })
    setNoteText('')
  }

  const setProgress = async (val: number) => {
    if (goal) await db.goals.update(goal.id!, { progress: val })
  }

  const addTodo = async () => {
    const text = newTodo.trim()
    if (!text) return
    const maxOrder = todos.length > 0 ? Math.max(...todos.map(t => t.order)) : 0
    await db.goalTodos.add({ goalId: Number(id), text, completed: false, order: maxOrder + 1, pinned: false })
    setNewTodo('')
  }

  if (!goal) return null

  return (
    <div>
      <button onClick={() => navigate('/goal')} className="btn btn-ghost p-2 text-warm-500 mb-3">← 返回</button>
      <h2 className="text-lg font-medium text-warm-800 mb-4">{goal.name}</h2>

      {/* 进度条 */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-warm-600">完成进度</span>
          <span className="text-sm font-medium text-warm-800">{goal.progress}/10</span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: 10 }).map((_, i) => (
            <button
              key={i}
              onClick={() => setProgress(i + 1)}
              className={`flex-1 h-8 rounded-md transition-colors ${
                i < goal.progress
                  ? 'bg-leaf-400 hover:bg-leaf-500'
                  : 'bg-warm-100 hover:bg-warm-200'
              }`}
              title={`设置为 ${i + 1}/10`}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-warm-400">0%</span>
          <span className="text-[10px] text-warm-400">100%</span>
        </div>
      </div>

      {/* 附属待办 */}
      <div className="card mb-4">
        <p className="text-xs text-warm-400 mb-2">行动计划</p>
        <div className="flex gap-2 mb-2">
          <input className="input-field flex-1 text-sm" placeholder="添加行动..." value={newTodo} onChange={e => setNewTodo(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTodo()} />
          <button onClick={addTodo} className="btn btn-primary px-3 text-sm">添加</button>
        </div>
        <div className="space-y-1">
          {todos.map(item => (
            <div key={item.id} className="card flex items-center gap-2 py-2.5">
              <button
                onClick={async () => await db.goalTodos.update(item.id!, { completed: !item.completed })}
                className={`w-4 h-4 rounded-full border flex-shrink-0 ${
                  item.completed ? 'bg-leaf-500 border-leaf-500' : 'border-warm-300'
                }`}
              >
                {item.completed && (
                  <svg width="8" height="6" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
                )}
              </button>
              <span className={`flex-1 text-sm ${item.completed ? 'line-through text-warm-400' : 'text-warm-700'}`}>{item.text}</span>
              <button onClick={() => db.goalTodos.delete(item.id!)} className="text-warm-300 text-xs">✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* 累加文本框 */}
      <div>
        <p className="text-xs text-warm-400 mb-2">进展记录（每次追加）</p>
        <textarea className="input-field min-h-[100px] text-sm resize-none" placeholder="记录新的进展..." value={noteText} onChange={e => setNoteText(e.target.value)} />
        <button onClick={appendNote} disabled={!noteText.trim()} className="btn btn-primary w-full mt-2">追加记录</button>
        {goal.notes ? (
          <div className="mt-4 card"><pre className="text-sm text-warm-700 whitespace-pre-wrap font-sans leading-relaxed">{goal.notes}</pre></div>
        ) : (
          <p className="text-xs text-warm-400 text-center mt-4">还没有进展记录</p>
        )}
      </div>
    </div>
  )
}

export default function GoalPage() {
  return (
    <Routes>
      <Route path="/" element={<GoalList />} />
      <Route path="/:type/:id" element={<GoalDetail />} />
    </Routes>
  )
}
