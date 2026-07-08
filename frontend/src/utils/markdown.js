import { marked } from 'marked'
import DOMPurify from 'dompurify'

// Configurations
marked.setOptions({
  breaks: true, // Allow line breaks to become <br>
  gfm: true // GitHub Flavored Markdown (bullet points, bold, etc.)
})

/**
 * Convert markdown text to clean HTML
 * @param {string} text 
 * @returns {string} 
 */
export function renderMarkdown(text) {
  if (!text) return ''
  // Render markdown to HTML
  const rawHtml = marked.parse(text)
  // Sanitize the HTML to prevent XSS, but allow video elements and YouTube/Vimeo embeds
  const cleanHtml = DOMPurify.sanitize(rawHtml, {
    ADD_TAGS: ['iframe', 'video', 'source'],
    ADD_ATTR: [
      'allow', 'allowfullscreen', 'frameborder', 'scrolling', 'src', 
      'width', 'height', 'controls', 'type', 'class', 'style', 'poster'
    ]
  })
  return cleanHtml
}

