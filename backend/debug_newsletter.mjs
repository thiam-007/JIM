// Script de diagnostic : génère le HTML bulletin et affiche les URLs d'images dans la section MSO
import { generateBulletinHtml } from './src/services/emailService.js'

const testData = {
  edition: 'Juillet 2025',
  editoTitre: 'Test édito',
  editoTexte: 'Premier paragraphe.\n\nDeuxième paragraphe.',
  editoAuteurNom: 'Test Auteur',
  editoAuteurRole: 'Directeur',
  editoAuteurInitiales: 'TA',
  editoBref: [],
  actus: [],
  zoomTitre: 'Zoom Test',
  zoomTexte: 'Texte zoom',
  zoomMedia: [
    { type: 'image', url: 'https://example.com/image-zoom-1.jpg', link: 'https://example.com/1' },
    { type: 'image', url: 'https://example.com/image-zoom-2.jpg', link: 'https://example.com/2' },
    { type: 'image', url: 'https://example.com/image-zoom-3.jpg', link: 'https://example.com/3' },
  ],
  galerie: {
    titre: 'Galerie Test',
    medias: [
      { type: 'image', url: 'https://example.com/galerie-1.jpg', link: 'https://example.com/g1', titre: 'Photo 1', description: 'Desc 1' },
      { type: 'image', url: 'https://example.com/galerie-2.jpg', link: 'https://example.com/g2', titre: 'Photo 2', description: 'Desc 2' },
      { type: 'image', url: 'https://example.com/galerie-3.jpg', link: 'https://example.com/g3', titre: 'Photo 3', description: 'Desc 3' },
    ]
  },
  etapes: []
}

const html = generateBulletinHtml(testData)

// Extraire les blocs MSO
const msoMatches = html.match(/<!--\[if mso\]>([\s\S]*?)<!\[endif\]-->/g)
console.log('\n=== BLOCS MSO TROUVÉS ===')
if (msoMatches) {
  msoMatches.forEach((block, i) => {
    console.log(`\n--- Bloc MSO #${i + 1} ---`)
    // Extraire tous les src= d'images
    const imgSrcs = block.match(/src="([^"]+)"/g)
    const heights = block.match(/height="([^"]+)"/g)
    console.log('Images src:', imgSrcs)
    console.log('Heights:', heights)
  })
} else {
  console.log('❌ Aucun bloc MSO trouvé dans le HTML !')
}

// Vérifier si le carousel non-MSO est aussi là
const carouselMatch = html.match(/<!--\[if !mso\]><!-->([\s\S]*?)<!--<!\[endif\]-->/g)
console.log('\n=== BLOCS NON-MSO (carousel) ===')
if (carouselMatch) {
  console.log(`✅ ${carouselMatch.length} bloc(s) non-MSO trouvé(s)`)
} else {
  console.log('❌ Aucun bloc non-MSO trouvé !')
}

// Sauvegarder le HTML complet pour inspection manuelle
import { writeFileSync } from 'fs'
writeFileSync('./debug_output.html', html)
console.log('\n✅ HTML complet sauvegardé dans debug_output.html')
console.log('Taille du HTML généré :', html.length, 'caractères')
