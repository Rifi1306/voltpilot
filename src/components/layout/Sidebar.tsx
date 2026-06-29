'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, FileText, Users, Settings, LogOut, BarChart3, Zap, Globe, Folder,
  Package, Receipt,
} from 'lucide-react'
import { signOutAction, getProfile } from '@/lib/actions/profile'
import { useLanguage } from '@/i18n/LanguageContext'
import { SUPPORTED_LANGS, LangCode } from '@/i18n/translations'

export function Sidebar() {
  const pathname = usePathname()
  const { t, lang, setLang } = useLanguage()
  const [langOpen, setLangOpen] = useState(false)
  const [companyName, setCompanyName] = useState<string | null>(null)

  useEffect(() => {
    getProfile().then(p => { if (p?.nom) setCompanyName(p.nom) })
  }, [])

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: t.nav.dashboard },
    { href: '/devis',     icon: FileText,        label: t.nav.quotes },
    { href: '/factures',  icon: Receipt,         label: 'Factures' },
    { href: '/catalogue', icon: Package,         label: 'Catalogue' },
    { href: '/clients',   icon: Users,           label: t.nav.clients },
    { href: '/dossiers',  icon: Folder,          label: t.nav.folders },
    { href: '/leads',     icon: Zap,             label: t.nav.leads },
    { href: '/analytics', icon: BarChart3,       label: t.nav.analytics },
    { href: '/settings',  icon: Settings,        label: t.nav.settings },
  ]

  const currentLang = SUPPORTED_LANGS.find(l => l.code === lang)

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className="hidden md:flex w-[230px] min-h-screen flex-col py-4 flex-shrink-0 relative"
        style={{
          background: 'rgba(4, 6, 16, 0.95)',
          borderRight: '1px solid var(--border-dim)',
        }}
      >
        {/* Nebula top glow */}
        <div
          className="absolute top-0 left-0 right-0 h-48 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 100% 60% at 50% -10%, rgba(124,58,237,0.18) 0%, transparent 70%)',
          }}
        />

        {/* Logo */}
        <div className="px-4 mb-6 relative">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.svg" alt="VoltPilot" width={34} height={34} className="flex-shrink-0" />
            <span
              className="text-white font-bold text-base"
              style={{ letterSpacing: '-0.02em', fontFamily: "'Sora', sans-serif" }}
            >
              VoltPilot
            </span>
          </div>
        </div>

        <div className="mx-4 mb-4" style={{ height: '1px', background: 'var(--border-dim)' }} />

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 relative">
          <p
            className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-2"
            style={{ color: 'var(--dust)' }}
          >
            Navigation
          </p>
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href} className={`sidebar-item ${active ? 'active' : ''}`}>
                <Icon size={15} />
                <span>{label}</span>
                {active && (
                  <span
                    className="ml-auto w-1.5 h-1.5 rounded-full"
                    style={{ background: 'var(--solar)' }}
                  />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Language selector */}
        <div className="px-3 pb-3 relative">
          <button
            onClick={() => setLangOpen(o => !o)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-left"
            style={{
              background: 'rgba(255,255,255,0.03)',
              color: 'var(--star)',
              border: '1px solid var(--border-dim)',
            }}
          >
            <Globe size={13} />
            <span className="text-xs font-medium flex-1">{currentLang?.flag} {currentLang?.label}</span>
          </button>
          {langOpen && (
            <div
              className="absolute bottom-full left-3 right-3 mb-1 rounded-xl overflow-hidden shadow-2xl z-50"
              style={{ background: '#07091f', border: '1px solid var(--border-nebula)' }}
            >
              {SUPPORTED_LANGS.map(l => (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code as LangCode); setLangOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left transition-all hover:bg-white/5"
                  style={{
                    color: l.code === lang ? 'var(--nebula-bright)' : 'var(--star)',
                    fontSize: '12px',
                  }}
                >
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bottom user card */}
        <div className="px-3 pt-3" style={{ borderTop: '1px solid var(--border-dim)' }}>
          <div
            className="flex items-center gap-2.5 px-2 py-2.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-dim)' }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, var(--nebula), var(--indigo))' }}
            >
              VP
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: 'var(--nova)' }}>
                {companyName ?? 'Mon Entreprise'}
              </p>
              <p className="text-[10px] truncate" style={{ color: 'var(--dust)' }}>Admin</p>
            </div>
            <form action={signOutAction}>
              <button
                type="submit"
                title="Se déconnecter"
                className="transition-colors"
                style={{ color: 'var(--dust)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--nova)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--dust)')}
              >
                <LogOut size={13} />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* ── Mobile bottom nav ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around px-2 py-2"
        style={{
          background: 'rgba(4, 6, 16, 0.96)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--border-dim)',
          paddingBottom: 'env(safe-area-inset-bottom, 8px)',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
        }}
      >
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all"
              style={{ minWidth: '44px', minHeight: '44px', justifyContent: 'center' }}
            >
              {active && (
                <span
                  className="absolute w-8 h-8 rounded-xl"
                  style={{ background: 'rgba(124,58,237,0.15)' }}
                />
              )}
              <Icon
                size={20}
                style={{ color: active ? 'var(--nebula-bright)' : 'var(--star)', position: 'relative' }}
              />
              <span
                className="text-[9px] font-medium leading-tight"
                style={{
                  color: active ? 'var(--nebula-bright)' : 'var(--dust)',
                  position: 'relative',
                }}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
