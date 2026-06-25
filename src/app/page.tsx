import Link from 'next/link'
import Image from 'next/image'
import { CheckCircle, ArrowRight, FileText, Users, BarChart3, TrendingUp, Clock, Zap } from 'lucide-react'
import { PricingSection } from '@/components/PricingSection'

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: '#060912', fontFamily: 'var(--font-geist-sans)' }}>

      {/* ── NAV ───────────────────────────────────── */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto relative z-20">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.svg" alt="VoltPilot" width={36} height={36} />
          <span className="text-white font-bold text-lg tracking-tight">VoltPilot</span>
        </div>

        <div className="hidden md:flex items-center gap-7">
          <a href="#fonctionnalites" style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px' }} className="hover:text-white transition-colors">Fonctionnalités</a>
          <a href="#tarifs" style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px' }} className="hover:text-white transition-colors">Tarifs</a>
          <a href="#contact" style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px' }} className="hover:text-white transition-colors">Contact</a>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', fontWeight: '500' }} className="hover:text-white transition-colors">
            Connexion
          </Link>
          <Link href="/register" className="px-4 py-2 rounded-lg text-sm font-bold text-white transition-all" style={{ background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)', boxShadow: '0 0 20px rgba(14,165,233,0.35)' }}>
            Essai gratuit
          </Link>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ minHeight: '92vh', display: 'flex', alignItems: 'center' }}>

        {/* 3D Solar panel array — background */}
        <div className="absolute inset-0 flex items-center justify-end pr-0 pointer-events-none" style={{ overflow: 'hidden' }}>
          <div
            style={{
              width: '640px',
              height: '540px',
              position: 'relative',
              transform: 'perspective(900px) rotateX(52deg) rotateZ(-18deg)',
              transformStyle: 'preserve-3d',
              opacity: 0.55,
              right: '-80px',
              marginTop: '40px',
            }}
          >
            {/* 5 × 6 grid of solar panels */}
            {Array.from({ length: 30 }).map((_, i) => {
              const col = i % 6
              const row = Math.floor(i / 6)
              const delay = `${(col * 0.12 + row * 0.08).toFixed(2)}s`
              const intensity = Math.random() > 0.65
              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${col * 108}px`,
                    top: `${row * 108}px`,
                    width: '100px',
                    height: '100px',
                    borderRadius: '6px',
                    background: intensity
                      ? 'linear-gradient(135deg, #1a3a6b 0%, #1e4d92 50%, #1a3a6b 100%)'
                      : 'linear-gradient(135deg, #0f2545 0%, #1a3a6b 50%, #0f2545 100%)',
                    border: '1px solid rgba(99,149,255,0.2)',
                    boxShadow: intensity ? '0 0 20px rgba(99,149,255,0.15), inset 0 0 30px rgba(99,149,255,0.05)' : 'none',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gridTemplateRows: 'repeat(4, 1fr)',
                    gap: '2px',
                    padding: '4px',
                    animationName: intensity ? 'panelPulse' : 'none',
                    animationDuration: '3s',
                    animationDelay: delay,
                    animationIterationCount: 'infinite',
                    animationTimingFunction: 'ease-in-out',
                  }}
                >
                  {Array.from({ length: 16 }).map((_, j) => (
                    <div
                      key={j}
                      style={{
                        background: intensity && j % 5 === 0
                          ? 'rgba(14,165,233,0.4)'
                          : 'rgba(99,149,255,0.08)',
                        borderRadius: '1px',
                        transition: 'background 0.3s',
                      }}
                    />
                  ))}
                  {/* horizontal lines */}
                  {[33, 50, 67].map(pct => (
                    <div key={pct} style={{ position: 'absolute', left: '4px', right: '4px', top: `${pct}%`, height: '1px', background: 'rgba(99,149,255,0.12)' }} />
                  ))}
                  {[33, 50, 67].map(pct => (
                    <div key={pct} style={{ position: 'absolute', top: '4px', bottom: '4px', left: `${pct}%`, width: '1px', background: 'rgba(99,149,255,0.12)' }} />
                  ))}
                </div>
              )
            })}
          </div>

          {/* Energy glow */}
          <div style={{ position: 'absolute', right: '15%', top: '30%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)', filter: 'blur(20px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', right: '25%', top: '50%', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,149,255,0.1) 0%, transparent 70%)', filter: 'blur(30px)', pointerEvents: 'none' }} />
        </div>

        {/* Radial bg glow */}
        <div style={{ position: 'absolute', left: '-10%', top: '20%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 60%)', pointerEvents: 'none' }} />

        {/* Hero text */}
        <div className="relative z-10 max-w-7xl mx-auto px-8 w-full">
          <div style={{ maxWidth: '580px' }}>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-7 text-xs font-semibold"
              style={{ background: 'rgba(14,165,233,0.1)', color: '#0ea5e9', border: '1px solid rgba(14,165,233,0.2)' }}
            >
              <Zap size={12} /> Logiciel de devis pour installateurs solaires
            </div>

            <h1
              className="font-black mb-5 leading-[1.05]"
              style={{ fontSize: 'clamp(42px, 6vw, 72px)', color: '#ffffff', letterSpacing: '-0.03em' }}
            >
              Vos devis solaires,{' '}
              <span style={{ background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                créés en 2 min
              </span>
            </h1>

            <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, marginBottom: '36px', maxWidth: '440px' }}>
              Catalogue photovoltaïque intégré. Calcul automatique TVA & remises. Export PDF professionnel. Gérez vos clients depuis un seul outil.
            </p>

            <div className="flex items-center gap-4 flex-wrap mb-10">
              <Link
                href="/register"
                className="flex items-center gap-2 font-bold text-white rounded-xl transition-all"
                style={{ background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)', padding: '13px 24px', fontSize: '15px', boxShadow: '0 4px 24px rgba(14,165,233,0.4)', letterSpacing: '-0.01em' }}
              >
                Démarrer gratuitement <ArrowRight size={18} />
              </Link>
              <a
                href="#apercu"
                className="flex items-center gap-2 font-semibold rounded-xl transition-all"
                style={{ color: 'rgba(255,255,255,0.7)', padding: '13px 20px', fontSize: '15px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }}
              >
                Voir la démo →
              </a>
            </div>

            <div className="flex items-center gap-6">
              {['Sans engagement', '14 jours offerts', 'Support FR inclus'].map(t => (
                <div key={t} className="flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px' }}>
                  <CheckCircle size={13} style={{ color: '#10b981' }} />{t}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* bottom fade */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '120px', background: 'linear-gradient(to bottom, transparent, #060912)', pointerEvents: 'none' }} />
      </section>

      {/* ── SOLAR PANEL ANIMATION CSS ─────────────── */}
      <style>{`
        @keyframes panelPulse {
          0%, 100% { box-shadow: 0 0 10px rgba(245,158,11,0.08), inset 0 0 20px rgba(99,149,255,0.04); }
          50% { box-shadow: 0 0 28px rgba(245,158,11,0.22), inset 0 0 40px rgba(99,149,255,0.12); border-color: rgba(14,165,233,0.35); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>

      {/* ── APP PREVIEW ───────────────────────────── */}
      <section id="apercu" className="max-w-6xl mx-auto px-8 pb-24">
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            border: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(255,255,255,0.025)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.5)',
          }}
        >
          {/* Window bar */}
          <div className="h-9 flex items-center gap-2 px-4" style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#ffbd2e' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
            <div className="flex-1 mx-4 h-5 rounded-md text-center" style={{ background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)' }}>app.voltpilot.fr/dashboard</span>
            </div>
          </div>

          <div className="flex" style={{ minHeight: '420px' }}>
            {/* Mini sidebar */}
            <div className="py-4 px-3 space-y-1 flex-shrink-0" style={{ width: '160px', background: '#080b14', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="flex items-center gap-2 px-2 mb-4">
                <Image src="/logo.svg" alt="VoltPilot" width={20} height={20} />
                <span style={{ color: '#fff', fontSize: '12px', fontWeight: '700' }}>VoltPilot</span>
              </div>
              {[
                { icon: '⊞', label: 'Dashboard', active: true },
                { icon: '◻', label: 'Devis' },
                { icon: '◉', label: 'Clients' },
                { icon: '◈', label: 'Analytics' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 10px', borderRadius: '7px', background: item.active ? 'rgba(14,165,233,0.1)' : 'transparent', color: item.active ? '#0ea5e9' : 'rgba(255,255,255,0.3)', fontSize: '12px' }}>
                  <span>{item.icon}</span>
                  <span style={{ fontWeight: item.active ? '600' : '400' }}>{item.label}</span>
                </div>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 p-5" style={{ background: '#f4f5f7' }}>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '16px' }}>
                {[
                  { label: 'CA réalisé', value: '127 400 €', color: '#0ea5e9' },
                  { label: 'Devis', value: '48', color: '#4f46e5' },
                  { label: 'Acceptés', value: '35', color: '#10b981' },
                  { label: 'En attente', value: '8', color: '#8b5cf6' },
                ].map(s => (
                  <div key={s.label} style={{ background: '#fff', borderRadius: '10px', padding: '12px', border: '1px solid #e9eaec' }}>
                    <p style={{ fontSize: '18px', fontWeight: '800', color: s.color, letterSpacing: '-0.02em' }}>{s.value}</p>
                    <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Table */}
              <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e9eaec', overflow: 'hidden' }}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '700', fontSize: '12px', color: '#111' }}>Devis récents</span>
                  <span style={{ fontSize: '11px', color: '#0ea5e9', fontWeight: '600' }}>Voir tout →</span>
                </div>
                {[
                  { num: 'DEV-2024-0005', client: 'Dupont Construction', amount: '20 400 €', status: 'Accepté', c: '#10b981', bg: 'rgba(16,185,129,0.08)' },
                  { num: 'DEV-2024-0001', client: 'Bâtiment Pro SARL', amount: '6 669 €', status: 'Accepté', c: '#10b981', bg: 'rgba(16,185,129,0.08)' },
                  { num: 'DEV-2024-0002', client: 'Electro Services', amount: '4 464 €', status: 'Envoyé', c: '#4f46e5', bg: 'rgba(79,70,229,0.08)' },
                ].map(r => (
                  <div key={r.num} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', padding: '9px 14px', borderBottom: '1px solid #f9fafb', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: '600', color: '#374151' }}>{r.num}</span>
                    <span style={{ fontSize: '11.5px', color: '#6b7280' }}>{r.client}</span>
                    <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#111' }}>{r.amount}</span>
                    <span style={{ fontSize: '10.5px', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', color: r.c, background: r.bg }}>{r.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────── */}
      <section id="fonctionnalites" className="max-w-7xl mx-auto px-8 py-20">
        <div className="text-center mb-14">
          <h2 className="font-black text-white mb-3" style={{ fontSize: '38px', letterSpacing: '-0.03em' }}>
            Conçu pour les pros du solaire
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '16px' }}>Tout ce dont vous avez besoin, rien de superflu</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: FileText, color: '#0ea5e9', title: 'Devis automatiques', desc: 'Catalogue 17 produits solaires pré-configuré. Panneaux, onduleurs, batteries, pose, démarches CONSUEL. Calcul TVA & remises instantané.' },
            { icon: Users, color: '#4f46e5', title: 'CRM clients intégré', desc: 'Fiche client complète, SIRET, historique de tous les devis, CA réalisé, taux d\'acceptation. Tout en un seul endroit.' },
            { icon: BarChart3, color: '#10b981', title: 'Analytics métier', desc: 'Suivi CA mensuel, pipeline commercial, objectifs. Prenez les bonnes décisions avec des données claires.' },
            { icon: TrendingUp, color: '#8b5cf6', title: 'Pipeline commercial', desc: 'Brouillon → Envoyé → Accepté. Suivez chaque devis, relancez au bon moment, ne perdez plus d\'opportunités.' },
            { icon: Clock, color: '#8b5cf6', title: 'PDF professionnel', desc: 'Vos devis exportés avec votre logo, vos couleurs, vos mentions légales. Un document qui inspire confiance.' },
            { icon: Zap, color: '#ef4444', title: 'Gain de temps réel', desc: 'Gagnez 5h par semaine. Créez un devis complet en 2 minutes là où il vous en fallait 30. Retour sur investissement immédiat.' },
          ].map(f => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className="p-6 rounded-2xl transition-all duration-300 hover:scale-[1.015]"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${f.color}18` }}>
                  <Icon size={20} style={{ color: f.color }} />
                </div>
                <h3 className="font-bold text-white text-base mb-2">{f.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', lineHeight: '1.6' }}>{f.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── SOLAR VISUAL SECTION ─────────────────── */}
      <section className="max-w-7xl mx-auto px-8 py-16">
        <div
          className="rounded-3xl overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, #0d1117 0%, #0f1d35 50%, #0d1117 100%)', border: '1px solid rgba(255,255,255,0.07)', minHeight: '320px', display: 'flex', alignItems: 'center' }}
        >
          {/* 3D panels decoration */}
          <div className="absolute right-0 top-0 bottom-0 overflow-hidden" style={{ width: '50%', opacity: 0.3 }}>
            <div style={{ transform: 'perspective(600px) rotateX(40deg) rotateZ(-15deg) translateX(60px) translateY(-20px)', display: 'grid', gridTemplateColumns: 'repeat(4, 90px)', gap: '8px', transformStyle: 'preserve-3d' }}>
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={i} style={{ width: '90px', height: '90px', background: 'linear-gradient(135deg, #1a3a6b, #1e4d92)', borderRadius: '5px', border: '1px solid rgba(99,149,255,0.25)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(4, 1fr)', gap: '1px', padding: '4px' }}>
                  {Array.from({ length: 16 }).map((_, j) => (
                    <div key={j} style={{ background: i % 3 === 0 && j % 3 === 0 ? 'rgba(245,158,11,0.3)' : 'rgba(99,149,255,0.08)', borderRadius: '1px' }} />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 px-12 py-10" style={{ maxWidth: '520px' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#0ea5e9' }}>Technologie solaire</p>
            <h2 className="font-black text-white mb-4 leading-tight" style={{ fontSize: '36px', letterSpacing: '-0.025em' }}>
              Fait pour ceux qui installent le futur énergétique
            </h2>
            <p className="mb-6" style={{ color: 'rgba(255,255,255,0.45)', fontSize: '15px', lineHeight: '1.65' }}>
              Vous posez les panneaux, VoltPilot gère les devis. Catalogue produit mis à jour, calculs automatiques, clients organisés.
            </p>
            <Link href="/register" className="inline-flex items-center gap-2 font-bold text-white rounded-xl transition-all" style={{ background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)', padding: '11px 22px', fontSize: '14px', boxShadow: '0 4px 20px rgba(14,165,233,0.35)' }}>
              Commencer maintenant <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────── */}
      <div id="tarifs">
        <PricingSection />
      </div>

      {/* ── CTA FINAL ────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-8 pb-24 text-center">
        <h2 className="font-black text-white mb-4" style={{ fontSize: '42px', letterSpacing: '-0.03em' }}>
          Prêt à gagner du temps ?
        </h2>
        <p className="mb-8" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '16px' }}>
          Créez des devis solaires professionnels en quelques minutes. Sans engagement.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 font-bold text-white rounded-xl transition-all"
          style={{ background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)', padding: '14px 28px', fontSize: '16px', boxShadow: '0 6px 30px rgba(14,165,233,0.4)', letterSpacing: '-0.01em' }}
        >
          Démarrer l&apos;essai gratuit <ArrowRight size={18} />
        </Link>
        <p className="mt-4" style={{ color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>
          14 jours gratuits · Sans carte bancaire · Installation immédiate
        </p>
      </section>

      {/* ── FOOTER ───────────────────────────────── */}
      <footer id="contact" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '40px 0' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.svg" alt="VoltPilot" width={28} height={28} />
            <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700, fontSize: '15px' }}>VoltPilot</span>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: '13px' }}>
            © {new Date().getFullYear()} VoltPilot · Logiciel de devis photovoltaïque · Fait en France
          </p>
          <a href="mailto:contact@voltpilot.fr" style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px' }} className="hover:text-white transition-colors">
            contact@voltpilot.fr
          </a>
          <div className="flex items-center gap-5 mt-1">
            <Link href="/mentions-legales" style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px' }} className="hover:text-white transition-colors">Mentions légales</Link>
            <Link href="/cgv" style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px' }} className="hover:text-white transition-colors">CGV</Link>
            <Link href="/politique-confidentialite" style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px' }} className="hover:text-white transition-colors">Politique de confidentialité</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
