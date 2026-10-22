/**
 * Script de nettoyage des abonnés newsletter en doublon d'email.
 *
 * Logique de conservation :
 * - Pour chaque groupe de contacts partageant le même email, on garde celui
 *   dont le nom/prénom correspond le mieux à la partie locale de l'adresse email.
 *   Ex : "jean.dupont@example.com" → Jean Dupont est privilégié.
 * - En cas d'égalité ou d'absence de correspondance, on garde le plus récent.
 *
 * Usage : node clean_duplicates.mjs [--dry-run]
 *   --dry-run : affiche ce qui serait supprimé sans toucher la base
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '.env') })

const isDryRun = process.argv.includes('--dry-run')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌  Variables SUPABASE_URL et SUPABASE_SERVICE_KEY requises.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

/**
 * Normalise une chaîne : minuscules, sans accents, sans caractères spéciaux.
 * Utilisé pour comparer les noms avec la partie locale de l'email.
 */
function normalize(str) {
  if (!str) return ''
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // supprime les accents
    .replace(/[^a-z0-9]/g, '')       // garde uniquement alphanumériques
}

/**
 * Calcule un score de correspondance entre le contact et la partie locale de l'email.
 * Plus le score est élevé, meilleure est la correspondance.
 */
function matchScore(subscriber, localPart) {
  const local = normalize(localPart) // ex: "jean.dupont" → "jeandupont"
  const prenom = normalize(subscriber.prenom)
  const nom = normalize(subscriber.nom)

  let score = 0

  // Le prénom apparaît dans la partie locale
  if (prenom && local.includes(prenom)) score += 2
  // Le nom apparaît dans la partie locale
  if (nom && local.includes(nom)) score += 2
  // Le nom complet concatené apparaît dans la partie locale
  const full = prenom + nom
  if (full && full.length > 2 && local.includes(full)) score += 3

  // Bonus si le contact a des infos renseignées (institution, fonction)
  if (subscriber.institution) score += 0.5
  if (subscriber.fonction) score += 0.5

  return score
}

async function run() {
  console.log(`\n🔍  Récupération de tous les abonnés…\n`)

  const { data: allSubs, error } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌  Erreur Supabase :', error.message)
    process.exit(1)
  }

  console.log(`✅  ${allSubs.length} abonné(s) récupéré(s).`)

  // Regrouper par email (insensible à la casse)
  const groups = new Map()
  for (const sub of allSubs) {
    const key = sub.email.toLowerCase().trim()
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(sub)
  }

  const duplicateGroups = [...groups.entries()].filter(([, subs]) => subs.length > 1)

  if (duplicateGroups.length === 0) {
    console.log('\n🎉  Aucun doublon détecté. La base est propre !')
    return
  }

  console.log(`\n⚠️   ${duplicateGroups.length} email(s) en doublon détecté(s) :\n`)

  const toDelete = []

  for (const [email, subs] of duplicateGroups) {
    const localPart = email.split('@')[0] // ex: "jean.dupont"

    // Trier par score décroissant, puis par date décroissante (plus récent en premier)
    const sorted = [...subs].sort((a, b) => {
      const scoreDiff = matchScore(b, localPart) - matchScore(a, localPart)
      if (scoreDiff !== 0) return scoreDiff
      return new Date(b.created_at) - new Date(a.created_at)
    })

    const keeper = sorted[0]
    const duplicates = sorted.slice(1)

    console.log(`📧  ${email} (${subs.length} entrées)`)
    console.log(`   ✅ GARDER  → id=${keeper.id}  nom="${keeper.prenom || ''} ${keeper.nom || ''}".trim()  score=${matchScore(keeper, localPart)}`)
    for (const dup of duplicates) {
      console.log(`   🗑️  SUPPRIMER → id=${dup.id}  nom="${dup.prenom || ''} ${dup.nom || ''}".trim()  score=${matchScore(dup, localPart)}`)
      toDelete.push(dup.id)
    }
    console.log()
  }

  console.log(`\n📊  Résumé : ${toDelete.length} abonné(s) à supprimer.`)

  if (isDryRun) {
    console.log('\n🟡  Mode --dry-run actif. Aucune suppression effectuée.')
    return
  }

  if (toDelete.length === 0) return

  console.log('\n🚀  Suppression en cours…')

  // Supprimer par lots de 50
  const chunkSize = 50
  let deleted = 0
  for (let i = 0; i < toDelete.length; i += chunkSize) {
    const chunk = toDelete.slice(i, i + chunkSize)
    const { error: delError } = await supabase
      .from('newsletter_subscribers')
      .delete()
      .in('id', chunk)

    if (delError) {
      console.error(`❌  Erreur lors de la suppression du lot ${i / chunkSize + 1} :`, delError.message)
    } else {
      deleted += chunk.length
      console.log(`   ✅ Lot ${Math.floor(i / chunkSize) + 1} supprimé (${chunk.length} entrées)`)
    }
  }

  console.log(`\n🎉  Nettoyage terminé ! ${deleted}/${toDelete.length} doublon(s) supprimé(s).`)
  console.log('\n💡  Pensez maintenant à ajouter une contrainte UNIQUE sur la colonne "email"')
  console.log('    dans Supabase : ALTER TABLE newsletter_subscribers ADD CONSTRAINT newsletter_subscribers_email_unique UNIQUE (email);\n')
}

run().catch(err => {
  console.error('❌  Erreur inattendue :', err)
  process.exit(1)
})
