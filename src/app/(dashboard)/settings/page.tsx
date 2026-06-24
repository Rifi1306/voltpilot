'use client'
import { useState, useEffect, useTransition, useRef } from 'react'
import { Header } from '@/components/layout/Header'
import { getProfile, updateProfileAction } from '@/lib/actions/profile'
import { Sun, Save, Code2, Copy, CheckCheck, ExternalLink, CheckCircle2, Upload, X, PenLine } from 'lucide-react'

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
  couleur_primaire: '#0ea5e9',
  widget_show_price: true,
}

export default function SettingsPage() {
  const [form, setForm] = useState<Form>(DEFAULT_FORM)
  const [userId, setUserId] = useState('')
  const [copied, setCopied] = useState(false)
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
          couleur_primaire: p.couleur_primaire ?? '#0ea5e9',
          widget_show_price: p.widget_show_price ?? true,
        })
      }
    }).catch(console.error)
    // Load logo + signature pref from localStorage
    try {
      const logo = localStorage.getItem(LOGO_KEY)
      if (logo) setLogoDataUrl(logo)
      setSignatureActive(localStorage.getItem(SIG_KEY) === 'true')
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

  const baseUrl = process.env.NEXT_PUBLIC_URL ?? 'https://voltpilot.fr'
  const embedCode = userId ? buildEmbedCode(userId, baseUrl) : '…chargement…'

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex-1 overflow-auto">
      <Header title="Paramètres" subtitle="Configuration de votre entreprise" />

      <div className="p-6 max-w-3xl mx-auto space-y-5">
        {/* Logo & Identité */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
            <Sun size={18} className="text-sky-500" /> Identité de l&apos;entreprise
          </h2>
          <div className="flex items-start gap-6 mb-6">
            {/* Logo preview */}
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden border border-slate-200"
              style={{ background: logoDataUrl ? '#fff' : (form.couleur_primaire || '#0ea5e9') }}>
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
            style={{ border: signatureActive ? '1.5px solid #0ea5e9' : '1.5px solid #e4e7ec', background: signatureActive ? 'rgba(14,165,233,0.04)' : '#fafafa' }}>
            <div className="flex items-center gap-3">
              <PenLine size={16} style={{ color: '#0ea5e9' }} />
              <div>
                <p className="text-sm font-semibold text-slate-800">Zone de signature sur les devis PDF</p>
                <p className="text-xs text-slate-400">Ajoute deux blocs signature (installateur + client) en bas du PDF</p>
              </div>
            </div>
            <button type="button" onClick={toggleSignature}
              className="w-11 h-6 rounded-full flex items-center px-0.5 transition-colors flex-shrink-0"
              style={{ background: signatureActive ? '#0ea5e9' : '#e2e8f0' }}>
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
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mentions légales (devis)</label>
              <textarea value={form.mentions_legales} onChange={set('mentions_legales')} rows={3} className="input-field resize-none" placeholder="Conditions générales, garanties..." />
            </div>
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
          </div>
        </div>

        {/* Abonnement */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="font-bold text-slate-900 mb-4">Mon abonnement</h2>
          <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.07), rgba(249,115,22,0.04))', border: '1px solid rgba(14,165,233,0.2)' }}>
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
            style={{ border: form.widget_show_price ? '1.5px solid #0ea5e9' : '1.5px solid #e4e7ec', background: form.widget_show_price ? 'rgba(14,165,233,0.04)' : '#fafafa' }}>
            <div>
              <p className="text-sm font-semibold text-slate-800">Afficher la fourchette de prix aux visiteurs</p>
              <p className="text-xs text-slate-400">Si désactivé, l&apos;estimation de production reste visible mais le prix est masqué</p>
            </div>
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, widget_show_price: !prev.widget_show_price }))}
              className="w-11 h-6 rounded-full flex items-center px-0.5 transition-colors flex-shrink-0 ml-4"
              style={{ background: form.widget_show_price ? '#0ea5e9' : '#e2e8f0' }}
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
        </div>

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
