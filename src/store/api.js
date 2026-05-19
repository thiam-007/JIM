import { defineStore } from 'pinia'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const useApiStore = defineStore('api', {
  state: () => ({
    token: sessionStorage.getItem('jim_jwt') || '',
    evenements: [],
    invites: [],
    invitations: [],
    loading: false,
    error: ''
  }),
  getters: {
    isConnected: (state) => !!state.token,
    headers: (state) => ({
      'Content-Type': 'application/json',
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {})
    })
  },
  actions: {
    async login(password) {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      if (!res.ok) throw new Error('Mot de passe incorrect')
      const { token } = await res.json()
      this.token = token
      sessionStorage.setItem('jim_jwt', token)
      sessionStorage.setItem('jim_auth', '1')
    },
    logout() {
      this.token = ''
      sessionStorage.removeItem('jim_jwt')
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
      return res.json()
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
    }
  }
})
