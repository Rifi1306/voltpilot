export type DevisStatus = 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire'

export interface Lead {
  id: string
  nom: string
  email: string
  telephone: string
  ville: string
  typeProjet: string
  puissance: string
  message: string
  createdAt: string
  status: 'nouveau' | 'contacte' | 'converti'
}

export interface Client {
  id: string
  nom: string
  email: string
  telephone: string
  adresse: string
  ville: string
  codePostal: string
  pays: string
  siret?: string
  tva?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface LigneDevis {
  id: string
  designation: string
  description?: string
  quantite: number
  prixUnitaire: number
  tva: number
  remise: number
}

export interface Devis {
  id: string
  numero: string
  clientId: string
  client?: Client
  lignes: LigneDevis[]
  status: DevisStatus
  dateCreation: string
  dateValidite: string
  notes?: string
  conditionsPaiement: string
  montantHT: number
  montantTVA: number
  montantTTC: number
  remiseGlobale: number
  acompte: number
}

export interface EntrepriseSettings {
  nom: string
  email: string
  telephone: string
  adresse: string
  ville: string
  codePostal: string
  pays: string
  siret: string
  tva: string
  logo?: string
  couleurPrimaire: string
  mentionsLegales: string
  conditionsPaiementDefaut: string
  validiteDevisDefaut: number
}

export interface DashboardStats {
  totalDevis: number
  devisAcceptes: number
  devisEnAttente: number
  chiffreAffaires: number
  totalClients: number
  tauxAcceptation: number
  evolutionMensuelle: { mois: string; montant: number; devis: number }[]
}
