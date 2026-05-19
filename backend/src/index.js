import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'

// Routes
import authRouter from './routes/auth.js'
import evenementsRouter from './routes/evenements.js'
import invitesRouter from './routes/invites.js'
import invitationsRouter from './routes/invitations.js'
import rsvpRouter from './routes/rsvp.js'
import checkinRouter from './routes/checkin.js'

// Services (for the public QR endpoint)
import { generateQrPng } from './services/qrService.js'
import supabase from './config/supabase.js'

// Middleware
import { authMiddleware } from './middleware/auth.js'
import { errorHandler } from './middleware/errorHandler.js'

// ─── App setup ─────────────────────────────────────────────────────────────────

const app = express()

// Security headers
app.use(helmet())

// CORS — allow the Vercel frontend (and localhost for dev)
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173'
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. Postman, mobile apps, curl)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Body parsing
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true }))

// ─── Health check (public) ─────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'JIM Backend — Musée Virtuel de Guinée',
    timestamp: new Date().toISOString()
  })
})

// ─── Public routes (no auth required) ─────────────────────────────────────────

// RSVP: guests access their invitation by token without logging in
app.use('/api/rsvp', rsvpRouter)

// QR code PNG — public so that email clients can embed the image directly.
// This must be registered BEFORE the auth-protected /api/invitations mount.
app.get('/api/invitations/qr/:token', async (req, res, next) => {
  try {
    const { token } = req.params

    // Verify token exists in DB (cheap lookup, no sensitive data returned)
    const { data, error } = await supabase
      .from('invitations')
      .select('id')
      .eq('token', token)
      .single()

    if (error || !data) return res.status(404).json({ error: 'Invitation introuvable' })

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const pngBuffer = await generateQrPng(token, frontendUrl)

    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'public, max-age=86400') // Cache 1 day
    res.send(pngBuffer)
  } catch (err) {
    next(err)
  }
})

// ─── Protected routes (JWT required) ──────────────────────────────────────────

app.use('/api/auth', authRouter)

app.use('/api/evenements', authMiddleware, evenementsRouter)
app.use('/api/invites', authMiddleware, invitesRouter)
app.use('/api/invitations', authMiddleware, invitationsRouter)
app.use('/api/checkin', authMiddleware, checkinRouter)

// ─── 404 handler ───────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: 'Route introuvable' })
})

// ─── Global error handler ──────────────────────────────────────────────────────

app.use(errorHandler)

// ─── Start server ──────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT) || 3000

app.listen(PORT, () => {
  console.log(`✅  JIM Backend running on port ${PORT}`)
  console.log(`   Frontend URL : ${process.env.FRONTEND_URL || '(not set)'}`)
  console.log(`   Supabase URL : ${process.env.SUPABASE_URL || '(not set)'}`)
  console.log(`   Environment  : ${process.env.NODE_ENV || 'development'}`)
})

export default app
