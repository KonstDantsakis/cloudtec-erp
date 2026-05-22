import React, { useEffect, useMemo, useState } from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableRow,
} from '@coreui/react'
import { callEdge } from '@/services/api'
import { useAuth } from '@/context/AuthContext'

type Expense = {
  id: string
  vendor: string | null
  category: string | null
  amount_cents: number | null
  currency: string | null
  method: string | null
  paid_at: string | null
  notes: string | null
  receipt_url: string | null
  created_by: string | null
  created_at: string | null
}

type ExpenseForm = {
  vendor: string
  category: string
  amount: string
  currency: string
  method: string
  paid_at: string
  notes: string
  receipt_url: string
}

const emptyForm: ExpenseForm = {
  vendor: '',
  category: '',
  amount: '',
  currency: 'EUR',
  method: '',
  paid_at: '',
  notes: '',
  receipt_url: '',
}

const formatAmount = (cents: number | null) => {
  if (cents == null) return '-'
  return (cents / 100).toFixed(2)
}

const Expenses: React.FC = () => {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // filters / sort
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all')
  const [methodFilter, setMethodFilter] = useState<'all' | string>('all')
  const [sortOption, setSortOption] = useState<'recent' | 'oldest' | 'amount_desc' | 'amount_asc'>(
    'recent',
  )

  // modal + form
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<ExpenseForm>(emptyForm)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ExpenseForm, string>>>({})
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)

  // row actions
  const [rowActionId, setRowActionId] = useState<string | null>(null)

  const loadExpenses = async () => {
    setLoading(true)
    setError(null)

    const { data, error } = await callEdge<Expense[]>('get-expenses')

    if (error) {
      console.error('[Expenses] Error loading expenses:', error)
      setError('Προέκυψε σφάλμα κατά τη φόρτωση των εξόδων.')
      setExpenses([])
    } else {
      setExpenses(data ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadExpenses()
  }, [])

  const categoryOptions = useMemo(() => {
    const set = new Set<string>()
    expenses.forEach((e) => {
      if (e.category) set.add(e.category)
    })
    return Array.from(set).sort()
  }, [expenses])

  const methodOptions = useMemo(() => {
    const set = new Set<string>()
    expenses.forEach((e) => {
      if (e.method) set.add(e.method)
    })
    return Array.from(set).sort()
  }, [expenses])

  const filteredExpenses = useMemo(() => {
    let list = [...expenses]

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((e) => {
        return (
          (e.vendor ?? '').toLowerCase().includes(q) ||
          (e.category ?? '').toLowerCase().includes(q) ||
          (e.notes ?? '').toLowerCase().includes(q)
        )
      })
    }

    if (categoryFilter !== 'all') {
      list = list.filter((e) => e.category === categoryFilter)
    }

    if (methodFilter !== 'all') {
      list = list.filter((e) => e.method === methodFilter)
    }

    list.sort((a, b) => {
      const amountA = a.amount_cents ?? 0
      const amountB = b.amount_cents ?? 0
      const dateA = a.paid_at ? new Date(a.paid_at).getTime() : 0
      const dateB = b.paid_at ? new Date(b.paid_at).getTime() : 0

      switch (sortOption) {
        case 'amount_desc':
          return amountB - amountA
        case 'amount_asc':
          return amountA - amountB
        case 'oldest':
          return dateA - dateB
        case 'recent':
        default:
          return dateB - dateA
      }
    })

    return list
  }, [expenses, search, categoryFilter, methodFilter, sortOption])

  const handleOpenModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense)
      setForm({
        vendor: expense.vendor ?? '',
        category: expense.category ?? '',
        amount: expense.amount_cents != null ? (expense.amount_cents / 100).toFixed(2) : '',
        currency: expense.currency ?? 'EUR',
        method: expense.method ?? '',
        paid_at: expense.paid_at ? expense.paid_at.substring(0, 16) : '',
        notes: expense.notes ?? '',
        receipt_url: expense.receipt_url ?? '',
      })
    } else {
      setEditingExpense(null)
      setForm(emptyForm)
    }
    setFormErrors({})
    setShowModal(true)
  }

  const handleCloseModal = () => {
    if (saving) return
    setShowModal(false)
    setEditingExpense(null)
  }

  const handleChange = (field: keyof ExpenseForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof ExpenseForm, string>> = {}

    if (!form.vendor.trim()) {
      errors.vendor = 'Ο προμηθευτής είναι υποχρεωτικός.'
    }

    const amountNumber = parseFloat(form.amount.replace(',', '.'))
    if (!form.amount.trim() || Number.isNaN(amountNumber) || amountNumber <= 0) {
      errors.amount = 'Το ποσό πρέπει να είναι θετικός αριθμός.'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setSaving(true)
    setError(null)

    const amountNumber = parseFloat(form.amount.replace(',', '.'))
    const amountCents = Math.round(amountNumber * 100)

    const payload = {
      vendor: form.vendor.trim(),
      category: form.category.trim() || null,
      amount_cents: amountCents,
      currency: form.currency.trim() || 'EUR',
      method: form.method.trim() || null,
      paid_at: form.paid_at ? new Date(form.paid_at).toISOString() : null,
      notes: form.notes.trim() || null,
      receipt_url: form.receipt_url.trim() || null,
      created_by: editingExpense?.created_by ?? user?.id ?? null,
    }

    if (editingExpense) {
      const { error } = await callEdge('update-expense', { id: editingExpense.id, ...payload })

      setSaving(false)

      if (error) {
        console.error('[Expenses] update expense error:', error)
        setError('Προέκυψε σφάλμα κατά την ενημέρωση του εξόδου.')
        return
      }

      setShowModal(false)
      setEditingExpense(null)
      await loadExpenses()
      return
    }

    const { error } = await callEdge('create-expense', payload)

    setSaving(false)

    if (error) {
      console.error('[Expenses] insert expense error:', error)
      setError('Προέκυψε σφάλμα κατά την αποθήκευση του εξόδου.')
      return
    }

    setShowModal(false)
    await loadExpenses()
  }

  const handleDeleteExpense = async (expense: Expense) => {
    const sure = window.confirm(
      `Είσαι σίγουρος ότι θέλεις να διαγράψεις το έξοδο από "${expense.vendor ?? ''}" ; Η ενέργεια δεν αναιρείται.`,
    )
    if (!sure) return

    setRowActionId(expense.id)
    setError(null)

    const { error } = await callEdge('delete-expense', { id: expense.id })

    setRowActionId(null)

    if (error) {
      console.error('[Expenses] delete expense error:', error)
      setError('Προέκυψε σφάλμα κατά τη διαγραφή του εξόδου.')
      return
    }

    setExpenses((prev) => prev.filter((e) => e.id !== expense.id))
  }

  const isRowBusy = (id: string) => rowActionId === id

  const totalAmountCents = useMemo(
    () => expenses.reduce((sum, e) => sum + (e.amount_cents ?? 0), 0),
    [expenses],
  )

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Έξοδα</strong>
              <div className="d-flex flex-column align-items-end">
                <div style={{ fontSize: '0.85rem' }}>
                  Σύνολο: <strong>{formatAmount(totalAmountCents)} €</strong>
                </div>
                <CButton color="primary" size="sm" className="mt-2" onClick={() => handleOpenModal()}>
                  + Προσθήκη εξόδου
                </CButton>
              </div>
            </CCardHeader>
            <CCardBody>
              {/* Filters */}
              <CRow className="mb-3 g-2">
                <CCol md={4}>
                  <CFormLabel>Αναζήτηση</CFormLabel>
                  <CFormInput
                    placeholder="Προμηθευτής, κατηγορία ή σημειώσεις..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </CCol>
                <CCol md={3}>
                  <CFormLabel>Κατηγορία</CFormLabel>
                  <CFormSelect
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value as any)}
                  >
                    <option value="all">Όλες</option>
                    {categoryOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={3}>
                  <CFormLabel>Μέθοδος πληρωμής</CFormLabel>
                  <CFormSelect
                    value={methodFilter}
                    onChange={(e) => setMethodFilter(e.target.value as any)}
                  >
                    <option value="all">Όλες</option>
                    {methodOptions.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={2}>
                  <CFormLabel>Ταξινόμηση</CFormLabel>
                  <CFormSelect
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as any)}
                  >
                    <option value="recent">Πιο πρόσφατα</option>
                    <option value="oldest">Πιο παλιά</option>
                    <option value="amount_desc">Ποσό ↓</option>
                    <option value="amount_asc">Ποσό ↑</option>
                  </CFormSelect>
                </CCol>
              </CRow>

              {error && (
                <div className="text-danger mb-2" style={{ fontSize: '0.875rem' }}>
                  {error}
                </div>
              )}

              {loading ? (
                <div className="text-center py-5">
                  <CSpinner />
                </div>
              ) : (
                <CTable hover responsive align="middle" className="mb-0">
                  <CTableHead>
                    <CTableRow>
                      <CTableDataCell>Προμηθευτής</CTableDataCell>
                      <CTableDataCell>Κατηγορία</CTableDataCell>
                      <CTableDataCell>Ποσό</CTableDataCell>
                      <CTableDataCell>Νόμισμα</CTableDataCell>
                      <CTableDataCell>Μέθοδος</CTableDataCell>
                      <CTableDataCell>Ημ/νία πληρωμής</CTableDataCell>
                      <CTableDataCell>Σημειώσεις</CTableDataCell>
                      <CTableDataCell>Ενέργειες</CTableDataCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {filteredExpenses.length === 0 ? (
                      <CTableRow>
                        <CTableDataCell colSpan={8} className="text-center py-4">
                          Δεν βρέθηκαν έξοδα.
                        </CTableDataCell>
                      </CTableRow>
                    ) : (
                      filteredExpenses.map((e) => (
                        <CTableRow key={e.id}>
                          <CTableDataCell>{e.vendor ?? '-'}</CTableDataCell>
                          <CTableDataCell>{e.category ?? '-'}</CTableDataCell>
                          <CTableDataCell>{formatAmount(e.amount_cents)} €</CTableDataCell>
                          <CTableDataCell>{e.currency ?? '-'}</CTableDataCell>
                          <CTableDataCell>{e.method ?? '-'}</CTableDataCell>
                          <CTableDataCell>
                            {e.paid_at
                              ? new Date(e.paid_at).toLocaleString('el-GR', {
                                  dateStyle: 'short',
                                  timeStyle: 'short',
                                })
                              : '-'}
                          </CTableDataCell>
                          <CTableDataCell>{e.notes ?? '-'}</CTableDataCell>
                          <CTableDataCell>
                            <div className="d-flex gap-2">
                              <CButton
                                size="sm"
                                color="info"
                                variant="outline"
                                onClick={() => handleOpenModal(e)}
                              >
                                Επεξεργασία
                              </CButton>
                              <CButton
                                size="sm"
                                variant="outline"
                                color="danger"
                                disabled={isRowBusy(e.id)}
                                onClick={() => handleDeleteExpense(e)}
                              >
                                {isRowBusy(e.id) ? <CSpinner size="sm" /> : 'Διαγραφή'}
                              </CButton>
                            </div>
                          </CTableDataCell>
                        </CTableRow>
                      ))
                    )}
                  </CTableBody>
                </CTable>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Modal create / edit */}
      <CModal visible={showModal} onClose={handleCloseModal}>
        <CModalHeader closeButton>
          <CModalTitle>{editingExpense ? 'Επεξεργασία εξόδου' : 'Προσθήκη εξόδου'}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CRow className="g-3">
              <CCol md={6}>
                <CFormLabel>Προμηθευτής *</CFormLabel>
                <CFormInput
                  value={form.vendor}
                  onChange={(e) => handleChange('vendor', e.target.value)}
                  invalid={!!formErrors.vendor}
                />
                {formErrors.vendor && (
                  <div className="invalid-feedback d-block">{formErrors.vendor}</div>
                )}
              </CCol>
              <CCol md={6}>
                <CFormLabel>Κατηγορία</CFormLabel>
                <CFormInput
                  value={form.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                />
              </CCol>
              <CCol md={4}>
                <CFormLabel>Ποσό *</CFormLabel>
                <CFormInput
                  type="text"
                  placeholder="π.χ. 49.90"
                  value={form.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  invalid={!!formErrors.amount}
                />
                {formErrors.amount && (
                  <div className="invalid-feedback d-block">{formErrors.amount}</div>
                )}
              </CCol>
              <CCol md={2}>
                <CFormLabel>Νόμισμα</CFormLabel>
                <CFormInput
                  value={form.currency}
                  onChange={(e) => handleChange('currency', e.target.value)}
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel>Μέθοδος πληρωμής</CFormLabel>
                <CFormInput
                  placeholder="π.χ. κάρτα, μετρητά..."
                  value={form.method}
                  onChange={(e) => handleChange('method', e.target.value)}
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel>Ημ/νία πληρωμής</CFormLabel>
                <CFormInput
                  type="datetime-local"
                  value={form.paid_at}
                  onChange={(e) => handleChange('paid_at', e.target.value)}
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel>Link απόδειξης</CFormLabel>
                <CFormInput
                  placeholder="URL απόδειξης / τιμολογίου"
                  value={form.receipt_url}
                  onChange={(e) => handleChange('receipt_url', e.target.value)}
                />
              </CCol>
              <CCol xs={12}>
                <CFormLabel>Σημειώσεις</CFormLabel>
                <CFormTextarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                />
              </CCol>
            </CRow>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={handleCloseModal} disabled={saving}>
            Ακύρωση
          </CButton>
          <CButton color="primary" onClick={handleSave} disabled={saving}>
            {saving ? <CSpinner size="sm" /> : editingExpense ? 'Ενημέρωση' : 'Αποθήκευση'}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default Expenses
