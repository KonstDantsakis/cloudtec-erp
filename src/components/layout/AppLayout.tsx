import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useAuth } from '../../features/auth/AuthContext'
import { useLocale } from '../../context/LocaleContext'
import { labels } from '../../locales/labels'

export function AppLayout() {
  const { user, logout, companyName } = useAuth()
  const { locale, toggle } = useLocale()
  const l = labels[locale]

  return (
    <div className="layout">
      <Sidebar />
      <main className="content">
        <header className="topbar">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              {l.loggedAs}: <strong style={{ color: '#0f172a' }}>{user?.email}</strong>
            </span>
            {companyName && (
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {l.companyLabel}: <strong style={{ color: '#0f172a' }}>{companyName}</strong>
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button onClick={toggle} style={langBtn}>
              {locale === 'en' ? 'EN' : 'ΕΛ'}
            </button>
            <button onClick={() => logout()}>{l.logout}</button>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  )
}

const langBtn: React.CSSProperties = {
  background: '#f1f5f9',
  border: '1px solid #cbd5e1',
  borderRadius: '.4rem',
  padding: '.3rem .65rem',
  cursor: 'pointer',
  fontWeight: 600,
  fontSize: '.85rem',
}
