import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import hpp from 'hpp'

// Routes
import authRouter from './routes/auth.js'
import evenementsRouter from './routes/evenements.js'
import invitesRouter from './routes/invites.js'
import invitationsRouter from './routes/invitations.js'
import rsvpRouter from './routes/rsvp.js'
import checkinRouter from './routes/checkin.js'
import actualitesRouter from './routes/actualites.js'
import contactRouter from './routes/contact.js'
import newsletterRouter from './routes/newsletter.js'
import shareRouter from './routes/share.js'
import revuePresseRouter from './routes/revuePresse.js'
import heroSlidesRouter from './routes/heroSlides.js'
import livreDorRouter from './routes/livreDor.js'
import rssRouter from './routes/rss.js'

// Services (for the public QR endpoint)
import { generateQrPng } from './services/qrService.js'
import supabase, { ensureStorageBuckets } from './config/supabase.js'

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
  'http://localhost:5174',
  'http://localhost:5175',
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

// Body parsing — limite 10 Mo (suffisant pour les images base64 compressées)
// NOTE : Render free tier a ~512 Mo RAM. Une limite de 200 Mo causait des crashs OOM (502).
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// HTTP Parameter Pollution protection
app.use(hpp())

// Trust proxy for rate limiting if behind a reverse proxy (like Render/Railway)
app.set('trust proxy', 1)

// Global Rate Limiter (Anti DDoS basique)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limite chaque IP à 1000 requêtes par fenêtre
  message: { error: 'Trop de requêtes, veuillez réessayer plus tard.' },
  standardHeaders: true,
  legacyHeaders: false
})
app.use('/api', globalLimiter)

// ─── Health check (public) ─────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: "MVG Event's Backend — Musée Virtuel de Guinée",
    timestamp: new Date().toISOString()
  })
})

// ─── Image proxy for CORS/Hotlink bypass (public) ─────────────────────────────
app.get('/api/proxy-image', async (req, res) => {
  try {
    const { url } = req.query
    if (!url) return res.status(400).json({ error: 'URL is required' })

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      redirect: 'follow'
    })

    if (!response.ok) {
      return res.status(response.status).send(`Failed to fetch image: ${response.statusText}`)
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    res.setHeader('Content-Type', contentType)
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
    res.setHeader('Cache-Control', 'public, max-age=86400') // Cache 1 day

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    res.send(buffer)
  } catch (err) {
    res.status(500).send(`Error proxying image: ${err.message}`)
  }
})

// ─── Public routes (no auth required) ─────────────────────────────────────────

// RSVP: guests access their invitation by token without logging in
app.use('/api/rsvp', rsvpRouter)

// Actualités: public endpoint for website news
app.use('/api/actualites', actualitesRouter)

// Contact form: public endpoint for website enquiries
app.use('/api/contact', contactRouter)

// Revue de presse: public endpoints (admin protected inside router)
app.use('/api/revue-presse', revuePresseRouter)

// Newsletter subscription: public endpoint
app.use('/api/newsletter', newsletterRouter)

// Hero slides: public endpoint
app.use('/api/hero-slides', heroSlidesRouter)

// Livre d'or: public endpoints (admin protected inside router)
app.use('/api/livre-dor', livreDorRouter)

// Dynamic Open Graph sharing endpoint
app.use('/api/share', shareRouter)

// RSS feed: public endpoint for RSS campaigns (e.g. Brevo)
app.use('/api/rss', rssRouter)

// QR code PNG — public so that email clients can embed the image directly.
// This must be registered BEFORE the auth-protected /api/invitations mount.
app.get('/api/invitations/qr/:token', async (req, res, next) => {
  try {
    let { token } = req.params
    if (token.endsWith('.png')) {
      token = token.slice(0, -4)
    }

    // Verify token exists in DB (cheap lookup, no sensitive data returned)
    const { data, error } = await supabase
      .from('invitations')
      .select('id')
      .eq('token', token)
      .single()

    if (error || !data) return res.status(404).json({ error: 'Invitation introuvable' })

    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')
    const pngBuffer = await generateQrPng(token, frontendUrl)

    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
    res.setHeader('Cache-Control', 'public, max-age=86400') // Cache 1 day
    res.send(pngBuffer)
  } catch (err) {
    next(err)
  }
})

// ─── Protected routes (JWT required) ──────────────────────────────────────────

app.use('/api/auth', authRouter)

app.use('/api/evenements', evenementsRouter)
app.use('/api/invites', invitesRouter)
app.use('/api/invitations', invitationsRouter)
app.use('/api/checkin', checkinRouter)

// ─── 404 handler ───────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: 'Route introuvable' })
})

// ─── Global error handler ──────────────────────────────────────────────────────

app.use(errorHandler)

// ─── Start server ──────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT) || 3000

const startServer = async () => {
  await ensureStorageBuckets()

  app.listen(PORT, () => {
    console.log(`✅  MVG Event's Backend running on port ${PORT}`)
    console.log(`   Frontend URL : ${process.env.FRONTEND_URL || '(not set)'}`)
    console.log(`   Supabase URL : ${process.env.SUPABASE_URL || '(not set)'}`)
    console.log(`   Environment  : ${process.env.NODE_ENV || 'development'}`)
  })
}

startServer()

export default app
