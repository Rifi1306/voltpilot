import { jsPDF } from 'jspdf'
import fs from 'fs'
import path from 'path'

// ── Brand colors ──────────────────────────────────────────────
const NAVY   = [15,  32,  64]  as const   // #0F2040
const NAVY2  = [22,  48,  90]  as const   // lighter navy for boxes
const GOLD   = [245, 166, 35]  as const   // #F5A623
const CYAN   = [6,   182, 212] as const   // #06B6D4
const WHITE  = [255, 255, 255] as const
const LGRAY  = [245, 247, 252] as const   // page background tint
const MGRAY  = [160, 170, 190] as const   // muted text
const DGRAY  = [50,  60,  80]  as const   // body text
const GOLD_L = [255, 200, 80]  as const   // lighter gold for body text on dark bg

// ── Language detection ────────────────────────────────────────
export function languageFromPays(pays: string): string {
  const map: Record<string, string> = {
    FR: 'fr', BE: 'fr', CH: 'fr', LU: 'fr', MA: 'fr',
    DE: 'de',
    ES: 'es', MX: 'es',
    IT: 'it',
    NL: 'nl',
    PT: 'pt', BR: 'pt',
  }
  return map[(pays ?? '').toUpperCase()] ?? 'en'
}

// ── Logo (read once, cached) ──────────────────────────────────
let _logoB64: string | null = null
function getLogoB64(): string {
  if (_logoB64 !== null) return _logoB64
  try {
    const p = path.join(process.cwd(), 'public', 'logo-512.png')
    _logoB64 = `data:image/png;base64,${fs.readFileSync(p).toString('base64')}`
  } catch {
    _logoB64 = ''
  }
  return _logoB64
}

// ── Guide content ─────────────────────────────────────────────
type GuideSection = { title: string; lines: string[] }
type Guide = { title: string; subtitle: string; tagline: string; sections: GuideSection[] }

const GUIDES: Record<string, Guide> = {
  fr: {
    title: "Guide d'utilisation",
    subtitle: 'Votre logiciel de devis solaire',
    tagline: 'Creez des devis, gerez vos clients et pilotez votre activite solaire en quelques clics.',
    sections: [
      {
        title: 'Bienvenue sur VoltPilot',
        lines: [
          'VoltPilot est la solution tout-en-un pour les installateurs de panneaux photovoltaiques.',
          'Creez des devis en quelques minutes, gerez vos clients et suivez votre activite.',
          '',
          'Acces : https://voltpilot.fr  |  Essai gratuit 14 jours, sans carte bancaire',
        ],
      },
      {
        title: 'Creer un devis',
        lines: [
          'Devis > Nouveau devis',
          'Selectionnez un client existant ou creez-en un nouveau',
          'Ajoutez des produits depuis le catalogue (17 references solaires pre-configurees)',
          'Panneaux, onduleurs, batteries, pose, CONSUEL — TVA calculee automatiquement',
          'Ajoutez remises, acomptes et conditions de paiement personnalisees',
          'Telechargez le PDF avec votre logo et couleurs entreprise',
          'Statut : Brouillon → Envoye → Accepte',
        ],
      },
      {
        title: 'Gestion des clients (CRM)',
        lines: [
          'Fiche client complete : nom, SIRET, adresse, email, telephone',
          'Historique complet de tous les devis par client',
          'Suivi du chiffre d\'affaires par client',
          'Pipeline commercial visuel : Brouillon / Envoye / Accepte',
          'Statistiques : taux de conversion, CA par client',
        ],
      },
      {
        title: 'Catalogue produits',
        lines: [
          '17 produits solaires pre-configures et prets a l\'emploi',
          'Panneaux photovoltaiques (monocristallin, polycristallin)',
          'Onduleurs string, micro-onduleurs, batteries de stockage',
          'Pose integration / surimposition, CONSUEL, mise en service',
          'TVA automatique 5.5% (residentiel) ou 20% (produits)',
          'Modifiez prix et descriptions dans Catalogue → Editer',
        ],
      },
      {
        title: 'Export PDF professionnel',
        lines: [
          'PDF genere instantanement avec votre logo d\'entreprise',
          'En-tete et pied de page personnalises aux couleurs de votre marque',
          'Logo client et logo installateur sur le devis',
          'Conditions generales de vente integrees',
          'Zone de signature : installateur + client (noms pre-remplis)',
          'Format A4 — imprime et envoye par email',
        ],
      },
      {
        title: 'Analytics et statistiques',
        lines: [
          'Tableau de bord : CA mensuel, taux de conversion, nombre de devis',
          'Graphique de performance mensuelle en temps reel',
          'Suivi complet de votre pipeline commercial',
          'Statistiques par client : CA et taux d\'acceptation',
        ],
      },
      {
        title: 'Widget site web',
        lines: [
          'Integrez un formulaire de demande de devis sur votre site',
          'Les visiteurs remplissent le formulaire → les demandes arrivent dans VoltPilot',
          'Widget personnalisable aux couleurs de votre marque',
          'Code d\'integration disponible dans Parametres → Widget',
        ],
      },
      {
        title: 'Tarifs et abonnements',
        lines: [
          'Starter : 39 EUR/mois ou 468 EUR/an — 30 devis/mois, 20 clients max',
          'Pro : 99 EUR/mois ou 1 188 EUR/an — Illimite + toutes les fonctionnalites',
          'Essai gratuit 14 jours, sans carte bancaire, resiliation a tout moment',
          'Activer : https://voltpilot.fr/billing',
        ],
      },
      {
        title: 'Support',
        lines: [
          'Email : voltpilotpro@gmail.com',
          'Site web : https://voltpilot.fr',
          'Reponse garantie sous 24h ouvrees',
        ],
      },
    ],
  },

  en: {
    title: 'User Guide',
    subtitle: 'Your professional solar quote software',
    tagline: 'Create quotes, manage clients, and grow your solar business in a few clicks.',
    sections: [
      {
        title: 'Welcome to VoltPilot',
        lines: [
          'VoltPilot is the all-in-one solution for solar panel installers.',
          'Create professional quotes in minutes, manage clients and track your business.',
          '',
          'Access: https://voltpilot.fr  |  14-day free trial, no credit card required',
        ],
      },
      {
        title: 'Creating a Quote',
        lines: [
          'Quotes > New Quote',
          'Select an existing client or create a new one',
          'Add products from catalog (17 pre-configured solar references)',
          'Panels, inverters, batteries, installation — VAT auto-calculated',
          'Add discounts, deposits and custom payment terms',
          'Download PDF with your company logo and brand colors',
          'Status: Draft → Sent → Accepted',
        ],
      },
      {
        title: 'Client Management (CRM)',
        lines: [
          'Complete client profile: name, registration, address, email, phone',
          'Full quote history per client',
          'Revenue tracking per client',
          'Visual sales pipeline: Draft / Sent / Accepted',
          'Statistics: conversion rate, revenue per client',
        ],
      },
      {
        title: 'Product Catalog',
        lines: [
          '17 pre-configured solar products ready to use',
          'Photovoltaic panels (monocrystalline, polycrystalline)',
          'String inverters, micro-inverters, storage batteries',
          'Roof-integrated / surface-mount, commissioning, admin procedures',
          'Automatic VAT calculation',
          'Edit prices and descriptions in Catalog → Edit',
        ],
      },
      {
        title: 'Professional PDF Export',
        lines: [
          'PDF generated instantly with your company logo',
          'Custom header and footer with your brand colors',
          'Client logo and installer logo on the quote',
          'Terms and conditions included',
          'Signature areas: installer + client (pre-filled names)',
          'A4 format — print-ready and email-optimized',
        ],
      },
      {
        title: 'Analytics & Statistics',
        lines: [
          'Dashboard: monthly revenue, conversion rate, quote count',
          'Real-time monthly performance chart',
          'Complete sales pipeline tracking',
          'Client stats: revenue and acceptance rate per client',
        ],
      },
      {
        title: 'Website Widget',
        lines: [
          'Embed a quote request form on your website',
          'Visitors fill the form → requests arrive in VoltPilot',
          'Widget customizable with your brand colors',
          'Integration code available in Settings → Widget',
        ],
      },
      {
        title: 'Plans & Pricing',
        lines: [
          'Starter: EUR 39/month or EUR 468/year — 30 quotes/month, 20 clients max',
          'Pro: EUR 99/month or EUR 1,188/year — Unlimited + all features',
          '14-day free trial, no credit card, cancel anytime',
          'Subscribe: https://voltpilot.fr/billing',
        ],
      },
      {
        title: 'Support',
        lines: [
          'Email: voltpilotpro@gmail.com',
          'Website: https://voltpilot.fr',
          'Response guaranteed within 24 business hours',
        ],
      },
    ],
  },

  de: {
    title: 'Benutzerhandbuch',
    subtitle: 'Ihre professionelle Solar-Angebotssoftware',
    tagline: 'Erstellen Sie Angebote, verwalten Sie Kunden und wachsen Sie mit VoltPilot.',
    sections: [
      { title: 'Willkommen bei VoltPilot', lines: ['VoltPilot ist die All-in-One-Losung fur Photovoltaik-Installateure.', 'Erstellen Sie professionelle Angebote in Minuten, verwalten Sie Kunden.', '', 'Zugang: https://voltpilot.fr  |  14 Tage kostenlos, keine Kreditkarte'] },
      { title: 'Ein Angebot erstellen', lines: ['Angebote > Neues Angebot', 'Bestehenden Kunden wahlen oder neuen erstellen', 'Produkte aus dem Katalog hinzufugen (17 Solar-Referenzen)', 'Panels, Wechselrichter, Batterien — Mehrwertsteuer automatisch', 'Rabatte und Zahlungsbedingungen hinzufugen', 'PDF mit Ihrem Firmenlogo herunterladen', 'Status: Entwurf → Gesendet → Akzeptiert'] },
      { title: 'Kundenverwaltung (CRM)', lines: ['Vollstandiges Kundenprofil: Name, Steuernummer, Adresse', 'Vollstandige Angebotshistorie pro Kunde', 'Umsatzverfolgung pro Kunde', 'Visuelle Pipeline: Entwurf / Gesendet / Akzeptiert'] },
      { title: 'Produktkatalog', lines: ['17 vorkonfigurierte Solarprodukte, sofort einsatzbereit', 'Photovoltaik-Module, Wechselrichter, Speicherbatterien', 'Automatische Mehrwertsteuerberechnung', 'Preise under Katalog → Bearbeiten anpassen'] },
      { title: 'Professioneller PDF-Export', lines: ['Sofort generiertes PDF mit Ihrem Firmenlogo', 'Benutzerdefinierte Kopf- und Fusszeile', 'Unterschriftsfelder fur Kunde und Installateur', 'A4-Format, druck- und versandbereit'] },
      { title: 'Analysen & Statistiken', lines: ['Dashboard: Monatsumsatz, Konversionsrate, Angebotsanzahl', 'Echtzeit-Leistungsdiagramm', 'Vollstandiges Pipeline-Tracking'] },
      { title: 'Website-Widget', lines: ['Angebotsformular auf Ihrer Website einbetten', 'Besucher fullen Formular aus → Anfragen kommen in VoltPilot', 'Integrationscode unter Einstellungen → Widget'] },
      { title: 'Tarife & Abonnements', lines: ['Starter: 39 EUR/Monat oder 468 EUR/Jahr — 30 Angebote, 20 Kunden', 'Pro: 99 EUR/Monat oder 1.188 EUR/Jahr — Unbegrenzt', '14 Tage kostenlos, jederzeit kundbar'] },
      { title: 'Support', lines: ['E-Mail: voltpilotpro@gmail.com', 'Website: https://voltpilot.fr', 'Antwort innerhalb von 24 Werktunden'] },
    ],
  },

  es: {
    title: 'Guia de Usuario',
    subtitle: 'Su software profesional de presupuestos solares',
    tagline: 'Cree presupuestos, gestione clientes y haga crecer su negocio solar.',
    sections: [
      { title: 'Bienvenido a VoltPilot', lines: ['VoltPilot es la solucion todo en uno para instaladores de paneles solares.', 'Cree presupuestos profesionales en minutos.', '', 'Acceso: https://voltpilot.fr  |  14 dias gratis, sin tarjeta'] },
      { title: 'Crear un presupuesto', lines: ['Presupuestos > Nuevo presupuesto', 'Seleccione cliente existente o cree uno nuevo', 'Anada productos del catalogo (17 referencias solares)', 'Paneles, inversores, baterias — IVA calculado automaticamente', 'Anada descuentos y condiciones de pago', 'Descargue el PDF con su logotipo empresarial', 'Estado: Borrador → Enviado → Aceptado'] },
      { title: 'Gestion de clientes (CRM)', lines: ['Perfil completo: nombre, CIF, direccion, email, telefono', 'Historial completo de presupuestos por cliente', 'Seguimiento de ingresos por cliente', 'Pipeline visual: Borrador / Enviado / Aceptado'] },
      { title: 'Catalogo de productos', lines: ['17 productos solares preconfigurados listos para usar', 'Paneles, inversores, baterias, instalacion', 'Calculo automatico del IVA', 'Edite precios en Catalogo → Editar'] },
      { title: 'Exportacion PDF profesional', lines: ['PDF generado al instante con su logotipo', 'Encabezado y pie de pagina personalizados', 'Zonas de firma para cliente e instalador', 'Formato A4 optimizado'] },
      { title: 'Analiticas y estadisticas', lines: ['Panel: ingresos, tasa de conversion, presupuestos', 'Grafico de rendimiento en tiempo real', 'Seguimiento completo del pipeline'] },
      { title: 'Widget para sitio web', lines: ['Formulario de presupuesto en su sitio web', 'Solicitudes llegan directamente a VoltPilot', 'Codigo en Configuracion → Widget'] },
      { title: 'Planes y precios', lines: ['Starter: 39 EUR/mes o 468 EUR/ano — 30 presupuestos, 20 clientes', 'Pro: 99 EUR/mes o 1.188 EUR/ano — Ilimitado', '14 dias gratuitos, cancele cuando quiera'] },
      { title: 'Soporte', lines: ['Email: voltpilotpro@gmail.com', 'Sitio web: https://voltpilot.fr', 'Respuesta en 24 horas laborables'] },
    ],
  },

  it: {
    title: 'Guida Utente',
    subtitle: 'Il software professionale per preventivi solari',
    tagline: 'Crea preventivi, gestisci clienti e fai crescere la tua attivita solare.',
    sections: [
      { title: 'Benvenuto su VoltPilot', lines: ['VoltPilot e la soluzione all-in-one per gli installatori solari.', 'Create preventivi professionali in pochi minuti.', '', 'Accesso: https://voltpilot.fr  |  14 giorni gratis, senza carta'] },
      { title: 'Creare un preventivo', lines: ['Preventivi > Nuovo preventivo', 'Selezionate cliente esistente o createne uno nuovo', 'Aggiungete prodotti dal catalogo (17 riferimenti solari)', 'Pannelli, inverter, batterie — IVA calcolata automaticamente', 'Aggiungete sconti e condizioni di pagamento', 'Scaricate il PDF con il vostro logo aziendale', 'Stato: Bozza → Inviato → Accettato'] },
      { title: 'Gestione clienti (CRM)', lines: ['Profilo completo: nome, P.IVA, indirizzo, email, telefono', 'Storico completo dei preventivi per cliente', 'Monitoraggio fatturato per cliente', 'Pipeline visiva: Bozza / Inviato / Accettato'] },
      { title: 'Catalogo prodotti', lines: ['17 prodotti solari preconfigurati pronti all\'uso', 'Pannelli, inverter, batterie, installazione', 'Calcolo automatico IVA', 'Modificate prezzi in Catalogo → Modifica'] },
      { title: 'Esportazione PDF professionale', lines: ['PDF istantaneo con il vostro logo aziendale', 'Intestazione e pie di pagina personalizzati', 'Aree firma per cliente e installatore', 'Formato A4 ottimizzato'] },
      { title: 'Analitiche e statistiche', lines: ['Dashboard: fatturato, tasso di conversione, preventivi', 'Grafico performance in tempo reale', 'Tracciamento completo pipeline'] },
      { title: 'Widget sito web', lines: ['Modulo richiesta preventivo nel vostro sito', 'Le richieste arrivano direttamente in VoltPilot', 'Codice in Impostazioni → Widget'] },
      { title: 'Piani e prezzi', lines: ['Starter: 39 EUR/mese o 468 EUR/anno — 30 preventivi, 20 clienti', 'Pro: 99 EUR/mese o 1.188 EUR/anno — Illimitato', '14 giorni gratuiti, cancellazione libera'] },
      { title: 'Supporto', lines: ['Email: voltpilotpro@gmail.com', 'Sito web: https://voltpilot.fr', 'Risposta entro 24 ore lavorative'] },
    ],
  },

  nl: {
    title: 'Gebruikshandleiding',
    subtitle: 'Uw professionele software voor zonne-energie offertes',
    tagline: 'Maak offertes, beheer klanten en laat uw zonne-energiebedrijf groeien.',
    sections: [
      { title: 'Welkom bij VoltPilot', lines: ['VoltPilot is de alles-in-een oplossing voor zonnepaneel installateurs.', 'Maak professionele offertes in minuten.', '', 'Toegang: https://voltpilot.fr  |  14 dagen gratis, geen creditcard'] },
      { title: 'Een offerte maken', lines: ['Offertes > Nieuwe offerte', 'Bestaande klant kiezen of nieuwe aanmaken', 'Producten toevoegen uit catalogus (17 zonne-energie referenties)', 'Panelen, omvormers, batterijen — BTW automatisch berekend', 'Kortingen en betalingsvoorwaarden toevoegen', 'PDF downloaden met uw bedrijfslogo', 'Status: Concept → Verzonden → Geaccepteerd'] },
      { title: 'Klantbeheer (CRM)', lines: ['Volledig klantprofiel: naam, KvK, adres, e-mail, telefoon', 'Volledige offerteverleden per klant', 'Omzettracking per klant', 'Visuele pipeline: Concept / Verzonden / Geaccepteerd'] },
      { title: 'Productcatalogus', lines: ['17 vooraf geconfigureerde zonne-energieproducten', 'Panelen, omvormers, batterijen, montage', 'Automatische BTW-berekening', 'Prijzen aanpassen in Catalogus → Bewerken'] },
      { title: 'Professionele PDF-export', lines: ['Direct PDF met uw bedrijfslogo', 'Aangepaste kop- en voettekst', 'Handtekeningvelden voor klant en installateur', 'A4-formaat, druk- en verzendklaar'] },
      { title: 'Analyses & statistieken', lines: ['Dashboard: omzet, conversie, aantal offertes', 'Realtime prestatiegrafiek', 'Volledig pipeline-tracking'] },
      { title: 'Website-widget', lines: ['Offerteformulier op uw website', 'Aanvragen komen direct in VoltPilot', 'Code beschikbaar in Instellingen → Widget'] },
      { title: 'Abonnementen & prijzen', lines: ['Starter: 39 EUR/maand of 468 EUR/jaar — 30 offertes, 20 klanten', 'Pro: 99 EUR/maand of 1.188 EUR/jaar — Onbeperkt', '14 dagen gratis, opzegbaar op elk moment'] },
      { title: 'Ondersteuning', lines: ['E-mail: voltpilotpro@gmail.com', 'Website: https://voltpilot.fr', 'Reactie binnen 24 werkuren'] },
    ],
  },

  pt: {
    title: 'Guia do Utilizador',
    subtitle: 'O software profissional de orcamentos solares',
    tagline: 'Crie orcamentos, gira clientes e faca crescer o seu negocio solar.',
    sections: [
      { title: 'Bem-vindo ao VoltPilot', lines: ['O VoltPilot e a solucao completa para instaladores de paineis solares.', 'Crie orcamentos profissionais em minutos.', '', 'Acesso: https://voltpilot.fr  |  14 dias gratuitos, sem cartao'] },
      { title: 'Criar um orcamento', lines: ['Orcamentos > Novo orcamento', 'Selecione cliente existente ou crie um novo', 'Adicione produtos do catalogo (17 referencias solares)', 'Paineis, inversores, baterias — IVA calculado automaticamente', 'Adicione descontos e condicoes de pagamento', 'Transfira o PDF com o seu logotipo empresarial', 'Estado: Rascunho → Enviado → Aceite'] },
      { title: 'Gestao de clientes (CRM)', lines: ['Perfil completo: nome, NIF, morada, email, telefone', 'Historial completo de orcamentos por cliente', 'Acompanhamento de receitas por cliente', 'Pipeline visual: Rascunho / Enviado / Aceite'] },
      { title: 'Catalogo de produtos', lines: ['17 produtos solares pre-configurados prontos a usar', 'Paineis, inversores, baterias, instalacao', 'Calculo automatico de IVA', 'Edite precos em Catalogo → Editar'] },
      { title: 'Exportacao PDF profissional', lines: ['PDF instantaneo com o seu logotipo', 'Cabecalho e rodape personalizados', 'Areas de assinatura para cliente e instalador', 'Formato A4 otimizado'] },
      { title: 'Analises e estatisticas', lines: ['Painel: receita, taxa de conversao, orcamentos', 'Grafico de desempenho em tempo real', 'Acompanhamento completo da pipeline'] },
      { title: 'Widget para site web', lines: ['Formulario de pedido de orcamento no seu site', 'Os pedidos chegam diretamente ao VoltPilot', 'Codigo em Definicoes → Widget'] },
      { title: 'Planos e precos', lines: ['Starter: 39 EUR/mes ou 468 EUR/ano — 30 orcamentos, 20 clientes', 'Pro: 99 EUR/mes ou 1.188 EUR/ano — Ilimitado', '14 dias gratuitos, cancele quando quiser'] },
      { title: 'Suporte', lines: ['Email: voltpilotpro@gmail.com', 'Site web: https://voltpilot.fr', 'Resposta em 24 horas uteis'] },
    ],
  },
}

// ── Helpers ───────────────────────────────────────────────────

function set(doc: jsPDF, color: readonly [number, number, number]) {
  doc.setFillColor(color[0], color[1], color[2])
}
function setTxt(doc: jsPDF, color: readonly [number, number, number]) {
  doc.setTextColor(color[0], color[1], color[2])
}
function setStroke(doc: jsPDF, color: readonly [number, number, number]) {
  doc.setDrawColor(color[0], color[1], color[2])
}

function drawHeaderBar(doc: jsPDF, logoB64: string, pageTitle: string, pageNum: number, total: number) {
  // Navy header strip
  set(doc, NAVY)
  doc.rect(0, 0, 210, 13, 'F')

  // Gold accent line at very top
  set(doc, GOLD)
  doc.rect(0, 0, 210, 1.2, 'F')

  // Logo
  if (logoB64) {
    doc.addImage(logoB64, 'PNG', 3, 1.5, 10, 10)
  }

  // Page title (center)
  setTxt(doc, [200, 210, 230])
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(pageTitle, 105, 8, { align: 'center' })

  // Page number (right)
  setTxt(doc, GOLD)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text(`${pageNum} / ${total}`, 203, 8, { align: 'right' })
}

function drawFooterBar(doc: jsPDF) {
  set(doc, [228, 232, 240])
  doc.rect(0, 285, 210, 12, 'F')
  setTxt(doc, DGRAY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.text('voltpilot.fr', 15, 292)
  doc.text('voltpilotpro@gmail.com', 105, 292, { align: 'center' })
  doc.text('© 2026 VoltPilot', 203, 292, { align: 'right' })
}

// ── Cover page ────────────────────────────────────────────────
function drawCover(doc: jsPDF, guide: Guide, logoB64: string) {
  const W = 210

  // Dark navy background
  set(doc, NAVY)
  doc.rect(0, 0, W, 297, 'F')

  // Gold top accent line
  set(doc, GOLD)
  doc.rect(0, 0, W, 2.5, 'F')

  // Decorative circles (subtle dark)
  set(doc, NAVY2)
  doc.circle(180, 80, 55, 'F')
  doc.circle(20, 220, 40, 'F')
  doc.circle(170, 230, 25, 'F')

  // Cyan accent rings
  setStroke(doc, CYAN)
  doc.setLineWidth(0.4)
  doc.circle(180, 80, 62, 'S')
  doc.setLineWidth(0.15)
  doc.circle(180, 80, 68, 'S')

  // Gold accent ring
  setStroke(doc, GOLD)
  doc.setLineWidth(0.3)
  doc.circle(20, 220, 47, 'S')

  // ── Logo area ──────────────────────────────────
  if (logoB64) {
    // Large logo icon centered top
    doc.addImage(logoB64, 'PNG', 82, 22, 46, 46)
  } else {
    // Fallback gold hexagon
    set(doc, GOLD)
    doc.circle(105, 45, 22, 'F')
    setTxt(doc, NAVY)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.text('VP', 97, 51)
  }

  // ── Brand name VOLT ● PILOT ────────────────────
  setTxt(doc, GOLD)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(30)
  doc.text('VOLT', 62, 85)

  // Cyan dot
  set(doc, CYAN)
  doc.circle(105, 80, 3, 'F')

  setTxt(doc, WHITE)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(30)
  doc.text('PILOT', 111, 85)

  // Tagline under brand name
  setTxt(doc, [120, 150, 185])
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.text('LOGICIEL SOLAIRE PRO', 105, 92, { align: 'center' })

  // ── Gold separator ─────────────────────────────
  set(doc, GOLD)
  doc.rect(30, 99, 150, 0.8, 'F')

  // ── Guide title card ───────────────────────────
  set(doc, NAVY2)
  doc.roundedRect(14, 108, 182, 80, 4, 4, 'F')
  setStroke(doc, [40, 65, 110])
  doc.setLineWidth(0.3)
  doc.roundedRect(14, 108, 182, 80, 4, 4, 'S')

  // Gold left accent bar inside card
  set(doc, GOLD)
  doc.roundedRect(14, 108, 4, 80, 2, 2, 'F')

  setTxt(doc, WHITE)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text(guide.title, 26, 130)

  set(doc, GOLD)
  doc.rect(26, 135, 50, 0.8, 'F')

  setTxt(doc, [180, 200, 230])
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const tagLines = doc.splitTextToSize(guide.tagline, 155)
  doc.text(tagLines, 26, 145)

  // Sub-info
  setTxt(doc, CYAN)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('14 JOURS GRATUITS', 26, 170)
  setTxt(doc, [150, 170, 200])
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('voltpilot.fr/register', 26, 178)

  // ── Feature checklist ─────────────────────────
  const features = [
    'Devis professionnels en quelques minutes',
    'Catalogue solaire pre-configure (17 produits)',
    'CRM clients + pipeline commercial',
    'Export PDF a votre logo + zone de signature',
    'Analytics, widget site web et abonnement flexible',
  ]

  let fy = 205
  for (const f of features) {
    // Gold checkmark circle
    set(doc, GOLD)
    doc.circle(22, fy - 1.5, 3.2, 'F')
    setTxt(doc, NAVY)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.text('✓', 20, fy - 0.5)

    setTxt(doc, [210, 220, 240])
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(f, 29, fy)
    fy += 10
  }

  // ── Bottom bar ─────────────────────────────────
  set(doc, [8, 18, 40])
  doc.rect(0, 267, 210, 30, 'F')
  set(doc, GOLD)
  doc.rect(0, 267, 210, 0.8, 'F')

  setTxt(doc, [120, 150, 185])
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('voltpilot.fr', 15, 280)
  doc.text('voltpilotpro@gmail.com', 105, 280, { align: 'center' })
  doc.text('contact@voltpilot.fr', 195, 280, { align: 'right' })

  setTxt(doc, [70, 90, 120])
  doc.setFontSize(7)
  doc.text('© 2026 VoltPilot — Tous droits reserves', 105, 288, { align: 'center' })
}

// ── Content pages ─────────────────────────────────────────────
function drawSectionNumber(doc: jsPDF, x: number, y: number, num: number) {
  // Navy circle with gold ring
  set(doc, NAVY)
  doc.circle(x, y, 5, 'F')
  setStroke(doc, GOLD)
  doc.setLineWidth(0.6)
  doc.circle(x, y, 5, 'S')
  // Number
  setTxt(doc, GOLD)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  const numStr = num < 10 ? `0${num}` : `${num}`
  doc.text(numStr, x, y + 1.2, { align: 'center' })
}

// ── Main export ───────────────────────────────────────────────
export function generateGuidePDF(pays: string): Buffer {
  const lang = languageFromPays(pays)
  const guide = GUIDES[lang] ?? GUIDES['en']
  const logoB64 = getLogoB64()

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  const W = 210
  const M = 16          // left margin
  const maxW = W - M - 14  // content width

  // ── Page 1: Cover ─────────────────────────────
  drawCover(doc, guide, logoB64)

  // ── Pages 2+: Content ─────────────────────────
  const HEADER_H = 14   // header bar height
  const FOOTER_Y = 285  // footer starts
  const START_Y  = HEADER_H + 8  // content starts
  const pageTitle = `VoltPilot — ${guide.title}`

  // We'll track total pages; add content and then set headers afterward
  let currentPage = 2
  const contentPages: number[] = [] // page indices of content pages

  doc.addPage()
  contentPages.push(currentPage)

  // Light background for content pages
  set(doc, LGRAY)
  doc.rect(0, 0, W, 297, 'F')
  set(doc, WHITE)
  doc.rect(M - 4, HEADER_H + 2, W - M - 10, FOOTER_Y - HEADER_H - 4, 'F')

  let y = START_Y + 4

  for (let si = 0; si < guide.sections.length; si++) {
    const section = guide.sections[si]

    // Estimate section height
    let estimatedH = 18 // title area
    for (const line of section.lines) {
      if (line === '') { estimatedH += 3; continue }
      const wrapped = doc.splitTextToSize(line, maxW - 8)
      estimatedH += wrapped.length * 5.2
    }
    estimatedH += 8 // bottom padding

    // New page if needed
    if (y + estimatedH > FOOTER_Y - 8) {
      currentPage++
      doc.addPage()
      contentPages.push(currentPage)

      set(doc, LGRAY)
      doc.rect(0, 0, W, 297, 'F')
      set(doc, WHITE)
      doc.rect(M - 4, HEADER_H + 2, W - M - 10, FOOTER_Y - HEADER_H - 4, 'F')
      y = START_Y + 4
    }

    // ── Section card ──────────────────────────────
    // Subtle card shadow (darker bg rectangle slightly offset)
    set(doc, [215, 220, 232])
    doc.roundedRect(M - 1, y + 1, maxW + 3, estimatedH + 1, 3, 3, 'F')

    // Card background
    set(doc, WHITE)
    doc.roundedRect(M - 1, y, maxW + 3, estimatedH, 3, 3, 'F')

    // Gold left border accent
    set(doc, GOLD)
    doc.roundedRect(M - 1, y, 3, estimatedH, 2, 2, 'F')

    // Section number badge
    drawSectionNumber(doc, M + 9, y + 8, si + 1)

    // Section title
    setTxt(doc, NAVY)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10.5)
    doc.text(section.title, M + 18, y + 9.5)

    // Underline (thin gold)
    set(doc, GOLD)
    doc.rect(M + 18, y + 11.5, maxW - 20, 0.5, 'F')

    let ly = y + 19

    for (const line of section.lines) {
      if (line === '') { ly += 3; continue }

      const isUrl = line.startsWith('http') || line.includes('voltpilot.fr') || line.includes('@')

      const wrapped = doc.splitTextToSize(line, maxW - 8)

      // Custom bullet dot
      set(doc, GOLD)
      doc.circle(M + 4.5, ly - 1.8, 1.4, 'F')

      if (isUrl) {
        setTxt(doc, CYAN)
        doc.setFont('helvetica', 'normal')
      } else {
        setTxt(doc, DGRAY)
        doc.setFont('helvetica', 'normal')
      }
      doc.setFontSize(9)
      doc.text(wrapped, M + 8, ly)

      ly += wrapped.length * 5.2
    }

    y += estimatedH + 6
  }

  // ── Add headers and footers to all content pages ──
  const totalPages = currentPage
  for (let pi = 0; pi < contentPages.length; pi++) {
    doc.setPage(contentPages[pi])
    drawHeaderBar(doc, logoB64, pageTitle, pi + 2, totalPages)
    drawFooterBar(doc)
  }

  return Buffer.from(doc.output('arraybuffer'))
}
