import { NavLink } from 'react-router-dom'
import { labels, Locale } from '../../locales/labels'

const links = [
  { to: '/', label: 'dashboard' },
  { to: '/customers', label: 'customers' },
  { to: '/products', label: 'products' },
  { to: '/invoices', label: 'invoices' },
  { to: '/expenses', label: 'expenses' },
  { to: '/tasks', label: 'tasks' },
  { to: '/reports', label: 'reports' },
] as const

export function Sidebar({ locale }: { locale: Locale }) {
  return (
    <aside className="sidebar">
      <h2>{labels[locale].appTitle}</h2>
      <nav>
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} end={link.to === '/'}>
            {labels[locale][link.label]}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
