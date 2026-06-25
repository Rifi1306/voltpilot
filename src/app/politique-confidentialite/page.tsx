import Link from 'next/link'

export const metadata = {
  title: 'Politique de confidentialité — VoltPilot',
}

export default function PolitiqueConfidentialite() {
  return (
    <div className="min-h-screen" style={{ background: '#060912', color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-geist-sans)' }}>
      <div className="max-w-3xl mx-auto px-8 py-16">
        <Link href="/" className="text-sm hover:text-white transition-colors mb-8 inline-block" style={{ color: 'rgba(255,255,255,0.35)' }}>
          ← Retour à l'accueil
        </Link>

        <h1 className="text-4xl font-black text-white mb-2" style={{ letterSpacing: '-0.03em' }}>Politique de confidentialité</h1>
        <p className="mb-12" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>Dernière mise à jour : juin 2025</p>

        <div className="space-y-10" style={{ lineHeight: '1.7' }}>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">1. Responsable du traitement</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)' }}>
              Le responsable du traitement des données personnelles est :<br /><br />
              <strong className="text-white">[À COMPLÉTER — Raison sociale]</strong><br />
              [À COMPLÉTER — Adresse du siège social]<br />
              Email : <a href="mailto:contact@voltpilot.fr" style={{ color: '#F5A623' }}>contact@voltpilot.fr</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">2. Données collectées</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)' }}>
              Dans le cadre de l'utilisation de VoltPilot, nous collectons les données suivantes :<br /><br />
              <strong className="text-white">Données de compte :</strong> adresse email, nom de l'entreprise, mot de passe (haché).<br /><br />
              <strong className="text-white">Données métier :</strong> informations clients (nom, email, téléphone, SIRET), devis, dossiers, et toutes données saisies par l'utilisateur dans l'application.<br /><br />
              <strong className="text-white">Données techniques :</strong> adresse IP, navigateur, logs de connexion, données de session (cookie d'authentification).<br /><br />
              <strong className="text-white">Données widget :</strong> pour les leads générés via le widget public (nom, email, téléphone, description du projet), avec consentement explicite du prospect.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">3. Finalités du traitement</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)' }}>
              Vos données sont utilisées pour :<br /><br />
              — Fournir et améliorer le service VoltPilot<br />
              — Gérer votre compte et vos abonnements<br />
              — Envoyer les notifications liées au service (leads, devis)<br />
              — Assurer la sécurité et prévenir les abus<br />
              — Respecter nos obligations légales et comptables
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">4. Base légale</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)' }}>
              Les traitements reposent sur :<br /><br />
              — <strong className="text-white">L'exécution du contrat</strong> : pour la fourniture du service<br />
              — <strong className="text-white">Le consentement</strong> : pour les données prospects collectées via le widget<br />
              — <strong className="text-white">L'intérêt légitime</strong> : pour la sécurité et l'amélioration du service<br />
              — <strong className="text-white">L'obligation légale</strong> : pour la facturation et la comptabilité
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">5. Destinataires des données</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)' }}>
              Vos données peuvent être transmises aux sous-traitants suivants dans le cadre strict de la fourniture du service :<br /><br />
              — <strong className="text-white">Supabase</strong> (base de données et authentification) — États-Unis<br />
              — <strong className="text-white">Vercel</strong> (hébergement) — États-Unis<br />
              — <strong className="text-white">Stripe</strong> (paiement) — États-Unis<br />
              — <strong className="text-white">Resend</strong> (envoi d'emails transactionnels) — États-Unis<br /><br />
              Ces sous-traitants sont soumis à des garanties appropriées (clauses contractuelles types UE ou certification Privacy Shield/DPF).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">6. Durée de conservation</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)' }}>
              — Données de compte : durée de l'abonnement + 30 jours après résiliation<br />
              — Données de facturation : 10 ans (obligation légale comptable)<br />
              — Données prospects (leads widget) : 3 ans à compter de la collecte<br />
              — Logs techniques : 12 mois
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">7. Vos droits</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)' }}>
              Conformément au RGPD (Règlement UE 2016/679), vous disposez des droits suivants :<br /><br />
              — <strong className="text-white">Droit d'accès</strong> à vos données personnelles<br />
              — <strong className="text-white">Droit de rectification</strong> des données inexactes<br />
              — <strong className="text-white">Droit à l'effacement</strong> (« droit à l'oubli »)<br />
              — <strong className="text-white">Droit à la portabilité</strong> de vos données<br />
              — <strong className="text-white">Droit d'opposition</strong> au traitement<br />
              — <strong className="text-white">Droit à la limitation</strong> du traitement<br /><br />
              Pour exercer ces droits, contactez-nous à :<br />
              <a href="mailto:contact@voltpilot.fr" style={{ color: '#F5A623' }}>contact@voltpilot.fr</a><br /><br />
              Vous pouvez également introduire une réclamation auprès de la CNIL : <span style={{ color: 'rgba(255,255,255,0.4)' }}>cnil.fr</span>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">8. Cookies</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)' }}>
              VoltPilot utilise uniquement des cookies techniques nécessaires au fonctionnement de l'authentification (cookie de session Supabase). Ces cookies ne nécessitent pas de consentement au titre de l'article 82 de la loi Informatique et Libertés.<br /><br />
              Aucun cookie publicitaire ou de tracking tiers n'est déposé.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">9. Sécurité</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)' }}>
              Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données : chiffrement des communications (HTTPS/TLS), hachage des mots de passe, accès aux données restreint par Row Level Security (RLS) Supabase, et accès limité au personnel autorisé.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">10. Modifications</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)' }}>
              Cette politique peut être mise à jour. En cas de modification substantielle, les utilisateurs seront notifiés par email. La version en vigueur est toujours accessible sur cette page.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
