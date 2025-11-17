import React from 'react'
import CIcon from '@coreui/icons-react'
import {
  cilBell,
  cilCalculator,
  cilChartPie,
  cilCursor,
  cilDescription,
  cilDrop,
  cilExternalLink,
  cilNotes,
  cilPencil,
  cilPuzzle,
  cilSpeedometer,
  cilStar,
} from '@coreui/icons'
import { CNavGroup, CNavItem, CNavTitle } from '@coreui/react'

const _nav = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    badge: {
      color: 'info',
      text: 'NEW',
    },
  },
  // ---- ΔΙΑΧΕΙΡΙΣΗ ΜΕΛΩΝ ----
  {
    component: CNavTitle,
    name: 'Μέλη',
    
  },
  {
    component: CNavItem,
    name: 'Λίστα Μελών',
    
  },
  {
    component: CNavItem,
    name: 'Αιτήσεις Εγγραφής',
    
  },

  // ---- ΟΙΚΟΝΟΜΙΚΑ ----
  {
    component: CNavTitle,
    name: 'Οικονομικά',
  },
  {
    component: CNavItem,
    name: 'Συνδρομές / Έσοδα',
   
  },
  {
    component: CNavItem,
    name: 'Έξοδα',
    
  },
  {
    component: CNavItem,
    name: 'Αναφορές',
    
  },

  // ---- ΟΡΓΑΝΩΣΗ ----
  {
    component: CNavTitle,
    name: 'Οργάνωση',
  },
  {
    component: CNavItem,
    name: 'Παρουσίες',
    
  },
  {
    component: CNavItem,
    name: 'Ανακοινώσεις',
   
  },
  {
    component: CNavItem,
    name: 'Χορηγοί / Banners',
    
  },
 
]

export default _nav
