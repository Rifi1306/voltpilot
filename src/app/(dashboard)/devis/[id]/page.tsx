'use client'
import { use, useState, useEffect, useTransition } from 'react'
import { Header } from '@/components/layout/Header'
import { getDevisById, updateDevisStatut, deleteDevisAction } from '@/lib/actions/devis'
import { getProfile } from '@/lib/actions/profile'
import { useLanguage } from '@/i18n/LanguageContext'
import { StatusBadge } from '@/components/ui/Badge'
import type { DevisStatus } from '@/lib/types'
import {
  Download, Send, CheckCircle2, XCircle, ArrowLeft,
  Printer, MapPin, Phone, Mail, Calendar, CreditCard, Percent, Sun, Trash2
} from 'lucide-react'
import Link from 'next/link'
import { generateDevisPDF } from '@/lib/generatePDF'
import type { DevisForPDF, ProfileForPDF } from '@/lib/generatePDF'
import { sendDevisEmailAction } from '@/lib/actions/email'

type ClientRow = {
  id: string
  nom: string
  email: string | null
  telephone: string | null
  adresse: string | null
  code_postal: string | null
  ville: string | null
  siret: string | null
}

type DevisRow = {
  id: string
  numero: string
  statut: string
  lignes: unknown
  remise: number | null
  acompte: number | null
  conditions_paiement: string | null
  notes: string | null
  date_validite: string | null
  created_at: string
  clients: ClientRow | null
}

type ProfileRow = {
  nom: string | null
  adresse: string | null
  code_postal: string | null
  ville: string | null
  siret: string | null
  mentions_legales: string | null
  couleur_primaire: string | null
}

type LigneItem = {
  designation: string
  description?: string
  quantite: number
  prixUnitaire: number
  remise?: number
  tva?: number
}

function parseLignes(raw: unknown): LigneItem[] {
  if (!Array.isArray(raw)) return []
  return raw as LigneItem[]
}

function computeTotals(lignes: LigneItem[], remiseGlobale: number) {
  const htBase = lignes.reduce((s, l) => s + l.quantite * l.prixUnitaire * (1 - (l.remise ?? 0) / 100), 0)
  const tvaBase = lignes.reduce((s, l) => {
    const ht = l.quantite * l.prixUnitaire * (1 - (l.remise ?? 0) / 100)
    return s + ht * ((l.tva ?? 20) / 100)
  }, 0)
  const factor = 1 - remiseGlobale / 100
  return {
    montantHT: htBase * factor,
    montantTVA: tvaBase * factor,
    montantTTC: (htBase + tvaBase) * factor,
  }
}

export default function DevisDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const [devis, setDevis] = useState<DevisRow | null>(null)
  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [showSendModal, setShowSendModal] = useState(false)
  const [sendStatus, setSendStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [sendError, setSendError] = useState('')
  const { formatCurrency } = useLanguage()

  useEffect(() => {
    Promise.all([getDevisById(id), getProfile()])
      .then(([d, p]) => {
        if (!d) { setNotFound(true); return }
        setDevis(d as DevisRow)
        setProfile(p as ProfileRow | null)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const handleStatut = (statut: string) => {
    startTransition(async () => {
      await updateDevisStatut(id, statut)
      setDevis(prev => prev ? { ...prev, statut } : prev)
    })
  }

  const handleDelete = () => {
    if (!confirm('Supprimer ce devis définitivement ?')) return
    startTransition(async () => {
      await deleteDevisAction(id)
    })
  }

  const handleSendEmail = async () => {
    setSendStatus('sending')
    const result = await sendDevisEmailAction(id)
    if (result.ok) {
      setSendStatus('success')
      setDevis(prev => prev && prev.statut === 'brouillon' ? { ...prev, statut: 'envoye' } : prev)
      setTimeout(() => { setShowSendModal(false); setSendStatus('idle') }, 2500)
    } else {
      setSendStatus('error')
      setSendError(result.error ?? 'Erreur lors de l\'envoi')
    }
  }

  if (loading) return (
    <div className="flex-1 overflow-auto">
      <Header title="Chargement…" subtitle="" />
      <div className="flex justify-center py-24">
        <div className="w-7 h-7 border-[3px] border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )

  if (notFound || !devis) return (
    <div className="flex-1 overflow-auto">
      <Header title="Devis introuvable" subtitle="" />
      <div className="p-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
          <p className="text-slate-500 mb-4">Ce devis n&apos;existe pas ou a été supprimé.</p>
          <Link href="/devis" className="btn-primary text-sm">Retour aux devis</Link>
        </div>
      </div>
    </div>
  )

  const client = devis.clients
  const lignes = parseLignes(devis.lignes)
  const { montantHT, montantTVA, montantTTC } = computeTotals(lignes, devis.remise ?? 0)
  const acompte = devis.acompte ?? 0
  const statut = devis.statut as DevisStatus

  return (
    <>
    <div className="flex-1 overflow-auto">
      <Header title={devis.numero} subtitle={client ? `Devis pour ${client.nom}` : 'Devis'} />

      <div className="p-6 max-w-5xl mx-auto space-y-5">
        {/* Actions bar */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link href="/devis" className="btn-secondary text-sm">
            <ArrowLeft size={15} /> Retour
          </Link>
          <div className="flex-1" />
          <button onClick={() => window.print()} className="btn-secondary text-sm" disabled={isPending}>
            <Printer size={14} /> Imprimer
          </button>
          <button
            onClick={() => {
              let logo: string | undefined
              let sig = false
              try {
                logo = localStorage.getItem('voltpilot_logo_b64') ?? undefined
                sig = localStorage.getItem('voltpilot_signature_active') === 'true'
              } catch { /* ignore */ }
              generateDevisPDF(
                devis as unknown as DevisForPDF,
                { ...(profile as unknown as ProfileForPDF), logo, signature_active: sig }
              )
            }}
            className="btn-secondary text-sm"
            disabled={isPending}
          >
            <Download size={14} /> Télécharger PDF
          </button>
          {client?.email && (
            <button
              onClick={() => { setSendStatus('idle'); setSendError(''); setShowSendModal(true) }}
              className="btn-primary text-sm"
              disabled={isPending}
            >
              <Send size={14} /> Envoyer par email
            </button>
          )}
          {statut === 'brouillon' && (
            <button onClick={() => handleStatut('envoye')} className="btn-primary text-sm" disabled={isPending}>
              <Send size={14} /> Marquer envoyé
            </button>
          )}
          {statut === 'envoye' && (
            <>
              <button
                onClick={() => handleStatut('accepte')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-all disabled:opacity-60"
                disabled={isPending}
              >
                <CheckCircle2 size={14} /> Marquer accepté
              </button>
              <button
                onClick={() => handleStatut('refuse')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-all disabled:opacity-60"
                disabled={isPending}
              >
                <XCircle size={14} /> Marquer refusé
              </button>
            </>
          )}
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 transition-all disabled:opacity-60"
            disabled={isPending}
          >
            <Trash2 size={14} /> Supprimer
          </button>
        </div>

        {/* Status banner */}
        <div className={`rounded-2xl p-4 flex items-center gap-3 ${
          statut === 'accepte' ? 'bg-emerald-50 border border-emerald-200' :
          statut === 'envoye' ? 'bg-blue-50 border border-blue-200' :
          statut === 'refuse' ? 'bg-red-50 border border-red-200' :
          'bg-slate-50 border border-slate-200'
        }`}>
          <StatusBadge status={statut} />
          <p className="text-sm text-slate-600">
            Créé le {new Date(devis.created_at).toLocaleDateString('fr-FR')}
            {devis.date_validite && ` · Valide jusqu'au ${new Date(devis.date_validite).toLocaleDateString('fr-FR')}`}
          </p>
          {statut === 'accepte' && (
            <span className="ml-auto text-emerald-700 font-semibold text-sm flex items-center gap-1">
              <CheckCircle2 size={15} /> Devis signé et validé
            </span>
          )}
        </div>

        {/* Aperçu devis */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          {/* En-tête */}
          <div className="p-8 border-b border-slate-100">
            <div className="flex justify-between items-start">
              {/* Entreprise */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${profile?.couleur_primaire ?? '#0ea5e9'}, #8b5cf6)` }}>
                    <Sun size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{profile?.nom ?? 'Mon entreprise'}</h3>
                    <p className="text-slate-500 text-xs">Solutions photovoltaïques</p>
                  </div>
                </div>
                {profile?.adresse && <p className="text-sm text-slate-500">{profile.adresse}</p>}
                {(profile?.code_postal || profile?.ville) && (
                  <p className="text-sm text-slate-500">{profile?.code_postal} {profile?.ville}</p>
                )}
                {profile?.siret && <p className="text-xs text-slate-400 mt-1">SIRET: {profile.siret}</p>}
              </div>

              {/* Numéro & dates */}
              <div className="text-right">
                <div className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }}>
                  DEVIS
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-1">{devis.numero}</h2>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 justify-end text-sm text-slate-500">
                    <Calendar size={13} />
                    <span>Émis le {new Date(devis.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                  {devis.date_validite && (
                    <div className="flex items-center gap-2 justify-end text-sm text-slate-500">
                      <Calendar size={13} />
                      <span>Valide jusqu&apos;au {new Date(devis.date_validite).toLocaleDateString('fr-FR')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Client */}
            {client && (
              <div className="mt-8 p-4 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Destinataire</p>
                <p className="font-bold text-slate-900">{client.nom}</p>
                <div className="flex gap-6 mt-1 flex-wrap">
                  {(client.adresse || client.ville) && (
                    <p className="text-sm text-slate-500 flex items-center gap-1.5">
                      <MapPin size={12} /> {client.adresse}{client.code_postal ? `, ${client.code_postal}` : ''}{client.ville ? ` ${client.ville}` : ''}
                    </p>
                  )}
                  {client.email && (
                    <p className="text-sm text-slate-500 flex items-center gap-1.5">
                      <Mail size={12} /> {client.email}
                    </p>
                  )}
                  {client.telephone && (
                    <p className="text-sm text-slate-500 flex items-center gap-1.5">
                      <Phone size={12} /> {client.telephone}
                    </p>
                  )}
                </div>
                {client.siret && <p className="text-xs text-slate-400 mt-1">SIRET: {client.siret}</p>}
              </div>
            )}
          </div>

          {/* Lignes */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Désignation</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider w-16">Qté</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider w-28">Prix unit. HT</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider w-16">TVA</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider w-20">Remise</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider w-28">Total HT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {lignes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-400">Aucune ligne dans ce devis</td>
                  </tr>
                ) : lignes.map((ligne, i) => {
                  const ligneHT = ligne.quantite * ligne.prixUnitaire * (1 - (ligne.remise ?? 0) / 100)
                  return (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{ligne.designation}</p>
                        {ligne.description && <p className="text-xs text-slate-400 mt-0.5">{ligne.description}</p>}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-slate-600">{ligne.quantite}</td>
                      <td className="px-6 py-4 text-right text-sm text-slate-600">{formatCurrency(ligne.prixUnitaire)}</td>
                      <td className="px-6 py-4 text-right text-sm text-slate-500">{ligne.tva ?? 20}%</td>
                      <td className="px-6 py-4 text-right text-sm text-slate-500">
                        {(ligne.remise ?? 0) > 0 ? `-${ligne.remise}%` : '—'}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-900">{formatCurrency(ligneHT)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Totaux + infos paiement */}
          <div className="p-6 border-t border-slate-100 grid grid-cols-2 gap-8">
            <div className="space-y-2">
              {devis.conditions_paiement && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <CreditCard size={14} />
                  <span className="font-semibold text-slate-700">Conditions:</span>
                  <span>{devis.conditions_paiement}</span>
                </div>
              )}
              {acompte > 0 && (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Percent size={14} />
                  <span className="font-semibold text-slate-700">Acompte:</span>
                  <span>{acompte}% à la commande ({formatCurrency(montantTTC * acompte / 100)})</span>
                </div>
              )}
              {devis.notes && (
                <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <p className="text-xs font-semibold text-sky-700 mb-1">Notes</p>
                  <p className="text-sm text-sky-800">{devis.notes}</p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Sous-total HT</span>
                <span>{formatCurrency(montantHT)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500">
                <span>TVA</span>
                <span>{formatCurrency(montantTVA)}</span>
              </div>
              {(devis.remise ?? 0) > 0 && (
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Remise globale ({devis.remise}%)</span>
                  <span className="text-red-500">incluse</span>
                </div>
              )}
              <div className="h-px bg-slate-100" />
              <div className="flex justify-between font-bold text-slate-900 text-lg">
                <span>Total TTC</span>
                <span className="text-indigo-700">{formatCurrency(montantTTC)}</span>
              </div>
              {acompte > 0 && (
                <div className="flex justify-between text-sm font-semibold text-emerald-700">
                  <span>Acompte dû ({acompte}%)</span>
                  <span>{formatCurrency(montantTTC * acompte / 100)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Mentions légales */}
          {profile?.mentions_legales && (
            <div className="px-6 pb-6">
              <p className="text-xs text-slate-400 border-t border-slate-50 pt-4">{profile.mentions_legales}</p>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Modale confirmation envoi email */}
    {showSendModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
              <Send size={18} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Envoyer le devis par email</h3>
              <p className="text-sm text-slate-500">Un email professionnel sera envoyé au client</p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 mb-5 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Mail size={14} className="text-slate-400 flex-shrink-0" />
              <span className="text-slate-500">Destinataire :</span>
              <span className="font-semibold text-slate-900">{client?.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail size={14} className="text-slate-400 flex-shrink-0 opacity-0" />
              <span className="text-slate-500">Objet :</span>
              <span className="font-semibold text-slate-900">Votre devis {devis.numero}</span>
            </div>
          </div>

          {devis.statut === 'brouillon' && sendStatus === 'idle' && (
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4">
              <CheckCircle2 size={15} className="text-sky-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-sky-700">Le devis passera automatiquement au statut <strong>Envoyé</strong> après l&apos;envoi.</p>
            </div>
          )}

          {sendStatus === 'success' && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4">
              <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
              <p className="text-sm font-semibold text-emerald-700">Email envoyé avec succès !</p>
            </div>
          )}

          {sendStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
              <p className="text-sm font-semibold text-red-700 mb-1">Échec de l&apos;envoi</p>
              <p className="text-xs text-red-600">{sendError}</p>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowSendModal(false)}
              className="btn-secondary text-sm"
              disabled={sendStatus === 'sending'}
            >
              {sendStatus === 'success' ? 'Fermer' : 'Annuler'}
            </button>
            {sendStatus !== 'success' && (
              <button
                onClick={handleSendEmail}
                disabled={sendStatus === 'sending'}
                className="btn-primary text-sm disabled:opacity-60"
              >
                {sendStatus === 'sending' ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Envoi en cours…
                  </span>
                ) : (
                  <><Send size={14} /> Confirmer l&apos;envoi</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  )
}
