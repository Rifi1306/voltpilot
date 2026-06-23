export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type DevisStatut = 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          nom: string
          telephone: string | null
          adresse: string | null
          code_postal: string | null
          ville: string | null
          siret: string | null
          tva: string | null
          mentions_legales: string | null
          conditions_paiement_defaut: string
          validite_devis_defaut: number
          couleur_primaire: string
          plan: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string
          subscription_period_end: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          nom?: string
          telephone?: string | null
          adresse?: string | null
          code_postal?: string | null
          ville?: string | null
          siret?: string | null
          tva?: string | null
          mentions_legales?: string | null
          conditions_paiement_defaut?: string
          validite_devis_defaut?: number
          couleur_primaire?: string
          plan?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
        }
        Update: {
          nom?: string
          telephone?: string | null
          adresse?: string | null
          code_postal?: string | null
          ville?: string | null
          siret?: string | null
          tva?: string | null
          mentions_legales?: string | null
          conditions_paiement_defaut?: string
          validite_devis_defaut?: number
          couleur_primaire?: string
          plan?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          subscription_period_end?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          id: string
          user_id: string
          nom: string
          email: string | null
          telephone: string | null
          adresse: string | null
          code_postal: string | null
          ville: string | null
          siret: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          nom: string
          email?: string | null
          telephone?: string | null
          adresse?: string | null
          code_postal?: string | null
          ville?: string | null
          siret?: string | null
          notes?: string | null
        }
        Update: {
          nom?: string
          email?: string | null
          telephone?: string | null
          adresse?: string | null
          code_postal?: string | null
          ville?: string | null
          siret?: string | null
          notes?: string | null
        }
        Relationships: []
      }
      devis: {
        Row: {
          id: string
          user_id: string
          client_id: string
          numero: string
          statut: DevisStatut
          lignes: Json
          remise: number
          acompte: number
          conditions_paiement: string
          notes: string | null
          dossier: string | null
          date_validite: string
          created_at: string
        }
        Insert: {
          user_id: string
          client_id: string
          numero: string
          statut?: DevisStatut
          lignes?: Json
          remise?: number
          acompte?: number
          conditions_paiement?: string
          notes?: string | null
          dossier?: string | null
          date_validite: string
        }
        Update: {
          client_id?: string
          statut?: DevisStatut
          lignes?: Json
          remise?: number
          acompte?: number
          conditions_paiement?: string
          notes?: string | null
          dossier?: string | null
          date_validite?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          id: string
          user_id: string
          nom: string
          email: string
          telephone: string | null
          code_postal: string | null
          ville: string | null
          type_projet: string | null
          message: string | null
          statut: string
          created_at: string
        }
        Insert: {
          user_id: string
          nom: string
          email: string
          telephone?: string | null
          code_postal?: string | null
          ville?: string | null
          type_projet?: string | null
          message?: string | null
          statut?: string
        }
        Update: {
          statut?: string
        }
        Relationships: []
      }
      marketing_content: {
        Row: {
          id: string
          type: string
          titre: string
          contenu: string
          hashtags: string[]
          statut: string
          plateforme: string
          score_engagement: number
          created_at: string
          published_at: string | null
        }
        Insert: {
          type: string
          titre: string
          contenu: string
          hashtags?: string[]
          statut?: string
          plateforme?: string
          score_engagement?: number
          published_at?: string | null
        }
        Update: {
          type?: string
          titre?: string
          contenu?: string
          hashtags?: string[]
          statut?: string
          plateforme?: string
          score_engagement?: number
          published_at?: string | null
        }
        Relationships: []
      }
      site_alerts: {
        Row: {
          id: string
          type: string
          severite: string
          message: string
          details: Json
          resolu: boolean
          resolu_at: string | null
          created_at: string
        }
        Insert: {
          type: string
          severite: string
          message: string
          details?: Json
          resolu?: boolean
          resolu_at?: string | null
        }
        Update: {
          type?: string
          severite?: string
          message?: string
          details?: Json
          resolu?: boolean
          resolu_at?: string | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      devis_statut: DevisStatut
    }
  }
}
