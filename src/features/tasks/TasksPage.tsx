import { FormEvent, useEffect, useState } from 'react'
import { DataTable } from '../../components/common/DataTable'
import { api } from '../../services/api'
import { Task } from '../../types/models'
import { useAuth } from '../auth/AuthContext'
import { useLocale } from '../../context/LocaleContext'
import { labels } from '../../locales/labels'

const empty: Partial<Task> = { title: '', description: '', status: 'pending', due_date: '' }

function TaskModal({
  title, draft, saving, onChange, onChangeStatus, onSubmit, onClose,
}: {
  title: string
  draft: Partial<Task>
  saving: boolean
  onChange: (field: keyof Task, value: string) => void
  onChangeStatus: (value: Task['status']) => void
  onSubmit: (e: FormEvent) => void
  onClose: () => void
}) {
  const { locale } = useLocale()
  const l = labels[locale]

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={closeBtn}>✕</button>
        </div>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: '.7rem' }}>
          <label style={labelStyle}>
            {l.title} *
            <input required value={draft.title ?? ''} onChange={(e) => onChange('title', e.target.value)} />
          </label>
          <label style={labelStyle}>
            {l.description}
            <input value={draft.description ?? ''} onChange={(e) => onChange('description', e.target.value)} />
          </label>
          <label style={labelStyle}>
            {l.statusLabel}
            <select value={draft.status} onChange={(e) => onChangeStatus(e.target.value as Task['status'])}>
              <option value="pending">{l.pending}</option>
              <option value="in_progress">{l.inProgress}</option>
              <option value="done">{l.done}</option>
            </select>
          </label>
          <label style={labelStyle}>
            {l.dueDate}
            <input type="date" value={draft.due_date ?? ''} onChange={(e) => onChange('due_date', e.target.value)} />
          </label>
          <div style={{ display: 'flex', gap: '.6rem', justifyContent: 'flex-end', marginTop: '.5rem' }}>
            <button type="button" onClick={onClose} disabled={saving} style={cancelBtn}>{l.cancel}</button>
            <button type="submit" disabled={saving} style={primaryBtn}>{saving ? l.saving : l.save}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ConfirmModal({ taskTitle, onConfirm, onCancel }: { taskTitle: string; onConfirm: () => void; onCancel: () => void }) {
  const { locale } = useLocale()
  const l = labels[locale]

  return (
    <div style={overlay} onClick={onCancel}>
      <div style={{ ...modal, maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 .5rem' }}>{l.deleteTaskTitle}</h2>
        <p style={{ margin: '0 0 1.2rem', color: '#475569' }}>
          {l.deleteTaskMsg(taskTitle)} {l.cannotUndo}
        </p>
        <div style={{ display: 'flex', gap: '.6rem', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={cancelBtn}>{l.cancel}</button>
          <button onClick={onConfirm} style={dangerBtn}>{l.delete}</button>
        </div>
      </div>
    </div>
  )
}

export function TasksPage() {
  const { token } = useAuth()
  const { locale } = useLocale()
  const l = labels[locale]

  const [rows, setRows] = useState<Task[]>([])

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Partial<Task>>(empty)
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null)

  const load = () => token && api.listTasks(token).then(setRows)
  useEffect(() => { load() }, [token])

  const openAdd = () => { setDraft(empty); setEditingId(null); setModalOpen(true) }
  const openEdit = (row: Task) => { setDraft(row); setEditingId(row.id); setModalOpen(true) }

  const handleChange = (field: keyof Task, value: string) =>
    setDraft((prev) => ({ ...prev, [field]: value }))
  const handleChangeStatus = (value: Task['status']) =>
    setDraft((prev) => ({ ...prev, status: value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!token) return
    setSaving(true)
    if (editingId) await api.updateTask(token, editingId, draft)
    else await api.createTask(token, draft)
    setSaving(false)
    setModalOpen(false)
    load()
  }

  const handleDelete = async () => {
    if (!token || !deleteTarget) return
    await api.deleteTask(token, deleteTarget.id)
    setDeleteTarget(null)
    load()
  }

  const statusLabel: Record<Task['status'], string> = {
    pending: l.pending,
    in_progress: l.inProgress,
    done: l.done,
  }

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>{l.tasksTitle}</h1>
        <button onClick={openAdd} style={primaryBtn}>{l.createTask}</button>
      </div>

      <DataTable headers={[l.title, l.statusLabel, l.dueDate, '']}>
        {rows.map((row) => (
          <tr key={row.id}>
            <td>{row.title}</td>
            <td>{statusLabel[row.status] ?? row.status}</td>
            <td>{row.due_date ?? '—'}</td>
            <td>
              <button onClick={() => openEdit(row)}>{l.edit}</button>
              <button onClick={() => setDeleteTarget(row)} style={{ marginLeft: '.4rem', color: '#dc2626', borderColor: '#dc2626' }}>{l.delete}</button>
            </td>
          </tr>
        ))}
      </DataTable>

      {modalOpen && (
        <TaskModal
          title={editingId ? l.editTask : l.newTask}
          draft={draft}
          saving={saving}
          onChange={handleChange}
          onChangeStatus={handleChangeStatus}
          onSubmit={handleSubmit}
          onClose={() => setModalOpen(false)}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          taskTitle={deleteTarget.title}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </section>
  )
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.4)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000,
}
const modal: React.CSSProperties = {
  background: '#fff', borderRadius: '12px',
  padding: '1.5rem', width: '100%', maxWidth: 520,
  boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
}
const labelStyle: React.CSSProperties = { display: 'grid', gap: '.3rem', fontSize: '.9rem', fontWeight: 500 }
const closeBtn: React.CSSProperties = { background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }
const primaryBtn: React.CSSProperties = { background: '#0f172a', color: '#fff', border: 'none', padding: '.55rem 1rem', borderRadius: '.45rem', cursor: 'pointer' }
const cancelBtn: React.CSSProperties = { background: '#fff', color: '#0f172a', border: '1px solid #cbd5e1', padding: '.55rem 1rem', borderRadius: '.45rem', cursor: 'pointer' }
const dangerBtn: React.CSSProperties = { background: '#dc2626', color: '#fff', border: 'none', padding: '.55rem 1rem', borderRadius: '.45rem', cursor: 'pointer' }
