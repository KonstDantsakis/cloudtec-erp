// src/components/AppBreadcrumb.tsx
import React from 'react'
import { useLocation } from 'react-router-dom'
import { CBreadcrumb, CBreadcrumbItem } from '@coreui/react'

// If your routes file already exports a type, import that instead.
// This minimal type is enough for breadcrumbs:
type AppRoute = {
  path: string
  name?: string
  // allow extra fields without complaining
  [key: string]: unknown
}

// Import your routes (must be an array of objects with at least `path` and optional `name`)
import routes from '../routes' // ensure this is typed as AppRoute[] (see note below)

// If your routes file is JS and untyped, you can cast it once here:
const typedRoutes = routes as AppRoute[]

type Breadcrumb = {
  pathname: string
  name: string
  active: boolean
}

const AppBreadcrumb: React.FC = () => {
  const location = useLocation()
  const currentLocation = location.pathname

  const getRouteName = (pathname: string, list: AppRoute[]): string | false => {
    const currentRoute = list.find((route) => route.path === pathname)
    return currentRoute?.name ?? false
  }

  const getBreadcrumbs = (path: string): Breadcrumb[] => {
    const crumbs: Breadcrumb[] = []
    // ensure leading slash; split and build cumulatively
    const safePath = path.startsWith('/') ? path : `/${path}`

    safePath
      .split('/')
      .filter(Boolean) // remove empty segments
      .reduce((prev, curr, index, array) => {
        const currentPathname = `${prev}/${curr}`
        const routeName = getRouteName(currentPathname, typedRoutes)
        if (routeName) {
          crumbs.push({
            pathname: currentPathname,
            name: routeName,
            active: index + 1 === array.length,
          })
        }
        return currentPathname
      }, '')

    return crumbs
  }

  const breadcrumbs = getBreadcrumbs(currentLocation)

  return (
    <CBreadcrumb className="my-0">
      <CBreadcrumbItem href="/">Home</CBreadcrumbItem>
      {breadcrumbs.map((bc) => (
        <CBreadcrumbItem
          key={bc.pathname}
          {...(bc.active ? { active: true } : { href: bc.pathname })}
        >
          {bc.name}
        </CBreadcrumbItem>
      ))}
    </CBreadcrumb>
  )
}

export default React.memo(AppBreadcrumb)
