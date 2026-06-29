export type ProduitCatalogue = {
  id: string
  user_id: string
  reference: string | null
  designation: string
  famille: string
  description: string | null
  marque: string | null
  modele: string | null
  unite: string
  prix_achat: number
  prix_vente: number
  tva: number
  type_projet: string
  actif: boolean
  ordre: number
  created_at: string
}

export type LigneKit = {
  produit_id?: string
  designation: string
  quantite: number
  prix_unitaire: number
  tva: number
  lot?: string
}

export type Kit = {
  id: string
  user_id: string
  nom: string
  description: string | null
  type_projet: string
  lignes: LigneKit[]
  created_at: string
}

export const FAMILLES = [
  { key: 'modules', label: 'Modules PV' },
  { key: 'onduleurs', label: 'Onduleurs' },
  { key: 'optimiseurs', label: 'Optimiseurs' },
  { key: 'batteries', label: 'Batteries / Stockage' },
  { key: 'structure', label: 'Structure / Rails' },
  { key: 'cheminement', label: 'Cheminement câbles' },
  { key: 'cablage', label: 'Câblage & Connectique' },
  { key: 'protections', label: 'Protections électriques' },
  { key: 'comptage', label: 'Comptage & Supervision' },
  { key: 'mise_a_terre', label: 'Mise à la terre' },
  { key: 'securite', label: 'Sécurité & Signalétique' },
  { key: 'main_oeuvre', label: "Main d'œuvre & Prestations" },
] as const
