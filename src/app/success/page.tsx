import Link from 'next/link'
import { CheckCircle, ArrowRight, Sun } from 'lucide-react'

export default function SuccessPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: '#060912' }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-12">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #22D3EE, #06B6D4)' }}>
          <Sun size={18} className="text-white" />
        </div>
        <span className="font-black text-white text-xl" style={{ letterSpacing: '-0.03em' }}>VoltPilot</span>
      </Link>

      {/* Card */}
      <div
        className="w-full max-w-md rounded-3xl p-10 text-center"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Icône succès */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}
        >
          <CheckCircle size={40} style={{ color: '#10b981' }} />
        </div>

        <h1 className="font-black text-white mb-2" style={{ fontSize: '28px', letterSpacing: '-0.03em' }}>
          Paiement confirmé !
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '15px', lineHeight: '1.6', marginBottom: '32px' }}>
          Bienvenue dans VoltPilot. Votre abonnement est actif — vous pouvez maintenant créer vos premiers devis solaires.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { value: '∞', label: 'Devis' },
            { value: '∞', label: 'Clients' },
            { value: '24h', label: 'Support' },
          ].map(s => (
            <div
              key={s.label}
              className="p-3 rounded-xl"
              style={{ background: 'rgba(250,204,21,0.07)', border: '1px solid rgba(250,204,21,0.15)' }}
            >
              <p className="font-black text-white" style={{ fontSize: '20px' }}>{s.value}</p>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>{s.label}</p>
            </div>
          ))}
        </div>

        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-2 w-full rounded-xl font-bold text-white"
          style={{
            padding: '14px',
            fontSize: '15px',
            background: 'linear-gradient(135deg, #22D3EE, #06B6D4)',
            boxShadow: '0 4px 20px rgba(34,211,238,0.35)',
          }}
        >
          Accéder au tableau de bord <ArrowRight size={16} />
        </Link>

        <p className="mt-4" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>
          Un email de confirmation a été envoyé à votre adresse.
        </p>
      </div>
    </div>
  )
}
