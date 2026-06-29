import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export type LigneItem = {
  designation: string
  description?: string
  quantite: number
  prixUnitaire: number
  remise?: number
  tva?: number
  isText?: boolean
  lot?: string
}

export type LotItem = {
  nom: string
  lignes: LigneItem[]
}

export type EtudeEco = {
  prime_autoconsommation?: number
  tarif_rachat_surplus?: number
  taux_autoconsommation?: number
  economies_annuelles?: number
  roi_annees?: number
  gain_20ans?: number
  hypotheses_note?: string
}

export type DevisForPDF = {
  numero: string
  lignes: unknown
  lots?: unknown
  remise: number | null
  acompte: number | null
  conditions_paiement: string | null
  notes: string | null
  date_validite: string | null
  created_at: string
  type_client?: string | null
  adresse_chantier?: string | null
  code_postal_chantier?: string | null
  ville_chantier?: string | null
  type_projet?: string | null
  puissance_kwc?: number | null
  nb_panneaux?: number | null
  production_kwh_an?: number | null
  etude_eco?: unknown
  clients: {
    nom: string
    email: string | null
    telephone: string | null
    adresse: string | null
    code_postal: string | null
    ville: string | null
    siret: string | null
  } | null
}

export type ProfileForPDF = {
  nom: string | null
  adresse: string | null
  code_postal: string | null
  ville: string | null
  siret: string | null
  tva?: string | null
  rge_number?: string | null
  assurance_decennale?: string | null
  mentions_legales: string | null
  garanties_defaut?: string | null
  couleur_primaire: string | null
  logo?: string
  signature_active?: boolean
}

function parseLots(devis: DevisForPDF): LotItem[] {
  if (Array.isArray(devis.lots) && devis.lots.length > 0) {
    return devis.lots as LotItem[]
  }
  const lignes = parseLignesFlat(devis.lignes)
  if (lignes.length === 0) return []
  return [{ nom: 'Devis', lignes }]
}

function parseLignesFlat(raw: unknown): LigneItem[] {
  if (!Array.isArray(raw)) return []
  return raw as LigneItem[]
}

function hexToRgb(hex: string): [number, number, number] {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] : [14, 165, 233]
}

function eur(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n)
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR')
}

type TvaVentilation = Record<number, number>

function calcTotaux(lots: LotItem[], remiseGlobale: number) {
  const allLignes = lots.flatMap(l => l.lignes).filter(l => !l.isText)

  const htBase = allLignes.reduce((s, l) => s + l.quantite * l.prixUnitaire * (1 - (l.remise ?? 0) / 100), 0)
  const factor = 1 - remiseGlobale / 100

  const tvaMap: TvaVentilation = {}
  for (const l of allLignes) {
    const base = l.quantite * l.prixUnitaire * (1 - (l.remise ?? 0) / 100) * factor
    const rate = l.tva ?? 20
    tvaMap[rate] = (tvaMap[rate] ?? 0) + base * (rate / 100)
  }

  const tvaTotal = Object.values(tvaMap).reduce((s, v) => s + v, 0)
  const montantHT = htBase * factor

  const lotSousTotaux = lots.map(lot => ({
    nom: lot.nom,
    ht: lot.lignes.filter(l => !l.isText).reduce((s, l) => s + l.quantite * l.prixUnitaire * (1 - (l.remise ?? 0) / 100), 0) * factor,
  }))

  return {
    htBase,
    montantHT,
    tvaMap,
    tvaTotal,
    montantTTC: montantHT + tvaTotal,
    lotSousTotaux,
  }
}

export function generateDevisPDF(devis: DevisForPDF, profile: ProfileForPDF): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const MARGIN = 14
  const [cr, cg, cb] = hexToRgb(profile.couleur_primaire ?? '#22D3EE')
  const client = devis.clients
  const remiseGlobale = devis.remise ?? 0
  const lots = parseLots(devis)
  const { htBase, montantHT, tvaMap, tvaTotal, montantTTC, lotSousTotaux } = calcTotaux(lots, remiseGlobale)

  // ── Header band ─────────────────────────────────────────────
  doc.setFillColor(cr, cg, cb)
  doc.rect(0, 0, W, 42, 'F')
  doc.setFillColor(Math.max(0, cr - 40), Math.max(0, cg - 20), Math.min(255, cb + 20))
  doc.rect(0, 39, W, 3, 'F')

  // Logo
  let textOffsetX = MARGIN
  if (profile.logo) {
    try {
      const ext = profile.logo.includes('png') ? 'PNG' : 'JPEG'
      doc.addImage(profile.logo, ext, 8, 5, 28, 28)
      textOffsetX = 42
    } catch { /* skip */ }
  }

  // Company name
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(profile.nom ?? 'Mon Entreprise', textOffsetX, 16)

  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  if (profile.adresse || profile.ville) {
    const addr = [profile.adresse, [profile.code_postal, profile.ville].filter(Boolean).join(' ')].filter(Boolean).join(' · ')
    doc.setTextColor(220, 240, 255)
    doc.text(addr, textOffsetX, 22)
  }

  // SIRET / RGE / Assurance
  const legalLine: string[] = []
  if (profile.siret) legalLine.push(`SIRET : ${profile.siret}`)
  if (profile.tva) legalLine.push(`TVA : ${profile.tva}`)
  if (profile.rge_number) legalLine.push(`RGE : ${profile.rge_number}`)
  if (legalLine.length > 0) {
    doc.setFontSize(6.5)
    doc.setTextColor(200, 230, 255)
    doc.text(legalLine.join('  ·  '), textOffsetX, 28)
  }
  if (profile.assurance_decennale) {
    doc.setFontSize(6.5)
    doc.text(`Assurance décennale : ${profile.assurance_decennale}`, textOffsetX, 33)
  }

  // DEVIS badge + number
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(W - 64, 7, 50, 11, 2, 2, 'F')
  doc.setTextColor(cr, cg, cb)
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'bold')
  doc.text('DEVIS', W - 39, 14, { align: 'center' })

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(devis.numero, W - MARGIN, 29, { align: 'right' })

  // ── Dates + infos projet ─────────────────────────────────────
  const y1 = 50
  doc.setTextColor(100, 116, 139)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.text(`Émis le : ${fmtDate(devis.created_at)}`, W - MARGIN, y1, { align: 'right' })
  if (devis.date_validite) {
    doc.text(`Valide jusqu'au : ${fmtDate(devis.date_validite)}`, W - MARGIN, y1 + 5, { align: 'right' })
  }

  // Type projet + puissance
  const projInfo: string[] = []
  if (devis.type_projet) projInfo.push(devis.type_projet.charAt(0).toUpperCase() + devis.type_projet.slice(1))
  if (devis.puissance_kwc) projInfo.push(`${devis.puissance_kwc} kWc`)
  if (devis.nb_panneaux) projInfo.push(`${devis.nb_panneaux} panneaux`)
  if (projInfo.length > 0) {
    doc.setFontSize(7.5)
    doc.setTextColor(100, 116, 139)
    doc.text(projInfo.join('  ·  '), MARGIN, y1)
  }

  // ── Client block ─────────────────────────────────────────────
  const y2 = y1 + 13

  doc.setFillColor(248, 250, 252)
  doc.roundedRect(MARGIN, y2, W - 28, 32, 3, 3, 'F')
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(MARGIN, y2, W - 28, 32, 3, 3, 'D')
  doc.setFillColor(cr, cg, cb)
  doc.roundedRect(MARGIN, y2, 3, 32, 1, 1, 'F')

  doc.setTextColor(148, 163, 184)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('DESTINATAIRE', MARGIN + 8, y2 + 6)

  doc.setTextColor(15, 23, 42)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(client?.nom ?? '—', MARGIN + 8, y2 + 13)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)

  const clientLines: string[] = []
  if (devis.type_client && devis.type_client !== 'particulier') {
    clientLines.push(devis.type_client.charAt(0).toUpperCase() + devis.type_client.slice(1))
  }

  // Adresse chantier si différente
  const hasChantier = devis.adresse_chantier || devis.ville_chantier
  if (hasChantier) {
    const chantierAddr = [devis.adresse_chantier, [devis.code_postal_chantier, devis.ville_chantier].filter(Boolean).join(' ')].filter(Boolean).join(', ')
    clientLines.push(`Chantier : ${chantierAddr}`)
  } else {
    if (client?.adresse) clientLines.push(client.adresse)
    if (client?.code_postal || client?.ville) clientLines.push(`${client?.code_postal ?? ''} ${client?.ville ?? ''}`.trim())
  }
  if (client?.email) clientLines.push(client.email)
  if (client?.telephone) clientLines.push(client.telephone)
  if (client?.siret) clientLines.push(`SIRET : ${client.siret}`)

  clientLines.slice(0, 4).forEach((line, i) => doc.text(line, MARGIN + 8, y2 + 19 + i * 4))

  // ── Lots tables ───────────────────────────────────────────────
  let tableY = y2 + 36

  for (const lot of lots) {
    const lignes = lot.lignes
    if (lignes.length === 0) continue

    // Lot header
    const lotRows = lignes.map(l => {
      if (l.isText) {
        return [{ content: l.designation, colSpan: 6, styles: { fontStyle: 'italic' as const, textColor: [100, 116, 139] as [number, number, number], fillColor: [250, 250, 252] as [number, number, number] } }]
      }
      const lineHT = l.quantite * l.prixUnitaire * (1 - (l.remise ?? 0) / 100) * (1 - remiseGlobale / 100)
      return [
        l.description ? `${l.designation}\n${l.description}` : l.designation,
        String(l.quantite % 1 === 0 ? l.quantite : l.quantite.toFixed(2)),
        eur(l.prixUnitaire),
        `${l.tva ?? 20}%`,
        (l.remise ?? 0) > 0 ? `-${l.remise}%` : '—',
        eur(lineHT),
      ]
    })

    const lotST = lot.lignes.filter(l => !l.isText).reduce((s, l) => s + l.quantite * l.prixUnitaire * (1 - (l.remise ?? 0) / 100), 0) * (1 - remiseGlobale / 100)

    autoTable(doc, {
      startY: tableY,
      head: [[{ content: `LOT : ${lot.nom}`, colSpan: 5, styles: { fontStyle: 'bold', fontSize: 8.5 } }, `Sous-total : ${eur(lotST)}`]],
      body: lotRows,
      foot: [],
      margin: { left: MARGIN, right: MARGIN },
      tableWidth: W - MARGIN * 2,
      styles: {
        fontSize: 8,
        cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
        overflow: 'linebreak',
        valign: 'middle',
      },
      headStyles: {
        fillColor: [cr, cg, cb],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'left',
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { halign: 'left', cellWidth: 'auto' },
        1: { halign: 'right', cellWidth: 12 },
        2: { halign: 'right', cellWidth: 26 },
        3: { halign: 'right', cellWidth: 12 },
        4: { halign: 'right', cellWidth: 14 },
        5: { halign: 'right', cellWidth: 26, fontStyle: 'bold' },
      },
      didParseCell: (data) => {
        if (data.column.index === 0 && data.section === 'head') {
          data.cell.styles.halign = 'left'
        }
        if (data.column.index === 5 && data.section === 'head') {
          data.cell.styles.halign = 'right'
        }
      },
    })

    tableY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4
  }

  // ── Totals block ──────────────────────────────────────────────
  const afterTable = tableY + 4
  const totalsX = 120
  const totalsW = 76

  // Left: conditions + notes
  let leftY = afterTable
  if (devis.conditions_paiement) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(71, 85, 105)
    doc.text('Conditions de paiement', MARGIN, leftY)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 41, 59)
    doc.text(devis.conditions_paiement, MARGIN, leftY + 5)
    leftY += 14
  }

  if (devis.notes) {
    doc.setFillColor(240, 249, 255)
    doc.roundedRect(MARGIN, leftY - 2, 88, 18, 2, 2, 'F')
    doc.setDrawColor(186, 230, 253)
    doc.roundedRect(MARGIN, leftY - 2, 88, 18, 2, 2, 'D')
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(3, 105, 161)
    doc.text('Notes', MARGIN + 4, leftY + 3)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(12, 74, 110)
    const noteLines = doc.splitTextToSize(devis.notes, 80)
    doc.text(noteLines.slice(0, 3), MARGIN + 4, leftY + 8)
    leftY += 22
  }

  // Garanties
  if (profile.garanties_defaut) {
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139)
    const gLines = doc.splitTextToSize(profile.garanties_defaut, 88)
    doc.text(gLines.slice(0, 3), MARGIN, leftY)
  }

  // Right: totals box
  const tvaEntries = Object.entries(tvaMap).sort(([a], [b]) => Number(a) - Number(b))
  const rowCount = lots.length > 1
    ? lots.length + 1 + tvaEntries.length + 1 + (remiseGlobale > 0 ? 1 : 0) + ((devis.acompte ?? 0) > 0 ? 1 : 0)
    : 1 + tvaEntries.length + 1 + (remiseGlobale > 0 ? 1 : 0) + ((devis.acompte ?? 0) > 0 ? 1 : 0)

  const boxH = 6 + rowCount * 6.5 + 14
  let ty = afterTable

  doc.setFillColor(248, 250, 252)
  doc.roundedRect(totalsX, ty - 3, totalsW, boxH, 3, 3, 'F')
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(totalsX, ty - 3, totalsW, boxH, 3, 3, 'D')

  const rX = totalsX + totalsW - 5
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)

  // Sous-totaux lots (si > 1 lot)
  if (lots.length > 1) {
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.text('Sous-totaux par lot', totalsX + 5, ty + 3)
    ty += 6
    for (const ls of lotSousTotaux) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(100, 116, 139)
      doc.text(ls.nom, totalsX + 5, ty + 3)
      doc.text(eur(ls.ht), rX, ty + 3, { align: 'right' })
      ty += 6
    }
    doc.setDrawColor(226, 232, 240)
    doc.line(totalsX + 5, ty, rX, ty)
    ty += 3
  }

  // Total HT
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  doc.text('Total HT', totalsX + 5, ty + 3)
  doc.text(eur(montantHT), rX, ty + 3, { align: 'right' })
  ty += 7

  // TVA ventilée
  for (const [rate, amt] of tvaEntries) {
    doc.text(`TVA ${rate}%`, totalsX + 5, ty + 3)
    doc.text(eur(amt), rX, ty + 3, { align: 'right' })
    ty += 6
  }

  // Remise globale
  if (remiseGlobale > 0) {
    doc.setTextColor(220, 38, 38)
    doc.text(`Remise (${remiseGlobale}%)`, totalsX + 5, ty + 3)
    doc.text(`−${eur((htBase + tvaTotal - montantTTC))}`, rX, ty + 3, { align: 'right' })
    ty += 6
    doc.setTextColor(71, 85, 105)
  }

  // Séparateur + TTC
  doc.setDrawColor(226, 232, 240)
  doc.line(totalsX + 5, ty, rX, ty)
  ty += 2

  doc.setFillColor(cr, cg, cb)
  doc.roundedRect(totalsX, ty, totalsW, 13, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Total TTC', totalsX + 5, ty + 9)
  doc.text(eur(montantTTC), rX, ty + 9, { align: 'right' })
  ty += 17

  if ((devis.acompte ?? 0) > 0) {
    const aAmt = montantTTC * (devis.acompte ?? 0) / 100
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(5, 150, 105)
    doc.text(`Acompte dû (${devis.acompte}%) :`, totalsX + 5, ty + 3)
    doc.text(eur(aAmt), rX, ty + 3, { align: 'right' })
  }

  // ── Signature ────────────────────────────────────────────────
  // signature_active defaults to true if not explicitly set
  const showSig = profile.signature_active !== false
  if (showSig) {
    const SIG_H = 52
    const FOOTER_RESERVE = 28
    let sigY = Math.max(afterTable + 48, ty + 14)

    // If not enough room, start a new page
    if (sigY + SIG_H + FOOTER_RESERVE > 297) {
      doc.addPage()
      sigY = 20
    }

    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(100, 116, 139)
    doc.text('SIGNATURES', MARGIN, sigY)

    // ── Installateur box ─────────────────────────────────────
    const boxW = (W - MARGIN * 2 - 8) / 2
    const box1X = MARGIN
    const box2X = MARGIN + boxW + 8

    doc.setFillColor(248, 250, 252)
    doc.roundedRect(box1X, sigY + 4, boxW, SIG_H, 2, 2, 'F')
    doc.setDrawColor(cr, cg, cb)
    doc.setLineWidth(0.5)
    doc.roundedRect(box1X, sigY + 4, boxW, SIG_H, 2, 2, 'D')
    doc.setLineWidth(0.2)

    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(cr, cg, cb)
    doc.text("L'installateur", box1X + 4, sigY + 11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(148, 163, 184)
    doc.setFontSize(6.5)
    doc.text('Nom, date et cachet', box1X + 4, sigY + 17)
    // Signature line
    doc.setDrawColor(203, 213, 225)
    doc.setLineWidth(0.3)
    doc.line(box1X + 4, sigY + SIG_H - 4, box1X + boxW - 4, sigY + SIG_H - 4)

    // Company name pre-filled
    if (profile.nom) {
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 41, 59)
      doc.text(profile.nom, box1X + 4, sigY + 28)
    }

    // ── Client box ───────────────────────────────────────────
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(box2X, sigY + 4, boxW, SIG_H, 2, 2, 'F')
    doc.setDrawColor(cr, cg, cb)
    doc.setLineWidth(0.5)
    doc.roundedRect(box2X, sigY + 4, boxW, SIG_H, 2, 2, 'D')
    doc.setLineWidth(0.2)

    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(cr, cg, cb)
    doc.text('Le client', box2X + 4, sigY + 11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(148, 163, 184)
    doc.setFontSize(6.5)
    doc.text('Bon pour accord, date et signature', box2X + 4, sigY + 17)
    // Signature line
    doc.setDrawColor(203, 213, 225)
    doc.setLineWidth(0.3)
    doc.line(box2X + 4, sigY + SIG_H - 4, box2X + boxW - 4, sigY + SIG_H - 4)

    // Client name pre-filled
    if (client?.nom) {
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(30, 41, 59)
      doc.text(client.nom, box2X + 4, sigY + 28)
    }
  }

  // ── Footer ───────────────────────────────────────────────────
  const pageH = 297
  const pageCount = (doc as jsPDF & { internal: { getNumberOfPages(): number } }).internal.getNumberOfPages()
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p)
    if (profile.mentions_legales && p === 1) {
      doc.setFontSize(6)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(148, 163, 184)
      doc.setDrawColor(226, 232, 240)
      doc.line(MARGIN, pageH - 22, W - MARGIN, pageH - 22)
      const mentionLines = doc.splitTextToSize(profile.mentions_legales, W - MARGIN * 2)
      doc.text(mentionLines.slice(0, 3), MARGIN, pageH - 17)
    }
    doc.setFontSize(7)
    doc.setTextColor(148, 163, 184)
    doc.text(devis.numero, MARGIN, pageH - 6)
    doc.text('VoltPilot · voltpilot.fr', W / 2, pageH - 6, { align: 'center' })
    doc.text(`Page ${p} / ${pageCount}`, W - MARGIN, pageH - 6, { align: 'right' })
  }

  doc.save(`${devis.numero}.pdf`)
}

export function generateFacturePDF(facture: DevisForPDF, profile: ProfileForPDF): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const MARGIN = 14
  const [cr, cg, cb] = hexToRgb(profile.couleur_primaire ?? '#22D3EE')
  const client = facture.clients
  const remiseGlobale = facture.remise ?? 0
  const lots = parseLots(facture)
  const { montantHT, tvaMap, tvaTotal, montantTTC } = calcTotaux(lots, remiseGlobale)

  // ── Header ──────────────────────────────────────────────────
  doc.setFillColor(cr, cg, cb)
  doc.rect(0, 0, W, 42, 'F')

  let textOffsetX = MARGIN
  if (profile.logo) {
    try {
      const ext = profile.logo.includes('png') ? 'PNG' : 'JPEG'
      doc.addImage(profile.logo, ext, 8, 5, 28, 28)
      textOffsetX = 42
    } catch { /* skip */ }
  }

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(profile.nom ?? 'Mon Entreprise', textOffsetX, 16)

  if (profile.adresse || profile.ville) {
    const addr = [profile.adresse, [profile.code_postal, profile.ville].filter(Boolean).join(' ')].filter(Boolean).join(' · ')
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(220, 240, 255)
    doc.text(addr, textOffsetX, 22)
  }

  const legalLine: string[] = []
  if (profile.siret) legalLine.push(`SIRET : ${profile.siret}`)
  if (profile.tva) legalLine.push(`TVA : ${profile.tva}`)
  if (profile.rge_number) legalLine.push(`RGE : ${profile.rge_number}`)
  if (legalLine.length > 0) {
    doc.setFontSize(6.5)
    doc.setTextColor(200, 230, 255)
    doc.text(legalLine.join('  ·  '), textOffsetX, 28)
  }

  // FACTURE badge
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(W - 64, 7, 50, 11, 2, 2, 'F')
  doc.setTextColor(cr, cg, cb)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('FACTURE', W - 39, 14, { align: 'center' })

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13)
  doc.text(facture.numero, W - MARGIN, 29, { align: 'right' })

  // Dates
  const y1 = 50
  doc.setTextColor(100, 116, 139)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.text(`Émise le : ${fmtDate(facture.created_at)}`, W - MARGIN, y1, { align: 'right' })
  if (facture.date_validite) {
    doc.text(`Échéance : ${fmtDate(facture.date_validite)}`, W - MARGIN, y1 + 5, { align: 'right' })
  }

  // Client block
  const y2 = y1 + 10
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(MARGIN, y2, W - 28, 28, 3, 3, 'F')
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(MARGIN, y2, W - 28, 28, 3, 3, 'D')
  doc.setFillColor(cr, cg, cb)
  doc.roundedRect(MARGIN, y2, 3, 28, 1, 1, 'F')

  doc.setTextColor(148, 163, 184)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('FACTURÉ À', MARGIN + 8, y2 + 6)
  doc.setTextColor(15, 23, 42)
  doc.setFontSize(10)
  doc.text(client?.nom ?? '—', MARGIN + 8, y2 + 13)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)

  const clientLines: string[] = []
  if (client?.adresse) clientLines.push(client.adresse)
  if (client?.code_postal || client?.ville) clientLines.push(`${client?.code_postal ?? ''} ${client?.ville ?? ''}`.trim())
  if (client?.email) clientLines.push(client.email)
  clientLines.slice(0, 3).forEach((line, i) => doc.text(line, MARGIN + 8, y2 + 18 + i * 4))

  // Lots
  let tableY = y2 + 32
  for (const lot of lots) {
    if (lot.lignes.length === 0) continue
    const lotRows = lot.lignes.map(l => {
      if (l.isText) return [{ content: l.designation, colSpan: 6, styles: { fontStyle: 'italic' as const, textColor: [100, 116, 139] as [number, number, number] } }]
      const lineHT = l.quantite * l.prixUnitaire * (1 - (l.remise ?? 0) / 100) * (1 - remiseGlobale / 100)
      return [l.designation, String(l.quantite), eur(l.prixUnitaire), `${l.tva ?? 20}%`, (l.remise ?? 0) > 0 ? `-${l.remise}%` : '—', eur(lineHT)]
    })

    autoTable(doc, {
      startY: tableY,
      head: [[{ content: lots.length > 1 ? `LOT : ${lot.nom}` : 'Désignation', colSpan: 5, styles: { fontStyle: 'bold' as const } }, 'Total HT']],
      body: lotRows,
      margin: { left: MARGIN, right: MARGIN },
      tableWidth: W - MARGIN * 2,
      styles: { fontSize: 8, cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 }, overflow: 'linebreak' },
      headStyles: { fillColor: [cr, cg, cb], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 0: { halign: 'left', cellWidth: 'auto' }, 1: { halign: 'right', cellWidth: 12 }, 2: { halign: 'right', cellWidth: 26 }, 3: { halign: 'right', cellWidth: 12 }, 4: { halign: 'right', cellWidth: 14 }, 5: { halign: 'right', cellWidth: 26, fontStyle: 'bold' } },
    })

    tableY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4
  }

  // Totaux
  const totalsX = 120
  const totalsW = 76
  let ty = tableY + 4

  doc.setFillColor(248, 250, 252)
  const boxH = 6 + (1 + Object.keys(tvaMap).length + 1 + ((facture.acompte ?? 0) > 0 ? 1 : 0)) * 7 + 14
  doc.roundedRect(totalsX, ty - 3, totalsW, boxH, 3, 3, 'F')
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(totalsX, ty - 3, totalsW, boxH, 3, 3, 'D')

  const rX = totalsX + totalsW - 5
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)
  doc.text('Total HT', totalsX + 5, ty + 3)
  doc.text(eur(montantHT), rX, ty + 3, { align: 'right' })
  ty += 7

  for (const [rate, amt] of Object.entries(tvaMap).sort(([a], [b]) => Number(a) - Number(b))) {
    doc.text(`TVA ${rate}%`, totalsX + 5, ty + 3)
    doc.text(eur(amt), rX, ty + 3, { align: 'right' })
    ty += 6
  }

  doc.setDrawColor(226, 232, 240)
  doc.line(totalsX + 5, ty, rX, ty)
  ty += 2
  doc.setFillColor(cr, cg, cb)
  doc.roundedRect(totalsX, ty, totalsW, 13, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Total TTC', totalsX + 5, ty + 9)
  doc.text(eur(montantTTC), rX, ty + 9, { align: 'right' })
  ty += 17

  if ((facture.acompte ?? 0) > 0) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(5, 150, 105)
    const reste = montantTTC - (facture.acompte ?? 0)
    doc.text(`Acompte versé :`, totalsX + 5, ty + 3)
    doc.text(`−${eur(facture.acompte ?? 0)}`, rX, ty + 3, { align: 'right' })
    ty += 6
    doc.setTextColor(220, 38, 38)
    doc.text('Solde dû :', totalsX + 5, ty + 3)
    doc.text(eur(reste), rX, ty + 3, { align: 'right' })
  }

  // Footer
  const pageH = 297
  if (profile.mentions_legales) {
    doc.setFontSize(6)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(148, 163, 184)
    doc.setDrawColor(226, 232, 240)
    doc.line(MARGIN, pageH - 22, W - MARGIN, pageH - 22)
    const mentionLines = doc.splitTextToSize(profile.mentions_legales, W - MARGIN * 2)
    doc.text(mentionLines.slice(0, 3), MARGIN, pageH - 17)
  }

  doc.setFontSize(7)
  doc.setTextColor(148, 163, 184)
  doc.text(facture.numero, MARGIN, pageH - 6)
  doc.text('VoltPilot · voltpilot.fr', W / 2, pageH - 6, { align: 'center' })
  doc.text('Page 1', W - MARGIN, pageH - 6, { align: 'right' })

  doc.save(`${facture.numero}.pdf`)
}
