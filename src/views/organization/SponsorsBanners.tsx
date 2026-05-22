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
  CImage,
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
import { callEdge } from '@/services/api'
import { useAuth } from '@/context/AuthContext'

type SponsorRow = {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  link_url: string | null
  position: number | null
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string | null
}

type SponsorForm = {
  name: string
  description: string
  logo_url: string
  link_url: string
  position: string
  is_active: string // 'true' | 'false'
}

const emptyForm: SponsorForm = {
  name: '',
  description: '',
  logo_url: '',
  link_url: '',
  position: '',
  is_active: 'true',
}

const SponsorsBanners: React.FC = () => {
  const { user } = useAuth()

  const [sponsors, setSponsors] = useState<SponsorRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<SponsorForm>(emptyForm)
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof SponsorForm, string>>>({})
  const [editingItem, setEditingItem] = useState<SponsorRow | null>(null)

  const [rowActionId, setRowActionId] = useState<string | null>(null)

  // 👇 extra state για upload λογοτύπου
  const [uploadingLogo, setUploadingLogo] = useState(false)

  // ---------- LOAD DATA ----------

  const loadSponsors = async () => {
    setLoading(true)
    setError(null)

    const { data, error } = await callEdge<SponsorRow[]>('get-sponsors')

    if (error) {
      console.error('[Sponsors] load error:', error)
      setError('Προέκυψε σφάλμα κατά τη φόρτωση των χορηγών.')
      setSponsors([])
    } else {
      setSponsors(data ?? [])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadSponsors()
  }, [])

  // ---------- FILTERED LIST ----------

  const filteredSponsors = useMemo(() => {
    let list = [...sponsors]

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((s) => {
        const name = s.name ?? ''
        const desc = s.description ?? ''
        return (
          name.toLowerCase().includes(q) ||
          desc.toLowerCase().includes(q) ||
          (s.link_url ?? '').toLowerCase().includes(q)
        )
      })
    }

    if (statusFilter === 'active') {
      list = list.filter((s) => s.is_active)
    } else if (statusFilter === 'inactive') {
      list = list.filter((s) => !s.is_active)
    }

    list.sort((a, b) => {
      const pa = a.position ?? 999999
      const pb = b.position ?? 999999
      if (pa !== pb) return pa - pb
      const da = new Date(a.created_at).getTime()
      const db = new Date(b.created_at).getTime()
      return db - da
    })

    return list
  }, [sponsors, search, statusFilter])

  // ---------- MODAL HELPERS ----------

  const handleOpenModal = (item?: SponsorRow) => {
    if (item) {
      setEditingItem(item)
      setForm({
        name: item.name,
        description: item.description ?? '',
        logo_url: item.logo_url ?? '',
        link_url: item.link_url ?? '',
        position: item.position != null ? String(item.position) : '',
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

  const handleChange = (field: keyof SponsorForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof SponsorForm, string>> = {}

    if (!form.name.trim()) {
      errors.name = 'Το όνομα είναι υποχρεωτικό.'
    }

    if (form.position.trim()) {
      const pos = Number(form.position)
      if (Number.isNaN(pos) || !Number.isInteger(pos) || pos < 0) {
        errors.position = 'Η σειρά πρέπει να είναι μη αρνητικός ακέραιος.'
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // ---------- UPLOAD LOGO TO SUPABASE STORAGE ----------

  const handleLogoFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    setError(null)

    try {
      // ασφαλές όνομα αρχείου
      const safeName = file.name.replace(/\s+/g, '-').toLowerCase()
      const uniquePrefix =
        (typeof crypto !== 'undefined' && 'randomUUID' in crypto && crypto.randomUUID()) ||
        `${Date.now()}`
      const filePath = `sponsors/${uniquePrefix}-${safeName}`

      const { error: uploadError } = await supabase.storage
        .from('sponsor-logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        console.error('[Sponsors] logo upload error:', uploadError.message)
        throw uploadError
      }

      const { data } = supabase.storage.from('sponsor-logos').getPublicUrl(filePath)
      const publicUrl = data.publicUrl

      setForm((prev) => ({ ...prev, logo_url: publicUrl }))
    } catch (err) {
      console.error('[Sponsors] logo upload error:', err)
      setError('Προέκυψε σφάλμα κατά το ανέβασμα του λογοτύπου.')
    } finally {
      setUploadingLogo(false)
    }
  }

  // ---------- SAVE (CREATE / UPDATE) ----------

  const handleSave = async () => {
    if (!validateForm()) return

    setSaving(true)
    setError(null)

    const positionNumber = form.position.trim() ? Number(form.position) : null

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      logo_url: form.logo_url.trim() || null,
      link_url: form.link_url.trim() || null,
      position: positionNumber,
      is_active: form.is_active === 'true',
      created_by: editingItem?.created_by ?? user?.id ?? null,
    }

    if (editingItem) {
      const { error } = await callEdge('update-sponsor', { id: editingItem.id, ...payload })

      setSaving(false)

      if (error) {
        console.error('[Sponsors] update error:', error)
        setError('Προέκυψε σφάλμα κατά την ενημέρωση του χορηγού.')
        return
      }

      setShowModal(false)
      setEditingItem(null)
      await loadSponsors()
      return
    }

    const { error } = await callEdge('create-sponsor', payload)

    setSaving(false)

    if (error) {
      console.error('[Sponsors] insert error:', error)
      setError('Προέκυψε σφάλμα κατά την αποθήκευση του χορηγού.')
      return
    }

    setShowModal(false)
    await loadSponsors()
  }

  // ---------- DELETE ----------

  const handleDelete = async (item: SponsorRow) => {
    const sure = window.confirm(
      `Είσαι σίγουρος ότι θέλεις να διαγράψεις τον χορηγό "${item.name}" ; Η ενέργεια δεν αναιρείται.`,
    )
    if (!sure) return

    setRowActionId(item.id)
    setError(null)

    const { error } = await callEdge('delete-sponsor', { id: item.id })

    setRowActionId(null)

    if (error) {
      console.error('[Sponsors] delete error:', error)
      setError('Προέκυψε σφάλμα κατά τη διαγραφή του χορηγού.')
      return
    }

    setSponsors((prev) => prev.filter((s) => s.id !== item.id))
  }

  const isRowBusy = (id: string) => rowActionId === id

  // ---------- RENDER ----------

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Χορηγοί / Banners</strong>
              <CButton color="primary" size="sm" onClick={() => handleOpenModal()}>
                + Προσθήκη χορηγού
              </CButton>
            </CCardHeader>

            <CCardBody>
              {/* Filters */}
              <CRow className="mb-3 g-2">
                <CCol md={5}>
                  <CFormLabel>Αναζήτηση</CFormLabel>
                  <CFormInput
                    placeholder="Όνομα, περιγραφή ή link..."
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
                    <option value="all">Όλοι</option>
                    <option value="active">Μόνο ενεργοί</option>
                    <option value="inactive">Μόνο ανενεργοί</option>
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
                      <CTableDataCell>Λογότυπο</CTableDataCell>
                      <CTableDataCell>Όνομα</CTableDataCell>
                      <CTableDataCell>Περιγραφή</CTableDataCell>
                      <CTableDataCell>Link</CTableDataCell>
                      <CTableDataCell>Σειρά</CTableDataCell>
                      <CTableDataCell>Κατάσταση</CTableDataCell>
                      <CTableDataCell>Ενέργειες</CTableDataCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {filteredSponsors.length === 0 ? (
                      <CTableRow>
                        <CTableDataCell colSpan={7} className="text-center py-4">
                          Δεν βρέθηκαν χορηγοί.
                        </CTableDataCell>
                      </CTableRow>
                    ) : (
                      filteredSponsors.map((s) => (
                        <CTableRow key={s.id}>
                          <CTableDataCell style={{ width: 80 }}>
                            {s.logo_url ? (
                              <CImage
                                src={s.logo_url}
                                alt={s.name}
                                style={{
                                  maxHeight: 40,
                                  maxWidth: 80,
                                  objectFit: 'contain',
                                }}
                              />
                            ) : (
                              <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                                Χωρίς εικόνα
                              </span>
                            )}
                          </CTableDataCell>
                          <CTableDataCell className="fw-semibold">{s.name}</CTableDataCell>
                          <CTableDataCell style={{ maxWidth: 260 }}>
                            <div
                              style={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                              title={s.description ?? ''}
                            >
                              {s.description || '-'}
                            </div>
                          </CTableDataCell>
                          <CTableDataCell>
                            {s.link_url ? (
                              <a href={s.link_url} target="_blank" rel="noreferrer">
                                {s.link_url}
                              </a>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </CTableDataCell>
                          <CTableDataCell>{s.position ?? '-'}</CTableDataCell>
                          <CTableDataCell>
                            {s.is_active ? (
                              <span className="badge bg-success">Ενεργός</span>
                            ) : (
                              <span className="badge bg-secondary">Ανενεργός</span>
                            )}
                          </CTableDataCell>
                          <CTableDataCell>
                            <div className="d-flex gap-2">
                              <CButton
                                size="sm"
                                variant="outline"
                                color="info"
                                onClick={() => handleOpenModal(s)}
                              >
                                Επεξεργασία
                              </CButton>
                              <CButton
                                size="sm"
                                variant="outline"
                                color="danger"
                                disabled={isRowBusy(s.id)}
                                onClick={() => handleDelete(s)}
                              >
                                {isRowBusy(s.id) ? <CSpinner size="sm" /> : 'Διαγραφή'}
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
            {editingItem ? 'Επεξεργασία χορηγού' : 'Προσθήκη χορηγού'}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CRow className="g-3">
              <CCol md={6}>
                <CFormLabel>Όνομα *</CFormLabel>
                <CFormInput
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  invalid={!!formErrors.name}
                  placeholder="π.χ. Coffee House"
                />
                {formErrors.name && (
                  <div className="invalid-feedback d-block">{formErrors.name}</div>
                )}
              </CCol>

              <CCol md={6}>
                <CFormLabel>Σειρά εμφάνισης</CFormLabel>
                <CFormInput
                  value={form.position}
                  onChange={(e) => handleChange('position', e.target.value)}
                  invalid={!!formErrors.position}
                  placeholder="π.χ. 1, 2, 3..."
                />
                {formErrors.position && (
                  <div className="invalid-feedback d-block">{formErrors.position}</div>
                )}
              </CCol>

              <CCol xs={12}>
                <CFormLabel>Περιγραφή</CFormLabel>
                <CFormTextarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Σύντομη περιγραφή του χορηγού ή της προσφοράς του."
                />
              </CCol>

              <CCol xs={12}>
                <CFormLabel>Λογότυπο / banner</CFormLabel>
                <CFormInput
                  type="file"
                  accept="image/*"
                  onChange={handleLogoFileChange}
                  disabled={uploadingLogo}
                />
                {uploadingLogo && (
                  <small className="text-muted d-block mt-1">
                    Γίνεται ανέβασμα λογοτύπου...
                  </small>
                )}
                {form.logo_url && (
                  <div className="mt-2 d-flex align-items-center gap-3">
                    <CImage
                      src={form.logo_url}
                      alt="preview"
                      style={{ maxHeight: 40, maxWidth: 80, objectFit: 'contain' }}
                    />
                    <small className="text-muted" style={{ wordBreak: 'break-all' }}>
                      {form.logo_url}
                    </small>
                  </div>
                )}
              </CCol>

              <CCol xs={12}>
                <CFormLabel>Link χορηγού</CFormLabel>
                <CFormInput
                  value={form.link_url}
                  onChange={(e) => handleChange('link_url', e.target.value)}
                  placeholder="https://site-chorigou.gr"
                />
              </CCol>

              <CCol md={6}>
                <CFormLabel>Κατάσταση</CFormLabel>
                <CFormSelect
                  value={form.is_active}
                  onChange={(e) => handleChange('is_active', e.target.value)}
                >
                  <option value="true">Ενεργός</option>
                  <option value="false">Ανενεργός</option>
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

export default SponsorsBanners
