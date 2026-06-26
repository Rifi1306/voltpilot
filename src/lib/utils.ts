import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { DevisStatus, LigneDevis } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, locale = 'fr-FR', currency = 'EUR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function calculateLigne(ligne: LigneDevis) {
  const montantBrut = ligne.quantite * ligne.prixUnitaire
  const remiseAmount = montantBrut * (ligne.remise / 100)
  const montantHT = montantBrut - remiseAmount
  const montantTVA = montantHT * (ligne.tva / 100)
  const montantTTC = montantHT + montantTVA
  return { montantHT, montantTVA, montantTTC }
}

export function calculateTotaux(lignes: LigneDevis[], remiseGlobale: number = 0) {
  const totaux = lignes.reduce(
    (acc, ligne) => {
      const { montantHT, montantTVA } = calculateLigne(ligne)
      return {
        montantHT: acc.montantHT + montantHT,
        montantTVA: acc.montantTVA + montantTVA,
      }
    },
    { montantHT: 0, montantTVA: 0 }
  )

  const remiseGlobaleAmount = totaux.montantHT * (remiseGlobale / 100)
  const montantHTFinal = totaux.montantHT - remiseGlobaleAmount
  const montantTVAFinal = totaux.montantTVA * (1 - remiseGlobale / 100)
  const montantTTC = montantHTFinal + montantTVAFinal

  return {
    montantHT: montantHTFinal,
    montantTVA: montantTVAFinal,
    montantTTC,
  }
}

export function getStatusLabel(status: DevisStatus): string {
  const labels: Record<DevisStatus, string> = {
    brouillon: 'Brouillon',
    envoye: 'Envoyé',
    accepte: 'Accepté',
    refuse: 'Refusé',
    expire: 'Expiré',
  }
  return labels[status]
}

export function getStatusColor(status: DevisStatus): string {
  const colors: Record<DevisStatus, string> = {
    brouillon: 'bg-white/5 text-white/40 border border-white/10',
    envoye:    'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    accepte:   'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    refuse:    'bg-red-500/10 text-red-400 border border-red-500/20',
    expire:    'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  }
  return colors[status]
}

export function generateNumeroDevis(count: number): string {
  const year = new Date().getFullYear()
  const num = String(count + 1).padStart(4, '0')
  return `DEV-${year}-${num}`
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}
