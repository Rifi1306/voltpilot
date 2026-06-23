'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { LangCode, T, SUPPORTED_LANGS, translations, detectLang } from './translations'
import { formatCurrency as fmt } from '@/lib/utils'

interface LanguageContextValue {
  lang: LangCode
  setLang: (l: LangCode) => void
  t: T
  dir: 'ltr' | 'rtl'
  locale: string
  currency: string
  formatCurrency: (amount: number) => string
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  t: translations.en,
  dir: 'ltr',
  locale: 'en-GB',
  currency: 'GBP',
  formatCurrency: (n) => fmt(n, 'en-GB', 'GBP'),
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>('en')

  useEffect(() => {
    setLangState(detectLang())
  }, [])

  const setLang = (l: LangCode) => {
    localStorage.setItem('voltpilot_lang', l)
    setLangState(l)
  }

  const meta = SUPPORTED_LANGS.find(m => m.code === lang) ?? SUPPORTED_LANGS[1]

  return (
    <LanguageContext.Provider value={{
      lang, setLang, t: translations[lang], dir: meta.dir, locale: meta.locale,
      currency: meta.currency,
      formatCurrency: (n) => fmt(n, meta.locale, meta.currency),
    }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
