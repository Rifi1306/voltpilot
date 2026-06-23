'use client'
import { DevisStatus } from '@/lib/types'
import { getStatusColor } from '@/lib/utils'
import { useLanguage } from '@/i18n/LanguageContext'

interface StatusBadgeProps {
  status: DevisStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useLanguage()
  const label = t.status[status as keyof typeof t.status] ?? status
  return (
    <span className={`badge ${getStatusColor(status)}`}>
      {label}
    </span>
  )
}

interface BadgeProps {
  children: React.ReactNode
  className?: string
}

export function Badge({ children, className = '' }: BadgeProps) {
  return (
    <span className={`badge bg-slate-100 text-slate-700 ${className}`}>
      {children}
    </span>
  )
}
