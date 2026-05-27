import { useState } from 'react'
import { db, type ExploreItem } from '../db'
import { useLiveQuery } from 'dexie-react-hooks'

function ExploreContent() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="text-sm font-medium text-warm-600 mb-3">优势清单</h2>
        <ListSection type="strength" />
      </div>
      <div>
        <h2 className="text-sm font-medium text-warm-600 mb-3">劣势清单</h2>
        <ListSection type="weakness" />
      </div>
    </div>
  )
}

function ListSection({ type }: { type: 'strength' | 'weakness' }) {
  const items = useLiveQuery(() => db.exploreItems.where('type').equals(type).sortBy('order'), [type]) ?? []
  const [newContent, setNewContent] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')

  const addItem = async () => {
    const content = newContent.trim()
    if (!content) return
    const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.order)) : 0
    await db.exploreItems.add({ type, content, order: maxOrder + 1 })
    setNewContent('')
  }

  const startEdit = (item: ExploreItem) => {
    setEditingId(item.id!)
    setEditText(item.content)
  }

  const saveEdit = async (id: number) => {
    const content = editText.trim()
    if (!content) return
    await db.exploreItems.update(id, { content })
    setEditingId(null)
  }

  const deleteItem = async (id: number) => {
    await db.exploreItems.delete(id)
  }

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <input
          className="input-field flex-1 text-sm"
          placeholder={type === 'strength' ? '添加优势...' : '添加劣势...'}
          value={newContent}
          onChange={e => setNewContent(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()}
        />
        <button onClick={addItem} className="btn btn-primary px-3 text-sm">添加</button>
      </div>

      {items.length === 0 && (
        <p className="text-xs text-warm-400 text-center py-4">暂无{type === 'strength' ? '优势' : '劣势'}记录</p>
      )}

      <div className="space-y-1.5">
        {items.map(item => (
          <div key={item.id} className="card flex items-center gap-2 py-2.5">
            {editingId === item.id ? (
              <>
                <input
                  className="input-field flex-1 text-sm py-1.5"
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && saveEdit(item.id!)}
                  autoFocus
                />
                <button onClick={() => saveEdit(item.id!)} className="btn btn-primary px-2 py-1 text-xs">保存</button>
                <button onClick={() => setEditingId(null)} className="btn btn-ghost px-2 py-1 text-xs">取消</button>
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-warm-700">{item.content}</span>
                <button onClick={() => startEdit(item)} className="text-warm-400 text-xs hover:text-sky-500">✎</button>
                <button onClick={() => deleteItem(item.id!)} className="text-warm-300 text-xs ml-1">✕</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ExplorePage() {
  return <ExploreContent />
}
