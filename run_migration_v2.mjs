/**
 * Applique la migration widget_v2 via l'API REST Supabase (service role).
 * Chaque ALTER TABLE est testé individuellement via un select pour éviter
 * de recréer une colonne existante (IF NOT EXISTS).
 */
import { createClient } from '@supabase/supabase-js'

const URL  = 'https://edfqspxyhuesfsvxxnlu.supabase.co'
const KEY  = 'sb_secret_E15KYAlLGphWPxk5RqQfRg_MpnGnMeD'

const supabase = createClient(URL, KEY)

async function columnExists(table, column) {
  const { error } = await supabase.from(table).select(column).limit(0)
  return !error
}

async function addLeadsColumn(col, check) {
  if (await columnExists('leads', check ?? col)) {
    console.log(`  ✅ leads.${check ?? col} — déjà présente`)
    return
  }
  console.log(`  ⏳ leads.${check ?? col} — manquante, migration impossible via REST`)
  console.log(`     → Exécutez manuellement dans Supabase SQL Editor :`)
  console.log(`       ALTER TABLE leads ADD COLUMN IF NOT EXISTS ${col};`)
}

async function addProfilesColumn(col, check) {
  if (await columnExists('profiles', check ?? col)) {
    console.log(`  ✅ profiles.${check ?? col} — déjà présente`)
    return
  }
  console.log(`  ⏳ profiles.${check ?? col} — manquante`)
  console.log(`     → Exécutez manuellement : ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ${col};`)
}

console.log('\n🔍 Vérification des colonnes...\n')

await addLeadsColumn('surface NUMERIC(8,2)',           'surface')
await addLeadsColumn('facture_mensuelle NUMERIC(8,2)', 'facture_mensuelle')
await addLeadsColumn('objectif TEXT',                  'objectif')
await addLeadsColumn('type_bien TEXT',                 'type_bien')
await addLeadsColumn('type_toiture TEXT',              'type_toiture')
await addLeadsColumn('adresse TEXT',                   'adresse')
await addLeadsColumn('consentement BOOLEAN NOT NULL DEFAULT false', 'consentement')
await addLeadsColumn('nb_panneaux INTEGER',            'nb_panneaux')
await addLeadsColumn('puissance_kwc NUMERIC(8,2)',     'puissance_kwc')
await addLeadsColumn('production_annuelle NUMERIC(10,2)', 'production_annuelle')
await addLeadsColumn('fourchette_min NUMERIC(10,2)',   'fourchette_min')
await addLeadsColumn('fourchette_max NUMERIC(10,2)',   'fourchette_max')
await addProfilesColumn('widget_show_price BOOLEAN NOT NULL DEFAULT true', 'widget_show_price')

console.log('\n✅ Vérification terminée.\n')
