#!/usr/bin/env node
/**
 * indexnow-submit.mjs
 * Lit le sitemap vegourmet.fr et soumet toutes les URLs à IndexNow.
 * Usage : node scripts/indexnow-submit.mjs
 */

const HOST = 'vegourmet.fr'
const KEY = '64bc51ecb0e9e203710cd61f2559664c'
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`
const SITEMAP_URL = `https://${HOST}/sitemap.xml`
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow'

async function fetchSitemapUrls(sitemapUrl) {
  const res = await fetch(sitemapUrl)
  if (!res.ok) throw new Error(`Erreur sitemap HTTP ${res.status}`)
  const xml = await res.text()

  // Cas sitemap index : contient des <sitemap><loc>...</loc></sitemap>
  const sitemapLocMatches = [...xml.matchAll(/<sitemap[^>]*>[\s\S]*?<loc>([^<]+)<\/loc>/g)]
  if (sitemapLocMatches.length > 0) {
    console.log(`Sitemap index détecté — ${sitemapLocMatches.length} sous-sitemaps`)
    const subUrls = []
    for (const match of sitemapLocMatches) {
      const subSitemapUrl = match[1].trim()
      console.log(`  → ${subSitemapUrl}`)
      const sub = await fetchSitemapUrls(subSitemapUrl)
      subUrls.push(...sub)
    }
    return subUrls
  }

  // Sitemap classique : contient des <url><loc>...</loc></url>
  const urlLocMatches = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
  return urlLocMatches.map(m => m[1].trim())
}

async function submitToIndexNow(urlList) {
  const body = JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList,
  })

  const res = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })

  const responseText = await res.text()
  return { status: res.status, body: responseText }
}

async function main() {
  console.log(`Récupération du sitemap : ${SITEMAP_URL}`)
  const urls = await fetchSitemapUrls(SITEMAP_URL)
  console.log(`${urls.length} URLs trouvées`)

  if (urls.length === 0) {
    console.error('Aucune URL trouvée dans le sitemap — abandon')
    process.exit(1)
  }

  // IndexNow limite à 10 000 URLs par requête
  const BATCH_SIZE = 10_000
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE)
    console.log(`Soumission batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} URLs)…`)
    const { status, body } = await submitToIndexNow(batch)
    console.log(`  HTTP ${status} — ${body || '(réponse vide)'}`)
    if (status !== 200 && status !== 202) {
      console.error(`  Erreur IndexNow (${status}). Vérifier que ${KEY_LOCATION} est accessible en 200.`)
      process.exit(1)
    }
  }

  console.log('Soumission IndexNow terminée.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
