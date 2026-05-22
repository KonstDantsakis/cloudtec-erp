// src/views/financial/Subscriptions.tsx
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
import jsPDF from 'jspdf'

type IncomeRow = {
  id: string
  customer_id: string | null
  class_id: string | null
  category: string | null
  amount_cents: number | null
  currency: string | null
  method: string | null
  status: string | null
  paid_at: string | null
  notes: string | null
  created_by: string | null
  created_at: string | null
  customers?: { id: string; full_name: string | null } | null
  classes?: { id: string; title: string | null } | null
}

type IncomeForm = {
  customer_id: string
  class_id: string
  category: string
  amount: string
  currency: string
  method: string
  status: string
  paid_at: string
  notes: string
}

// ---- ΝΕΟΙ TYPES για μέλη & τμήματα (με primary class + price) ----
type MemberOption = {
  id: string
  label: string
  primary_class_id: string | null
  class_title: string | null
  class_price_cents: number | null
}

type ClassOption = {
  id: string
  label: string
  price_cents: number | null
}

const emptyForm: IncomeForm = {
  customer_id: '',
  class_id: '',
  category: '',
  amount: '',
  currency: 'EUR',
  method: '',
  status: 'paid',
  paid_at: '',
  notes: '',
}

const formatAmount = (cents: number | null) => {
  if (cents == null) return '-'
  return (cents / 100).toFixed(2)
}

/** ---------------- PDF FONT LOADER (Roboto) ---------------- **/

// cache μόνο τα base64, ΟΧΙ τα addFont
let robotoRegularBase64: string | null = null
let robotoBoldBase64: string | null = null

const loadPdfFonts = async (doc: jsPDF) => {
  const loadFont = async (url: string) => {
    const res = await fetch(url)
    const buffer = await res.arrayBuffer()
    let binary = ''
    const bytes = new Uint8Array(buffer)
    const len = bytes.length
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  //  Φέρνουμε τα .ttf μόνο την πρώτη φορά
  if (!robotoRegularBase64) {
    robotoRegularBase64 = await loadFont('/fonts/Roboto-Regular.ttf')
  }
  if (!robotoBoldBase64) {
    robotoBoldBase64 = await loadFont('/fonts/Roboto-Bold.ttf')
  }

  // ⬇️ ΑΛΛΑ: για ΚΑΘΕ καινούριο doc δηλώνουμε ξανά τα fonts
  doc.addFileToVFS('Roboto-Regular.ttf', robotoRegularBase64)
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal')

  doc.addFileToVFS('Roboto-Bold.ttf', robotoBoldBase64)
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold')

  doc.setFont('Roboto', 'normal')
}

/** ---------------------------------------------------------- **/

const Subscriptions: React.FC = () => {
  const { role } = useAuth()

  const [incomes, setIncomes] = useState<IncomeRow[]>([])
  const [customers, setCustomers] = useState<MemberOption[]>([])
  const [classes, setClasses] = useState<ClassOption[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | string>('all')
  const [sortOption, setSortOption] = useState<
    'recent' | 'oldest' | 'amount_desc' | 'amount_asc'
  >('recent')

  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<IncomeForm>(emptyForm)
  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof IncomeForm, string>>
  >({})
  const [editingIncome, setEditingIncome] = useState<IncomeRow | null>(null)

  const [rowActionId, setRowActionId] = useState<string | null>(null)

  const [showPdfModal, setShowPdfModal] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [receiptIncome, setReceiptIncome] = useState<IncomeRow | null>(null)

  // ---------- LOAD DATA ----------

  const loadIncomes = async () => {
    setLoading(true)
    setError(null)

    const { data, error } = await callEdge<IncomeRow[]>('get-incomes')

    if (error) {
      console.error('[Subscriptions] Error loading incomes:', error)
      setError('Προέκυψε σφάλμα κατά τη φόρτωση των συνδρομών.')
      setIncomes([])
    } else {
      setIncomes(data ?? [])
    }
    setLoading(false)
  }

  const loadOptions = async () => {
    const [{ data: cData }, { data: clsData }] = await Promise.all([
      callEdge<any[]>('get-customers'),
      callEdge<any[]>('get-classes'),
    ])

    setCustomers(
      (cData ?? []).map(
        (c: any): MemberOption => ({
          id: c.id,
          label: c.full_name || '(Χωρίς όνομα)',
          primary_class_id: c.primary_class_id ?? null,
          class_title: c.primary_class?.title ?? null,
          class_price_cents: c.primary_class?.price_cents ?? null,
        }),
      ),
    )

    setClasses(
      (clsData ?? []).map(
        (cl: any): ClassOption => ({
          id: cl.id,
          label: cl.title || '(Χωρίς τίτλο)',
          price_cents: cl.price_cents ?? null,
        }),
      ),
    )
  }

  useEffect(() => {
    loadIncomes()
    loadOptions()
  }, [])

  // ---------- FILTERED & TOTAL ----------

  const filteredIncomes = useMemo(() => {
    let list = [...incomes]

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((i) => {
        const name = i.customers?.full_name ?? ''
        const classTitle = i.classes?.title ?? ''
        return (
          name.toLowerCase().includes(q) ||
          classTitle.toLowerCase().includes(q) ||
          (i.notes ?? '').toLowerCase().includes(q)
        )
      })
    }

    if (statusFilter !== 'all') {
      list = list.filter((i) => i.status === statusFilter)
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
  }, [incomes, search, statusFilter, sortOption])

  const totalAmountCents = useMemo(
    () => filteredIncomes.reduce((sum, i) => sum + (i.amount_cents ?? 0), 0),
    [filteredIncomes],
  )

  // ---------- MODAL HELPERS ----------

  const handleOpenModal = (income?: IncomeRow) => {
    if (income) {
      setEditingIncome(income)
      setForm({
        customer_id: income.customer_id ?? '',
        class_id: income.class_id ?? '',
        category: income.category ?? '',
        amount:
          income.amount_cents != null
            ? (income.amount_cents / 100).toFixed(2)
            : '',
        currency: income.currency ?? 'EUR',
        method: income.method ?? '',
        status: income.status ?? 'paid',
        paid_at: income.paid_at
          ? new Date(income.paid_at).toISOString().slice(0, 16)
          : '',
        notes: income.notes ?? '',
      })
    } else {
      setEditingIncome(null)
      setForm({
        ...emptyForm,
        paid_at: new Date().toISOString().slice(0, 16),
      })
    }
    setFormErrors({})
    setShowModal(true)
  }

  const handleCloseModal = () => {
    if (saving) return
    setShowModal(false)
    setEditingIncome(null)
  }

  const handleChange = (field: keyof IncomeForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // 🔁 ΝΕΟ: όταν αλλάζει μέλος → γεμίζει class_id + amount
  const handleMemberChange = (memberId: string) => {
    setForm((prev) => {
      const member = customers.find((m) => m.id === memberId)
      if (!member) {
        return { ...prev, customer_id: memberId }
      }

      let next = {
        ...prev,
        customer_id: memberId,
      }

      if (member.primary_class_id) {
        next = {
          ...next,
          class_id: member.primary_class_id,
        }
      }

      if (member.class_price_cents != null) {
        next = {
          ...next,
          amount: (member.class_price_cents / 100).toFixed(2),
        }
      }

      return next
    })
  }

  // 🔁 ΝΕΟ: αν αλλάξεις τμήμα χειροκίνητα → ενημερώνεται το ποσό από price_cents
  const handleClassChange = (classId: string) => {
    setForm((prev) => {
      const cls = classes.find((c) => c.id === classId)
      const next: IncomeForm = { ...prev, class_id: classId }
      if (cls?.price_cents != null) {
        next.amount = (cls.price_cents / 100).toFixed(2)
      }
      return next
    })
  }

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof IncomeForm, string>> = {}

    if (!form.customer_id) {
      errors.customer_id = 'Το μέλος είναι υποχρεωτικό.'
    }

    if (!form.class_id) {
      errors.class_id = 'Το τμήμα είναι υποχρεωτικό.'
    }

    const amountNumber = parseFloat(form.amount.replace(',', '.'))
    if (!form.amount.trim() || Number.isNaN(amountNumber) || amountNumber <= 0) {
      errors.amount = 'Το ποσό πρέπει να είναι θετικός αριθμός.'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // ---------- SAVE ----------

  const handleSave = async () => {
    if (!validateForm()) return

    setSaving(true)
    setError(null)

    const amountNumber = parseFloat(form.amount.replace(',', '.'))
    const amountCents = Math.round(amountNumber * 100)

    const payload = {
      customer_id: form.customer_id || null,
      class_id: form.class_id || null,
      category: form.category.trim() || null,
      amount_cents: amountCents,
      currency: form.currency.trim() || 'EUR',
      method: form.method.trim() || null,
      status: form.status.trim() || null,
      paid_at: form.paid_at ? new Date(form.paid_at).toISOString() : null,
      notes: form.notes.trim() || null,
      created_by: editingIncome?.created_by ?? role ?? null,
    }

    if (editingIncome) {
      const { error } = await callEdge('update-income', { id: editingIncome.id, ...payload })

      setSaving(false)

      if (error) {
        console.error('[Subscriptions] update income error:', error)
        setError('Προέκυψε σφάλμα κατά την ενημέρωση της συνδρομής.')
        return
      }

      setShowModal(false)
      setEditingIncome(null)
      await loadIncomes()
      return
    }

    const { error } = await callEdge('create-income', payload)

    setSaving(false)

    if (error) {
      console.error('[Subscriptions] insert income error:', error)
      setError('Προέκυψε σφάλμα κατά την αποθήκευση της συνδρομής.')
      return
    }

    setShowModal(false)
    await loadIncomes()
  }

  // ---------- DELETE ----------

  const handleDeleteIncome = async (income: IncomeRow) => {
    const name = income.customers?.full_name ?? ''
    const sure = window.confirm(
      `Είσαι σίγουρος ότι θέλεις να διαγράψεις τη συνδρομή του μέλους "${name}" ; Η ενέργεια δεν αναιρείται.`,
    )
    if (!sure) return

    setRowActionId(income.id)
    setError(null)

    const { error } = await callEdge('delete-income', { id: income.id })

    setRowActionId(null)

    if (error) {
      console.error('[Subscriptions] delete income error:', error)
      setError('Προέκυψε σφάλμα κατά τη διαγραφή της συνδρομής.')
      return
    }

    setIncomes((prev) => prev.filter((i) => i.id !== income.id))
  }

  const isRowBusy = (id: string) => rowActionId === id

  // ---------- PDF RECEIPT ----------

  const handlePreviewReceipt = async (income: IncomeRow) => {
    try {
      setReceiptIncome(income)

      const doc = new jsPDF('p', 'pt')
      doc.setLineHeightFactor(1.2)

      // φόρτωση / register Roboto
      await loadPdfFonts(doc)

      const memberName = income.customers?.full_name ?? '-'
      const classTitle = income.classes?.title ?? '-'
      const amount =
        income.amount_cents != null
          ? (income.amount_cents / 100).toFixed(2)
          : '0.00'
      const currency = income.currency ?? 'EUR'
      const method = income.method ?? '-'
      const status = income.status ?? '-'
      const paidAt = income.paid_at
        ? new Date(income.paid_at).toLocaleString('el-GR')
        : '-'

      // Header
      doc.setFont('Roboto', 'bold')
      doc.setFontSize(20)
      doc.text('Απόδειξη Πληρωμής', 300, 60, { align: 'center' })

      // Στοιχεία
      doc.setFontSize(12)

      const labelX = 60
      const valueX = 180
      let y = 100
      const step = 18

      const drawRow = (label: string, value: string) => {
        doc.setFont('Roboto', 'bold')
        doc.text(label, labelX, y)
        doc.setFont('Roboto', 'normal')
        doc.text(value, valueX, y)
        y += step
      }

      drawRow('Επιχείρηση:', 'Cloudtec Gym')
      drawRow('Μέλος:', memberName)
      drawRow('Τμήμα:', classTitle)
      drawRow('Ημ/νία πληρωμής:', paidAt)
      drawRow('Ποσό:', `${amount} ${currency}`)
      drawRow('Μέθοδος πληρωμής:', method)
      drawRow('Κατάσταση:', status)
      drawRow('ID συναλλαγής:', income.id)

      y += 20
      doc.line(60, y, 540, y)
      y += 30

      doc.setFont('Roboto', 'bold')
      doc.text('Υπογραφή:', 60, y)
      doc.setFont('Roboto', 'normal')
      doc.text('(____________________)', 150, y)

      const blob = doc.output('blob')
      const url = URL.createObjectURL(blob)

      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }

      setPdfUrl(url)
      setShowPdfModal(true)
    } catch (e) {
      console.error('Receipt PDF error:', e)
    }
  }

  const handleClosePdfModal = () => {
    setShowPdfModal(false)
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl)
      setPdfUrl(null)
    }
    setReceiptIncome(null)
  }

  // ---------- RENDER ----------

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Συνδρομές / Έσοδα</strong>
              <div className="d-flex flex-column align-items-end">
                <div style={{ fontSize: '0.85rem' }}>
                  Σύνολο: <strong>{formatAmount(totalAmountCents)} €</strong>
                </div>
                <CButton
                  color="primary"
                  size="sm"
                  className="mt-2"
                  onClick={() => handleOpenModal()}
                >
                  + Προσθήκη συνδρομής
                </CButton>
              </div>
            </CCardHeader>

            <CCardBody>
              <CRow className="mb-3 g-2">
                <CCol md={4}>
                  <CFormLabel>Αναζήτηση</CFormLabel>
                  <CFormInput
                    placeholder="Μέλος, τμήμα ή σημειώσεις..."
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
                    <option value="paid">Εξοφλημένες</option>
                    <option value="pending">Σε εκκρεμότητα</option>
                    <option value="canceled">Ακυρωμένες</option>
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
                      <CTableDataCell>Μέλος</CTableDataCell>
                      <CTableDataCell>Τμήμα</CTableDataCell>
                      <CTableDataCell>Κατηγορία</CTableDataCell>
                      <CTableDataCell>Ποσό</CTableDataCell>
                      <CTableDataCell>Μέθοδος</CTableDataCell>
                      <CTableDataCell>Κατάσταση</CTableDataCell>
                      <CTableDataCell>Ημ/νία πληρωμής</CTableDataCell>
                      <CTableDataCell>Σημειώσεις</CTableDataCell>
                      <CTableDataCell>Ενέργειες</CTableDataCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {filteredIncomes.length === 0 ? (
                      <CTableRow>
                        <CTableDataCell
                          colSpan={9}
                          className="text-center py-4"
                        >
                          Δεν βρέθηκαν συνδρομές.
                        </CTableDataCell>
                      </CTableRow>
                    ) : (
                      filteredIncomes.map((i) => (
                        <CTableRow key={i.id}>
                          <CTableDataCell>
                            {i.customers?.full_name ?? '-'}
                          </CTableDataCell>
                          <CTableDataCell>
                            {i.classes?.title ?? '-'}
                          </CTableDataCell>
                          <CTableDataCell>
                            {i.category ?? '-'}
                          </CTableDataCell>
                          <CTableDataCell>
                            {formatAmount(i.amount_cents)} €
                          </CTableDataCell>
                          <CTableDataCell>{i.method ?? '-'}</CTableDataCell>
                          <CTableDataCell>{i.status ?? '-'}</CTableDataCell>
                          <CTableDataCell>
                            {i.paid_at
                              ? new Date(i.paid_at).toLocaleString('el-GR', {
                                  dateStyle: 'short',
                                  timeStyle: 'short',
                                })
                              : '-'}
                          </CTableDataCell>
                          <CTableDataCell>{i.notes ?? '-'}</CTableDataCell>
                          <CTableDataCell>
                            <div className="d-flex gap-2">
                              <CButton
                                size="sm"
                                variant="outline"
                                color="success"
                                onClick={() => handlePreviewReceipt(i)}
                              >
                                Απόδειξη
                              </CButton>
                              <CButton
                                size="sm"
                                color="info"
                                variant="outline"
                                onClick={() => handleOpenModal(i)}
                              >
                                Επεξεργασία
                              </CButton>
                              <CButton
                                size="sm"
                                variant="outline"
                                color="danger"
                                disabled={isRowBusy(i.id)}
                                onClick={() => handleDeleteIncome(i)}
                              >
                                {isRowBusy(i.id) ? (
                                  <CSpinner size="sm" />
                                ) : (
                                  'Διαγραφή'
                                )}
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
            {editingIncome ? 'Επεξεργασία συνδρομής' : 'Προσθήκη συνδρομής'}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          <CForm>
            <CRow className="g-3">
              <CCol md={6}>
                <CFormLabel>Μέλος *</CFormLabel>
                <CFormSelect
                  value={form.customer_id}
                  onChange={(e) => handleMemberChange(e.target.value)}
                  invalid={!!formErrors.customer_id}
                >
                  <option value="">– Επιλογή μέλους –</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                      {c.class_title ? ` — ${c.class_title}` : ''}
                    </option>
                  ))}
                </CFormSelect>
                {formErrors.customer_id && (
                  <div className="invalid-feedback d-block">
                    {formErrors.customer_id}
                  </div>
                )}
              </CCol>

              <CCol md={6}>
                <CFormLabel>Τμήμα *</CFormLabel>
                <CFormSelect
                  value={form.class_id}
                  onChange={(e) => handleClassChange(e.target.value)}
                  invalid={!!formErrors.class_id}
                >
                  <option value="">– Επιλογή τμήματος –</option>
                  {classes.map((cl) => (
                    <option key={cl.id} value={cl.id}>
                      {cl.label}
                    </option>
                  ))}
                </CFormSelect>
                {formErrors.class_id && (
                  <div className="invalid-feedback d-block">
                    {formErrors.class_id}
                  </div>
                )}
              </CCol>

              <CCol md={6}>
                <CFormLabel>Κατηγορία</CFormLabel>
                <CFormInput
                  placeholder="π.χ. συνδρομή, drop_in..."
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
                  <div className="invalid-feedback d-block">
                    {formErrors.amount}
                  </div>
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
                  placeholder="π.χ. cash, card..."
                  value={form.method}
                  onChange={(e) => handleChange('method', e.target.value)}
                />
              </CCol>

              <CCol md={6}>
                <CFormLabel>Κατάσταση</CFormLabel>
                <CFormSelect
                  value={form.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                >
                  <option value="paid">Εξοφλημένη</option>
                  <option value="pending">Σε εκκρεμότητα</option>
                  <option value="canceled">Ακυρωμένη</option>
                </CFormSelect>
              </CCol>

              <CCol md={6}>
                <CFormLabel>Ημ/νία πληρωμής</CFormLabel>
                <CFormInput
                  type="datetime-local"
                  value={form.paid_at}
                  onChange={(e) => handleChange('paid_at', e.target.value)}
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
          <CButton
            color="secondary"
            variant="outline"
            onClick={handleCloseModal}
            disabled={saving}
          >
            Ακύρωση
          </CButton>
          <CButton color="primary" onClick={handleSave} disabled={saving}>
            {saving ? (
              <CSpinner size="sm" />
            ) : editingIncome ? (
              'Ενημέρωση'
            ) : (
              'Αποθήκευση'
            )}
          </CButton>
        </CModalFooter>
      </CModal>

      {/* Modal PDF Preview */}
      <CModal visible={showPdfModal} onClose={handleClosePdfModal} size="lg">
        <CModalHeader closeButton>
          <CModalTitle>Απόδειξη πληρωμής</CModalTitle>
        </CModalHeader>
        <CModalBody style={{ height: '70vh' }}>
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              title="receipt-preview"
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          ) : (
            <div className="text-center py-5">
              <CSpinner />
            </div>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            variant="outline"
            onClick={handleClosePdfModal}
          >
            Κλείσιμο
          </CButton>
          {pdfUrl && (
            <CButton
              color="primary"
              onClick={() => {
                const a = document.createElement('a')
                a.href = pdfUrl
                const base = receiptIncome
                  ? `receipt-${receiptIncome.id}`
                  : 'receipt'
                a.download = `${base}.pdf`
                a.click()
              }}
            >
              Λήψη PDF
            </CButton>
          )}
        </CModalFooter>
      </CModal>
    </>
  )
}

export default Subscriptions
