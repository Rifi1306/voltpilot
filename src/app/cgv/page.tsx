import Link from 'next/link'

export const metadata = {
  title: 'Conditions Générales de Vente — VoltPilot',
}

export default function CGV() {
  return (
    <div className="min-h-screen" style={{ background: '#060912', color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-geist-sans)' }}>
      <div className="max-w-3xl mx-auto px-8 py-16">
        <Link href="/" className="text-sm hover:text-white transition-colors mb-8 inline-block" style={{ color: 'rgba(255,255,255,0.35)' }}>
          ← Retour à l'accueil
        </Link>

        <h1 className="text-4xl font-black text-white mb-2" style={{ letterSpacing: '-0.03em' }}>Conditions Générales de Vente</h1>
        <p className="mb-12" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>Dernière mise à jour : juin 2025</p>

        <div className="space-y-10" style={{ lineHeight: '1.7' }}>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">1. Objet</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)' }}>
              Les présentes Conditions Générales de Vente (CGV) régissent la relation contractuelle entre VoltPilot ([À COMPLÉTER — raison sociale complète]) et tout professionnel (ci-après « le Client ») souscrivant à un abonnement VoltPilot via le site voltpilot.fr.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">2. Description du service</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)' }}>
              VoltPilot est un logiciel SaaS (Software as a Service) de création et gestion de devis destiné aux installateurs de panneaux photovoltaïques. Le service est accessible en ligne via un navigateur web, sans installation logicielle.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">3. Tarifs et abonnements</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)' }}>
              Les tarifs en vigueur sont affichés sur la page <Link href="/#tarifs" style={{ color: '#F5A623' }}>Tarifs</Link> du site. VoltPilot propose :<br /><br />
              — Un <strong className="text-white">essai gratuit de 14 jours</strong> sans engagement ni carte bancaire requise.<br />
              — Des abonnements mensuels ou annuels selon les plans disponibles.<br /><br />
              Tous les prix sont indiqués en euros (€) hors taxes (HT). La TVA applicable est celle en vigueur au jour de la facturation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">4. Paiement</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)' }}>
              Le paiement est effectué via la plateforme sécurisée Stripe. VoltPilot ne stocke aucune donnée bancaire. L'abonnement est renouvelé automatiquement à chaque échéance sauf résiliation par le Client.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">5. Droit de rétractation</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)' }}>
              Conformément à l'article L.221-28 du Code de la consommation, le droit de rétractation ne s'applique pas aux contrats de fourniture de contenu numérique non fourni sur support matériel dont l'exécution a commencé avec l'accord du consommateur.<br /><br />
              [À COMPLÉTER — préciser les conditions de remboursement éventuelles si votre politique le prévoit]
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">6. Résiliation</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)' }}>
              Le Client peut résilier son abonnement à tout moment depuis son espace paramètres. La résiliation prend effet à la fin de la période d'abonnement en cours. Aucun remboursement au prorata n'est effectué sauf mention contraire.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">7. Disponibilité du service</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)' }}>
              VoltPilot s'engage à maintenir le service disponible 24h/24 et 7j/7, sous réserve des opérations de maintenance. En cas d'interruption planifiée, les Clients seront prévenus dans les meilleurs délais. VoltPilot ne pourra être tenu responsable des interruptions dues à des cas de force majeure ou à des défaillances de tiers (hébergeur, opérateur télécom).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">8. Propriété des données</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)' }}>
              Le Client reste propriétaire de l'ensemble de ses données (clients, devis, documents). VoltPilot ne vend ni ne transmet ces données à des tiers. En cas de résiliation, le Client peut exporter ses données dans un délai de 30 jours.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">9. Responsabilité</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)' }}>
              VoltPilot est un outil d'aide à la création de devis. Il appartient au Client de vérifier l'exactitude des informations, prix et mentions légales figurant dans ses documents commerciaux. VoltPilot ne saurait être tenu responsable des erreurs ou omissions dans les devis émis par le Client.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">10. Droit applicable et litiges</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)' }}>
              Les présentes CGV sont soumises au droit français. En cas de litige, les parties s'engagent à rechercher une solution amiable avant tout recours judiciaire. À défaut, le tribunal compétent sera celui du siège social de VoltPilot ([À COMPLÉTER — ville]).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">11. Contact</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)' }}>
              Pour toute question relative aux présentes CGV :<br />
              <a href="mailto:contact@voltpilot.fr" style={{ color: '#F5A623' }}>contact@voltpilot.fr</a>
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
