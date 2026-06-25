import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

type LigneItem = {
  designation: string
  description?: string
  quantite: number
  prixUnitaire: number
  remise?: number
  tva?: number
}

export type DevisForPDF = {
  numero: string
  lignes: unknown
  remise: number | null
  acompte: number | null
  conditions_paiement: string | null
  notes: string | null
  date_validite: string | null
  created_at: string
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
  mentions_legales: string | null
  couleur_primaire: string | null
  logo?: string
  signature_active?: boolean
}

function parseLignes(raw: unknown): LigneItem[] {
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

export function generateDevisPDF(devis: DevisForPDF, profile: ProfileForPDF): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = 210
  const [cr, cg, cb] = hexToRgb(profile.couleur_primaire ?? '#22D3EE')
  const client = devis.clients
  const lignes = parseLignes(devis.lignes)
  const remiseGlobale = devis.remise ?? 0

  // Totals calculation
  const htBase = lignes.reduce((s, l) => s + l.quantite * l.prixUnitaire * (1 - (l.remise ?? 0) / 100), 0)
  const tvaBase = lignes.reduce((s, l) => {
    const ht = l.quantite * l.prixUnitaire * (1 - (l.remise ?? 0) / 100)
    return s + ht * ((l.tva ?? 20) / 100)
  }, 0)
  const factor = 1 - remiseGlobale / 100
  const montantHT = htBase * factor
  const montantTVA = tvaBase * factor
  const montantTTC = montantHT + montantTVA

  // ── Header band ────────────────────────────────────────────────
  doc.setFillColor(cr, cg, cb)
  doc.rect(0, 0, W, 40, 'F')

  // Thin gradient stripe at bottom of header
  doc.setFillColor(Math.max(0, cr - 40), Math.max(0, cg - 20), Math.min(255, cb + 20))
  doc.rect(0, 37, W, 3, 'F')

  // Logo (if available) — drawn in top-left of header
  let textOffsetX = 14
  if (profile.logo) {
    try {
      const ext = profile.logo.includes('png') ? 'PNG' : profile.logo.includes('svg') ? 'PNG' : 'JPEG'
      doc.addImage(profile.logo, ext, 8, 5, 28, 28)
      textOffsetX = 42
    } catch { /* skip logo if invalid */ }
  }

  // Company name + tagline
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(17)
  doc.setFont('helvetica', 'bold')
  doc.text(profile.nom ?? 'Mon Entreprise', textOffsetX, 17)

  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(255, 255, 255)
  doc.text('Solutions photovoltaïques', textOffsetX, 23.5)

  if (profile.adresse || profile.ville) {
    const addr = [profile.adresse, [profile.code_postal, profile.ville].filter(Boolean).join(' ')].filter(Boolean).join(' · ')
    doc.setFontSize(7.5)
    doc.setTextColor(220, 240, 255)
    doc.text(addr, textOffsetX, 29)
  }

  // DEVIS badge + number (right side)
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(W - 62, 7, 48, 10, 2, 2, 'F')
  doc.setTextColor(cr, cg, cb)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('DEVIS', W - 38, 13.5, { align: 'center' })

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(15)
  doc.setFont('helvetica', 'bold')
  doc.text(devis.numero, W - 14, 28, { align: 'right' })

  // ── Dates row ──────────────────────────────────────────────────
  const y1 = 48
  doc.setTextColor(100, 116, 139)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`Émis le : ${fmtDate(devis.created_at)}`, W - 14, y1, { align: 'right' })
  if (devis.date_validite) {
    doc.text(`Valide jusqu'au : ${fmtDate(devis.date_validite)}`, W - 14, y1 + 5, { align: 'right' })
  }

  // Company infos (left)
  const companyInfo: string[] = []
  if (profile.siret) companyInfo.push(`SIRET : ${profile.siret}`)
  companyInfo.forEach((line, i) => doc.text(line, 14, y1 + i * 5))

  // ── Client block ───────────────────────────────────────────────
  const y2 = y1 + 16

  doc.setFillColor(248, 250, 252)
  doc.roundedRect(14, y2, W - 28, 30, 3, 3, 'F')
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(14, y2, W - 28, 30, 3, 3, 'D')

  // Left accent bar
  doc.setFillColor(cr, cg, cb)
  doc.roundedRect(14, y2, 3, 30, 1, 1, 'F')

  doc.setTextColor(148, 163, 184)
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('DESTINATAIRE', 22, y2 + 6)

  doc.setTextColor(15, 23, 42)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(client?.nom ?? '—', 22, y2 + 13)

  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)

  const clientDetails: string[] = []
  if (client?.adresse) clientDetails.push(client.adresse)
  if (client?.code_postal || client?.ville) clientDetails.push(`${client?.code_postal ?? ''} ${client?.ville ?? ''}`.trim())
  if (client?.email) clientDetails.push(client.email)
  if (client?.telephone) clientDetails.push(client.telephone)
  if (client?.siret) clientDetails.push(`SIRET : ${client.siret}`)

  clientDetails.forEach((line, i) => doc.text(line, 22, y2 + 19 + i * 4.5))

  // ── Lines table ────────────────────────────────────────────────
  const tableStartY = y2 + 34

  const tableRows = lignes.map(l => {
    const ligneHT = l.quantite * l.prixUnitaire * (1 - (l.remise ?? 0) / 100)
    return [
      l.description ? `${l.designation}\n${l.description}` : l.designation,
      String(l.quantite % 1 === 0 ? l.quantite : l.quantite.toFixed(2)),
      eur(l.prixUnitaire),
      `${l.tva ?? 20}%`,
      (l.remise ?? 0) > 0 ? `-${l.remise}%` : '—',
      eur(ligneHT),
    ]
  })

  autoTable(doc, {
    startY: tableStartY,
    head: [['Désignation', 'Qté', 'P.U. HT', 'TVA', 'Remise', 'Total HT']],
    body: tableRows,
    margin: { left: 14, right: 14 },
    tableWidth: W - 28,
    styles: {
      fontSize: 8.5,
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
      overflow: 'linebreak',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [cr, cg, cb],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'right',
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { halign: 'left', cellWidth: 'auto' },
      1: { halign: 'right', cellWidth: 12 },
      2: { halign: 'right', cellWidth: 28 },
      3: { halign: 'right', cellWidth: 12 },
      4: { halign: 'right', cellWidth: 16 },
      5: { halign: 'right', cellWidth: 27, fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.column.index === 0 && data.section === 'head') {
        data.cell.styles.halign = 'left'
      }
    },
  })

  // ── Totals + conditions ────────────────────────────────────────
  const afterTable = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

  // Left: conditions + notes
  let leftY = afterTable
  if (devis.conditions_paiement) {
    doc.setFontSize(8.5)
    doc.setTextColor(71, 85, 105)
    doc.setFont('helvetica', 'bold')
    doc.text('Conditions de paiement', 14, leftY)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 41, 59)
    doc.text(devis.conditions_paiement, 14, leftY + 5)
    leftY += 14
  }

  if (devis.notes) {
    doc.setFillColor(240, 249, 255)
    doc.roundedRect(14, leftY - 2, 88, 18, 2, 2, 'F')
    doc.setDrawColor(186, 230, 253)
    doc.roundedRect(14, leftY - 2, 88, 18, 2, 2, 'D')
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(3, 105, 161)
    doc.text('Notes', 18, leftY + 3)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(12, 74, 110)
    const noteLines = doc.splitTextToSize(devis.notes, 80)
    doc.text(noteLines.slice(0, 3), 18, leftY + 8)
  }

  // Right: totals box
  const totalsX = 120
  const totalsW = 76
  let ty = afterTable

  const rowCount = 2 + (remiseGlobale > 0 ? 1 : 0) + ((devis.acompte ?? 0) > 0 ? 1 : 0)
  const boxH = 8 + rowCount * 7 + 12

  doc.setFillColor(248, 250, 252)
  doc.roundedRect(totalsX, ty - 3, totalsW, boxH, 3, 3, 'F')
  doc.setDrawColor(226, 232, 240)
  doc.roundedRect(totalsX, ty - 3, totalsW, boxH, 3, 3, 'D')

  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(71, 85, 105)

  const rX = totalsX + totalsW - 5

  doc.text('Sous-total HT', totalsX + 5, ty + 3)
  doc.text(eur(htBase), rX, ty + 3, { align: 'right' })

  doc.text('TVA', totalsX + 5, ty + 10)
  doc.text(eur(tvaBase), rX, ty + 10, { align: 'right' })

  let ttcY = ty + 17
  if (remiseGlobale > 0) {
    doc.setTextColor(220, 38, 38)
    doc.text(`Remise (${remiseGlobale}%)`, totalsX + 5, ttcY)
    doc.text(`−${eur((htBase + tvaBase) * remiseGlobale / 100)}`, rX, ttcY, { align: 'right' })
    ttcY += 7
    doc.setTextColor(71, 85, 105)
  }

  // Separator line
  doc.setDrawColor(226, 232, 240)
  doc.line(totalsX + 5, ttcY - 2, totalsX + totalsW - 5, ttcY - 2)

  // TTC band
  doc.setFillColor(cr, cg, cb)
  doc.roundedRect(totalsX, ttcY, totalsW, 12, 2, 2, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('Total TTC', totalsX + 5, ttcY + 8)
  doc.text(eur(montantTTC), rX, ttcY + 8, { align: 'right' })

  if ((devis.acompte ?? 0) > 0) {
    const aAmt = montantTTC * (devis.acompte ?? 0) / 100
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(5, 150, 105)
    const acompteY = ttcY + 19
    doc.text(`Acompte dû (${devis.acompte}%) :`, totalsX + 5, acompteY)
    doc.text(eur(aAmt), rX, acompteY, { align: 'right' })
  }

  // ── Signature block ────────────────────────────────────────────
  if (profile.signature_active) {
    const sigY = Math.max(afterTable + 44, ttcY + 30)
    if (sigY + 36 < 265) {
      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(100, 116, 139)
      doc.text('SIGNATURES', 14, sigY)

      // Installateur box
      doc.setFillColor(248, 250, 252)
      doc.roundedRect(14, sigY + 3, 85, 32, 2, 2, 'F')
      doc.setDrawColor(226, 232, 240)
      doc.roundedRect(14, sigY + 3, 85, 32, 2, 2, 'D')
      doc.setFontSize(7)
      doc.setTextColor(148, 163, 184)
      doc.text("L'installateur — Nom, date et signature", 18, sigY + 9)
      doc.setDrawColor(203, 213, 225)
      doc.line(18, sigY + 30, 94, sigY + 30)

      // Client box
      doc.setFillColor(248, 250, 252)
      doc.roundedRect(111, sigY + 3, 85, 32, 2, 2, 'F')
      doc.setDrawColor(226, 232, 240)
      doc.roundedRect(111, sigY + 3, 85, 32, 2, 2, 'D')
      doc.setTextColor(148, 163, 184)
      doc.text('Le client — Bon pour accord, date et signature', 115, sigY + 9)
      doc.setDrawColor(203, 213, 225)
      doc.line(115, sigY + 30, 191, sigY + 30)
    }
  }

  // ── Footer ─────────────────────────────────────────────────────
  const pageH = 297
  if (profile.mentions_legales) {
    doc.setFontSize(6.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(148, 163, 184)
    doc.setDrawColor(226, 232, 240)
    doc.line(14, pageH - 22, W - 14, pageH - 22)
    const mentionLines = doc.splitTextToSize(profile.mentions_legales, W - 28)
    doc.text(mentionLines.slice(0, 3), 14, pageH - 17)
  }

  doc.setFontSize(7.5)
  doc.setTextColor(148, 163, 184)
  doc.text(devis.numero, 14, pageH - 6)
  doc.text('VoltPilot · voltpilot.fr', W / 2, pageH - 6, { align: 'center' })
  doc.text('Page 1 / 1', W - 14, pageH - 6, { align: 'right' })

  doc.save(`${devis.numero}.pdf`)
}
