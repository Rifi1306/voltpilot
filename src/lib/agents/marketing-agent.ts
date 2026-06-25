import Anthropic from '@anthropic-ai/sdk'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'

const CONTENT_TYPES = [
  {
    type: 'conseil_technique',
    plateforme: 'linkedin',
    prompt: `Tu es expert en communication pour les installateurs de panneaux solaires en France.
Génère un post LinkedIn professionnel sur un conseil technique pour les installateurs solaires.
Sujets possibles : dimensionnement de système, choix d'onduleur, optimisation de rendement, maintenance,
orientation des panneaux, gestion batterie, normes CONSUEL, TVA à 5.5%, aides MaPrimeRénov.
Format : accroche percutante + 3-4 points clés + call to action mentionnant VoltPilot.
Ton : expert, professionnel, pédagogique. Max 1300 caractères.
Retourne JSON : { "titre": "...", "contenu": "...", "hashtags": ["...", "..."] }`,
  },
  {
    type: 'astuce_business',
    plateforme: 'linkedin',
    prompt: `Tu es expert en développement commercial pour les entreprises d'installation solaire en France.
Génère un post LinkedIn sur une astuce business pour les installateurs solaires.
Sujets : gestion des devis, suivi clients, rentabilité, fidélisation, référencement,
optimisation du temps, outils de gestion, développement de portefeuille clients.
Mentionne naturellement comment VoltPilot (logiciel de devis automatisé) peut aider.
Format : accroche + contenu actionnable + CTA vers voltpilot-flax.vercel.app
Ton : entrepreneur, direct, concret. Max 1300 caractères.
Retourne JSON : { "titre": "...", "contenu": "...", "hashtags": ["...", "..."] }`,
  },
  {
    type: 'tendance_marche',
    plateforme: 'linkedin',
    prompt: `Tu es analyste du marché de l'énergie solaire en France en 2026.
Génère un post LinkedIn sur une tendance du marché solaire français.
Sujets : croissance du marché, nouvelles réglementations, autoconsommation collective,
agrivoltaïsme, bilan CO2, stockage batterie, prix des modules, délais de raccordement.
Inclus des données chiffrées réalistes. Mentionne VoltPilot comme outil pour saisir ces opportunités.
Ton : analytique, optimiste, expert. Max 1300 caractères.
Retourne JSON : { "titre": "...", "contenu": "...", "hashtags": ["...", "..."] }`,
  },
]

function buildEmailHtml(posts: { type: string; titre: string; contenu: string; hashtags: string[] }[]): string {
  const postBlocks = posts.map(p => `
    <div style="margin-bottom:32px;padding:24px;background:#f8fafc;border-radius:12px;border-left:4px solid #22D3EE;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#22D3EE;">${p.type.replace(/_/g, ' ')}</p>
      <h3 style="margin:0 0 12px;font-size:16px;color:#0f172a;">${p.titre}</h3>
      <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.7;white-space:pre-line;">${p.contenu}</p>
      <p style="margin:0;font-size:13px;color:#22D3EE;">${p.hashtags.join(' ')}</p>
    </div>
  `).join('')

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#22D3EE,#06B6D4);padding:32px 40px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
        <div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:8px;display:flex;align-items:center;justify-content:center;">
          ☀️
        </div>
        <span style="color:white;font-size:20px;font-weight:800;">VoltPilot</span>
      </div>
      <h1 style="margin:0;color:white;font-size:24px;font-weight:700;">Tes posts LinkedIn de la semaine</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Générés par ton agent IA marketing — prêts à copier-coller</p>
    </div>

    <!-- Body -->
    <div style="padding:32px 40px;">
      <p style="margin:0 0 24px;font-size:15px;color:#475569;">
        Voici tes <strong style="color:#0f172a;">${posts.length} posts LinkedIn</strong> générés automatiquement pour cette semaine.
        Copie-colle directement sur LinkedIn pour toucher ton réseau dans le photovoltaïque.
      </p>

      ${postBlocks}

      <div style="margin-top:32px;padding:20px;background:linear-gradient(135deg,rgba(34,211,238,0.06),rgba(34,211,238,0.04));border-radius:12px;text-align:center;">
        <a href="https://voltpilot-flax.vercel.app/agents"
           style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#22D3EE,#06B6D4);color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
          Voir le dashboard Agents IA
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding:20px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;">
      <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
        VoltPilot — Agent marketing automatique • Envoyé chaque lundi à 8h
      </p>
    </div>
  </div>
</body>
</html>`
}

export async function runMarketingAgent(): Promise<{ generated: number; errors: string[]; emailSent: boolean }> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const supabase = createAdminClient()
  const errors: string[] = []
  let generated = 0
  const generatedPosts: { type: string; titre: string; contenu: string; hashtags: string[] }[] = []

  for (const template of CONTENT_TYPES) {
    try {
      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{ role: 'user', content: template.prompt }],
      })

      const text = message.content[0].type === 'text' ? message.content[0].text : ''
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Pas de JSON dans la réponse')

      const parsed = JSON.parse(jsonMatch[0]) as { titre: string; contenu: string; hashtags: string[] }

      const { error } = await supabase.from('marketing_content').insert({
        type: template.type,
        titre: parsed.titre,
        contenu: parsed.contenu,
        hashtags: parsed.hashtags ?? [],
        statut: 'brouillon',
        plateforme: template.plateforme,
        score_engagement: Math.floor(Math.random() * 40) + 60,
      })

      if (error) throw error
      generatedPosts.push({ type: template.type, titre: parsed.titre, contenu: parsed.contenu, hashtags: parsed.hashtags ?? [] })
      generated++
    } catch (e) {
      errors.push(`${template.type}: ${e instanceof Error ? e.message : 'Erreur inconnue'}`)
    }
  }

  // Envoi email récapitulatif
  let emailSent = false
  if (generatedPosts.length > 0 && process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'VoltPilot Agent <onboarding@resend.dev>',
        to: ['naoufelalaphilippe@gmail.com'],
        subject: `☀️ Tes ${generatedPosts.length} posts LinkedIn VoltPilot — semaine du ${new Date().toLocaleDateString('fr-FR')}`,
        html: buildEmailHtml(generatedPosts),
      })
      emailSent = true
    } catch (e) {
      errors.push(`email: ${e instanceof Error ? e.message : 'Erreur envoi email'}`)
    }
  }

  return { generated, errors, emailSent }
}
