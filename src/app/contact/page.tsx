import Link from 'next/link'
import Image from 'next/image'
import { Mail, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Contact — VoltPilot',
  description: 'Contactez l\'équipe VoltPilot pour toute question sur notre logiciel de devis photovoltaïque.',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen" style={{ background: '#0A0E1A', fontFamily: 'var(--font-geist-sans)' }}>

      {/* ── NAV ── */}
      <nav className="flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.svg" alt="VoltPilot" width={36} height={36} />
          <span className="text-white font-bold text-lg tracking-tight">VoltPilot</span>
        </Link>
        <Link
          href="/"
          className="flex items-center gap-2 text-sm transition-colors"
          style={{ color: 'rgba(255,255,255,0.45)' }}
        >
          <ArrowLeft size={14} /> Retour à l&apos;accueil
        </Link>
      </nav>

      {/* ── CONTENT ── */}
      <main className="max-w-2xl mx-auto px-8 py-16">
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-6"
            style={{ background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)' }}
          >
            <Mail size={24} style={{ color: '#22D3EE' }} />
          </div>
          <h1 className="font-black text-white mb-3" style={{ fontSize: '38px', letterSpacing: '-0.03em' }}>
            Contactez-nous
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '16px', lineHeight: 1.6 }}>
            Une question sur VoltPilot ? Un bug à signaler ? Écrivez-nous, on répond rapidement.
          </p>
        </div>

        {/* Email direct */}
        <div
          className="flex items-center gap-4 p-5 rounded-2xl mb-8"
          style={{ background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.15)' }}
        >
          <div
            className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(34,211,238,0.12)' }}
          >
            <Mail size={18} style={{ color: '#22D3EE' }} />
          </div>
          <div>
            <p className="text-white font-semibold text-sm mb-0.5">Email</p>
            <a
              href="mailto:voltpilotpro@gmail.com"
              className="transition-colors"
              style={{ color: '#22D3EE', fontSize: '15px' }}
            >
              voltpilotpro@gmail.com
            </a>
          </div>
        </div>

        {/* Formulaire mailto */}
        <form
          action="mailto:voltpilotpro@gmail.com"
          method="post"
          encType="text/plain"
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Nom
            </label>
            <input
              type="text"
              name="nom"
              placeholder="Votre nom"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Email
            </label>
            <input
              type="email"
              name="email"
              placeholder="votre@email.com"
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Message
            </label>
            <textarea
              name="message"
              rows={5}
              placeholder="Décrivez votre demande..."
              className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all resize-none"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
              }}
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-xl font-bold transition-all"
            style={{
              background: 'linear-gradient(135deg, #22D3EE, #06B6D4)',
              color: '#0A0E1A',
              padding: '13px',
              fontSize: '15px',
              boxShadow: '0 4px 20px rgba(34,211,238,0.3)',
            }}
          >
            <Mail size={16} /> Envoyer le message
          </button>

          <p className="text-center text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Ce formulaire ouvre votre client email. Vous pouvez aussi écrire directement à{' '}
            <a href="mailto:voltpilotpro@gmail.com" style={{ color: 'rgba(255,255,255,0.35)' }}>
              voltpilotpro@gmail.com
            </a>
          </p>
        </form>
      </main>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '32px 0', marginTop: '40px' }}>
        <div className="flex flex-col items-center gap-3">
          <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: '13px' }}>
            © {new Date().getFullYear()} VoltPilot · Logiciel de devis photovoltaïque
          </p>
          <div className="flex items-center gap-5">
            <Link href="/mentions-legales" style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px' }} className="hover:text-white transition-colors">Mentions légales</Link>
            <Link href="/cgv" style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px' }} className="hover:text-white transition-colors">CGV</Link>
            <Link href="/politique-confidentialite" style={{ color: 'rgba(255,255,255,0.2)', fontSize: '12px' }} className="hover:text-white transition-colors">Politique de confidentialité</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
