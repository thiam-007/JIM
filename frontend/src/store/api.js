import { defineStore } from 'pinia'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000'

export const useApiStore = defineStore('api', {
  state: () => ({
    token: sessionStorage.getItem('jim_jwt') || '',
    userRole: sessionStorage.getItem('jim_user_role') || '',
    userEmail: sessionStorage.getItem('jim_user_email') || '',
    evenements: [],
    invites: [],
    invitations: [],
    accueilRecords: [],
    suiviRecords: [],
    avisRecords: [],
    sessionCounts: {},
    totalRegistrations: 0,
    loading: false,
    error: '',
    actualites: []
  }),
  getters: {
    isConnected: (state) => !!state.token,
    isSuperAdmin: (state) => state.userRole === 'super_admin',
    headers: (state) => ({
      'Content-Type': 'application/json',
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {})
    })
  },
  actions: {
    async login(email, password) {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Identifiants incorrects')
      }
      const { token, role, email: userEmail } = await res.json()
      this.token = token
      this.userRole = role || 'admin'
      this.userEmail = userEmail || ''
      sessionStorage.setItem('jim_jwt', token)
      sessionStorage.setItem('jim_user_role', this.userRole)
      sessionStorage.setItem('jim_user_email', this.userEmail)
      sessionStorage.setItem('jim_auth', '1')
    },
    logout() {
      this.token = ''
      this.userRole = ''
      this.userEmail = ''
      sessionStorage.removeItem('jim_jwt')
      sessionStorage.removeItem('jim_user_role')
      sessionStorage.removeItem('jim_user_email')
      sessionStorage.removeItem('jim_auth')
    },
    async get(path) {
      const res = await fetch(`${BASE_URL}${path}`, { headers: this.headers })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `HTTP ${res.status}`) }
      return res.json()
    },
    async post(path, body) {
      const res = await fetch(`${BASE_URL}${path}`, { method: 'POST', headers: this.headers, body: JSON.stringify(body) })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `HTTP ${res.status}`) }
      return res.json()
    },
    async put(path, body) {
      const res = await fetch(`${BASE_URL}${path}`, { method: 'PUT', headers: this.headers, body: JSON.stringify(body) })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `HTTP ${res.status}`) }
      return res.json()
    },
    async del(path) {
      const res = await fetch(`${BASE_URL}${path}`, { method: 'DELETE', headers: this.headers })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `HTTP ${res.status}`) }
      if (res.status === 204) return null
      return res.json().catch(() => null)
    },
    // Convenience methods
    async fetchEvenements() {
      this.loading = true
      try { this.evenements = (await this.get('/api/evenements')) || [] }
      finally { this.loading = false }
    },
    async fetchInvites(search = '') {
      const q = search ? `?search=${encodeURIComponent(search)}` : ''
      this.invites = (await this.get(`/api/invites${q}`)) || []
    },
    async fetchInvitations(evenement_id = '') {
      const q = evenement_id ? `?evenement_id=${evenement_id}` : ''
      this.invitations = (await this.get(`/api/invitations${q}`)) || []
    },
    async fetchDashboardStats() {
      return this.get('/api/evenements/dashboard/stats')
    },
    async fetchDashboardActivities() {
      return this.get('/api/evenements/dashboard/activities')
    },
    async subscribeNewsletter(email) {
      return this.post('/api/newsletter/subscribe', { email })
    },
    async fetchActualites() {
      this.loading = true
      try {
        const data = await this.get('/api/actualites')
        this.actualites = (data || []).map(item => ({
          id: item.id,
          titre: item.titre || '',
          description: item.description || '',
          contenu: item.contenu || '',
          publieLe: item.created_at || new Date().toISOString(),
          imageUrl: item.image_url || '/images/side-photo.jpeg',
          imageDetailUrl: item.image_detail_url || item.image_url || '/images/side-photo.jpeg'
        }))
      } catch (err) {
        console.error('Erreur chargement Supabase actualites, using fallback:', err)
        this.actualites = [
          {
            id: 'mock-1',
            titre: 'Numérisation 3D du patrimoine guinéen',
            description: 'Lancement de la phase de capture photogrammétrique des masques sacrés au Musée National de Sandervalia.',
            contenu: `Nous avons le plaisir d'annoncer le début du projet de numérisation 3D haute définition des collections du Musée National de Guinée. Ce chantier scientifique et technologique mobilisera nos équipes pendant plusieurs mois pour immortaliser des pièces uniques de notre patrimoine, incluant des masques rituels centenaires, des instruments de musique traditionnels et des parures royales. L'objectif est double : assurer la conservation numérique de ces œuvres d'art et les rendre accessibles au monde entier à travers notre future galerie interactive.`,
            publieLe: '2026-05-15T10:00:00Z',
            imageUrl: '/images/side-photo.jpeg'
          },
          {
            id: 'mock-2',
            titre: 'Vernissage de l’exposition "Mémoires et Rythmes"',
            description: 'Rejoignez-nous au Centre Culturel Franco-Guinéen pour une immersion physique et virtuelle inédite.',
            contenu: `Le Musée Virtuel de Guinée vous invite au vernissage exceptionnel de son exposition hybride "Mémoires et Rythmes", qui se tiendra au Centre Culturel Franco-Guinéen (CCFG). Cette exposition propose une expérience inédite alliant la présentation d'objets physiques et des casques de réalité virtuelle permettant d'explorer les musées régionaux de l'intérieur du pays. C'est l'occasion de découvrir les créations sonores inspirées de nos archives musicales récemment restaurées. Venez nombreux célébrer la rencontre de la tradition et du futur !`,
            publieLe: '2026-05-10T14:30:00Z',
            imageUrl: '/images/stand-mvg.jpeg'
          },
          {
            id: 'mock-3',
            titre: 'Atelier pédagogique : le patrimoine et les jeunes',
            description: 'Initiation à la modélisation 3D et aux techniques de récit pour les lycéens de Conakry.',
            contenu: `Dans le cadre de la Journée Internationale des Musées, les équipes du MVG animent des ateliers interactifs destinés aux jeunes générations. Au programme : découverte du patrimoine matériel guinéen, initiation ludique à la numérisation 3D par smartphone, et ateliers d'écriture pour raconter l'histoire des objets familiaux. Plus d'une centaine de lycéens ont déjà participé et partagé leurs créations sur notre plateforme. Une belle réussite pour susciter des vocations dans les métiers de la culture et du numérique !`,
            publieLe: '2026-05-08T09:00:00Z',
            imageUrl: '/images/banner-mvg.jpeg'
          }
        ]
      } finally {
        this.loading = false
      }
    }
  }
})
