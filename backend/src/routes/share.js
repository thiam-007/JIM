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
        // Redirection immédiate pour les visiteurs humains
        window.location.replace("${safeUrl}");
    </script>
</head>
<body>
    <p>Redirection vers l'application... Si vous n'êtes pas redirigé, <a href="${safeUrl}">cliquez ici</a>.</p>
</body>
</html>`
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

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=86400') // Cache for 1 day
    res.send(generateHtml(title, description, imageUrl, redirectUrl))
  } catch (err) {
    next(err)
  }
})

export default router
