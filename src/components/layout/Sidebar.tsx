import { NavLink } from 'react-router-dom'
import { labels } from '../../locales/labels'
import { useLocale } from '../../context/LocaleContext'

const links = [
  { to: '/', label: 'dashboard' },
  { to: '/customers', label: 'customers' },
  { to: '/products', label: 'products' },
  { to: '/invoices', label: 'invoices' },
  { to: '/expenses', label: 'expenses' },
  { to: '/tasks', label: 'tasks' },
  { to: '/reports', label: 'reports' },
] as const

export function Sidebar() {
  const { locale } = useLocale()
  const l = labels[locale]

  return (
    <aside className="sidebar">
      <h2>{l.appTitle}</h2>
      <nav>
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.to === '/'}>
            {l[link.label]}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
