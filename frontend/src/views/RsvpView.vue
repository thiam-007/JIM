<template>
  <div class="rsvp-shell">

    <!-- ─── Header MVG ─── -->
    <header class="rsvp-header">
      <div class="rsvp-logo-wrap">
        <img src="/images/logo.jpeg" alt="Musée Virtuel de Guinée" class="rsvp-logo" />
      </div>
      <div>
        <h1 class="rsvp-brand">Musée Virtuel de Guinée</h1>
        <p class="rsvp-brand-sub">La gestion globale de vos événements</p>
      </div>
    </header>

    <!-- ─── Chargement ─── -->
    <div v-if="loading" class="rsvp-loading">
      <div class="rsvp-spinner"></div>
      <p>Chargement de votre invitation…</p>
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
      <h2>Invitation introuvable</h2>
      <p>{{ error }}</p>
    </div>

    <!-- ─── Contenu principal ─── -->
    <div v-else-if="invitation" class="rsvp-main">

      <!-- Carte événement -->
      <div class="rsvp-event-card">
        <div class="rsvp-event-header">
          <div class="rsvp-event-badge">MVG event's</div>
          <h2 class="rsvp-event-title">{{ invitation.evenement?.titre || 'Événement' }}</h2>
          <div class="rsvp-event-details">
            <div v-if="invitation.evenement?.date_debut" class="rsvp-event-detail">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {{ formatDate(invitation.evenement.date_debut) }}
            </div>
            <div v-if="invitation.evenement?.lieu" class="rsvp-event-detail">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {{ invitation.evenement.lieu }}
            </div>
          </div>
        </div>

        <!-- Salutation -->
        <div class="rsvp-greeting">
          <p>Chère / Cher <strong>{{ invitation.invite?.prenom }} {{ invitation.invite?.nom }}</strong>,</p>
          <p>Vous êtes cordialement invité(e) à participer à cet événement organisé par le Musée Virtuel de Guinée.</p>
        </div>
      </div>

      <!-- ─── Statut : Déjà décliné ─── -->
      <div v-if="invitation.statut === 'decline'" class="rsvp-card rsvp-declined-card">
        <div class="rsvp-status-icon">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <h3>Invitation déclinée</h3>
        <p>Vous avez décliné cette invitation. Nous espérons vous accueillir lors d'un prochain événement.</p>
        <p class="rsvp-contact">Pour toute question, contactez-nous : <a href="mailto:contact@mvg.org">contact@mvg.org</a></p>
      </div>

      <!-- ─── Statut : Déjà inscrit / présent ─── -->
      <div v-else-if="invitation.statut === 'inscrit' || invitation.statut === 'present'" class="rsvp-card rsvp-confirmed-card">
        <div class="rsvp-status-icon">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        <h3>Inscription confirmée !</h3>
        <p>Votre présence est confirmée. Présentez le QR code ci-dessous à l'entrée de l'événement.</p>

        <div class="rsvp-qr-section">
          <div class="rsvp-qr-frame">
            <img
              :src="`${apiUrl}/api/invitations/qr/${token}`"
              :alt="`QR Code — ${invitation.invite?.nom}`"
              class="rsvp-qr-img"
              @error="qrError = true"
            />
            <p v-if="qrError" class="rsvp-qr-error">QR code non disponible</p>
          </div>
          <p class="rsvp-qr-name">{{ invitation.invite?.prenom }} {{ invitation.invite?.nom }}</p>
          <p class="rsvp-qr-hint">Présentez ce QR code à l'entrée de l'événement</p>
          <a
            :href="`${apiUrl}/api/invitations/qr/${token}`"
            target="_blank"
            download="qr-code-mvg.png"
            class="rsvp-btn-dl"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Télécharger le QR code
          </a>
        </div>
      </div>

      <!-- ─── Statut : En attente de réponse ─── -->
      <div v-else-if="invitation.statut === 'pas_de_reaction'" class="rsvp-card rsvp-pending-card">
        <div class="rsvp-pending-title">Confirmer votre participation</div>
        <p class="rsvp-pending-desc">Merci de bien vouloir indiquer si vous serez présent(e) à cet événement.</p>

        <div v-if="!answered" class="rsvp-cta-row">
          <button class="rsvp-btn-confirm" @click="respond('inscrit')" :disabled="responding">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span>{{ responding === 'inscrit' ? 'Enregistrement…' : 'Confirmer ma présence' }}</span>
          </button>
          <button class="rsvp-btn-decline" @click="respond('decline')" :disabled="responding">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <span>{{ responding === 'decline' ? 'Enregistrement…' : 'Je ne pourrai pas venir' }}</span>
          </button>
        </div>

        <div v-if="rsvpError" class="rsvp-error-inline">{{ rsvpError }}</div>

        <!-- Après confirmation -->
        <div v-if="answered === 'inscrit'" class="rsvp-after-confirm">
          <div class="rsvp-after-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h3>Merci ! Votre présence est confirmée.</h3>
          <p>Voici votre QR code d'accès. Présentez-le à l'entrée de l'événement.</p>
          <div class="rsvp-qr-frame">
            <img
              :src="`${apiUrl}/api/invitations/qr/${token}`"
              :alt="`QR Code — ${invitation.invite?.nom}`"
              class="rsvp-qr-img"
              @error="qrError = true"
            />
          </div>
          <p class="rsvp-qr-name">{{ invitation.invite?.prenom }} {{ invitation.invite?.nom }}</p>
          <p class="rsvp-qr-hint">Présentez ce QR code à l'entrée de l'événement</p>
          <a
            :href="`${apiUrl}/api/invitations/qr/${token}`"
            target="_blank"
            download="qr-code-mvg.png"
            class="rsvp-btn-dl"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Télécharger le QR code
          </a>
        </div>

        <div v-if="answered === 'decline'" class="rsvp-after-decline">
          <p>Nous avons bien pris note de votre déclin. Nous espérons vous accueillir lors d'un prochain événement.</p>
        </div>
      </div>

    </div>

    <!-- ─── Footer ─── -->
    <footer class="rsvp-footer">
      <p>Musée Virtuel de Guinée · MVG event's</p>
      <p class="rsvp-footer-em">Les musées unissent un monde divisé</p>
    </footer>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const token = route.params.token
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const loading = ref(true)
const error = ref('')
const invitation = ref(null)
const responding = ref(false)
const answered = ref('')
const rsvpError = ref('')
const qrError = ref(false)

onMounted(async () => {
  try {
    const res = await fetch(`${apiUrl}/api/rsvp/${token}`)
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || 'Invitation introuvable ou lien invalide.')
    }
    invitation.value = await res.json()
  } catch (err) {
    error.value = err.message || 'Erreur lors du chargement de l\'invitation.'
  } finally {
    loading.value = false
  }
})

function formatDate(d) {
  if (!d) return ''
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(d))
  } catch { return d }
}

async function respond(statut) {
  responding.value = statut
  rsvpError.value = ''
  try {
    const res = await fetch(`${apiUrl}/api/rsvp/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut })
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error || 'Erreur lors de l\'enregistrement.')
    }
    answered.value = statut
  } catch (err) {
    rsvpError.value = err.message
  } finally {
    responding.value = false
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
.rsvp-greeting p:last-child { margin-bottom: 0; }
.rsvp-greeting strong { color: #1a1008; }

/* Shared card */
.rsvp-card {
  background: rgba(255,255,255,.96);
  border-radius: 24px;
  padding: 32px 28px;
  box-shadow: 0 12px 36px rgba(89,55,22,.1);
  border: 1px solid rgba(255,255,255,.75);
  text-align: center;
}
.rsvp-card h2, .rsvp-card h3 { margin: 0 0 12px; }
.rsvp-card p { color: #555; line-height: 1.65; font-size: .92rem; margin: 0 0 12px; }
.rsvp-card p:last-child { margin-bottom: 0; }

/* Error */
.rsvp-error-card { border-color: rgba(177,34,42,.25); }
.rsvp-error-icon { color: #B1222A; margin-bottom: 16px; display: flex; justify-content: center; }
.rsvp-error-card h2 { color: #B1222A; font-size: 1.2rem; }

/* Confirmed */
.rsvp-confirmed-card { border-color: rgba(46,125,50,.25); }
.rsvp-status-icon { display: flex; justify-content: center; margin-bottom: 16px; }
.rsvp-confirmed-card .rsvp-status-icon { color: #2e7d32; }
.rsvp-confirmed-card h3 { color: #1b5e20; font-size: 1.2rem; }

/* Declined */
.rsvp-declined-card { border-color: rgba(122,96,80,.2); }
.rsvp-declined-card .rsvp-status-icon { color: #7a6050; }
.rsvp-declined-card h3 { color: #5c3519; }
.rsvp-contact a { color: #5c3519; font-weight: 700; }

/* QR section */
.rsvp-qr-section { margin-top: 24px; }
.rsvp-qr-frame {
  display: flex; justify-content: center;
  background: #fff;
  border: 2px solid rgba(132,89,54,.18);
  border-radius: 16px; padding: 16px;
  margin: 0 auto 14px; max-width: 240px;
}
.rsvp-qr-img { width: 100%; max-width: 200px; display: block; border-radius: 6px; }
.rsvp-qr-error { color: #888; font-size: .82rem; font-style: italic; }
.rsvp-qr-name { font-weight: 800; font-size: 1rem; color: #1a1008; margin-bottom: 6px !important; }
.rsvp-qr-hint { font-size: .82rem; color: #777; margin-bottom: 16px !important; }
.rsvp-btn-dl {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 12px 24px; border-radius: 999px;
  background: linear-gradient(135deg, #5c3519, #f7bf39);
  color: #fff; font-weight: 700; font-size: .88rem;
  text-decoration: none; transition: all .25s;
  box-shadow: 0 8px 20px rgba(89,55,22,.22);
}
.rsvp-btn-dl:hover { filter: brightness(1.06); transform: translateY(-1px); }

/* Pending */
.rsvp-pending-card { border-color: rgba(249,178,51,.3); }
.rsvp-pending-title { font-size: 1.2rem; font-weight: 900; color: #5c3519; margin-bottom: 10px; }
.rsvp-pending-desc { font-size: .9rem; color: #555; line-height: 1.6; margin-bottom: 28px !important; }
.rsvp-cta-row { display: flex; flex-direction: column; gap: 14px; }
.rsvp-btn-confirm, .rsvp-btn-decline {
  display: flex; align-items: center; justify-content: center; gap: 12px;
  padding: 18px 24px; border: none; border-radius: 16px;
  font-size: 1rem; font-weight: 800; cursor: pointer;
  transition: all .28s; width: 100%; letter-spacing: .5px;
}
.rsvp-btn-confirm {
  background: linear-gradient(135deg, #1b5e20, #388e3c);
  color: #fff;
  box-shadow: 0 12px 28px rgba(27,94,32,.3);
}
.rsvp-btn-confirm:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.06); }
.rsvp-btn-decline {
  background: rgba(122,96,80,.1); color: #7a6050;
  border: 2px solid rgba(122,96,80,.25);
}
.rsvp-btn-decline:hover:not(:disabled) { background: rgba(122,96,80,.18); }
.rsvp-btn-confirm:disabled, .rsvp-btn-decline:disabled { opacity: .6; cursor: not-allowed; }
.rsvp-error-inline {
  margin-top: 14px; padding: 12px 16px;
  background: #ffeaea; border: 1.5px solid rgba(177,34,42,.3); border-radius: 12px;
  color: #B1222A; font-size: .86rem; font-weight: 600;
}
.rsvp-after-confirm, .rsvp-after-decline {
  margin-top: 24px; padding-top: 24px;
  border-top: 1px solid rgba(132,89,54,.1);
  animation: fadeInUp .5s ease;
}
.rsvp-after-icon { color: #2e7d32; display: flex; justify-content: center; margin-bottom: 12px; }
.rsvp-after-confirm h3 { color: #1b5e20; margin-bottom: 8px; }
.rsvp-after-decline p { color: #555; font-size: .9rem; }

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
.rsvp-footer-em { color: #B1222A; opacity: 1; }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 500px) {
  .rsvp-event-title { font-size: 1.2rem; }
  .rsvp-btn-confirm, .rsvp-btn-decline { font-size: .92rem; padding: 16px 20px; }
}
</style>
