import { createContext, useContext, useState, ReactNode } from 'react'
import { Locale } from '../locales/labels'

interface LocaleCtx {
  locale: Locale
  toggle: () => void
}

const LocaleContext = createContext<LocaleCtx>({ locale: 'en', toggle: () => {} })

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en')
  const toggle = () => setLocale((l) => (l === 'en' ? 'el' : 'en'))
  return <LocaleContext.Provider value={{ locale, toggle }}>{children}</LocaleContext.Provider>
}

export const useLocale = () => useContext(LocaleContext)
