'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { addDays, format } from 'date-fns'
import type { Json, Database } from '@/lib/supabase/types'

export type LigneJson = {
  id?: string
  designation: string
  description?: string
  quantite: number
  prixUnitaire: number
  remise?: number
  tva?: number
  lot?: string
  isText?: boolean
}

export type LotDevis = {
  nom: string
  lignes: LigneJson[]
}

export type EtudeEco = {
  prime_autoconsommation?: number
  tva_reduite_applicable?: boolean
  tarif_rachat_surplus?: number
  taux_autoconsommation?: number
  economies_annuelles?: number
  roi_annees?: number
  gain_20ans?: number
  hypotheses_note?: string
}

function buildNumero(format_str: string, num: number): string {
  const now = new Date()
  return format_str
    .replace('{YYYY}', String(now.getFullYear()))
    .replace('{MM}', String(now.getMonth() + 1).padStart(2, '0'))
    .replace('{NUM}', String(num).padStart(4, '0'))
}

function toLignes(raw: Json): LigneJson[] {
  if (!Array.isArray(raw)) return []
  return raw as LigneJson[]
}

function calcCA(lignes: LigneJson[], remise: number): number {
  const ht = lignes.reduce((s, l) => {
    if (l.isText) return s
    return s + l.quantite * l.prixUnitaire * (1 - (l.remise ?? 0) / 100)
  }, 0)
  return ht * (1 - remise / 100)
}

function lignesFromLots(lots: LotDevis[]): LigneJson[] {
  return lots.flatMap(lot => lot.lignes.map(l => ({ ...l, lot: lot.nom })))
}

export async function getDevis() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('devis')
    .select('*, clients(nom, email, ville)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return []
  return data ?? []
}

export async function getDevisById(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('devis')
    .select('*, clients(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) return null
  return data
}

export async function getDashboardStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return {
    totalDevis: 0, devisAcceptes: 0, tauxConversion: 0, caTotal: 0, totalClients: 0,
    devisBrouillon: 0, devisEnvoyes: 0, devisRefuses: 0, devisExpires: 0,
  }

  const [devisResult, clientsResult] = await Promise.all([
    supabase.from('devis').select('statut, lignes, lots, remise, acompte').eq('user_id', user.id),
    supabase.from('clients').select('id').eq('user_id', user.id),
  ])

  const allDevis = devisResult.data ?? []
  const allClients = clientsResult.data ?? []

  const totalDevis = allDevis.length
  const devisAcceptes = allDevis.filter(d => d.statut === 'accepte').length
  const tauxConversion = totalDevis > 0 ? Math.round((devisAcceptes / totalDevis) * 100) : 0

  const caTotal = allDevis
    .filter(d => d.statut === 'accepte')
    .reduce((sum, d) => {
      const lots = Array.isArray(d.lots) && d.lots.length > 0 ? d.lots as LotDevis[] : null
      const lignes = lots ? lignesFromLots(lots) : toLignes(d.lignes)
      return sum + calcCA(lignes, d.remise ?? 0)
    }, 0)

  return {
    totalDevis,
    devisAcceptes,
    tauxConversion,
    caTotal,
    totalClients: allClients.length,
    devisBrouillon: allDevis.filter(d => d.statut === 'brouillon').length,
    devisEnvoyes: allDevis.filter(d => d.statut === 'envoye').length,
    devisRefuses: allDevis.filter(d => d.statut === 'refuse').length,
    devisExpires: allDevis.filter(d => d.statut === 'expire').length,
  }
}

export async function checkDevisQuota(): Promise<{ allowed: true } | { allowed: false; message: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { allowed: false, message: 'Non authentifié' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, subscription_status')
    .eq('id', user.id)
    .single()

  if (!profile || profile.plan === 'pro') return { allowed: true }

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('devis')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', startOfMonth.toISOString())

  if ((count ?? 0) >= 30) {
    return {
      allowed: false,
      message: 'Vous avez atteint la limite de 30 devis par mois (plan Starter). Passez en Pro pour créer des devis illimités.',
    }
  }
  return { allowed: true }
}

export async function createDevisAction(payload: {
  client_id: string
  type_client?: string
  adresse_chantier?: string
  code_postal_chantier?: string
  ville_chantier?: string
  type_projet?: string
  type_couverture?: string
  type_pose?: string
  orientation?: string
  inclinaison?: string
  reseau?: string
  ombrage?: boolean
  puissance_kwc?: number
  nb_panneaux?: number
  production_kwh_an?: number
  etude_eco?: EtudeEco
  lots: LotDevis[]
  lignes?: LigneJson[]
  remise: number
  acompte: number
  conditions_paiement: string
  notes: string
  validite_jours: number
  marge_interne?: number
  dossier_id?: string
}): Promise<{ id: string } | { error: string }> {
  try {
    const quota = await checkDevisQuota()
    if (!quota.allowed) return { error: quota.message }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié — reconnectez-vous' }

    const [profileResult, countResult] = await Promise.all([
      supabase.from('profiles').select('format_numero_devis').eq('id', user.id).single(),
      supabase.from('devis').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ])

    const fmtStr = profileResult.data?.format_numero_devis ?? 'DEV-{YYYY}-{NUM}'
    const count = (countResult.count ?? 0) + 1
    const numero = buildNumero(fmtStr, count)
    const date_validite = format(addDays(new Date(), payload.validite_jours), 'yyyy-MM-dd')

    const lignes = payload.lots.length > 0
      ? lignesFromLots(payload.lots)
      : (payload.lignes ?? [])

    const { data, error } = await supabase.from('devis').insert({
      user_id: user.id,
      client_id: payload.client_id,
      numero,
      statut: 'brouillon',
      lignes: lignes as Json,
      lots: payload.lots as unknown as Json,
      remise: payload.remise,
      acompte: payload.acompte,
      conditions_paiement: payload.conditions_paiement,
      notes: payload.notes || null,
      date_validite,
      type_client: payload.type_client ?? 'particulier',
      adresse_chantier: payload.adresse_chantier || null,
      code_postal_chantier: payload.code_postal_chantier || null,
      ville_chantier: payload.ville_chantier || null,
      type_projet: payload.type_projet ?? 'residentiel',
      type_couverture: payload.type_couverture || null,
      type_pose: payload.type_pose ?? 'surimposition',
      orientation: payload.orientation ?? 'Sud',
      inclinaison: payload.inclinaison ?? 'Optimal (30–35°)',
      reseau: payload.reseau ?? 'monophase',
      ombrage: payload.ombrage ?? false,
      puissance_kwc: payload.puissance_kwc ?? null,
      nb_panneaux: payload.nb_panneaux ?? null,
      production_kwh_an: payload.production_kwh_an ?? null,
      etude_eco: payload.etude_eco as unknown as Json ?? null,
      marge_interne: payload.marge_interne ?? null,
      dossier_id: payload.dossier_id || null,
    }).select().single()

    if (error) return { error: `DB: ${error.message} [${error.code}]` }

    revalidatePath('/devis')
    return { id: data.id }
  } catch (e) {
    return { error: `Exception: ${e instanceof Error ? e.message : String(e)}` }
  }
}

export async function updateDevisAction(id: string, payload: {
  client_id?: string
  type_client?: string
  adresse_chantier?: string
  code_postal_chantier?: string
  ville_chantier?: string
  type_projet?: string
  type_couverture?: string
  type_pose?: string
  orientation?: string
  inclinaison?: string
  reseau?: string
  ombrage?: boolean
  puissance_kwc?: number
  nb_panneaux?: number
  production_kwh_an?: number
  etude_eco?: EtudeEco
  lots?: LotDevis[]
  lignes?: LigneJson[]
  remise?: number
  acompte?: number
  conditions_paiement?: string
  notes?: string
  date_validite?: string
  marge_interne?: number
}): Promise<{ ok: true } | { error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié' }

    const update: Record<string, unknown> = {}
    if (payload.client_id !== undefined) update.client_id = payload.client_id
    if (payload.type_client !== undefined) update.type_client = payload.type_client
    if (payload.adresse_chantier !== undefined) update.adresse_chantier = payload.adresse_chantier || null
    if (payload.code_postal_chantier !== undefined) update.code_postal_chantier = payload.code_postal_chantier || null
    if (payload.ville_chantier !== undefined) update.ville_chantier = payload.ville_chantier || null
    if (payload.type_projet !== undefined) update.type_projet = payload.type_projet
    if (payload.type_couverture !== undefined) update.type_couverture = payload.type_couverture || null
    if (payload.type_pose !== undefined) update.type_pose = payload.type_pose
    if (payload.orientation !== undefined) update.orientation = payload.orientation
    if (payload.inclinaison !== undefined) update.inclinaison = payload.inclinaison
    if (payload.reseau !== undefined) update.reseau = payload.reseau
    if (payload.ombrage !== undefined) update.ombrage = payload.ombrage
    if (payload.puissance_kwc !== undefined) update.puissance_kwc = payload.puissance_kwc ?? null
    if (payload.nb_panneaux !== undefined) update.nb_panneaux = payload.nb_panneaux ?? null
    if (payload.production_kwh_an !== undefined) update.production_kwh_an = payload.production_kwh_an ?? null
    if (payload.etude_eco !== undefined) update.etude_eco = payload.etude_eco
    if (payload.marge_interne !== undefined) update.marge_interne = payload.marge_interne ?? null
    if (payload.remise !== undefined) update.remise = payload.remise
    if (payload.acompte !== undefined) update.acompte = payload.acompte
    if (payload.conditions_paiement !== undefined) update.conditions_paiement = payload.conditions_paiement
    if (payload.notes !== undefined) update.notes = payload.notes || null
    if (payload.date_validite !== undefined) update.date_validite = payload.date_validite

    if (payload.lots !== undefined) {
      update.lots = payload.lots
      update.lignes = lignesFromLots(payload.lots)
    } else if (payload.lignes !== undefined) {
      update.lignes = payload.lignes
    }

    const { error } = await supabase
      .from('devis')
      .update(update as Database['public']['Tables']['devis']['Update'])
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return { error: error.message }
    revalidatePath('/devis')
    revalidatePath(`/devis/${id}`)
    return { ok: true }
  } catch (e) {
    return { error: String(e) }
  }
}

export async function updateDevisStatut(id: string, statut: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase
    .from('devis')
    .update({ statut: statut as 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire' })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw error
  revalidatePath('/devis')
  revalidatePath(`/devis/${id}`)
}

export async function deleteDevisAction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase.from('devis').delete().eq('id', id).eq('user_id', user.id)
  if (error) throw error
  revalidatePath('/devis')
  redirect('/devis')
}

export async function duplicateDevisAction(id: string): Promise<{ id: string } | { error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié' }

    const { data: original, error: fetchErr } = await supabase
      .from('devis')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchErr || !original) return { error: 'Devis introuvable' }

    const [profileResult, countResult] = await Promise.all([
      supabase.from('profiles').select('format_numero_devis, validite_devis_defaut').eq('id', user.id).single(),
      supabase.from('devis').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ])

    const fmtStr = profileResult.data?.format_numero_devis ?? 'DEV-{YYYY}-{NUM}'
    const count = (countResult.count ?? 0) + 1
    const numero = buildNumero(fmtStr, count)
    const validite_jours = profileResult.data?.validite_devis_defaut ?? 30
    const date_validite = format(addDays(new Date(), validite_jours), 'yyyy-MM-dd')

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, numero: _num, created_at: _cat, ...rest } = original
    const { data, error } = await supabase
      .from('devis')
      .insert({ ...rest, numero, statut: 'brouillon', date_validite })
      .select()
      .single()

    if (error) return { error: error.message }
    revalidatePath('/devis')
    return { id: data.id }
  } catch (e) {
    return { error: String(e) }
  }
}
