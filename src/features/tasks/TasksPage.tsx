import { FormEvent, useEffect, useState } from 'react'
import { DataTable } from '../../components/common/DataTable'
import { api } from '../../services/api'
import { Task } from '../../types/models'
import { useAuth } from '../auth/AuthContext'

const emptyTask: Partial<Task> = { title: '', description: '', status: 'pending', due_date: '' }

export function TasksPage() {
  const { token } = useAuth()
  const [rows, setRows] = useState<Task[]>([])
  const [draft, setDraft] = useState<Partial<Task>>(emptyTask)
  const [editingId, setEditingId] = useState<string | null>(null)

  const load = () => token && api.listTasks(token).then(setRows)
  useEffect(() => { load() }, [token])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!token) return
    if (editingId) await api.updateTask(token, editingId, draft)
    else await api.createTask(token, draft)
    setDraft(emptyTask)
    setEditingId(null)
    load()
  }

  return (
    <section>
      <h1>Tasks</h1>
      <form className="form-grid" onSubmit={submit}>
        <input required placeholder="Task title" value={draft.title ?? ''} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        <input placeholder="Description" value={draft.description ?? ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        <select value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value as Task['status'] })}><option>pending</option><option>in_progress</option><option>done</option></select>
        <input type="date" value={draft.due_date ?? ''} onChange={(e) => setDraft({ ...draft, due_date: e.target.value })} />
        <button type="submit">{editingId ? 'Update' : 'Create'} task</button>
      </form>
      <DataTable headers={['Title', 'Status', 'Due date', 'Actions']}>
        {rows.map((row) => <tr key={row.id}><td>{row.title}</td><td>{row.status}</td><td>{row.due_date}</td><td><button onClick={() => { setEditingId(row.id); setDraft(row) }}>Edit</button><button onClick={() => token && api.deleteTask(token, row.id).then(load)}>Delete</button></td></tr>)}
      </DataTable>
    </section>
  )
}
