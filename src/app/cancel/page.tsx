import Link from 'next/link'
import { XCircle, ArrowLeft, Sun } from 'lucide-react'

export default function CancelPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: '#060912' }}
    >
      <Link href="/" className="flex items-center gap-2 mb-12">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #22D3EE, #06B6D4)' }}>
          <Sun size={18} className="text-white" />
        </div>
        <span className="font-black text-white text-xl" style={{ letterSpacing: '-0.03em' }}>VoltPilot</span>
      </Link>

      <div
        className="w-full max-w-md rounded-3xl p-10 text-center"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <XCircle size={40} style={{ color: '#ef4444' }} />
        </div>

        <h1 className="font-black text-white mb-2" style={{ fontSize: '28px', letterSpacing: '-0.03em' }}>
          Paiement annulé
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '15px', lineHeight: '1.6', marginBottom: '32px' }}>
          Votre paiement a été annulé. Aucun montant n'a été débité. Vous pouvez reprendre à tout moment.
        </p>

        <Link
          href="/#pricing"
          className="flex items-center justify-center gap-2 w-full rounded-xl font-bold"
          style={{
            padding: '14px',
            fontSize: '15px',
            background: 'rgba(255,255,255,0.07)',
            color: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <ArrowLeft size={16} /> Retour aux tarifs
        </Link>

        <p className="mt-4" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>
          Des questions ? Contactez-nous à support@voltpilot.fr
        </p>
      </div>
    </div>
  )
}
