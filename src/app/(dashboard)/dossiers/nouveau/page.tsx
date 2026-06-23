import { getClients } from '@/lib/actions/clients'
import { createDossier } from '@/lib/actions/dossiers'
import { ArrowLeft, Folder } from 'lucide-react'
import Link from 'next/link'

export default async function NouveauDossierPage() {
  const clients = await getClients()

  return (
    <div className="flex-1 flex flex-col min-h-screen" style={{ background: '#0a0d16' }}>
      <div className="px-6 pt-8 pb-6">
        <Link
          href="/dossiers"
          className="inline-flex items-center gap-1.5 text-sm mb-6 transition-colors hover:text-white"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          <ArrowLeft size={14} />
          Retour aux dossiers
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(245,158,11,0.12)' }}
          >
            <Folder size={20} style={{ color: '#0ea5e9' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Nouveau dossier</h1>
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Organisez vos projets par dossier
            </p>
          </div>
        </div>

        <form action={createDossier} className="max-w-lg space-y-5">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Nom du dossier <span style={{ color: '#0ea5e9' }}>*</span>
            </label>
            <input
              name="nom"
              required
              placeholder="Ex : Résidence Martin — Toiture sud"
              className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Client associé <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>(optionnel)</span>
            </label>
            <select
              name="client_id"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.8)',
              }}
            >
              <option value="">— Aucun client —</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.nom}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Description <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>(optionnel)</span>
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder="Notes, contexte du projet..."
              className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all resize-none"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)' }}
            >
              Créer le dossier
            </button>
            <Link
              href="/dossiers"
              className="px-6 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.05)' }}
            >
              Annuler
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
