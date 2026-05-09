import { defineStore } from 'pinia'

const ENV_TOKEN = import.meta.env.VITE_AIRTABLE_TOKEN || ''

export const useAirtableStore = defineStore('airtable', {
  state: () => ({
    base: 'appqgfu3Ten3zehfb',
    tbl: {
      a: 'tbl5KA4B1qTiM9ktY',
      s: 'tblHUb5Gq6Rr64Yly',
      v: 'tbl1y0Zf88ErEqifX',
      e: 'tblJ92j4syVfWqEsS'
    },
    token: ENV_TOKEN || localStorage.getItem('airtable_token') || '',
    isEnvToken: !!ENV_TOKEN,
    eventRegistrations: [],
    eventRecords: [],
    avisRecords: [],
    suiviRecords: [],
    accueilRecords: [],
    rotationStatus: { photo: null, '3d': null, recit: null },
    rotationHistory: [],
    eventFetchError: ''
  }),
  getters: {
    allEventEntries: (state) => [...state.eventRegistrations, ...state.eventRecords],
    sessionCounts: (state) =>
      state.eventRegistrations.concat(state.eventRecords).reduce((acc, registration) => {
        const key = registration.session || 'Non défini'
        acc[key] = (acc[key] || 0) + (registration.count || 1)
        return acc
      }, {}),
    totalRegistrations: (state) =>
      state.eventRegistrations.concat(state.eventRecords).reduce((sum, registration) => sum + (registration.count || 1), 0),
    isConnected: (state) => !!state.token,
    statusText: (state) =>
      state.token
        ? 'Connecté — Base "JIM 2026 — Musée Virtuel de Guinée" prête.'
        : 'Entrez votre Personal Access Token pour activer l’enregistrement.'
  },
  actions: {
    connect(token) {
      this.token = token.trim()
      if (this.token) {
        localStorage.setItem('airtable_token', this.token)
      } else {
        localStorage.removeItem('airtable_token')
      }
    },
    async sendRecord(tableKey, fields) {
      if (!this.token) {
        throw new Error('Token Airtable manquant')
      }
      fields.Date = new Date().toISOString().split('T')[0]
      // Supprimer les valeurs vides pour éviter les erreurs sur les champs singleSelect
      const cleanFields = Object.fromEntries(
        Object.entries(fields).filter(([, v]) => v !== '' && v !== null && v !== undefined)
      )
      const response = await fetch(`https://api.airtable.com/v0/${this.base}/${this.tbl[tableKey]}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields: cleanFields })
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}))
        const type = payload?.error?.type || ''
        const msg = payload?.error?.message || `HTTP ${response.status}`
        if (type === 'INVALID_PERMISSIONS_OR_MODEL_NOT_FOUND') {
          throw new Error('Permissions insuffisantes — vérifiez que le token a les scopes data.records:read ET data.records:write, et qu\'il a accès à cette base.')
        }
        throw new Error(msg)
      }
      return response.json()
    },
    addEventRegistration(registration) {
      this.eventRegistrations.push(registration)
    },
    async fetchRecords(tableKey, params = {}) {
      if (!this.token) {
        throw new Error('Token Airtable manquant')
      }
      const query = new URLSearchParams(params).toString()
      const records = []
      let offset = ''
      do {
        const url = `https://api.airtable.com/v0/${this.base}/${this.tbl[tableKey]}${query ? `?${query}` : ''}${offset ? `&offset=${offset}` : ''}`
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${this.token}` }
        })
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
    async fetchEventRegistrations() {
      return this.fetchRecords('e')
    },
    setEventRecords(records) {
      this.eventRecords = records
    },
    async loadEventRegistrations() {
      this.eventFetchError = ''
      try {
        const records = await this.fetchEventRegistrations()
        this.eventRecords = records.map((record) => {
          const fields = record.fields || {}
          const count = parseInt(fields['Nombre de participant·e·s'] || fields['Nombre de participants'] || 1, 10) || 1
          return {
            session: fields.Session || 'Non défini',
            count,
            contactConsent: fields['Accepte contact'] === 'Oui'
          }
        })
      } catch (error) {
        this.eventFetchError = error.message || 'Erreur de chargement Airtable'
        throw error
      }
    },
    async fetchAvis() {
      return this.fetchRecords('v')
    },
    setAvisRecords(records) {
      this.avisRecords = records
    },
    async loadAvis() {
      try {
        const records = await this.fetchAvis()
        this.avisRecords = records.map((record) => record.fields || {})
      } catch (error) {
        console.warn('Erreur de chargement des avis :', error.message)
      }
    },
    async loadSuivi() {
      try {
        const records = await this.fetchRecords('s')
        this.suiviRecords = records
          .map((record) => record.fields || {})
          .filter(f => f.Observations !== '__IN__')
      } catch (error) {
        console.warn('Erreur de chargement du suivi pôles :', error.message)
      }
    },
    async loadRotationStatus() {
      try {
        const today = new Date().toISOString().split('T')[0]
        const records = await this.fetchRecords('s', {
          filterByFormula: `{Date}='${today}'`
        })
        const sorted = [...records].sort((a, b) =>
          new Date(b.createdTime) - new Date(a.createdTime)
        )
        const keyMap = { 'Pôle Photo': 'photo', 'Pôle 3D': '3d', 'Pôle Récit': 'recit' }
        const seen = new Set()
        const status = { photo: null, '3d': null, recit: null }
        const history = []
        for (const r of sorted) {
          const poleKey = keyMap[r.fields?.['Pôle concerné']]
          if (!poleKey) continue
          const isCheckin = (r.fields?.Observations || '') === '__IN__'
          if (!isCheckin) {
            history.push({
              pole: r.fields?.['Pôle concerné'],
              poleKey,
              groupeId: r.fields?.['Groupe ID'] || '',
              groupe: r.fields?.['Groupe attribué'] || '',
              createdTime: r.createdTime,
            })
          }
          if (!seen.has(poleKey)) {
            seen.add(poleKey)
            status[poleKey] = isCheckin
              ? { groupeId: r.fields?.['Groupe ID'] || '', groupe: r.fields?.['Groupe attribué'] || '' }
              : null
          }
        }
        this.rotationStatus = status
        this.rotationHistory = history
      } catch (e) {
        console.warn('Erreur rotation status :', e.message)
      }
    },
    async checkInPole(poleLabel, groupId, groupColor) {
      const keyMap = { 'Pôle Photo': 'photo', 'Pôle 3D': '3d', 'Pôle Récit': 'recit' }
      await this.sendRecord('s', {
        Référence: `${poleLabel} · ${groupId} · CHECK-IN`,
        'Pôle concerné': poleLabel,
        'Groupe ID': groupId,
        'Groupe attribué': groupColor,
        'Participants passés': 0,
        'Participants actifs': 0,
        'Contenus produits': 0,
        Observations: '__IN__'
      })
      const poleKey = keyMap[poleLabel]
      if (poleKey) this.rotationStatus[poleKey] = { groupeId: groupId, groupe: groupColor }
    },
    freePole(poleKey) {
      if (poleKey in this.rotationStatus) this.rotationStatus[poleKey] = null
    },
    async loadAccueil() {
      try {
        const today = new Date().toISOString().split('T')[0]
        const records = await this.fetchRecords('a', {
          filterByFormula: `{Date}='${today}'`
        })
        this.accueilRecords = records.map((r) => ({
          groupeId: r.fields?.['Groupe ID'] || '',
          groupe: r.fields?.['Groupe attribué'] || '',
          personnes: r.fields?.['Nombre de personnes'] || 0,
          heure: r.fields?.["Heure d'arrivée"] || '',
        })).filter(r => r.groupeId)
      } catch (error) {
        console.warn('Erreur de chargement accueil :', error.message)
      }
    },
    addAccueilRecord(record) {
      this.accueilRecords.push(record)
    }
  }
})
