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
import { useAuth } from '@/context/AuthContext'

type AnnouncementRow = {
  id: string
  title: string
  message: string
  class_id: string | null
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string | null
  classes?: { id: string; title: string | null } | null
}

type AnnouncementForm = {
  title: string
  message: string
  class_id: string
  is_active: string // 'true' | 'false'
}

type Option = { id: string; label: string }

const emptyForm: AnnouncementForm = {
  title: '',
  message: '',
  class_id: '',
  is_active: 'true',
}

const Announcements: React.FC = () => {
  const { profile } = useAuth()

  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([])
  const [classes, setClasses] = useState<Option[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<AnnouncementForm>(emptyForm)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof AnnouncementForm, string>>>({})
  const [editingItem, setEditingItem] = useState<AnnouncementRow | null>(null)

  const [rowActionId, setRowActionId] = useState<string | null>(null)

  // -------- LOAD DATA --------

  const loadAnnouncements = async () => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('announcements')
      .select(
        `
        id,
        title,
        message,
        class_id,
        is_active,
        created_by,
        created_at,
        updated_at,
        classes ( id, title )
      `,
      )
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Announcements] load error:', error.message)
      setError('Προέκυψε σφάλμα κατά τη φόρτωση των ανακοινώσεων.')
      setAnnouncements([])
    } else {
      setAnnouncements((data ?? []) as unknown as AnnouncementRow[])
    }

    setLoading(false)
  }

  const loadClasses = async () => {
    const { data, error } = await supabase.from('classes').select('id, title').order('title')

    if (error) {
      console.error('[Announcements] classes load error:', error.message)
      setClasses([])
      return
    }

    setClasses(
      (data ?? []).map((c) => ({
        id: (c as any).id,
        label: (c as any).title || '(Χωρίς τίτλο)',
      })),
    )
  }

  useEffect(() => {
    loadAnnouncements()
    loadClasses()
  }, [])

  // -------- FILTERED LIST --------

  const filteredAnnouncements = useMemo(() => {
    let list = [...announcements]

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((a) => {
        const title = a.title ?? ''
        const msg = a.message ?? ''
        const classTitle = a.classes?.title ?? ''
        return (
          title.toLowerCase().includes(q) ||
          msg.toLowerCase().includes(q) ||
          classTitle.toLowerCase().includes(q)
        )
      })
    }

    if (statusFilter === 'active') {
      list = list.filter((a) => a.is_active)
    } else if (statusFilter === 'inactive') {
      list = list.filter((a) => !a.is_active)
    }

    // created_at είναι ήδη ordered desc από το query,
    // αλλά το κρατάμε εδώ σε περίπτωση που αλλάξει κάτι
    list.sort((a, b) => {
      const da = new Date(a.created_at).getTime()
      const db = new Date(b.created_at).getTime()
      return db - da
    })

    return list
  }, [announcements, search, statusFilter])

  // -------- MODAL HELPERS --------

  const handleOpenModal = (item?: AnnouncementRow) => {
    if (item) {
      setEditingItem(item)
      setForm({
        title: item.title,
        message: item.message,
        class_id: item.class_id ?? '',
        is_active: item.is_active ? 'true' : 'false',
      })
    } else {
      setEditingItem(null)
      setForm(emptyForm)
    }
    setFormErrors({})
    setShowModal(true)
  }

  const handleCloseModal = () => {
    if (saving) return
    setShowModal(false)
    setEditingItem(null)
  }

  const handleChange = (field: keyof AnnouncementForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof AnnouncementForm, string>> = {}

    if (!form.title.trim()) {
      errors.title = 'Ο τίτλος είναι υποχρεωτικός.'
    }
    if (!form.message.trim()) {
      errors.message = 'Το μήνυμα είναι υποχρεωτικό.'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // -------- SAVE (CREATE / UPDATE) --------

  const handleSave = async () => {
    if (!validateForm()) return

    setSaving(true)
    setError(null)

    const payload = {
      title: form.title.trim(),
      message: form.message.trim(),
      class_id: form.class_id || null,
      is_active: form.is_active === 'true',
      created_by: editingItem?.created_by ?? profile?.id ?? null,
      // updated_at στο Supabase μπορείς να έχεις trigger, αλλά εδώ απλώς αφήνουμε το default
    }

    if (editingItem) {
      const { error } = await supabase
        .from('announcements')
        .update({
          ...payload,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingItem.id)

      setSaving(false)

      if (error) {
        console.error('[Announcements] update error:', error.message)
        setError('Προέκυψε σφάλμα κατά την ενημέρωση της ανακοίνωσης.')
        return
      }

      setShowModal(false)
      setEditingItem(null)
      await loadAnnouncements()
      return
    }

    const { error } = await supabase.from('announcements').insert([
      {
        ...payload,
        created_at: new Date().toISOString(),
      },
    ])

    setSaving(false)

    if (error) {
      console.error('[Announcements] insert error:', error.message)
      setError('Προέκυψε σφάλμα κατά την αποθήκευση της ανακοίνωσης.')
      return
    }

    setShowModal(false)
    await loadAnnouncements()
  }

  // -------- DELETE --------

  const handleDelete = async (item: AnnouncementRow) => {
    const sure = window.confirm(
      `Είσαι σίγουρος ότι θέλεις να διαγράψεις την ανακοίνωση "${item.title}" ; Η ενέργεια δεν αναιρείται.`,
    )
    if (!sure) return

    setRowActionId(item.id)
    setError(null)

    const { error } = await supabase.from('announcements').delete().eq('id', item.id)

    setRowActionId(null)

    if (error) {
      console.error('[Announcements] delete error:', error.message)
      setError('Προέκυψε σφάλμα κατά τη διαγραφή της ανακοίνωσης.')
      return
    }

    setAnnouncements((prev) => prev.filter((a) => a.id !== item.id))
  }

  const isRowBusy = (id: string) => rowActionId === id

  // -------- RENDER --------

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Ανακοινώσεις</strong>
              <CButton color="primary" size="sm" onClick={() => handleOpenModal()}>
                + Προσθήκη ανακοίνωσης
              </CButton>
            </CCardHeader>

            <CCardBody>
              {/* Filters */}
              <CRow className="mb-3 g-2">
                <CCol md={5}>
                  <CFormLabel>Αναζήτηση</CFormLabel>
                  <CFormInput
                    placeholder="Τίτλος, μήνυμα ή τμήμα..."
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
                    <option value="active">Μόνο ενεργές</option>
                    <option value="inactive">Μόνο ανενεργές</option>
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
                      <CTableDataCell>Τίτλος</CTableDataCell>
                      <CTableDataCell>Μήνυμα</CTableDataCell>
                      <CTableDataCell>Τμήμα</CTableDataCell>
                      <CTableDataCell>Ημ/νία δημιουργίας</CTableDataCell>
                      <CTableDataCell>Κατάσταση</CTableDataCell>
                      <CTableDataCell>Ενέργειες</CTableDataCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {filteredAnnouncements.length === 0 ? (
                      <CTableRow>
                        <CTableDataCell colSpan={6} className="text-center py-4">
                          Δεν βρέθηκαν ανακοινώσεις.
                        </CTableDataCell>
                      </CTableRow>
                    ) : (
                      filteredAnnouncements.map((a) => (
                        <CTableRow key={a.id}>
                          <CTableDataCell className="fw-semibold">
                            {a.title}
                          </CTableDataCell>
                          <CTableDataCell style={{ maxWidth: 420 }}>
                            <div
                              style={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                              title={a.message}
                            >
                              {a.message}
                            </div>
                          </CTableDataCell>
                          <CTableDataCell>{a.classes?.title ?? 'Όλα τα τμήματα'}</CTableDataCell>
                          <CTableDataCell>
                            {new Date(a.created_at).toLocaleString('el-GR', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </CTableDataCell>
                          <CTableDataCell>
                            {a.is_active ? (
                              <span className="badge bg-success">Ενεργή</span>
                            ) : (
                              <span className="badge bg-secondary">Ανενεργή</span>
                            )}
                          </CTableDataCell>
                          <CTableDataCell>
                            <div className="d-flex gap-2">
                              <CButton
                                size="sm"
                                variant="outline"
                                color="info"
                                onClick={() => handleOpenModal(a)}
                              >
                                Επεξεργασία
                              </CButton>
                              <CButton
                                size="sm"
                                variant="outline"
                                color="danger"
                                disabled={isRowBusy(a.id)}
                                onClick={() => handleDelete(a)}
                              >
                                {isRowBusy(a.id) ? <CSpinner size="sm" /> : 'Διαγραφή'}
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
          <CModalTitle>
            {editingItem ? 'Επεξεργασία ανακοίνωσης' : 'Προσθήκη ανακοίνωσης'}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CRow className="g-3">
              <CCol xs={12}>
                <CFormLabel>Τίτλος *</CFormLabel>
                <CFormInput
                  value={form.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  invalid={!!formErrors.title}
                  placeholder="π.χ. Ακύρωση μαθήματος Τετάρτης"
                />
                {formErrors.title && (
                  <div className="invalid-feedback d-block">{formErrors.title}</div>
                )}
              </CCol>

              <CCol xs={12}>
                <CFormLabel>Μήνυμα *</CFormLabel>
                <CFormTextarea
                  rows={4}
                  value={form.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  invalid={!!formErrors.message}
                  placeholder="π.χ. Σήμερα 25/11 δεν θα πραγματοποιηθεί το μάθημα των ενηλίκων λόγω..."
                />
                {formErrors.message && (
                  <div className="invalid-feedback d-block">{formErrors.message}</div>
                )}
              </CCol>

              <CCol md={6}>
                <CFormLabel>Τμήμα</CFormLabel>
                <CFormSelect
                  value={form.class_id}
                  onChange={(e) => handleChange('class_id', e.target.value)}
                >
                  <option value="">Όλα τα τμήματα</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>

              <CCol md={6}>
                <CFormLabel>Κατάσταση</CFormLabel>
                <CFormSelect
                  value={form.is_active}
                  onChange={(e) => handleChange('is_active', e.target.value)}
                >
                  <option value="true">Ενεργή</option>
                  <option value="false">Ανενεργή</option>
                </CFormSelect>
              </CCol>
            </CRow>
          </CForm>
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" onClick={handleCloseModal} disabled={saving}>
            Ακύρωση
          </CButton>
          <CButton color="primary" onClick={handleSave} disabled={saving}>
            {saving ? <CSpinner size="sm" /> : editingItem ? 'Ενημέρωση' : 'Αποθήκευση'}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default Announcements
