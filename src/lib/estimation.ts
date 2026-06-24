// Moteur d'estimation solaire partagé widget + devis

const WATT_PER_M2 = 180          // W de panneau standard par m²
const PANEL_WATT = 400            // W crête par panneau (standard 2024)
const RATIO_CONSOMMATION = 0.9    // kWc ≈ consommation kWh annuelle / 1000 * ratio
const PRIX_MOYEN_KWC = 2800       // € HT / kWc installé (résidentiel)
const MARGE_PRIX = 0.20           // ±20% fourchette

export interface EstimationInput {
  surface?: number | null         // m² de toiture disponible
  factureMensuelle?: number | null // € / mois
  codePostal?: string | null
  typeProjet?: string | null
}

export interface EstimationResult {
  nbPanneaux: number
  puissanceKwc: number
  productionAnnuelle: number      // kWh/an (PVGIS si dispo, sinon ratio)
  fourchetteMin: number           // € TTC
  fourchetteMax: number           // € TTC
  source: 'pvgis' | 'estimate'
}

// Calcule nb panneaux + kWc depuis surface ou facture
function calcPuissance(input: EstimationInput): { nbPanneaux: number; puissanceKwc: number } {
  let kwc = 0

  if (input.surface && input.surface > 0) {
    // Méthode 1 : surface disponible
    const maxWatt = input.surface * WATT_PER_M2
    kwc = maxWatt / 1000
  } else if (input.factureMensuelle && input.factureMensuelle > 0) {
    // Méthode 2 : facture mensuelle → consommation annuelle estimée
    // Hypothèse : 0,18 €/kWh → consommation kWh/an
    const consommationAnnuelle = (input.factureMensuelle * 12) / 0.18
    kwc = consommationAnnuelle * RATIO_CONSOMMATION / 1000
  } else {
    // Valeur par défaut : 3 kWc (installation résidentielle typique)
    kwc = 3
  }

  // Arrondir à 0.25 kWc
  kwc = Math.round(kwc * 4) / 4
  kwc = Math.max(1.5, Math.min(100, kwc))

  const nbPanneaux = Math.ceil((kwc * 1000) / PANEL_WATT)

  return { nbPanneaux, puissanceKwc: kwc }
}

// Estimation de production sans PVGIS (ratio moyen France ~1100 kWh/kWc)
function estimateProduction(puissanceKwc: number, typeProjet?: string | null): number {
  let ratio = 1100 // kWh/kWc/an — moyenne France métropolitaine
  if (typeProjet === 'Agricole') ratio = 1150
  if (typeProjet === 'Professionnel / PME') ratio = 1080
  return Math.round(puissanceKwc * ratio)
}

// Calcule la fourchette de prix
function calcFourchette(puissanceKwc: number): { min: number; max: number } {
  const base = puissanceKwc * PRIX_MOYEN_KWC * 1.2 // TTC (TVA 20%)
  return {
    min: Math.round(base * (1 - MARGE_PRIX) / 100) * 100,
    max: Math.round(base * (1 + MARGE_PRIX) / 100) * 100,
  }
}

// Estimation complète sans appel PVGIS (synchrone)
export function computeEstimation(input: EstimationInput): EstimationResult {
  const { nbPanneaux, puissanceKwc } = calcPuissance(input)
  const productionAnnuelle = estimateProduction(puissanceKwc, input.typeProjet)
  const { min, max } = calcFourchette(puissanceKwc)

  return {
    nbPanneaux,
    puissanceKwc,
    productionAnnuelle,
    fourchetteMin: min,
    fourchetteMax: max,
    source: 'estimate',
  }
}

// Estimation avec appel PVGIS (async — utilise la vraie irradiation)
export async function computeEstimationWithPVGIS(
  input: EstimationInput,
  baseUrl: string
): Promise<EstimationResult> {
  const { nbPanneaux, puissanceKwc } = calcPuissance(input)
  const { min, max } = calcFourchette(puissanceKwc)

  let productionAnnuelle = estimateProduction(puissanceKwc, input.typeProjet)
  let source: 'pvgis' | 'estimate' = 'estimate'

  if (input.codePostal && input.codePostal.length >= 5) {
    try {
      const url = `${baseUrl}/api/pvgis?cp=${encodeURIComponent(input.codePostal)}&peakpower=${puissanceKwc}`
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
      if (res.ok) {
        const data = await res.json()
        if (data.production_annuelle) {
          productionAnnuelle = data.production_annuelle
          source = 'pvgis'
        }
      }
    } catch {
      // Fallback silencieux sur estimation locale
    }
  }

  return { nbPanneaux, puissanceKwc, productionAnnuelle, fourchetteMin: min, fourchetteMax: max, source }
}
