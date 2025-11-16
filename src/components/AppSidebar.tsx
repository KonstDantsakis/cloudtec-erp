// src/components/AppSidebar.tsx
import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
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

// --- Redux typings (adjust to your store slice if you have one)
type RootState = {
  sidebarUnfoldable: boolean
  sidebarShow: boolean
}

const AppSidebar: React.FC = () => {
  const dispatch = useDispatch()
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
      <AppSidebarNav items={navigation} />

      <CSidebarFooter className="border-top d-none d-lg-flex">
        <CSidebarToggler onClick={handleToggleUnfoldable} />
      </CSidebarFooter>
    </CSidebar>
  )
}

export default React.memo(AppSidebar)
