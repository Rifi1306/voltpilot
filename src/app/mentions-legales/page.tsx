import Link from 'next/link'

export const metadata = {
  title: 'Mentions légales — VoltPilot',
}

export default function MentionsLegales() {
  return (
    <div className="min-h-screen" style={{ background: '#060912', color: 'rgba(255,255,255,0.8)', fontFamily: 'var(--font-geist-sans)' }}>
      <div className="max-w-3xl mx-auto px-8 py-16">
        <Link href="/" className="text-sm hover:text-white transition-colors mb-8 inline-block" style={{ color: 'rgba(255,255,255,0.35)' }}>
          ← Retour à l'accueil
        </Link>

        <h1 className="text-4xl font-black text-white mb-2" style={{ letterSpacing: '-0.03em' }}>Mentions légales</h1>
        <p className="mb-12" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>Dernière mise à jour : juin 2025</p>

        <div className="space-y-10" style={{ lineHeight: '1.7' }}>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">1. Éditeur du site</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)' }}>
              Le site <strong className="text-white">voltpilot.fr</strong> est édité par :<br /><br />
              <strong className="text-white">[À COMPLÉTER — Raison sociale]</strong><br />
              [À COMPLÉTER — Forme juridique (SARL, SAS, auto-entrepreneur…)]<br />
              Capital social : [À COMPLÉTER] €<br />
              Siège social : [À COMPLÉTER — adresse complète]<br />
              SIRET : [À COMPLÉTER]<br />
              RCS : [À COMPLÉTER]<br />
              N° TVA intracommunautaire : [À COMPLÉTER]<br /><br />
              Email : <a href="mailto:contact@voltpilot.fr" style={{ color: '#F5A623' }}>contact@voltpilot.fr</a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">2. Directeur de la publication</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)' }}>
              [À COMPLÉTER — Nom et prénom du directeur de publication]
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">3. Hébergement</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)' }}>
              Ce site est hébergé par :<br /><br />
              <strong className="text-white">Vercel Inc.</strong><br />
              440 N Barranca Ave #4133, Covina, CA 91723, États-Unis<br />
              Site web : <span style={{ color: 'rgba(255,255,255,0.4)' }}>vercel.com</span>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">4. Propriété intellectuelle</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)' }}>
              L'ensemble des contenus présents sur le site voltpilot.fr (textes, images, logos, graphismes, code source) est protégé par le droit d'auteur et reste la propriété exclusive de VoltPilot. Toute reproduction, même partielle, est interdite sans autorisation préalable écrite.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">5. Données personnelles</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)' }}>
              Pour toute information relative au traitement de vos données personnelles, veuillez consulter notre{' '}
              <Link href="/politique-confidentialite" style={{ color: '#F5A623' }}>Politique de confidentialité</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">6. Cookies</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)' }}>
              Le site utilise des cookies techniques nécessaires au fonctionnement du service d'authentification. Aucun cookie publicitaire ou de tracking tiers n'est utilisé sans votre consentement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">7. Contact</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)' }}>
              Pour toute question relative aux présentes mentions légales :<br />
              <a href="mailto:contact@voltpilot.fr" style={{ color: '#F5A623' }}>contact@voltpilot.fr</a>
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
