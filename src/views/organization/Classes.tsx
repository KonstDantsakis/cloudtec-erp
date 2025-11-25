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

type ClassRow = {
  id: string
  title: string | null
  description: string | null
  level: string | null
  capacity: number | null
  price_cents: number | null
  day_of_week: number | null
  start_time: string | null
  end_time: string | null
  active: boolean | null
  created_at: string | null
}

type ClassForm = {
  title: string
  description: string
  level: string
  capacity: string
  price: string
  day_of_week: string
  start_time: string
  end_time: string
  active: string // 'true' | 'false'
}

const emptyForm: ClassForm = {
  title: '',
  description: '',
  level: '',
  capacity: '',
  price: '',
  day_of_week: '',
  start_time: '',
  end_time: '',
  active: 'true',
}

const DAY_OPTIONS: { value: string; label: string }[] = [
  { value: '1', label: 'Δευτέρα' },
  { value: '2', label: 'Τρίτη' },
  { value: '3', label: 'Τετάρτη' },
  { value: '4', label: 'Πέμπτη' },
  { value: '5', label: 'Παρασκευή' },
  { value: '6', label: 'Σάββατο' },
  { value: '7', label: 'Κυριακή' },
]

const dayLabel = (n: number | null) => {
  const opt = DAY_OPTIONS.find((d) => Number(d.value) === n)
  return opt?.label ?? '-'
}

const formatTime = (t: string | null) => {
  if (!t) return '-'
  // Supabase time comes as "HH:MM:SS"
  return t.slice(0, 5)
}

const formatPrice = (cents: number | null) => {
  if (cents == null) return '-'
  return (cents / 100).toFixed(2)
}

const Classes: React.FC = () => {
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // filters
  const [search, setSearch] = useState('')
  const [dayFilter, setDayFilter] = useState<'all' | string>('all')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')

  // modal + form
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<ClassForm>(emptyForm)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ClassForm, string>>>({})
  const [editingClass, setEditingClass] = useState<ClassRow | null>(null)

  // row actions
  const [rowActionId, setRowActionId] = useState<string | null>(null)

  const loadClasses = async () => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) {
      console.error('[Classes] Error loading classes:', error.message)
      setError('Προέκυψε σφάλμα κατά τη φόρτωση των τμημάτων.')
      setClasses([])
    } else {
      setClasses((data ?? []) as ClassRow[])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadClasses()
  }, [])

  const filteredClasses = useMemo(() => {
    let list = [...classes]

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((c) => {
        return (
          (c.title ?? '').toLowerCase().includes(q) ||
          (c.level ?? '').toLowerCase().includes(q) ||
          (c.description ?? '').toLowerCase().includes(q)
        )
      })
    }

    if (dayFilter !== 'all') {
      list = list.filter((c) => c.day_of_week === Number(dayFilter))
    }

    if (activeFilter !== 'all') {
      const wantActive = activeFilter === 'active'
      list = list.filter((c) => Boolean(c.active) === wantActive)
    }

    return list
  }, [classes, search, dayFilter, activeFilter])

  const handleOpenModal = (cls?: ClassRow) => {
    if (cls) {
      setEditingClass(cls)
      setForm({
        title: cls.title ?? '',
        description: cls.description ?? '',
        level: cls.level ?? '',
        capacity: cls.capacity != null ? String(cls.capacity) : '',
        price: cls.price_cents != null ? (cls.price_cents / 100).toFixed(2) : '',
        day_of_week: cls.day_of_week != null ? String(cls.day_of_week) : '',
        start_time: cls.start_time ? cls.start_time.slice(0, 5) : '',
        end_time: cls.end_time ? cls.end_time.slice(0, 5) : '',
        active: cls.active ? 'true' : 'false',
      })
    } else {
      setEditingClass(null)
      setForm(emptyForm)
    }
    setFormErrors({})
    setShowModal(true)
  }

  const handleCloseModal = () => {
    if (saving) return
    setShowModal(false)
    setEditingClass(null)
  }

  const handleChange = (field: keyof ClassForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof ClassForm, string>> = {}

    if (!form.title.trim()) errors.title = 'Ο τίτλος είναι υποχρεωτικός.'
    if (!form.day_of_week) errors.day_of_week = 'Η ημέρα είναι υποχρεωτική.'

    if (form.capacity) {
      const cap = Number(form.capacity)
      if (Number.isNaN(cap) || cap <= 0) errors.capacity = 'Η χωρητικότητα πρέπει να είναι θετικός αριθμός.'
    }

    if (form.price) {
      const priceNum = parseFloat(form.price.replace(',', '.'))
      if (Number.isNaN(priceNum) || priceNum < 0) {
        errors.price = 'Μη έγκυρο ποσό.'
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setSaving(true)
    setError(null)

    const capacityNum = form.capacity ? Number(form.capacity) : null
    const priceNum = form.price ? parseFloat(form.price.replace(',', '.')) : null
    const priceCents = priceNum != null ? Math.round(priceNum * 100) : null

    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      level: form.level.trim() || null,
      capacity: capacityNum,
      price_cents: priceCents,
      day_of_week: form.day_of_week ? Number(form.day_of_week) : null,
      start_time: form.start_time ? `${form.start_time}:00` : null,
      end_time: form.end_time ? `${form.end_time}:00` : null,
      active: form.active === 'true',
    }

    try {
      if (editingClass) {
        const { error } = await supabase.from('classes').update(payload).eq('id', editingClass.id)

        if (error) {
          console.error('[Classes] update class error:', error.message)
          setError('Προέκυψε σφάλμα κατά την ενημέρωση του τμήματος.')
          setSaving(false)
          return
        }
      } else {
        const { error } = await supabase.from('classes').insert([payload])

        if (error) {
          console.error('[Classes] insert class error:', error.message)
          setError('Προέκυψε σφάλμα κατά την αποθήκευση του τμήματος.')
          setSaving(false)
          return
        }
      }

      setShowModal(false)
      setEditingClass(null)
      await loadClasses()
    } catch (e) {
      console.error('[Classes] unexpected error:', e)
      setError('Προέκυψε απρόσμενο σφάλμα.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClass = async (cls: ClassRow) => {
    const sure = window.confirm(
      `Είσαι σίγουρος ότι θέλεις να διαγράψεις το τμήμα "${cls.title ?? ''}" ; Η ενέργεια δεν αναιρείται.`,
    )
    if (!sure) return

    setRowActionId(cls.id)
    setError(null)

    const { error } = await supabase.from('classes').delete().eq('id', cls.id)

    setRowActionId(null)

    if (error) {
      console.error('[Classes] delete class error:', error.message)
      setError('Προέκυψε σφάλμα κατά τη διαγραφή του τμήματος.')
      return
    }

    setClasses((prev) => prev.filter((c) => c.id !== cls.id))
  }

  const handleToggleActive = async (cls: ClassRow) => {
    const newActive = !cls.active
    setRowActionId(cls.id)
    setError(null)

    const { error } = await supabase
      .from('classes')
      .update({ active: newActive })
      .eq('id', cls.id)

    setRowActionId(null)

    if (error) {
      console.error('[Classes] toggle active error:', error.message)
      setError('Προέκυψε σφάλμα κατά την αλλαγή της κατάστασης.')
      return
    }

    setClasses((prev) =>
      prev.map((c) => (c.id === cls.id ? { ...c, active: newActive } : c)),
    )
  }

  const isRowBusy = (id: string) => rowActionId === id

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Τμήματα</strong>
              <CButton color="primary" size="sm" onClick={() => handleOpenModal()}>
                + Προσθήκη τμήματος
              </CButton>
            </CCardHeader>
            <CCardBody>
              {/* Filters */}
              <CRow className="mb-3 g-2">
                <CCol md={4}>
                  <CFormLabel>Αναζήτηση</CFormLabel>
                  <CFormInput
                    placeholder="Τίτλος, επίπεδο ή περιγραφή..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </CCol>
                <CCol md={4}>
                  <CFormLabel>Ημέρα</CFormLabel>
                  <CFormSelect
                    value={dayFilter}
                    onChange={(e) => setDayFilter(e.target.value as any)}
                  >
                    <option value="all">Όλες</option>
                    {DAY_OPTIONS.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={4}>
                  <CFormLabel>Κατάσταση</CFormLabel>
                  <CFormSelect
                    value={activeFilter}
                    onChange={(e) => setActiveFilter(e.target.value as any)}
                  >
                    <option value="all">Όλα</option>
                    <option value="active">Ενεργά</option>
                    <option value="inactive">Ανενεργά</option>
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
                      <CTableDataCell>Επίπεδο</CTableDataCell>
                      <CTableDataCell>Ημέρα</CTableDataCell>
                      <CTableDataCell>Ώρα</CTableDataCell>
                      <CTableDataCell>Χωρητικότητα</CTableDataCell>
                      <CTableDataCell>Τιμή</CTableDataCell>
                      <CTableDataCell>Κατάσταση</CTableDataCell>
                      <CTableDataCell>Ενέργειες</CTableDataCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {filteredClasses.length === 0 ? (
                      <CTableRow>
                        <CTableDataCell colSpan={8} className="text-center py-4">
                          Δεν βρέθηκαν τμήματα.
                        </CTableDataCell>
                      </CTableRow>
                    ) : (
                      filteredClasses.map((c) => (
                        <CTableRow key={c.id}>
                          <CTableDataCell>{c.title ?? '-'}</CTableDataCell>
                          <CTableDataCell>{c.level ?? '-'}</CTableDataCell>
                          <CTableDataCell>{dayLabel(c.day_of_week)}</CTableDataCell>
                          <CTableDataCell>
                            {formatTime(c.start_time)} – {formatTime(c.end_time)}
                          </CTableDataCell>
                          <CTableDataCell>{c.capacity ?? '-'}</CTableDataCell>
                          <CTableDataCell>{formatPrice(c.price_cents)} €</CTableDataCell>
                          <CTableDataCell>
                            {c.active ? 'Ενεργό' : 'Ανενεργό'}
                          </CTableDataCell>
                          <CTableDataCell>
                            <div className="d-flex gap-2">
                              <CButton
                                size="sm"
                                color="info"
                                variant="outline"
                                onClick={() => handleOpenModal(c)}
                              >
                                Επεξεργασία
                              </CButton>
                              <CButton
                                size="sm"
                                variant="outline"
                                color={c.active ? 'secondary' : 'success'}
                                disabled={isRowBusy(c.id)}
                                onClick={() => handleToggleActive(c)}
                              >
                                {isRowBusy(c.id)
                                  ? <CSpinner size="sm" />
                                  : c.active
                                  ? 'Απενεργοποίηση'
                                  : 'Ενεργοποίηση'}
                              </CButton>
                              <CButton
                                size="sm"
                                variant="outline"
                                color="danger"
                                disabled={isRowBusy(c.id)}
                                onClick={() => handleDeleteClass(c)}
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

      {/* Modal create / edit */}
      <CModal visible={showModal} onClose={handleCloseModal}>
        <CModalHeader closeButton>
          <CModalTitle>
            {editingClass ? 'Επεξεργασία τμήματος' : 'Προσθήκη τμήματος'}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CRow className="g-3">
              <CCol md={6}>
                <CFormLabel>Τίτλος *</CFormLabel>
                <CFormInput
                  value={form.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  invalid={!!formErrors.title}
                />
                {formErrors.title && (
                  <div className="invalid-feedback d-block">{formErrors.title}</div>
                )}
              </CCol>
              <CCol md={6}>
                <CFormLabel>Επίπεδο</CFormLabel>
                <CFormInput
                  placeholder="π.χ. Beginner, Advanced..."
                  value={form.level}
                  onChange={(e) => handleChange('level', e.target.value)}
                />
              </CCol>

              <CCol xs={12}>
                <CFormLabel>Περιγραφή</CFormLabel>
                <CFormTextarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
              </CCol>

              <CCol md={4}>
                <CFormLabel>Χωρητικότητα</CFormLabel>
                <CFormInput
                  type="number"
                  min={0}
                  value={form.capacity}
                  onChange={(e) => handleChange('capacity', e.target.value)}
                  invalid={!!formErrors.capacity}
                />
                {formErrors.capacity && (
                  <div className="invalid-feedback d-block">{formErrors.capacity}</div>
                )}
              </CCol>

              <CCol md={4}>
                <CFormLabel>Τιμή (€)</CFormLabel>
                <CFormInput
                  type="text"
                  placeholder="π.χ. 40.00"
                  value={form.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                  invalid={!!formErrors.price}
                />
                {formErrors.price && (
                  <div className="invalid-feedback d-block">{formErrors.price}</div>
                )}
              </CCol>

              <CCol md={4}>
                <CFormLabel>Ημέρα *</CFormLabel>
                <CFormSelect
                  value={form.day_of_week}
                  onChange={(e) => handleChange('day_of_week', e.target.value)}
                  invalid={!!formErrors.day_of_week}
                >
                  <option value="">– Επιλογή –</option>
                  {DAY_OPTIONS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </CFormSelect>
                {formErrors.day_of_week && (
                  <div className="invalid-feedback d-block">{formErrors.day_of_week}</div>
                )}
              </CCol>

              <CCol md={6}>
                <CFormLabel>Ώρα έναρξης</CFormLabel>
                <CFormInput
                  type="time"
                  value={form.start_time}
                  onChange={(e) => handleChange('start_time', e.target.value)}
                />
              </CCol>

              <CCol md={6}>
                <CFormLabel>Ώρα λήξης</CFormLabel>
                <CFormInput
                  type="time"
                  value={form.end_time}
                  onChange={(e) => handleChange('end_time', e.target.value)}
                />
              </CCol>

              <CCol md={6}>
                <CFormLabel>Κατάσταση</CFormLabel>
                <CFormSelect
                  value={form.active}
                  onChange={(e) => handleChange('active', e.target.value)}
                >
                  <option value="true">Ενεργό</option>
                  <option value="false">Ανενεργό</option>
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
            {saving ? <CSpinner size="sm" /> : editingClass ? 'Ενημέρωση' : 'Αποθήκευση'}
          </CButton>
        </CModalFooter>
      </CModal>
    </>
  )
}

export default Classes
