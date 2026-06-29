'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { addDays, format } from 'date-fns'
import type { Json } from '@/lib/supabase/types'

export type LigneFacture = {
  id?: string
  designation: string
  description?: string
  quantite: number
  prixUnitaire: number
  tva: number
  remise?: number
  lot?: string
  isText?: boolean
}

export type LotFacture = {
  nom: string
  lignes: LigneFacture[]
}

export type FactureStatut = 'emise' | 'payee' | 'en_retard' | 'annulee'

export async function getFactures() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('factures')
    .select('*, clients(nom, email, ville)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return []
  return data ?? []
}

export async function getFactureById(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('factures')
    .select('*, clients(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error) return null
  return data
}

function buildNumeroFacture(format_str: string, num: number): string {
  const now = new Date()
  return format_str
    .replace('{YYYY}', String(now.getFullYear()))
    .replace('{MM}', String(now.getMonth() + 1).padStart(2, '0'))
    .replace('{NUM}', String(num).padStart(4, '0'))
}

export async function createFactureFromDevis(devisId: string): Promise<{ id: string } | { error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié' }

    const [devisResult, profileResult, countResult] = await Promise.all([
      supabase.from('devis').select('*').eq('id', devisId).eq('user_id', user.id).single(),
      supabase.from('profiles').select('format_numero_facture').eq('id', user.id).single(),
      supabase.from('factures').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ])

    if (devisResult.error || !devisResult.data) return { error: 'Devis introuvable' }
    const devis = devisResult.data
    const fmtStr = profileResult.data?.format_numero_facture ?? 'FAC-{YYYY}-{NUM}'
    const count = (countResult.count ?? 0) + 1
    const numero = buildNumeroFacture(fmtStr, count)
    const echeance = format(addDays(new Date(), 30), 'yyyy-MM-dd')

    const { data, error } = await supabase
      .from('factures')
      .insert({
        user_id: user.id,
        devis_id: devisId,
        client_id: devis.client_id,
        numero,
        statut: 'emise' as FactureStatut,
        lignes: devis.lignes,
        lots: devis.lots ?? ([] as unknown as Json),
        remise: devis.remise ?? 0,
        acompte_verse: devis.acompte ?? 0,
        conditions_paiement: devis.conditions_paiement ?? '30 jours net',
        notes: devis.notes ?? null,
        date_echeance: echeance,
      })
      .select()
      .single()

    if (error) return { error: error.message }
    revalidatePath('/factures')
    return { id: data.id }
  } catch (e) {
    return { error: String(e) }
  }
}

export async function createFactureAction(payload: {
  client_id: string
  devis_id?: string
  lignes: LigneFacture[]
  lots?: LotFacture[]
  remise?: number
  acompte_verse?: number
  conditions_paiement?: string
  notes?: string
  echeance_jours?: number
}): Promise<{ id: string } | { error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié' }

    const [profileResult, countResult] = await Promise.all([
      supabase.from('profiles').select('format_numero_facture').eq('id', user.id).single(),
      supabase.from('factures').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ])

    const fmtStr = profileResult.data?.format_numero_facture ?? 'FAC-{YYYY}-{NUM}'
    const count = (countResult.count ?? 0) + 1
    const numero = buildNumeroFacture(fmtStr, count)
    const echeance = format(addDays(new Date(), payload.echeance_jours ?? 30), 'yyyy-MM-dd')

    const { data, error } = await supabase
      .from('factures')
      .insert({
        user_id: user.id,
        client_id: payload.client_id,
        devis_id: payload.devis_id ?? null,
        numero,
        statut: 'emise' as FactureStatut,
        lignes: payload.lignes as unknown as Json,
        lots: (payload.lots ?? []) as unknown as Json,
        remise: payload.remise ?? 0,
        acompte_verse: payload.acompte_verse ?? 0,
        conditions_paiement: payload.conditions_paiement ?? '30 jours net',
        notes: payload.notes ?? null,
        date_echeance: echeance,
      })
      .select()
      .single()

    if (error) return { error: error.message }
    revalidatePath('/factures')
    return { id: data.id }
  } catch (e) {
    return { error: String(e) }
  }
}

export async function updateFactureStatut(id: string, statut: FactureStatut) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase
    .from('factures')
    .update({ statut })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) throw error
  revalidatePath('/factures')
  revalidatePath(`/factures/${id}`)
}

export async function deleteFactureAction(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase.from('factures').delete().eq('id', id).eq('user_id', user.id)
  if (error) throw error
  revalidatePath('/factures')
  redirect('/factures')
}

export async function getFactureStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { total: 0, emises: 0, payees: 0, en_retard: 0 }

  const { data } = await supabase
    .from('factures')
    .select('statut, date_echeance')
    .eq('user_id', user.id)

  const all = data ?? []
  const today = new Date().toISOString().slice(0, 10)

  return {
    total: all.length,
    emises: all.filter(f => f.statut === 'emise').length,
    payees: all.filter(f => f.statut === 'payee').length,
    en_retard: all.filter(f => f.statut === 'emise' && f.date_echeance && f.date_echeance < today).length,
  }
}
