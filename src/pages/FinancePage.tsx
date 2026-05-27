import { useState } from 'react'
import { Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { db, type FinanceItem, type FinanceRecord } from '../db'
import { useLiveQuery } from 'dexie-react-hooks'

function FinanceList() {
  const navigate = useNavigate()
  const items = useLiveQuery(() => db.financeItems.orderBy('order').toArray(), []) ?? []
  const [newName, setNewName] = useState('')
  const [newValue, setNewValue] = useState('')

  const addItem = async () => {
    const name = newName.trim()
    if (!name) return
    const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.order)) : 0
    await db.financeItems.add({
      name,
      marketValue: parseFloat(newValue) || 0,
      order: maxOrder + 1,
    })
    setNewName('')
    setNewValue('')
  }

  const updateMarketValue = async (item: FinanceItem, value: number) => {
    await db.financeItems.update(item.id!, { marketValue: value })
  }

  const deleteItem = async (id: number) => {
    await db.financeRecords.where('financeItemId').equals(id).delete()
    await db.financeItems.delete(id)
  }

  return (
    <div>
      <div className="card mb-4">
        <h3 className="text-xs text-warm-400 mb-3">添加理财项目</h3>
        <div className="flex flex-col gap-2">
          <input className="input-field" placeholder="名称（如：基金A、定期存款）" value={newName} onChange={e => setNewName(e.target.value)} />
          <div className="flex gap-2">
            <input
              className="input-field flex-1"
              placeholder="市场现值"
              type="number"
              value={newValue}
              onChange={e => setNewValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addItem()}
            />
            <button onClick={addItem} className="btn btn-primary px-4">添加</button>
          </div>
        </div>
      </div>

      {items.length === 0 && (
        <div className="text-center py-16 text-warm-400">
          <p className="text-4xl mb-3">💰</p>
          <p>还没有理财项目</p>
          <p className="text-sm mt-1">在上面添加吧</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {items.map(item => (
          <div
            key={item.id}
            className="card cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(`/finance/${item.id}`)}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-[15px] font-medium text-warm-800 truncate">{item.name}</h3>
              <button
                onClick={e => { e.stopPropagation(); deleteItem(item.id!) }}
                className="text-warm-300 text-xs mt-0.5"
              >✕</button>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-warm-400">¥</span>
              <input
                className="text-lg font-medium bg-transparent border-none outline-none w-full text-warm-800 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                type="number"
                value={item.marketValue || ''}
                onClick={e => e.stopPropagation()}
                onChange={e => {
                  e.stopPropagation()
                  updateMarketValue(item, parseFloat(e.target.value) || 0)
                }}
                placeholder="0"
              />
            </div>
            <p className="text-[10px] text-warm-400 mt-1">点击卡片查看记录</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function FinanceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const item = useLiveQuery(() => db.financeItems.get(Number(id)), [id])
  const records = useLiveQuery(
    () => db.financeRecords.where('financeItemId').equals(Number(id)).reverse().sortBy('date'),
    [id]
  ) ?? []
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'in' | 'out'>('in')
  const [note, setNote] = useState('')

  const addRecord = async () => {
    const val = parseFloat(amount)
    if (!val || val <= 0) return
    await db.financeRecords.add({
      financeItemId: Number(id),
      amount: val,
      type,
      date: new Date().toISOString().slice(0, 10),
      note: note.trim(),
    })
    setAmount('')
    setNote('')
  }

  if (!item) return null

  const totalIn = records.filter(r => r.type === 'in').reduce((s, r) => s + r.amount, 0)
  const totalOut = records.filter(r => r.type === 'out').reduce((s, r) => s + r.amount, 0)

  return (
    <div>
      <button onClick={() => navigate('/finance')} className="btn btn-ghost p-2 text-warm-500 mb-3">← 返回</button>
      <h2 className="text-lg font-medium text-warm-800 mb-2">{item.name}</h2>

      <div className="card mb-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-warm-400 mb-1">投入总额</p>
            <p className="text-sm font-medium text-leaf-600">¥{totalIn.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-warm-400 mb-1">取出总额</p>
            <p className="text-sm font-medium text-blush-500">¥{totalOut.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-warm-400 mb-1">市场现值</p>
            <p className="text-sm font-medium text-warm-800">¥{item.marketValue.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* 添加记录 */}
      <div className="card mb-4">
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setType('in')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              type === 'in' ? 'bg-leaf-100 text-leaf-600' : 'bg-warm-50 text-warm-500'
            }`}
          >
            + 增加
          </button>
          <button
            onClick={() => setType('out')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              type === 'out' ? 'bg-blush-100 text-blush-500' : 'bg-warm-50 text-warm-500'
            }`}
          >
            - 减少
          </button>
        </div>
        <div className="flex gap-2">
          <input className="input-field flex-1" type="number" placeholder="金额" value={amount} onChange={e => setAmount(e.target.value)} />
          <input className="input-field flex-1" placeholder="备注" value={note} onChange={e => setNote(e.target.value)} onKeyDown={e => e.key === 'Enter' && addRecord()} />
          <button onClick={addRecord} className="btn btn-primary px-4">记录</button>
        </div>
      </div>

      {/* 记录列表 */}
      <div>
        <p className="text-xs text-warm-400 mb-2">交易记录</p>
        {records.length === 0 ? (
          <p className="text-sm text-warm-400 text-center py-6">还没有记录</p>
        ) : (
          <div className="space-y-1.5">
            {records.map(record => (
              <div key={record.id} className="card flex items-center gap-3 py-2.5">
                <span className={`text-sm font-medium w-16 ${record.type === 'in' ? 'text-leaf-600' : 'text-blush-500'}`}>
                  {record.type === 'in' ? '+' : '-'}¥{record.amount.toFixed(2)}
                </span>
                <span className="flex-1 text-sm text-warm-600 truncate">{record.note || '无备注'}</span>
                <span className="text-xs text-warm-400">{record.date.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function FinancePage() {
  return (
    <Routes>
      <Route path="/" element={<FinanceList />} />
      <Route path="/:id" element={<FinanceDetail />} />
    </Routes>
  )
}
