'use client'
import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { createClientAction } from '@/lib/actions/clients'
import { useRouter } from 'next/navigation'
import { ArrowLeft, AlertCircle, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

export default function NouveauClientPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const formData = new FormData(e.currentTarget)
    const result = await createClientAction(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <Header title="Nouveau client" subtitle="Créer une fiche client" />

      <div className="p-6 max-w-2xl mx-auto space-y-5">
        <button type="button" onClick={() => router.back()} className="btn-secondary text-sm">
          <ArrowLeft size={15} /> Retour
        </button>

        {error && (
          <div
            className="flex items-start gap-3 p-4 rounded-xl"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
          >
            <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-400 text-sm">{error}</p>
              {error.includes('limite') && (
                <Link href="/billing" className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-purple-400 hover:text-purple-300">
                  Passer en Pro <ArrowUpRight size={12} />
                </Link>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="volt-card p-6 space-y-5">
            <div>
              <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--nova)' }}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(124,58,237,0.2)', color: 'var(--nebula-bright)' }}>1</span>
                Informations principales
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--star)' }}>Nom du client / entreprise *</label>
                  <input name="nom" type="text" className="input-field" placeholder="Ex: Dupont Construction SARL" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--star)' }}>Email</label>
                  <input name="email" type="email" className="input-field" placeholder="contact@entreprise.fr" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--star)' }}>Téléphone</label>
                  <input name="telephone" type="tel" className="input-field" placeholder="06 12 34 56 78" />
                </div>
              </div>
            </div>

            <div className="border-t pt-5" style={{ borderColor: 'var(--border-dim)' }}>
              <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--nova)' }}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(124,58,237,0.2)', color: 'var(--nebula-bright)' }}>2</span>
                Adresse
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--star)' }}>Adresse</label>
                  <input name="adresse" type="text" className="input-field" placeholder="12 Rue des Artisans" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--star)' }}>Code postal</label>
                  <input name="code_postal" type="text" className="input-field" placeholder="75001" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--star)' }}>Ville</label>
                  <input name="ville" type="text" className="input-field" placeholder="Paris" />
                </div>
              </div>
            </div>

            <div className="border-t pt-5" style={{ borderColor: 'var(--border-dim)' }}>
              <h2 className="font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--nova)' }}>
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(124,58,237,0.2)', color: 'var(--nebula-bright)' }}>3</span>
                Informations légales (optionnel)
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--star)' }}>SIRET</label>
                  <input name="siret" type="text" className="input-field" placeholder="00000000000000" maxLength={14} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--star)' }}>Notes internes</label>
                  <textarea name="notes" rows={3} className="input-field resize-none" placeholder="Informations utiles, préférences du client..." />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between pb-6">
            <button type="button" onClick={() => router.back()} className="btn-secondary">Annuler</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Création…' : 'Créer le client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
