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
.requests-shell { max-width: 1180px; margin: 0 auto; padding: 24px 16px 56px; }
.requests-header { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 18px; }
.requests-header-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.requests-header-actions select { min-height: 40px; padding: 0 12px; border: 1px solid #bdcec8; border-radius: 4px; background: #fff; color: #28336f; }
.requests-list { display: grid; gap: 14px; }
.request-card { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 18px; }
.request-person h2 { margin: 0 0 5px; color: #28336f; font-size: 18px; }
.request-person a { color: #b45332; overflow-wrap: anywhere; }
.request-status { align-self: start; padding: 5px 9px; border-radius: 3px; background: #edf1ef; color: #34443e; font-size: 12px; font-weight: 700; }
.status-pending { background: #fff3d8; color: #795900; }
.status-approved { background: #e4f3e8; color: #20623a; }
.status-rejected { background: #f9e6e6; color: #92333a; }
.status-processing { background: #e6ecfa; color: #28336f; }
.request-details { display: flex; flex-wrap: wrap; gap: 12px 24px; margin: 16px 0 0; }
.request-details div { min-width: 130px; }
.request-details .request-message { flex-basis: 100%; }
.request-details dt { color: #61716b; font-size: 11px; font-weight: 700; text-transform: uppercase; }
.request-details dd { margin: 3px 0 0; color: #17211e; white-space: pre-wrap; overflow-wrap: anywhere; }
.request-actions { display: flex; flex-direction: column; justify-content: center; gap: 8px; }
.request-actions button { display: inline-flex; align-items: center; justify-content: center; gap: 7px; min-height: 40px; padding: 0 12px; border: 1px solid transparent; border-radius: 4px; font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
.request-approve { background: #28336f; color: #fff; }
.request-reject { border-color: #bdcec8 !important; background: #fff; color: #92333a; }
.request-actions button:disabled { opacity: .6; cursor: wait; }
.request-outcome, .request-processing { grid-column: 1 / -1; margin: 0; color: #52635d; font-size: 13px; }
.requests-empty { display: grid; justify-items: center; gap: 10px; padding: 48px 20px; color: #52635d; text-align: center; }
.requests-empty p { margin: 0; }
.requests-alert { margin: 12px 0; padding: 12px 14px; border: 1px solid #e3b4b4; background: #fff5f5; color: #92333a; }
.requests-alert.success { border-color: #b9d9c2; background: #f1faf3; color: #20623a; }
@media (max-width: 760px) {
  .requests-header { align-items: flex-start; flex-direction: column; }
  .requests-header-actions { width: 100%; }
  .requests-header-actions select, .requests-header-actions a { flex: 1; }
  .request-card { grid-template-columns: 1fr; }
  .request-actions { flex-direction: row; flex-wrap: wrap; }
  .request-actions button { flex: 1 1 180px; }
}
</style>