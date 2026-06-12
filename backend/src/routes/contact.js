import { Router } from 'express'
import { submitContactMessage } from '../services/contactService.js'

const router = Router()

router.post('/', async (req, res, next) => {
  try {
    const result = await submitContactMessage(req.body)
    res.status(201).json(result)
  } catch (err) {
    res.status(400).json({ error: err.message || 'Impossible d’envoyer le message' })
  }
})

export default router
