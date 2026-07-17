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
    } catch (brevoErr) {
      console.warn("Échec de l'envoi via Brevo, tentative de fallback via Gmail...", brevoErr.message)
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
 */
function emailShell(bodyContent, options = {}) {
  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  
  // Handle retro-compatibility where options was just a string title
  const title = typeof options === 'string' ? options : (options.title || 'NOTIFICATION');
  const edition = options.edition || 'Musée Virtuel de Guinée';
  const label = options.label || 'NOTIFICATION';
  const isFullWidth = options.isFullWidth || false;
  
  return `<!DOCTYPE html>
<html lang="fr" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Musée Virtuel de Guinée</title>
  <style type="text/css">
    @import url('https://fonts.googleapis.com/css2?family=Alexandria:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Lato:wght@300;400;700&display=swap');
    
    /* Fix Outlook Desktop (moteur Word) : neutralise l'espacement par défaut des tables
       qui élargit progressivement le contenu imbriqué */
    table {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
      border-collapse: collapse;
    }
    
    body { background-color: #f4f7f5; font-family: 'Alexandria', 'Lato', sans-serif; padding: 30px 0; margin: 0; }
    .wrapper { max-width: 680px; margin: 0 auto; background: #FFFFFF; border-radius: 2px; overflow: hidden; box-shadow: 0 8px 40px rgba(40,51,111,0.15); }
    .header { position: relative; background-color: #28336f; min-height: 190px; overflow: hidden; }
    .header-pattern { position: absolute; inset: 0; background-image: url('${frontendUrl}/images/motif-removebg-preview.png'); background-size: 260px auto; background-repeat: repeat; opacity: 0.15; }
    .header-overlay { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(40,51,111,0.85) 0%, rgba(54,67,132,0.7) 100%); }
    .header-text h1 em { color: #b45332; font-style: italic; }
    .header-text .edition { font-size: 11px; font-weight: 300; letter-spacing: 1.5px; color: rgba(255,255,255,0.6); margin-top: 8px; }
    .gold-band { background: #b45332; height: 8px; }
    
    /* Footer */
    .footer { background: #28336f; padding: 32px 40px 24px; position: relative; overflow: hidden; }
    .footer::after { content: ''; position: absolute; inset: 0; background-image: url('${frontendUrl}/images/motif-removebg-preview.png'); background-size: 180px; opacity: 0.15; }
    .footer-inner { position: relative; z-index: 1; }
    .footer-bottom { text-align: center; font-size: 10px; color: rgba(255,255,255,0.3); margin-top: 16px; }
    .footer-bottom a { color: rgba(255,255,255,0.4); text-decoration: none; }
    .or-bar-bottom { height: 5px; background: linear-gradient(to right, #28336f, #b45332, #da373d, #b45332, #28336f); }
    
    /* Bulletin specific styles */
    .sommaire { background: #28336f; padding: 18px 40px; }
    .sommaire-label { font-size: 9px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #b45332; margin-bottom: 10px; }
    .sommaire-links { display: flex; flex-wrap: wrap; gap: 6px 20px; }
    .sommaire-links a { font-family: 'Alexandria', 'Lato', sans-serif; font-size: 12px; font-weight: 400; color: rgba(255,255,255,0.80); text-decoration: none; border-bottom: 1px solid rgba(180,83,50,0.3); padding-bottom: 1px; }
    .sommaire-links .sep { color: rgba(255,255,255,0.2); font-size: 11px; }
    
    .section-label { display: inline-flex; align-items: center; gap: 8px; font-size: 9.5px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: #da373d; margin-bottom: 14px; }
    .section-label::before { content: ''; display: block; width: 22px; height: 2px; background: #b45332; }
    
    .edito { padding: 40px 40px 32px; background: #f4f7f5; border-top: 1px solid rgba(40,51,111,0.12); }
    .edito h2 { font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 900; color: #28336f; line-height: 1.2; margin-bottom: 14px; margin-top: 0; }
    .edito p { font-size: 14px; line-height: 1.75; color: #121526; margin-bottom: 10px; }
    .edito-author { margin-top: 18px; display: flex; align-items: center; gap: 10px; }
    .edito-author-avatar { width: 38px; height: 38px; border-radius: 50%; background: linear-gradient(135deg, #b45332, #da373d); display: flex; align-items: center; justify-content: center; font-family: 'Playfair Display', serif; font-size: 15px; color: #FFFFFF; font-weight: 700; line-height: 38px; text-align: center; }
    .edito-author-info strong { display: block; font-size: 12px; font-weight: 700; color: #28336f; }
    .edito-author-info span { font-size: 11px; color: #b45332; }
    .edito-aside { background: #28336f; border-radius: 2px; padding: 20px 18px; margin-top: 24px; }
    .edito-aside .aside-title { font-family: 'Playfair Display', serif; font-size: 13px; font-weight: 700; color: #b45332; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px solid rgba(180,83,50,0.25); margin-top: 0; }
    .edito-aside ul { list-style: none; display: flex; flex-direction: column; gap: 10px; padding: 0; margin: 0; }
    .edito-aside ul li { font-size: 12px; color: rgba(255,255,255,0.8); line-height: 1.5; padding-left: 12px; position: relative; }
    .edito-aside ul li::before { content: '▸'; position: absolute; left: 0; color: #b45332; font-size: 10px; }
    
    .actualites { padding: 36px 40px; background: #FFFFFF; }
    .actualites h2 { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 900; color: #28336f; margin-bottom: 24px; margin-top: 0; }
    .actu-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .actu-card { border: 1px solid rgba(40,51,111,0.15); border-radius: 2px; overflow: hidden; }
    .actu-card-top { height: 8px; background: #da373d; }
    .actu-card.secondary .actu-card-top { background: #b45332; }
    .actu-card.tertiary .actu-card-top { background: #bdcec8; }
    .actu-card-body { padding: 16px; }
    .actu-tag { font-size: 9px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #da373d; margin-bottom: 6px; margin-top: 0; }
    .actu-card.secondary .actu-tag { color: #b45332; }
    .actu-card.tertiary .actu-tag { color: #3e502a; }
    .actu-card h3 { font-family: 'Playfair Display', serif; font-size: 14px; font-weight: 700; color: #28336f; margin-bottom: 8px; margin-top: 0; line-height: 1.3; }
    .actu-card p { font-size: 12px; color: #5A3E28; line-height: 1.6; margin: 0; }
    .actu-card-full { grid-column: 1 / -1; }
    .actu-card-img { width: 100%; height: 140px; object-fit: cover; }
    
    .zoom { background-color: #28336f; background: linear-gradient(135deg, #28336f 0%, #18204c 100%); padding: 36px 40px; position: relative; overflow: hidden; }
    .zoom-inner { position: relative; z-index: 1; }
    .zoom-inner .section-label { color: #b45332; }
    .zoom-inner .section-label::before { background: #b45332; }
    .zoom h2 { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 900; color: #FFFFFF; margin-bottom: 12px; margin-top: 0; }
    .zoom p { font-size: 13.5px; color: #FFFFFF; line-height: 1.75; margin-bottom: 14px; margin-top: 0; }
    .zoom-cta { display: inline-block; margin-top: 8px; background: #b45332; color: #FFFFFF; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; text-decoration: none; padding: 10px 22px; border-radius: 1px; }
    
    .nextstep { background: #f4f7f5; padding: 36px 40px; }
    .nextstep h2 { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 900; color: #28336f; margin-bottom: 20px; margin-top: 0; }
    
    .galerie { background: #FFFFFF; padding: 36px 40px; }
    .galerie-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    
    /* ─────────────────────────────────────────────────────────────────
       CARROUSEL HORIZONTAL — classes mutualisées (Zoom + Galerie)
       Utilise overflow-x + inline-block, PAS de flexbox (peu fiable en email).
       Rendu par défaut (Gmail web/app, Apple Mail, Outlook.com, Yahoo, mobile) :
       vrai scroll horizontal.
       Outlook Desktop (Windows, moteur Word) reçoit un fallback totalement
       différent via les commentaires conditionnels <!--[if mso]-->, voir le HTML.
       ───────────────────────────────────────────────────────────────── */
    .carousel-scroll {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      white-space: nowrap;
      scroll-snap-type: x proximity;
      -ms-overflow-style: none;
    }
    .carousel-scroll::-webkit-scrollbar { height: 6px; }
    .carousel-scroll::-webkit-scrollbar-thumb { background: rgba(249,178,51,0.4); border-radius: 3px; }
    .carousel-item {
      display: inline-block;
      white-space: normal;
      vertical-align: top;
      scroll-snap-align: start;
    }
    
    @media (max-width: 600px) {
      .actu-grid { display: block; }
      .wrapper { width: 100% !important; max-width: 100% !important; box-shadow: none !important; border-radius: 0 !important; }
      .mobile-padding { padding: 24px 20px !important; }
      .mobile-stack { display: block !important; width: 100% !important; box-sizing: border-box !important; }
      .mobile-center { text-align: center !important; }
      .header-logo-container { padding-right: 0 !important; margin-bottom: 16px !important; }
      .header-text-container { border-left: none !important; padding-left: 0 !important; }
      .hide-mobile { display: none !important; }
      
      /* Force le défilement horizontal fluide par glissement tactile sur mobile */
      .carousel-scroll {
        overflow-x: scroll !important;
        -webkit-overflow-scrolling: touch !important;
        display: block !important;
        width: 100% !important;
        white-space: nowrap !important;
      }
      .carousel-item {
        display: inline-block !important;
        float: none !important;
        white-space: normal !important;
      }
    }


    /* Anti-overflow text wrapping for email clients */
    .edito p, .edito h2, .actu-card p, .actu-card h3,
    .zoom p, .zoom h2, .nextstep h2, .nextstep strong, .nextstep span,
    .galerie h2, .galerie h4, .galerie p, .edito-aside li, .sommaire-links a {
      word-wrap: break-word !important;
      overflow-wrap: break-word !important;
      word-break: break-word !important;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7f5;">
  <center style="width: 100%; table-layout: fixed; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; background-color: #f4f7f5; padding: 30px 0;">
    <!--[if mso]>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="680" align="center" style="width:680px; margin:0 auto;">
      <tr>
        <td align="center" valign="top" style="padding:0; margin:0;">
    <![endif]-->
    <div class="wrapper" style="max-width: 680px; margin: 0 auto; background: #FFFFFF; border-radius: 2px; overflow: hidden; box-shadow: 0 8px 40px rgba(40,51,111,0.15);">
  <!-- HEADER -->
  <div class="header">
    <div class="header-pattern"></div>
    <div class="header-overlay"></div>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="position: relative; z-index: 2;">
      <tr>
        <td style="padding: 36px 40px 32px;" class="mobile-padding">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="120" valign="middle" align="center" style="width:120px;" class="mobile-stack header-logo-container">
                <img src="https://vxbaqwyotalslelyhlxs.supabase.co/storage/v1/object/public/actualites/logo-white.png" alt="Musée Virtuel de Guinée" width="120" style="width: 120px; max-width: 100%; height: auto; display: block; margin: 0 auto;" />
              </td>
              <td width="24" style="width: 24px;" class="hide-mobile"></td>
              <td valign="middle" style="border-left: 3px solid #b45332; padding-left: 24px;" class="mobile-stack header-text-container mobile-center">
                <p style="font-family: 'Alexandria', 'Lato', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: 3.5px; text-transform: uppercase; color: #b45332; margin: 0 0 6px 0;">${label}</p>
                <h1 style="font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 900; color: #FFFFFF; line-height: 1.25; margin: 0;">${title.replace('N°', 'N°&nbsp;')}</h1>
                <p style="font-size: 12px; font-weight: 300; letter-spacing: 1.5px; color: rgba(255,255,255,0.6); margin: 8px 0 0 0;">${edition}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
  <div class="gold-band"></div>

  <!-- BODY -->
  ${isFullWidth ? bodyContent : '<div class="mobile-padding" style="padding: 40px; background: #f4f7f5; color: #121526; line-height: 1.7; font-size: 15px;">' + bodyContent + '</div>'}

  <!-- FOOTER -->
  <div class="footer mobile-padding">
    <div class="footer-inner">
       <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-bottom: 1px solid rgba(180,83,50,0.2); padding-bottom: 20px; margin-bottom: 18px;">
        <tr>
          <td valign="top" align="center" style="padding-bottom: 16px;">
            <img src="https://vxbaqwyotalslelyhlxs.supabase.co/storage/v1/object/public/actualites/logo-white.png" alt="MVG" width="100" style="width: 100px; display: block; margin: 0 auto; height: auto;">
            <p style="margin: 12px auto 0; font-size: 11px; color: rgba(255,255,255,0.4); line-height: 1.5; max-width: 240px; text-align: center;">Musée Virtuel de Guinée — Préserver et diffuser le patrimoine culturel guinéen.</p>
          </td>
        </tr>
        <tr>
          <td valign="top" align="center">
            <h4 style="font-size: 10px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: #b45332; margin: 0 0 12px 0;">Suivez-nous</h4>
            <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
              <tr>
                <td align="center" style="padding: 0 6px;">
                  <a href="https://www.facebook.com/profile.php?id=61584717626322" style="text-decoration:none; display:block;">
                    <img src="https://img.icons8.com/ios-filled/36/b45332/facebook-new.png" alt="Facebook" width="36" height="36" style="display:block; border:none;" />
                  </a>
                </td>
                <td align="center" style="padding: 0 6px;">
                  <a href="https://www.instagram.com/museevirtuelguinee" style="text-decoration:none; display:block;">
                    <img src="https://img.icons8.com/ios-filled/36/b45332/instagram-new.png" alt="Instagram" width="36" height="36" style="display:block; border:none;" />
                  </a>
                </td>
                <td align="center" style="padding: 0 6px;">
                  <a href="${frontendUrl}" style="text-decoration:none; display:block;">
                    <img src="https://img.icons8.com/ios-filled/36/b45332/domain.png" alt="Web" width="36" height="36" style="display:block; border:none;" />
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
    <!--[if mso]>
        </td>
      </tr>
    </table>
    <![endif]-->
  </center>
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
      <td style="padding:10px 16px;border-bottom:1px solid #bdcec8;">
        <span style="color:#b45332;font-size:13px;font-family:'Alexandria',sans-serif;">${label}</span>
      </td>
      <td style="padding:10px 16px;border-bottom:1px solid #bdcec8;">
        <span style="color:#28336f;font-size:14px;font-family:'Alexandria',sans-serif;font-weight:bold;">${value}</span>
      </td>
    </tr>
  `).join('')

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7f5;border:1px solid #bdcec8;border-radius:8px;overflow:hidden;margin:24px 0;">
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
    <p style="margin:0 0 8px;color:#b45332;font-size:13px;font-family:'Alexandria',sans-serif;letter-spacing:1px;text-transform:uppercase;">
      Invitation personnelle
    </p>
    <h2 style="margin:0 0 24px;color:#28336f;font-size:22px;font-weight:normal;font-family:'Alexandria',sans-serif;">
      Cher(e) <strong>${fullName}</strong>,
    </h2>

    <p style="margin:0 0 16px;color:#121526;font-size:15px;line-height:1.7;font-family:'Alexandria',sans-serif;">
      Le <strong>Musée Virtuel de Guinée</strong> a le plaisir de vous convier à son prochain événement&nbsp;:
    </p>

    <!-- Event title -->
    <div style="background:linear-gradient(135deg,#28336f,#b45332);border-radius:8px;padding:20px 24px;margin:0 0 20px;text-align:center;">
      <h3 style="margin:0;color:#FFFFFF;font-size:20px;font-weight:normal;letter-spacing:0.5px;font-family:'Alexandria',sans-serif;">
        ${evenement.titre}
      </h3>
    </div>

    ${evenement.description ? `
    <p style="margin:0 0 20px;color:#121526;font-size:15px;line-height:1.7;font-family:'Alexandria',sans-serif;">
      ${evenement.description}
    </p>
    ` : ''}

    ${eventBlock(evenement)}

    <!-- Organisation mention -->
    ${invite.organisation ? `
    <p style="margin:0 0 20px;color:#b45332;font-size:14px;font-style:italic;font-family:'Alexandria',sans-serif;">
      En votre qualité de représentant(e) de <strong>${invite.organisation}</strong>${invite.titre_poste ? ` — ${invite.titre_poste}` : ''}.
    </p>
    ` : ''}

    <!-- RSVP section -->
    <div style="background-color:#f4f7f5;border:1px solid #bdcec8;border-radius:8px;padding:24px;margin:24px 0;text-align:center;">
      <p style="margin:0 0 8px;color:#28336f;font-size:13px;font-family:'Alexandria',sans-serif;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">
        Merci de confirmer votre présence
      </p>
      <p style="margin:0 0 20px;color:#121526;font-size:13px;font-family:'Alexandria',sans-serif;">
        Cliquez sur le bouton ci-dessous pour répondre à cette invitation.
      </p>
      <a href="${rsvpUrl}"
         style="display:inline-block;background:linear-gradient(135deg,#b45332,#da373d);color:#FFFFFF;text-decoration:none;font-family:'Alexandria',sans-serif;font-size:15px;font-weight:bold;padding:14px 36px;border-radius:6px;letter-spacing:0.5px;">
        Répondre à l'invitation →
      </a>
      <p style="margin:16px 0 0;color:#28336f;font-size:11px;font-family:'Alexandria',sans-serif;opacity:0.8;">
        Ou copiez ce lien dans votre navigateur :<br />
        <span style="color:#b45332;">${rsvpUrl}</span>
      </p>
    </div>

    <p style="margin:24px 0 0;color:#121526;font-size:14px;line-height:1.7;font-family:'Alexandria',sans-serif;">
      Nous espérons avoir le plaisir de vous accueillir lors de cet événement.<br />
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
    <h2 style="margin:0 0 16px;color:#28336f;font-size:22px;font-weight:normal;font-family:'Alexandria',sans-serif;">
      Nouveau message de contact
    </h2>

    <p style="margin:0 0 16px;color:#121526;font-size:15px;line-height:1.7;font-family:'Alexandria',sans-serif;">
      Une nouvelle demande a été envoyée depuis le site du Musée Virtuel de Guinée.
    </p>

    <div style="background-color:#f4f7f5;border:1px solid #bdcec8;border-radius:8px;padding:20px;margin:24px 0;font-family:'Alexandria',sans-serif;">
      <p style="margin:0 0 8px;color:#b45332;font-size:13px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">Informations</p>
      <p style="margin:0 0 6px;color:#121526;font-size:14px;"><strong>Nom :</strong> ${prenom} ${nom}</p>
      <p style="margin:0 0 6px;color:#121526;font-size:14px;"><strong>Email :</strong> ${email}</p>
      <p style="margin:0 0 6px;color:#121526;font-size:14px;"><strong>Objet :</strong> ${sujet}</p>
      <p style="margin:12px 0 0;color:#121526;font-size:14px;line-height:1.7;"><strong>Message :</strong><br />${message.replace(/\n/g, '<br />')}</p>
    </div>

    <p style="margin:0;color:#121526;font-size:14px;line-height:1.7;font-family:'Alexandria',sans-serif;">
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
    <div style="background:linear-gradient(135deg,#b45332,#da373d);border-radius:8px;padding:16px 24px;margin:0 0 24px;text-align:center;">
      <p style="margin:0;color:#FFFFFF;font-size:16px;font-family:'Alexandria',sans-serif;font-weight:bold;">
        ✉️ Accusé de réception
      </p>
    </div>

    <h2 style="margin:0 0 16px;color:#28336f;font-size:22px;font-weight:normal;font-family:'Alexandria',sans-serif;">
      Bonjour ${prenom},
    </h2>

    <p style="margin:0 0 16px;color:#121526;font-size:15px;line-height:1.7;font-family:'Alexandria',sans-serif;">
      Nous avons bien reçu votre message concernant le sujet <strong>"${sujet}"</strong>.
    </p>

    <p style="margin:0 0 16px;color:#121526;font-size:15px;line-height:1.7;font-family:'Alexandria',sans-serif;">
      Notre équipe vous répondra dans les plus brefs délais (généralement sous 48h).
    </p>

    <p style="margin:24px 0 0;color:#121526;font-size:14px;line-height:1.7;font-family:'Alexandria',sans-serif;">
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

  const body = `
    <!-- Success banner -->
    <div style="background:linear-gradient(135deg,#3e502a,#bdcec8);border-radius:8px;padding:16px 24px;margin:0 0 24px;text-align:center;">
      <p style="margin:0;color:#ffffff;font-size:16px;font-family:'Alexandria',sans-serif;font-weight:bold;">
        ✅ Inscription confirmée !
      </p>
    </div>

    <h2 style="margin:0 0 16px;color:#28336f;font-size:22px;font-weight:normal;font-family:'Alexandria',sans-serif;">
      Cher(e) <strong>${fullName}</strong>,
    </h2>

    <p style="margin:0 0 16px;color:#121526;font-size:15px;line-height:1.7;font-family:'Alexandria',sans-serif;">
      Nous avons bien enregistré votre participation à l'événement&nbsp;:
    </p>

    <!-- Event title -->
    <div style="background:linear-gradient(135deg,#28336f,#b45332);border-radius:8px;padding:20px 24px;margin:0 0 20px;text-align:center;">
      <h3 style="margin:0;color:#FFFFFF;font-size:20px;font-weight:normal;letter-spacing:0.5px;font-family:'Alexandria',sans-serif;">
        ${evenement.titre}
      </h3>
    </div>

    ${eventBlock(evenement)}

    <!-- QR Code section -->
    <div style="background-color:#f4f7f5;border:2px solid #bdcec8;border-radius:10px;padding:28px;margin:24px 0;text-align:center;font-family:'Alexandria',sans-serif;">
      <p style="margin:0 0 6px;color:#28336f;font-size:13px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">
        Votre QR Code d'accès
      </p>
      <p style="margin:0 0 20px;color:#121526;font-size:13px;">
        Présentez ce code à l'entrée de l'événement pour valider votre présence.
      </p>
      <img
        src="cid:qr-code.png"
        alt="QR Code d'accès — ${evenement.titre}"
        width="200"
        height="200"
        style="display:block;margin:0 auto;border:6px solid #FFFFFF;border-radius:8px;box-shadow:0 2px 12px rgba(40,51,111,0.15);"
      />
      <p style="margin:16px 0 0;color:#28336f;font-size:11px;opacity:0.8;">
        Réf. invitation : <code style="color:#b45332;background:#eef2ef;padding:2px 6px;border-radius:3px;">${token.substring(0, 8).toUpperCase()}</code>
      </p>
    </div>

    <!-- Reminder box -->
    <div style="border-left:4px solid #b45332;padding:12px 16px;background-color:#f4f7f5;border-radius:0 6px 6px 0;margin:0 0 24px;font-family:'Alexandria',sans-serif;">
      <p style="margin:0;color:#28336f;font-size:13px;font-weight:bold;">
        Rappel important
      </p>
      <ul style="margin:8px 0 0;padding-left:18px;color:#121526;font-size:13px;line-height:1.8;">
        <li>Conservez cet e-mail ou faites une capture d'écran de votre QR code.</li>
        <li>Présentez-vous ${evenement.lieu ? `à <strong>${evenement.lieu}</strong>` : "au lieu indiqué"} le ${formatDateFr(evenement.date_debut)}.</li>
        <li>Le QR code est strictement personnel et non transférable.</li>
      </ul>
    </div>

    <p style="margin:0;color:#121526;font-size:14px;line-height:1.7;font-family:'Alexandria',sans-serif;">
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
      attachments: [
        {
          filename: 'qr-code.png',
          content: qrCodeDataUrl.split(',')[1],
          encoding: 'base64',
          cid: 'qr-code.png' // same cid value as in the html img src
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
    <div style="background:linear-gradient(135deg,#b45332,#da373d);border-radius:8px;padding:16px 24px;margin:0 0 24px;text-align:center;">
      <p style="margin:0;color:#FFFFFF;font-size:16px;font-family:'Alexandria',sans-serif;font-weight:bold;">
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
      <h2 style="margin:0 0 16px;color:#28336f;font-size:22px;font-weight:normal;font-family:'Alexandria',sans-serif;">
        ${titre}
      </h2>
      <div style="margin:0 0 16px;color:#121526;font-size:15px;line-height:1.7;font-family:'Alexandria',sans-serif;">
        ${contenuPersonnalise.replace(/\n/g, '<br />')}
      </div>
    `;
    if (linkUrl) {
      body += `
        <div style="text-align:center;margin:32px 0;">
          <a href="${linkUrl}" style="display:inline-block;background:linear-gradient(135deg,#b45332,#da373d);color:#FFFFFF;text-decoration:none;font-family:'Alexandria',sans-serif;font-size:15px;font-weight:bold;padding:14px 36px;border-radius:6px;letter-spacing:0.5px;">
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
          <img src="${imageUrl}" alt="${titre}" width="600" style="max-width:100%;width:100%;height:auto;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.1);" />
        </div>
      ` : ''}
      <h2 style="margin:0 0 16px;color:#28336f;font-size:22px;font-weight:normal;font-family:'Alexandria',sans-serif;">
        ${titre}
      </h2>
      <p style="margin:0 0 24px;color:#121526;font-size:15px;line-height:1.7;font-family:'Alexandria',sans-serif;">
        ${description}
      </p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${linkUrl}" style="display:inline-block;background:linear-gradient(135deg,#b45332,#da373d);color:#FFFFFF;text-decoration:none;font-family:'Alexandria',sans-serif;font-size:15px;font-weight:bold;padding:14px 36px;border-radius:6px;letter-spacing:0.5px;">
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
      <h4 style="font-family:'Alexandria',sans-serif;font-size:14px;font-weight:700;color:#28336f;margin:12px 0 6px 0;line-height:1.3;text-align:left;">${media.titre || ''}</h4>
      ${media.description ? `<p style="font-family:'Alexandria',sans-serif;font-size:12px;color:#b45332;line-height:1.45;margin:0 0 12px 0;text-align:left;">${media.description}</p>` : ''}
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
      <h4 style="font-family:'Alexandria',sans-serif;font-size:14px;font-weight:700;color:#28336f;margin:12px 0 6px 0;line-height:1.3;text-align:left;">${media.titre || ''}</h4>
      ${media.description ? `<p style="font-family:'Alexandria',sans-serif;font-size:12px;color:#b45332;line-height:1.45;margin:0 0 12px 0;text-align:left;">${media.description}</p>` : ''}
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
  <div class="sommaire mobile-padding" style="background: #28336f; padding: 18px 40px; text-align: center;">
    <p style="font-size: 10px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #b45332; margin: 0 0 12px 0;">Sommaire</p>
    <div style="font-family: 'Alexandria', 'Lato', sans-serif; font-size: 13px; line-height: 2;">
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
  <div class="edito mobile-padding" id="edito">
    <div class="section-label">L'Édito</div>
    <div class="edito-inner">
      <div style="margin-bottom: 24px;">
        <h2>${editoTitre}</h2>
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
      <div class="edito-aside">
        <p class="aside-title">📌 En bref ce mois-ci</p>
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
  <div class="actualites mobile-padding" id="actualites">
    <div class="section-label">Actualités du projet</div>
    <h2>Ce qui s'est passé ce mois-ci</h2>
    <div class="actu-grid" style="display: block;">
      ${actus.map((actu, index) => `
      <div style="border: 1px solid rgba(40,51,111,0.15); border-radius: 2px; overflow: hidden; margin-bottom: 16px; background: #ffffff;">
        <div style="height: 8px; background: ${index === 0 ? '#da373d' : (index === 1 ? '#b45332' : '#bdcec8')};"></div>
        ${actu.imageUrl ? `<img src="${actu.imageUrl}" width="598" height="250" style="width: 100%; max-width: 598px; height: 250px; object-fit: cover; display: block;" alt="Actualité" />` : ''}
        <div style="padding: 16px;">
          <p style="font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: ${index === 0 ? '#da373d' : (index === 1 ? '#b45332' : '#3e502a')}; margin: 0 0 6px 0;">${actu.tag || 'Actualité'}</p>
          <h3 style="font-family: 'Alexandria', sans-serif; font-size: 16px; font-weight: 700; color: #28336f; margin: 0 0 8px 0; line-height: 1.3;">${actu.titre}</h3>
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
  <div class="zoom mobile-padding" id="zoom" style="background-color: #28336f;">
    <div class="zoom-inner">
      <div class="section-label">Zoom sur…</div>
      <h2>${zoomTitre}</h2>
      <p style="color: #FFFFFF;">${zoomTexte.replace(/\n/g, '<br />')}</p>
      
      <!-- Médias Zoom (Email-safe stacked layout + beautiful CSS slide carousel in modern web/preview views) -->
      ${zoomMedia && zoomMedia.length > 0 ? `
      <div class="zoom-media-gallery" style="margin-top: 24px;">
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
  <div class="nextstep mobile-padding" id="nextstep">
    <div class="section-label">Prochaines étapes</div>
    <h2>Au programme du mois prochain</h2>
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
    <div class="section-label">${galerie.titre || 'Visuels'}</div>
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