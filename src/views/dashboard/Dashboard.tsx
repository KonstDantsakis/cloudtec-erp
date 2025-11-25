// src/views/dashboard/Dashboard.tsx
import React, { useEffect, useMemo, useState } from 'react'
import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CImage,
  CRow,
  CSpinner,
} from '@coreui/react'
import { supabase } from '@/lib/supabaseClient'

type Sponsor = {
  id: string
  name: string
  logo_url: string | null
  link_url: string | null
  position: number | null
}

type Announcement = {
  id: string
  title: string
  message: string
  created_at: string
  is_active: boolean
  classes?: {
    id: string
    title: string | null
  }[] | null      
}


type IncomeRow = {
  amount_cents: number | null
  status: string | null
}

type ExpenseRow = {
  amount_cents: number | null
}

type Stats = {
  activeMembers: number
  paidSubscriptions: number
  totalIncome: number // σε €
  totalExpenses: number // σε €
}

const Dashboard: React.FC = () => {
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [stats, setStats] = useState<Stats>({
    activeMembers: 0,
    paidSubscriptions: 0,
    totalIncome: 0,
    totalExpenses: 0,
  })

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat('el-GR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
      }),
    [],
  )

  // -------- LOAD DATA --------

  const loadSponsors = async () => {
    const { data, error } = await supabase
      .from('sponsors')
      .select('id, name, logo_url, link_url, position, is_active')
      .eq('is_active', true)
      .order('position', { ascending: true, nullsFirst: true })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Dashboard] sponsors error:', error.message)
      throw new Error('Σφάλμα φόρτωσης χορηγών')
    }

    setSponsors(
      (data ?? []).map((s: any) => ({
        id: s.id,
        name: s.name,
        logo_url: s.logo_url,
        link_url: s.link_url,
        position: s.position,
      })),
    )
  }

  const loadAnnouncements = async () => {
    const { data, error } = await supabase
      .from('announcements')
      .select(
        `
        id,
        title,
        message,
        created_at,
        is_active,
        classes ( id, title )
      `,
      )
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      console.error('[Dashboard] announcements error:', error.message)
      throw new Error('Σφάλμα φόρτωσης ανακοινώσεων')
    }

    setAnnouncements((data ?? []) as Announcement[])
  }

  const loadStats = async () => {
    // Ενεργά μέλη – προσαρμόζεις το status αν χρησιμοποιείς άλλο string
    const { count: activeCount, error: activeErr } = await supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'Ενεργός')

    if (activeErr) {
      console.error('[Dashboard] active members error:', activeErr.message)
      throw new Error('Σφάλμα φόρτωσης ενεργών μελών')
    }

    // Έσοδα (subscriptions) – φέρνουμε όλα και κάνουμε sum client-side
    const { data: incomeRows, error: incomeErr } = await supabase
      .from('incomes')
      .select('amount_cents, status')

    if (incomeErr) {
      console.error('[Dashboard] incomes error:', incomeErr.message)
      throw new Error('Σφάλμα φόρτωσης εσόδων')
    }

    const incomes = (incomeRows ?? []) as IncomeRow[]

    const totalIncomeCents = incomes.reduce(
      (sum, row) => sum + (row.amount_cents ?? 0),
      0,
    )
    const paidSubscriptions = incomes.filter((r) => r.status === 'paid').length

    // Έξοδα
    const { data: expenseRows, error: expenseErr } = await supabase
      .from('expenses')
      .select('amount_cents')

    if (expenseErr) {
      console.error('[Dashboard] expenses error:', expenseErr.message)
      throw new Error('Σφάλμα φόρτωσης εξόδων')
    }

    const expenses = (expenseRows ?? []) as ExpenseRow[]
    const totalExpenseCents = expenses.reduce(
      (sum, row) => sum + (row.amount_cents ?? 0),
      0,
    )

    setStats({
      activeMembers: activeCount ?? 0,
      paidSubscriptions,
      totalIncome: totalIncomeCents / 100,
      totalExpenses: totalExpenseCents / 100,
    })
  }

  const loadAll = async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([loadSponsors(), loadAnnouncements(), loadStats()])
    } catch (err: any) {
      setError(err?.message ?? 'Προέκυψε σφάλμα κατά τη φόρτωση των δεδομένων.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAll()
  }, [])

  // -------- RENDER HELPERS --------

  const renderSponsorsRow = () => {
    if (sponsors.length === 0) {
      return (
        <div className="text-muted small">
          Δεν υπάρχουν ενεργοί χορηγοί. Πρόσθεσε από τη σελίδα “Χορηγοί / Banners”.
        </div>
      )
    }

    return (
      <div className="d-flex flex-wrap align-items-center gap-4">
        {sponsors.map((s) => (
          <div
            key={s.id}
            className="d-flex align-items-center gap-2 px-3 py-2 rounded"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(148,163,184,0.25)',
            }}
          >
            {s.logo_url ? (
              <CImage
                src={s.logo_url}
                alt={s.name}
                style={{ maxHeight: 32, maxWidth: 80, objectFit: 'contain' }}
              />
            ) : (
              <div
                className="d-flex align-items-center justify-content-center rounded"
                style={{
                  width: 48,
                  height: 32,
                  background: 'rgba(15,23,42,0.4)',
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: 0.06,
                }}
              >
                Logo
              </div>
            )}

            {s.link_url ? (
              <a
                href={s.link_url}
                target="_blank"
                rel="noreferrer"
                className="fw-semibold text-decoration-none"
              >
                {s.name}
              </a>
            ) : (
              <span className="fw-semibold">{s.name}</span>
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderAnnouncementsList = () => {
  if (announcements.length === 0) {
    return <div className="text-muted small">Δεν υπάρχουν ενεργές ανακοινώσεις.</div>
  }

  return (
    <ul className="list-unstyled mb-0">
      {announcements.map((a) => {
        const firstClassTitle = a.classes && a.classes.length > 0 ? a.classes[0].title : null

        return (
          <li key={a.id} className="mb-3 pb-3 border-bottom border-secondary">
            <div className="d-flex justify-content-between align-items-start mb-1">
              <div className="fw-semibold">{a.title}</div>
              <div className="small text-muted ms-3 text-end">
                {new Date(a.created_at).toLocaleString('el-GR', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
                {firstClassTitle && (
                  <>
                    <br />
                    <span className="text-info">{firstClassTitle}</span>
                  </>
                )}
              </div>
            </div>
            <div style={{ whiteSpace: 'pre-line' }}>{a.message}</div>
          </li>
        )
      })}
    </ul>
  )
}


  // -------- RENDER --------

  if (loading) {
    return (
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardBody className="text-center py-5">
              <CSpinner />
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    )
  }

  return (
    <>
      <CRow>
        <CCol xs={12}>
          <CCard className="mb-4">
            <CCardHeader>
              <strong>Χορηγοί</strong>
            </CCardHeader>
            <CCardBody>{renderSponsorsRow()}</CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow>
        <CCol md={7}>
          <CCard className="mb-4 h-100">
            <CCardHeader className="d-flex justify-content-between align-items-center">
              <strong>Ανακοινώσεις</strong>
              <CButton
                color="link"
                size="sm"
                className="px-0 text-decoration-none"
                href="#/admin/dashboard/announcements"
              >
                Προβολή όλων
              </CButton>
            </CCardHeader>
            <CCardBody>{renderAnnouncementsList()}</CCardBody>
          </CCard>
        </CCol>

        <CCol md={5}>
          <CRow>
            <CCol xs={12}>
              <CCard className="mb-3">
                <CCardBody>
                  <div className="text-muted small mb-1">Ενεργά μέλη</div>
                  <div className="d-flex align-items-baseline justify-content-between">
                    <div className="display-6 fw-semibold">{stats.activeMembers}</div>
                    <CBadge color="success" shape="rounded-pill">
                      Μέλη
                    </CBadge>
                  </div>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol xs={12}>
              <CCard className="mb-3">
                <CCardBody>
                  <div className="text-muted small mb-1">
                    Πληρωμένες συνδρομές (συνολικά)
                  </div>
                  <div className="d-flex align-items-baseline justify-content-between">
                    <div className="display-6 fw-semibold">
                      {stats.paidSubscriptions}
                    </div>
                    <CBadge color="info" shape="rounded-pill">
                      Συνδρομές
                    </CBadge>
                  </div>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol xs={12}>
              <CCard className="mb-3">
                <CCardBody>
                  <div className="text-muted small mb-1">Συνολικά έσοδα</div>
                  <div className="d-flex align-items-baseline justify-content-between">
                    <div className="h3 fw-semibold">
                      {currencyFormatter.format(stats.totalIncome)}
                    </div>
                    <CBadge color="success" shape="rounded-pill">
                      Έσοδα
                    </CBadge>
                  </div>
                </CCardBody>
              </CCard>
            </CCol>

            <CCol xs={12}>
              <CCard className="mb-3">
                <CCardBody>
                  <div className="text-muted small mb-1">Συνολικά έξοδα</div>
                  <div className="d-flex align-items-baseline justify-content-between">
                    <div className="h3 fw-semibold">
                      {currencyFormatter.format(stats.totalExpenses)}
                    </div>
                    <CBadge color="danger" shape="rounded-pill">
                      Έξοδα
                    </CBadge>
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        </CCol>
      </CRow>

      {error && (
        <CRow className="mt-2">
          <CCol xs={12}>
            <div className="text-danger small">{error}</div>
          </CCol>
        </CRow>
      )}
    </>
  )
}

export default Dashboard
