'use client'
import { Header } from '@/components/layout/Header'
import { createClientAction } from '@/lib/actions/clients'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

export default function NouveauClientPage() {
  const router = useRouter()

  return (
    <div className="flex-1 overflow-auto">
      <Header title="Nouveau client" subtitle="Créer une fiche client" />

      <div className="p-6 max-w-2xl mx-auto space-y-5">
        <button type="button" onClick={() => router.back()} className="btn-secondary text-sm">
          <ArrowLeft size={15} /> Retour
        </button>

        <form action={createClientAction} className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-5">
            {/* Infos principales */}
            <div>
              <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">1</span>
                Informations principales
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nom du client / entreprise *</label>
                  <input name="nom" type="text" className="input-field" placeholder="Ex: Dupont Construction SARL" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
                  <input name="email" type="email" className="input-field" placeholder="contact@entreprise.fr" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Téléphone</label>
                  <input name="telephone" type="tel" className="input-field" placeholder="06 12 34 56 78" />
                </div>
              </div>
            </div>

            {/* Adresse */}
            <div className="border-t border-slate-50 pt-5">
              <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">2</span>
                Adresse
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Adresse</label>
                  <input name="adresse" type="text" className="input-field" placeholder="12 Rue des Artisans" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Code postal</label>
                  <input name="code_postal" type="text" className="input-field" placeholder="75001" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ville</label>
                  <input name="ville" type="text" className="input-field" placeholder="Paris" />
                </div>
              </div>
            </div>

            {/* Infos légales */}
            <div className="border-t border-slate-50 pt-5">
              <h2 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">3</span>
                Informations légales (optionnel)
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">SIRET</label>
                  <input name="siret" type="text" className="input-field" placeholder="00000000000000" maxLength={14} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Notes internes</label>
                  <textarea name="notes" rows={3} className="input-field resize-none" placeholder="Informations utiles, préférences du client..." />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between pb-6">
            <button type="button" onClick={() => router.back()} className="btn-secondary">Annuler</button>
            <button type="submit" className="btn-primary">Créer le client</button>
          </div>
        </form>
      </div>
    </div>
  )
}
