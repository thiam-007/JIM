import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

function getFromAddress() {
  return process.env.EMAIL_USER ? `"Musée Virtuel de Guinée" <${process.env.EMAIL_USER}>` : 'Musée Virtuel de Guinée <musee@expertisefrance.fr>'
}

const originalSendMail = transporter.sendMail.bind(transporter)
transporter.sendMail = async (mailOptions) => {
  // Si une clé Brevo est fournie, on utilise l'API HTTP au lieu du SMTP (contourne le blocage Render)
  if (process.env.BREVO_API_KEY) {
    const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER || 'musee@expertisefrance.fr'
    const payload = {
      sender: { name: "Musée Virtuel de Guinée", email: senderEmail },
      to: [{ email: mailOptions.to }],
      subject: mailOptions.subject,
      htmlContent: mailOptions.html
    }
    if (mailOptions.replyTo) {
      payload.replyTo = { email: mailOptions.replyTo }
    }
    if (mailOptions.attachments && mailOptions.attachments.length > 0) {
      payload.attachment = mailOptions.attachments.map(att => {
        // L'API Brevo requiert simplement le nom et le contenu en base64
        return {
          name: att.filename,
          content: att.content
        }
      })
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Brevo API Error: ${response.status} - ${JSON.stringify(errorData)}`)
    }
    return await response.json()
  }

  // Fallback classique sur Nodemailer / Gmail si pas de clé Brevo
  return await originalSendMail(mailOptions)
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Format a date string as a readable French date + time.
 * e.g. "samedi 14 juin 2025 à 18h30"
 */
function formatDateFr(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(',', ' à')
}

/**
 * Shared HTML email shell with brand colours.
 */
function emailShell(bodyContent, title = 'NOTIFICATION') {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
  
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Musée Virtuel de Guinée</title>
</head>
<body style="margin:0;padding:0;background-color:#f5ede3;font-family:'Georgia',serif;">

  <!-- Outer wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5ede3;padding:40px 0;">
    <tr>
      <td align="center">

        <!-- Card -->
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#fef9f2;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(92,53,25,0.12);">

          <!-- Header banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#5c3519 0%,#8b5a2b 60%,#f9b233 100%);padding:36px 40px;text-align:center;">
              <img src="${frontendUrl}/images/logo.jpeg" alt="Logo MVG" style="width:70px; height:70px; border-radius:50%; border:2px solid #f9b233; margin-bottom:16px;" />
              <p style="margin:0 0 6px 0;color:#f9b233;font-size:12px;letter-spacing:3px;text-transform:uppercase;font-family:'Arial',sans-serif;">
                Musée Virtuel de Guinée
              </p>
              <h1 style="margin:0;color:#fef9f2;font-size:28px;font-weight:normal;letter-spacing:1px;">
                ${title}
              </h1>
              <div style="margin-top:16px;width:60px;height:3px;background:#f9b233;margin-left:auto;margin-right:auto;border-radius:2px;"></div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${bodyContent}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#5c3519;padding:24px 40px;text-align:center;">
              <p style="margin:0;color:#f9b233;font-size:12px;font-family:'Arial',sans-serif;letter-spacing:1px;">
                MUSÉE VIRTUEL DE GUINÉE
              </p>
              <p style="margin:6px 0 0;color:#c9956a;font-size:11px;font-family:'Arial',sans-serif;">
                Préserver la mémoire, célébrer la culture
              </p>
              <div style="margin-top: 16px; display:inline-block;">
                <a href="${frontendUrl}" style="text-decoration:none; margin: 0 8px; display:inline-block; vertical-align:middle;">
                  <img src="https://img.icons8.com/ios-filled/24/f9b233/domain.png" alt="Site Web" style="vertical-align:middle;" />
                </a>
                <span style="color:#c9956a; vertical-align:middle; margin:0 4px;">|</span>
                <a href="https://www.facebook.com/profile.php?id=61584717626322" style="text-decoration:none; margin: 0 8px; display:inline-block; vertical-align:middle;">
                  <img src="https://img.icons8.com/ios-filled/24/f9b233/facebook-new.png" alt="Facebook" style="vertical-align:middle;" />
                </a>
                <span style="color:#c9956a; vertical-align:middle; margin:0 4px;">|</span>
                <a href="https://www.instagram.com/museevirtuelguinee?igsh=MWNsbmlrcGV6bnM3Nw==" style="text-decoration:none; margin: 0 8px; display:inline-block; vertical-align:middle;">
                  <img src="https://img.icons8.com/ios-filled/24/f9b233/instagram-new.png" alt="Instagram" style="vertical-align:middle;" />
                </a>
              </div>
            </td>
          </tr>

        </table>

        <!-- Legal note -->
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;margin-top:16px;">
          <tr>
            <td style="text-align:center;padding:0 20px;">
              <p style="margin:0;color:#a08060;font-size:11px;font-family:'Arial',sans-serif;line-height:1.6;">
                Vous recevez cet e-mail car vous avez été invité(e) à un événement du Musée Virtuel de Guinée.<br />
                Si vous pensez avoir reçu cet e-mail par erreur, veuillez l'ignorer.
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>`
}

// ─── Event detail block ────────────────────────────────────────────────────────

function eventBlock(evenement) {
  const rows = [
    evenement.date_debut ? ['📅 Date', formatDateFr(evenement.date_debut)] : null,
    evenement.date_fin ? ['⏰ Fin', formatDateFr(evenement.date_fin)] : null,
    evenement.lieu ? ['📍 Lieu', evenement.lieu] : null
  ].filter(Boolean)

  if (rows.length === 0) return ''

  const rowsHtml = rows.map(([label, value]) => `
    <tr>
      <td style="padding:10px 16px;border-bottom:1px solid #f0e8dc;">
        <span style="color:#8b5a2b;font-size:13px;font-family:'Arial',sans-serif;">${label}</span>
      </td>
      <td style="padding:10px 16px;border-bottom:1px solid #f0e8dc;">
        <span style="color:#3a2010;font-size:14px;font-family:'Arial',sans-serif;font-weight:bold;">${value}</span>
      </td>
    </tr>
  `).join('')

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fdf3e3;border:1px solid #e8d4b8;border-radius:8px;overflow:hidden;margin:24px 0;">
      ${rowsHtml}
    </table>
  `
}

// ─── sendInvitation ────────────────────────────────────────────────────────────

/**
 * Send an invitation email with RSVP button.
 * @param {{ invite: object, evenement: object, rsvpUrl: string }} params
 */
export async function sendInvitation({ invite, evenement, rsvpUrl }) {
  const fullName = `${invite.prenom} ${invite.nom}`

  const body = `
    <!-- Greeting -->
    <p style="margin:0 0 8px;color:#8b5a2b;font-size:13px;font-family:'Arial',sans-serif;letter-spacing:1px;text-transform:uppercase;">
      Invitation personnelle
    </p>
    <h2 style="margin:0 0 24px;color:#3a2010;font-size:22px;font-weight:normal;">
      Cher(e) <strong>${fullName}</strong>,
    </h2>

    <p style="margin:0 0 16px;color:#4a3020;font-size:15px;line-height:1.7;">
      Le <strong>Musée Virtuel de Guinée</strong> a le plaisir de vous convier à son prochain événement&nbsp;:
    </p>

    <!-- Event title -->
    <div style="background:linear-gradient(135deg,#5c3519,#8b5a2b);border-radius:8px;padding:20px 24px;margin:0 0 20px;text-align:center;">
      <h3 style="margin:0;color:#f9b233;font-size:20px;font-weight:normal;letter-spacing:0.5px;">
        ${evenement.titre}
      </h3>
    </div>

    ${evenement.description ? `
    <p style="margin:0 0 20px;color:#4a3020;font-size:15px;line-height:1.7;">
      ${evenement.description}
    </p>
    ` : ''}

    ${eventBlock(evenement)}

    <!-- Organisation mention -->
    ${invite.organisation ? `
    <p style="margin:0 0 20px;color:#6a5040;font-size:14px;font-style:italic;">
      En votre qualité de représentant(e) de <strong>${invite.organisation}</strong>${invite.titre_poste ? ` — ${invite.titre_poste}` : ''}.
    </p>
    ` : ''}

    <!-- RSVP section -->
    <div style="background-color:#fdf3e3;border:1px solid #e8d4b8;border-radius:8px;padding:24px;margin:24px 0;text-align:center;">
      <p style="margin:0 0 8px;color:#5c3519;font-size:13px;font-family:'Arial',sans-serif;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">
        Merci de confirmer votre présence
      </p>
      <p style="margin:0 0 20px;color:#6a5040;font-size:13px;font-family:'Arial',sans-serif;">
        Cliquez sur le bouton ci-dessous pour répondre à cette invitation.
      </p>
      <a href="${rsvpUrl}"
         style="display:inline-block;background:linear-gradient(135deg,#f9b233,#e09820);color:#3a2010;text-decoration:none;font-family:'Arial',sans-serif;font-size:15px;font-weight:bold;padding:14px 36px;border-radius:6px;letter-spacing:0.5px;">
        Répondre à l'invitation →
      </a>
      <p style="margin:16px 0 0;color:#a08060;font-size:11px;font-family:'Arial',sans-serif;">
        Ou copiez ce lien dans votre navigateur :<br />
        <span style="color:#8b5a2b;">${rsvpUrl}</span>
      </p>
    </div>

    <p style="margin:24px 0 0;color:#4a3020;font-size:14px;line-height:1.7;">
      Nous espérons avoir le plaisir de vous accueillir lors de cet événement.<br />
      <span style="color:#8b5a2b;">— L'équipe du Musée Virtuel de Guinée</span>
    </p>
  `

  if (!process.env.BREVO_API_KEY && (!process.env.EMAIL_USER || !process.env.EMAIL_PASS)) {
    throw new Error('Les variables EMAIL_USER/EMAIL_PASS ou BREVO_API_KEY ne sont pas configurées.')
  }

  try {
    const info = await transporter.sendMail({
      from: getFromAddress(),
      to: invite.email,
      subject: `Invitation — ${evenement.titre}`,
      html: emailShell(body, 'INVITATION OFFICIELLE')
    })
    return info
  } catch (error) {
    throw new Error(`Erreur d'envoi d'e-mail : ${error.message}`)
  }
}

// ─── sendConfirmation ──────────────────────────────────────────────────────────

/**
 * Send a confirmation email with an embedded QR code.
 * @param {{ invite: object, evenement: object, qrCodeBase64: string, token: string }} params
 */
export async function sendContactMessage({ prenom, nom, email, sujet, message, recipient }) {
  const body = `
    <h2 style="margin:0 0 16px;color:#3a2010;font-size:22px;font-weight:normal;">
      Nouveau message de contact
    </h2>

    <p style="margin:0 0 16px;color:#4a3020;font-size:15px;line-height:1.7;">
      Une nouvelle demande a été envoyée depuis le site du Musée Virtuel de Guinée.
    </p>

    <div style="background-color:#fdf3e3;border:1px solid #e8d4b8;border-radius:8px;padding:20px;margin:24px 0;">
      <p style="margin:0 0 8px;color:#8b5a2b;font-size:13px;font-family:'Arial',sans-serif;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">Informations</p>
      <p style="margin:0 0 6px;color:#3a2010;font-size:14px;"><strong>Nom :</strong> ${prenom} ${nom}</p>
      <p style="margin:0 0 6px;color:#3a2010;font-size:14px;"><strong>Email :</strong> ${email}</p>
      <p style="margin:0 0 6px;color:#3a2010;font-size:14px;"><strong>Objet :</strong> ${sujet}</p>
      <p style="margin:12px 0 0;color:#3a2010;font-size:14px;line-height:1.7;"><strong>Message :</strong><br />${message.replace(/\n/g, '<br />')}</p>
    </div>

    <p style="margin:0;color:#4a3020;font-size:14px;line-height:1.7;">
      Merci de traiter cette demande dans les meilleurs délais.<br />
      <span style="color:#8b5a2b;">— L'équipe du Musée Virtuel de Guinée</span>
    </p>
  `

  if (!process.env.BREVO_API_KEY && (!process.env.EMAIL_USER || !process.env.EMAIL_PASS)) {
    throw new Error('Les variables EMAIL_USER/EMAIL_PASS ou BREVO_API_KEY ne sont pas configurées.')
  }

  try {
    const info = await transporter.sendMail({
      from: getFromAddress(),
      to: recipient,
      replyTo: email,
      subject: `Nouveau message de contact — ${sujet}`,
      html: emailShell(body, 'NOUVEAU MESSAGE')
    })
    return info
  } catch (error) {
    throw new Error(`Erreur d'envoi d'e-mail : ${error.message}`)
  }
}

// ─── sendContactReceipt ────────────────────────────────────────────────────────

/**
 * Send an auto-reply receipt to the user who contacted us.
 */
export async function sendContactReceipt({ prenom, email, sujet }) {
  const body = `
    <div style="background:linear-gradient(135deg,#f9b233,#e09820);border-radius:8px;padding:16px 24px;margin:0 0 24px;text-align:center;">
      <p style="margin:0;color:#3a2010;font-size:16px;font-family:'Arial',sans-serif;font-weight:bold;">
        ✉️ Accusé de réception
      </p>
    </div>

    <h2 style="margin:0 0 16px;color:#3a2010;font-size:22px;font-weight:normal;">
      Bonjour ${prenom},
    </h2>

    <p style="margin:0 0 16px;color:#4a3020;font-size:15px;line-height:1.7;">
      Nous avons bien reçu votre message concernant le sujet <strong>"${sujet}"</strong>.
    </p>

    <p style="margin:0 0 16px;color:#4a3020;font-size:15px;line-height:1.7;">
      Notre équipe vous répondra dans les plus brefs délais (généralement sous 48h).
    </p>

    <p style="margin:24px 0 0;color:#4a3020;font-size:14px;line-height:1.7;">
      Cordialement,<br />
      <span style="color:#8b5a2b;">— L'équipe du Musée Virtuel de Guinée</span>
    </p>
  `

  if (!process.env.BREVO_API_KEY && (!process.env.EMAIL_USER || !process.env.EMAIL_PASS)) {
    throw new Error('Les variables EMAIL_USER/EMAIL_PASS ou BREVO_API_KEY ne sont pas configurées.')
  }

  try {
    const info = await transporter.sendMail({
      from: getFromAddress(),
      to: email,
      subject: `Accusé de réception — ${sujet}`,
      html: emailShell(body, 'ACCUSÉ DE RÉCEPTION')
    })
    return info
  } catch (error) {
    throw new Error(`Erreur d'envoi d'e-mail : ${error.message}`)
  }
}

/**
 * Send a confirmation email with a QR code link.
 * @param {{ invite: object, evenement: object, qrCodeDataUrl: string, token: string }} params
 */
export async function sendConfirmation({ invite, evenement, qrCodeDataUrl, token }) {
  const fullName = `${invite.prenom} ${invite.nom}`

  const body = `
    <!-- Success banner -->
    <div style="background:linear-gradient(135deg,#2d7a3a,#4aaa5c);border-radius:8px;padding:16px 24px;margin:0 0 24px;text-align:center;">
      <p style="margin:0;color:#ffffff;font-size:16px;font-family:'Arial',sans-serif;font-weight:bold;">
        ✅ Inscription confirmée !
      </p>
    </div>

    <h2 style="margin:0 0 16px;color:#3a2010;font-size:22px;font-weight:normal;">
      Cher(e) <strong>${fullName}</strong>,
    </h2>

    <p style="margin:0 0 16px;color:#4a3020;font-size:15px;line-height:1.7;">
      Nous avons bien enregistré votre participation à l'événement&nbsp;:
    </p>

    <!-- Event title -->
    <div style="background:linear-gradient(135deg,#5c3519,#8b5a2b);border-radius:8px;padding:20px 24px;margin:0 0 20px;text-align:center;">
      <h3 style="margin:0;color:#f9b233;font-size:20px;font-weight:normal;letter-spacing:0.5px;">
        ${evenement.titre}
      </h3>
    </div>

    ${eventBlock(evenement)}

    <!-- QR Code section -->
    <div style="background-color:#fdf3e3;border:2px solid #f9b233;border-radius:10px;padding:28px;margin:24px 0;text-align:center;">
      <p style="margin:0 0 6px;color:#5c3519;font-size:13px;font-family:'Arial',sans-serif;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">
        Votre QR Code d'accès
      </p>
      <p style="margin:0 0 20px;color:#6a5040;font-size:13px;font-family:'Arial',sans-serif;">
        Présentez ce code à l'entrée de l'événement pour valider votre présence.
      </p>
      <img
        src="cid:qr-code.png"
        alt="QR Code d'accès — ${evenement.titre}"
        width="200"
        height="200"
        style="display:block;margin:0 auto;border:6px solid #fef9f2;border-radius:8px;box-shadow:0 2px 12px rgba(92,53,25,0.2);"
      />
      <p style="margin:16px 0 0;color:#a08060;font-size:11px;font-family:'Arial',sans-serif;">
        Réf. invitation : <code style="color:#5c3519;background:#f0e8dc;padding:2px 6px;border-radius:3px;">${token.substring(0, 8).toUpperCase()}</code>
      </p>
    </div>

    <!-- Reminder box -->
    <div style="border-left:4px solid #f9b233;padding:12px 16px;background-color:#fffbf0;border-radius:0 6px 6px 0;margin:0 0 24px;">
      <p style="margin:0;color:#5c3519;font-size:13px;font-family:'Arial',sans-serif;font-weight:bold;">
        Rappel important
      </p>
      <ul style="margin:8px 0 0;padding-left:18px;color:#4a3020;font-size:13px;font-family:'Arial',sans-serif;line-height:1.8;">
        <li>Conservez cet e-mail ou faites une capture d'écran de votre QR code.</li>
        <li>Présentez-vous ${evenement.lieu ? `à <strong>${evenement.lieu}</strong>` : "au lieu indiqué"} le ${formatDateFr(evenement.date_debut)}.</li>
        <li>Le QR code est strictement personnel et non transférable.</li>
      </ul>
    </div>

    <p style="margin:0;color:#4a3020;font-size:14px;line-height:1.7;">
      Nous vous souhaitons une excellente journée et espérons vous voir bientôt.<br />
      <span style="color:#8b5a2b;">— L'équipe du Musée Virtuel de Guinée</span>
    </p>
  `

  if (!process.env.BREVO_API_KEY && (!process.env.EMAIL_USER || !process.env.EMAIL_PASS)) {
    throw new Error('Les variables EMAIL_USER/EMAIL_PASS ou BREVO_API_KEY ne sont pas configurées.')
  }

  try {
    const info = await transporter.sendMail({
      from: getFromAddress(),
      to: invite.email,
      subject: `Confirmation — ${evenement.titre}`,
      html: emailShell(body, 'CONFIRMATION'),
      attachments: [
        {
          filename: 'qr-code.png',
          content: qrCodeDataUrl.split(',')[1],
          encoding: 'base64',
          cid: 'qrcode' // same cid value as in the html img src
        }
      ]
    })
    return info
  } catch (error) {
    throw new Error(`Erreur d'envoi d'e-mail : ${error.message}`)
  }
}

export async function sendNewsletterWelcome({ email }) {
  const body = `
    <!-- Success banner -->
    <div style="background:linear-gradient(135deg,#f9b233,#e09820);border-radius:8px;padding:16px 24px;margin:0 0 24px;text-align:center;">
      <p style="margin:0;color:#3a2010;font-size:16px;font-family:'Arial',sans-serif;font-weight:bold;">
        🎉 Bienvenue dans notre communauté !
      </p>
    </div>

    <h2 style="margin:0 0 16px;color:#3a2010;font-size:22px;font-weight:normal;">
      Bonjour,
    </h2>

    <p style="margin:0 0 16px;color:#4a3020;font-size:15px;line-height:1.7;">
      Merci de vous être inscrit(e) à la newsletter du <strong>Musée Virtuel de Guinée</strong>. Nous sommes ravis de vous compter parmi nous !
    </p>

    <p style="margin:0 0 16px;color:#4a3020;font-size:15px;line-height:1.7;">
      Vous recevrez prochainement nos actualités, nos découvertes et nos invitations aux futurs événements culturels et expositions immersives.
    </p>

    <p style="margin:24px 0 0;color:#4a3020;font-size:14px;line-height:1.7;">
      À très bientôt,<br />
      <span style="color:#8b5a2b;">— L'équipe du Musée Virtuel de Guinée</span>
    </p>
  `

  if (!process.env.BREVO_API_KEY && (!process.env.EMAIL_USER || !process.env.EMAIL_PASS)) {
    throw new Error('Les variables EMAIL_USER/EMAIL_PASS ou BREVO_API_KEY ne sont pas configurées.')
  }

  try {
    const info = await transporter.sendMail({
      from: getFromAddress(),
      to: email,
      subject: "Bienvenue à la newsletter du Musée Virtuel de Guinée !",
      html: emailShell(body, 'BIENVENUE')
    })
    return info
  } catch (error) {
    throw new Error(`Erreur d'envoi d'e-mail : ${error.message}`)
  }
}
