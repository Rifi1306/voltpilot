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
      style={{
        background: 'rgba(3, 5, 13, 0.82)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div>
        <h1
          className="text-lg font-bold"
          style={{ color: 'var(--nova)', letterSpacing: '-0.025em', fontFamily: "'Sora', sans-serif" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--star)' }}>
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--dust)' }}
          />
          <input
            type="text"
            placeholder={t.common.search}
            className="pl-8 pr-4 py-2 text-sm rounded-lg w-48 outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border-bright)',
              color: 'var(--nova)',
              fontSize: '13px',
            }}
            onFocus={e => {
              e.target.style.borderColor = 'var(--nebula)'
              e.target.style.boxShadow = '0 0 0 3px var(--nebula-glow)'
            }}
            onBlur={e => {
              e.target.style.borderColor = 'var(--border-bright)'
              e.target.style.boxShadow = 'none'
            }}
          />
        </div>

        {/* Notifications */}
        <button
          className="relative w-9 h-9 flex items-center justify-center rounded-lg transition-all"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border-bright)',
            color: 'var(--star)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
            e.currentTarget.style.color = 'var(--nova)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
            e.currentTarget.style.color = 'var(--star)'
          }}
        >
          <Bell size={14} />
        </button>

        {/* CTA */}
        {action && (
          <Link href={action.href} className="btn-primary">
            <Plus size={14} />
            {action.label}
          </Link>
        )}
      </div>
    </header>
  )
}
