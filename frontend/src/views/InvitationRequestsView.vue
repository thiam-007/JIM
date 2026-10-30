<template>
  <div class="requests-shell">
    <header class="requests-header form-card">
      <div class="fh fh-a">
        <div class="fh-icon"><AppIcon name="mail" :size="22" /></div>
        <div>
          <div class="fh-title">Demandes reçues</div>
          <div class="fh-sub">{{ evenement?.titre || 'Demandes d’invitation pour cet événement' }}</div>
        </div>
      </div>
      <div class="requests-header-actions">
        <select v-model="statusFilter" aria-label="Filtrer les demandes par statut">
          <option value="pending">En attente</option>
          <option value="processing">En traitement</option>
          <option value="approved">Approuvées</option>
          <option value="rejected">Refusées</option>
          <option value="">Tous les statuts</option>
        </select>
        <RouterLink :to="`/invitations/${eventId}`" class="btn-cancel">Retour aux invitations</RouterLink>
      </div>
    </header>

    <div v-if="loadError" class="requests-alert" role="alert">{{ loadError }}</div>
    <div v-if="actionMessage" class="requests-alert" :class="{ success: actionSuccess }" role="status">{{ actionMessage }}</div>

    <div v-if="loading" class="requests-empty form-card">Chargement des demandes…</div>
    <div v-else-if="visibleRequests.length === 0" class="requests-empty form-card">
      <AppIcon name="mail" :size="30" />
      <p>Aucune demande {{ statusFilter === 'pending' ? 'en attente' : 'ne correspond à ce filtre' }}.</p>
    </div>

    <section v-else class="requests-list" aria-label="Liste des demandes d’invitation">
      <article v-for="request in visibleRequests" :key="request.id" class="request-card form-card">
        <div class="request-card-main">
          <div class="request-person">
            <h2>{{ request.first_name }} {{ request.last_name }}</h2>
            <a :href="`mailto:${request.email}`">{{ request.email }}</a>
          </div>
          <span class="request-status" :class="`status-${request.status}`">{{ statusLabel(request.status) }}</span>
          <dl class="request-details">
            <div v-if="request.organization"><dt>Organisation</dt><dd>{{ request.organization }}</dd></div>
            <div v-if="request.job_title"><dt>Fonction</dt><dd>{{ request.job_title }}</dd></div>
            <div v-if="request.phone"><dt>Téléphone</dt><dd>{{ request.phone }}</dd></div>
            <div><dt>Reçue le</dt><dd>{{ formatDate(request.created_at) }}</dd></div>
            <div v-if="request.message" class="request-message"><dt>Motif</dt><dd>{{ request.message }}</dd></div>
          </dl>
        </div>
        <div v-if="request.status === 'pending'" class="request-actions">
          <button class="request-approve" :disabled="busyId === request.id" @click="approve(request)">
            <AppIcon :name="busyId === request.id ? 'loader' : 'check'" :size="15" />
            {{ busyId === request.id ? 'Traitement…' : 'Approuver et envoyer l’invitation' }}
          </button>
          <button class="request-reject" :disabled="busyId === request.id" @click="reject(request)">
            <AppIcon name="x" :size="15" /> Refuser
          </button>
        </div>
        <p v-else-if="request.status === 'processing'" class="request-processing">Cette demande est en cours de traitement.</p>
        <p v-else-if="request.status === 'approved'" class="request-outcome">Invitation créée. Le demandeur doit encore répondre au courriel RSVP.</p>
        <p v-else class="request-outcome">Demande refusée.</p>
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useApiStore } from '../store/api.js'
import AppIcon from '../components/AppIcon.vue'

const route = useRoute()
const api = useApiStore()
const eventId = String(route.params.eventId)
const requests = ref([])
const evenement = ref(null)
const loading = ref(true)
const busyId = ref('')
const statusFilter = ref('pending')
const loadError = ref('')
const actionMessage = ref('')
const actionSuccess = ref(false)
const visibleRequests = computed(() => statusFilter.value
  ? requests.value.filter(request => request.status === statusFilter.value)
  : requests.value)

onMounted(loadData)
watch(statusFilter, () => { actionMessage.value = '' })

async function loadData() {
  loading.value = true
  loadError.value = ''
  try {
    const [allEvents, allRequests] = await Promise.all([
      api.get('/api/evenements'),
      api.get(`/api/invitation-requests?event_id=${encodeURIComponent(eventId)}`)
    ])
    evenement.value = allEvents.find(event => String(event.id) === eventId) || null
    requests.value = allRequests || []
  } catch (error) {
    loadError.value = error.message || 'Impossible de charger les demandes.'
  } finally {
    loading.value = false
  }
}

async function approve(request) {
  busyId.value = request.id
  actionMessage.value = ''
  try {
    await api.post(`/api/invitation-requests/${request.id}/approve`, {})
    request.status = 'approved'
    actionSuccess.value = true
    actionMessage.value = `Demande de ${request.first_name} approuvée ; l’invitation a été envoyée.`
  } catch (error) {
    actionSuccess.value = false
    actionMessage.value = error.message || 'Impossible d’approuver cette demande.'
    await loadData()
  } finally {
    busyId.value = ''
  }
}

async function reject(request) {
  if (!window.confirm(`Refuser la demande de ${request.first_name} ${request.last_name} ?`)) return
  busyId.value = request.id
  actionMessage.value = ''
  try {
    const result = await api.post(`/api/invitation-requests/${request.id}/reject`, {})
    request.status = 'rejected'
    actionSuccess.value = true
    actionMessage.value = result.notificationSent
      ? 'Demande refusée et réponse envoyée.'
      : 'Demande refusée. Le courriel de notification n’a pas pu être envoyé.'
  } catch (error) {
    actionSuccess.value = false
    actionMessage.value = error.message || 'Impossible de refuser cette demande.'
    await loadData()
  } finally {
    busyId.value = ''
  }
}

function statusLabel(status) {
  return ({ pending: 'En attente', processing: 'En traitement', approved: 'Approuvée', rejected: 'Refusée' })[status] || status
}

function formatDate(value) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}
</script>

<style scoped>
.requests-shell {
  --requests-ink: #4a3025;
  --requests-accent: #a66c2d;
  --requests-muted: #71685c;
  --requests-border: #ded4c5;
  --requests-paper: #fffdf8;
  --requests-success: #42634a;
  --requests-danger: #923f37;
  max-width: 1180px;
  margin: 0 auto;
  padding: 24px 16px 56px;
}
.requests-shell .form-card::before { display: none; }
.requests-header, .request-card, .request-card-main, .request-person { min-width: 0; }
.requests-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 18px;
  padding: 18px;
  border-color: var(--requests-border);
  background: var(--requests-paper);
}
.requests-header .fh-sub { overflow-wrap: anywhere; }
.requests-header-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.requests-header-actions select {
  min-height: 40px;
  min-width: 0;
  padding: 0 12px;
  border: 1px solid var(--requests-border);
  border-radius: 4px;
  background: var(--requests-paper);
  color: var(--requests-ink);
}
.requests-list { display: grid; gap: 14px; }
.request-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 270px);
  align-items: center;
  gap: 18px;
  min-width: 0;
  overflow: visible;
  padding: 20px;
  border-color: var(--requests-border);
  background: var(--requests-paper);
}
.request-card-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 0 12px;
}
.request-person h2 { margin: 0 0 5px; color: var(--requests-ink); font-size: 18px; overflow-wrap: anywhere; }
.request-person a { display: inline-block; max-width: 100%; color: var(--requests-accent); overflow-wrap: anywhere; }
.request-status {
  grid-column: 2;
  grid-row: 1;
  align-self: start;
  padding: 5px 9px;
  border-radius: 3px;
  background: #eee9df;
  color: var(--requests-ink);
  font-size: 12px;
  font-weight: 700;
}
.status-pending { background: #f5e9c9; color: #75551b; }
.status-approved { background: #e5eee4; color: var(--requests-success); }
.status-rejected { background: #f5e6e2; color: var(--requests-danger); }
.status-processing { background: #eee9df; color: var(--requests-accent); }
.request-details {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 140px), 1fr));
  gap: 14px 20px;
  min-width: 0;
  margin: 16px 0 0;
}
.request-details > div { min-width: 0; }
.request-details .request-message { grid-column: 1 / -1; }
.request-details dt { color: var(--requests-muted); font-size: 11px; font-weight: 700; text-transform: uppercase; }
.request-details dd { margin: 3px 0 0; color: var(--requests-ink); white-space: pre-wrap; overflow-wrap: anywhere; }
.request-actions { display: flex; flex-direction: column; justify-content: center; gap: 8px; min-width: 0; }
.request-actions button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  min-width: 0;
  min-height: 42px;
  padding: 8px 12px;
  border: 1px solid transparent;
  border-radius: 4px;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.4;
  text-align: center;
  white-space: normal;
  overflow-wrap: anywhere;
  cursor: pointer;
}
.request-approve { background: var(--requests-ink); color: var(--requests-paper); }
.request-approve:hover:not(:disabled) { background: #654634; }
.request-reject { border-color: var(--requests-border) !important; background: var(--requests-paper); color: var(--requests-danger); }
.request-reject:hover:not(:disabled) { background: #f5e6e2; }
.request-actions button:disabled { opacity: .6; cursor: wait; }
.request-outcome, .request-processing { grid-column: 1 / -1; margin: 0; color: var(--requests-muted); font-size: 13px; overflow-wrap: anywhere; }
.requests-empty {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 48px 20px;
  border-color: var(--requests-border);
  background: var(--requests-paper);
  color: var(--requests-muted);
  text-align: center;
}
.requests-empty p { margin: 0; }
.requests-alert { margin: 12px 0; padding: 12px 14px; border: 1px solid #e4c3bd; background: #fbefec; color: var(--requests-danger); overflow-wrap: anywhere; }
.requests-alert.success { border-color: #c6d6c3; background: #f1f6ef; color: var(--requests-success); }
@media (max-width: 760px) {
  .requests-shell { padding: 16px 12px 36px; }
  .requests-header { align-items: stretch; flex-direction: column; gap: 14px; padding: 16px; }
  .requests-header-actions { width: 100%; }
  .requests-header-actions select, .requests-header-actions a { flex: 1 1 150px; min-width: 0; }
  .request-card { grid-template-columns: 1fr; }
  .request-card-main { grid-template-columns: minmax(0, 1fr) auto; }
  .request-details { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .request-actions { width: 100%; }
  .request-actions button { width: 100%; }
}
@media (max-width: 420px) {
  .request-card { padding: 16px; }
  .request-details { grid-template-columns: 1fr; }
  .request-details .request-message { grid-column: auto; }
  .request-status { max-width: 120px; white-space: normal; text-align: center; }
}
</style>