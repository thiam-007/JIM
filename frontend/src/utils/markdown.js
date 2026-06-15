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
  // Sanitize the HTML to prevent XSS
  const cleanHtml = DOMPurify.sanitize(rawHtml)
  return cleanHtml
}
