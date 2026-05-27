import Dexie, { Table } from 'dexie'

export interface Diary {
  date: string
  content: string
  updatedAt: number
}

export interface Hobby {
  id?: number
  name: string
  notes: string
  order: number
}

export interface HobbyTodo {
  id?: number
  hobbyId: number
  text: string
  completed: boolean
  order: number
  pinned: boolean
}

export interface Goal {
  id?: number
  name: string
  type: 'long' | 'mid'
  progress: number
  notes: string
  order: number
}

export interface GoalTodo {
  id?: number
  goalId: number
  text: string
  completed: boolean
  order: number
  pinned: boolean
}

export interface FinanceItem {
  id?: number
  name: string
  marketValue: number
  order: number
}

export interface FinanceRecord {
  id?: number
  financeItemId: number
  amount: number
  type: 'in' | 'out'
  date: string
  note: string
}

export interface ExploreItem {
  id?: number
  type: 'strength' | 'weakness'
  content: string
  order: number
}

export interface TodoItem {
  id?: number
  text: string
  completed: boolean
  order: number
  pinned: boolean
}

class EarthDB extends Dexie {
  diaries!: Table<Diary, string>
  hobbies!: Table<Hobby, number>
  hobbyTodos!: Table<HobbyTodo, number>
  goals!: Table<Goal, number>
  goalTodos!: Table<GoalTodo, number>
  financeItems!: Table<FinanceItem, number>
  financeRecords!: Table<FinanceRecord, number>
  exploreItems!: Table<ExploreItem, number>
  todos!: Table<TodoItem, number>

  constructor() {
    super('EarthOnlineDB')
    this.version(1).stores({
      diaries: 'date',
      hobbies: '++id, order',
      hobbyTodos: '++id, hobbyId, order',
      goals: '++id, type, order',
      goalTodos: '++id, goalId, order',
      financeItems: '++id, order',
      financeRecords: '++id, financeItemId, date',
      exploreItems: '++id, type, order',
      todos: '++id, order',
    })
  }
}

export const db = new EarthDB()

/* ========== 全量导出/导入 ========== */
export async function exportAllData(): Promise<string> {
  const data = {
    diaries: await db.diaries.toArray(),
    hobbies: await db.hobbies.toArray(),
    hobbyTodos: await db.hobbyTodos.toArray(),
    goals: await db.goals.toArray(),
    goalTodos: await db.goalTodos.toArray(),
    financeItems: await db.financeItems.toArray(),
    financeRecords: await db.financeRecords.toArray(),
    exploreItems: await db.exploreItems.toArray(),
    todos: await db.todos.toArray(),
    exportedAt: new Date().toISOString(),
  }
  return JSON.stringify(data, null, 2)
}

export async function importAllData(json: string): Promise<boolean> {
  try {
    const data = JSON.parse(json)
    await db.transaction('rw', db.tables, async () => {
      await Promise.all(db.tables.map(t => t.clear()))
      if (data.diaries) await db.diaries.bulkAdd(data.diaries)
      if (data.hobbies) await db.hobbies.bulkAdd(data.hobbies)
      if (data.hobbyTodos) await db.hobbyTodos.bulkAdd(data.hobbyTodos)
      if (data.goals) await db.goals.bulkAdd(data.goals)
      if (data.goalTodos) await db.goalTodos.bulkAdd(data.goalTodos)
      if (data.financeItems) await db.financeItems.bulkAdd(data.financeItems)
      if (data.financeRecords) await db.financeRecords.bulkAdd(data.financeRecords)
      if (data.exploreItems) await db.exploreItems.bulkAdd(data.exploreItems)
      if (data.todos) await db.todos.bulkAdd(data.todos)
    })
    return true
  } catch {
    return false
  }
}
