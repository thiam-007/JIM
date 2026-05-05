import { defineStore } from 'pinia'

export const useAirtableStore = defineStore('airtable', {
  state: () => ({
    base: 'appqgfu3Ten3zehfb',
    tbl: {
      a: 'tbl5KA4B1qTiM9ktY',        // Accueil Visiteurs
      s: 'tblHUb5Gq6Rr64Yly',        // Suivi Pôles
      v: 'tbl1y0Zf88ErEqifX',        // Avis Visiteurs
      e: 'tblEventRegistrations'     // Inscriptions (remplacer par l'ID réel)
    },
    token: '',
    eventRegistrations: [],   // saisies locales (session)
    eventRecords: [],          // chargées depuis Airtable (inscriptions)
    avisRecords: [],           // Avis visiteurs (table v)
    accueilRecords: [],        // Accueil visiteurs (table a)
    suiviRecords: [],          // Suivi pôles (table s)
    eventFetchError: ''
  }),

  getters: {
    isConnected: (state) => !!state.token,

    // ─── Inscriptions ───────────────────────────────────────────
    allEntries: (state) => state.eventRegistrations.concat(state.eventRecords),

    totalRegistrations: (_, getters) =>
      getters.allEntries.reduce((sum, r) => sum + (r.count || 1), 0),

    sessionCounts: (_, getters) =>
      getters.allEntries.reduce((acc, r) => {
        const key = r.session || 'Non défini'
        acc[key] = (acc[key] || 0) + (r.count || 1)
        return acc
      }, {}),

    // Participants par jour (Jour 1 / Jour 2 / Jour 3)
    statsByJour: (_, getters) => {
      const result = { 'Jour 1': 0, 'Jour 2': 0, 'Jour 3': 0 }
      getters.allEntries.forEach(r => {
        if (r.jour && result[r.jour] !== undefined) result[r.jour] += (r.count || 1)
      })
      return result
    },

    // Participants par lieu
    statsByLieu: (_, getters) => {
      const result = {}
      getters.allEntries.forEach(r => {
        if (!r.lieu) return
        result[r.lieu] = (result[r.lieu] || 0) + (r.count || 1)
      })
      return result
    },

    // Participants par jour ET par lieu
    statsByJourLieu: (_, getters) => {
      const result = {}
      getters.allEntries.forEach(r => {
        if (!r.jour || !r.lieu) return
        if (!result[r.jour]) result[r.jour] = {}
        result[r.jour][r.lieu] = (result[r.jour][r.lieu] || 0) + (r.count || 1)
      })
      return result
    },

    // ─── Accueil visiteurs ──────────────────────────────────────
    totalVisiteurs: (state) =>
      state.accueilRecords.reduce((sum, r) => sum + (parseInt(r['Nombre de personnes'], 10) || 0), 0),

    visiteursByProfile: (state) =>
      state.accueilRecords.reduce((acc, r) => {
        const p = r['Profil du public'] || 'Non défini'
        acc[p] = (acc[p] || 0) + (parseInt(r['Nombre de personnes'], 10) || 1)
        return acc
      }, {}),

    // ─── Suivi Pôles ────────────────────────────────────────────
    poleStats: (state) => {
      const poles = {
        'Pôle Photo':  { rotations: 0, passés: 0, actifs: 0, contenus: 0 },
        'Pôle 3D':    { rotations: 0, passés: 0, actifs: 0, contenus: 0 },
        'Pôle Récit': { rotations: 0, passés: 0, actifs: 0, contenus: 0 },
      }
      state.suiviRecords.forEach(r => {
        const p = r['Pôle concerné']
        if (!p || !poles[p]) return
        poles[p].rotations++
        poles[p].passés   += parseInt(r['Participants passés'] || 0, 10)
        poles[p].actifs   += parseInt(r['Participants actifs'] || 0, 10)
        poles[p].contenus += parseInt(r['Contenus produits']   || 0, 10)
      })
      return poles
    },

    totalContenus: (state) =>
      state.suiviRecords.reduce((sum, r) => sum + (parseInt(r['Contenus produits'] || 0, 10)), 0),

    // ─── Avis visiteurs ─────────────────────────────────────────
    averageRating: (state) => {
      const notes = state.avisRecords.map(r => parseFloat(r.Note || 0)).filter(n => n > 0)
      return notes.length ? notes.reduce((s, n) => s + n, 0) / notes.length : 0
    },

    noteDistribution: (state) => {
      const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      state.avisRecords.forEach(r => {
        const n = Math.round(parseFloat(r.Note || 0))
        if (n >= 1 && n <= 5) dist[n]++
      })
      return dist
    },

    polePrefereStats: (state) =>
      state.avisRecords.reduce((acc, r) => {
        const p = r.PolePrefere || 'Non défini'
        acc[p] = (acc[p] || 0) + 1
        return acc
      }, {}),

    tauxNewsletter: (state) => {
      if (!state.avisRecords.length) return 0
      const oui = state.avisRecords.filter(r => r.Newsletter === 'Oui').length
      return Math.round((oui / state.avisRecords.length) * 100)
    },
  },

  actions: {
    connect(token) {
      this.token = token.trim()
    },

    // ─── Envoi d'un enregistrement ──────────────────────────────
    async sendRecord(tableKey, fields) {
      if (!this.token) throw new Error('Token Airtable manquant')
      fields.Date = new Date().toISOString().split('T')[0]
      const response = await fetch(`https://api.airtable.com/v0/${this.base}/${this.tbl[tableKey]}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields })
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        throw new Error(payload?.error?.message || `HTTP ${response.status}`)
      }
      return response.json()
    },

    // ─── Fetch générique (pagination) ───────────────────────────
    async fetchRecords(tableKey) {
      if (!this.token) throw new Error('Token Airtable manquant')
      const records = []
      let offset = ''
      do {
        const url = `https://api.airtable.com/v0/${this.base}/${this.tbl[tableKey]}${offset ? `?offset=${offset}` : ''}`
        const response = await fetch(url, { headers: { Authorization: `Bearer ${this.token}` } })
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          throw new Error(payload?.error?.message || `HTTP ${response.status}`)
        }
        const payload = await response.json()
        records.push(...payload.records)
        offset = payload.offset || ''
      } while (offset)
      return records
    },

    // ─── Inscriptions événement ─────────────────────────────────
    addEventRegistration(registration) {
      this.eventRegistrations.push(registration)
    },

    async loadEventRegistrations() {
      this.eventFetchError = ''
      try {
        const records = await this.fetchRecords('e')
        this.eventRecords = records.map(record => {
          const f = record.fields || {}
          return {
            id:             record.id,
            session:        f.Session || 'Non défini',
            jour:           f.Jour    || '',
            lieu:           f.Lieu    || '',
            creneau:        f['Créneau'] || '',
            count:          parseInt(f['Nombre de participant·e·s'] || f['Nombre de participants'] || 1, 10) || 1,
            contactConsent: f['Accepte contact'] === 'Oui'
          }
        })
      } catch (error) {
        this.eventFetchError = error.message || 'Erreur de chargement Airtable'
        throw error
      }
    },

    // ─── Accueil visiteurs ──────────────────────────────────────
    async loadAccueilData() {
      try {
        const records = await this.fetchRecords('a')
        this.accueilRecords = records.map(r => r.fields || {})
      } catch (error) {
        console.warn('Erreur chargement accueil :', error.message)
      }
    },

    // ─── Suivi pôles ────────────────────────────────────────────
    async loadSuiviData() {
      try {
        const records = await this.fetchRecords('s')
        this.suiviRecords = records.map(r => r.fields || {})
      } catch (error) {
        console.warn('Erreur chargement suivi pôles :', error.message)
      }
    },

    // ─── Avis visiteurs (table v, pas a !) ─────────────────────
    async loadAvis() {
      try {
        const records = await this.fetchRecords('v')
        this.avisRecords = records.map(record => {
          const f = record.fields || {}
          return {
            id:          record.id,
            Nom:         f['Nom et Prénom'] || '',
            Note:        parseFloat(f['Note de satisfaction'] || f.Note || 0),
            Commentaire: f['Découverte'] || f.Commentaire || '',
            PolePrefere: f['Pôle préféré'] || '',
            Newsletter:  f.Newsletter || 'Non',
            Date:        f.Date || ''
          }
        })
      } catch (error) {
        console.warn('Erreur chargement avis :', error.message)
      }
    },

    // ─── Chargement global (toutes les tables) ──────────────────
    async loadAll() {
      await Promise.allSettled([
        this.loadEventRegistrations(),
        this.loadAccueilData(),
        this.loadSuiviData(),
        this.loadAvis()
      ])
    }
  }
})
