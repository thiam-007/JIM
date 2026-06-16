import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { submitContactMessage } from '../services/contactService.js'

const router = Router()

const contactLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limite chaque IP à 5 messages de contact par minute
  message: { error: 'Trop de messages envoyés, veuillez patienter une minute.' },
  standardHeaders: true,
  legacyHeaders: false
})

router.post('/', contactLimiter, async (req, res, next) => {
  try {
    const result = await submitContactMessage(req.body)
    res.status(201).json(result)
  } catch (err) {
    res.status(400).json({ error: err.message || 'Impossible d’envoyer le message' })
  }
})

export default router
