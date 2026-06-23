'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

type LigneJson = { quantite: number; prixUnitaire: number; remise?: number; tva?: number }

function calcTTC(lignes: unknown, remise: number): number {
  if (!Array.isArray(lignes)) return 0
  const rows = lignes as LigneJson[]
  const ht = rows.reduce((s, l) => s + l.quantite * l.prixUnitaire * (1 - (l.remise ?? 0) / 100), 0)
  const tva = rows.reduce((s, l) => s + l.quantite * l.prixUnitaire * (1 - (l.remise ?? 0) / 100) * ((l.tva ?? 20) / 100), 0)
  return (ht + tva) * (1 - remise / 100)
}

export type AdminStats = {
  allowed: false
} | {
  allowed: true
  totalUsers: number
  totalDevis: number
  totalCA: number
  devisAcceptes: number
  devisEnvoyes: number
  devisBrouillons: number
  devisRefuses: number
  recentUsers: { id: string; nom: string | null; created_at: string }[]
  topUsers: { nom: string | null; totalDevis: number; totalCA: number }[]
}

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return { allowed: false }
  }

  const admin = createAdminClient()

  const [profilesResult, devisResult] = await Promise.all([
    admin.from('profiles').select('id, nom, created_at').order('created_at', { ascending: false }),
    admin.from('devis').select('id, user_id, statut, lignes, remise, created_at'),
  ])

  const profiles = profilesResult.data ?? []
  const allDevis = devisResult.data ?? []

  const totalUsers = profiles.length
  const totalDevis = allDevis.length
  const devisAcceptes = allDevis.filter(d => d.statut === 'accepte').length
  const devisEnvoyes = allDevis.filter(d => d.statut === 'envoye').length
  const devisBrouillons = allDevis.filter(d => d.statut === 'brouillon').length
  const devisRefuses = allDevis.filter(d => d.statut === 'refuse').length

  const totalCA = allDevis
    .filter(d => d.statut === 'accepte')
    .reduce((s, d) => s + calcTTC(d.lignes, d.remise ?? 0), 0)

  const recentUsers = profiles.slice(0, 10).map(p => ({
    id: p.id,
    nom: p.nom,
    created_at: p.created_at ?? '',
  }))

  // Calcule le CA et le nb de devis par user
  const byUser: Record<string, { totalDevis: number; totalCA: number }> = {}
  for (const d of allDevis) {
    if (!byUser[d.user_id]) byUser[d.user_id] = { totalDevis: 0, totalCA: 0 }
    byUser[d.user_id].totalDevis++
    if (d.statut === 'accepte') byUser[d.user_id].totalCA += calcTTC(d.lignes, d.remise ?? 0)
  }

  const topUsers = profiles
    .map(p => ({
      nom: p.nom,
      totalDevis: byUser[p.id]?.totalDevis ?? 0,
      totalCA: byUser[p.id]?.totalCA ?? 0,
    }))
    .sort((a, b) => b.totalCA - a.totalCA)
    .slice(0, 8)

  return {
    allowed: true,
    totalUsers,
    totalDevis,
    totalCA,
    devisAcceptes,
    devisEnvoyes,
    devisBrouillons,
    devisRefuses,
    recentUsers,
    topUsers,
  }
}
