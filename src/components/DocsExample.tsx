// src/components/DocsExample.tsx
import React from 'react'
import { CNav, CNavItem, CNavLink, CTabContent, CTabPane } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilCode, cilMediaPlay } from '@coreui/icons'

interface DocsExampleProps {
  children?: React.ReactNode
  href: string
  tabContentClassName?: string
}

const DocsExample: React.FC<DocsExampleProps> = ({
  children,
  href,
  tabContentClassName = '',
}) => {
  const docsUrl = `https://coreui.io/react/docs/${href}`

  return (
    <div className="example">
      <CNav variant="underline-border">
        <CNavItem>
          <CNavLink href="#" active>
            <CIcon icon={cilMediaPlay} className="me-2" />
            Preview
          </CNavLink>
        </CNavItem>
        <CNavItem>
          <CNavLink href={docsUrl} target="_blank" rel="noopener noreferrer">
            <CIcon icon={cilCode} className="me-2" />
            Code
          </CNavLink>
        </CNavItem>
      </CNav>

      <CTabContent className={`rounded-bottom ${tabContentClassName}`}>
        <CTabPane className="p-3 preview" visible>
          {children}
        </CTabPane>
      </CTabContent>
    </div>
  )
}

export default React.memo(DocsExample)
