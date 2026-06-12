import express from 'express'
import supabase from '../config/supabase.js'
import { sendNewsletterWelcome } from '../services/emailService.js'

const router = express.Router()

// POST /api/newsletter/subscribe
router.post('/subscribe', async (req, res) => {
  const { email } = req.body;
  
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: "L'adresse e-mail est requise." });
  }

  const trimmedEmail = email.trim().toLowerCase();

  // Basic regex validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return res.status(400).json({ error: "Format d'adresse e-mail invalide." });
  }

  try {
    // Check if the email is already subscribed
    const { data: existing, error: checkError } = await supabase
      .from('newsletter_subscribers')
      .select('id')
      .eq('email', trimmedEmail)
      .single();

    if (existing) {
      return res.status(400).json({ error: "Cette adresse e-mail est déjà inscrite à la newsletter." });
    }

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw checkError;
    }

    // Insert the new subscriber
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .insert([{ email: trimmedEmail }])
      .select()
      .single();

    if (error) {
      // Supabase unique constraint violation error code is usually '23505'
      if (error.code === '23505') {
        return res.status(400).json({ error: "Cette adresse e-mail est déjà inscrite à la newsletter." });
      }
      throw error;
    }

    // Send the welcome email
    try {
      await sendNewsletterWelcome({ email: trimmedEmail });
    } catch (emailErr) {
      console.error('Erreur lors de l\'envoi de l\'email de bienvenue:', emailErr.message);
      // We don't fail the request since the subscription itself was successful
    }

    res.status(201).json({ message: "Inscription réussie !", subscriber: data });
  } catch (err) {
    console.error('Erreur inscription newsletter:', err.message);
    res.status(500).json({ error: "Erreur serveur lors de l'inscription." });
  }
});

export default router
