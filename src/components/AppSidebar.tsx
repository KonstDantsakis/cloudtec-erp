// src/components/AppSidebar.tsx
import React, { useMemo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useLocation } from 'react-router-dom'
import {
  CCloseButton,
  CSidebar,
  CSidebarBrand,
  CSidebarFooter,
  CSidebarHeader,
  CSidebarToggler,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'

import { AppSidebarNav } from './AppSidebarNav'

import { logo } from 'src/assets/brand/logo'
import { sygnet } from 'src/assets/brand/sygnet'

// sidebar nav config
import navigation from '../_nav'
import { useAuth } from '@/context/AuthContext'

// --- Redux typings (adjust to your store slice if you have one)
type RootState = {
  sidebarUnfoldable: boolean
  sidebarShow: boolean
}

const AppSidebar: React.FC = () => {
  const dispatch = useDispatch()
  const location = useLocation()
  const { profile } = useAuth()

  const unfoldable = useSelector<RootState, boolean>((state) => state.sidebarUnfoldable)
  const sidebarShow = useSelector<RootState, boolean>((state) => state.sidebarShow)

  const handleVisibleChange = (visible: boolean) => {
    dispatch({ type: 'set', sidebarShow: visible } as any)
  }

  const handleToggleUnfoldable = () => {
    dispatch({ type: 'set', sidebarUnfoldable: !unfoldable } as any)
  }

  const handleClose = () => {
    dispatch({ type: 'set', sidebarShow: false } as any)
  }

  // Decide if we're in /admin or /app
  const basePath = useMemo(() => {
    const path = location.pathname
    if (path.startsWith('/admin')) return '/admin'
    if (path.startsWith('/app')) return '/app'
    // fallback based on role
    if (profile?.role === 'admin') return '/admin'
    return '/app'
  }, [location.pathname, profile?.role])

  // Prefix each nav item's `to` with the base path
  const navigationWithBase = useMemo(
    () =>
      (navigation as any[]).map((item) => {
        if (!item || typeof item !== 'object') return item
        const to = (item as any).to
        if (!to || typeof to !== 'string') return item

        // If item already has an absolute path, leave it
        if (to.startsWith('/')) return item

        return { ...item, to: `${basePath}/${to}` }
      }),
    [basePath],
  )

  return (
    <CSidebar
      className="border-end"
      colorScheme="dark"
      position="fixed"
      unfoldable={unfoldable}
      visible={sidebarShow}
      onVisibleChange={handleVisibleChange}
    >
      <CSidebarHeader className="border-bottom">
        <CSidebarBrand href="/">
          <CIcon customClassName="sidebar-brand-full" icon={logo} height={32} />
          <CIcon customClassName="sidebar-brand-narrow" icon={sygnet} height={32} />
        </CSidebarBrand>

        <CCloseButton className="d-lg-none" dark onClick={handleClose} />
      </CSidebarHeader>

      {/* Sidebar navigation items */}
      <AppSidebarNav items={navigationWithBase} />

      <CSidebarFooter className="border-top d-none d-lg-flex">
        <CSidebarToggler onClick={handleToggleUnfoldable} />
      </CSidebarFooter>
    </CSidebar>
  )
}

export default React.memo(AppSidebar)
