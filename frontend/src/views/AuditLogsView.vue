<template>
  <div class="audit-shell">
    <div class="audit-header form-card">
      <div class="fh fh-a">
        <div class="fh-icon"><AppIcon name="shield" :size="24" /></div>
        <div>
          <div class="fh-title">Journal d’audit</div>
          <div class="fh-sub">Historique des actions sensibles de l’application.</div>
        </div>
      </div>
      <div class="audit-toolbar fb">
        <div class="audit-search">
          <AppIcon name="search" :size="16" />
          <input v-model="search" type="search" placeholder="Rechercher un agent, une action…" />
        </div>
        <select v-model="actionFilter" class="audit-filter">
          <option value="">Toutes les actions</option>
          <option v-for="action in actions" :key="action" :value="action">{{ actionLabel(action) }}</option>
        </select>
        <button type="button" class="btn-create" @click="loadLogs" :disabled="loading">
          <AppIcon :name="loading ? 'loader' : 'refresh-cw'" :size="15" /> Actualiser
        </button>
      </div>
    </div>

    <div v-if="!api.isSuperAdmin" class="audit-empty form-card">
      <AppIcon name="lock" :size="36" />
      <h3>Accès non autorisé</h3>
      <p>Seul le Super Administrateur peut consulter ce journal.</p>
    </div>

    <div v-else-if="error" class="audit-error form-card">
      <AppIcon name="alert-triangle" :size="20" /> {{ error }}
    </div>

    <div v-else-if="loading" class="audit-empty form-card">
      <AppIcon name="loader" :size="32" class="spin" />
      <p>Chargement du journal…</p>
    </div>

    <div v-else-if="filteredLogs.length === 0" class="audit-empty form-card">
      <AppIcon name="file-text" :size="36" />
      <p>Aucune action enregistrée.</p>
    </div>

    <div v-else class="audit-list form-card">
      <div class="audit-count">{{ filteredLogs.length }} action(s) affichée(s)</div>
      <div class="audit-table-wrap">
        <table>
          <thead><tr><th>Date</th><th>Agent</th><th>Action</th><th>Donnée concernée</th><th>Détails</th></tr></thead>
          <tbody>
            <tr v-for="log in filteredLogs" :key="log.id">
              <td class="audit-date">{{ formatDate(log.created_at) }}</td>
              <td>{{ log.actor_email || 'Système' }}</td>
              <td><span class="audit-action">{{ actionLabel(log.action) }}</span></td>
              <td>{{ log.entity_type }}<span v-if="log.entity_id" class="audit-id"> · {{ shortId(log.entity_id) }}</span></td>
              <td class="audit-metadata">{{ metadataLabel(log.metadata) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useApiStore } from '../store/api.js'
import AppIcon from '../components/AppIcon.vue'

const api = useApiStore()
const logs = ref([])
const search = ref('')
const actionFilter = ref('')
const loading = ref(false)
const error = ref('')

const actions = computed(() => [...new Set(logs.value.map(log => log.action).filter(Boolean))].sort())
const filteredLogs = computed(() => {
  const query = search.value.trim().toLowerCase()
  return logs.value.filter(log => {
    if (actionFilter.value && log.action !== actionFilter.value) return false
    if (!query) return true
    return [log.actor_email, log.action, log.entity_type, log.entity_id, metadataLabel(log.metadata)]
      .some(value => String(value || '').toLowerCase().includes(query))
  })
})

onMounted(() => {
  if (api.isSuperAdmin) loadLogs()
})

async function loadLogs() {
  loading.value = true
  error.value = ''
  try {
    logs.value = await api.get('/api/auth/audit?limit=500')
  } catch (err) {
    error.value = err.message || 'Impossible de charger le journal.'
  } finally {
    loading.value = false
  }
}

function actionLabel(action) {
  return {
    checkin_success: 'Check-in accepté',
    checkin_rejected: 'Check-in refusé',
    qr_reissued: 'QR réémis',
    qr_revoked: 'QR révoqué',
    invitations_sent: 'Invitations envoyées',
    invitations_reminded: 'Invitations relancées',
    event_created: 'Événement créé',
    event_updated: 'Événement modifié',
    event_deleted: 'Événement supprimé',
    invite_created: 'Invité créé',
    invites_imported: 'Invités importés',
    invite_updated: 'Invité modifié',
    invite_deleted: 'Invité supprimé',
    user_created: 'Utilisateur créé',
    user_deleted: 'Utilisateur supprimé'
  }[action] || action
}

function metadataLabel(metadata) {
  if (!metadata || typeof metadata !== 'object') return ''
  return Object.entries(metadata).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join(' · ')
}

function shortId(id) {
  return String(id).slice(0, 8)
}

function formatDate(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(value))
}
</script>

<style scoped>
.audit-shell { display: flex; flex-direction: column; gap: 20px; }
.audit-toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.audit-search { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 220px; border: 1px solid #e8ddd0; border-radius: 999px; padding: 10px 14px; color: var(--brun); }
.audit-search input { border: 0; outline: 0; background: transparent; width: 100%; font-size: .9rem; }
.audit-filter { padding: 10px 14px; border: 1px solid #e8ddd0; border-radius: 999px; background: var(--creme); color: var(--noir); }
.audit-count { padding: 16px 20px; color: #765b48; font-size: .8rem; font-weight: 700; }
.audit-table-wrap { overflow-x: auto; }
.audit-table-wrap table { width: 100%; border-collapse: collapse; font-size: .82rem; }
.audit-table-wrap th, .audit-table-wrap td { padding: 13px 16px; border-top: 1px solid #eee5dc; text-align: left; white-space: nowrap; }
.audit-table-wrap th { color: var(--brun); font-size: .72rem; text-transform: uppercase; }
.audit-action { color: var(--rouge); font-weight: 700; }
.audit-date, .audit-id, .audit-metadata { color: #75665d; }
.audit-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; min-height: 180px; color: #765b48; text-align: center; }
.audit-empty h3, .audit-empty p { margin: 0; }
.audit-error { color: #a3262e; padding: 18px; }
@media (max-width: 650px) { .audit-filter, .audit-toolbar .btn-create { width: 100%; } .audit-toolbar .btn-create { justify-content: center; } }
</style>
