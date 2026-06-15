import { defineStore } from 'pinia'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000'

export const useApiStore = defineStore('api', {
  state: () => ({
    token: sessionStorage.getItem('jim_jwt') || '',
    userRole: sessionStorage.getItem('jim_user_role') || '',
    userEmail: sessionStorage.getItem('jim_user_email') || '',
    userPrenom: sessionStorage.getItem('jim_user_prenom') || '',
    userNom: sessionStorage.getItem('jim_user_nom') || '',
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
      const { token, role, email: userEmail, prenom, nom } = await res.json()
      this.token = token
      this.userRole = role || 'admin'
      this.userEmail = userEmail || ''
      this.userPrenom = prenom || ''
      this.userNom = nom || ''
      sessionStorage.setItem('jim_jwt', token)
      sessionStorage.setItem('jim_user_role', this.userRole)
      sessionStorage.setItem('jim_user_email', this.userEmail)
      sessionStorage.setItem('jim_user_prenom', this.userPrenom)
      sessionStorage.setItem('jim_user_nom', this.userNom)
      sessionStorage.setItem('jim_auth', '1')
    },
    logout() {
      this.token = ''
      this.userRole = ''
      this.userEmail = ''
      this.userPrenom = ''
      this.userNom = ''
      sessionStorage.removeItem('jim_jwt')
      sessionStorage.removeItem('jim_user_role')
      sessionStorage.removeItem('jim_user_email')
      sessionStorage.removeItem('jim_user_prenom')
      sessionStorage.removeItem('jim_user_nom')
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
          publieLe: item.date_evenement || item.created_at || new Date().toISOString(),
          imageUrl: item.image_url || '/images/side-photo.jpeg',
          imageDetailUrl: item.image_detail_url || item.image_url || '/images/side-photo.jpeg'
        }))
      } catch (err) {
        console.error('Erreur chargement Supabase actualites :', err)
        this.actualites = []
      } finally {
        this.loading = false
      }
    }
  }
})
