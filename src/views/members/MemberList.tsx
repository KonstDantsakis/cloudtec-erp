import React, { useEffect, useMemo, useState } from 'react'
import {
  CBadge,
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
  primary_class_id: string | null
  class?: {
    id: string
    title: string | null
    level: string | null
  } | null
}

type ClassOption = {
  id: string
  title: string
  level: string | null
  active: boolean
}

const statusOptions = ['Ενεργός', 'Ανενεργός']

const MemberList: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [classes, setClasses] = useState<ClassOption[]>([])

  const [loading, setLoading] = useState(true)
  const [rowBusyId, setRowBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'Όλες' | 'Ενεργός' | 'Ανενεργός'>('Όλες')

  // modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [status, setStatus] = useState('Ενεργός')
  const [source, setSource] = useState('')
  const [notes, setNotes] = useState('')
  const [primaryClassId, setPrimaryClassId] = useState<string>('')

  const resetForm = () => {
    setFullName('')
    setEmail('')
    setPhone('')
    setDateOfBirth('')
    setStatus('Ενεργός')
    setSource('')
    setNotes('')
    setPrimaryClassId('')
    setEditingCustomer(null)
  }

  const openAddModal = () => {
    resetForm()
    setModalOpen(true)
  }

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer)
    setFullName(customer.full_name ?? '')
    setEmail(customer.email ?? '')
    setPhone(customer.phone ?? '')
    setDateOfBirth(customer.date_of_birth ?? '')
    setStatus(customer.status ?? 'Ενεργός')
    setSource(customer.source ?? '')
    setNotes(customer.notes ?? '')
    setPrimaryClassId(customer.primary_class_id ?? '')
    setModalOpen(true)
  }

  // -------- LOAD DATA --------

  const loadClasses = async () => {
    const { data, error } = await supabase
      .from('classes')
      .select('id, title, level, active')
      .order('title', { ascending: true })

    if (error) {
      console.error('[MemberList] classes error:', error.message)
      throw new Error('Προέκυψε σφάλμα κατά τη φόρτωση των τμημάτων.')
    }

    setClasses(
      (data ?? []).map((c: any) => ({
        id: c.id as string,
        title: c.title as string,
        level: (c.level as string) ?? null,
        active: Boolean(c.active),
      })),
    )
  }

  const loadCustomers = async () => {
    const { data, error } = await supabase
      .from('customers')
      .select(
        `
        id,
        full_name,
        email,
        phone,
        date_of_birth,
        status,
        source,
        notes,
        primary_class_id,
        class:primary_class_id (
          id,
          title,
          level
        )
      `,
      )
      .order('full_name', { ascending: true })

    if (error) {
      console.error('[MemberList] customers error:', error.message)
      throw new Error('Προέκυψε σφάλμα κατά τη φόρτωση μελών.')
    }

    setCustomers((data ?? []) as any as Customer[])
  }

  const loadAll = async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([loadClasses(), loadCustomers()])
    } catch (err: any) {
      setError(err?.message ?? 'Προέκυψε σφάλμα κατά τη φόρτωση των δεδομένων.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAll()
  }, [])

  // -------- FILTERED LIST --------

  const filteredCustomers = useMemo(() => {
    let list = [...customers]

    if (statusFilter !== 'Όλες') {
      list = list.filter((c) => c.status === statusFilter)
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((c) => {
        const name = c.full_name ?? ''
        const email = c.email ?? ''
        const phone = c.phone ?? ''
        const classTitle = c.class?.title ?? ''
        return (
          name.toLowerCase().includes(q) ||
          email.toLowerCase().includes(q) ||
          phone.toLowerCase().includes(q) ||
          classTitle.toLowerCase().includes(q)
        )
      })
    }

    return list
  }, [customers, search, statusFilter])

  // -------- SAVE (CREATE / UPDATE) --------

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) {
      setError('Το ονοματεπώνυμο είναι υποχρεωτικό.')
      return
    }

    setError(null)
    setRowBusyId(editingCustomer?.id ?? 'new')

    const payload: any = {
      full_name: fullName.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      date_of_birth: dateOfBirth || null,
      status,
      source: source.trim() || null,
      notes: notes.trim() || null,
      primary_class_id: primaryClassId || null,
    }

    try {
      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update(payload)
          .eq('id', editingCustomer.id)

        if (error) {
          console.error('[MemberList] update error:', error.message)
          throw new Error('Προέκυψε σφάλμα κατά την ενημέρωση μέλους.')
        }
      } else {
        const { error } = await supabase.from('customers').insert([payload])

        if (error) {
          console.error('[MemberList] insert error:', error.message)
          throw new Error('Προέκυψε σφάλμα κατά την προσθήκη μέλους.')
        }
      }

      setModalOpen(false)
      resetForm()
      await loadCustomers()
    } catch (err: any) {
      setError(err?.message ?? 'Προέκυψε σφάλμα κατά την αποθήκευση.')
    } finally {
      setRowBusyId(null)
    }
  }

  // -------- DELETE / STATUS --------

  const handleDelete = async (customer: Customer) => {
    if (!window.confirm(`Να διαγραφεί οριστικά το μέλος "${customer.full_name}" ;`)) return

    setRowBusyId(customer.id)
    setError(null)
    try {
      const { error } = await supabase.from('customers').delete().eq('id', customer.id)
      if (error) {
        console.error('[MemberList] delete error:', error.message)
        throw new Error('Προέκυψε σφάλμα κατά τη διαγραφή.')
      }
      await loadCustomers()
    } catch (err: any) {
      setError(err?.message ?? 'Προέκυψε σφάλμα κατά τη διαγραφή.')
    } finally {
      setRowBusyId(null)
    }
  }

  const handleToggleActive = async (customer: Customer) => {
    const nextStatus = customer.status === 'Ενεργός' ? 'Ανενεργός' : 'Ενεργός'

    setRowBusyId(customer.id)
    setError(null)
    try {
      const { error } = await supabase
        .from('customers')
        .update({ status: nextStatus })
        .eq('id', customer.id)

      if (error) {
        console.error('[MemberList] status update error:', error.message)
        throw new Error('Προέκυψε σφάλμα κατά την ενημέρωση κατάστασης.')
      }

      await loadCustomers()
    } catch (err: any) {
      setError(err?.message ?? 'Προέκυψε σφάλμα κατά την ενημέρωση κατάστασης.')
    } finally {
      setRowBusyId(null)
    }
  }

  const handleDeleteAll = async () => {
    if (
      !window.confirm(
        'ΠΡΟΕΙΔΟΠΟΙΗΣΗ: Θα διαγραφούν ΟΛΑ τα μέλη. Η ενέργεια δεν μπορεί να αναιρεθεί. Συνέχεια;',
      )
    ) {
      return
    }

    setRowBusyId('all')
    setError(null)

    try {
      const { error } = await supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      // το neq είναι για να περάσει από τον supabase client (ουσιαστικά διαγράφει όλα)

      if (error) {
        console.error('[MemberList] delete all error:', error.message)
        throw new Error('Προέκυψε σφάλμα κατά τη μαζική διαγραφή.')
      }

      await loadCustomers()
    } catch (err: any) {
      setError(err?.message ?? 'Προέκυψε σφάλμα κατά τη μαζική διαγραφή.')
    } finally {
      setRowBusyId(null)
    }
  }

  const isRowBusy = (id: string) => rowBusyId === id

  // -------- RENDER --------

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <div>
                <strong>Λίστα Μελών</strong>
                <div className="small text-muted">
                  Σύνολο: {customers.length} μέλη
                </div>
              </div>

              <div className="d-flex gap-2">
                <CButton color="danger" variant="outline" size="sm" onClick={handleDeleteAll}>
                  Διαγραφή όλων
                </CButton>
                <CButton color="primary" size="sm" onClick={openAddModal}>
                  + Προσθήκη μέλους
                </CButton>
              </div>
            </CCardHeader>

            <CCardBody>
              {error && (
                <div className="text-danger mb-2" style={{ fontSize: '0.875rem' }}>
                  {error}
                </div>
              )}

              <CRow className="mb-3 g-2">
                <CCol md={6}>
                  <CFormInput
                    placeholder="Όνομα, email, τηλέφωνο ή τμήμα..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                  >
                    <option value="Όλες">Όλες οι καταστάσεις</option>
                    <option value="Ενεργός">Ενεργά μέλη</option>
                    <option value="Ανενεργός">Ανενεργά μέλη</option>
                  </CFormSelect>
                </CCol>
              </CRow>

              {loading ? (
                <div className="text-center py-4">
                  <CSpinner />
                </div>
              ) : (
                <CTable hover responsive align="middle" className="mb-0">
                  <CTableHead>
                    <CTableRow>
                      <CTableDataCell>Μέλος</CTableDataCell>
                      <CTableDataCell>Επικοινωνία</CTableDataCell>
                      <CTableDataCell>Τμήμα</CTableDataCell>
                      <CTableDataCell>Κατάσταση</CTableDataCell>
                      <CTableDataCell>Σημειώσεις</CTableDataCell>
                      <CTableDataCell className="text-end">Ενέργειες</CTableDataCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {filteredCustomers.length === 0 ? (
                      <CTableRow>
                        <CTableDataCell colSpan={6} className="text-center py-4">
                          Δεν βρέθηκαν μέλη.
                        </CTableDataCell>
                      </CTableRow>
                    ) : (
                      filteredCustomers.map((c) => (
                        <CTableRow key={c.id}>
                          <CTableDataCell className="fw-semibold">
                            {c.full_name || '-'}
                            <div className="small text-muted">
                              Ημ/νία γέννησης:{' '}
                              {c.date_of_birth
                                ? new Date(c.date_of_birth).toLocaleDateString('el-GR')
                                : '-'}
                            </div>
                          </CTableDataCell>
                          <CTableDataCell>
                            <div className="small text-muted">
                              {c.email || '-'}
                              {c.phone ? ` · ${c.phone}` : ''}
                            </div>
                          </CTableDataCell>
                          <CTableDataCell>
                            {c.class?.title ? (
                              <>
                                {c.class.title}
                                {c.class.level ? (
                                  <span className="text-muted"> — {c.class.level}</span>
                                ) : null}
                              </>
                            ) : (
                              <span className="text-muted small">Χωρίς τμήμα</span>
                            )}
                          </CTableDataCell>
                          <CTableDataCell>
                            {c.status === 'Ενεργός' ? (
                              <CBadge color="success">Ενεργός</CBadge>
                            ) : (
                              <CBadge color="secondary">
                                {c.status || 'Άγνωστο'}
                              </CBadge>
                            )}
                          </CTableDataCell>
                          <CTableDataCell>
                            <div className="small text-muted">
                              {c.source && <div>Πηγή: {c.source}</div>}
                              {c.notes}
                            </div>
                          </CTableDataCell>
                          <CTableDataCell className="text-end">
                            <div className="d-flex justify-content-end gap-2">
                              <CButton
                                size="sm"
                                color="info"
                                variant="outline"
                                disabled={isRowBusy(c.id)}
                                onClick={() => openEditModal(c)}
                              >
                                Επεξεργασία
                              </CButton>
                              <CButton
                                size="sm"
                                color={c.status === 'Ενεργός' ? 'warning' : 'success'}
                                variant="outline"
                                disabled={isRowBusy(c.id)}
                                onClick={() => handleToggleActive(c)}
                              >
                                {c.status === 'Ενεργός' ? 'Απενεργοποίηση' : 'Ενεργοποίηση'}
                              </CButton>
                              <CButton
                                size="sm"
                                color="danger"
                                variant="outline"
                                disabled={isRowBusy(c.id)}
                                onClick={() => handleDelete(c)}
                              >
                                Διαγραφή
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

      {/* Modal add / edit */}
      <CModal visible={modalOpen} onClose={() => setModalOpen(false)} size="lg">
        <CForm onSubmit={handleSave}>
          <CModalHeader>
            <CModalTitle>{editingCustomer ? 'Επεξεργασία μέλους' : 'Προσθήκη μέλους'}</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <CRow className="g-3">
              <CCol md={6}>
                <CFormLabel>Ονοματεπώνυμο *</CFormLabel>
                <CFormInput
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel>Email</CFormLabel>
                <CFormInput
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </CCol>

              <CCol md={4}>
                <CFormLabel>Τηλέφωνο</CFormLabel>
                <CFormInput value={phone} onChange={(e) => setPhone(e.target.value)} />
              </CCol>
              <CCol md={4}>
                <CFormLabel>Ημ/νία γέννησης</CFormLabel>
                <CFormInput
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </CCol>
              <CCol md={4}>
                <CFormLabel>Κατάσταση</CFormLabel>
                <CFormSelect value={status} onChange={(e) => setStatus(e.target.value)}>
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={6}>
                <CFormLabel>Τμήμα (προαιρετικό)</CFormLabel>
                <CFormSelect
                  value={primaryClassId}
                  onChange={(e) => setPrimaryClassId(e.target.value)}
                >
                  <option value="">Χωρίς τμήμα</option>
                  {classes.map((cl) => (
                    <option key={cl.id} value={cl.id}>
                      {cl.title}
                      {cl.level ? ` — ${cl.level}` : ''}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={6}>
                <CFormLabel>Πηγή (π.χ. Facebook, referral...)</CFormLabel>
                <CFormInput value={source} onChange={(e) => setSource(e.target.value)} />
              </CCol>

             <CCol xs={12}>
              <CFormLabel>Σημειώσεις</CFormLabel>
              <CFormTextarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </CCol>
            </CRow>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" variant="ghost" onClick={() => setModalOpen(false)}>
              Ακύρωση
            </CButton>
            <CButton color="primary" type="submit" disabled={!!rowBusyId}>
              Αποθήκευση
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>
    </>
  )
}

export default MemberList
