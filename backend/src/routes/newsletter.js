import express from 'express'
import rateLimit from 'express-rate-limit'
import supabase from '../config/supabase.js'
import { sendNewsletterWelcome, sendNewsletterCampaign, generateNewsletterHtml } from '../services/emailService.js'
import { authMiddleware, requireAdmin } from '../middleware/auth.js'

const router = express.Router()
const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')

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
router.get('/subscribers', authMiddleware, requireAdmin, async (req, res) => {
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
router.delete('/subscribers/:id', authMiddleware, requireAdmin, async (req, res) => {
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

// PUT /api/newsletter/subscribers/:id (Admin)
router.put('/subscribers/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { prenom, nom, institution, fonction, email } = req.body;

    // Vérifier manuellement si l'email est déjà pris par un autre abonné
    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      const { data: existing } = await supabase
        .from('newsletter_subscribers')
        .select('id')
        .eq('email', normalizedEmail)
        .neq('id', id)
        .maybeSingle();

      if (existing) {
        return res.status(400).json({
          error: `L'adresse e-mail "${normalizedEmail}" est déjà utilisée par un autre abonné. Chaque email doit être unique.`
        });
      }
    }

    // On met à jour
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .update({ prenom, nom, institution, fonction, email: email ? email.trim().toLowerCase() : email })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ error: "Cet e-mail est déjà utilisé par un autre abonné. Chaque adresse email doit être unique." });
      }
      throw error;
    }
    res.json({ message: "Abonné mis à jour avec succès.", subscriber: data });
  } catch (err) {
    console.error('Erreur mise à jour abonné:', err);
    res.status(500).json({ error: "Erreur lors de la mise à jour de l'abonné: " + (err.message || JSON.stringify(err)) });
  }
});

// POST /api/newsletter/clean-duplicates (Admin)
// Détecte et supprime les abonnés en doublon d'email.
// Pour chaque groupe, conserve celui dont le nom correspond le mieux à la partie locale de l'email.
router.post('/clean-duplicates', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { dry_run = false } = req.body;

    // Récupérer tous les abonnés
    const { data: allSubs, error: fetchErr } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchErr) throw fetchErr;

    /**
     * Normalise une chaîne : minuscules, sans accents, alphanumériques seulement.
     */
    function normalize(str) {
      if (!str) return '';
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');
    }

    /**
     * Score de correspondance nom/prénom ↔ partie locale de l'email.
     */
    function matchScore(subscriber, localPart) {
      const local = normalize(localPart);
      const prenom = normalize(subscriber.prenom);
      const nom = normalize(subscriber.nom);
      let score = 0;
      if (prenom && local.includes(prenom)) score += 2;
      if (nom && local.includes(nom)) score += 2;
      const full = prenom + nom;
      if (full && full.length > 2 && local.includes(full)) score += 3;
      if (subscriber.institution) score += 0.5;
      if (subscriber.fonction) score += 0.5;
      return score;
    }

    // Grouper par email (insensible à la casse)
    const groups = new Map();
    for (const sub of allSubs) {
      const key = sub.email.toLowerCase().trim();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(sub);
    }

    const duplicateGroups = [...groups.entries()].filter(([, subs]) => subs.length > 1);

    if (duplicateGroups.length === 0) {
      return res.json({
        message: 'Aucun doublon détecté. La base est déjà propre !',
        duplicates_found: 0,
        deleted: 0,
        details: []
      });
    }

    const toDelete = [];
    const details = [];

    for (const [email, subs] of duplicateGroups) {
      const localPart = email.split('@')[0];

      const sorted = [...subs].sort((a, b) => {
        const scoreDiff = matchScore(b, localPart) - matchScore(a, localPart);
        if (scoreDiff !== 0) return scoreDiff;
        return new Date(b.created_at) - new Date(a.created_at);
      });

      const keeper = sorted[0];
      const duplicates = sorted.slice(1);

      details.push({
        email,
        kept: { id: keeper.id, prenom: keeper.prenom, nom: keeper.nom, score: matchScore(keeper, localPart) },
        removed: duplicates.map(d => ({ id: d.id, prenom: d.prenom, nom: d.nom, score: matchScore(d, localPart) }))
      });

      for (const dup of duplicates) {
        toDelete.push(dup.id);
      }
    }

    if (dry_run || toDelete.length === 0) {
      return res.json({
        message: dry_run
          ? `[Simulation] ${toDelete.length} doublon(s) seraient supprimés.`
          : 'Aucun doublon à supprimer.',
        duplicates_found: duplicateGroups.length,
        deleted: 0,
        details
      });
    }

    // Supprimer par lots de 50
    let deleted = 0;
    const chunkSize = 50;
    for (let i = 0; i < toDelete.length; i += chunkSize) {
      const chunk = toDelete.slice(i, i + chunkSize);
      const { error: delError } = await supabase
        .from('newsletter_subscribers')
        .delete()
        .in('id', chunk);

      if (delError) {
        console.error('Erreur suppression doublons lot', i / chunkSize + 1, ':', delError.message);
      } else {
        deleted += chunk.length;
      }
    }

    console.log(`[newsletter] Nettoyage doublons : ${deleted}/${toDelete.length} supprimés.`);

    res.json({
      message: `Nettoyage terminé : ${deleted} doublon(s) supprimé(s).`,
      duplicates_found: duplicateGroups.length,
      deleted,
      details
    });
  } catch (err) {
    console.error('Erreur clean-duplicates:', err);
    res.status(500).json({ error: "Erreur lors du nettoyage : " + (err.message || JSON.stringify(err)) });
  }
});

// GET /api/newsletter/campaigns (Admin)
router.get('/campaigns', authMiddleware, requireAdmin, async (req, res) => {
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
router.delete('/campaigns/:id', authMiddleware, requireAdmin, async (req, res) => {
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
router.post('/admin/add-subscribers', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { emails, subscribers } = req.body;
    let inputList = [];

    if (subscribers && Array.isArray(subscribers) && subscribers.length > 0) {
      inputList = subscribers;
    } else if (emails && Array.isArray(emails) && emails.length > 0) {
      inputList = emails.map(e => ({ email: e }));
    } else {
      return res.status(400).json({ error: "Aucun abonné fourni." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validSubsMap = new Map();
    let invalidCount = 0;

    for (const sub of inputList) {
      if (!sub.email || typeof sub.email !== 'string') { invalidCount++; continue; }
      const cleanEmail = sub.email.trim().toLowerCase();
      if (!emailRegex.test(cleanEmail)) { invalidCount++; continue; }
      if (!validSubsMap.has(cleanEmail)) {
        validSubsMap.set(cleanEmail, {
          email: cleanEmail,
          prenom: sub.prenom?.trim() || null,
          nom: sub.nom?.trim() || null,
          institution: sub.institution?.trim() || null,
          fonction: sub.fonction?.trim() || null,
          statut: 'actif'
        });
      }
    }

    const validEmails = Array.from(validSubsMap.keys());

    if (validEmails.length === 0) {
      return res.status(400).json({
        error: `Aucun email valide fourni (${invalidCount} email(s) ignoré(s) car mal formatés ou vides).`
      });
    }

    // Récupérer les emails déjà existants
    const { data: existing, error: fetchErr } = await supabase
      .from('newsletter_subscribers')
      .select('email')
      .in('email', validEmails);

    if (fetchErr) throw fetchErr;

    const existingEmails = existing.map(e => e.email);
    const toInsert = Array.from(validSubsMap.values()).filter(s => !existingEmails.includes(s.email));
    const alreadyCount = existingEmails.length;

    if (toInsert.length > 0) {
      const { data, error: insertErr } = await supabase
        .from('newsletter_subscribers')
        .insert(toInsert)
        .select();
      if (insertErr) {
        if (insertErr.code === '23505') {
          return res.status(400).json({ error: "Un ou plusieurs emails sont déjà inscrits (contrainte d'unicité). Relancez l'import." });
        }
        throw insertErr;
      }

      let msg = `${toInsert.length} abonné(s) ajouté(s).`;
      if (alreadyCount > 0) msg += ` (${alreadyCount} email(s) ignoré(s) car déjà inscrits)`;
      if (invalidCount > 0) msg += ` (${invalidCount} email(s) invalide(s) ignoré(s))`;

      return res.json({ message: msg, newSubscribers: data });
    }

    // Aucun nouveau à insérer
    let msg = `Tous ces emails étaient déjà inscrits (${alreadyCount} au total).`;
    if (invalidCount > 0) msg += ` ${invalidCount} email(s) invalide(s) ignoré(s).`;
    res.json({ message: msg, newSubscribers: [] });
  } catch (err) {
    console.error('Erreur admin/add-subscribers:', err.message);
    res.status(500).json({ error: "Erreur lors de l'ajout : " + (err.message || 'Erreur serveur') });
  }
});

// POST /api/newsletter/preview (Admin)
router.post('/preview', authMiddleware, requireAdmin, async (req, res) => {
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
              linkUrl: frontendUrl + '/actualites/' + act.id,
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
        linkUrl = frontendUrl + '/actualites/' + act.id;
      }
    } else if (type_source === 'evenement' && source_id) {
      const { data: ev, error: evErr } = await supabase.from('evenements').select('*').eq('id', source_id).single();
      if (!evErr) {
        titre = ev.titre;
        description = ev.description || ev.lieu || '';
        imageUrl = ev.image_url;
        linkUrl = frontendUrl + '/evenements/' + ev.id;
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
router.post('/campaigns', authMiddleware, requireAdmin, async (req, res) => {
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
              linkUrl: frontendUrl + '/actualites/' + act.id,
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
      linkUrl = frontendUrl + '/actualites/' + act.id;
    } else if (type_source === 'evenement' && source_id) {
      const { data: ev, error: evErr } = await supabase.from('evenements').select('*').eq('id', source_id).single();
      if (evErr) throw evErr;
      titre = ev.titre;
      description = ev.description || ev.lieu || '';
      imageUrl = ev.image_url;
      linkUrl = frontendUrl + '/evenements/' + ev.id;
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
    }).then(async ({ successCount, failCount, failedEmails }) => {
      // Update campaign status
      const { error: updateErr } = await supabase
        .from('newsletter_campaigns')
        .update({ 
          statut: 'envoye', 
          date_envoi: new Date().toISOString(),
          success_count: successCount,
          fail_count: failCount,
          failed_emails: failedEmails || []
        })
        .eq('id', campaign.id);
        
      if (updateErr) {
        console.error('Erreur Supabase lors de la mise à jour du statut:', updateErr);
      } else {
        console.log(`Campaign sent: ${successCount} success, ${failCount} failed.`);
      }
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
