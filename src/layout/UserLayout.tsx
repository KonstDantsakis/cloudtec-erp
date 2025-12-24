// src/layout/UserLayout.tsx
import React from 'react'
import { AppContent, AppSidebar, AppFooter, AppHeader } from '../components'
import UserDashboard from '../views/user/UserDashboard'

const UserLayout: React.FC = () => {
  return (
    <div>
      <AppSidebar />
      <div className="wrapper d-flex flex-column min-vh-100">
        <AppHeader />
        <div className="body flex-grow-1">
          {/* Εδώ αντί για AppContent βάζουμε το UserDashboard */}
          <UserDashboard />
        </div>
        <AppFooter />
      </div>
    </div>
  )
}

export default UserLayout
