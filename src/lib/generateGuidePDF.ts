import { jsPDF } from 'jspdf'

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

type GuideSection = { title: string; lines: string[] }
type Guide = { title: string; subtitle: string; sections: GuideSection[] }

const GUIDES: Record<string, Guide> = {
  fr: {
    title: "Guide d'utilisation VoltPilot",
    subtitle: 'Votre logiciel de devis solaire professionnel',
    sections: [
      {
        title: '1. BIENVENUE SUR VOLTPILOT',
        lines: [
          "VoltPilot est la solution tout-en-un pour les installateurs de panneaux photovoltaiques.",
          "Creez des devis professionnels en quelques minutes, gerez vos clients et pilotez votre",
          "activite commerciale depuis un seul espace.",
          '',
          "Acces : https://voltpilot.fr  |  Essai gratuit 14 jours sans carte bancaire",
        ],
      },
      {
        title: '2. CREER UN DEVIS',
        lines: [
          '• Allez dans Devis -> Nouveau devis',
          '• Selectionnez un client existant ou creez-en un nouveau',
          '• Ajoutez vos produits depuis le catalogue (17 references solaires pre-configurees)',
          '• Panneaux, onduleurs, batteries, pose, CONSUEL — TVA calculee automatiquement',
          '• Ajoutez remises, acomptes et conditions de paiement personnalisees',
          '• Telechargez immediatement le PDF a votre logo et couleurs d\'entreprise',
          '• Changez le statut : Brouillon -> Envoye -> Accepte',
        ],
      },
      {
        title: '3. GESTION DES CLIENTS (CRM)',
        lines: [
          '• Fiche client complete : nom, SIRET, adresse, email, telephone',
          '• Historique de tous les devis par client',
          '• Suivi du chiffre d\'affaires realise par client',
          '• Pipeline commercial visuel : Brouillon / Envoye / Accepte',
          '• Statistiques : taux de conversion et CA par client',
        ],
      },
      {
        title: '4. CATALOGUE PRODUITS',
        lines: [
          '• 17 produits solaires pre-configures et prets a l\'emploi',
          '• Panneaux photovoltaiques (monocristallin, polycristallin)',
          '• Onduleurs string et micro-onduleurs',
          '• Batteries de stockage et accessoires',
          '• Pose en integration ou surimposition',
          '• CONSUEL, mise en service, demarches administratives',
          '• TVA automatique : 5.5% (residentiel) ou 20% (produits)',
          '• Modifiez prix et descriptions a tout moment dans Catalogue -> Editer',
        ],
      },
      {
        title: '5. EXPORT PDF PROFESSIONNEL',
        lines: [
          '• PDF genere instantanement avec votre logo d\'entreprise',
          '• En-tete et pied de page personnalises aux couleurs de votre marque',
          '• Logo client et logo installateur sur le devis',
          '• Conditions generales de vente integrees',
          '• Zone de signature : installateur + client avec nom pre-rempli',
          '• Format A4, optimise pour l\'impression et l\'envoi par email',
        ],
      },
      {
        title: '6. ANALYTICS ET STATISTIQUES',
        lines: [
          '• Tableau de bord : CA mensuel, taux de conversion, nombre de devis',
          '• Graphique de performance mensuelle en temps reel',
          '• Suivi complet de votre pipeline commercial',
          '• Statistiques par client : CA, taux d\'acceptation',
        ],
      },
      {
        title: '7. WIDGET SITE WEB',
        lines: [
          '• Integrez un formulaire de demande de devis sur votre site internet',
          '• Vos visiteurs remplissent le formulaire en ligne',
          '• Les demandes arrivent directement dans votre espace VoltPilot',
          '• Widget personnalisable aux couleurs de votre marque',
          '• Code d\'integration disponible dans Parametres -> Widget',
        ],
      },
      {
        title: '8. TARIFS ET ABONNEMENTS',
        lines: [
          '• Starter : 39 EUR/mois (ou 468 EUR/an) — 30 devis/mois, 20 clients max',
          '• Pro : 99 EUR/mois (ou 1 188 EUR/an) — Illimite + toutes les fonctionnalites',
          '• Essai gratuit 14 jours, sans carte bancaire, resiliation a tout moment',
          '',
          '  Activer votre abonnement : https://voltpilot.fr/billing',
        ],
      },
      {
        title: '9. SUPPORT ET ASSISTANCE',
        lines: [
          'Email : voltpilotpro@gmail.com',
          'Site web : https://voltpilot.fr',
          'Reponse garantie sous 24h ouvrees',
          '',
          'Merci de faire confiance a VoltPilot — L\'equipe VoltPilot',
        ],
      },
    ],
  },

  en: {
    title: 'VoltPilot User Guide',
    subtitle: 'Your Professional Solar Quote Software',
    sections: [
      {
        title: '1. WELCOME TO VOLTPILOT',
        lines: [
          'VoltPilot is the all-in-one solution for solar panel installers.',
          'Create professional quotes in minutes, manage your clients, and run your',
          'sales pipeline from a single dashboard.',
          '',
          'Access: https://voltpilot.fr  |  14-day free trial, no credit card required',
        ],
      },
      {
        title: '2. CREATING A QUOTE',
        lines: [
          '• Go to Quotes -> New Quote',
          '• Select an existing client or create a new one',
          '• Add products from the catalog (17 pre-configured solar references)',
          '• Panels, inverters, batteries, installation — VAT auto-calculated',
          '• Add discounts, deposits, and custom payment terms',
          '• Download the PDF instantly with your company logo',
          '• Update status: Draft -> Sent -> Accepted',
        ],
      },
      {
        title: '3. CLIENT MANAGEMENT (CRM)',
        lines: [
          '• Complete client profile: name, company number, address, email, phone',
          '• Full quote history per client',
          '• Revenue tracking per client',
          '• Visual sales pipeline: Draft / Sent / Accepted',
          '• Statistics: conversion rate and revenue per client',
        ],
      },
      {
        title: '4. PRODUCT CATALOG',
        lines: [
          '• 17 pre-configured solar products ready to use',
          '• Photovoltaic panels (monocrystalline, polycrystalline)',
          '• String inverters and micro-inverters',
          '• Storage batteries and accessories',
          '• Roof-integrated or surface-mount installation',
          '• Commissioning and administrative procedures',
          '• Automatic VAT calculation',
          '• Edit prices and descriptions anytime in Catalog -> Edit',
        ],
      },
      {
        title: '5. PROFESSIONAL PDF EXPORT',
        lines: [
          '• Instantly generated PDF with your company logo',
          '• Custom header and footer with your brand colors',
          '• Client logo and installer logo on the quote',
          '• Terms and conditions included',
          '• Signature areas: installer + client with pre-filled names',
          '• A4 format, optimized for printing and email delivery',
        ],
      },
      {
        title: '6. ANALYTICS & STATISTICS',
        lines: [
          '• Dashboard: monthly revenue, conversion rate, quote count',
          '• Real-time monthly performance chart',
          '• Complete sales pipeline tracking',
          '• Client stats: revenue per client, acceptance rate',
        ],
      },
      {
        title: '7. WEBSITE WIDGET',
        lines: [
          '• Embed a quote request form on your website',
          '• Visitors fill in the form online',
          '• Requests arrive directly in your VoltPilot account',
          '• Widget customizable with your brand colors',
          '• Integration code available in Settings -> Widget',
        ],
      },
      {
        title: '8. PLANS & PRICING',
        lines: [
          '• Starter: EUR 39/month (or EUR 468/year) — 30 quotes/month, 20 clients max',
          '• Pro: EUR 99/month (or EUR 1,188/year) — Unlimited + all features',
          '• 14-day free trial, no credit card, cancel anytime',
          '',
          '  Activate your subscription: https://voltpilot.fr/billing',
        ],
      },
      {
        title: '9. SUPPORT',
        lines: [
          'Email: voltpilotpro@gmail.com',
          'Website: https://voltpilot.fr',
          'Response guaranteed within 24 business hours',
          '',
          'Thank you for choosing VoltPilot — The VoltPilot Team',
        ],
      },
    ],
  },

  de: {
    title: 'VoltPilot Benutzerhandbuch',
    subtitle: 'Ihre professionelle Solar-Angebotssoftware',
    sections: [
      {
        title: '1. WILLKOMMEN BEI VOLTPILOT',
        lines: [
          'VoltPilot ist die All-in-One-Losung fur Photovoltaik-Installateure.',
          'Erstellen Sie in wenigen Minuten professionelle Angebote, verwalten Sie Ihre',
          'Kunden und steuern Sie Ihre Vertriebspipeline von einem einzigen Dashboard.',
          '',
          'Zugang: https://voltpilot.fr  |  14 Tage kostenlos testen, keine Kreditkarte',
        ],
      },
      {
        title: '2. EIN ANGEBOT ERSTELLEN',
        lines: [
          '• Gehen Sie zu Angebote -> Neues Angebot',
          '• Wahlen Sie einen bestehenden Kunden oder erstellen Sie einen neuen',
          '• Fugen Sie Produkte aus dem Katalog hinzu (17 vorkonfigurierte Solar-Referenzen)',
          '• Panels, Wechselrichter, Batterien, Installation — Mehrwertsteuer automatisch',
          '• Rabatte, Anzahlungen und individuelle Zahlungsbedingungen hinzufugen',
          '• PDF sofort mit Ihrem Firmenlogo herunterladen',
          '• Status aktualisieren: Entwurf -> Gesendet -> Akzeptiert',
        ],
      },
      {
        title: '3. KUNDENVERWALTUNG (CRM)',
        lines: [
          '• Vollstandiges Kundenprofil: Name, Steuernummer, Adresse, E-Mail, Telefon',
          '• Vollstandiger Angebotshistorie pro Kunde',
          '• Umsatzverfolgung pro Kunde',
          '• Visuelle Vertriebspipeline: Entwurf / Gesendet / Akzeptiert',
          '• Statistiken: Konversionsrate und Umsatz pro Kunde',
        ],
      },
      {
        title: '4. PRODUKTKATALOG',
        lines: [
          '• 17 vorkonfigurierte Solarprodukte, sofort einsatzbereit',
          '• Photovoltaik-Module (monokristallin, polykristallin)',
          '• String-Wechselrichter und Mikro-Wechselrichter',
          '• Speicherbatterien und Zubehor',
          '• Dachmontage oder Aufdachmontage',
          '• Inbetriebnahme und Verwaltungsverfahren',
          '• Automatische Mehrwertsteuerberechnung',
          '• Preise jederzeit unter Katalog -> Bearbeiten andern',
        ],
      },
      {
        title: '5. PROFESSIONELLER PDF-EXPORT',
        lines: [
          '• Sofort erzeugtes PDF mit Ihrem Firmenlogo',
          '• Benutzerdefinierte Kopf- und Fusszeile mit Ihren Markenfarben',
          '• Kundenlogo und Installateur-Logo im Angebot',
          '• Allgemeine Geschaftsbedingungen enthalten',
          '• Unterschriftsfelder: Installateur + Kunde mit vorausgeulltem Namen',
          '• A4-Format, druckoptimiert und fur E-Mail-Versand geeignet',
        ],
      },
      {
        title: '6. ANALYSEN & STATISTIKEN',
        lines: [
          '• Dashboard: Monatsumsatz, Konversionsrate, Angebotsanzahl',
          '• Monatliches Leistungsdiagramm in Echtzeit',
          '• Vollstandiges Pipeline-Tracking',
          '• Kundenstatistiken: Umsatz pro Kunde, Akzeptanzrate',
        ],
      },
      {
        title: '7. WEBSITE-WIDGET',
        lines: [
          '• Angebotsanforderungsformular auf Ihrer Website einbetten',
          '• Besucher fullen das Formular online aus',
          '• Anfragen kommen direkt in Ihr VoltPilot-Konto',
          '• Widget mit Ihren Markenfarben anpassbar',
          '• Integrationscode unter Einstellungen -> Widget verfugbar',
        ],
      },
      {
        title: '8. TARIFE & ABONNEMENTS',
        lines: [
          '• Starter: 39 EUR/Monat (oder 468 EUR/Jahr) — 30 Angebote/Monat, max. 20 Kunden',
          '• Pro: 99 EUR/Monat (oder 1.188 EUR/Jahr) — Unbegrenzt + alle Funktionen',
          '• 14 Tage kostenlose Testphase, keine Kreditkarte, jederzeit kundbar',
          '',
          '  Abonnement aktivieren: https://voltpilot.fr/billing',
        ],
      },
      {
        title: '9. SUPPORT',
        lines: [
          'E-Mail: voltpilotpro@gmail.com',
          'Website: https://voltpilot.fr',
          'Antwort garantiert innerhalb von 24 Werktunden',
          '',
          'Vielen Dank, dass Sie VoltPilot gewahlt haben — Das VoltPilot-Team',
        ],
      },
    ],
  },

  es: {
    title: 'Guia de Usuario VoltPilot',
    subtitle: 'Su software profesional de presupuestos solares',
    sections: [
      {
        title: '1. BIENVENIDO A VOLTPILOT',
        lines: [
          'VoltPilot es la solucion todo en uno para instaladores de paneles solares.',
          'Cree presupuestos profesionales en minutos, gestione sus clientes y controle',
          'su canal de ventas desde un unico panel de control.',
          '',
          'Acceso: https://voltpilot.fr  |  14 dias de prueba gratuita, sin tarjeta',
        ],
      },
      {
        title: '2. CREAR UN PRESUPUESTO',
        lines: [
          '• Vaya a Presupuestos -> Nuevo presupuesto',
          '• Seleccione un cliente existente o cree uno nuevo',
          '• Anada productos del catalogo (17 referencias solares preconfiguradas)',
          '• Paneles, inversores, baterias, instalacion — IVA calculado automaticamente',
          '• Anada descuentos, anticipos y condiciones de pago personalizadas',
          '• Descargue el PDF al instante con el logotipo de su empresa',
          '• Actualice el estado: Borrador -> Enviado -> Aceptado',
        ],
      },
      {
        title: '3. GESTION DE CLIENTES (CRM)',
        lines: [
          '• Perfil completo del cliente: nombre, CIF/NIF, direccion, email, telefono',
          '• Historial completo de presupuestos por cliente',
          '• Seguimiento de ingresos por cliente',
          '• Canal de ventas visual: Borrador / Enviado / Aceptado',
          '• Estadisticas: tasa de conversion e ingresos por cliente',
        ],
      },
      {
        title: '4. CATALOGO DE PRODUCTOS',
        lines: [
          '• 17 productos solares preconfigurados y listos para usar',
          '• Paneles fotovoltaicos (monocristalino, policristalino)',
          '• Inversores string y microinversores',
          '• Baterias de almacenamiento y accesorios',
          '• Instalacion integrada o sobre cubierta',
          '• Puesta en marcha y tramites administrativos',
          '• Calculo automatico del IVA',
          '• Edite precios en cualquier momento en Catalogo -> Editar',
        ],
      },
      {
        title: '5. EXPORTACION PDF PROFESIONAL',
        lines: [
          '• PDF generado al instante con el logotipo de su empresa',
          '• Encabezado y pie de pagina personalizados con sus colores corporativos',
          '• Logo del cliente y del instalador en el presupuesto',
          '• Condiciones generales incluidas',
          '• Zonas de firma: instalador + cliente con nombre prerrellenado',
          '• Formato A4, optimizado para impresion y envio por email',
        ],
      },
      {
        title: '6. ANALITICAS Y ESTADISTICAS',
        lines: [
          '• Panel: ingresos mensuales, tasa de conversion, numero de presupuestos',
          '• Grafico de rendimiento mensual en tiempo real',
          '• Seguimiento completo del canal de ventas',
          '• Estadisticas por cliente: ingresos, tasa de aceptacion',
        ],
      },
      {
        title: '7. WIDGET PARA SITIO WEB',
        lines: [
          '• Incruste un formulario de solicitud de presupuesto en su sitio web',
          '• Los visitantes rellenan el formulario en linea',
          '• Las solicitudes llegan directamente a su cuenta VoltPilot',
          '• Widget personalizable con los colores de su marca',
          '• Codigo de integracion disponible en Configuracion -> Widget',
        ],
      },
      {
        title: '8. PLANES Y PRECIOS',
        lines: [
          '• Starter: 39 EUR/mes (o 468 EUR/ano) — 30 presupuestos/mes, max. 20 clientes',
          '• Pro: 99 EUR/mes (o 1.188 EUR/ano) — Ilimitado + todas las funciones',
          '• 14 dias de prueba gratuita, sin tarjeta de credito, cancele cuando quiera',
          '',
          '  Activar su suscripcion: https://voltpilot.fr/billing',
        ],
      },
      {
        title: '9. SOPORTE',
        lines: [
          'Email: voltpilotpro@gmail.com',
          'Sitio web: https://voltpilot.fr',
          'Respuesta garantizada en 24 horas laborables',
          '',
          'Gracias por elegir VoltPilot — El equipo VoltPilot',
        ],
      },
    ],
  },

  it: {
    title: 'Guida Utente VoltPilot',
    subtitle: 'Il tuo software professionale per preventivi solari',
    sections: [
      {
        title: '1. BENVENUTO SU VOLTPILOT',
        lines: [
          'VoltPilot e la soluzione all-in-one per gli installatori di pannelli fotovoltaici.',
          'Create preventivi professionali in pochi minuti, gestite i clienti e controllate',
          'la pipeline commerciale da un unico cruscotto.',
          '',
          'Accesso: https://voltpilot.fr  |  14 giorni di prova gratuita, senza carta',
        ],
      },
      {
        title: '2. CREARE UN PREVENTIVO',
        lines: [
          '• Andate in Preventivi -> Nuovo preventivo',
          '• Selezionate un cliente esistente o createne uno nuovo',
          '• Aggiungete prodotti dal catalogo (17 riferimenti solari preconfigurati)',
          '• Pannelli, inverter, batterie, installazione — IVA calcolata automaticamente',
          '• Aggiungete sconti, acconti e condizioni di pagamento personalizzate',
          '• Scaricate il PDF istantaneamente con il logo aziendale',
          '• Aggiornate lo stato: Bozza -> Inviato -> Accettato',
        ],
      },
      {
        title: '3. GESTIONE CLIENTI (CRM)',
        lines: [
          '• Profilo cliente completo: nome, P.IVA, indirizzo, email, telefono',
          '• Storico completo dei preventivi per cliente',
          '• Monitoraggio del fatturato per cliente',
          '• Pipeline commerciale visiva: Bozza / Inviato / Accettato',
          '• Statistiche: tasso di conversione e fatturato per cliente',
        ],
      },
      {
        title: '4. CATALOGO PRODOTTI',
        lines: [
          '• 17 prodotti solari preconfigurati e pronti all\'uso',
          '• Pannelli fotovoltaici (monocristallino, policristallino)',
          '• Inverter string e micro-inverter',
          '• Batterie di accumulo e accessori',
          '• Installazione integrata o in sovrapposizione',
          '• Messa in servizio e procedure amministrative',
          '• Calcolo automatico IVA',
          '• Modificate i prezzi in qualsiasi momento in Catalogo -> Modifica',
        ],
      },
      {
        title: '5. ESPORTAZIONE PDF PROFESSIONALE',
        lines: [
          '• PDF generato istantaneamente con il logo aziendale',
          '• Intestazione e pie di pagina personalizzati con i colori del brand',
          '• Logo cliente e logo installatore nel preventivo',
          '• Condizioni generali incluse',
          '• Aree firma: installatore + cliente con nome pre-compilato',
          '• Formato A4, ottimizzato per stampa e invio via email',
        ],
      },
      {
        title: '6. ANALITICHE E STATISTICHE',
        lines: [
          '• Dashboard: fatturato mensile, tasso di conversione, numero di preventivi',
          '• Grafico delle performance mensili in tempo reale',
          '• Tracciamento completo della pipeline',
          '• Statistiche clienti: fatturato per cliente, tasso di accettazione',
        ],
      },
      {
        title: '7. WIDGET SITO WEB',
        lines: [
          '• Incorporate un modulo di richiesta preventivo nel vostro sito web',
          '• I visitatori compilano il modulo online',
          '• Le richieste arrivano direttamente nel vostro account VoltPilot',
          '• Widget personalizzabile con i colori del vostro brand',
          '• Codice di integrazione disponibile in Impostazioni -> Widget',
        ],
      },
      {
        title: '8. PIANI E PREZZI',
        lines: [
          '• Starter: 39 EUR/mese (o 468 EUR/anno) — 30 preventivi/mese, max 20 clienti',
          '• Pro: 99 EUR/mese (o 1.188 EUR/anno) — Illimitato + tutte le funzioni',
          '• 14 giorni di prova gratuita, nessuna carta richiesta, cancellazione libera',
          '',
          '  Attiva il tuo abbonamento: https://voltpilot.fr/billing',
        ],
      },
      {
        title: '9. SUPPORTO',
        lines: [
          'Email: voltpilotpro@gmail.com',
          'Sito web: https://voltpilot.fr',
          'Risposta garantita entro 24 ore lavorative',
          '',
          'Grazie per aver scelto VoltPilot — Il team VoltPilot',
        ],
      },
    ],
  },

  nl: {
    title: 'VoltPilot Gebruikshandleiding',
    subtitle: 'Uw professionele software voor zonne-energie offertes',
    sections: [
      {
        title: '1. WELKOM BIJ VOLTPILOT',
        lines: [
          'VoltPilot is de alles-in-een oplossing voor zonnepaneel installateurs.',
          'Maak in enkele minuten professionele offertes, beheer uw klanten en stuur',
          'uw verkooppipeline aan vanuit een enkel dashboard.',
          '',
          'Toegang: https://voltpilot.fr  |  14 dagen gratis, geen creditcard vereist',
        ],
      },
      {
        title: '2. EEN OFFERTE MAKEN',
        lines: [
          '• Ga naar Offertes -> Nieuwe offerte',
          '• Selecteer een bestaande klant of maak een nieuwe aan',
          '• Voeg producten toe uit de catalogus (17 vooraf geconfigureerde referenties)',
          '• Panelen, omvormers, batterijen, installatie — BTW automatisch berekend',
          '• Voeg kortingen, aanbetalingen en aangepaste betalingsvoorwaarden toe',
          '• Download de PDF direct met uw bedrijfslogo',
          '• Werk de status bij: Concept -> Verzonden -> Geaccepteerd',
        ],
      },
      {
        title: '3. KLANTBEHEER (CRM)',
        lines: [
          '• Volledig klantprofiel: naam, KvK-nummer, adres, e-mail, telefoon',
          '• Volledige offerteverleden per klant',
          '• Omzettracking per klant',
          '• Visuele verkooppipeline: Concept / Verzonden / Geaccepteerd',
          '• Statistieken: conversiepercentage en omzet per klant',
        ],
      },
      {
        title: '4. PRODUCTCATALOGUS',
        lines: [
          '• 17 vooraf geconfigureerde zonne-energieproducten',
          '• Fotovoltaische panelen (monokristallijn, polykristallijn)',
          '• String-omvormers en micro-omvormers',
          '• Opslagbatterijen en accessoires',
          '• Dakmontage of opbouwmontage',
          '• Inbedrijfstelling en administratieve procedures',
          '• Automatische BTW-berekening',
          '• Pas prijzen aan in Catalogus -> Bewerken',
        ],
      },
      {
        title: '5. PROFESSIONELE PDF-EXPORT',
        lines: [
          '• Direct gegenereerde PDF met uw bedrijfslogo',
          '• Aangepaste kop- en voettekst met uw merkkleur',
          '• Klantlogo en installateur-logo in de offerte',
          '• Algemene voorwaarden inbegrepen',
          '• Handtekeningvelden: installateur + klant met vooraf ingevulde namen',
          '• A4-formaat, drukklaar en geschikt voor e-mailverzending',
        ],
      },
      {
        title: '6. ANALYSES EN STATISTIEKEN',
        lines: [
          '• Dashboard: maandelijkse omzet, conversiepercentage, aantal offertes',
          '• Maandelijks prestatiegrafiek in realtime',
          '• Volledig pipeline-tracking',
          '• Klantstatistieken: omzet per klant, acceptatiepercentage',
        ],
      },
      {
        title: '7. WEBSITE-WIDGET',
        lines: [
          '• Integreer een offerteaanvraagformulier op uw website',
          '• Bezoekers vullen het formulier online in',
          '• Aanvragen komen direct in uw VoltPilot-account',
          '• Widget aanpasbaar met uw merkkleur',
          '• Integratiecode beschikbaar in Instellingen -> Widget',
        ],
      },
      {
        title: '8. ABONNEMENTEN EN PRIJZEN',
        lines: [
          '• Starter: EUR 39/maand (of EUR 468/jaar) — 30 offertes/maand, max 20 klanten',
          '• Pro: EUR 99/maand (of EUR 1.188/jaar) — Onbeperkt + alle functies',
          '• 14 dagen gratis proberen, geen creditcard, opzegbaar op elk moment',
          '',
          '  Activeer uw abonnement: https://voltpilot.fr/billing',
        ],
      },
      {
        title: '9. ONDERSTEUNING',
        lines: [
          'E-mail: voltpilotpro@gmail.com',
          'Website: https://voltpilot.fr',
          'Reactie gegarandeerd binnen 24 werkuren',
          '',
          'Bedankt dat u voor VoltPilot heeft gekozen — Het VoltPilot-team',
        ],
      },
    ],
  },

  pt: {
    title: 'Guia do Utilizador VoltPilot',
    subtitle: 'O seu software profissional de orcamentos solares',
    sections: [
      {
        title: '1. BEM-VINDO AO VOLTPILOT',
        lines: [
          'O VoltPilot e a solucao completa para instaladores de paineis solares.',
          'Crie orcamentos profissionais em minutos, gira os seus clientes e controle',
          'o pipeline de vendas a partir de um unico painel de controlo.',
          '',
          'Acesso: https://voltpilot.fr  |  14 dias de avaliacao gratuita, sem cartao',
        ],
      },
      {
        title: '2. CRIAR UM ORCAMENTO',
        lines: [
          '• Va a Orcamentos -> Novo orcamento',
          '• Selecione um cliente existente ou crie um novo',
          '• Adicione produtos do catalogo (17 referencias solares pre-configuradas)',
          '• Paineis, inversores, baterias, instalacao — IVA calculado automaticamente',
          '• Adicione descontos, adiantamentos e condicoes de pagamento personalizadas',
          '• Transfira o PDF imediatamente com o logotipo da sua empresa',
          '• Atualize o estado: Rascunho -> Enviado -> Aceite',
        ],
      },
      {
        title: '3. GESTAO DE CLIENTES (CRM)',
        lines: [
          '• Perfil completo do cliente: nome, NIF, morada, email, telefone',
          '• Historial completo de orcamentos por cliente',
          '• Acompanhamento de receitas por cliente',
          '• Pipeline de vendas visual: Rascunho / Enviado / Aceite',
          '• Estatisticas: taxa de conversao e receitas por cliente',
        ],
      },
      {
        title: '4. CATALOGO DE PRODUTOS',
        lines: [
          '• 17 produtos solares pre-configurados e prontos a usar',
          '• Paineis fotovoltaicos (monocristalino, policristalino)',
          '• Inversores de string e micro-inversores',
          '• Baterias de armazenamento e acessorios',
          '• Instalacao integrada ou sobreposta',
          '• Colocacao em servico e procedimentos administrativos',
          '• Calculo automatico de IVA',
          '• Edite precos a qualquer momento em Catalogo -> Editar',
        ],
      },
      {
        title: '5. EXPORTACAO PDF PROFISSIONAL',
        lines: [
          '• PDF gerado instantaneamente com o logotipo da sua empresa',
          '• Cabecalho e rodape personalizados com as suas cores de marca',
          '• Logotipo do cliente e do instalador no orcamento',
          '• Condicoes gerais incluidas',
          '• Areas de assinatura: instalador + cliente com nome pre-preenchido',
          '• Formato A4, otimizado para impressao e envio por email',
        ],
      },
      {
        title: '6. ANALISES E ESTATISTICAS',
        lines: [
          '• Painel: receita mensal, taxa de conversao, numero de orcamentos',
          '• Grafico de desempenho mensal em tempo real',
          '• Acompanhamento completo da pipeline de vendas',
          '• Estatisticas de clientes: receita por cliente, taxa de aceitacao',
        ],
      },
      {
        title: '7. WIDGET PARA SITE WEB',
        lines: [
          '• Incorpore um formulario de pedido de orcamento no seu site web',
          '• Os visitantes preenchem o formulario online',
          '• Os pedidos chegam diretamente a sua conta VoltPilot',
          '• Widget personalizavel com as cores da sua marca',
          '• Codigo de integracao disponivel em Definicoes -> Widget',
        ],
      },
      {
        title: '8. PLANOS E PRECOS',
        lines: [
          '• Starter: 39 EUR/mes (ou 468 EUR/ano) — 30 orcamentos/mes, max 20 clientes',
          '• Pro: 99 EUR/mes (ou 1.188 EUR/ano) — Ilimitado + todas as funcionalidades',
          '• 14 dias de avaliacao gratuita, sem cartao de credito, cancele quando quiser',
          '',
          '  Ativar a sua subscricao: https://voltpilot.fr/billing',
        ],
      },
      {
        title: '9. SUPORTE',
        lines: [
          'Email: voltpilotpro@gmail.com',
          'Site web: https://voltpilot.fr',
          'Resposta garantida em 24 horas uteis',
          '',
          'Obrigado por escolher o VoltPilot — A equipa VoltPilot',
        ],
      },
    ],
  },
}

const BRAND_PURPLE = [88, 56, 237] as const
const BRAND_LIGHT = [245, 243, 255] as const

function addPageHeader(doc: jsPDF, subtitle: string) {
  doc.setFillColor(...BRAND_PURPLE)
  doc.rect(0, 0, 210, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.text('VoltPilot', 15, 13)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(subtitle, 15, 21)
  // Yellow accent dot
  doc.setFillColor(250, 204, 21)
  doc.circle(200, 7, 3, 'F')
}

function addPageFooter(doc: jsPDF, page: number, total: number) {
  doc.setFillColor(...BRAND_LIGHT)
  doc.rect(0, 283, 210, 14, 'F')
  doc.setTextColor(120, 120, 120)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text('voltpilot.fr', 15, 291)
  doc.text('voltpilotpro@gmail.com', 80, 291)
  doc.text(`${page} / ${total}`, 190, 291)
}

export function generateGuidePDF(pays: string): Buffer {
  const lang = languageFromPays(pays)
  const guide = GUIDES[lang] ?? GUIDES['en']

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  const W = 210
  const M = 15
  const maxW = W - M * 2

  // ── PAGE 1: cover ─────────────────────────────────────────────
  doc.setFillColor(...BRAND_PURPLE)
  doc.rect(0, 0, W, 80, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.text('VoltPilot', M, 28)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(13)
  doc.text(guide.subtitle, M, 40)

  // Decorative elements
  doc.setFillColor(250, 204, 21)
  doc.circle(185, 20, 12, 'F')
  doc.setFillColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('VP', 178, 25)

  doc.setFillColor(...BRAND_LIGHT)
  doc.rect(0, 80, W, 5, 'F')

  doc.setTextColor(30, 30, 30)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(guide.title, M, 100)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(80, 80, 80)
  doc.text('https://voltpilot.fr', M, 113)
  doc.text('voltpilotpro@gmail.com', M, 121)

  // Features summary box
  doc.setFillColor(...BRAND_LIGHT)
  doc.roundedRect(M, 135, maxW, 85, 3, 3, 'F')
  doc.setDrawColor(...BRAND_PURPLE)
  doc.setLineWidth(0.5)
  doc.roundedRect(M, 135, maxW, 85, 3, 3, 'S')

  doc.setTextColor(...BRAND_PURPLE)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  const featTitle = lang === 'fr' ? 'Ce que vous allez decouvrir :' :
    lang === 'de' ? 'Was Sie entdecken werden:' :
    lang === 'es' ? 'Lo que va a descubrir:' :
    lang === 'it' ? 'Cosa scoprirete:' :
    lang === 'nl' ? 'Wat u gaat ontdekken:' :
    lang === 'pt' ? 'O que vai descobrir:' :
    'What you will discover:'
  doc.text(featTitle, M + 6, 147)

  const features = lang === 'fr'
    ? ['Creation de devis professionnels en quelques minutes',
        'Catalogue de 17 produits solaires pre-configures',
        'Gestion CRM de vos clients et pipeline commercial',
        'Export PDF professionnel a votre logo et signature',
        'Analytics : CA, taux de conversion, statistiques',
        'Widget site web pour capturer des leads',
        'Abonnement Starter et Pro — Essai gratuit 14 jours']
    : lang === 'de'
    ? ['Professionelle Angebotserstellung in Minuten',
        'Katalog mit 17 vorkonfigurierten Solarprodukten',
        'CRM-Kundenverwaltung und Vertriebspipeline',
        'Professioneller PDF-Export mit Ihrem Logo',
        'Analytics: Umsatz, Konversionsrate, Statistiken',
        'Website-Widget zur Lead-Erfassung',
        'Starter und Pro-Abonnement — 14 Tage kostenlos']
    : lang === 'es'
    ? ['Creacion de presupuestos profesionales en minutos',
        'Catalogo de 17 productos solares preconfigurados',
        'Gestion CRM de clientes y canal de ventas',
        'Exportacion PDF profesional con su logo y firma',
        'Analiticas: ingresos, tasa de conversion, estadisticas',
        'Widget web para capturar clientes potenciales',
        'Suscripcion Starter y Pro — Prueba gratuita 14 dias']
    : lang === 'it'
    ? ['Creazione di preventivi professionali in pochi minuti',
        'Catalogo di 17 prodotti solari preconfigurati',
        'Gestione CRM clienti e pipeline commerciale',
        'Esportazione PDF professionale con il vostro logo',
        'Analitiche: fatturato, tasso di conversione, statistiche',
        'Widget sito web per acquisire contatti',
        'Abbonamento Starter e Pro — 14 giorni gratuiti']
    : lang === 'nl'
    ? ['Professionele offertes maken in minuten',
        'Catalogus van 17 vooraf geconfigureerde producten',
        'CRM-klantbeheer en verkooppipeline',
        'Professionele PDF-export met uw logo en handtekening',
        'Analyses: omzet, conversiepercentage, statistieken',
        'Website-widget voor leadgeneratie',
        'Starter en Pro-abonnement — 14 dagen gratis']
    : lang === 'pt'
    ? ['Criacao de orcamentos profissionais em minutos',
        'Catalogo de 17 produtos solares pre-configurados',
        'Gestao CRM de clientes e pipeline de vendas',
        'Exportacao PDF profissional com o seu logotipo',
        'Analises: receitas, taxa de conversao, estatisticas',
        'Widget web para captar contactos',
        'Subscricao Starter e Pro — 14 dias gratuitos']
    : ['Professional quote creation in minutes',
        'Catalog of 17 pre-configured solar products',
        'CRM client management and sales pipeline',
        'Professional PDF export with your logo and signature',
        'Analytics: revenue, conversion rate, statistics',
        'Website widget to capture leads',
        'Starter and Pro subscription — 14-day free trial']

  doc.setTextColor(50, 50, 50)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  let fy = 157
  for (const feat of features) {
    doc.setTextColor(...BRAND_PURPLE)
    doc.text('✓', M + 6, fy)
    doc.setTextColor(50, 50, 50)
    doc.text(feat, M + 13, fy)
    fy += 8
  }

  // ── CONTENT PAGES ─────────────────────────────────────────────
  doc.addPage()
  addPageHeader(doc, guide.subtitle)

  let y = 38

  for (const section of guide.sections) {
    if (y > 256) {
      doc.addPage()
      addPageHeader(doc, guide.subtitle)
      y = 38
    }

    // Section header background
    doc.setFillColor(...BRAND_LIGHT)
    doc.rect(M - 2, y - 5, maxW + 4, 8, 'F')
    doc.setDrawColor(...BRAND_PURPLE)
    doc.setLineWidth(0.3)
    doc.line(M - 2, y - 5, M - 2, y + 3) // left accent line

    doc.setTextColor(...BRAND_PURPLE)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(section.title, M + 2, y)
    y += 9

    // Section lines
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(50, 50, 50)
    doc.setDrawColor(200, 200, 200)
    doc.setLineWidth(0)

    for (const line of section.lines) {
      if (y > 272) {
        doc.addPage()
        addPageHeader(doc, guide.subtitle)
        y = 38
      }

      if (line === '') {
        y += 2
        continue
      }

      const isIndented = line.startsWith('•')
      const textX = isIndented ? M + 4 : M
      const textW = isIndented ? maxW - 4 : maxW

      const wrapped = doc.splitTextToSize(line, textW)
      doc.text(wrapped, textX, y)
      y += wrapped.length * 5
    }

    y += 5 // section gap
  }

  // Add footers to all pages
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const total = (doc.internal as any).getNumberOfPages() as number
  for (let p = 1; p <= total; p++) {
    doc.setPage(p)
    addPageFooter(doc, p, total)
  }

  return Buffer.from(doc.output('arraybuffer'))
}
