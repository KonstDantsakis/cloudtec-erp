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
  // DASHBOARD
  {
    component: CNavItem,
    name: 'Dashboard',
    to: 'dashboard', // <-- RELATIVE (not "/dashboard")
    badge: {
      color: 'info',
      text: 'NEW',
    },
    
  },

  // ΜΕΛΗ
  {
    component: CNavTitle,
    name: 'Μέλη',
  },
  {
    component: CNavItem,
    name: 'Λίστα Μελών',
    to: 'memberslist', // matches routes.js path
    
  },
  {
    component: CNavItem,
    name: 'Αιτήσεις Εγγραφής',
    to: 'subscriptions',
   
  },

  // ΟΙΚΟΝΟΜΙΚΑ
  {
    component: CNavTitle,
    name: 'Οικονομικά',
  },
  {
    component: CNavItem,
    name: 'Συνδρομές / Έσοδα',
    to: 'subscriptionsincome',
    
  },
  {
    component: CNavItem,
    name: 'Έξοδα',
    to: 'expenses',
    
  },
  {
    component: CNavItem,
    name: 'Αναφορές',
    to: 'reports',
    
  },

  // ΟΡΓΑΝΩΣΗ
  {
    component: CNavTitle,
    name: 'Οργάνωση',
  },
  {
    component: CNavItem,
    name: 'Παρουσίες',
    to: 'presence',
    
  },
  {
    component: CNavItem,
    name: 'Ανακοινώσεις',
    to: 'announcements',
    
  },
  {
    component: CNavItem,
    name: 'Χορηγοί / Banners',
    to: 'sponsorsbanners', // <-- FIXED typo: was "/ponsorsbanners"
    
  },
]

export default _nav
