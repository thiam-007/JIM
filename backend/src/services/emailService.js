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
function emailShell(bodyContent, options = {}) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  
  // Handle retro-compatibility where options was just a string title
  const title = typeof options === 'string' ? options : (options.title || 'NOTIFICATION');
  const edition = options.edition || 'Musée Virtuel de Guinée';
  const label = options.label || 'NOTIFICATION';
  const isFullWidth = options.isFullWidth || false;
  
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Musée Virtuel de Guinée</title>
  <style type="text/css">
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
    body { background-color: #E8DDD3; font-family: 'Lato', sans-serif; padding: 30px 0; margin: 0; }
    .wrapper { max-width: 680px; margin: 0 auto; background: #FFFFFF; border-radius: 2px; overflow: hidden; box-shadow: 0 8px 40px rgba(89,55,22,0.18); }
    .header { position: relative; background-color: #593716; min-height: 190px; overflow: hidden; }
    .header-pattern { position: absolute; inset: 0; background-image: url('${frontendUrl}/images/motif-removebg-preview.png'); background-size: 260px auto; background-repeat: repeat; opacity: 0.15; }
    .header-overlay { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(89,55,22,0.85) 0%, rgba(132,89,54,0.7) 100%); }
    .header-text h1 em { color: #F9B233; font-style: italic; }
    .header-text .edition { font-size: 11px; font-weight: 300; letter-spacing: 1.5px; color: rgba(255,255,255,0.6); margin-top: 8px; }
    .gold-band { background: #F9B233; height: 8px; }
    
    /* Footer */
    .footer { background: #593716; padding: 32px 40px 24px; position: relative; overflow: hidden; }
    .footer::after { content: ''; position: absolute; inset: 0; background-image: url('${frontendUrl}/images/motif-removebg-preview.png'); background-size: 180px; opacity: 0.15; }
    .footer-inner { position: relative; z-index: 1; }
    .footer-bottom { text-align: center; font-size: 10px; color: rgba(255,255,255,0.3); margin-top: 16px; }
    .footer-bottom a { color: rgba(255,255,255,0.4); text-decoration: none; }
    .or-bar-bottom { height: 5px; background: linear-gradient(to right, #593716, #F9B233, #B1222A, #F9B233, #593716); }
    
    /* Bulletin specific styles */
    .sommaire { background: #593716; padding: 18px 40px; }
    .sommaire-label { font-size: 9px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #F9B233; margin-bottom: 10px; }
    .sommaire-links { display: flex; flex-wrap: wrap; gap: 6px 20px; }
    .sommaire-links a { font-family: 'Lato', sans-serif; font-size: 12px; font-weight: 400; color: rgba(255,255,255,0.80); text-decoration: none; border-bottom: 1px solid rgba(249,178,51,0.3); padding-bottom: 1px; }
    .sommaire-links .sep { color: rgba(255,255,255,0.2); font-size: 11px; }
    
    .section-label { display: inline-flex; align-items: center; gap: 8px; font-size: 9.5px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: #B1222A; margin-bottom: 14px; }
    .section-label::before { content: ''; display: block; width: 22px; height: 2px; background: #F9B233; }
    
    .edito { padding: 40px 40px 32px; background: #FAF6F1; border-top: 1px solid rgba(132,89,54,0.12); }
    .edito h2 { font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 900; color: #593716; line-height: 1.2; margin-bottom: 14px; margin-top: 0; }
    .edito p { font-size: 14px; line-height: 1.75; color: #4A3020; margin-bottom: 10px; }
    .edito-author { margin-top: 18px; display: flex; align-items: center; gap: 10px; }
    .edito-author-avatar { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, #845936, #B1222A); display: flex; align-items: center; justify-content: center; font-family: 'Playfair Display', serif; font-size: 15px; color: #FFFFFF; font-weight: 700; line-height: 38px; text-align: center; }
    .edito-author-info strong { display: block; font-size: 12px; font-weight: 700; color: #593716; }
    .edito-author-info span { font-size: 11px; color: #845936; }
    .edito-aside { background: #593716; border-radius: 2px; padding: 20px 18px; margin-top: 24px; }
    .edito-aside .aside-title { font-family: 'Playfair Display', serif; font-size: 13px; font-weight: 700; color: #F9B233; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid rgba(249,178,51,0.25); margin-top: 0; }
    .edito-aside ul { list-style: none; display: flex; flex-direction: column; gap: 10px; padding: 0; margin: 0; }
    .edito-aside ul li { font-size: 12px; color: rgba(255,255,255,0.8); line-height: 1.5; padding-left: 12px; position: relative; }
    .edito-aside ul li::before { content: '▸'; position: absolute; left: 0; color: #F9B233; font-size: 10px; }
    
    .actualites { padding: 36px 40px; background: #FFFFFF; }
    .actualites h2 { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 900; color: #593716; margin-bottom: 24px; margin-top: 0; }
    .actu-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .actu-card { border: 1px solid rgba(132,89,54,0.15); border-radius: 2px; overflow: hidden; }
    .actu-card-top { height: 8px; background: #B1222A; }
    .actu-card.secondary .actu-card-top { background: #845936; }
    .actu-card.tertiary .actu-card-top { background: #F9B233; }
    .actu-card-body { padding: 16px; }
    .actu-tag { font-size: 9px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #B1222A; margin-bottom: 6px; margin-top: 0; }
    .actu-card.secondary .actu-tag { color: #845936; }
    .actu-card.tertiary .actu-tag { color: #8C3B2A; }
    .actu-card h3 { font-family: 'Playfair Display', serif; font-size: 14px; font-weight: 700; color: #593716; margin-bottom: 8px; margin-top: 0; line-height: 1.3; }
    .actu-card p { font-size: 12px; color: #5A3E28; line-height: 1.6; margin: 0; }
    .actu-card-full { grid-column: 1 / -1; }
    .actu-card-img { width: 100%; height: 140px; object-fit: cover; }
    
    .zoom { background: linear-gradient(135deg, #593716 0%, #382116 100%); padding: 36px 40px; position: relative; overflow: hidden; }
    .zoom-inner { position: relative; z-index: 1; }
    .zoom-inner .section-label { color: #F9B233; }
    .zoom-inner .section-label::before { background: #F9B233; }
    .zoom h2 { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 900; color: #FFFFFF; margin-bottom: 12px; margin-top: 0; }
    .zoom p { font-size: 13.5px; color: rgba(255,255,255,0.82); line-height: 1.75; margin-bottom: 14px; margin-top: 0; }
    .zoom-cta { display: inline-block; margin-top: 8px; background: #F9B233; color: #382116; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; padding: 10px 22px; border-radius: 1px; }
    
    .nextstep { background: #FAF6F1; padding: 36px 40px; }
    .nextstep h2 { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 900; color: #593716; margin-bottom: 20px; margin-top: 0; }
    
    @media (max-width: 600px) {
      .actu-grid { display: block; }
    }
  </style>
</head>
<body>
<div class="wrapper">
  <!-- HEADER -->
  <div class="header">
    <div class="header-pattern"></div>
    <div class="header-overlay"></div>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="position: relative; z-index: 2; padding: 36px 40px 32px;">
      <tr>
        <td width="90" valign="top" align="center" style="width:90px;">
          <img src="${frontendUrl}/images/logo.jpeg" alt="Musée Virtuel de Guinée" width="90" height="90" style="width: 90px; height: 90px; object-fit: cover; border-radius: 50%; border: 2px solid #F9B233; display: block;" />
        </td>
        <td width="24" style="width: 24px;"></td>
        <td valign="middle" style="border-left: 3px solid #F9B233; padding-left: 24px;">
          <p style="font-family: 'Lato', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 3.5px; text-transform: uppercase; color: #F9B233; margin: 0 0 6px 0;">${label}</p>
          <h1 style="font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 900; color: #FFFFFF; line-height: 1.25; margin: 0;">${title.replace('N°', 'N°&nbsp;')}</h1>
          <p style="font-size: 12px; font-weight: 300; letter-spacing: 1.5px; color: rgba(255,255,255,0.6); margin: 8px 0 0 0;">${edition}</p>
        </td>
      </tr>
    </table>
  </div>
  <div class="gold-band"></div>

  <!-- BODY -->
  ${isFullWidth ? bodyContent : '<div style="padding: 40px; background: #FAF6F1; color: #4A3020; line-height: 1.7; font-size: 15px;">' + bodyContent + '</div>'}

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-inner">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom: 1px solid rgba(249,178,51,0.2); padding-bottom: 20px; margin-bottom: 18px;">
        <tr>
          <td valign="top" align="center" style="padding-bottom: 16px;">
            <img src="${frontendUrl}/images/logo.jpeg" alt="MVG" width="70" height="70" style="width: 70px; height: 70px; border-radius: 50%; border: 2px solid #F9B233; display: block; margin: 0 auto; object-fit: cover;">
            <p style="margin: 12px auto 0; font-size: 11px; color: rgba(255,255,255,0.4); line-height: 1.5; max-width: 240px; text-align: center;">Musée Virtuel de Guinée — Préserver et diffuser le patrimoine culturel guinéen.</p>
          </td>
        </tr>
        <tr>
          <td valign="top" align="center">
            <h4 style="font-size: 10px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: #F9B233; margin: 0 0 12px 0;">Suivez-nous</h4>
            <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
              <tr>
                <td align="center" style="padding: 0 6px;">
                  <a href="https://www.facebook.com/profile.php?id=61584717626322" style="text-decoration:none; display:block;">
                    <img src="https://img.icons8.com/ios-filled/36/F9B233/facebook-new.png" alt="Facebook" width="36" height="36" style="display:block; border:none;" />
                  </a>
                </td>
                <td align="center" style="padding: 0 6px;">
                  <a href="https://www.instagram.com/museevirtuelguinee" style="text-decoration:none; display:block;">
                    <img src="https://img.icons8.com/ios-filled/36/F9B233/instagram-new.png" alt="Instagram" width="36" height="36" style="display:block; border:none;" />
                  </a>
                </td>
                <td align="center" style="padding: 0 6px;">
                  <a href="${frontendUrl}" style="text-decoration:none; display:block;">
                    <img src="https://img.icons8.com/ios-filled/36/F9B233/domain.png" alt="Web" width="36" height="36" style="display:block; border:none;" />
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <div class="footer-bottom">
        <span style="display:block; text-align:center;">© ${new Date().getFullYear()} Musée Virtuel de Guinée — Tous droits réservés</span>
      </div>
    </div>
  </div>
  <div class="or-bar-bottom"></div>
</div>
</body>
</html>`;
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

// ─── sendNewsletterCampaign ───────────────────────────────────────────────────

export function generateNewsletterHtml({ titre, description, imageUrl, linkUrl, contenuPersonnalise }) {
  let body = '';

  if (contenuPersonnalise) {
    // Manual newsletter
    body = `
      <h2 style="margin:0 0 16px;color:#3a2010;font-size:22px;font-weight:normal;">
        ${titre}
      </h2>
      <div style="margin:0 0 16px;color:#4a3020;font-size:15px;line-height:1.7;">
        ${contenuPersonnalise.replace(/\n/g, '<br />')}
      </div>
    `;
    if (linkUrl) {
      body += `
        <div style="text-align:center;margin:32px 0;">
          <a href="${linkUrl}" style="display:inline-block;background:linear-gradient(135deg,#f9b233,#e09820);color:#3a2010;text-decoration:none;font-family:'Arial',sans-serif;font-size:15px;font-weight:bold;padding:14px 36px;border-radius:6px;letter-spacing:0.5px;">
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
          <img src="${imageUrl}" alt="${titre}" style="max-width:100%;height:auto;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.1);" />
        </div>
      ` : ''}
      <h2 style="margin:0 0 16px;color:#3a2010;font-size:22px;font-weight:normal;">
        ${titre}
      </h2>
      <p style="margin:0 0 24px;color:#4a3020;font-size:15px;line-height:1.7;">
        ${description}
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${linkUrl}" style="display:inline-block;background:linear-gradient(135deg,#f9b233,#e09820);color:#3a2010;text-decoration:none;font-family:'Arial',sans-serif;font-size:15px;font-weight:bold;padding:14px 36px;border-radius:6px;letter-spacing:0.5px;">
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

  for (const email of emails) {
    try {
      await transporter.sendMail({
        from: getFromAddress(),
        to: email,
        subject: subject,
        html: htmlContent
      });
      successCount++;
    } catch (error) {
      console.error(`Erreur d'envoi newsletter à ${email}:`, error.message);
      failCount++;
    }
  }

  return { successCount, failCount };
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
    etapes = [] // array of { titre, desc }
  } = data;

  const body = `
  <!-- ████ SOMMAIRE ████ -->
  <div class="sommaire" style="background: #593716; padding: 18px 40px; text-align: center;">
    <p style="font-size: 10px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #F9B233; margin: 0 0 12px 0;">Sommaire</p>
    <div style="font-family: 'Lato', sans-serif; font-size: 13px; line-height: 2;">
      <a href="#edito" style="color: rgba(255,255,255,0.85); text-decoration: none; border-bottom: 1px solid rgba(249,178,51,0.3); padding-bottom: 1px;">L'Édito</a>
      &nbsp;&nbsp;<span style="color: rgba(255,255,255,0.2);">·</span>&nbsp;&nbsp;
      <a href="#actualites" style="color: rgba(255,255,255,0.85); text-decoration: none; border-bottom: 1px solid rgba(249,178,51,0.3); padding-bottom: 1px;">Actualités du projet</a>
      &nbsp;&nbsp;<span style="color: rgba(255,255,255,0.2);">·</span>&nbsp;&nbsp;
      <a href="#zoom" style="color: rgba(255,255,255,0.85); text-decoration: none; border-bottom: 1px solid rgba(249,178,51,0.3); padding-bottom: 1px;">Zoom sur…</a>
      &nbsp;&nbsp;<span style="color: rgba(255,255,255,0.2);">·</span>&nbsp;&nbsp;
      <a href="#nextstep" style="color: rgba(255,255,255,0.85); text-decoration: none; border-bottom: 1px solid rgba(249,178,51,0.3); padding-bottom: 1px;">Prochaines étapes</a>
    </div>
  </div>

  <!-- ████ EDITO ████ -->
  <div class="edito" id="edito">
    <div class="section-label">L'Édito</div>
    <div class="edito-inner">
      <div style="margin-bottom: 24px;">
        <h2>${editoTitre}</h2>
        <p>${editoTexte.replace(/\n/g, '<br />')}</p>
        <table cellpadding="0" cellspacing="0" border="0" style="margin-top: 18px;">
          <tr>
            <td width="38" height="38" align="center" valign="middle" style="width: 38px; height: 38px; border-radius: 50%; background: #B1222A; font-family: 'Playfair Display', serif; font-size: 15px; color: #FFFFFF; font-weight: 700; text-align: center; mso-line-height-rule: exactly;">
              <span style="line-height: 38px; display: block; margin: 0; padding: 0;">${editoAuteurInitiales}</span>
            </td>
            <td width="12"></td>
            <td valign="middle">
              <strong style="display: block; font-size: 12px; font-weight: 700; color: #593716; margin: 0;">${editoAuteurNom}</strong>
              <span style="font-size: 11px; color: #845936; margin: 0;">${editoAuteurRole}</span>
            </td>
          </tr>
        </table>
      </div>
      ${editoBref.length > 0 ? `
      <div class="edito-aside">
        <p class="aside-title">📌 En bref ce mois-ci</p>
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          ${editoBref.map(item => `
          <tr>
            <td width="16" valign="top" style="color: #F9B233; font-size: 12px; padding-top: 1px;">▸</td>
            <td valign="top" style="font-size: 12px; color: rgba(255,255,255,0.8); line-height: 1.5; padding-bottom: 10px;">${item}</td>
          </tr>
          `).join('')}
        </table>
      </div>
      ` : ''}
    </div>
  </div>

  <!-- ████ ACTUALITES ████ -->
  ${actus.length > 0 ? `
  <div class="actualites" id="actualites">
    <div class="section-label">Actualités du projet</div>
    <h2>Ce qui s'est passé ce mois-ci</h2>
    <div class="actu-grid" style="display: block;">
      ${actus.map((actu, index) => `
      <div style="border: 1px solid rgba(132,89,54,0.15); border-radius: 2px; overflow: hidden; margin-bottom: 16px; background: #ffffff;">
        <div style="height: 8px; background: ${index === 0 ? '#B1222A' : (index === 1 ? '#845936' : '#F9B233')};"></div>
        ${actu.imageUrl ? `<img src="${actu.imageUrl}" style="width: 100%; max-height: 250px; object-fit: cover; display: block;" alt="Actualité" />` : ''}
        <div style="padding: 16px;">
          <p style="font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: ${index === 0 ? '#B1222A' : (index === 1 ? '#845936' : '#8C3B2A')}; margin: 0 0 6px 0;">${actu.tag || 'Actualité'}</p>
          <h3 style="font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 700; color: #593716; margin: 0 0 8px 0; line-height: 1.3;">${actu.titre}</h3>
          <p style="font-size: 13px; color: #5A3E28; line-height: 1.6; margin: 0 0 12px 0;">${actu.description}</p>
          <a href="${actu.linkUrl}" style="color:#B1222A; font-size:12px; font-weight:bold; text-decoration:none;">Lire la suite →</a>
        </div>
      </div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  <!-- ████ ZOOM SUR ████ -->
  ${zoomTitre ? `
  <div class="zoom" id="zoom">
    <div class="zoom-inner">
      <div class="section-label">Zoom sur…</div>
      <h2>${zoomTitre}</h2>
      <p>${zoomTexte.replace(/\n/g, '<br />')}</p>
    </div>
  </div>
  ` : ''}

  <!-- ████ NEXT STEP ████ -->
  ${etapes.length > 0 ? `
  <div class="nextstep" id="nextstep">
    <div class="section-label">Prochaines étapes</div>
    <h2>Au programme du mois prochain</h2>
    <table cellpadding="0" cellspacing="0" border="0" width="100%">
      ${etapes.map((etape, index) => `
      <tr>
        <td width="30" valign="top" style="padding-bottom: 16px;">
          <table cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="30" height="30" align="center" valign="middle" style="background: #B1222A; color: #FFFFFF; font-family: 'Playfair Display', serif; font-size: 14px; font-weight: 700; border-radius: 50%; text-align: center; mso-line-height-rule: exactly;">
                <span style="line-height: 30px; display: block; margin: 0; padding: 0;">${index + 1}</span>
              </td>
            </tr>
          </table>
        </td>
        <td width="14" style="padding-bottom: 16px;"></td>
        <td valign="top" style="padding-bottom: 16px; padding-top: 4px;">
          <strong style="display: block; font-size: 14px; font-weight: 700; color: #593716; margin: 0 0 4px 0;">${etape.titre}</strong>
          <span style="display: block; font-size: 13px; color: #6A4830; line-height: 1.55; margin: 0;">${etape.desc}</span>
        </td>
      </tr>
      `).join('')}
    </table>
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

