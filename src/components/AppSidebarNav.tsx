// src/components/AppSidebarNav.tsx
import React from 'react'
import { NavLink } from 'react-router-dom'
import SimpleBar from 'simplebar-react'
import 'simplebar-react/dist/simplebar.min.css'

import { CBadge, CNavLink, CSidebarNav } from '@coreui/react'

/** ─────────────────────────────────────────────
 * Types for your navigation config
 * Adjust if your _nav.ts exports stricter shapes.
 * ────────────────────────────────────────────*/
type NavBadge = {
  color?: string
  text: string
}

type BaseNavItem = {
  component: React.ElementType
  name?: React.ReactNode
  icon?: React.ReactNode
  badge?: NavBadge
  to?: string
  href?: string
  items?: NavItem[] // group children
  // allow extra CoreUI props (e.g., 'compact', 'toggler', etc.)
  [key: string]: unknown
}

export type NavItem = BaseNavItem

type Props = {
  items: NavItem[]
}

export const AppSidebarNav: React.FC<Props> = ({ items }) => {
  const navLink = (
    name?: React.ReactNode,
    icon?: React.ReactNode,
    badge?: NavBadge,
    indent: boolean = false,
  ) => {
    return (
      <>
        {icon
          ? icon
          : indent && (
              <span className="nav-icon">
                <span className="nav-icon-bullet"></span>
              </span>
            )}
        {name}
        {badge && (
          <CBadge color={badge.color} className="ms-auto" size="sm">
            {badge.text}
          </CBadge>
        )}
      </>
    )
  }

  const navItem = (item: NavItem, index: number, indent: boolean = false) => {
    const { component, name, badge, icon, ...rest } = item
    const Component = component as React.ElementType

    const hasLink = Boolean((rest as any).to || (rest as any).href)
    const linkProps =
      (rest as any).href
        ? { target: '_blank', rel: 'noopener noreferrer' as const }
        : (rest as any).to
        ? { as: NavLink }
        : {}

    return (
      <Component as="div" key={`${(rest as any).to ?? (rest as any).href ?? index}`}>
        {hasLink ? (
          <CNavLink {...linkProps} {...(rest as object)}>
            {navLink(name, icon, badge, indent)}
          </CNavLink>
        ) : (
          navLink(name, icon, badge, indent)
        )}
      </Component>
    )
  }

  const navGroup = (item: NavItem, index: number) => {
    const { component, name, icon, items: children, ...rest } = item
    const Component = component as React.ElementType

    return (
      <Component
        compact
        as="div"
        key={`${(rest as any).to ?? (rest as any).href ?? `group-${index}`}`}
        toggler={navLink(name, icon)}
        {...(rest as object)}
      >
        {children?.map((child, i) =>
          child.items ? navGroup(child, i) : navItem(child, i, true),
        )}
      </Component>
    )
  }

  return (
    <CSidebarNav as={SimpleBar}>
      {items?.map((item, index) => (item.items ? navGroup(item, index) : navItem(item, index)))}
    </CSidebarNav>
  )
}

export default AppSidebarNav
