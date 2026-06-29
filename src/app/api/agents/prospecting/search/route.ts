import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = import('@supabase/supabase-js').SupabaseClient<any>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function table(supabase: AnyClient, name: string) { return (supabase as any).from(name) }

// ── Sources ──────────────────────────────────────────────────
const ADEME_BASE = 'https://data.ademe.fr/data-fair/api/v1/datasets/liste-des-entreprises-rge-2/lines'
const OVERPASS_API = 'https://overpass-api.de/api/interpreter'

const ADEME_QUERIES = ['photovoltaique', 'solaire panneaux', 'QualiPV', 'installation solaire', 'énergie solaire']

// Bounding boxes [minLat, minLon, maxLat, maxLon] per country
const COUNTRY_BBOX: Record<string, [number, number, number, number]> = {
  BE: [49.49, 2.55, 51.51, 6.41],
  CH: [45.82, 5.96, 47.81, 10.49],
  LU: [49.44, 5.73, 50.18, 6.53],
  DE: [47.27, 5.87, 55.06, 15.04],
  ES: [35.95, -9.39, 43.75, 4.33],
  IT: [35.49, 6.61, 47.09, 18.52],
  NL: [50.75, 3.36, 53.59, 7.23],
  PT: [36.97, -9.53, 42.15, -6.19],
  GB: [49.90, -8.10, 60.86, 1.77],
  US: [24.52, -124.77, 49.38, -66.95],
  CA: [41.67, -141.00, 83.11, -52.63],
  AU: [-43.64, 113.34, -10.67, 153.57],
  UAE: [22.63, 51.58, 26.08, 56.40],
  MA: [27.66, -13.17, 35.92, -0.99],
  ZA: [-34.82, 16.48, -22.13, 32.89],
  MX: [14.53, -117.13, 32.72, -86.72],
  BR: [-33.75, -73.99, 5.27, -28.85],
  JP: [24.04, 122.93, 45.55, 153.99],
  KR: [33.11, 124.60, 38.61, 130.92],
  IN: [6.74, 68.16, 37.08, 97.40],
  SG: [1.16, 103.60, 1.47, 104.09],
  TH: [5.61, 97.34, 20.46, 105.65],
}

const COUNTRY_LANG: Record<string, { label: string; query: string }> = {
  BE: { label: 'Belgique', query: 'installateur panneaux solaires' },
  CH: { label: 'Suisse', query: 'installation solaire photovoltaïque' },
  LU: { label: 'Luxembourg', query: 'installateur solaire' },
  DE: { label: 'Allemagne', query: 'Photovoltaik Installateur' },
  ES: { label: 'Espagne', query: 'instalador paneles solares' },
  IT: { label: 'Italie', query: 'installatore pannelli solari' },
  NL: { label: 'Pays-Bas', query: 'zonnepanelen installateur' },
  PT: { label: 'Portugal', query: 'instalador painéis solares' },
  GB: { label: 'Royaume-Uni', query: 'solar panel installer' },
  US: { label: 'États-Unis', query: 'solar panel installer' },
  CA: { label: 'Canada', query: 'solar energy installer' },
  AU: { label: 'Australie', query: 'solar installer' },
  UAE: { label: 'Émirats (Dubai)', query: 'solar energy company' },
  MA: { label: 'Maroc', query: 'installation panneau solaire' },
  ZA: { label: 'Afrique du Sud', query: 'solar installer' },
  MX: { label: 'Mexique', query: 'instalador solar' },
  BR: { label: 'Brésil', query: 'instalador energia solar' },
  JP: { label: 'Japon', query: 'ソーラーパネル 設置業者' },
  KR: { label: 'Corée du Sud', query: '태양광 설치업체' },
  IN: { label: 'Inde', query: 'solar panel installer' },
  SG: { label: 'Singapour', query: 'solar panel installer Singapore' },
  TH: { label: 'Thaïlande', query: 'solar installer Thailand' },
}

function regionFromPostal(cp: string): string {
  const prefix = cp.slice(0, 2)
  const map: Record<string, string> = {
    '75': 'Île-de-France', '77': 'Île-de-France', '78': 'Île-de-France',
    '91': 'Île-de-France', '92': 'Île-de-France', '93': 'Île-de-France',
    '94': 'Île-de-France', '95': 'Île-de-France',
    '13': 'PACA', '83': 'PACA', '84': 'PACA', '06': 'PACA',
    '69': 'Auvergne-Rhône-Alpes', '38': 'Auvergne-Rhône-Alpes',
    '31': 'Occitanie', '34': 'Occitanie', '66': 'Occitanie',
    '33': 'Nouvelle-Aquitaine', '64': 'Nouvelle-Aquitaine',
    '44': 'Pays de la Loire', '85': 'Pays de la Loire',
    '35': 'Bretagne', '29': 'Bretagne',
    '59': 'Hauts-de-France', '62': 'Hauts-de-France',
    '67': 'Grand Est', '68': 'Grand Est', '57': 'Grand Est',
    '76': 'Normandie', '14': 'Normandie',
  }
  return map[prefix] ?? `France`
}

async function tryExtractEmail(website: string): Promise<string | null> {
  const domain = website.replace(/^https?:\/\//, '').split('/')[0]
  for (const path of ['/contact', '/contact-us', '/nous-contacter', '/kontakt', '']) {
    try {
      const res = await fetch(`https://${domain}${path}`, {
        signal: AbortSignal.timeout(5000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible)' },
      })
      if (!res.ok) continue
      const html = await res.text()
      const matches = html.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) ?? []
      const valid = matches.find(e =>
        !e.includes('example') && !e.includes('noreply') &&
        !e.includes('sentry') && !e.includes('schema') &&
        !e.includes('@2') && !e.includes('@3')
      )
      if (valid) return valid.toLowerCase()
    } catch { continue }
  }
  return null
}

// ── FRANCE via ADEME ─────────────────────────────────────────
async function searchFrance(supabase: AnyClient, offset: number, queryIndex: number) {
  const query = ADEME_QUERIES[queryIndex % ADEME_QUERIES.length]
  const url = `${ADEME_BASE}?size=100&from=${offset}&q=${encodeURIComponent(query)}&select=nom_entreprise,email,siret,commune,code_postal,telephone,adresse&sort=-_score`
  const res = await fetch(url, { signal: AbortSignal.timeout(12000) })
  if (!res.ok) throw new Error(`ADEME ${res.status}`)
  const data = await res.json()

  let added = 0, skipped = 0, noEmail = 0

  for (const r of (data.results ?? [])) {
    if (!r.nom_entreprise) continue
    const email = r.email?.toLowerCase().trim()
    if (!email || email.includes('noreply')) { noEmail++; continue }

    const { error } = await table(supabase, 'prospects_vp').insert({
      entreprise: r.nom_entreprise,
      email,
      region: r.code_postal ? regionFromPostal(r.code_postal) : 'France',
      type_activite: 'résidentiel',
      pays: 'FR',
      notes: [
        r.telephone ? `Tél: ${r.telephone}` : '',
        r.commune ? `${r.code_postal ?? ''} ${r.commune}` : '',
        r.siret ? `SIRET: ${r.siret}` : '',
      ].filter(Boolean).join(' | '),
    })
    if (error?.code === '23505') skipped++
    else if (!error) added++
  }

  return {
    source: 'ADEME France',
    query,
    total: data.total,
    added,
    skipped,
    no_email: noEmail,
    has_more: offset + 100 < data.total,
    next_offset: offset + 100,
  }
}

// ── INTERNATIONAL via Overpass (OpenStreetMap) ───────────────
async function searchCountry(supabase: AnyClient, countryCode: string) {
  const bbox = COUNTRY_BBOX[countryCode]
  const info = COUNTRY_LANG[countryCode]
  if (!bbox || !info) throw new Error(`Pays inconnu: ${countryCode}`)

  const [minLat, minLon, maxLat, maxLon] = bbox

  const overpassQuery = `
[out:json][timeout:45];
(
  node["craft"="electrician"]["solar_panel"="yes"](${minLat},${minLon},${maxLat},${maxLon});
  node["shop"="solar_panels"](${minLat},${minLon},${maxLat},${maxLon});
  node["office"="energy"](${minLat},${minLon},${maxLat},${maxLon});
  node["company"="solar_energy"](${minLat},${minLon},${maxLat},${maxLon});
  way["craft"="electrician"]["solar_panel"="yes"](${minLat},${minLon},${maxLat},${maxLon});
  way["shop"="solar_panels"](${minLat},${minLon},${maxLat},${maxLon});
);
out body;`

  const res = await fetch(OVERPASS_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(overpassQuery)}`,
    signal: AbortSignal.timeout(50000),
  })

  if (!res.ok) throw new Error(`Overpass ${res.status}`)
  const data = await res.json()
  const elements = data.elements ?? []

  let added = 0, skipped = 0, enriched = 0

  for (const el of elements) {
    const tags = el.tags ?? {}
    const name = tags.name || tags['name:en'] || tags['name:fr']
    if (!name) continue

    let email = tags.email?.toLowerCase().trim() ?? ''
    const website = tags.website || tags.url || tags['contact:website']

    // Try to extract email from website if not in OSM
    if (!email && website) {
      const found = await tryExtractEmail(website)
      if (found) { email = found; enriched++ }
    }

    if (!email) continue

    const city = tags['addr:city'] || tags.city || ''
    const country = tags['addr:country'] || countryCode

    const { error } = await table(supabase, 'prospects_vp').insert({
      entreprise: name,
      email,
      region: city || info.label,
      type_activite: 'résidentiel',
      pays: country || countryCode,
      notes: [
        tags.phone ? `Tél: ${tags.phone}` : '',
        city ? `Ville: ${city}` : '',
        website ? `Web: ${website}` : '',
      ].filter(Boolean).join(' | '),
    })
    if (error?.code === '23505') skipped++
    else if (!error) added++
  }

  return {
    source: `OpenStreetMap — ${info.label}`,
    country: countryCode,
    found_in_osm: elements.length,
    added,
    skipped,
    email_enriched: enriched,
  }
}

// ── ROUTES ───────────────────────────────────────────────────
export async function GET() {
  const supabase = createAdminClient()
  const { count } = await table(supabase, 'prospects_vp')
    .select('id', { count: 'exact', head: true })

  return NextResponse.json({
    prospects_in_db: count ?? 0,
    sources: {
      france: 'ADEME RGE — ~11 000 entreprises certifiées',
      international: Object.entries(COUNTRY_LANG).map(([code, v]) => `${code}: ${v.label}`),
    },
  })
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await req.json().catch(() => ({}))

    if (body.country && body.country !== 'FR') {
      const result = await searchCountry(supabase, body.country.toUpperCase())
      return NextResponse.json({ ok: true, ...result })
    }

    // Default: France via ADEME
    const result = await searchFrance(
      supabase,
      Number(body.offset ?? 0),
      Number(body.query_index ?? 0),
    )
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
