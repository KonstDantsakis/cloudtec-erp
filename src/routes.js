import React from 'react'

const Dashboard = React.lazy(() => import('./views/dashboard/Dashboard'))
const MemberList = React.lazy(() => import('./views/members/MemberList'))
const Subscriptions = React.lazy(() => import('./views/members/Subscriptions'))
const SubscriptionsIncome = React.lazy(() => import('./views/financial/SubscriptionsIncome'))
const Expenses = React.lazy(() => import('./views/financial/Expenses'))
const Reports = React.lazy(() => import('./views/financial/Reports'))
const Presence = React.lazy(() => import('./views/organization/Presence'))
const Announcements = React.lazy(() => import('./views/organization/Announcements'))
const SponsorsBanners = React.lazy(() => import('./views/organization/SponsorsBanners'))
const Classes = React.lazy(() => import('./views/organization/Classes'))

const UserLayout = React.lazy(() => import('./layout/UserLayout.tsx'))





const routes = [
  { path: '/', exact: true, name: 'Home' },
  { path: 'dashboard', name: 'Dashboard', element: Dashboard },
  { path: 'memberslist', name: 'MemberList', element: MemberList },
  { path: 'subscriptions', name: 'Subscriptions', element: Subscriptions },
  { path: 'subscriptionsincome', name: 'SubscriptionsIncome', element: SubscriptionsIncome },
  { path: 'expenses', name: 'Expenses', element: Expenses },
  { path: 'reports', name: 'Reports', element: Reports },
  { path: 'presence', name: 'Presence', element: Presence },
  { path: 'announcements', name: 'Announcements', element: Announcements },
  { path: 'sponsorsbanners', name: 'SponsorsBanners', element: SponsorsBanners },
  { path: 'classescourses', name: 'Classes', element: Classes },

    { path: 'userdashboard', name: 'UserLayout', element: UserLayout },

]

export default routes
