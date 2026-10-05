import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

function getFromAddress() {
  return process.env.EMAIL_USER ? `"Musée Virtuel de Guinée (musee@expertisefrance.fr)" <${process.env.EMAIL_USER}>` : '"Musée Virtuel de Guinée" <musee@expertisefrance.fr>'
}

async function sendBrevoEmail(payload) {
  let lastError

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`Brevo API Error: ${response.status} - ${JSON.stringify(errorData)}`)
      }

      return await response.json()
    } catch (error) {
      lastError = error
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }

  throw lastError
}

const originalSendMail = transporter.sendMail.bind(transporter)
transporter.sendMail = async (mailOptions) => {
  // Enforce replies redirecting to musee@expertisefrance.fr
  if (!mailOptions.replyTo) {
    mailOptions.replyTo = 'musee@expertisefrance.fr'
  }

  if (process.env.BREVO_API_KEY) {
    try {
      const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER || 'musee@expertisefrance.fr'
      const payload = {
        sender: { name: "Musée Virtuel de Guinée (musee@expertisefrance.fr)", email: senderEmail },
        to: [{ email: mailOptions.to }],
        subject: mailOptions.subject,
        htmlContent: mailOptions.html
      }
      if (mailOptions.replyTo) {
        payload.replyTo = { email: mailOptions.replyTo }
      }
      if (mailOptions.attachments && mailOptions.attachments.length > 0) {
        payload.attachment = mailOptions.attachments.map(att => {
          return {
            name: att.filename,
            content: att.content
          }
        })
      }

      return await sendBrevoEmail(payload)
    } catch (brevoErr) {
      const cause = brevoErr.cause?.code || brevoErr.cause?.message
      console.warn("Échec de l'envoi via Brevo, tentative de fallback via Gmail...", cause ? `${brevoErr.message} (${cause})` : brevoErr.message)
      // Si on échoue ici, on ne fait pas de 'return', on laisse le code continuer 
      // pour utiliser le fallback Nodemailer / Gmail en dessous.
    }
  }

  // Fallback classique sur Nodemailer / Gmail si pas de clé Brevo OU si Brevo a échoué
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
 * ✅ Compatible Outlook Desktop (Word engine), Exchange, Lotus Notes, clients institutionnels.
 *    - Styles 100 % inline sur chaque élément structurel
 *    - Layout table-based (aucun div de structure)
 *    - Pas de linear-gradient, position:absolute, box-shadow, display:flex/grid
 *    - Commentaires conditionnels <!--[if mso]--> pour Outlook
 *    - @media queries conservées uniquement pour le rendu mobile (Outlook les ignore, c'est intentionnel)
 */
function emailShell(bodyContent, options = {}) {
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')

  // Handle retro-compatibility where options was just a string title
  const title = typeof options === 'string' ? options : (options.title || 'NOTIFICATION')
  const edition = options.edition || 'Musée Virtuel de Guinée'
  const label = options.label || 'NOTIFICATION'
  const isFullWidth = options.isFullWidth || false

  // Wrapper du body : fullWidth passe le contenu directement, sinon on emballe dans une cellule paddée
  const bodyWrapper = isFullWidth
    ? bodyContent
    : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td class="mobile-pad" bgcolor="#f4f7f5" style="padding:40px; background-color:#f4f7f5; color:#121526; font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:1.7;">
            ${bodyContent}
          </td>
        </tr>
      </table>`

  return `<!DOCTYPE html>
<html lang="fr" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Musée Virtuel de Guinée</title>
  <!--[if mso]>
  <xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  <![endif]-->
  <style type="text/css">
    /* Resets Outlook / Word engine */
    table { mso-table-lspace:0pt; mso-table-rspace:0pt; border-collapse:collapse; }
    img { border:0; outline:none; text-decoration:none; display:block; -ms-interpolation-mode:bicubic; }
    a[x-apple-data-detectors] { color:inherit !important; text-decoration:none !important; font-size:inherit !important; font-family:inherit !important; font-weight:inherit !important; line-height:inherit !important; }
    /* Mobile only — Outlook Desktop ignore @media, c'est intentionnel */
    @media (max-width:600px) {
      .wrapper { width:100% !important; max-width:100% !important; }
      .mobile-pad { padding:20px !important; }
      .mobile-block { display:block !important; width:100% !important; box-sizing:border-box !important; }
      .mobile-center { text-align:center !important; }
      .hide-mobile { display:none !important; max-height:0 !important; overflow:hidden !important; }
      .mobile-no-border { border-left:none !important; padding-left:0 !important; }
      .carousel-scroll { overflow-x:scroll !important; -webkit-overflow-scrolling:touch !important; display:block !important; width:100% !important; white-space:nowrap !important; }
      .carousel-item { display:inline-block !important; float:none !important; white-space:normal !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f4f7f5; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">

  <!-- Table de fond générale -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f4f7f5" style="background-color:#f4f7f5;">
    <tr>
      <td align="center" valign="top" style="padding:30px 10px;">

        <!--[if mso]>
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="680" align="center" style="width:680px;"><tr><td>
        <![endif]-->

        <!-- Carte email principale -->
         <table role="presentation" class="wrapper" width="100%" cellpadding="0" cellspacing="0" border="0" align="center" bgcolor="#ffffff"
           style="max-width:680px; width:100%; background-color:#FFFFFF; font-family:Arial,Helvetica,sans-serif;">

          <!-- ══════════════ HEADER ══════════════ -->
          <!-- Fond bleu marine uni (pas de gradient, pas de position:absolute) -->
          <tr>
            <td bgcolor="#28336f" style="background-color:#28336f; padding:0; margin:0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="mobile-pad" style="padding:36px 40px 32px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <!-- Logo -->
                        <td width="120" valign="middle" align="center" style="width:120px;">
                          <img src="https://vxbaqwyotalslelyhlxs.supabase.co/storage/v1/object/public/actualites/logo-white.png"
                               alt="Musée Virtuel de Guinée" width="120"
                               style="width:120px; max-width:100%; height:auto; display:block; margin:0 auto;" />
                        </td>
                        <!-- Espaceur desktop -->
                        <td class="hide-mobile" width="24" style="width:24px;">&nbsp;</td>
                        <!-- Titre + label -->
                        <td valign="middle" class="mobile-block mobile-no-border mobile-center"
                            style="border-left:3px solid #b45332; padding-left:24px; font-family:Arial,Helvetica,sans-serif;">
                          <p style="font-family:Arial,Helvetica,sans-serif; font-size:10px; font-weight:700; letter-spacing:3.5px; text-transform:uppercase; color:#b45332; margin:0 0 6px 0;"><font color="#b45332">${label}</font></p>
                          <h1 style="font-family:Arial,Helvetica,sans-serif; font-size:24px; font-weight:700; color:#FFFFFF; line-height:1.25; margin:0;"><font color="#ffffff">${title.replace('N°', 'N°&nbsp;')}</font></h1>
                          <p style="font-family:Arial,Helvetica,sans-serif; font-size:12px; font-weight:300; letter-spacing:1.5px; color:rgba(255,255,255,0.6); margin:8px 0 0 0;"><font color="#ffffff">${edition}</font></p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Bande couleur (couleur solide — pas de linear-gradient, ignoré par Outlook) -->
          <tr>
            <td height="8" style="height:8px; background-color:#b45332; font-size:0; line-height:0; mso-line-height-rule:exactly;">&nbsp;</td>
          </tr>

          <!-- ══════════════ BODY ══════════════ -->
          <tr>
            <td bgcolor="#f4f7f5" style="background-color:#f4f7f5; padding:0; margin:0;">
              ${bodyWrapper}
            </td>
          </tr>

          <!-- ══════════════ FOOTER ══════════════ -->
          <!-- Fond bleu marine uni, pas de ::after pseudo-element (ignoré par Outlook) -->
          <tr>
            <td class="mobile-pad" bgcolor="#28336f" style="background-color:#28336f; padding:32px 40px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="border-bottom:1px solid #5a4030; padding-bottom:20px; margin-bottom:18px;">
                <tr>
                  <td align="center" style="padding-bottom:16px;">
                    <img src="https://vxbaqwyotalslelyhlxs.supabase.co/storage/v1/object/public/actualites/logo-white.png"
                         alt="MVG" width="100"
                         style="width:100px; height:auto; display:block; margin:0 auto;" />
                    <p style="margin:12px auto 0; font-size:11px; color:rgba(255,255,255,0.4); line-height:1.5; text-align:center; font-family:Arial,Helvetica,sans-serif;">
                      Musée Virtuel de Guinée &mdash; Préserver et diffuser le patrimoine culturel guinéen.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h4 style="font-family:Arial,Helvetica,sans-serif; font-size:10px; font-weight:700; letter-spacing:2.5px; text-transform:uppercase; color:#b45332; margin:0 0 12px 0;">Suivez-nous</h4>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                      <tr>
                        <td align="center" style="padding:0 6px;">
                          <a href="https://www.facebook.com/profile.php?id=61584717626322" style="text-decoration:none; display:block;">
                            <img src="https://img.icons8.com/ios-filled/36/b45332/facebook-new.png" alt="Facebook" width="36" height="36" style="display:block; border:none;" />
                          </a>
                        </td>
                        <td align="center" style="padding:0 6px;">
                          <a href="https://www.instagram.com/museevirtuelguinee" style="text-decoration:none; display:block;">
                            <img src="https://img.icons8.com/ios-filled/36/b45332/instagram-new.png" alt="Instagram" width="36" height="36" style="display:block; border:none;" />
                          </a>
                        </td>
                        <td align="center" style="padding:0 6px;">
                          <a href="${frontendUrl}" style="text-decoration:none; display:block;">
                            <img src="https://img.icons8.com/ios-filled/36/b45332/domain.png" alt="Site Web" width="36" height="36" style="display:block; border:none;" />
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <!-- Copyright -->
              <p style="text-align:center; font-size:10px; color:rgba(255,255,255,0.3); margin:0; font-family:Arial,Helvetica,sans-serif;">
                &copy; ${new Date().getFullYear()} Musée Virtuel de Guinée &mdash; Tous droits réservés
              </p>
            </td>
          </tr>

          <!-- Barre de bas de page (couleur solide) -->
          <tr>
            <td height="5" style="height:5px; background-color:#b45332; font-size:0; line-height:0; mso-line-height-rule:exactly;">&nbsp;</td>
          </tr>

        </table>
        <!-- /Carte email -->

        <!--[if mso]></td></tr></table><![endif]-->

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
      <td style="padding:10px 16px;border-bottom:1px solid #bdcec8;">
        <span style="color:#b45332;font-size:13px;font-family:Arial,Helvetica,sans-serif;">${label}</span>
      </td>
      <td style="padding:10px 16px;border-bottom:1px solid #bdcec8;">
        <span style="color:#28336f;font-size:14px;font-family:Arial,Helvetica,sans-serif;font-weight:bold;">${value}</span>
      </td>
    </tr>
  `).join('')

  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="1" bordercolor="#bdcec8" bgcolor="#f4f7f5" style="background-color:#f4f7f5;border:1px solid #bdcec8;border-radius:8px;overflow:hidden;margin:24px 0;">
      ${rowsHtml}
    </table>
  `
}

// ─── sendInvitation ────────────────────────────────────────────────────────────

/**
 * Send an invitation email with RSVP button.
 * @param {{ invite: object, evenement: object, rsvpUrl: string }} params
 */
export async function sendInvitation({ invite, evenement, rsvpUrl, isReminder = false, token }) {
  const fullName = `${invite.prenom} ${invite.nom}`
  const escapeText = value => String(value || '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character])
  const customIntro = evenement.email_intro
    ? escapeText(evenement.email_intro).replace(/\n/g, '<br />')
    : (isReminder
        ? 'Nous vous rappelons que votre réponse à cette invitation est toujours attendue&nbsp;:'
        : 'Le <strong>Musée Virtuel de Guinée</strong> a le plaisir de vous convier à son prochain événement&nbsp;:')
  const customSignature = evenement.email_signature ? escapeText(evenement.email_signature).replace(/\n/g, '<br />') : '— L’équipe du Musée Virtuel de Guinée'

  const backendBase = (
    process.env.BACKEND_URL ||
    (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : null) ||
    process.env.RENDER_EXTERNAL_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '')
  const qrImgUrl = token ? `${backendBase}/api/invitations/qr/${token}.png` : null

  const body = `
    <!-- Greeting -->
    <p style="margin:0 0 8px;color:#b45332;font-size:13px;font-family:Arial, Helvetica, sans-serif;letter-spacing:1px;text-transform:uppercase;">
      ${isReminder ? 'Rappel d’invitation' : 'Invitation personnelle'}
    </p>
    <h2 style="margin:0 0 24px;color:#28336f;font-size:22px;font-weight:bold;font-family:Arial, Helvetica, sans-serif;">
      Cher(e) <strong>${fullName}</strong>,
    </h2>

    <p style="margin:0 0 16px;color:#121526;font-size:15px;line-height:1.7;font-family:Arial, Helvetica, sans-serif;">
      ${customIntro}
    </p>

    <!-- Event title -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#28336f" style="background-color:#28336f;margin:0 0 20px;"><tr><td align="center" bgcolor="#28336f" style="padding:20px 24px;text-align:center;">
      <h3 style="margin:0;color:#FFFFFF;font-size:20px;font-weight:normal;letter-spacing:0.5px;font-family:Arial,Helvetica,sans-serif;"><font color="#ffffff">
        ${evenement.titre}
      </font></h3>
    </td></tr></table>

    ${evenement.description ? `
    <p style="margin:0 0 20px;color:#121526;font-size:15px;line-height:1.7;font-family:Arial,Helvetica,sans-serif;">
      ${evenement.description}
    </p>
    ` : ''}

    ${eventBlock(evenement)}

    <!-- Organisation mention -->
    ${invite.organisation ? `
    <p style="margin:0 0 20px;color:#b45332;font-size:14px;font-style:italic;font-family:Arial,Helvetica,sans-serif;">
      En votre qualité de représentant(e) de <strong>${invite.organisation}</strong>${invite.titre_poste ? ` — ${invite.titre_poste}` : ''}.
    </p>
    ` : ''}

    ${qrImgUrl ? `
    <!-- QR Code pass -->
    <table role="presentation" width="100%" cellpadding="24" cellspacing="0" border="1" bordercolor="#bdcec8" bgcolor="#f4f7f5" style="background-color:#f4f7f5;border:2px solid #bdcec8;border-radius:10px;margin:24px 0;font-family:Arial,Helvetica,sans-serif;"><tr><td align="center" bgcolor="#f4f7f5" style="text-align:center;font-family:Arial,Helvetica,sans-serif;">
      <p style="margin:0 0 6px;color:#28336f;font-size:13px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">
        Votre pass d'accès (QR Code)
      </p>
      <p style="margin:0 0 16px;color:#121526;font-size:13px;">
        Présentez ce QR code à l'entrée de l'événement. Vous pouvez également confirmer votre présence en ligne ci-dessous :
      </p>
      <img
        src="${qrImgUrl}"
        alt="QR Code d'accès — ${evenement.titre}"
        width="180"
        height="180"
        align="center"
        style="display:block;margin:0 auto;border:6px solid #FFFFFF;border-radius:8px;"
      />
      <table role="presentation" align="center" cellpadding="12" cellspacing="0" border="0" bgcolor="#b45332" style="margin:20px auto 0;"><tr><td align="center" bgcolor="#b45332">
        <a href="${rsvpUrl}" style="color:#FFFFFF;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;"><font color="#ffffff">Confirmer ma présence en ligne →</font></a>
      </td></tr></table>
      <p style="margin:12px 0 0;color:#28336f;font-size:11px;">
        Réf. invitation : <code style="color:#b45332;background:#eef2ef;padding:2px 6px;border-radius:3px;">${token.substring(0, 8).toUpperCase()}</code>
      </p>
    </td></tr></table>
    ` : `
    <!-- RSVP section -->
    <table role="presentation" width="100%" cellpadding="24" cellspacing="0" border="1" bordercolor="#bdcec8" bgcolor="#f4f7f5" style="background-color:#f4f7f5;border:1px solid #bdcec8;border-radius:8px;margin:24px 0;"><tr><td align="center" bgcolor="#f4f7f5" style="text-align:center;">
      <p style="margin:0 0 8px;color:#28336f;font-size:13px;font-family:Arial,Helvetica,sans-serif;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">
        Merci de confirmer votre présence
      </p>
      <p style="margin:0 0 20px;color:#121526;font-size:13px;font-family:Arial,Helvetica,sans-serif;">
        Cliquez sur le bouton ci-dessous pour répondre à cette invitation.
      </p>
      <table role="presentation" align="center" cellpadding="14" cellspacing="0" border="0" bgcolor="#b45332"><tr><td align="center" bgcolor="#b45332">
        <a href="${rsvpUrl}" style="color:#FFFFFF;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;"><font color="#ffffff">Répondre à l'invitation →</font></a>
      </td></tr></table>
      <p style="margin:16px 0 0;color:#28336f;font-size:11px;font-family:Arial,Helvetica,sans-serif;">
        Ou copiez ce lien dans votre navigateur :<br />
        <span style="color:#b45332;">${rsvpUrl}</span>
      </p>
    </td></tr></table>
    `}

    <p style="margin:24px 0 0;color:#121526;font-size:14px;line-height:1.7;font-family:Arial,Helvetica,sans-serif;">
      Nous espérons avoir le plaisir de vous accueillir lors de cet événement.<br />
      <span style="color:#b45332;">${customSignature}</span>
    </p>
  `

  if (!process.env.BREVO_API_KEY && (!process.env.EMAIL_USER || !process.env.EMAIL_PASS)) {
    throw new Error('Les variables EMAIL_USER/EMAIL_PASS ou BREVO_API_KEY ne sont pas configurées.')
  }

  try {
    const info = await transporter.sendMail({
      from: getFromAddress(),
      to: invite.email,
      replyTo: process.env.CONTACT_EMAIL || 'musee@expertisefrance.fr',
      subject: isReminder ? `Rappel — ${evenement.email_sujet || `Invitation — ${evenement.titre}`}` : (evenement.email_sujet || `Invitation — ${evenement.titre}`),
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
    <h2 style="margin:0 0 16px;color:#28336f;font-size:22px;font-weight:normal;font-family:Arial,Helvetica,sans-serif;">
      Nouveau message de contact
    </h2>

    <p style="margin:0 0 16px;color:#121526;font-size:15px;line-height:1.7;font-family:Arial,Helvetica,sans-serif;">
      Une nouvelle demande a été envoyée depuis le site du Musée Virtuel de Guinée.
    </p>

    <div style="background-color:#f4f7f5;border:1px solid #bdcec8;border-radius:8px;padding:20px;margin:24px 0;font-family:Arial,Helvetica,sans-serif;">
      <p style="margin:0 0 8px;color:#b45332;font-size:13px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">Informations</p>
      <p style="margin:0 0 6px;color:#121526;font-size:14px;"><strong>Nom :</strong> ${prenom} ${nom}</p>
      <p style="margin:0 0 6px;color:#121526;font-size:14px;"><strong>Email :</strong> ${email}</p>
      <p style="margin:0 0 6px;color:#121526;font-size:14px;"><strong>Objet :</strong> ${sujet}</p>
      <p style="margin:12px 0 0;color:#121526;font-size:14px;line-height:1.7;"><strong>Message :</strong><br />${message.replace(/\n/g, '<br />')}</p>
    </div>

    <p style="margin:0;color:#121526;font-size:14px;line-height:1.7;font-family:Arial,Helvetica,sans-serif;">
      Merci de traiter cette demande dans les meilleurs délais.<br />
      <span style="color:#b45332;">— L'équipe du Musée Virtuel de Guinée</span>
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
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#b45332;margin:0 0 24px;"><tr><td style="padding:16px 24px;text-align:center;">
      <p style="margin:0;color:#FFFFFF;font-size:16px;font-family:Arial,Helvetica,sans-serif;font-weight:bold;">
        ✉️ Accusé de réception
      </p>
    </td></tr></table>

    <h2 style="margin:0 0 16px;color:#28336f;font-size:22px;font-weight:normal;font-family:Arial,Helvetica,sans-serif;">
      Bonjour ${prenom},
    </h2>

    <p style="margin:0 0 16px;color:#121526;font-size:15px;line-height:1.7;font-family:Arial,Helvetica,sans-serif;">
      Nous avons bien reçu votre message concernant le sujet <strong>"${sujet}"</strong>.
    </p>

    <p style="margin:0 0 16px;color:#121526;font-size:15px;line-height:1.7;font-family:Arial,Helvetica,sans-serif;">
      Notre équipe vous répondra dans les plus brefs délais (généralement sous 48h).
    </p>

    <p style="margin:24px 0 0;color:#121526;font-size:14px;line-height:1.7;font-family:Arial,Helvetica,sans-serif;">
      Cordialement,<br />
      <span style="color:#b45332;">— L'équipe du Musée Virtuel de Guinée</span>
    </p>
  `

  if (!process.env.BREVO_API_KEY && (!process.env.EMAIL_USER || !process.env.EMAIL_PASS)) {
    throw new Error('Les variables EMAIL_USER/EMAIL_PASS ou BREVO_API_KEY ne sont pas configurées.')
  }

  try {
    const info = await transporter.sendMail({
      from: getFromAddress(),
      to: email,
      replyTo: process.env.CONTACT_EMAIL || 'musee@expertisefrance.fr',
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

  // Build the backend base URL so the QR code image is accessible via a public HTTPS URL.
  // Brevo API does NOT support CID/inline attachments — only a real URL works universally.
  const backendBase = (
    process.env.BACKEND_URL ||
    (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : null) ||
    process.env.RENDER_EXTERNAL_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '')
  const qrImgUrl = `${backendBase}/api/invitations/qr/${token}.png`

  const body = `
    <!-- Success banner -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#3e502a;margin:0 0 24px;"><tr><td style="padding:16px 24px;text-align:center;">
      <p style="margin:0;color:#ffffff;font-size:16px;font-family:Arial,Helvetica,sans-serif;font-weight:bold;">
        ✅ Inscription confirmée !
      </p>
    </td></tr></table>

    <h2 style="margin:0 0 16px;color:#28336f;font-size:22px;font-weight:normal;font-family:Arial,Helvetica,sans-serif;">
      Cher(e) <strong>${fullName}</strong>,
    </h2>

    <p style="margin:0 0 16px;color:#121526;font-size:15px;line-height:1.7;font-family:Arial,Helvetica,sans-serif;">
      Nous avons bien enregistré votre participation à l'événement&nbsp;:
    </p>

    <!-- Event title -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#28336f;margin:0 0 20px;"><tr><td style="padding:20px 24px;text-align:center;">
      <h3 style="margin:0;color:#FFFFFF;font-size:20px;font-weight:normal;letter-spacing:0.5px;font-family:Arial,Helvetica,sans-serif;">
        ${evenement.titre}
      </h3>
    </td></tr></table>

    ${eventBlock(evenement)}

    <!-- QR Code section -->
    <div style="background-color:#f4f7f5;border:2px solid #bdcec8;border-radius:10px;padding:28px;margin:24px 0;text-align:center;font-family:Arial,Helvetica,sans-serif;">
      <p style="margin:0 0 6px;color:#28336f;font-size:13px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">
        Votre QR Code d'accès
      </p>
      <p style="margin:0 0 20px;color:#121526;font-size:13px;">
        Présentez ce code à l'entrée de l'événement pour valider votre présence.
      </p>
      <img
        src="${qrImgUrl}"
        alt="QR Code d'accès — ${evenement.titre}"
        width="200"
        height="200"
        style="display:block;margin:0 auto;border:6px solid #FFFFFF;border-radius:8px;"
      />
      <p style="margin:16px 0 0;color:#28336f;font-size:11px;">
        Réf. invitation : <code style="color:#b45332;background:#eef2ef;padding:2px 6px;border-radius:3px;">${token.substring(0, 8).toUpperCase()}</code>
      </p>
    </td></tr></table>

    <!-- Reminder box -->
    <div style="border-left:4px solid #b45332;padding:12px 16px;background-color:#f4f7f5;border-radius:0 6px 6px 0;margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;">
      <p style="margin:0;color:#28336f;font-size:13px;font-weight:bold;">
        Rappel important
      </p>
      <ul style="margin:8px 0 0;padding-left:18px;color:#121526;font-size:13px;line-height:1.8;">
        <li>Conservez cet e-mail ou faites une capture d'écran de votre QR code.</li>
        <li>Présentez-vous ${evenement.lieu ? `à <strong>${evenement.lieu}</strong>` : "au lieu indiqué"} le ${formatDateFr(evenement.date_debut)}.</li>
        <li>Le QR code est strictement personnel et non transférable.</li>
      </ul>
    </div>

    <p style="margin:0;color:#121526;font-size:14px;line-height:1.7;font-family:Arial,Helvetica,sans-serif;">
      Nous vous souhaitons une excellente journée et espérons vous voir bientôt.<br />
      <span style="color:#b45332;">— L'équipe du Musée Virtuel de Guinée</span>
    </p>
  `

  if (!process.env.BREVO_API_KEY && (!process.env.EMAIL_USER || !process.env.EMAIL_PASS)) {
    throw new Error('Les variables EMAIL_USER/EMAIL_PASS ou BREVO_API_KEY ne sont pas configurées.')
  }

  try {
    const info = await transporter.sendMail({
      from: getFromAddress(),
      to: invite.email,
      replyTo: process.env.CONTACT_EMAIL || 'musee@expertisefrance.fr',
      subject: `Confirmation — ${evenement.titre}`,
      html: emailShell(body, 'CONFIRMATION'),
      attachments: qrCodeDataUrl ? [
        {
          filename: 'qr-code-mvg.png',
          content: qrCodeDataUrl.includes(',') ? qrCodeDataUrl.split(',')[1] : qrCodeDataUrl
        }
      ] : []
    })
    return info
  } catch (error) {
    throw new Error(`Erreur d'envoi d'e-mail : ${error.message}`)
  }
}

export async function sendNewsletterWelcome({ email }) {
  const body = `
    <!-- Success banner -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#b45332;margin:0 0 24px;"><tr><td style="padding:16px 24px;text-align:center;">
      <p style="margin:0;color:#FFFFFF;font-size:16px;font-family:Arial,Helvetica,sans-serif;font-weight:bold;">
        🎉 Bienvenue dans notre communauté !
      </p>
    </td></tr></table>

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
      replyTo: process.env.CONTACT_EMAIL || 'musee@expertisefrance.fr',
      subject: "Bienvenue à la newsletter du Musée Virtuel de Guinée !",
      html: emailShell(body, 'BIENVENUE')
    })
    return info
  } catch (error) {
    throw new Error(`Erreur d'envoi d'e-mail : ${error.message}`)
  }
}

// ─── sendNewsletterCampaign ───────────────────────────────────────────────────

export function generateNewsletterHtml({ titre, description, imageUrl, linkUrl, contenuPersonnalise }) {
  let body = '';

  if (contenuPersonnalise) {
    // Manual newsletter
    body = `
      <h2 style="margin:0 0 16px;color:#28336f;font-size:22px;font-weight:normal;font-family:Arial,Helvetica,sans-serif;">
        ${titre}
      </h2>
      <div style="margin:0 0 16px;color:#121526;font-size:15px;line-height:1.7;font-family:Arial,Helvetica,sans-serif;">
        ${contenuPersonnalise.replace(/\n/g, '<br />')}
      </div>
    `;
    if (linkUrl) {
      body += `
        <div style="text-align:center;margin:32px 0;">
          <a href="${linkUrl}" style="display:inline-block;background-color:#b45332;color:#FFFFFF;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;padding:14px 36px;border-radius:6px;letter-spacing:0.5px;">
            Découvrir
          </a>
        </div>
      `;
    }
  } else {
    // Actualite or Event
    body = `
      ${imageUrl ? `
        <div style="text-align:center;margin-bottom:24px;">
          <img src="${imageUrl}" alt="${titre}" width="600" style="max-width:100%;width:100%;height:auto;border-radius:8px;" />
        </div>
      ` : ''}
      <h2 style="margin:0 0 16px;color:#28336f;font-size:22px;font-weight:normal;font-family:Arial,Helvetica,sans-serif;">
        ${titre}
      </h2>
      <p style="margin:0 0 24px;color:#121526;font-size:15px;line-height:1.7;font-family:Arial,Helvetica,sans-serif;">
        ${description}
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${linkUrl}" style="display:inline-block;background-color:#b45332;color:#FFFFFF;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;padding:14px 36px;border-radius:6px;letter-spacing:0.5px;">
          Lire la suite
        </a>
      </div>
    `;
  }
  return emailShell(body, 'NEWSLETTER');
}

/**
 * Send a newsletter campaign to multiple emails.
 */
export async function sendNewsletterCampaign({ emails, subject, titre, description, imageUrl, linkUrl, contenuPersonnalise, isBulletin, bulletinData }) {
  let htmlContent = '';
  
  if (isBulletin && bulletinData) {
    htmlContent = generateBulletinHtml(bulletinData);
  } else {
    htmlContent = generateNewsletterHtml({ titre, description, imageUrl, linkUrl, contenuPersonnalise });
  }

  if (!process.env.BREVO_API_KEY && (!process.env.EMAIL_USER || !process.env.EMAIL_PASS)) {
    throw new Error('Les variables EMAIL_USER/EMAIL_PASS ou BREVO_API_KEY ne sont pas configurées.')
  }

  let successCount = 0;
  let failCount = 0;
  let failedEmails = [];

  // Envoyer par lots de 10 pour aller beaucoup plus vite sans surcharger
  const chunkSize = 10;
  for (let i = 0; i < emails.length; i += chunkSize) {
    const chunk = emails.slice(i, i + chunkSize);
    
    await Promise.all(chunk.map(async (email) => {
      try {
        await transporter.sendMail({
          from: getFromAddress(),
          to: email,
          replyTo: process.env.CONTACT_EMAIL || 'musee@expertisefrance.fr',
          subject: subject,
          html: htmlContent
        });
        successCount++;
      } catch (error) {
        console.error(`Erreur d'envoi newsletter à ${email}:`, error.message);
        failCount++;
        failedEmails.push(email);
      }
    }));
  }

  return { successCount, failCount, failedEmails };
}

// ─── generateBulletinHtml ───────────────────────────────────────────────────

export function generateBulletinHtml(data) {
  const {
    edition = '',
    editoTitre = '',
    editoTexte = '',
    editoAuteurNom = '',
    editoAuteurRole = '',
    editoAuteurInitiales = '',
    editoBref = [],
    actus = [], // array of { tag, titre, description, linkUrl, imageUrl }
    zoomTitre = '',
    zoomTexte = '',
    zoomMedia = [], // array of { type: 'image' | 'video', url: string, link: string }
    galerie = null, // { titre: string, medias: Array<{ type, url, link, titre, description }> }
    etapes = [] // array of { titre, desc }
  } = data;

  // Édito : tous les paragraphes sont toujours affichés intégralement.
  // Le mécanisme toggle (checkbox hack) est supprimé — il n'est pas fiable
  // dans les clients mail et génère des artefacts visuels ([ ], boutons morts).
  let editoHtml = '';
  const paragraphs = editoTexte.split(/\r?\n/).map(p => p.trim()).filter(Boolean);
  if (paragraphs.length === 0) {
    editoHtml = `<p style="font-size: 14px; line-height: 1.75; color: #4A3020; margin-bottom: 10px; margin-top: 0;">${editoTexte.replace(/\n/g, '<br />')}</p>`;
  } else {
    editoHtml = paragraphs.map(p =>
      `<p style="font-size: 14px; line-height: 1.75; color: #4A3020; margin-bottom: 10px; margin-top: 0;">${p.replace(/\n/g, '<br />')}</p>`
    ).join('');
  }

  // ─── Galerie de fin : carrousel horizontal pour tous les clients modernes,
  // fallback grille 2 colonnes en table pour Outlook Desktop (Windows) via [if mso] ───
  let galerieHtml = '';
  if (galerie && galerie.medias && galerie.medias.length > 0) {
    const medias = galerie.medias;

    // ── Carte de Galerie pour Outlook (MSO) ───────────────────────────────────
    // On force des styles de largeur/hauteur fixes absolus (ex: width:260px;height:160px) avec l'offset de 1px
    // pour empêcher Outlook de recalculer l'image à 100% de la cellule parent (288px), ce qui dupliquerait le cache.
    const renderMsoGalerieCard = (media, index) => {
      const w = 260 + (index % 4);
      const h = 160 + (Math.floor(index / 4) % 4);
      const btnHtml = media.type === 'video'
        ? `<a href="${media.link || media.url}" target="_blank" style="display:inline-block;background:#da373d;color:#FFFFFF;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;text-decoration:none;padding:6px 16px;border-radius:4px;border:1px solid #da373d;">▶ Visionner</a>`
        : (media.link ? `<a href="${media.link}" target="_blank" style="display:inline-block;background:#b45332;color:#FFFFFF;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;text-decoration:none;padding:6px 16px;border-radius:4px;border:1px solid #b45332;">En savoir plus</a>` : '');
      
      return `
      <a href="${media.link || media.url}" target="_blank" style="text-decoration:none;display:block;text-align:center;">
        <img src="${media.url}" width="${w}" height="${h}" style="width:${w}px;height:${h}px;display:block;margin:0 auto;border-radius:6px;" alt="Galerie" />
      </a>
      <h4 style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#28336f;margin:12px 0 6px 0;line-height:1.3;text-align:left;">${media.titre || ''}</h4>
      ${media.description ? `<p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#b45332;line-height:1.45;margin:0 0 12px 0;text-align:left;">${media.description}</p>` : ''}
      <div style="text-align:center;margin-top:8px;">${btnHtml}</div>
      `;
    };

    // ── Carte de Galerie pour les clients web et mobiles standards ───────────
    const renderCarouselGalerieCard = (media) => {
      const btnHtml = media.type === 'video'
        ? `<a href="${media.link || media.url}" target="_blank" style="display:inline-block;background:#da373d;color:#FFFFFF;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;text-decoration:none;padding:6px 16px;border-radius:4px;border:1px solid #da373d;">▶ Visionner</a>`
        : (media.link ? `<a href="${media.link}" target="_blank" style="display:inline-block;background:#b45332;color:#FFFFFF;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;text-decoration:none;padding:6px 16px;border-radius:4px;border:1px solid #b45332;">En savoir plus</a>` : '');
      
      return `
      <a href="${media.link || media.url}" target="_blank" style="text-decoration:none;display:block;text-align:center;">
        <img src="${media.url}" width="260" height="160" style="width:100%;max-width:260px;height:160px;object-fit:cover;border-radius:6px;display:block;margin:0 auto;" alt="Galerie" />
      </a>
      <h4 style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#28336f;margin:12px 0 6px 0;line-height:1.3;text-align:left;">${media.titre || ''}</h4>
      ${media.description ? `<p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#b45332;line-height:1.45;margin:0 0 12px 0;text-align:left;">${media.description}</p>` : ''}
      <div style="text-align:center;margin-top:8px;">${btnHtml}</div>
      `;
    };

    // Fallback Outlook / MSO : grille 2 colonnes en tables fixes, images standard avec offsets absolus en pixel
    const rows = [];
    for (let i = 0; i < medias.length; i += 2) {
      rows.push({
        left: { media: medias[i], index: i },
        right: medias[i+1] ? { media: medias[i+1], index: i+1 } : null
      });
    }
    const msoGrid = `
    <table cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;table-layout:fixed;">
      ${rows.map(row => `
      <tr>
        <td width="288" valign="top" style="padding-bottom:20px;width:288px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid rgba(40,51,111,0.15);overflow:hidden;background:#f4f7f5;">
            <tr><td style="padding:12px;text-align:center;">${renderMsoGalerieCard(row.left.media, row.left.index)}</td></tr>
          </table>
        </td>
        <td width="24" style="width:24px;"></td>
        <td width="288" valign="top" style="padding-bottom:20px;width:288px;">
          ${row.right ? `
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid rgba(40,51,111,0.15);overflow:hidden;background:#f4f7f5;">
            <tr><td style="padding:12px;text-align:center;">${renderMsoGalerieCard(row.right.media, row.right.index)}</td></tr>
          </table>` : ''}
        </td>
      </tr>`).join('')}
    </table>
    `;

    // Carrousel horizontal : Gmail, Apple Mail, Outlook.com, Yahoo, mobile
    const carousel = `
    <div class="carousel-scroll" style="overflow-x:auto;-webkit-overflow-scrolling:touch;white-space:nowrap;">
      ${medias.map((media) => `
      <div class="carousel-item" style="display:inline-block;white-space:normal;vertical-align:top;width:85%;max-width:280px;margin-right:16px;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid rgba(40,51,111,0.15);border-radius:8px;overflow:hidden;background:#f4f7f5;">
          <tr><td style="padding:12px;text-align:center;">${renderCarouselGalerieCard(media)}</td></tr>
        </table>
      </div>`).join('')}
    </div>
    `;

    galerieHtml = `
      <!--[if mso]>
      ${msoGrid}
      <![endif]-->
      <!--[if !mso]><!-->
      ${carousel}
      <!--<![endif]-->
    `;
  }

  const body = `
  <!-- ████ SOMMAIRE ████ -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td class="mobile-pad" style="background-color:#28336f;padding:18px 40px;text-align:center;">
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#b45332;margin:0 0 12px 0;">Sommaire</p>
    <div style="font-family:Arial,Helvetica,sans-serif; font-size: 13px; line-height: 2;">
      <a href="#edito" style="color: rgba(255,255,255,0.85); text-decoration: none; border-bottom: 1px solid rgba(180,83,50,0.3); padding-bottom: 1px;">L'Édito</a>
      &nbsp;&nbsp;<span style="color: rgba(255,255,255,0.2);">·</span>&nbsp;&nbsp;
      <a href="#actualites" style="color: rgba(255,255,255,0.85); text-decoration: none; border-bottom: 1px solid rgba(180,83,50,0.3); padding-bottom: 1px;">Actualités du projet</a>
      &nbsp;&nbsp;<span style="color: rgba(255,255,255,0.2);">·</span>&nbsp;&nbsp;
      <a href="#zoom" style="color: rgba(255,255,255,0.85); text-decoration: none; border-bottom: 1px solid rgba(180,83,50,0.3); padding-bottom: 1px;">Zoom sur…</a>
      &nbsp;&nbsp;<span style="color: rgba(255,255,255,0.2);">·</span>&nbsp;&nbsp;
      <a href="#nextstep" style="color: rgba(255,255,255,0.85); text-decoration: none; border-bottom: 1px solid rgba(180,83,50,0.3); padding-bottom: 1px;">Prochaines étapes</a>
      ${galerie && galerie.medias && galerie.medias.length > 0 ? `
      &nbsp;&nbsp;<span style="color: rgba(255,255,255,0.2);">·</span>&nbsp;&nbsp;
      <a href="#galerie" style="color: rgba(255,255,255,0.85); text-decoration: none; border-bottom: 1px solid rgba(180,83,50,0.3); padding-bottom: 1px;">${galerie.titre || 'Galerie'}</a>
      ` : ''}
    </div>
  </div>

  <!-- ████ EDITO ████ -->
  <a name="edito"></a>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td id="edito" class="mobile-pad" style="padding:40px 40px 32px;background-color:#f4f7f5;border-top:1px solid rgba(40,51,111,0.12);">
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:9.5px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#da373d;margin:0 0 14px 0;border-left:3px solid #b45332;padding-left:8px;">L'Édito</div>
    <div>
      <div style="margin-bottom: 24px;">
        <h2 style="font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:700;color:#28336f;line-height:1.2;margin:0 0 14px 0;">${editoTitre}</h2>
        ${editoHtml}
        <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 18px;">
          <tr>
            <td width="38" height="38" align="center" valign="middle" style="width: 38px; height: 38px; border-radius: 50%; background: #da373d; font-family: 'Playfair Display', serif; font-size: 15px; color: #FFFFFF; font-weight: 700; text-align: center; mso-line-height-rule: exactly;">
              <span style="line-height: 38px; display: block; margin: 0; padding: 0;">${editoAuteurInitiales}</span>
            </td>
            <td width="12"></td>
            <td valign="middle">
              <strong style="display: block; font-size: 12px; font-weight: 700; color: #28336f; margin: 0;">${editoAuteurNom}</strong>
              <span style="font-size: 11px; color: #b45332; margin: 0;">${editoAuteurRole}</span>
            </td>
          </tr>
        </table>
      </div>
      ${editoBref.length > 0 ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#28336f;padding:20px 18px;margin-top:24px;"><tr><td style="padding:20px 18px;">
        <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#b45332;margin:0 0 14px 0;padding-bottom:8px;border-bottom:1px solid rgba(180,83,50,0.25);">📌 En bref ce mois-ci</p>
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          ${editoBref.map(item => {
            const label = typeof item === 'string' ? item : (item.text || '');
            const href  = typeof item === 'object' && item.url ? item.url : null;
            const inner = href
              ? `<a href="${href}" target="_blank" style="color:#b45332;text-decoration:underline;font-weight:700;">${label}</a>`
              : label;
            return `
          <tr>
            <td width="16" valign="top" style="color:#b45332;font-size:12px;padding-top:2px;">&#9658;</td>
            <td valign="top" style="font-size:12px;color:rgba(255,255,255,0.9);line-height:1.6;padding-bottom:10px;">${inner}</td>
          </tr>`;
          }).join('')}
        </table>
      </div>
      ` : ''}
    </div>
  </div>

  <!-- ████ ACTUALITES ████ -->
  ${actus.length > 0 ? `
  <a name="actualites"></a>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td id="actualites" class="mobile-pad" style="padding:36px 40px;background-color:#FFFFFF;">
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:9.5px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#da373d;margin:0 0 14px 0;border-left:3px solid #b45332;padding-left:8px;">Actualités du projet</div>
    <h2 style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;color:#28336f;margin:0 0 24px 0;">Ce qui s'est passé ce mois-ci</h2>
    <div style="display:block;">
      ${actus.map((actu, index) => `
      <div style="border: 1px solid rgba(40,51,111,0.15); border-radius: 2px; overflow: hidden; margin-bottom: 16px; background: #ffffff;">
        <div style="height: 8px; background: ${index === 0 ? '#da373d' : (index === 1 ? '#b45332' : '#bdcec8')};"></div>
        ${actu.imageUrl ? `<img src="${actu.imageUrl}" width="598" height="250" style="width: 100%; max-width: 598px; height: 250px; object-fit: cover; display: block;" alt="Actualité" />` : ''}
        <div style="padding: 16px;">
          <p style="font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: ${index === 0 ? '#da373d' : (index === 1 ? '#b45332' : '#3e502a')}; margin: 0 0 6px 0;">${actu.tag || 'Actualité'}</p>
          <h3 style="font-family:Arial,Helvetica,sans-serif; font-size: 16px; font-weight: 700; color: #28336f; margin: 0 0 8px 0; line-height: 1.3;">${actu.titre}</h3>
          <p style="font-size: 13px; color: #5A3E28; line-height: 1.6; margin: 0 0 12px 0;">${actu.description}</p>
          <a href="${actu.linkUrl}" style="color:#da373d; font-size:12px; font-weight:bold; text-decoration:none;">Lire la suite →</a>
        </div>
      </div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  <!-- ████ ZOOM SUR ████ -->
  ${zoomTitre ? `
  <a name="zoom"></a>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td id="zoom" class="mobile-pad" style="padding:36px 40px;background-color:#28336f;">
    <div>
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:9.5px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#da373d;margin:0 0 14px 0;border-left:3px solid #b45332;padding-left:8px;">Zoom sur…</div>
      <h2 style="font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:700;color:#FFFFFF;margin:0 0 12px 0;">${zoomTitre}</h2>
      <p style="color: #FFFFFF;">${zoomTexte.replace(/\n/g, '<br />')}</p>
      
      <!-- Médias Zoom (Email-safe stacked layout + beautiful CSS slide carousel in modern web/preview views) -->
      ${zoomMedia && zoomMedia.length > 0 ? `
      <div style="margin-top:24px;">
        <!--[if mso]>
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;table-layout:fixed;">
          ${zoomMedia.map((media, index) => {
            const w = 540 + (index % 4);
            const h = 260 + (Math.floor(index / 4) % 4);
            const btnHtml = media.type === 'video'
              ? `<a href="${media.link || media.url}" target="_blank" style="display:inline-block;background:#b45332;color:#FFFFFF;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;padding:8px 18px;border-radius:4px;border:1px solid #b45332;">&#9658; Visionner la Vidéo</a>`
              : (media.link ? `<a href="${media.link}" target="_blank" style="display:inline-block;background:rgba(255,255,255,0.15);color:#FFFFFF;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;text-decoration:none;padding:8px 18px;border-radius:4px;border:1px solid rgba(255,255,255,0.25);">Découvrir &#8594;</a>` : '');
            return `
            <tr>
              <td style="padding-bottom:16px;text-align:center;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:rgba(255,255,255,0.06);border-radius:8px;border:1px solid rgba(255,255,255,0.12);overflow:hidden;">
                  <tr>
                    <td style="padding:12px;text-align:center;">
                      <a href="${media.link || media.url}" target="_blank" style="text-decoration:none;display:block;">
                        <img src="${media.url}" width="${w}" height="${h}" style="width:${w}px;height:${h}px;display:block;margin:0 auto;border-radius:6px;" alt="Média Zoom" />
                      </a>
                      ${btnHtml ? `<div style="text-align:center;margin-top:12px;">${btnHtml}</div>` : ''}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>`;
          }).join('')}
        </table>
        <![endif]-->
        
        <!--[if !mso]><!-->
        <div class="carousel-scroll" style="overflow-x: auto; -webkit-overflow-scrolling: touch; white-space: nowrap;">
          ${zoomMedia.map((media, idx) => {
            const w = 540 + (idx % 4);
            const h = 260 + (Math.floor(idx / 4) % 4);
            return `
          <div class="carousel-item" style="display: inline-block; white-space: normal; vertical-align: top; width: 85%; max-width: 540px; margin-right: 16px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: rgba(255,255,255,0.06); border-radius: 8px; border: 1px solid rgba(255,255,255,0.12); overflow: hidden;">
              <tr>
                <td style="padding: 12px; text-align: center;">
                  <a href="${media.link || media.url}" target="_blank" style="text-decoration: none; display: block;">
                    <img src="${media.url}" width="${w}" height="${h}" style="width: 100%; max-width:${w}px; height:${h}px; object-fit: cover; border-radius: 6px; display: block; margin: 0 auto;" alt="Média Zoom" />
                  </a>
                  ${media.type === 'video' ? `
                  <div style="text-align: center; margin-top: 12px;">
                    <a href="${media.link || media.url}" target="_blank" style="display: inline-block; background: #b45332; color: #FFFFFF; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; text-decoration: none; padding: 8px 18px; border-radius: 4px; border: 1px solid #b45332;">▶ Visionner la Vidéo</a>
                  </div>
                  ` : (media.link ? `
                  <div style="text-align: center; margin-top: 12px;">
                    <a href="${media.link}" target="_blank" style="display: inline-block; background: rgba(255,255,255,0.15); color: #FFFFFF; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; text-decoration: none; padding: 8px 18px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.25);">Découvrir →</a>
                  </div>
                  ` : '')}
                </td>
              </tr>
            </table>
          </div>
          `;}).join('')}
        </div>
        <!--<![endif]-->
      </div>
      ` : ''}
    </div>
  </div>
  ` : ''}

  <!-- ████ NEXT STEP ████ -->
  ${etapes.length > 0 ? `
  <a name="nextstep"></a>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td id="nextstep" class="mobile-pad" style="padding:36px 40px;background-color:#f4f7f5;">
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:9.5px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#da373d;margin:0 0 14px 0;border-left:3px solid #b45332;padding-left:8px;">Prochaines étapes</div>
    <h2 style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:700;color:#28336f;margin:0 0 20px 0;">Au programme du mois prochain</h2>
    <table cellpadding="0" cellspacing="0" border="0" width="100%">
      ${etapes.map((etape, index) => `
      <tr>
        <td width="30" valign="top" style="padding-bottom: 16px;">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="30" height="30" align="center" valign="middle" style="background: #da373d; color: #FFFFFF; font-family: 'Playfair Display', serif; font-size: 14px; font-weight: 700; border-radius: 50%; text-align: center; mso-line-height-rule: exactly;">
                <span style="line-height: 30px; display: block; margin: 0; padding: 0;">${index + 1}</span>
              </td>
            </tr>
          </table>
        </td>
        <td width="14" style="padding-bottom: 16px;"></td>
        <td valign="top" style="padding-bottom: 16px; padding-top: 4px;">
          <strong style="display: block; font-size: 14px; font-weight: 700; color: #28336f; margin: 0 0 4px 0;">${etape.titre}</strong>
          <span style="display: block; font-size: 13px; color: #6A4830; line-height: 1.55; margin: 0;">${etape.desc}</span>
        </td>
      </tr>
      `).join('')}
    </table>
  </div>
  ` : ''}

  <!-- ████ GALERIE VISUELLE DE FIN ████ -->
  ${galerie && galerie.medias && galerie.medias.length > 0 ? `
  <a name="galerie"></a>
  <div class="galerie mobile-padding" id="galerie" style="padding: 36px 40px; background: #FFFFFF; border-top: 1px solid rgba(40,51,111,0.12);">
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:9.5px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#da373d;margin:0 0 14px 0;border-left:3px solid #b45332;padding-left:8px;">${galerie.titre || 'Visuels'}</div>
    <h2 style="font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 900; color: #28336f; margin-bottom: 24px; margin-top: 0;">${galerie.titre || 'Rétrospective visuelle'}</h2>
    
    ${galerieHtml}
  </div>
  ` : ''}
  `;

  // Wrap in the shell with isFullWidth = true
  return emailShell(body, {
    title: "Le Patrimoine Guinéen à l'ère Numérique",
    label: "NEWSLETTER MENSUELLE",
    edition: edition || "Édition",
    isFullWidth: true
  });
}