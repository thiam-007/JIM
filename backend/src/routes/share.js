import { Router } from 'express'
import supabase from '../config/supabase.js'

const router = Router()

function generateHtml(title, description, imageUrl, redirectUrl) {
  // Safe HTML escape
  const safeTitle = (title || '').replace(/"/g, '&quot;')
  const safeDesc = (description || '').replace(/"/g, '&quot;')
  const safeImg = (imageUrl || '').replace(/"/g, '&quot;')
  const safeUrl = (redirectUrl || '').replace(/"/g, '&quot;')

  return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safeTitle}</title>

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${safeTitle}" />
    <meta property="og:description" content="${safeDesc}" />
    <meta property="og:image" content="${safeImg}" />
    <meta property="og:url" content="${safeUrl}" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${safeTitle}" />
    <meta name="twitter:description" content="${safeDesc}" />
    <meta name="twitter:image" content="${safeImg}" />

    <script>
        // Redirection de secours au cas où (normalement géré par le serveur)
        window.location.replace("${safeUrl}");
    </script>
    <style>
        body { background-color: #fcfaf8; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; color: #593716; }
        .loader { text-align: center; }
    </style>
</head>
<body>
    <div class="loader">
        <p>Chargement du Musée Virtuel de Guinée...</p>
        <a href="${safeUrl}" style="color: #F9B233; text-decoration: none;">Continuer vers le site</a>
    </div>
</body>
</html>`
}

const botUserAgents = [
  'facebookexternalhit', 'WhatsApp', 'Twitterbot', 'LinkedInBot', 
  'Pinterest', 'Slackbot', 'TelegramBot', 'Discordbot', 'SkypeUriPreview', 
  'Googlebot', 'bingbot', 'yandexbot', 'duckduckbot'
]

function isBot(userAgent) {
  if (!userAgent) return false
  const ua = userAgent.toLowerCase()
  return botUserAgents.some(bot => ua.includes(bot.toLowerCase()))
}

router.get('/:type/:id', async (req, res, next) => {
  try {
    const { type, id } = req.params
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'

    let title = 'Musée Virtuel de Guinée'
    let description = 'Découvrez les événements et actualités du Musée Virtuel de Guinée.'
    let imageUrl = 'https://mvg-events.com/default-share-image.jpg' // Default fallback if needed
    let redirectUrl = frontendUrl

    if (type === 'evenement') {
      const { data, error } = await supabase
        .from('evenements')
        .select('titre, lieu, image_url')
        .eq('id', id)
        .single()

      if (!error && data) {
        title = data.titre
        description = `Retrouvez cet événement : ${data.lieu || 'En ligne'}`
        if (data.image_url) imageUrl = data.image_url
        redirectUrl = `${frontendUrl}/evenements/${id}`
      }
    } else if (type === 'actualite') {
      const { data, error } = await supabase
        .from('actualites')
        .select('titre, description, image_url')
        .eq('id', id)
        .single()

      if (!error && data) {
        title = data.titre
        description = data.description
        if (data.image_url) imageUrl = data.image_url
        redirectUrl = `${frontendUrl}/actualites/${id}`
      }
    } else {
      return res.status(404).send('Type non reconnu.')
    }

    // Détection de bot
    const userAgent = req.headers['user-agent'] || ''
    if (isBot(userAgent)) {
      // C'est un robot (WhatsApp, Facebook, etc.) : on lui donne le HTML avec les balises OG
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      res.setHeader('Cache-Control', 'public, max-age=86400')
      return res.send(generateHtml(title, description, imageUrl, redirectUrl))
    } else {
      // C'est un humain : on le redirige immédiatement sans lui montrer la page blanche
      return res.redirect(302, redirectUrl)
    }
  } catch (err) {
    next(err)
  }
})

export default router
