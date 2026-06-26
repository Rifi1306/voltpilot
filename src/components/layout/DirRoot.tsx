'use client'
import { useLanguage } from '@/i18n/LanguageContext'

export function DirRoot({ children }: { children: React.ReactNode }) {
  const { dir } = useLanguage()
  return (
    <div dir={dir} className="flex min-h-screen space-ambient">
      {children}
    </div>
  )
}
