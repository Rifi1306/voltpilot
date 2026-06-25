'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, FileText, Users, Settings, LogOut, BarChart3, Zap, Globe, Folder,
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
        className="hidden md:flex w-[230px] min-h-screen flex-col py-4 flex-shrink-0"
        style={{ background: '#080b14', borderRight: '1px solid rgba(255,255,255,0.05)' }}
      >
        {/* Logo */}
        <div className="px-4 mb-6">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.svg" alt="VoltPilot" width={34} height={34} className="flex-shrink-0" />
            <span className="text-white font-bold text-base tracking-tight">VoltPilot</span>
          </div>
        </div>

        <div className="mx-4 mb-4" style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5">
          <p className="text-xs font-semibold uppercase tracking-widest px-3 mb-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Navigation
          </p>
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link key={href} href={href} className={`sidebar-item ${active ? 'active' : ''}`}>
                <Icon size={16} />
                <span>{label}</span>
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: '#FACC15' }} />
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
            style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)' }}
          >
            <Globe size={14} />
            <span className="text-xs font-medium flex-1">{currentLang?.flag} {currentLang?.label}</span>
          </button>
          {langOpen && (
            <div
              className="absolute bottom-full left-3 right-3 mb-1 rounded-xl overflow-hidden shadow-xl z-50"
              style={{ background: '#0f1420', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {SUPPORTED_LANGS.map(l => (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code as LangCode); setLangOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left transition-all hover:bg-white/5"
                  style={{ color: l.code === lang ? '#22D3EE' : 'rgba(255,255,255,0.6)', fontSize: '12px' }}
                >
                  <span>{l.flag}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bottom */}
        <div className="px-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-2.5 px-2 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #22D3EE, #06B6D4)' }}
            >
              VP
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{companyName ?? 'Mon Entreprise'}</p>
              <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>Admin</p>
            </div>
            <form action={signOutAction}>
              <button
                type="submit"
                title="Se déconnecter"
                className="transition-colors hover:text-white"
                style={{ color: 'rgba(255,255,255,0.25)' }}
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
          background: '#080b14',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: 'env(safe-area-inset-bottom, 8px)',
        }}
      >
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all"
              style={{ minWidth: '44px' }}
            >
              <Icon
                size={20}
                style={{ color: active ? '#22D3EE' : 'rgba(255,255,255,0.35)' }}
              />
              <span
                className="text-[9px] font-medium leading-tight"
                style={{ color: active ? '#22D3EE' : 'rgba(255,255,255,0.35)' }}
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
