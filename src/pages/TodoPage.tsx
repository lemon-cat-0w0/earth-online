import { useState, useEffect } from 'react'
import { db, type TodoItem } from '../db'
import { useLiveQuery } from 'dexie-react-hooks'

export default function TodoPage() {
  const todos = useLiveQuery(() => db.todos.orderBy('order').toArray(), []) ?? []
  const [newText, setNewText] = useState('')

  const addTodo = async () => {
    const text = newText.trim()
    if (!text) return
    const maxOrder = todos.length > 0 ? Math.max(...todos.map(t => t.order)) : 0
    await db.todos.add({ text, completed: false, order: maxOrder + 1, pinned: false })
    setNewText('')
  }

  const toggleTodo = async (id: number, completed: boolean) => {
    await db.todos.update(id, { completed: !completed })
  }

  const deleteTodo = async (id: number) => {
    await db.todos.delete(id)
  }

  const togglePin = async (item: TodoItem) => {
    await db.todos.update(item.id!, { pinned: !item.pinned })
  }

  const sorted = [...todos].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return a.order - b.order
  })

  const active = sorted.filter(t => !t.completed)
  const completed = sorted.filter(t => t.completed)

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input
          className="input-field flex-1"
          placeholder="添加待办事项..."
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTodo()}
        />
        <button onClick={addTodo} className="btn btn-primary px-4">添加</button>
      </div>

      {active.length === 0 && completed.length === 0 && (
        <div className="text-center py-16 text-warm-400">
          <p className="text-4xl mb-3">☑</p>
          <p>还没有待办事项</p>
          <p className="text-sm mt-1">在上面输入并添加吧</p>
        </div>
      )}

      <div className="space-y-1.5">
        {active.map(item => renderItem(item))}
      </div>

      {completed.length > 0 && (
        <div className="mt-6">
          <p className="text-xs text-warm-400 mb-2 px-1">已完成 ({completed.length})</p>
          <div className="space-y-1.5 opacity-60">
            {completed.map(item => renderItem(item))}
          </div>
        </div>
      )}
    </div>
  )

  function renderItem(item: TodoItem) {
    return (
      <div key={item.id} className={`card flex items-center gap-3 ${item.completed ? '' : ''}`}>
        <button
          onClick={() => toggleTodo(item.id!, item.completed)}
          className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
            item.completed
              ? 'bg-leaf-500 border-leaf-500'
              : 'border-warm-300'
          }`}
        >
          {item.completed && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          )}
        </button>
        <span className={`flex-1 text-[15px] ${item.completed ? 'line-through text-warm-400' : 'text-warm-800'}`}>
          {item.text}
        </span>
        {item.pinned && <span className="text-xs text-leaf-500">📌</span>}
        <button
          onClick={() => togglePin(item)}
          className="p-1 text-warm-400 hover:text-warm-600 text-xs"
          title={item.pinned ? '取消置顶' : '置顶'}
        >
          📌
        </button>
        <button
          onClick={() => deleteTodo(item.id!)}
          className="p-1 text-warm-300 hover:text-blush-500 text-sm"
        >
          ✕
        </button>
      </div>
    )
  }
}
