<template>
  <div class="rsvp-shell">

    <!-- ─── Header MVG ─── -->
    <header class="rsvp-header">
      <div class="rsvp-logo-wrap">
        <img src="/images/logo-dark.jpg" alt="Musée Virtuel de Guinée" class="rsvp-logo" />
      </div>
      <div>
        <h1 class="rsvp-brand">Musée Virtuel de Guinée</h1>
        <p class="rsvp-brand-sub">Inscription à l'activité</p>
      </div>
    </header>

    <!-- ─── Chargement ─── -->
    <div v-if="loading" class="rsvp-loading">
      <div class="rsvp-spinner"></div>
      <p>Chargement des détails de l'activité…</p>
    </div>

    <!-- ─── Erreur ─── -->
    <div v-else-if="error" class="rsvp-card rsvp-error-card">
      <div class="rsvp-error-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
      <h2>Activité introuvable</h2>
      <p>{{ error }}</p>
    </div>

    <!-- ─── Formulaire d'inscription ─── -->
    <div v-else-if="evenement" class="rsvp-main">

      <!-- Carte événement -->
      <div class="rsvp-event-card">
        <div class="rsvp-event-header">
          <div class="rsvp-event-badge">ÉVÉNEMENT MVG</div>
          <h2 class="rsvp-event-title">{{ evenement.titre }}</h2>
          <div class="rsvp-event-details">
            <div v-if="evenement.date_debut" class="rsvp-event-detail">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {{ formatDate(evenement.date_debut) }}
            </div>
            <div v-if="evenement.lieu" class="rsvp-event-detail">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {{ evenement.lieu }}
            </div>
          </div>
        </div>

        <div class="rsvp-greeting" v-if="evenement.description">
          <p>{{ evenement.description }}</p>
        </div>
      </div>

      <!-- Formulaire -->
      <div class="rsvp-card rsvp-pending-card">
        <div class="rsvp-pending-title">S'inscrire à cette activité</div>
        <p class="rsvp-pending-desc">Veuillez renseigner vos coordonnées pour obtenir votre QR code d'accès.</p>

        <form @submit.prevent="submitRegistration" class="registration-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Prénom <span class="req">*</span></label>
              <input type="text" v-model="form.prenom" required class="form-input" placeholder="Ex : Fatoumata" />
            </div>
            <div class="form-group">
              <label class="form-label">Nom <span class="req">*</span></label>
              <input type="text" v-model="form.nom" required class="form-input" placeholder="Ex : Camara" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Adresse e-mail <span class="req">*</span></label>
              <input type="email" v-model="form.email" required class="form-input" placeholder="contact@example.com" />
            </div>
            <div class="form-group">
              <label class="form-label">Téléphone</label>
              <input type="tel" v-model="form.telephone" class="form-input" placeholder="+224 6XX XX XX XX" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Organisation / Institution</label>
              <input type="text" v-model="form.organisation" class="form-input" placeholder="Ex : Ministère de la Culture" />
            </div>
            <div class="form-group">
              <label class="form-label">Titre / Fonction</label>
              <input type="text" v-model="form.titre_poste" class="form-input" placeholder="Ex : Étudiant, Directeur..." />
            </div>
          </div>

          <div v-if="submitError" class="rsvp-error-inline">{{ submitError }}</div>
          <div v-if="submitSuccess" class="rsvp-success-inline">{{ submitSuccess }}</div>

          <button type="submit" class="rsvp-btn-confirm" :disabled="submitting" style="width: 100%; justify-content: center; margin-top: 20px;">
            <svg v-if="!submitting" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <div v-else class="rsvp-spinner-small"></div>
            <span>{{ submitting ? 'Inscription en cours…' : 'Valider mon inscription' }}</span>
          </button>
        </form>
      </div>

    </div>

    <!-- ─── Footer ─── -->
    <footer class="rsvp-footer">
      <p>Musée Virtuel de Guinée · MVG event's</p>
    </footer>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const eventId = route.params.eventId
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const loading = ref(true)
const error = ref('')
const evenement = ref(null)
const submitting = ref(false)
const submitError = ref('')

const form = ref({
  prenom: '',
  nom: '',
  email: '',
  organisation: '',
  titre_poste: '',
  telephone: ''
})
const submitSuccess = ref('')

onMounted(async () => {
  try {
    const res = await fetch(`${apiUrl}/api/rsvp/evenement/${eventId}`)
    if (!res.ok) {
      if (res.status === 404) throw new Error('Cette activité n\'existe pas ou a été retirée.')
      if (res.status === 403) throw new Error('Cette activité n\'est pas ouverte aux inscriptions publiques.')
      throw new Error('Erreur lors de la récupération des informations.')
    }
    evenement.value = await res.json()
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
})

async function submitRegistration() {
  if (!form.value.prenom.trim() || !form.value.nom.trim() || !form.value.email.trim()) return
  submitting.value = true
  submitError.value = ''
  submitSuccess.value = ''
  try {
    const res = await fetch(`${apiUrl}/api/rsvp/evenement/${eventId}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value)
    })
    
    const result = await res.json()
    if (!res.ok) {
      throw new Error(result.error || 'Erreur lors de l\'inscription.')
    }
    
    if (result.statut === 'liste_attente') {
      submitSuccess.value = result.message || 'Votre demande a été placée sur liste d’attente.'
    } else {
      router.push({ name: 'Rsvp', params: { token: result.token } })
    }
  } catch (err) {
    submitError.value = err.message
  } finally {
    submitting.value = false
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}
</script>

<style scoped>
*, *::before, *::after { box-sizing: border-box; }

.rsvp-shell {
  min-height: 100vh;
  background: radial-gradient(circle at top left, rgba(249,178,51,.15), transparent 30%),
              linear-gradient(180deg, #fef9f2 0%, #f7e8d8 65%, #f0dcc6 100%);
  display: flex; flex-direction: column; align-items: center;
  padding: 0 16px 48px; font-family: 'Segoe UI', Tahoma, Geneva, sans-serif;
  color: #1a1008;
}

/* Header */
.rsvp-header {
  display: flex; align-items: center; gap: 18px;
  padding: 24px 28px;
  background: linear-gradient(135deg, #5c3519 0%, #8f5b2c 45%, #f7bf39 100%);
  color: #fff;
  width: calc(100% + 32px); max-width: 680px;
  margin-bottom: 32px;
  border-radius: 0 0 24px 24px;
  box-shadow: 0 12px 36px rgba(89,55,22,.2);
}
.rsvp-logo-wrap {
  width: 56px; height: 56px; border-radius: 50%; overflow: hidden;
  border: 2.5px solid rgba(255,255,255,.35);
  box-shadow: 0 4px 16px rgba(0,0,0,.2);
  flex-shrink: 0;
}
.rsvp-logo { width: 100%; height: 100%; object-fit: cover; display: block; }
.rsvp-brand { font-size: 1.1rem; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
.rsvp-brand-sub { font-size: .72rem; color: rgba(255,255,255,.82); margin: 4px 0 0; letter-spacing: 1.2px; }

/* Main content */
.rsvp-main { width: 100%; max-width: 600px; display: flex; flex-direction: column; gap: 20px; }

/* Event card */
.rsvp-event-card {
  background: rgba(255,255,255,.96);
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 16px 48px rgba(89,55,22,.13);
  border: 1px solid rgba(255,255,255,.75);
}
.rsvp-event-header {
  background: linear-gradient(135deg, #5c3519, #8f5b2c 50%, #f7bf39);
  padding: 28px 28px 24px;
  position: relative;
}
.rsvp-event-header::before {
  content: '';
  position: absolute; inset: 0;
  background: repeating-linear-gradient(60deg, rgba(255,255,255,.05) 0, rgba(255,255,255,.05) 1px, transparent 1px, transparent 18px);
}
.rsvp-event-badge {
  display: inline-block;
  padding: 4px 14px; border-radius: 999px;
  background: rgba(255,255,255,.18); color: rgba(255,255,255,.92);
  font-size: .68rem; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
  border: 1px solid rgba(255,255,255,.28);
  margin-bottom: 12px; position: relative; z-index: 1;
}
.rsvp-event-title {
  font-size: 1.45rem; font-weight: 900; color: #fff;
  margin: 0 0 14px; position: relative; z-index: 1; line-height: 1.3;
}
.rsvp-event-details { display: flex; flex-direction: column; gap: 8px; position: relative; z-index: 1; }
.rsvp-event-detail {
  display: flex; align-items: center; gap: 8px;
  color: rgba(255,255,255,.88); font-size: .86rem; font-weight: 600;
}
.rsvp-greeting {
  padding: 22px 28px;
  font-size: .92rem; line-height: 1.7; color: #444;
}
.rsvp-greeting p { margin: 0 0 10px; }

/* Shared card */
.rsvp-card {
  background: rgba(255,255,255,.96);
  border-radius: 24px;
  padding: 32px 28px;
  box-shadow: 0 12px 36px rgba(89,55,22,.1);
  border: 1px solid rgba(255,255,255,.75);
  text-align: center;
}
.rsvp-card h2 { margin: 0 0 12px; }
.rsvp-card p { color: #555; line-height: 1.65; font-size: .92rem; margin: 0 0 12px; }

/* Error */
.rsvp-error-card { border-color: rgba(177,34,42,.25); }
.rsvp-error-icon { color: #B1222A; margin-bottom: 16px; display: flex; justify-content: center; }
.rsvp-error-card h2 { color: #B1222A; font-size: 1.2rem; }

/* Pending / Registration */
.rsvp-pending-card { border-color: rgba(249,178,51,.3); text-align: left; }
.rsvp-pending-title { font-size: 1.2rem; font-weight: 900; color: #5c3519; margin-bottom: 10px; }
.rsvp-pending-desc { font-size: .9rem; color: #555; line-height: 1.6; margin-bottom: 24px !important; }

.rsvp-btn-confirm {
  display: flex; align-items: center; justify-content: center; gap: 12px;
  padding: 18px 24px; border: none; border-radius: 16px;
  font-size: 1rem; font-weight: 800; cursor: pointer;
  transition: all .28s; width: 100%; letter-spacing: .5px;
  background: linear-gradient(135deg, #1b5e20, #388e3c);
  color: #fff;
  box-shadow: 0 12px 28px rgba(27,94,32,.3);
}
.rsvp-btn-confirm:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.06); }
.rsvp-btn-confirm:disabled { opacity: .6; cursor: not-allowed; }

.rsvp-error-inline {
  margin-top: 14px; padding: 12px 16px;
  background: #ffeaea; border: 1.5px solid rgba(177,34,42,.3); border-radius: 12px;
  color: #B1222A; font-size: .86rem; font-weight: 600;
}
.rsvp-success-inline {
  margin-top: 14px; padding: 12px 16px;
  background: #edf8ef; border: 1.5px solid rgba(46,125,50,.3); border-radius: 12px;
  color: #28733b; font-size: .86rem; font-weight: 600;
}

/* Loading */
.rsvp-loading {
  display: flex; flex-direction: column; align-items: center;
  gap: 20px; padding: 80px 20px; color: #5c3519;
  font-size: .95rem; font-weight: 600;
}
.rsvp-spinner {
  width: 44px; height: 44px;
  border: 4px solid rgba(92,53,25,.15);
  border-top-color: #5c3519;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Footer */
.rsvp-footer {
  margin-top: 40px; text-align: center;
  font-size: .72rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 1.5px; color: #5c3519; opacity: .65;
}
.rsvp-footer p { margin: 0 0 4px; }

/* Form layout */
.registration-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 20px;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
@media (max-width: 480px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--brun);
}
.form-input {
  padding: 12px 16px;
  border: 2px solid #e8ddd0;
  border-radius: 12px;
  font-size: 0.95rem;
  background: var(--creme);
  color: var(--noir);
  outline: none;
  transition: all 0.25s;
}
.form-input:focus {
  border-color: var(--or);
  background: #fff;
  box-shadow: 0 0 0 4px rgba(249, 178, 51, 0.1);
}
.req {
  color: var(--rouge);
}
.rsvp-spinner-small {
  width: 18px;
  height: 18px;
  border: 3px solid rgba(255,255,255,0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 0.8s linear infinite;
}

@media (max-width: 500px) {
  .rsvp-event-title { font-size: 1.2rem; }
  .rsvp-btn-confirm { font-size: .92rem; padding: 16px 20px; }
}
</style>
