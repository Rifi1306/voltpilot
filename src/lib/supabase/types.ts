export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type DevisStatut = 'brouillon' | 'envoye' | 'accepte' | 'refuse' | 'expire'
export type FactureStatut = 'emise' | 'payee' | 'en_retard' | 'annulee'

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
          widget_show_price: boolean
          rge_number: string | null
          assurance_decennale: string | null
          iban: string | null
          garanties_defaut: string | null
          format_numero_devis: string
          format_numero_facture: string
          prime_autoconsommation: number | null
          tarif_rachat_surplus: number | null
          hypotheses_note: string | null
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
          widget_show_price?: boolean
          rge_number?: string | null
          assurance_decennale?: string | null
          iban?: string | null
          garanties_defaut?: string | null
          format_numero_devis?: string
          format_numero_facture?: string
          prime_autoconsommation?: number | null
          tarif_rachat_surplus?: number | null
          hypotheses_note?: string | null
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
          widget_show_price?: boolean
          rge_number?: string | null
          assurance_decennale?: string | null
          iban?: string | null
          garanties_defaut?: string | null
          format_numero_devis?: string
          format_numero_facture?: string
          prime_autoconsommation?: number | null
          tarif_rachat_surplus?: number | null
          hypotheses_note?: string | null
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
          lots: Json
          remise: number
          acompte: number
          conditions_paiement: string
          notes: string | null
          dossier_id: string | null
          date_validite: string
          type_client: string
          adresse_chantier: string | null
          code_postal_chantier: string | null
          ville_chantier: string | null
          type_projet: string
          type_couverture: string | null
          type_pose: string
          orientation: string
          inclinaison: string
          reseau: string
          ombrage: boolean
          puissance_kwc: number | null
          nb_panneaux: number | null
          production_kwh_an: number | null
          etude_eco: Json
          marge_interne: number | null
          created_at: string
        }
        Insert: {
          user_id: string
          client_id: string
          numero: string
          statut?: DevisStatut
          lignes?: Json
          lots?: Json
          remise?: number
          acompte?: number
          conditions_paiement?: string
          notes?: string | null
          dossier_id?: string | null
          date_validite: string
          type_client?: string
          adresse_chantier?: string | null
          code_postal_chantier?: string | null
          ville_chantier?: string | null
          type_projet?: string
          type_couverture?: string | null
          type_pose?: string
          orientation?: string
          inclinaison?: string
          reseau?: string
          ombrage?: boolean
          puissance_kwc?: number | null
          nb_panneaux?: number | null
          production_kwh_an?: number | null
          etude_eco?: Json
          marge_interne?: number | null
        }
        Update: {
          client_id?: string
          statut?: DevisStatut
          lignes?: Json
          lots?: Json
          remise?: number
          acompte?: number
          conditions_paiement?: string
          notes?: string | null
          dossier_id?: string | null
          date_validite?: string
          type_client?: string
          adresse_chantier?: string | null
          code_postal_chantier?: string | null
          ville_chantier?: string | null
          type_projet?: string
          type_couverture?: string | null
          type_pose?: string
          orientation?: string
          inclinaison?: string
          reseau?: string
          ombrage?: boolean
          puissance_kwc?: number | null
          nb_panneaux?: number | null
          production_kwh_an?: number | null
          etude_eco?: Json
          marge_interne?: number | null
        }
        Relationships: []
      }
      dossiers: {
        Row: {
          id: string
          user_id: string
          client_id: string | null
          nom: string
          description: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          nom: string
          client_id?: string | null
          description?: string | null
        }
        Update: {
          nom?: string
          client_id?: string | null
          description?: string | null
        }
        Relationships: []
      }
      catalogue_produits: {
        Row: {
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
        Insert: {
          user_id: string
          designation: string
          famille: string
          reference?: string | null
          description?: string | null
          marque?: string | null
          modele?: string | null
          unite?: string
          prix_achat?: number
          prix_vente?: number
          tva?: number
          type_projet?: string
          actif?: boolean
          ordre?: number
        }
        Update: {
          reference?: string | null
          designation?: string
          famille?: string
          description?: string | null
          marque?: string | null
          modele?: string | null
          unite?: string
          prix_achat?: number
          prix_vente?: number
          tva?: number
          type_projet?: string
          actif?: boolean
          ordre?: number
        }
        Relationships: []
      }
      kits_projets: {
        Row: {
          id: string
          user_id: string
          nom: string
          description: string | null
          type_projet: string
          lignes: Json
          created_at: string
        }
        Insert: {
          user_id: string
          nom: string
          type_projet?: string
          description?: string | null
          lignes?: Json
        }
        Update: {
          nom?: string
          description?: string | null
          type_projet?: string
          lignes?: Json
        }
        Relationships: []
      }
      factures: {
        Row: {
          id: string
          user_id: string
          devis_id: string | null
          client_id: string
          numero: string
          statut: FactureStatut
          lignes: Json
          lots: Json
          remise: number
          acompte_verse: number
          conditions_paiement: string
          date_echeance: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          user_id: string
          client_id: string
          numero: string
          devis_id?: string | null
          statut?: FactureStatut
          lignes?: Json
          lots?: Json
          remise?: number
          acompte_verse?: number
          conditions_paiement?: string
          date_echeance?: string | null
          notes?: string | null
        }
        Update: {
          statut?: FactureStatut
          lignes?: Json
          lots?: Json
          remise?: number
          acompte_verse?: number
          conditions_paiement?: string
          date_echeance?: string | null
          notes?: string | null
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
          surface: number | null
          facture_mensuelle: number | null
          objectif: string | null
          type_bien: string | null
          type_toiture: string | null
          adresse: string | null
          consentement: boolean
          nb_panneaux: number | null
          puissance_kwc: number | null
          production_annuelle: number | null
          fourchette_min: number | null
          fourchette_max: number | null
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
          surface?: number | null
          facture_mensuelle?: number | null
          objectif?: string | null
          type_bien?: string | null
          type_toiture?: string | null
          adresse?: string | null
          consentement?: boolean
          nb_panneaux?: number | null
          puissance_kwc?: number | null
          production_annuelle?: number | null
          fourchette_min?: number | null
          fourchette_max?: number | null
        }
        Update: {
          statut?: string
          nb_panneaux?: number | null
          puissance_kwc?: number | null
          production_annuelle?: number | null
          fourchette_min?: number | null
          fourchette_max?: number | null
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
