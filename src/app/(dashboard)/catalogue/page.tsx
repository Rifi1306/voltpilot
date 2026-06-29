'use client'
import { useState, useEffect, useCallback } from 'react'
import { Header } from '@/components/layout/Header'
import {
  getCatalogue,
  getKits,
  createProduitAction,
  updateProduitAction,
  deleteProduitAction,
  createKitAction,
  deleteKitAction,
} from '@/lib/actions/catalogue'
import { FAMILLES, type ProduitCatalogue, type Kit, type LigneKit } from '@/lib/catalogue-shared'
import {
  Plus, Package, Search, Pencil, Trash2, X, ChevronDown, ChevronRight,
  Box, Check, Layers, AlertCircle,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type FamilleKey = typeof FAMILLES[number]['key']

type ProduitForm = {
  reference: string
  designation: string
  famille: FamilleKey
  description: string
  marque: string
  modele: string
  unite: string
  prix_achat: string
  prix_vente: string
  tva: string
  type_projet: string
  actif: boolean
  ordre: string
}

const EMPTY_FORM: ProduitForm = {
  reference: '',
  designation: '',
  famille: 'modules',
  description: '',
  marque: '',
  modele: '',
  unite: 'unité',
  prix_achat: '',
  prix_vente: '',
  tva: '20',
  type_projet: 'les_deux',
  actif: true,
  ordre: '0',
}

const UNITES = ['unité', 'm', 'm²', 'h', 'forfait', 'kWc', 'kWh']
const TVA_OPTIONS = ['0', '5.5', '10', '20']
const TYPE_PROJET_OPTIONS = [
  { value: 'residentiel', label: 'Résidentiel' },
  { value: 'tertiaire', label: 'Tertiaire' },
  { value: 'les_deux', label: 'Les deux' },
]

function labelFamille(key: string) {
  return FAMILLES.find(f => f.key === key)?.label ?? key
}

function labelTypeProjet(v: string) {
  return TYPE_PROJET_OPTIONS.find(o => o.value === v)?.label ?? v
}

// ─── Modal produit ─────────────────────────────────────────────────────────────

function ModalProduit({
  produit,
  onClose,
  onSaved,
}: {
  produit: ProduitCatalogue | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!produit

  const [form, setForm] = useState<ProduitForm>(() =>
    produit
      ? {
          reference: produit.reference ?? '',
          designation: produit.designation,
          famille: produit.famille as FamilleKey,
          description: produit.description ?? '',
          marque: produit.marque ?? '',
          modele: produit.modele ?? '',
          unite: produit.unite,
          prix_achat: String(produit.prix_achat),
          prix_vente: String(produit.prix_vente),
          tva: String(produit.tva),
          type_projet: produit.type_projet,
          actif: produit.actif,
          ordre: String(produit.ordre),
        }
      : EMPTY_FORM
  )

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof ProduitForm>(k: K, v: ProduitForm[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.designation.trim()) { setError('La désignation est requise.'); return }
    if (Number(form.prix_achat) < 0 || Number(form.prix_vente) < 0) { setError('Les prix doivent être ≥ 0.'); return }
    setSaving(true)
    setError(null)

    const payload = {
      reference: form.reference || undefined,
      designation: form.designation.trim(),
      famille: form.famille,
      description: form.description || undefined,
      marque: form.marque || undefined,
      modele: form.modele || undefined,
      unite: form.unite,
      prix_achat: Number(form.prix_achat) || 0,
      prix_vente: Number(form.prix_vente) || 0,
      tva: Number(form.tva),
      type_projet: form.type_projet,
      actif: form.actif,
      ordre: Number(form.ordre) || 0,
    }

    const res = isEdit
      ? await updateProduitAction(produit!.id, payload)
      : await createProduitAction(payload)

    if ('error' in res) { setError(res.error); setSaving(false); return }
    onSaved()
    onClose()
  }

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1.5px solid var(--border-bright)',
    borderRadius: '10px',
    color: 'var(--nova)',
    padding: '8px 12px',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.06em',
    color: 'var(--dust)',
    textTransform: 'uppercase',
    marginBottom: '5px',
  }

  function onFocus(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    e.target.style.borderColor = 'var(--nebula)'
    e.target.style.boxShadow = '0 0 0 3px var(--nebula-glow)'
  }
  function onBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    e.target.style.borderColor = 'var(--border-bright)'
    e.target.style.boxShadow = 'none'
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ background: '#07091f', border: '1px solid var(--border-nebula)' }}
      >
        {/* Header modal */}
        <div
          className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
          style={{ background: '#07091f', borderBottom: '1px solid var(--border-dim)' }}
        >
          <h2 className="font-bold text-base" style={{ color: 'var(--nova)', fontFamily: "'Sora', sans-serif" }}>
            {isEdit ? 'Modifier l\'article' : 'Ajouter un article'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--star)' }}
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div
              className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
            >
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {/* Row 1 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label style={labelStyle}>Désignation *</label>
              <input
                style={inputStyle}
                value={form.designation}
                onChange={e => set('designation', e.target.value)}
                onFocus={onFocus} onBlur={onBlur}
                placeholder="Ex: Module 400Wc"
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Référence</label>
              <input
                style={inputStyle}
                value={form.reference}
                onChange={e => set('reference', e.target.value)}
                onFocus={onFocus} onBlur={onBlur}
                placeholder="Ex: MOD-400W"
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Famille</label>
              <select
                style={{ ...inputStyle, appearance: 'none' as const }}
                value={form.famille}
                onChange={e => set('famille', e.target.value as FamilleKey)}
                onFocus={onFocus} onBlur={onBlur}
              >
                {FAMILLES.map(f => (
                  <option key={f.key} value={f.key} style={{ background: '#07091f' }}>{f.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Type projet</label>
              <select
                style={{ ...inputStyle, appearance: 'none' as const }}
                value={form.type_projet}
                onChange={e => set('type_projet', e.target.value)}
                onFocus={onFocus} onBlur={onBlur}
              >
                {TYPE_PROJET_OPTIONS.map(o => (
                  <option key={o.value} value={o.value} style={{ background: '#07091f' }}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3 */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label style={labelStyle}>Marque</label>
              <input
                style={inputStyle}
                value={form.marque}
                onChange={e => set('marque', e.target.value)}
                onFocus={onFocus} onBlur={onBlur}
                placeholder="Ex: SunPower"
              />
            </div>
            <div>
              <label style={labelStyle}>Modèle</label>
              <input
                style={inputStyle}
                value={form.modele}
                onChange={e => set('modele', e.target.value)}
                onFocus={onFocus} onBlur={onBlur}
                placeholder="Ex: SPR-400E"
              />
            </div>
            <div>
              <label style={labelStyle}>Unité</label>
              <select
                style={{ ...inputStyle, appearance: 'none' as const }}
                value={form.unite}
                onChange={e => set('unite', e.target.value)}
                onFocus={onFocus} onBlur={onBlur}
              >
                {UNITES.map(u => (
                  <option key={u} value={u} style={{ background: '#07091f' }}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4 — Prix */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label style={labelStyle}>Prix achat HT (€)</label>
              <input
                type="number" min="0" step="0.01"
                style={inputStyle}
                value={form.prix_achat}
                onChange={e => set('prix_achat', e.target.value)}
                onFocus={onFocus} onBlur={onBlur}
                placeholder="0.00"
              />
            </div>
            <div>
              <label style={labelStyle}>Prix vente HT (€)</label>
              <input
                type="number" min="0" step="0.01"
                style={inputStyle}
                value={form.prix_vente}
                onChange={e => set('prix_vente', e.target.value)}
                onFocus={onFocus} onBlur={onBlur}
                placeholder="0.00"
              />
            </div>
            <div>
              <label style={labelStyle}>TVA (%)</label>
              <select
                style={{ ...inputStyle, appearance: 'none' as const }}
                value={form.tva}
                onChange={e => set('tva', e.target.value)}
                onFocus={onFocus} onBlur={onBlur}
              >
                {TVA_OPTIONS.map(t => (
                  <option key={t} value={t} style={{ background: '#07091f' }}>{t} %</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              onFocus={onFocus} onBlur={onBlur}
              placeholder="Description optionnelle…"
            />
          </div>

          {/* Actif + Ordre */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => set('actif', !form.actif)}
                className="w-10 h-5 rounded-full relative transition-all"
                style={{
                  background: form.actif ? 'var(--nebula)' : 'rgba(255,255,255,0.12)',
                  cursor: 'pointer',
                }}
              >
                <div
                  className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                  style={{ left: form.actif ? '22px' : '2px' }}
                />
              </div>
              <span style={{ fontSize: '13px', color: 'var(--star)' }}>Article actif</span>
            </label>
            <div className="flex items-center gap-2">
              <label style={{ ...labelStyle, marginBottom: 0, whiteSpace: 'nowrap' }}>Ordre</label>
              <input
                type="number" min="0"
                style={{ ...inputStyle, width: '70px' }}
                value={form.ordre}
                onChange={e => set('ordre', e.target.value)}
                onFocus={onFocus} onBlur={onBlur}
              />
            </div>
          </div>

          {/* Actions */}
          <div
            className="flex items-center justify-end gap-3 pt-4"
            style={{ borderTop: '1px solid var(--border-dim)' }}
          >
            <button type="button" onClick={onClose} className="btn-secondary">
              Annuler
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <span className="volt-spinner" style={{ width: 16, height: 16 }} /> : <Check size={14} />}
              {isEdit ? 'Enregistrer' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Modal Kit ─────────────────────────────────────────────────────────────────

function ModalKit({
  catalogue,
  onClose,
  onSaved,
}: {
  catalogue: ProduitCatalogue[]
  onClose: () => void
  onSaved: () => void
}) {
  const [nom, setNom] = useState('')
  const [description, setDescription] = useState('')
  const [typeProjet, setTypeProjet] = useState('les_deux')
  const [selected, setSelected] = useState<Record<string, number>>({})
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filtered = catalogue.filter(p =>
    !search ||
    p.designation.toLowerCase().includes(search.toLowerCase()) ||
    (p.marque ?? '').toLowerCase().includes(search.toLowerCase())
  )

  function toggleProduit(id: string) {
    setSelected(s => {
      if (s[id]) { const n = { ...s }; delete n[id]; return n }
      return { ...s, [id]: 1 }
    })
  }

  function setQty(id: string, qty: number) {
    if (qty <= 0) { setSelected(s => { const n = { ...s }; delete n[id]; return n }); return }
    setSelected(s => ({ ...s, [id]: qty }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nom.trim()) { setError('Le nom du kit est requis.'); return }
    const ids = Object.keys(selected)
    if (ids.length === 0) { setError('Sélectionnez au moins un article.'); return }

    setSaving(true)
    setError(null)

    const lignes: LigneKit[] = ids.map(id => {
      const p = catalogue.find(c => c.id === id)!
      return {
        produit_id: id,
        designation: p.designation,
        quantite: selected[id],
        prix_unitaire: p.prix_vente,
        tva: p.tva,
      }
    })

    const res = await createKitAction({ nom: nom.trim(), description: description || undefined, type_projet: typeProjet, lignes })
    if ('error' in res) { setError(res.error); setSaving(false); return }
    onSaved()
    onClose()
  }

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1.5px solid var(--border-bright)',
    borderRadius: '10px',
    color: 'var(--nova)',
    padding: '8px 12px',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.06em',
    color: 'var(--dust)',
    textTransform: 'uppercase',
    marginBottom: '5px',
  }
  function onFocus(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    e.target.style.borderColor = 'var(--nebula)'
    e.target.style.boxShadow = '0 0 0 3px var(--nebula-glow)'
  }
  function onBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    e.target.style.borderColor = 'var(--border-bright)'
    e.target.style.boxShadow = 'none'
  }

  const selectedCount = Object.keys(selected).length

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ background: '#07091f', border: '1px solid var(--border-nebula)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
          style={{ background: '#07091f', borderBottom: '1px solid var(--border-dim)' }}
        >
          <h2 className="font-bold text-base" style={{ color: 'var(--nova)', fontFamily: "'Sora', sans-serif" }}>
            Créer un kit
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--star)' }}
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div
              className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
            >
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 md:col-span-1">
              <label style={labelStyle}>Nom du kit *</label>
              <input
                style={inputStyle}
                value={nom}
                onChange={e => setNom(e.target.value)}
                onFocus={onFocus} onBlur={onBlur}
                placeholder="Ex: Kit 3kWc Résidentiel"
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Type projet</label>
              <select
                style={{ ...inputStyle, appearance: 'none' as const }}
                value={typeProjet}
                onChange={e => setTypeProjet(e.target.value)}
                onFocus={onFocus} onBlur={onBlur}
              >
                {TYPE_PROJET_OPTIONS.map(o => (
                  <option key={o.value} value={o.value} style={{ background: '#07091f' }}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <input
              style={inputStyle}
              value={description}
              onChange={e => setDescription(e.target.value)}
              onFocus={e => { e.target.style.borderColor = 'var(--nebula)'; e.target.style.boxShadow = '0 0 0 3px var(--nebula-glow)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border-bright)'; e.target.style.boxShadow = 'none' }}
              placeholder="Description optionnelle…"
            />
          </div>

          {/* Sélection d'articles */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label style={labelStyle}>Articles du kit</label>
              <span style={{ fontSize: '12px', color: 'var(--nebula-bright)' }}>
                {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
              </span>
            </div>
            <div className="relative mb-3">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--dust)' }} />
              <input
                style={{ ...inputStyle, paddingLeft: '32px' }}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={onFocus} onBlur={onBlur}
                placeholder="Rechercher un article…"
              />
            </div>
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid var(--border-dim)', maxHeight: '280px', overflowY: 'auto' }}
            >
              {catalogue.length === 0 && (
                <div className="py-8 text-center" style={{ color: 'var(--dust)', fontSize: '13px' }}>
                  Aucun article dans le catalogue
                </div>
              )}
              {filtered.map((p, i) => {
                const isChecked = !!selected[p.id]
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all"
                    style={{
                      borderTop: i > 0 ? '1px solid var(--border-dim)' : undefined,
                      background: isChecked ? 'rgba(124,58,237,0.08)' : 'transparent',
                    }}
                    onMouseEnter={e => { if (!isChecked) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = isChecked ? 'rgba(124,58,237,0.08)' : 'transparent' }}
                  >
                    <div
                      onClick={() => toggleProduit(p.id)}
                      className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                      style={{
                        background: isChecked ? 'var(--nebula)' : 'transparent',
                        border: isChecked ? '1px solid var(--nebula)' : '1px solid var(--border-bright)',
                        cursor: 'pointer',
                      }}
                    >
                      {isChecked && <Check size={10} color="white" strokeWidth={3} />}
                    </div>
                    <div className="flex-1 min-w-0" onClick={() => toggleProduit(p.id)}>
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--nova)' }}>{p.designation}</p>
                      <p className="text-xs" style={{ color: 'var(--dust)' }}>
                        {labelFamille(p.famille)}{p.marque ? ` · ${p.marque}` : ''} · {p.prix_vente.toFixed(2)} € / {p.unite}
                      </p>
                    </div>
                    {isChecked && (
                      <input
                        type="number"
                        min="1"
                        value={selected[p.id]}
                        onChange={e => setQty(p.id, Number(e.target.value))}
                        onClick={e => e.stopPropagation()}
                        style={{
                          width: '56px',
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid var(--border-bright)',
                          borderRadius: '8px',
                          color: 'var(--nova)',
                          padding: '3px 8px',
                          fontSize: '12px',
                          textAlign: 'center',
                          outline: 'none',
                        }}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div
            className="flex items-center justify-end gap-3 pt-4"
            style={{ borderTop: '1px solid var(--border-dim)' }}
          >
            <button type="button" onClick={onClose} className="btn-secondary">Annuler</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <span className="volt-spinner" style={{ width: 16, height: 16 }} /> : <Layers size={14} />}
              Créer le kit
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Page principale ────────────────────────────────────────────────────────────

export default function CataloguePage() {
  const [catalogue, setCatalogue] = useState<ProduitCatalogue[]>([])
  const [kits, setKits] = useState<Kit[]>([])
  const [loading, setLoading] = useState(true)

  // Filtres
  const [filterFamille, setFilterFamille] = useState<string>('all')
  const [filterTypeProjet, setFilterTypeProjet] = useState<string>('all')
  const [filterActif, setFilterActif] = useState<string>('all')
  const [search, setSearch] = useState('')

  // Modals
  const [modalProduit, setModalProduit] = useState<'create' | ProduitCatalogue | null>(null)
  const [modalKit, setModalKit] = useState(false)

  // Sections repliées
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  // Confirmation suppression
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [confirmDeleteKit, setConfirmDeleteKit] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [c, k] = await Promise.all([getCatalogue(), getKits()])
      setCatalogue(c)
      setKits(k)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Filtres appliqués
  const filtered = catalogue.filter(p => {
    if (filterFamille !== 'all' && p.famille !== filterFamille) return false
    if (filterTypeProjet !== 'all' && p.type_projet !== filterTypeProjet && p.type_projet !== 'les_deux') return false
    if (filterActif === 'actif' && !p.actif) return false
    if (filterActif === 'inactif' && p.actif) return false
    if (search && !p.designation.toLowerCase().includes(search.toLowerCase()) &&
        !(p.reference ?? '').toLowerCase().includes(search.toLowerCase()) &&
        !(p.marque ?? '').toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // Grouper par famille (dans l'ordre de FAMILLES)
  const grouped = FAMILLES.map(f => ({
    ...f,
    items: filtered.filter(p => p.famille === f.key),
  })).filter(g => g.items.length > 0)

  async function handleDeleteProduit(id: string) {
    setDeleting(true)
    await deleteProduitAction(id)
    setDeleting(false)
    setConfirmDelete(null)
    load()
  }

  async function handleDeleteKit(id: string) {
    setDeleting(true)
    await deleteKitAction(id)
    setDeleting(false)
    setConfirmDeleteKit(null)
    load()
  }

  async function handleToggleActif(p: ProduitCatalogue) {
    await updateProduitAction(p.id, { actif: !p.actif })
    load()
  }

  const tdStyle: React.CSSProperties = {
    padding: '10px 12px',
    fontSize: '13px',
    color: 'var(--star)',
    borderBottom: '1px solid var(--border-dim)',
    whiteSpace: 'nowrap',
  }
  const thStyle: React.CSSProperties = {
    padding: '8px 12px',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--dust)',
    textAlign: 'left',
  }

  return (
    <div className="flex-1 overflow-auto">
      <Header
        title="Catalogue matériel"
        subtitle={loading ? '…' : `${catalogue.length} article${catalogue.length > 1 ? 's' : ''}`}
      />

      <div className="p-6 space-y-6">

        {/* Actions header */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="btn-primary"
            onClick={() => setModalProduit('create')}
          >
            <Plus size={14} /> Ajouter un article
          </button>
          <button
            className="btn-secondary"
            onClick={() => setModalKit(true)}
          >
            <Layers size={14} /> Créer un kit
          </button>
        </div>

        {/* Filtres */}
        <div
          className="rounded-2xl p-4 flex flex-wrap gap-3 items-center"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-dim)' }}
        >
          {/* Recherche */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--dust)' }} />
            <input
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--border-bright)',
                borderRadius: '10px',
                color: 'var(--nova)',
                padding: '7px 12px 7px 30px',
                fontSize: '13px',
                outline: 'none',
                width: '100%',
              }}
              placeholder="Rechercher…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onFocus={e => { e.target.style.borderColor = 'var(--nebula)'; e.target.style.boxShadow = '0 0 0 3px var(--nebula-glow)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border-bright)'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          {/* Famille */}
          <select
            value={filterFamille}
            onChange={e => setFilterFamille(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border-bright)',
              borderRadius: '10px',
              color: filterFamille !== 'all' ? 'var(--nova)' : 'var(--star)',
              padding: '7px 12px',
              fontSize: '13px',
              outline: 'none',
              appearance: 'none',
              minWidth: '140px',
              cursor: 'pointer',
            }}
          >
            <option value="all" style={{ background: '#07091f' }}>Toutes familles</option>
            {FAMILLES.map(f => (
              <option key={f.key} value={f.key} style={{ background: '#07091f' }}>{f.label}</option>
            ))}
          </select>

          {/* Type projet */}
          <select
            value={filterTypeProjet}
            onChange={e => setFilterTypeProjet(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--border-bright)',
              borderRadius: '10px',
              color: filterTypeProjet !== 'all' ? 'var(--nova)' : 'var(--star)',
              padding: '7px 12px',
              fontSize: '13px',
              outline: 'none',
              appearance: 'none',
              minWidth: '130px',
              cursor: 'pointer',
            }}
          >
            <option value="all" style={{ background: '#07091f' }}>Tous projets</option>
            <option value="residentiel" style={{ background: '#07091f' }}>Résidentiel</option>
            <option value="tertiaire" style={{ background: '#07091f' }}>Tertiaire</option>
          </select>

          {/* Actif */}
          <div className="flex items-center gap-1 rounded-xl overflow-hidden" style={{ border: '1px solid var(--border-bright)' }}>
            {(['all', 'actif', 'inactif'] as const).map(v => (
              <button
                key={v}
                onClick={() => setFilterActif(v)}
                className="px-3 py-1.5 text-xs font-medium transition-all"
                style={{
                  background: filterActif === v ? 'var(--nebula)' : 'transparent',
                  color: filterActif === v ? 'white' : 'var(--star)',
                }}
              >
                {v === 'all' ? 'Tous' : v === 'actif' ? 'Actifs' : 'Inactifs'}
              </button>
            ))}
          </div>

          {/* Reset */}
          {(search || filterFamille !== 'all' || filterTypeProjet !== 'all' || filterActif !== 'all') && (
            <button
              onClick={() => { setSearch(''); setFilterFamille('all'); setFilterTypeProjet('all'); setFilterActif('all') }}
              className="text-xs transition-colors flex items-center gap-1"
              style={{ color: 'var(--dust)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--nova)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--dust)')}
            >
              <X size={12} /> Réinitialiser
            </button>
          )}
        </div>

        {/* Chargement */}
        {loading && (
          <div className="flex justify-center py-16">
            <div className="volt-spinner" />
          </div>
        )}

        {/* État vide */}
        {!loading && catalogue.length === 0 && (
          <div
            className="rounded-2xl p-12 text-center"
            style={{ background: 'rgba(255,255,255,0.02)', border: '2px dashed var(--border-bright)' }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid var(--border-nebula)' }}
            >
              <Package size={28} style={{ color: 'var(--nebula-bright)' }} />
            </div>
            <p className="font-bold text-base mb-1" style={{ color: 'var(--nova)', fontFamily: "'Sora', sans-serif" }}>
              Catalogue vide
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--star)' }}>
              Ajoutez votre premier article pour constituer votre catalogue matériel PV.
            </p>
            <button className="btn-primary" onClick={() => setModalProduit('create')}>
              <Plus size={14} /> Ajouter le premier article
            </button>
          </div>
        )}

        {/* Résultats filtrés vides */}
        {!loading && catalogue.length > 0 && filtered.length === 0 && (
          <div
            className="rounded-2xl px-6 py-10 text-center"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-dim)' }}
          >
            <p className="text-sm" style={{ color: 'var(--star)' }}>
              Aucun article ne correspond à vos filtres.
            </p>
          </div>
        )}

        {/* Liste groupée par famille */}
        {!loading && grouped.map(group => {
          const isOpen = !collapsed[group.key]
          return (
            <div
              key={group.key}
              className="rounded-2xl overflow-hidden"
              style={{ border: '1px solid var(--border-dim)' }}
            >
              {/* En-tête famille */}
              <button
                className="w-full flex items-center gap-3 px-5 py-3 transition-all text-left"
                style={{ background: 'rgba(255,255,255,0.03)' }}
                onClick={() => setCollapsed(c => ({ ...c, [group.key]: !c[group.key] }))}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
              >
                <Box size={15} style={{ color: 'var(--nebula-bright)', flexShrink: 0 }} />
                <span className="font-semibold text-sm flex-1" style={{ color: 'var(--nova)' }}>
                  {group.label}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(124,58,237,0.15)', color: 'var(--nebula-bright)' }}
                >
                  {group.items.length}
                </span>
                {isOpen ? (
                  <ChevronDown size={14} style={{ color: 'var(--dust)' }} />
                ) : (
                  <ChevronRight size={14} style={{ color: 'var(--dust)' }} />
                )}
              </button>

              {/* Tableau */}
              {isOpen && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <th style={thStyle}>Référence</th>
                        <th style={thStyle}>Désignation</th>
                        <th style={thStyle}>Marque</th>
                        <th style={thStyle}>Unité</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Prix HT</th>
                        <th style={thStyle}>TVA</th>
                        <th style={thStyle}>Projet</th>
                        <th style={thStyle}>Actif</th>
                        <th style={thStyle}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.items.map(p => (
                        <tr
                          key={p.id}
                          style={{ opacity: p.actif ? 1 : 0.5 }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={tdStyle}>
                            <span style={{ color: 'var(--dust)', fontFamily: 'monospace', fontSize: '11px' }}>
                              {p.reference ?? '—'}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, color: 'var(--nova)', fontWeight: 500, whiteSpace: 'normal', minWidth: '160px' }}>
                            {p.designation}
                            {p.modele && (
                              <span className="block text-xs" style={{ color: 'var(--dust)', fontWeight: 400 }}>{p.modele}</span>
                            )}
                          </td>
                          <td style={tdStyle}>{p.marque ?? '—'}</td>
                          <td style={tdStyle}>{p.unite}</td>
                          <td style={{ ...tdStyle, textAlign: 'right', color: 'var(--nova)', fontFamily: 'monospace' }}>
                            {p.prix_vente.toFixed(2)} €
                          </td>
                          <td style={tdStyle}>{p.tva} %</td>
                          <td style={tdStyle}>
                            <span
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{
                                background: p.type_projet === 'residentiel'
                                  ? 'rgba(34,211,238,0.12)'
                                  : p.type_projet === 'tertiaire'
                                    ? 'rgba(245,158,11,0.12)'
                                    : 'rgba(124,58,237,0.12)',
                                color: p.type_projet === 'residentiel'
                                  ? 'var(--plasma)'
                                  : p.type_projet === 'tertiaire'
                                    ? 'var(--solar-bright)'
                                    : 'var(--nebula-bright)',
                              }}
                            >
                              {labelTypeProjet(p.type_projet)}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <div
                              className="w-9 h-5 rounded-full relative cursor-pointer transition-all"
                              style={{ background: p.actif ? 'var(--nebula)' : 'rgba(255,255,255,0.12)' }}
                              onClick={() => handleToggleActif(p)}
                            >
                              <div
                                className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                                style={{ left: p.actif ? '18px' : '2px' }}
                              />
                            </div>
                          </td>
                          <td style={{ ...tdStyle, borderBottom: tdStyle.borderBottom }}>
                            <div className="flex items-center gap-1.5 justify-end">
                              <button
                                className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                                style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--star)' }}
                                title="Modifier"
                                onClick={() => setModalProduit(p)}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.15)'; e.currentTarget.style.color = 'var(--nebula-bright)' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--star)' }}
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                                style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--star)' }}
                                title="Supprimer"
                                onClick={() => setConfirmDelete(p.id)}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = '#f87171' }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--star)' }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}

        {/* ─── Section Kits ─── */}
        {!loading && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid var(--border-dim)' }}
          >
            {/* Header section kits */}
            <div
              className="flex items-center gap-3 px-5 py-3"
              style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--border-dim)' }}
            >
              <Layers size={15} style={{ color: 'var(--solar-bright)', flexShrink: 0 }} />
              <span className="font-semibold text-sm flex-1" style={{ color: 'var(--nova)' }}>
                Kits projets
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--solar-bright)' }}
              >
                {kits.length}
              </span>
            </div>

            {kits.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <p className="text-sm mb-3" style={{ color: 'var(--star)' }}>
                  Aucun kit créé. Les kits vous permettent de regrouper des articles pour un projet type.
                </p>
                <button className="btn-secondary text-xs" onClick={() => setModalKit(true)}>
                  <Plus size={12} /> Créer un kit
                </button>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--border-dim)' }}>
                {kits.map(kit => (
                  <div
                    key={kit.id}
                    className="flex items-center gap-4 px-5 py-4"
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)' }}
                    >
                      <Layers size={15} style={{ color: 'var(--solar-bright)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm" style={{ color: 'var(--nova)' }}>{kit.nom}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--dust)' }}>
                        {labelTypeProjet(kit.type_projet)}
                        {Array.isArray(kit.lignes) ? ` · ${kit.lignes.length} article${kit.lignes.length > 1 ? 's' : ''}` : ''}
                        {kit.description ? ` · ${kit.description}` : ''}
                      </p>
                    </div>
                    <button
                      className="w-7 h-7 flex items-center justify-center rounded-lg transition-all flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--star)' }}
                      title="Supprimer le kit"
                      onClick={() => setConfirmDeleteKit(kit.id)}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.12)'; e.currentTarget.style.color = '#f87171' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'var(--star)' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Modal Produit ─── */}
      {modalProduit !== null && (
        <ModalProduit
          produit={modalProduit === 'create' ? null : modalProduit}
          onClose={() => setModalProduit(null)}
          onSaved={load}
        />
      )}

      {/* ─── Modal Kit ─── */}
      {modalKit && (
        <ModalKit
          catalogue={catalogue.filter(p => p.actif)}
          onClose={() => setModalKit(false)}
          onSaved={load}
        />
      )}

      {/* ─── Confirm suppression produit ─── */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="rounded-2xl p-6 w-full max-w-sm text-center"
            style={{ background: '#07091f', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            <Trash2 size={32} className="mx-auto mb-3" style={{ color: '#f87171' }} />
            <p className="font-bold text-base mb-1" style={{ color: 'var(--nova)' }}>Supprimer l&apos;article ?</p>
            <p className="text-sm mb-5" style={{ color: 'var(--star)' }}>Cette action est irréversible.</p>
            <div className="flex gap-3 justify-center">
              <button className="btn-secondary" onClick={() => setConfirmDelete(null)}>Annuler</button>
              <button
                className="btn-primary"
                style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}
                disabled={deleting}
                onClick={() => handleDeleteProduit(confirmDelete)}
              >
                {deleting ? <span className="volt-spinner" style={{ width: 14, height: 14 }} /> : <Trash2 size={13} />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Confirm suppression kit ─── */}
      {confirmDeleteKit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="rounded-2xl p-6 w-full max-w-sm text-center"
            style={{ background: '#07091f', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            <Trash2 size={32} className="mx-auto mb-3" style={{ color: '#f87171' }} />
            <p className="font-bold text-base mb-1" style={{ color: 'var(--nova)' }}>Supprimer le kit ?</p>
            <p className="text-sm mb-5" style={{ color: 'var(--star)' }}>Cette action est irréversible.</p>
            <div className="flex gap-3 justify-center">
              <button className="btn-secondary" onClick={() => setConfirmDeleteKit(null)}>Annuler</button>
              <button
                className="btn-primary"
                style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}
                disabled={deleting}
                onClick={() => handleDeleteKit(confirmDeleteKit)}
              >
                {deleting ? <span className="volt-spinner" style={{ width: 14, height: 14 }} /> : <Trash2 size={13} />}
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
