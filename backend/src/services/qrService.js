import QRCode from 'qrcode'

const QR_OPTIONS = {
  width: 300,
  margin: 2,
  color: {
    dark: '#5c3519',  // Brown — brand primary
    light: '#fef9f2'  // Cream — brand background
  }
}

/**
 * Generate a QR code as a base64 data URL (for embedding in HTML emails).
 * @param {string} token - The invitation token
 * @param {string} frontendUrl - Base URL of the frontend (e.g. https://jim-mvg.vercel.app)
 * @returns {Promise<string>} data URL starting with "data:image/png;base64,..."
 */
export async function generateQrDataUrl(token, frontendUrl) {
  const url = `${frontendUrl}/rsvp/${token}`
  return QRCode.toDataURL(url, QR_OPTIONS)
}

/**
 * Generate a QR code as a raw PNG Buffer (for serving as image/png responses).
 * @param {string} token - The invitation token
 * @param {string} frontendUrl - Base URL of the frontend
 * @returns {Promise<Buffer>} PNG image buffer
 */
export async function generateQrPng(token, frontendUrl) {
  const url = `${frontendUrl}/rsvp/${token}`
  return QRCode.toBuffer(url, { ...QR_OPTIONS, type: 'png' })
}
