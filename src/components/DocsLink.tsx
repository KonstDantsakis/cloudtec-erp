// src/components/DocsLink.tsx
import React from 'react'
import { CLink } from '@coreui/react'

interface DocsLinkProps extends React.ComponentProps<typeof CLink> {
  href?: string
  name?: string
  text?: string
}

const DocsLink: React.FC<DocsLinkProps> = ({ href, name, text, ...rest }) => {
  const linkHref = name
    ? `https://coreui.io/react/docs/components/${name}`
    : href

  return (
    <div className="float-end">
      <CLink
        {...rest}
        href={linkHref}
        rel="noreferrer noopener"
        target="_blank"
        className="card-header-action"
      >
        <small className="text-body-secondary">{text || 'docs'}</small>
      </CLink>
    </div>
  )
}

export default React.memo(DocsLink)
