'use client'
import { Bell, Search, Plus } from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/i18n/LanguageContext'

interface HeaderProps {
  title: string
  subtitle?: string
  action?: { label: string; href: string }
}

export function Header({ title, subtitle, action }: HeaderProps) {
  const { t } = useLanguage()

  return (
    <header
      className="px-6 py-4 flex items-center justify-between sticky top-0 z-10"
      style={{ background: 'rgba(244,245,247,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e4e7ec' }}
    >
      <div>
        <h1 className="text-lg font-bold" style={{ color: '#0d1117', letterSpacing: '-0.02em' }}>{title}</h1>
        {subtitle && <p className="text-sm mt-0.5" style={{ color: '#6b7280' }}>{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2.5">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9ca3af' }} />
          <input
            type="text"
            placeholder={t.common.search}
            className="pl-8 pr-4 py-2 text-sm rounded-lg w-52 transition-all outline-none"
            style={{ background: '#fff', border: '1.5px solid #e4e7ec', color: '#374151', fontSize: '13px' }}
            onFocus={(e) => { e.target.style.borderColor = '#22D3EE'; e.target.style.boxShadow = '0 0 0 3px rgba(34,211,238,0.1)' }}
            onBlur={(e) => { e.target.style.borderColor = '#e4e7ec'; e.target.style.boxShadow = 'none' }}
          />
        </div>

        {/* Notifications */}
        <button
          className="relative w-9 h-9 flex items-center justify-center rounded-lg transition-all"
          style={{ background: '#fff', border: '1.5px solid #e4e7ec', color: '#374151' }}
        >
          <Bell size={15} />
        </button>

        {/* CTA */}
        {action && (
          <Link href={action.href} className="btn-primary">
            <Plus size={15} />
            {action.label}
          </Link>
        )}
      </div>
    </header>
  )
}
