'use client'
import { useState, useEffect, useTransition, useRef } from 'react'
import { Header } from '@/components/layout/Header'
import { getProfile, updateProfileAction } from '@/lib/actions/profile'
import { Sun, Save, Code2, Copy, CheckCheck, ExternalLink, CheckCircle2, Upload, X, PenLine, MousePointerClick, CreditCard, Loader2, Zap, Download, Trash2, AlertTriangle } from 'lucide-react'

const LOGO_KEY = 'voltpilot_logo_b64'
const SIG_KEY = 'voltpilot_signature_active'

function buildEmbedCode(userId: string, baseUrl: string) {
  return `<iframe
  src="${baseUrl}/w/${userId}"
  width="100%"
  height="640"
  frameborder="0"
  style="border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);"
  title="Devis solaire gratuit"
></iframe>`
}

function buildButtonCode(userId: string, baseUrl: string, couleur: string) {
  return `<a
  href="${baseUrl}/w/${userId}"
  target="_blank"
  rel="noopener"
  style="display:inline-block;background:${couleur};color:white;padding:14px 28px;border-radius:10px;font-family:sans-serif;font-size:15px;font-weight:700;text-decoration:none;"
>☀️ Demander un devis solaire gratuit</a>`
}

type Form = {
  nom: string
  telephone: string
  adresse: string
  code_postal: string
  ville: string
  siret: string
  tva: string
  mentions_legales: string
  conditions_paiement_defaut: string
  validite_devis_defaut: string
  couleur_primaire: string
  widget_show_price: boolean
  rge_number: string
  assurance_decennale: string
  iban: string
  garanties_defaut: string
  format_numero_devis: string
  format_numero_facture: string
  prime_autoconsommation: string
  tarif_rachat_surplus: string
  hypotheses_note: string
}

const DEFAULT_FORM: Form = {
  nom: '',
  telephone: '',
  adresse: '',
  code_postal: '',
  ville: '',
  siret: '',
  tva: '',
  mentions_legales: '',
  conditions_paiement_defaut: '30 jours net',
  validite_devis_defaut: '30',
  couleur_primaire: '#7c3aed',
  widget_show_price: true,
  rge_number: '',
  assurance_decennale: '',
  iban: '',
  garanties_defaut: 'Garantie décennale 10 ans. Garantie produits selon fabricant.',
  format_numero_devis: 'DEV-{YYYY}-{NUM}',
  format_numero_facture: 'FAC-{YYYY}-{NUM}',
  prime_autoconsommation: '0',
  tarif_rachat_surplus: '0.1288',
  hypotheses_note: 'Hypothèses à vérifier selon réglementation en vigueur.',
}

export default function SettingsPage() {
  const [form, setForm] = useState<Form>(DEFAULT_FORM)
  const [userId, setUserId] = useState('')
  const [plan, setPlan] = useState<string>('starter')
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('trialing')
  const [portalLoading, setPortalLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [copied, setCopied] = useState(false)
  const [copiedBtn, setCopiedBtn] = useState(false)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null)
  const [signatureActive, setSignatureActive] = useState(false)
  const [logoError, setLogoError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getProfile().then(p => {
      if (p) {
        setUserId(p.id)
        setPlan(p.plan ?? 'starter')
        setSubscriptionStatus((p as Record<string, unknown>).subscription_status as string ?? 'trialing')
        setForm({
          nom: p.nom ?? '',
          telephone: p.telephone ?? '',
          adresse: p.adresse ?? '',
          code_postal: p.code_postal ?? '',
          ville: p.ville ?? '',
          siret: p.siret ?? '',
          tva: p.tva ?? '',
          mentions_legales: p.mentions_legales ?? '',
          conditions_paiement_defaut: p.conditions_paiement_defaut ?? '30 jours net',
          validite_devis_defaut: String(p.validite_devis_defaut ?? 30),
          couleur_primaire: p.couleur_primaire ?? '#7c3aed',
          widget_show_price: p.widget_show_price ?? true,
          rge_number: (p as Record<string, unknown>).rge_number as string ?? '',
          assurance_decennale: (p as Record<string, unknown>).assurance_decennale as string ?? '',
          iban: (p as Record<string, unknown>).iban as string ?? '',
          garanties_defaut: (p as Record<string, unknown>).garanties_defaut as string ?? 'Garantie décennale 10 ans. Garantie produits selon fabricant.',
          format_numero_devis: (p as Record<string, unknown>).format_numero_devis as string ?? 'DEV-{YYYY}-{NUM}',
          format_numero_facture: (p as Record<string, unknown>).format_numero_facture as string ?? 'FAC-{YYYY}-{NUM}',
          prime_autoconsommation: (p as Record<string, unknown>).prime_autoconsommation as string ?? '0',
          tarif_rachat_surplus: (p as Record<string, unknown>).tarif_rachat_surplus as string ?? '0.1288',
          hypotheses_note: (p as Record<string, unknown>).hypotheses_note as string ?? 'Hypothèses à vérifier selon réglementation en vigueur.',
        })
      }
    }).catch(console.error)
    // Load logo + signature pref from localStorage
    try {
      const logo = localStorage.getItem(LOGO_KEY)
      if (logo) setLogoDataUrl(logo)
      const sigStored = localStorage.getItem(SIG_KEY)
      setSignatureActive(sigStored === null ? true : sigStored === 'true')
    } catch { /* ignore */ }
  }, [])

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoError('')
    if (file.size > 2 * 1024 * 1024) { setLogoError('Fichier trop lourd (max 2 Mo)'); return }
    if (!file.type.match(/image\/(png|jpeg|jpg|svg\+xml)/)) { setLogoError('Format non supporté (PNG, JPG, SVG)'); return }
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      setLogoDataUrl(dataUrl)
      try { localStorage.setItem(LOGO_KEY, dataUrl) } catch { setLogoError('Logo trop grand pour le stockage local') }
    }
    reader.readAsDataURL(file)
  }

  const removeLogo = () => {
    setLogoDataUrl(null)
    try { localStorage.removeItem(LOGO_KEY) } catch { /* ignore */ }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const toggleSignature = () => {
    const next = !signatureActive
    setSignatureActive(next)
    try { localStorage.setItem(SIG_KEY, String(next)) } catch { /* ignore */ }
  }

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }))

  const handleSave = () => {
    startTransition(async () => {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.set(k, String(v)))
      await updateProfileAction(fd)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    })
  }

  const handlePortal = async () => {
    setPortalLoading(true)
    try {
      const res = await fetch('/api/portal', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert(data.error ?? 'Erreur portail')
    } finally {
      setPortalLoading(false)
    }
  }

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const res = await fetch('/api/export')
      if (!res.ok) { alert('Erreur lors de l\'export.'); return }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `voltpilot-data-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExportLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'SUPPRIMER') return
    setDeleteLoading(true)
    try {
      const res = await fetch('/api/delete-account', { method: 'POST' })
      const data = await res.json()
      if (!data.ok) { alert(data.error ?? 'Erreur'); setDeleteLoading(false); return }
      window.location.href = '/login'
    } catch {
      alert('Erreur lors de la suppression.')
      setDeleteLoading(false)
    }
  }

  const baseUrl = process.env.NEXT_PUBLIC_URL ?? 'https://voltpilot.fr'
  const embedCode = userId ? buildEmbedCode(userId, baseUrl) : '…chargement…'

  const buttonCode = userId ? buildButtonCode(userId, baseUrl, form.couleur_primaire || '#7c3aed') : '…chargement…'

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyBtn = () => {
    navigator.clipboard.writeText(buttonCode)
    setCopiedBtn(true)
    setTimeout(() => setCopiedBtn(false), 2000)
  }

  return (
    <div className="flex-1 overflow-auto">
      <Header title="Paramètres" subtitle="Configuration de votre entreprise" />

      <div className="p-6 max-w-3xl mx-auto space-y-5">

        {/* Abonnement */}
        <div className="volt-card p-6">
          <h2 className="font-bold mb-5 flex items-center gap-2" style={{ color: 'var(--nova)' }}>
            <CreditCard size={18} style={{ color: 'var(--solar)' }} /> Mon abonnement
          </h2>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: plan === 'pro' ? 'linear-gradient(135deg, var(--nebula), var(--indigo))' : 'rgba(255,255,255,0.06)', border: '1px solid var(--border-dim)' }}
              >
                <Zap size={20} style={{ color: plan === 'pro' ? '#fff' : 'var(--star)' }} />
              </div>
              <div>
                <p className="font-bold text-base" style={{ color: 'var(--nova)' }}>
                  Plan {plan === 'pro' ? 'Pro' : 'Starter'}
                </p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--star)' }}>
                  {subscriptionStatus === 'trialing' && 'Essai gratuit en cours'}
                  {subscriptionStatus === 'active' && 'Abonnement actif'}
                  {subscriptionStatus === 'past_due' && '⚠️ Paiement en échec'}
                  {subscriptionStatus === 'cancelled' && 'Abonnement annulé'}
                  {plan === 'starter' && subscriptionStatus === 'active' && ' · 30 devis/mois · 20 clients'}
                  {plan === 'pro' && subscriptionStatus === 'active' && ' · Illimité'}
                </p>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              {subscriptionStatus !== 'active' || plan !== 'pro' ? (
                <a
                  href="/billing"
                  className="btn-primary text-sm"
                >
                  <Zap size={14} /> Passer en Pro
                </a>
              ) : null}
              <button
                onClick={handlePortal}
                disabled={portalLoading}
                className="btn-secondary text-sm"
              >
                {portalLoading ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                Gérer mon abonnement
              </button>
            </div>
          </div>
          {plan === 'starter' && (
            <div
              className="mt-4 p-3 rounded-xl flex items-center justify-between flex-wrap gap-2"
              style={{ background: 'rgba(245,166,35,0.07)', border: '1px solid rgba(245,166,35,0.2)' }}
            >
              <p className="text-xs" style={{ color: 'rgba(245,166,35,0.9)' }}>
                Plan Starter — 30 devis/mois, 20 clients. <strong>Pro</strong> = illimité + analytics avancés + support 7j/7.
              </p>
              <a href="/billing" className="text-xs font-bold" style={{ color: 'var(--solar)' }}>
                Voir les plans →
              </a>
            </div>
          )}
        </div>

        {/* Logo & Identité */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
            <Sun size={18} className="text-sky-500" /> Identité de l&apos;entreprise
          </h2>
          <div className="flex items-start gap-6 mb-6">
            {/* Logo preview */}
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-200"
              style={{ background: logoDataUrl ? '#fff' : (form.couleur_primaire || '#7c3aed') }}>
              {logoDataUrl
                ? <img src={logoDataUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                : <Sun size={36} className="text-white" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-700 mb-1">Logo de l&apos;entreprise</p>
              <p className="text-xs text-slate-400 mb-3">Apparaît sur vos devis PDF. PNG, JPG ou SVG · Max 2 Mo</p>
              <div className="flex items-center gap-2 flex-wrap">
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                  onChange={handleLogoFile} className="hidden" id="logo-upload" />
                <label htmlFor="logo-upload" className="btn-secondary text-sm cursor-pointer flex items-center gap-1.5">
                  <Upload size={13} /> {logoDataUrl ? 'Changer le logo' : 'Importer un logo'}
                </label>
                {logoDataUrl && (
                  <button type="button" onClick={removeLogo}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors border border-red-100">
                    <X size={13} /> Supprimer
                  </button>
                )}
              </div>
              {logoError && <p className="text-xs text-red-500 mt-2">{logoError}</p>}
            </div>
          </div>

          {/* Signature toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl border mb-6"
            style={{ border: signatureActive ? '1.5px solid #7c3aed' : '1.5px solid #e4e7ec', background: signatureActive ? 'rgba(34,211,238,0.04)' : '#fafafa' }}>
            <div className="flex items-center gap-3">
              <PenLine size={16} style={{ color: '#7c3aed' }} />
              <div>
                <p className="text-sm font-semibold text-slate-800">Zone de signature sur les devis PDF</p>
                <p className="text-xs text-slate-400">Ajoute deux blocs signature (installateur + client) en bas du PDF</p>
              </div>
            </div>
            <button type="button" onClick={toggleSignature}
              className="w-11 h-6 rounded-full flex items-center px-0.5 transition-colors flex-shrink-0"
              style={{ background: signatureActive ? '#7c3aed' : '#e2e8f0' }}>
              <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${signatureActive ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nom de l&apos;entreprise</label>
              <input type="text" value={form.nom} onChange={set('nom')} className="input-field" placeholder="Mon Entreprise Solaire" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Téléphone</label>
              <input type="text" value={form.telephone} onChange={set('telephone')} className="input-field" placeholder="06 12 34 56 78" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Couleur principale (PDF)</label>
              <div className="flex items-center gap-3">
                <input type="color" value={form.couleur_primaire} onChange={set('couleur_primaire')} className="w-12 h-10 rounded-lg cursor-pointer border border-slate-200" />
                <input type="text" value={form.couleur_primaire} onChange={set('couleur_primaire')} className="input-field" maxLength={7} />
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Adresse</label>
              <input type="text" value={form.adresse} onChange={set('adresse')} className="input-field" placeholder="12 Rue du Soleil" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Code postal</label>
              <input type="text" value={form.code_postal} onChange={set('code_postal')} className="input-field" placeholder="75001" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ville</label>
              <input type="text" value={form.ville} onChange={set('ville')} className="input-field" placeholder="Paris" />
            </div>
          </div>
        </div>

        {/* Infos légales */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="font-bold text-slate-900 mb-4">Informations légales</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">SIRET</label>
              <input type="text" value={form.siret} onChange={set('siret')} className="input-field" maxLength={14} placeholder="00000000000000" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">N° TVA</label>
              <input type="text" value={form.tva} onChange={set('tva')} className="input-field" placeholder="FR00000000000" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">N° RGE / QualiPV</label>
              <input type="text" value={form.rge_number} onChange={set('rge_number')} className="input-field" placeholder="[À COMPLÉTER]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">N° assurance décennale</label>
              <input type="text" value={form.assurance_decennale} onChange={set('assurance_decennale')} className="input-field" placeholder="[À COMPLÉTER]" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mentions légales (devis)</label>
              <textarea value={form.mentions_legales} onChange={set('mentions_legales')} rows={3} className="input-field resize-none" placeholder="Conditions générales, garanties..." />
            </div>
          </div>
        </div>

        {/* Coordonnées bancaires */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="font-bold text-slate-900 mb-4">Coordonnées bancaires</h2>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">IBAN</label>
            <input type="text" value={form.iban} onChange={set('iban')} className="input-field" placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX" />
            <p className="text-xs text-slate-400 mt-1.5">Apparaît sur vos factures</p>
          </div>
        </div>

        {/* Devis par défaut */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="font-bold text-slate-900 mb-4">Paramètres devis par défaut</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Conditions de paiement</label>
              <select value={form.conditions_paiement_defaut} onChange={set('conditions_paiement_defaut')} className="select-field">
                <option>30 jours net</option>
                <option>50% à la commande</option>
                <option>40% acompte, 60% à la livraison</option>
                <option>À réception de facture</option>
                <option>Comptant</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Validité devis (jours)</label>
              <input type="number" value={form.validite_devis_defaut} onChange={set('validite_devis_defaut')} className="input-field" min={7} max={90} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Garanties par défaut</label>
              <textarea value={form.garanties_defaut} onChange={set('garanties_defaut')} rows={3} className="input-field resize-none" placeholder="Garantie décennale 10 ans. Garantie produits selon fabricant." />
            </div>
          </div>
        </div>

        {/* Numérotation */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="font-bold text-slate-900 mb-4">Numérotation</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Format numérotation devis</label>
              <input type="text" value={form.format_numero_devis} onChange={set('format_numero_devis')} className="input-field" placeholder="DEV-{YYYY}-{NUM}" />
              <p className="text-xs text-slate-400 mt-1.5">Ex : DEV-{'{YYYY}'}-{'{NUM}'}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Format numérotation factures</label>
              <input type="text" value={form.format_numero_facture} onChange={set('format_numero_facture')} className="input-field" placeholder="FAC-{YYYY}-{NUM}" />
              <p className="text-xs text-slate-400 mt-1.5">Ex : FAC-{'{YYYY}'}-{'{NUM}'}</p>
            </div>
          </div>
        </div>

        {/* Hypothèses économiques */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="font-bold text-slate-900 mb-3">Hypothèses économiques</h2>
          <div className="flex items-start gap-2 p-3 rounded-xl mb-4" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <span className="text-amber-500 flex-shrink-0 mt-0.5">⚠</span>
            <p className="text-xs text-amber-700 leading-relaxed">Ces valeurs sont des hypothèses indicatives à vérifier selon la réglementation en vigueur</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Prime autoconsommation (€/kWc)</label>
              <input type="text" value={form.prime_autoconsommation} onChange={set('prime_autoconsommation')} className="input-field" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tarif de rachat du surplus (€/kWh)</label>
              <input type="text" value={form.tarif_rachat_surplus} onChange={set('tarif_rachat_surplus')} className="input-field" placeholder="0.1288" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Note sur les hypothèses</label>
              <textarea value={form.hypotheses_note} onChange={set('hypotheses_note')} rows={3} className="input-field resize-none" placeholder="Hypothèses à vérifier selon réglementation en vigueur." />
            </div>
          </div>
        </div>

        {/* Abonnement */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="font-bold text-slate-900 mb-4">Mon abonnement</h2>
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.07), rgba(249,115,22,0.04))', border: '1px solid rgba(34,211,238,0.2)' }}>
            <div>
              <p className="font-bold text-slate-900">Plan Pro</p>
              <p className="text-sm text-slate-500">Devis illimités · Clients illimités · 49€/mois</p>
            </div>
            <button className="btn-secondary text-sm" type="button">Gérer l&apos;abonnement</button>
          </div>
        </div>

        {/* Widget */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="font-bold text-slate-900 mb-1 flex items-center gap-2">
            <Code2 size={18} className="text-indigo-500" /> Intégrer VoltPilot sur votre site
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            Copiez ce code et collez-le sur votre site. Vos visiteurs pourront demander un devis directement depuis votre page.
          </p>

          {/* Toggle affichage prix */}
          <div className="flex items-center justify-between p-4 rounded-xl border mb-5"
            style={{ border: form.widget_show_price ? '1.5px solid #7c3aed' : '1.5px solid #e4e7ec', background: form.widget_show_price ? 'rgba(34,211,238,0.04)' : '#fafafa' }}>
            <div>
              <p className="text-sm font-semibold text-slate-800">Afficher la fourchette de prix aux visiteurs</p>
              <p className="text-xs text-slate-400">Si désactivé, l&apos;estimation de production reste visible mais le prix est masqué</p>
            </div>
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, widget_show_price: !prev.widget_show_price }))}
              className="w-11 h-6 rounded-full flex items-center px-0.5 transition-colors flex-shrink-0 ml-4"
              style={{ background: form.widget_show_price ? '#7c3aed' : '#e2e8f0' }}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${form.widget_show_price ? 'translate-x-5' : ''}`} />
            </button>
          </div>
          <div className="mb-4 rounded-xl overflow-hidden border border-slate-100" style={{ height: 320 }}>
            {userId && <iframe src={`/w/${userId}`} width="100%" height="320" style={{ border: 'none', display: 'block' }} title="Aperçu widget" />}
          </div>
          <div className="relative">
            <pre className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs overflow-x-auto leading-relaxed select-all">{embedCode}</pre>
            <button
              type="button"
              onClick={handleCopy}
              className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={copied ? { background: 'rgba(34,197,94,0.15)', color: '#16a34a' } : { background: 'rgba(255,255,255,0.1)', color: '#e2e8f0' }}
            >
              {copied ? <><CheckCheck size={13} /> Copié !</> : <><Copy size={13} /> Copier</>}
            </button>
          </div>
          <div className="mt-3">
            {userId && (
              <a href={`/w/${userId}`} target="_blank" className="flex items-center gap-1.5 text-sm text-indigo-500 font-medium hover:underline">
                <ExternalLink size={14} /> Voir l&apos;aperçu plein écran
              </a>
            )}
          </div>

          {/* Bouton HTML prêt à copier */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <h3 className="font-semibold text-slate-800 mb-1 flex items-center gap-2 text-sm">
              <MousePointerClick size={15} className="text-indigo-500" /> Option 2 — Bouton cliquable
            </h3>
            <p className="text-xs text-slate-400 mb-3">Collez ce bouton n&apos;importe où sur votre site. Un clic ouvre le formulaire dans un nouvel onglet.</p>

            {/* Aperçu du bouton */}
            <div className="mb-3 p-4 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
              {userId && (
                <a
                  href={`/w/${userId}`}
                  target="_blank"
                  style={{ display: 'inline-block', background: form.couleur_primaire || '#7c3aed', color: 'white', padding: '12px 24px', borderRadius: '10px', fontFamily: 'sans-serif', fontSize: '14px', fontWeight: 700, textDecoration: 'none' }}
                >
                  ☀️ Demander un devis solaire gratuit
                </a>
              )}
            </div>

            <div className="relative">
              <pre className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs overflow-x-auto leading-relaxed select-all">{buttonCode}</pre>
              <button
                type="button"
                onClick={handleCopyBtn}
                className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={copiedBtn ? { background: 'rgba(34,197,94,0.15)', color: '#16a34a' } : { background: 'rgba(255,255,255,0.1)', color: '#e2e8f0' }}
              >
                {copiedBtn ? <><CheckCheck size={13} /> Copié !</> : <><Copy size={13} /> Copier</>}
              </button>
            </div>
          </div>
        </div>

        {/* Mes données — RGPD */}
        <div className="volt-card p-6">
          <h2 className="font-bold mb-5 flex items-center gap-2" style={{ color: 'var(--nova)' }}>
            <Download size={18} style={{ color: 'var(--nebula-bright)' }} /> Mes données
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-dim)' }}>
              <div className="flex-1">
                <p className="font-semibold text-sm" style={{ color: 'var(--nova)' }}>Exporter mes données</p>
                <p className="text-xs mt-1" style={{ color: 'var(--star)' }}>Télécharger toutes vos données (profil, clients, devis, factures, leads) au format JSON.</p>
              </div>
              <button
                type="button"
                onClick={handleExport}
                disabled={exportLoading}
                className="btn-secondary text-sm flex-shrink-0"
              >
                {exportLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                Exporter
              </button>
            </div>

            <div className="flex items-start gap-4 p-4 rounded-xl" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <div className="flex-1">
                <p className="font-semibold text-sm text-red-400">Supprimer mon compte</p>
                <p className="text-xs mt-1" style={{ color: 'var(--star)' }}>Supprime définitivement votre compte et toutes vos données. Cette action est irréversible.</p>
              </div>
              <button
                type="button"
                onClick={() => { setShowDeleteConfirm(true); setDeleteConfirmText('') }}
                className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}
              >
                <Trash2 size={14} /> Supprimer
              </button>
            </div>
          </div>
        </div>

        {/* Delete confirmation modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
            <div className="volt-card p-6 max-w-md w-full space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(239,68,68,0.15)' }}>
                  <AlertTriangle size={20} className="text-red-400" />
                </div>
                <div>
                  <p className="font-bold" style={{ color: 'var(--nova)' }}>Supprimer mon compte</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--star)' }}>Cette action est définitive et irréversible.</p>
                </div>
              </div>
              <p className="text-sm" style={{ color: 'var(--star)' }}>
                Tous vos clients, devis, factures et données seront <strong className="text-red-400">supprimés définitivement</strong>. Votre abonnement Stripe sera annulé automatiquement depuis le portail.
              </p>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--star)' }}>
                  Tapez <strong className="text-red-400">SUPPRIMER</strong> pour confirmer
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder="SUPPRIMER"
                  className="input-field w-full"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn-secondary text-sm"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'SUPPRIMER' || deleteLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                  style={{ background: deleteConfirmText === 'SUPPRIMER' ? '#dc2626' : 'rgba(239,68,68,0.3)', color: '#fff' }}
                >
                  {deleteLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  Supprimer définitivement
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end items-center gap-3 pb-6">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-semibold">
              <CheckCircle2 size={15} /> Paramètres sauvegardés
            </span>
          )}
          <button type="button" onClick={handleSave} disabled={isPending} className="btn-primary">
            {isPending ? 'Sauvegarde…' : <><Save size={16} /> Sauvegarder</>}
          </button>
        </div>
      </div>
    </div>
  )
}
