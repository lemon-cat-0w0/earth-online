import { useState } from 'react'
import { Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { db, type Hobby, type HobbyTodo } from '../db'
import { useLiveQuery } from 'dexie-react-hooks'

function HobbyList() {
  const navigate = useNavigate()
  const hobbies = useLiveQuery(() => db.hobbies.orderBy('order').toArray(), []) ?? []
  const [newName, setNewName] = useState('')

  const addHobby = async () => {
    const name = newName.trim()
    if (!name) return
    const maxOrder = hobbies.length > 0 ? Math.max(...hobbies.map(h => h.order)) : 0
    await db.hobbies.add({ name, notes: '', order: maxOrder + 1 })
    setNewName('')
  }

  const deleteHobby = async (id: number) => {
    await db.hobbyTodos.where('hobbyId').equals(id).delete()
    await db.hobbies.delete(id)
  }

  const moveUp = async (hobby: Hobby, idx: number) => {
    if (idx === 0) return
    const above = hobbies[idx - 1]
    await db.hobbies.update(hobby.id!, { order: above.order })
    await db.hobbies.update(above.id!, { order: hobby.order })
  }

  const moveDown = async (hobby: Hobby, idx: number) => {
    if (idx === hobbies.length - 1) return
    const below = hobbies[idx + 1]
    await db.hobbies.update(hobby.id!, { order: below.order })
    await db.hobbies.update(below.id!, { order: hobby.order })
  }

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input
          className="input-field flex-1"
          placeholder="添加爱好..."
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addHobby()}
        />
        <button onClick={addHobby} className="btn btn-primary px-4">添加</button>
      </div>

      {hobbies.length === 0 && (
        <div className="text-center py-16 text-warm-400">
          <p className="text-4xl mb-3">🎯</p>
          <p>还没有爱好，去添加一个吧</p>
        </div>
      )}

      <div className="space-y-2">
        {hobbies.map((hobby, idx) => (
          <div key={hobby.id} className="card">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/hobby/${hobby.id}`)}
                className="flex-1 text-left py-1"
              >
                <span className="text-[15px] text-warm-800 font-medium">{hobby.name}</span>
                {hobby.notes && (
                  <p className="text-xs text-warm-400 mt-0.5 line-clamp-1">{hobby.notes.slice(0, 50)}</p>
                )}
              </button>
              <div className="flex gap-0.5 flex-shrink-0">
                <button onClick={() => moveUp(hobby, idx)} className="btn btn-ghost p-1.5 text-xs" disabled={idx === 0}>↑</button>
                <button onClick={() => moveDown(hobby, idx)} className="btn btn-ghost p-1.5 text-xs" disabled={idx === hobbies.length - 1}>↓</button>
                <button onClick={() => deleteHobby(hobby.id!)} className="btn btn-ghost p-1.5 text-xs text-blush-500">✕</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function HobbyDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const hobby = useLiveQuery(() => db.hobbies.get(Number(id)), [id])
  const todos = useLiveQuery(() =>
    db.hobbyTodos.where('hobbyId').equals(Number(id)).sortBy('order'), [id]
  ) ?? []
  const [noteText, setNoteText] = useState('')
  const [newTodo, setNewTodo] = useState('')

  useEffect(() => {
    if (hobby) setNoteText('')
  }, [hobby?.id])

  const appendNote = async () => {
    const text = noteText.trim()
    if (!text || !hobby) return
    const current = hobby.notes || ''
    const timestamp = new Date().toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    const newNotes = current ? `${current}\n\n--- ${timestamp} ---\n${text}` : text
    await db.hobbies.update(hobby.id!, { notes: newNotes })
    setNoteText('')
  }

  const addTodo = async () => {
    const text = newTodo.trim()
    if (!text) return
    const maxOrder = todos.length > 0 ? Math.max(...todos.map(t => t.order)) : 0
    await db.hobbyTodos.add({ hobbyId: Number(id), text, completed: false, order: maxOrder + 1, pinned: false })
    setNewTodo('')
  }

  if (!hobby) return null

  return (
    <div>
      <button onClick={() => navigate('/hobby')} className="btn btn-ghost p-2 text-warm-500 mb-3">← 返回</button>

      <h2 className="text-lg font-medium text-warm-800 mb-4">{hobby.name}</h2>

      {/* 待办列表 */}
      <div className="mb-4">
        <p className="text-xs text-warm-400 mb-2">学习任务</p>
        <div className="flex gap-2 mb-2">
          <input
            className="input-field flex-1 text-sm"
            placeholder="添加任务..."
            value={newTodo}
            onChange={e => setNewTodo(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTodo()}
          />
          <button onClick={addTodo} className="btn btn-primary px-3 text-sm">添加</button>
        </div>
        <div className="space-y-1">
          {todos.map(item => (
            <div key={item.id} className="card flex items-center gap-2 py-2.5">
              <button
                onClick={async () => await db.hobbyTodos.update(item.id!, { completed: !item.completed })}
                className={`w-4 h-4 rounded-full border flex-shrink-0 ${
                  item.completed ? 'bg-leaf-500 border-leaf-500' : 'border-warm-300'
                }`}
              >
                {item.completed && (
                  <svg width="8" height="6" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
                )}
              </button>
              <span className={`flex-1 text-sm ${item.completed ? 'line-through text-warm-400' : 'text-warm-700'}`}>
                {item.text}
              </span>
              <button
                onClick={() => db.hobbyTodos.delete(item.id!)}
                className="text-warm-300 text-xs"
              >✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* 累加文本框 */}
      <div>
        <p className="text-xs text-warm-400 mb-2">学习笔记（每次追加）</p>
        <textarea
          className="input-field min-h-[120px] text-sm resize-none"
          placeholder="记录新的学习内容..."
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
        />
        <button onClick={appendNote} disabled={!noteText.trim()} className="btn btn-primary w-full mt-2">追加笔记</button>

        {hobby.notes ? (
          <div className="mt-4 card">
            <pre className="text-sm text-warm-700 whitespace-pre-wrap font-sans leading-relaxed">{hobby.notes}</pre>
          </div>
        ) : (
          <p className="text-xs text-warm-400 text-center mt-4">还没有笔记</p>
        )}
      </div>
    </div>
  )
}

import { useEffect } from 'react'

export default function HobbyPage() {
  return (
    <Routes>
      <Route path="/" element={<HobbyList />} />
      <Route path="/:id" element={<HobbyDetail />} />
    </Routes>
  )
}
