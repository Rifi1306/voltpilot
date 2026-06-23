'use client'
import { useLanguage } from '@/i18n/LanguageContext'

export function DirRoot({ children }: { children: React.ReactNode }) {
  const { dir } = useLanguage()
  return (
    <div dir={dir} className="flex min-h-screen" style={{ background: '#f8f9fc' }}>
      {children}
    </div>
  )
}
