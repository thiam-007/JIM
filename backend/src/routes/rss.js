import { Router } from 'express'
import supabase from '../config/supabase.js'

const router = Router()

// Helper to escape special XML characters
function escapeXml(unsafe) {
  if (!unsafe) return ''
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '&': return '&amp;'
      case '\'': return '&apos;'
      case '"': return '&quot;'
      default: return c
    }
  })
}

router.get('/', async (req, res, next) => {
  try {
    const frontendUrl = (process.env.FRONTEND_URL || 'https://mvgproject.vercel.app').replace(/\/$/, '')
    const backendUrl = (process.env.BACKEND_URL || 'https://jim-backend-db31.onrender.com').replace(/\/$/, '')

    // Fetch last 50 news articles
    const { data: articles, error } = await supabase
      .from('actualites')
      .select('*')
      .order('date_evenement', { ascending: false, nullsFirst: true })
      .limit(50)

    if (error) throw error

    const lastBuildDate = articles && articles.length > 0
      ? new Date(articles[0].created_at || new Date()).toUTCString()
      : new Date().toUTCString()

    let xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
<channel>
  <title>${escapeXml('Musée Virtuel de Guinée - Actualités')}</title>
  <link>${frontendUrl}</link>
  <description>${escapeXml('Suivez toutes les actualités et événements du projet de Musée Virtuel de Guinée.')}</description>
  <language>fr</language>
  <lastBuildDate>${lastBuildDate}</lastBuildDate>
  <pubDate>${lastBuildDate}</pubDate>
  <ttl>60</ttl>
  <atom:link href="${backendUrl}/api/rss" rel="self" type="application/rss+xml" />
`

    if (articles && articles.length > 0) {
      for (const act of articles) {
        const itemLink = `${frontendUrl}/actualites/${act.id}`
        const pubDate = new Date(act.date_evenement || act.created_at).toUTCString()
        // RSS author format expects an email or just a name
        const author = act.auteur ? `${escapeXml(act.auteur)}` : 'Musée Virtuel de Guinée'

        const description = String(act.description || '').replaceAll(']]>', ']]]]><![CDATA[>')
        xml += `  <item>
    <title>${escapeXml(act.titre)}</title>
    <link>${itemLink}</link>
    <guid isPermaLink="true">${itemLink}</guid>
    <pubDate>${pubDate}</pubDate>
    <description><![CDATA[${description}]]></description>
    <author>${escapeXml(author)}</author>
`
        if (act.image_url) {
          xml += `    <enclosure url="${act.image_url}" type="image/jpeg" length="0" />
    <media:content url="${act.image_url}" medium="image" type="image/jpeg" />
`
        }
        xml += `  </item>\n`
      }
    }

    xml += `</channel>
</rss>`

    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8')
    res.send(xml)
  } catch (err) {
    next(err)
  }
})

export default router
