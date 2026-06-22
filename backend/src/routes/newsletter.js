import express from 'express'
import rateLimit from 'express-rate-limit'
import supabase from '../config/supabase.js'
import { sendNewsletterWelcome, sendNewsletterCampaign, generateNewsletterHtml } from '../services/emailService.js'
import { authMiddleware } from '../middleware/auth.js'

const router = express.Router()

// Fonction utilitaire pour nettoyer le markdown avant l'envoi en email
function stripMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // bold
    .replace(/\*(.*?)\*/g, '$1') // italic
    .replace(/__(.*?)__/g, '$1') // bold
    .replace(/_(.*?)_/g, '$1') // italic
    .replace(/#(.*?)\n/g, '$1\n') // headers
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // links
    .replace(/<[^>]*>?/gm, ''); // html tags
}

const newsletterLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limite chaque IP à 5 inscriptions par minute
  message: { error: 'Trop de tentatives, veuillez patienter une minute.' },
  standardHeaders: true,
  legacyHeaders: false
})

// POST /api/newsletter/subscribe (Public)
router.post('/subscribe', newsletterLimiter, async (req, res) => {
  const { email } = req.body;
  
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: "L'adresse e-mail est requise." });
  }

  const trimmedEmail = email.trim().toLowerCase();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return res.status(400).json({ error: "Format d'adresse e-mail invalide." });
  }

  try {
    const { data: existing, error: checkError } = await supabase
      .from('newsletter_subscribers')
      .select('id')
      .eq('email', trimmedEmail)
      .single();

    if (existing) {
      return res.status(400).json({ error: "Cette adresse e-mail est déjà inscrite à la newsletter." });
    }

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .insert([{ email: trimmedEmail }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: "Cette adresse e-mail est déjà inscrite à la newsletter." });
      }
      throw error;
    }

    try {
      await sendNewsletterWelcome({ email: trimmedEmail });
    } catch (emailErr) {
      console.error('Erreur lors de l\'envoi de l\'email de bienvenue:', emailErr.message);
    }

    res.status(201).json({ message: "Inscription réussie !", subscriber: data });
  } catch (err) {
    console.error('Erreur inscription newsletter:', err.message);
    res.status(500).json({ error: "Erreur serveur lors de l'inscription." });
  }
});

// GET /api/newsletter/subscribers (Admin)
router.get('/subscribers', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Erreur récupération abonnés:', err.message);
    res.status(500).json({ error: "Erreur lors de la récupération des abonnés." });
  }
});

// DELETE /api/newsletter/subscribers/:id (Admin)
router.delete('/subscribers/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('newsletter_subscribers')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: "Abonné supprimé avec succès." });
  } catch (err) {
    console.error('Erreur suppression abonné:', err.message);
    res.status(500).json({ error: "Erreur lors de la suppression de l'abonné." });
  }
});

// GET /api/newsletter/campaigns (Admin)
router.get('/campaigns', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('newsletter_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('Erreur récupération campagnes:', err.message);
    res.status(500).json({ error: "Erreur lors de la récupération des campagnes." });
  }
});

// DELETE /api/newsletter/campaigns/:id (Admin)
router.delete('/campaigns/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('newsletter_campaigns')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ message: "Campagne supprimée avec succès." });
  } catch (err) {
    console.error('Erreur suppression campagne:', err.message);
    res.status(500).json({ error: "Erreur lors de la suppression de la campagne." });
  }
});

// POST /api/newsletter/admin/add-subscribers (Admin)
router.post('/admin/add-subscribers', authMiddleware, async (req, res) => {
  try {
    const { emails } = req.body;
    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: "Aucun email fourni." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmails = emails.map(e => e.trim().toLowerCase()).filter(e => emailRegex.test(e));

    if (validEmails.length === 0) {
      return res.status(400).json({ error: "Aucun email valide fourni." });
    }

    // Fetch existing
    const { data: existing, error: fetchErr } = await supabase
      .from('newsletter_subscribers')
      .select('email')
      .in('email', validEmails);

    if (fetchErr) throw fetchErr;

    const existingEmails = existing.map(e => e.email);
    const uniqueValidEmails = [...new Set(validEmails)];
    const toInsert = uniqueValidEmails.filter(e => !existingEmails.includes(e)).map(email => ({ email, statut: 'actif' }));

    if (toInsert.length > 0) {
      const { data, error: insertErr } = await supabase
        .from('newsletter_subscribers')
        .insert(toInsert)
        .select();
      if (insertErr) throw insertErr;
      
      return res.json({ message: `${toInsert.length} abonné(s) ajouté(s).`, newSubscribers: data });
    }

    res.json({ message: "Tous ces emails étaient déjà inscrits.", newSubscribers: [] });
  } catch (err) {
    console.error('Erreur admin/add-subscribers:', err.message);
    res.status(500).json({ error: "Erreur lors de l'ajout." });
  }
});

// POST /api/newsletter/preview (Admin)
router.post('/preview', authMiddleware, async (req, res) => {
  try {
    const { type_source, source_id, contenu_personnalise, sujet_email } = req.body;
    let titre = sujet_email || 'Sujet de l\'email';
    let description = contenu_personnalise || '';
    let imageUrl = null;
    let linkUrl = null;

    let isBulletin = false;
    let bulletinData = null;

    if (type_source === 'bulletin') {
      isBulletin = true;
      try {
        bulletinData = JSON.parse(contenu_personnalise);
      } catch (e) {
        return res.status(400).json({ error: "Format de bulletin invalide." });
      }

      if (bulletinData.actus_ids && bulletinData.actus_ids.length > 0) {
        const { data: actusData, error: actusErr } = await supabase.from('actualites').select('*').in('id', bulletinData.actus_ids);
        if (!actusErr && actusData) {
          bulletinData.actus = bulletinData.actus_ids.map(id => {
            const act = actusData.find(a => a.id === id);
            if (!act) return null;
            const cleanContenu = act.contenu ? stripMarkdown(act.contenu) : '';
            return {
              tag: act.tags && act.tags.length > 0 ? act.tags[0] : 'Actualité',
              titre: act.titre,
              description: act.description ? stripMarkdown(act.description) : (cleanContenu.substring(0, 150) + (cleanContenu.length > 150 ? '...' : '')),
              linkUrl: (process.env.FRONTEND_URL || 'http://localhost:5173') + '/actualites/' + act.id,
              imageUrl: act.image_url
            };
          }).filter(Boolean);
        }
      }
      // HTML generation for preview
      const { generateBulletinHtml } = await import('../services/emailService.js');
      const html = generateBulletinHtml(bulletinData);
      return res.json({ html });
    }

    if (type_source === 'actualite' && source_id) {
      const { data: act, error: actErr } = await supabase.from('actualites').select('*').eq('id', source_id).single();
      if (!actErr) {
        const cleanContenu = act.contenu ? stripMarkdown(act.contenu) : '';
        titre = act.titre;
        description = act.description ? stripMarkdown(act.description) : (cleanContenu.substring(0, 150) + (cleanContenu.length > 150 ? '...' : ''));
        imageUrl = act.image_url;
        linkUrl = (process.env.FRONTEND_URL || 'http://localhost:5173') + '/actualites/' + act.id;
      }
    } else if (type_source === 'evenement' && source_id) {
      const { data: ev, error: evErr } = await supabase.from('evenements').select('*').eq('id', source_id).single();
      if (!evErr) {
        titre = ev.titre;
        description = ev.description || ev.lieu || '';
        imageUrl = ev.image_url;
        linkUrl = (process.env.FRONTEND_URL || 'http://localhost:5173') + '/evenements/' + ev.id;
      }
    } else {
      linkUrl = req.body.linkUrl || null;
    }

    const html = generateNewsletterHtml({ titre, description, imageUrl, linkUrl, contenuPersonnalise: type_source === 'manuel' ? contenu_personnalise : null });
    res.json({ html });
  } catch (err) {
    console.error('Erreur previsualisation campagne:', err.message);
    res.status(500).json({ error: "Erreur lors de la prévisualisation." });
  }
});

// POST /api/newsletter/campaigns (Admin)
router.post('/campaigns', authMiddleware, async (req, res) => {
  try {
    const { 
      titre_interne, sujet_email, type_source, source_id, 
      contenu_personnalise, ciblage, destinataires 
    } = req.body;

    if (!titre_interne || !sujet_email) {
      return res.status(400).json({ error: "Le titre interne et le sujet sont requis." });
    }

    // 1. Fetch emails to send to
    let emailsToSend = [];
    if (ciblage === 'tous') {
      const { data: subs, error: subsError } = await supabase
        .from('newsletter_subscribers')
        .select('email')
        .eq('statut', 'actif');
      if (subsError) throw subsError;
      emailsToSend = subs.map(s => s.email);
    } else if (ciblage === 'specifique' && destinataires && destinataires.length > 0) {
      const { data: subs, error: subsError } = await supabase
        .from('newsletter_subscribers')
        .select('email')
        .in('id', destinataires)
        .eq('statut', 'actif');
      if (subsError) throw subsError;
      emailsToSend = subs.map(s => s.email);
    }

    if (emailsToSend.length === 0) {
      return res.status(400).json({ error: "Aucun destinataire sélectionné ou trouvé." });
    }

    // 2. Prepare content based on type
    let titre = sujet_email;
    let description = contenu_personnalise;
    let imageUrl = null;
    let linkUrl = null;
    let isBulletin = false;
    let bulletinData = null;

    if (type_source === 'bulletin') {
      isBulletin = true;
      try {
        bulletinData = JSON.parse(contenu_personnalise);
      } catch (e) {
        return res.status(400).json({ error: "Format de bulletin invalide." });
      }

      if (bulletinData.actus_ids && bulletinData.actus_ids.length > 0) {
        const { data: actusData, error: actusErr } = await supabase.from('actualites').select('*').in('id', bulletinData.actus_ids);
        if (!actusErr && actusData) {
          bulletinData.actus = bulletinData.actus_ids.map(id => {
            const act = actusData.find(a => a.id === id);
            if (!act) return null;
            const cleanContenu = act.contenu ? stripMarkdown(act.contenu) : '';
            return {
              tag: act.tags && act.tags.length > 0 ? act.tags[0] : 'Actualité',
              titre: act.titre,
              description: act.description ? stripMarkdown(act.description) : (cleanContenu.substring(0, 150) + (cleanContenu.length > 150 ? '...' : '')),
              linkUrl: (process.env.FRONTEND_URL || 'http://localhost:5173') + '/actualites/' + act.id,
              imageUrl: act.image_url
            };
          }).filter(Boolean);
        }
      }
    } else if (type_source === 'actualite' && source_id) {
      const { data: act, error: actErr } = await supabase.from('actualites').select('*').eq('id', source_id).single();
      if (actErr) throw actErr;
      const cleanContenu = act.contenu ? stripMarkdown(act.contenu) : '';
      titre = act.titre;
      description = act.description ? stripMarkdown(act.description) : (cleanContenu.substring(0, 150) + (cleanContenu.length > 150 ? '...' : ''));
      imageUrl = act.image_url;
      linkUrl = (process.env.FRONTEND_URL || 'http://localhost:5173') + '/actualites/' + act.id;
    } else if (type_source === 'evenement' && source_id) {
      const { data: ev, error: evErr } = await supabase.from('evenements').select('*').eq('id', source_id).single();
      if (evErr) throw evErr;
      titre = ev.titre;
      description = ev.description || ev.lieu || '';
      imageUrl = ev.image_url;
      linkUrl = (process.env.FRONTEND_URL || 'http://localhost:5173') + '/evenements/' + ev.id;
    } else {
      // type_source === 'manuel'
      linkUrl = req.body.linkUrl || null;
    }

    // 3. Save campaign as drafting/sending
    const { data: campaign, error: campErr } = await supabase
      .from('newsletter_campaigns')
      .insert([{
        titre_interne,
        sujet_email,
        type_source,
        source_id: source_id || null,
        contenu_personnalise,
        ciblage,
        destinataires: destinataires || [],
        statut: 'en_cours'
      }])
      .select()
      .single();

    if (campErr) throw campErr;

    // 4. Send emails asynchronously to not block the request
    sendNewsletterCampaign({
      emails: emailsToSend,
      subject: sujet_email,
      titre,
      description,
      imageUrl,
      linkUrl,
      contenuPersonnalise: type_source === 'manuel' ? contenu_personnalise : null,
      isBulletin,
      bulletinData
    }).then(async ({ successCount, failCount }) => {
      // Update campaign status
      await supabase
        .from('newsletter_campaigns')
        .update({ statut: 'envoye', date_envoi: new Date().toISOString() })
        .eq('id', campaign.id);
      console.log(`Campaign sent: ${successCount} success, ${failCount} failed.`);
    }).catch(err => {
      console.error('Campaign background error:', err);
    });

    res.status(201).json({ message: "Campagne créée et envoi en cours.", campaign });
  } catch (err) {
    console.error('Erreur création campagne:', err);
    res.status(500).json({ error: "Erreur serveur lors de la création de la campagne. Détails : " + (err.message || err.details || JSON.stringify(err)) });
  }
});

export default router
