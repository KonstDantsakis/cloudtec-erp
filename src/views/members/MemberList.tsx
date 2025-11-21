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
import { supabase } from '@/lib/supabaseClient'

type Customer = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  date_of_birth: string | null
  status: string | null
  source: string | null
  notes: string | null
  created_at: string | null
}

type CustomerForm = {
  full_name: string
  email: string
  phone: string
  date_of_birth: string
  status: string
  source: string
  notes: string
}

const emptyForm: CustomerForm = {
  full_name: '',
  email: '',
  phone: '',
  date_of_birth: '',
  status: 'active', // default = ενεργός
  source: '',
  notes: '',
}

// dev: local edge function, prod: supabase hosted
const FUNCTIONS_BASE_URL = import.meta.env.DEV
  ? 'http://localhost:54321/functions/v1'
  : `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

const statusLabel = (s: string | null) => {
  if (s === 'active') return 'Ενεργός'
  if (s === 'inactive') return 'Ανενεργός'
  return s ?? '-'
}

const MemberList: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // filters / sort
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | string>('all')
  const [sortOption, setSortOption] = useState<'recent' | 'oldest' | 'name_asc'>('recent')

  // modal + form
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<CustomerForm>(emptyForm)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CustomerForm, string>>>({})

  const [rowActionId, setRowActionId] = useState<string | null>(null) // για delete/toggle state

  const loadCustomers = async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[MemberList] Error loading customers:', error.message)
      setError('Προέκυψε σφάλμα κατά τη φόρτωση των μελών.')
      setCustomers([])
    } else {
      setCustomers((data ?? []) as Customer[])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  // unique statuses from data for filter
  const statusOptions = useMemo(() => {
    const set = new Set<string>()
    customers.forEach((c) => {
      if (c.status) set.add(c.status)
    })
    return Array.from(set).sort()
  }, [customers])

  const filteredCustomers = useMemo(() => {
    let list = [...customers]

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((c) => {
        return (
          (c.full_name ?? '').toLowerCase().includes(q) ||
          (c.email ?? '').toLowerCase().includes(q) ||
          (c.phone ?? '').toLowerCase().includes(q)
        )
      })
    }

    if (statusFilter !== 'all') {
      list = list.filter((c) => c.status === statusFilter)
    }

    list.sort((a, b) => {
      if (sortOption === 'name_asc') {
        return (a.full_name ?? '').localeCompare(b.full_name ?? '')
      }

      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0

      if (sortOption === 'recent') {
        return dateB - dateA // newer first
      }
      if (sortOption === 'oldest') {
        return dateA - dateB
      }
      return 0
    })

    return list
  }, [customers, search, statusFilter, sortOption])

  const handleOpenModal = () => {
    setForm(emptyForm)
    setFormErrors({})
    setShowModal(true)
  }

  const handleCloseModal = () => {
    if (saving) return
    setShowModal(false)
  }

  const handleChange = (field: keyof CustomerForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof CustomerForm, string>> = {}

    if (!form.full_name.trim()) {
      errors.full_name = 'Το ονοματεπώνυμο είναι υποχρεωτικό.'
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Μη έγκυρο email.'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setSaving(true)
    setError(null)

    const payload = {
      full_name: form.full_name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      date_of_birth: form.date_of_birth || null,
      status: form.status || 'active',
      source: form.source.trim() || null,
      notes: form.notes.trim() || null,
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()

    try {
      const res = await fetch(`${FUNCTIONS_BASE_URL}/create-member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (!res.ok) {
        console.error('[MemberList] create-member error:', json.error)
        setError(json.error || 'Προέκυψε σφάλμα κατά την αποθήκευση του μέλους.')
        setSaving(false)
        return
      }

      setShowModal(false)
      await loadCustomers()
    } catch (e) {
      console.error('[MemberList] network error:', e)
      setError('Προέκυψε σφάλμα δικτύου.')
    } finally {
      setSaving(false)
    }
  }

  // ---- status toggle (active / inactive) ----
  const handleToggleStatus = async (customer: Customer) => {
    const newStatus = customer.status === 'inactive' ? 'active' : 'inactive'
    setRowActionId(customer.id)
    setError(null)

    const { error } = await supabase
      .from('customers')
      .update({ status: newStatus })
      .eq('id', customer.id)

    setRowActionId(null)

    if (error) {
      console.error('[MemberList] toggle status error:', error.message)
      setError('Προέκυψε σφάλμα κατά την αλλαγή της κατάστασης.')
      return
    }

    setCustomers((prev) =>
      prev.map((c) => (c.id === customer.id ? { ...c, status: newStatus } : c)),
    )
  }

  // ---- delete single customer ----
  const handleDeleteCustomer = async (customer: Customer) => {
    const sure = window.confirm(
      `Είσαι σίγουρος ότι θέλεις να διαγράψεις το μέλος "${customer.full_name ?? ''}" ; Η ενέργεια δεν αναιρείται.`,
    )
    if (!sure) return

    setRowActionId(customer.id)
    setError(null)

    const { error } = await supabase.from('customers').delete().eq('id', customer.id)

    setRowActionId(null)

    if (error) {
      console.error('[MemberList] delete customer error:', error.message)
      setError('Προέκυψε σφάλμα κατά τη διαγραφή του μέλους.')
      return
    }

    setCustomers((prev) => prev.filter((c) => c.id !== customer.id))
  }

  // ---- delete ALL customers ----
  const handleDeleteAll = async () => {
    if (customers.length === 0) return

    const sure = window.confirm(
      'ΠΡΟΣΟΧΗ: Θα διαγραφούν ΟΛΑ τα μέλη (customers). Η ενέργεια δεν αναιρείται. Θέλεις σίγουρα να συνεχίσεις;',
    )
    if (!sure) return

    setLoading(true)
    setError(null)

    const { error } = await supabase.from('customers').delete().not('id', 'is', null)

    if (error) {
      console.error('[MemberList] delete all error:', error.message)
      setError('Προέκυψε σφάλμα κατά τη μαζική διαγραφή μελών.')
    } else {
      setCustomers([])
    }

    setLoading(false)
  }

  const isRowBusy = (id: string) => rowActionId === id

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Λίστα Μελών</strong>
              <div className="d-flex gap-2">
                <CButton
                  color="danger"
                  variant="outline"
                  size="sm"
                  disabled={customers.length === 0 || loading}
                  onClick={handleDeleteAll}
                >
                  Διαγραφή όλων
                </CButton>
                <CButton color="primary" size="sm" onClick={handleOpenModal}>
                  + Προσθήκη μέλους
                </CButton>
              </div>
            </CCardHeader>
            <CCardBody>
              {/* Filters */}
              <CRow className="mb-3 g-2">
                <CCol md={4}>
                  <CFormLabel>Αναζήτηση</CFormLabel>
                  <CFormInput
                    placeholder="Όνομα, email ή τηλέφωνο..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </CCol>
                <CCol md={3}>
                  <CFormLabel>Κατάσταση</CFormLabel>
                  <CFormSelect
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                  >
                    <option value="all">Όλες</option>
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {statusLabel(s)}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={3}>
                  <CFormLabel>Ταξινόμηση</CFormLabel>
                  <CFormSelect
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as any)}
                  >
                    <option value="recent">Πιο πρόσφατα</option>
                    <option value="oldest">Πιο παλιά</option>
                    <option value="name_asc">Αλφαβητικά (όνομα)</option>
                  </CFormSelect>
                </CCol>
                <CCol
                  md={2}
                  className="d-flex align-items-end justify-content-end mt-3 mt-md-0"
                >
                  <CButton color="secondary" variant="outline" size="sm" onClick={loadCustomers}>
                    Ανανέωση
                  </CButton>
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
                      <CTableDataCell>Όνομα</CTableDataCell>
                      <CTableDataCell>Email</CTableDataCell>
                      <CTableDataCell>Τηλέφωνο</CTableDataCell>
                      <CTableDataCell>Κατάσταση</CTableDataCell>
                      <CTableDataCell>Πηγή</CTableDataCell>
                      <CTableDataCell>Ημ/νία δημιουργίας</CTableDataCell>
                      <CTableDataCell>Ενέργειες</CTableDataCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {filteredCustomers.length === 0 ? (
                      <CTableRow>
                        <CTableDataCell colSpan={7} className="text-center py-4">
                          Δεν βρέθηκαν μέλη.
                        </CTableDataCell>
                      </CTableRow>
                    ) : (
                      filteredCustomers.map((c) => (
                        <CTableRow key={c.id}>
                          <CTableDataCell>{c.full_name ?? '-'}</CTableDataCell>
                          <CTableDataCell>{c.email ?? '-'}</CTableDataCell>
                          <CTableDataCell>{c.phone ?? '-'}</CTableDataCell>
                          <CTableDataCell>{statusLabel(c.status)}</CTableDataCell>
                          <CTableDataCell>{c.source ?? '-'}</CTableDataCell>
                          <CTableDataCell>
                            {c.created_at
                              ? new Date(c.created_at).toLocaleDateString('el-GR')
                              : '-'}
                          </CTableDataCell>
                          <CTableDataCell>
                            <div className="d-flex gap-2">
                              <CButton
                                size="sm"
                                variant="outline"
                                color={c.status === 'inactive' ? 'success' : 'secondary'}
                                disabled={isRowBusy(c.id)}
                                onClick={() => handleToggleStatus(c)}
                              >
                                {isRowBusy(c.id) ? (
                                  <CSpinner size="sm" />
                                ) : c.status === 'inactive' ? (
                                  'Ενεργοποίηση'
                                ) : (
                                  'Απενεργοποίηση'
                                )}
                              </CButton>
                              <CButton
                                size="sm"
                                variant="outline"
                                color="danger"
                                disabled={isRowBusy(c.id)}
                                onClick={() => handleDeleteCustomer(c)}
                              >
                                {isRowBusy(c.id) ? <CSpinner size="sm" /> : 'Διαγραφή'}
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

      {/* Modal Προσθήκης */}
      <CModal visible={showModal} onClose={handleCloseModal}>
        <CModalHeader closeButton>
          <CModalTitle>Προσθήκη μέλους</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CRow className="g-3">
              <CCol md={6}>
                <CFormLabel>Ονοματεπώνυμο *</CFormLabel>
                <CFormInput
                  value={form.full_name}
                  onChange={(e) => handleChange('full_name', e.target.value)}
                  invalid={!!formErrors.full_name}
                />
                {formErrors.full_name && (
                  <div className="invalid-feedback d-block">{formErrors.full_name}</div>
                )}
              </CCol>
              <CCol md={6}>
                <CFormLabel>Email</CFormLabel>
                <CFormInput
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  invalid={!!formErrors.email}
                />
                {formErrors.email && (
                  <div className="invalid-feedback d-block">{formErrors.email}</div>
                )}
              </CCol>
              <CCol md={6}>
                <CFormLabel>Τηλέφωνο</CFormLabel>
                <CFormInput
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel>Ημερ. γέννησης</CFormLabel>
                <CFormInput
                  type="date"
                  value={form.date_of_birth}
                  onChange={(e) => handleChange('date_of_birth', e.target.value)}
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel>Κατάσταση</CFormLabel>
                <CFormSelect
                  value={form.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                >
                  <option value="active">Ενεργός</option>
                  <option value="inactive">Ανενεργός</option>
                </CFormSelect>
              </CCol>
              <CCol md={6}>
                <CFormLabel>Πηγή</CFormLabel>
                <CFormInput
                  placeholder="π.χ. Facebook, referral..."
                  value={form.source}
                  onChange={(e) => handleChange('source', e.target.value)}
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
            {saving ? <CSpinner size="sm" /> : 'Αποθήκευση'}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default MemberList
