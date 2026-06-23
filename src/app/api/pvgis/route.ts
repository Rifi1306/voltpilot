import { NextRequest, NextResponse } from 'next/server'

// Converts orientation label to PVGIS aspect angle
// PVGIS convention: 0=South, -90=East, 90=West, 180=North
const ASPECT_MAP: Record<string, number> = {
  'Sud': 0,
  'Sud-Est': -45,
  'Sud-Ouest': 45,
  'Est': -90,
  'Ouest': 90,
  'Nord': 180,
}

// Converts inclinaison label to tilt angle in degrees
const ANGLE_MAP: Record<string, number> = {
  'Toit plat (0–5°)': 3,
  'Faible (10–20°)': 15,
  'Optimal (30–35°)': 33,
  'Fort (40–45°)': 43,
}

type PVGISResponse = {
  outputs?: {
    totals?: {
      fixed?: {
        E_y?: number      // Annual production kWh/year
        E_m?: number      // Monthly average kWh/month
        'H(i)_y'?: number // Annual irradiation kWh/m²/year
        PR?: number       // Performance ratio
      }
    }
  }
  meta?: { inputs?: { location?: { latitude?: number; longitude?: number } } }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const cp = searchParams.get('cp')?.trim()
  const peakpower = parseFloat(searchParams.get('peakpower') ?? '0')
  const orientation = searchParams.get('orientation') ?? 'Sud'
  const inclinaison = searchParams.get('inclinaison') ?? 'Optimal (30–35°)'

  if (!cp || cp.length < 5) {
    return NextResponse.json({ error: 'Code postal invalide (5 chiffres requis)' }, { status: 400 })
  }
  if (peakpower <= 0) {
    return NextResponse.json({ error: 'Puissance crête invalide' }, { status: 400 })
  }

  // Step 1 — Geocode postal code → lat/lon via API Adresse (French gov, free, no key)
  let lat: number, lon: number
  try {
    const geoUrl = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(cp)}&type=municipality&limit=1`
    const geoRes = await fetch(geoUrl, { next: { revalidate: 86400 } })
    if (!geoRes.ok) throw new Error('Geocoding failed')
    const geoData = await geoRes.json()
    const feature = geoData.features?.[0]
    if (!feature) throw new Error('Commune introuvable')
    ;[lon, lat] = feature.geometry.coordinates as [number, number]
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Geocoding échoué'
    return NextResponse.json({ error: `Géocodage impossible : ${msg}` }, { status: 502 })
  }

  // Step 2 — PVGIS PV calculation
  const aspect = ASPECT_MAP[orientation] ?? 0
  const angle = ANGLE_MAP[inclinaison] ?? 33

  const pvgisParams = new URLSearchParams({
    lat: String(lat.toFixed(4)),
    lon: String(lon.toFixed(4)),
    peakpower: String(peakpower.toFixed(2)),
    loss: '14',          // typical system losses 14%
    angle: String(angle),
    aspect: String(aspect),
    outputformat: 'json',
    browser: '0',
  })

  try {
    const pvgisUrl = `https://re.jrc.ec.europa.eu/api/v5_2/PVcalc?${pvgisParams}`
    const pvgisRes = await fetch(pvgisUrl, { next: { revalidate: 86400 } })
    if (!pvgisRes.ok) {
      const txt = await pvgisRes.text()
      return NextResponse.json({ error: `PVGIS erreur ${pvgisRes.status}: ${txt.slice(0, 200)}` }, { status: 502 })
    }
    const pvgisData: PVGISResponse = await pvgisRes.json()
    const fixed = pvgisData.outputs?.totals?.fixed
    if (!fixed?.E_y) {
      return NextResponse.json({ error: 'PVGIS n\'a pas retourné de données de production' }, { status: 502 })
    }

    return NextResponse.json({
      production_annuelle: Math.round(fixed.E_y),
      performance_ratio: fixed.PR ? Math.round(fixed.PR * 100) : null,
      irradiation: fixed['H(i)_y'] ? Math.round(fixed['H(i)_y']) : null,
      lat: parseFloat(lat.toFixed(4)),
      lon: parseFloat(lon.toFixed(4)),
      source: 'PVGIS 5.2 · JRC European Commission',
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur inconnue'
    return NextResponse.json({ error: `PVGIS inaccessible : ${msg}` }, { status: 503 })
  }
}
