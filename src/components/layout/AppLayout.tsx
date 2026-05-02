import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Locale } from '../../locales/labels'
import { useAuth } from '../../features/auth/AuthContext'

export function AppLayout({ locale }: { locale: Locale }) {
  const { user, logout } = useAuth()

  return (
    <div className="layout">
      <Sidebar locale={locale} />
      <main className="content">
        <header className="topbar">
          <div>
            <strong>{user?.full_name}</strong>
            <p>{user?.role}</p>
          </div>
          <button onClick={() => logout()}>Logout</button>
        </header>
        <Outlet />
      </main>
    </div>
  )
}
