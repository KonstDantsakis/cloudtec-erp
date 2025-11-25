// src/views/organization/Presence.tsx
import React, { useEffect, useMemo, useState } from 'react'
import {
  CBadge,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormInput,
  CFormLabel,
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
  title: string
  level: string | null
  day_of_week: number | null
}

type CustomerRow = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  status: string | null
  primary_class_id: string | null
}

type AttendanceRow = {
  id: string
  customer_id: string
  class_id: string | null
  attendance_date: string // YYYY-MM-DD
  is_present: boolean
}

const Presence: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [search, setSearch] = useState('')

  const [classesForDay, setClassesForDay] = useState<ClassRow[]>([])
  const [customers, setCustomers] = useState<CustomerRow[]>([])
  const [attendanceByKey, setAttendanceByKey] = useState<Record<string, AttendanceRow>>({})
  const [monthlyAbsences, setMonthlyAbsences] = useState<Record<string, number>>({})

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rowSavingKey, setRowSavingKey] = useState<string | null>(null)

  const dateToStr = (d: Date) => d.toISOString().slice(0, 10)
  const currentDateStr = dateToStr(selectedDate)

  const monthRange = (d: Date) => {
    const start = new Date(d.getFullYear(), d.getMonth(), 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1)
    return {
      startStr: dateToStr(start),
      endStr: dateToStr(end),
    }
  }

  const jsDayToDbDay = (jsDay: number) => {
    // JS: 0=Sun..6=Sat  | DB: 1=Mon..7=Sun
    if (jsDay === 0) return 7
    return jsDay
  }

  // key για συγκεκριμένη μέρα
  const keyFor = (classId: string, customerId: string, dateStr: string) =>
    `${classId}_${customerId}_${dateStr}`

  // key για σύνολο μήνα (απουσίες)
  const monthKeyFor = (classId: string, customerId: string) => `${classId}_${customerId}`

  const formatMonthLabel = (d: Date) =>
    d.toLocaleDateString('el-GR', { month: 'long', year: 'numeric' })

  // ------------ LOAD DATA  ------------

  const loadDataForDate = async (date: Date) => {
    setLoading(true)
    setError(null)

    try {
      const jsDay = date.getDay()
      const dbDay = jsDayToDbDay(jsDay)
      const { startStr, endStr } = monthRange(date)

      // 1) Τμήματα που έχουν μάθημα τη συγκεκριμένη μέρα
      const { data: classesData, error: classesErr } = await supabase
        .from('classes')
        .select('id, title, level, day_of_week, active')
        .eq('active', true)
        .eq('day_of_week', dbDay)
        .order('title', { ascending: true })

      if (classesErr) {
        console.error('[Presence] classes error:', classesErr.message)
        throw new Error('Προέκυψε σφάλμα κατά τη φόρτωση των τμημάτων.')
      }

      const classesRows: ClassRow[] = (classesData ?? []).map((c: any) => ({
        id: c.id as string,
        title: c.title as string,
        level: (c.level as string) ?? null,
        day_of_week: (c.day_of_week as number) ?? null,
      }))

      setClassesForDay(classesRows)

      const classIds = classesRows.map((c) => c.id)
      if (classIds.length === 0) {
        setCustomers([])
        setAttendanceByKey({})
        setMonthlyAbsences({})
        setLoading(false)
        return
      }

      // 2) Μέλη που ανήκουν σε αυτά τα τμήματα (primary_class_id)
      const { data: custData, error: custErr } = await supabase
        .from('customers')
        .select('id, full_name, email, phone, status, primary_class_id')
        .eq('status', 'Ενεργός')
        .in('primary_class_id', classIds)

      if (custErr) {
        console.error('[Presence] customers error:', custErr.message)
        throw new Error('Προέκυψε σφάλμα κατά τη φόρτωση των μελών.')
      }

      const customersRows = (custData ?? []) as CustomerRow[]
      setCustomers(customersRows)

      const customerIds = customersRows.map((c) => c.id)

      if (customerIds.length === 0) {
        setAttendanceByKey({})
        setMonthlyAbsences({})
        setLoading(false)
        return
      }

      // 3) Παρουσίες μήνα για αυτά τα τμήματα & μέλη
      const { data: attData, error: attErr } = await supabase
        .from('attendance')
        .select('id, customer_id, class_id, attendance_date, is_present')
        .gte('attendance_date', startStr)
        .lt('attendance_date', endStr)
        .in('class_id', classIds)
        .in('customer_id', customerIds)

      if (attErr) {
        console.error('[Presence] attendance error:', attErr.message)
        throw new Error('Προέκυψε σφάλμα κατά τη φόρτωση παρουσιών.')
      }

      const byKey: Record<string, AttendanceRow> = {}
      const absencesByKey: Record<string, number> = {}

      ;(attData ?? []).forEach((row: any) => {
        const att: AttendanceRow = {
          id: row.id,
          customer_id: row.customer_id,
          class_id: row.class_id,
          attendance_date: row.attendance_date,
          is_present: row.is_present,
        }

        if (!att.class_id) return

        const k = keyFor(att.class_id, att.customer_id, att.attendance_date)
        byKey[k] = att

        if (!att.is_present) {
          const mk = monthKeyFor(att.class_id, att.customer_id)
          absencesByKey[mk] = (absencesByKey[mk] ?? 0) + 1
        }
      })

      setAttendanceByKey(byKey)
      setMonthlyAbsences(absencesByKey)
    } catch (err: any) {
      setError(err?.message ?? 'Προέκυψε σφάλμα κατά τη φόρτωση των δεδομένων.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadDataForDate(selectedDate)
  }, [selectedDate])

  // ------------ TOGGLE PRESENCE ------------

  const handleTogglePresence = async (
    classRow: ClassRow,
    customer: CustomerRow,
    checked: boolean,
  ) => {
    if (!classRow.id || !customer.id) return

    const key = keyFor(classRow.id, customer.id, currentDateStr)
    const existing = attendanceByKey[key]

    setRowSavingKey(key)
    setError(null)

    try {
      if (existing) {
        const { error } = await supabase
          .from('attendance')
          .update({
            is_present: checked,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)

        if (error) {
          console.error('[Presence] update error:', error.message)
          throw new Error('Σφάλμα κατά την ενημέρωση παρουσίας.')
        }
      } else {
        const { error } = await supabase.from('attendance').insert([
          {
            customer_id: customer.id,
            class_id: classRow.id,
            attendance_date: currentDateStr,
            is_present: checked,
          },
        ])

        if (error) {
          console.error('[Presence] insert error:', error.message)
          throw new Error('Σφάλμα κατά την καταχώρηση παρουσίας.')
        }
      }

      await loadDataForDate(selectedDate)
    } catch (err: any) {
      setError(err?.message ?? 'Σφάλμα κατά την αποθήκευση παρουσίας.')
    } finally {
      setRowSavingKey(null)
    }
  }

  const isRowBusy = (classId: string, customerId: string) =>
    rowSavingKey === keyFor(classId, customerId, currentDateStr)

  // ------------ GROUP MEMBERS BY CLASS ------------

  const customersByClass = useMemo(() => {
    const map: Record<string, CustomerRow[]> = {}
    customers.forEach((c) => {
      const clsId = c.primary_class_id
      if (!clsId) return
      if (!map[clsId]) map[clsId] = []
      map[clsId].push(c)
    })
    return map
  }, [customers])

  const filteredCustomersByClass = useMemo(() => {
    if (!search.trim()) return customersByClass
    const q = search.trim().toLowerCase()

    const map: Record<string, CustomerRow[]> = {}
    Object.entries(customersByClass).forEach(([classId, list]) => {
      const filtered = list.filter((c) => {
        const name = c.full_name ?? ''
        const email = c.email ?? ''
        const phone = c.phone ?? ''
        return (
          name.toLowerCase().includes(q) ||
          email.toLowerCase().includes(q) ||
          phone.toLowerCase().includes(q)
        )
      })
      if (filtered.length > 0) {
        map[classId] = filtered
      }
    })
    return map
  }, [customersByClass, search])

  // ------------ RENDER ------------

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <strong>Παρουσίες ανά τμήμα</strong>
              <div className="small text-muted">
                Ημερομηνία: {currentDateStr} — Μήνας: {formatMonthLabel(selectedDate)}
              </div>
            </div>

            <div className="d-flex flex-wrap gap-3 align-items-end">
              <div>
                <CFormLabel className="mb-1">Ημερομηνία</CFormLabel>
                <CFormInput
                  type="date"
                  value={currentDateStr}
                  onChange={(e) => {
                    const v = e.target.value
                    if (!v) return
                    const [y, m, d] = v.split('-').map(Number)
                    setSelectedDate(new Date(y, m - 1, d))
                  }}
                />
              </div>
              <div>
                <CFormLabel className="mb-1">Αναζήτηση μέλους</CFormLabel>
                <CFormInput
                  placeholder="Όνομα, email ή τηλέφωνο..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CCardHeader>

          <CCardBody>
            {error && (
              <div className="text-danger mb-2" style={{ fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-4">
                <CSpinner />
              </div>
            ) : classesForDay.length === 0 ? (
              <div className="text-muted">
                Δεν υπάρχουν ενεργά τμήματα για αυτή την ημέρα.
              </div>
            ) : (
              classesForDay.map((cls) => {
                const list = filteredCustomersByClass[cls.id] ?? []

                return (
                  <CCard key={cls.id} className="mb-4">
                    <CCardHeader>
                      <strong>{cls.title}</strong>{' '}
                      {cls.level && (
                        <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                          — {cls.level}
                        </span>
                      )}
                    </CCardHeader>
                    <CCardBody>
                      {list.length === 0 ? (
                        <div className="text-muted small">
                          Δεν υπάρχουν μέλη σε αυτό το τμήμα (ή δεν ταιριάζουν με την
                          αναζήτηση).
                        </div>
                      ) : (
                        <CTable hover responsive align="middle" className="mb-0">
                          <CTableHead>
                            <CTableRow>
                              <CTableDataCell>Μέλος</CTableDataCell>
                              <CTableDataCell>Επικοινωνία</CTableDataCell>
                              <CTableDataCell>Κατάσταση μέλους</CTableDataCell>
                              <CTableDataCell className="text-center">
                                Παρουσία ({currentDateStr})
                              </CTableDataCell>
                              <CTableDataCell className="text-center">
                                Απουσίες στον μήνα
                              </CTableDataCell>
                            </CTableRow>
                          </CTableHead>
                          <CTableBody>
                            {list.map((c) => {
                              const rowKey = keyFor(cls.id, c.id, currentDateStr)
                              const attRow = attendanceByKey[rowKey]
                              const checked = attRow?.is_present ?? false

                              const absKey = monthKeyFor(cls.id, c.id)
                              const absences = monthlyAbsences[absKey] ?? 0

                              return (
                                <CTableRow key={c.id}>
                                  <CTableDataCell className="fw-semibold">
                                    {c.full_name || '-'}
                                  </CTableDataCell>
                                  <CTableDataCell>
                                    <div className="small text-muted">
                                      {c.email || '-'}
                                      {c.phone ? ` · ${c.phone}` : ''}
                                    </div>
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
                                  <CTableDataCell className="text-center">
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      disabled={isRowBusy(cls.id, c.id)}
                                      onChange={(ev) =>
                                        handleTogglePresence(cls, c, ev.target.checked)
                                      }
                                    />
                                  </CTableDataCell>
                                  <CTableDataCell className="text-center">
                                    {absences > 0 ? (
                                      <span className="fw-semibold text-danger">
                                        {absences}
                                      </span>
                                    ) : (
                                      <span className="text-muted">0</span>
                                    )}
                                  </CTableDataCell>
                                </CTableRow>
                              )
                            })}
                          </CTableBody>
                        </CTable>
                      )}
                    </CCardBody>
                  </CCard>
                )
              })
            )}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default Presence
