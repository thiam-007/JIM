<template>
  <div class="inv-shell">

    <!-- ─── En-tête événement ─── -->
    <div class="form-card">
      <div class="fh fh-a">
        <div class="fh-icon"><AppIcon name="mail" :size="24" /></div>
        <div v-if="evenement">
          <div class="fh-title">{{ evenement.titre }}</div>
          <div class="fh-sub">
            <span v-if="evenement.date_debut">{{ formatDate(evenement.date_debut) }} · </span>
            <span v-if="evenement.lieu">{{ evenement.lieu }}</span>
          </div>
        </div>
        <div v-else>
          <div class="fh-title">Invitations</div>
          <div class="fh-sub">Gestion des invitations pour cet événement</div>
        </div>
      </div>

      <!-- Stats bar -->
      <div class="inv-stats-bar fb" v-if="!loading">
        <div class="inv-stat">
          <span class="inv-stat-num">{{ stats.total }}</span>
          <span class="inv-stat-label">Total</span>
        </div>
        <div class="inv-stat green">
          <span class="inv-stat-num">{{ stats.inscrits }}</span>
          <span class="inv-stat-label">Inscrits ({{ pct(stats.inscrits) }}%)</span>
        </div>
        <div class="inv-stat red">
          <span class="inv-stat-num">{{ stats.declines }}</span>
          <span class="inv-stat-label">Déclinés ({{ pct(stats.declines) }}%)</span>
        </div>
        <div class="inv-stat blue">
          <span class="inv-stat-num">{{ stats.presents }}</span>
          <span class="inv-stat-label">Présents ({{ pct(stats.presents) }}%)</span>
        </div>
      </div>

      <!-- Actions toolbar -->
      <div class="inv-toolbar fb">
        <div class="inv-search-wrap">
          <AppIcon name="search" :size="16" class="inv-search-icon" />
          <input
            type="text"
            v-model="search"
            placeholder="Filtrer par nom, email…"
            class="inv-search-input"
          />
        </div>
        <div class="inv-filter-wrap">
          <select v-model="filterStatut" class="inv-filter-select">
            <option value="">Tous les statuts</option>
            <option value="pas_de_reaction">Pas de réaction</option>
            <option value="inscrit">Inscrits</option>
            <option value="decline">Déclinés</option>
            <option value="present">Présents</option>
          </select>
        </div>
        <div class="inv-actions">
          <RouterLink :to="`/checkin/${eventId}`" class="btn-scan">
            <AppIcon name="scan" :size="15" /> Lancer le Scanner
          </RouterLink>
          <button class="btn-send" @click="sendPending" :disabled="sending || pendingCount === 0">
            <AppIcon :name="sending ? 'loader' : 'send'" :size="15" />
            Envoyer invitations ({{ pendingCount }})
          </button>
          <button class="btn-create" @click="openAddInvites">
            <AppIcon name="plus" :size="15" /> Ajouter des invités
          </button>
        </div>
      </div>
    </div>

    <!-- ─── Chargement ─── -->
    <div v-if="loading" class="inv-loading">
      <AppIcon name="loader" :size="32" />
      <span>Chargement des invitations…</span>
    </div>

    <!-- ─── Table invitations ─── -->
    <div v-else class="form-card">
      <div class="inv-table-wrap">
        <table class="inv-table" v-if="filteredInvitations.length > 0">
          <thead>
            <tr>
              <th>Invité</th>
              <th>Email</th>
              <th>Statut</th>
              <th>Date d'envoi</th>
              <th>Date de réponse</th>
              <th class="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="inv in filteredInvitations"
              :key="inv.id"
              class="inv-row"
              @click="openDetail(inv)"
            >
              <td class="inv-name-cell">
                <div class="inv-avatar">{{ initials(inv.invites) }}</div>
                <div>
                  <div class="inv-fullname">{{ inv.invites?.prenom }} {{ inv.invites?.nom }}</div>
                  <div v-if="inv.invites?.organisation" class="inv-org">{{ inv.invites.organisation }}</div>
                </div>
              </td>
              <td>
                <a v-if="inv.invites?.email" :href="`mailto:${inv.invites.email}`" class="inv-email" @click.stop>
                  {{ inv.invites.email }}
                </a>
                <span v-else class="inv-empty">—</span>
              </td>
              <td>
                <span class="statut-badge" :class="statutClass(inv.statut)">
                  {{ statutLabel(inv.statut) }}
                </span>
              </td>
              <td class="inv-date">{{ inv.date_envoi ? formatShortDate(inv.date_envoi) : '—' }}</td>
              <td class="inv-date">{{ inv.date_reponse ? formatShortDate(inv.date_reponse) : '—' }}</td>
              <td class="col-actions" @click.stop>
                <a
                  v-if="inv.token"
                  :href="`${apiUrl}/api/invitations/qr/${inv.token}`"
                  target="_blank"
                  class="row-btn-qr"
                  title="Télécharger QR code"
                >
                  <AppIcon name="qr-code" :size="15" />
                </a>
                <select
                  class="row-statut-select"
                  :value="inv.statut"
                  @change="updateStatut(inv, $event.target.value)"
                  title="Changer le statut"
                >
                  <option value="pas_de_reaction">Pas de réaction</option>
                  <option value="inscrit">Inscrit</option>
                  <option value="decline">Décliné</option>
                  <option value="present">Présent</option>
                </select>
                <button class="row-btn-delete" @click="confirmDelete(inv)" title="Supprimer">
                  <AppIcon name="trash" :size="15" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- État vide -->
        <div v-else class="inv-empty-state">
          <div class="inv-empty-icon"><AppIcon name="mail" :size="40" /></div>
          <p v-if="search || filterStatut">Aucune invitation ne correspond aux filtres actifs.</p>
          <p v-else>Aucune invitation pour cet événement. Ajoutez des invités !</p>
          <button class="btn-create" @click="openAddInvites">
            <AppIcon name="plus" :size="16" /> Ajouter des invités
          </button>
        </div>
      </div>
    </div>

    <!-- ─── Modal Ajouter des invités ─── -->
    <Teleport to="body">
      <div v-if="showAddModal" class="modal-backdrop" @click.self="showAddModal = false">
        <div class="modal-box-lg form-card">
          <div class="fh fh-a">
            <div class="fh-icon"><AppIcon name="user-plus" :size="22" /></div>
            <div class="fh-title">Ajouter des invités</div>
            <div class="fh-sub">Sélectionnez les contacts à inviter</div>
          </div>
          <div class="fb">
            <div class="modal-search-wrap">
              <AppIcon name="search" :size="16" class="inv-search-icon" />
              <input
                type="text"
                v-model="modalSearch"
                placeholder="Rechercher un contact…"
                class="inv-search-input"
              />
            </div>

            <div class="modal-select-actions">
              <button class="btn-select-all" @click="selectAll">Tout sélectionner</button>
              <button class="btn-select-all" @click="selectedIds.clear()">Tout désélectionner</button>
              <span class="selection-count">{{ selectedIds.size }} sélectionné(s)</span>
            </div>

            <div class="contacts-list" v-if="filteredContacts.length">
              <label
                v-for="contact in filteredContacts"
                :key="contact.id"
                class="contact-item"
                :class="{ selected: selectedIds.has(contact.id), already: alreadyInvited.has(contact.id) }"
              >
                <input
                  type="checkbox"
                  :checked="selectedIds.has(contact.id)"
                  :disabled="alreadyInvited.has(contact.id)"
                  @change="toggleContact(contact.id)"
                />
                <div class="inv-avatar sm">{{ initials(contact) }}</div>
                <div class="contact-info">
                  <div class="contact-name">{{ contact.prenom }} {{ contact.nom }}</div>
                  <div class="contact-meta">{{ [contact.organisation, contact.email].filter(Boolean).join(' · ') }}</div>
                </div>
                <span v-if="alreadyInvited.has(contact.id)" class="already-label">Déjà invité</span>
              </label>
            </div>
            <div v-else class="contacts-empty">Aucun contact trouvé</div>

            <div v-if="addError" class="form-error-msg">
              <AppIcon name="alert-triangle" :size="15" /> {{ addError }}
            </div>

            <div class="modal-actions">
              <button class="btn-cancel" @click="showAddModal = false">Annuler</button>
              <button class="bsub bsub-a modal-submit" @click="addInvitations" :disabled="adding || selectedIds.size === 0">
                <AppIcon :name="adding ? 'loader' : 'plus'" :size="16" />
                {{ adding ? 'Ajout en cours…' : `Inviter ${selectedIds.size > 0 ? selectedIds.size : ''} contact(s)` }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ─── Modal Détail invitation ─── -->
    <Teleport to="body">
      <div v-if="showDetail" class="modal-backdrop" @click.self="showDetail = false">
        <div class="modal-box form-card" v-if="detailInv">
          <div class="fh fh-a">
            <div class="fh-icon"><AppIcon name="user" :size="22" /></div>
            <div class="fh-title">{{ detailInv.invites?.prenom }} {{ detailInv.invites?.nom }}</div>
            <div class="fh-sub" v-if="detailInv.invites?.organisation">{{ detailInv.invites.organisation }}</div>
          </div>
          <div class="fb">
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Statut</span>
                <span class="statut-badge" :class="statutClass(detailInv.statut)">{{ statutLabel(detailInv.statut) }}</span>
              </div>
              <div class="detail-item" v-if="detailInv.invites?.email">
                <span class="detail-label">Email</span>
                <a :href="`mailto:${detailInv.invites.email}`" class="inv-email">{{ detailInv.invites.email }}</a>
              </div>
              <div class="detail-item" v-if="detailInv.invites?.telephone">
                <span class="detail-label">Téléphone</span>
                <span>{{ detailInv.invites.telephone }}</span>
              </div>
              <div class="detail-item" v-if="detailInv.date_envoi">
                <span class="detail-label">Date d'envoi</span>
                <span>{{ formatDate(detailInv.date_envoi) }}</span>
              </div>
              <div class="detail-item" v-if="detailInv.date_reponse">
                <span class="detail-label">Date de réponse</span>
                <span>{{ formatDate(detailInv.date_reponse) }}</span>
              </div>
              <div class="detail-item" v-if="detailInv.token" style="grid-column: span 2;">
                <span class="detail-label">Lien RSVP</span>
                <div style="display: flex; gap: 8px; align-items: center; background: rgba(132,89,54,0.05); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(132,89,54,0.1); margin-top: 4px;">
                  <a :href="`/rsvp/${detailInv.token}`" target="_blank" class="inv-email" style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-family: monospace; font-size: 0.8rem; font-weight: 600;">
                    {{ getFullRsvpUrl(detailInv.token) }}
                  </a>
                  <button type="button" @click="copyRsvpLink(detailInv.token)" class="btn-select-all" style="padding: 4px 10px; font-size: 11px; white-space: nowrap; margin-left: auto; border-radius: 6px;">
                    <AppIcon :name="copySuccess ? 'check-circle' : 'copy'" :size="12" />
                    {{ copySuccess ? 'Copié !' : 'Copier' }}
                  </button>
                </div>
              </div>
            </div>
            <div v-if="detailInv.token" class="detail-qr">
              <img :src="`${apiUrl}/api/invitations/qr/${detailInv.token}`" :alt="`QR ${detailInv.invites?.nom}`" class="qr-img" />
              <a :href="`${apiUrl}/api/invitations/qr/${detailInv.token}`" target="_blank" class="btn-dl-qr">
                <AppIcon name="download" :size="16" /> Télécharger le QR code
              </a>
            </div>
            <div class="modal-actions">
              <button class="btn-cancel" @click="showDetail = false">Fermer</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ─── Modal Suppression ─── -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="modal-backdrop" @click.self="showDeleteModal = false">
        <div class="modal-box modal-confirm form-card">
          <div class="fh fh-s">
            <div class="fh-icon"><AppIcon name="trash" :size="22" /></div>
            <div class="fh-title">Supprimer l'invitation</div>
          </div>
          <div class="fb">
            <p class="confirm-text">
              Supprimer l'invitation de
              <strong>{{ deletingInv?.invites?.prenom }} {{ deletingInv?.invites?.nom }}</strong> ?
            </p>
            <div class="modal-actions">
              <button class="btn-cancel" @click="showDeleteModal = false">Annuler</button>
              <button class="bsub bsub-s modal-submit" @click="doDelete" :disabled="deleting">
                <AppIcon :name="deleting ? 'loader' : 'trash'" :size="16" />
                {{ deleting ? 'Suppression…' : 'Supprimer' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useApiStore } from '../store/api.js'
import AppIcon from '../components/AppIcon.vue'

const route = useRoute()
const api = useApiStore()
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const eventId = route.params.eventId
const evenement = ref(null)
const loading = ref(false)
const search = ref('')
const filterStatut = ref('')
const showAddModal = ref(false)
const showDetail = ref(false)
const showDeleteModal = ref(false)
const detailInv = ref(null)
const deletingInv = ref(null)
const deleting = ref(false)
const sending = ref(false)
const adding = ref(false)
const addError = ref('')
const modalSearch = ref('')
const selectedIds = ref(new Set())

onMounted(async () => {
  loading.value = true
  try {
    const [evtList] = await Promise.allSettled([
      api.get('/api/evenements'),
      api.fetchInvitations(eventId),
      api.fetchInvites()
    ])
    if (evtList.status === 'fulfilled') {
      evenement.value = (evtList.value || []).find(e => String(e.id) === String(eventId)) || null
    }
  } finally {
    loading.value = false
  }
})

const stats = computed(() => {
  const list = api.invitations
  return {
    total: list.length,
    inscrits: list.filter(i => i.statut === 'inscrit').length,
    declines: list.filter(i => i.statut === 'decline').length,
    presents: list.filter(i => i.statut === 'present').length,
  }
})

function pct(n) {
  if (!stats.value.total) return 0
  return Math.round((n / stats.value.total) * 100)
}

const pendingCount = computed(() =>
  api.invitations.filter(i => i.statut === 'pas_de_reaction').length
)

const filteredInvitations = computed(() => {
  let list = api.invitations
  if (filterStatut.value) list = list.filter(i => i.statut === filterStatut.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(i =>
      (i.invites?.nom || '').toLowerCase().includes(q) ||
      (i.invites?.prenom || '').toLowerCase().includes(q) ||
      (i.invites?.email || '').toLowerCase().includes(q) ||
      (i.invites?.organisation || '').toLowerCase().includes(q)
    )
  }
  return list
})

const alreadyInvited = computed(() => {
  const ids = new Set()
  api.invitations.forEach(i => { if (i.invites?.id) ids.add(i.invites.id) })
  return ids
})

const filteredContacts = computed(() => {
  let list = api.invites
  if (modalSearch.value.trim()) {
    const q = modalSearch.value.toLowerCase()
    list = list.filter(c =>
      (c.nom || '').toLowerCase().includes(q) ||
      (c.prenom || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.organisation || '').toLowerCase().includes(q)
    )
  }
  return list
})

function selectAll() {
  filteredContacts.value
    .filter(c => !alreadyInvited.value.has(c.id))
    .forEach(c => selectedIds.value.add(c.id))
}

function toggleContact(id) {
  if (selectedIds.value.has(id)) selectedIds.value.delete(id)
  else selectedIds.value.add(id)
}

function formatDate(d) {
  if (!d) return ''
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(d))
  } catch { return d }
}

function formatShortDate(d) {
  if (!d) return ''
  try {
    return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d))
  } catch { return d }
}

function initials(person) {
  if (!person) return '?'
  return ((person.prenom || '').charAt(0) + (person.nom || '').charAt(0)).toUpperCase() || '?'
}

function statutLabel(s) {
  const map = { pas_de_reaction: 'Pas de réaction', inscrit: 'Inscrit', decline: 'Décliné', present: 'Présent' }
  return map[s] || s
}

function statutClass(s) {
  const map = { pas_de_reaction: 'badge-gray', inscrit: 'badge-green', decline: 'badge-red', present: 'badge-blue' }
  return map[s] || 'badge-gray'
}

async function updateStatut(inv, newStatut) {
  try {
    const updated = await api.put(`/api/invitations/${inv.id}`, { statut: newStatut })
    const idx = api.invitations.findIndex(i => i.id === inv.id)
    if (idx !== -1) api.invitations[idx] = { ...api.invitations[idx], ...updated }
  } catch (err) {
    console.error('Erreur statut:', err)
  }
}

async function sendPending() {
  const pendingInvites = api.invitations.filter(i => i.statut === 'pas_de_reaction')
  const ids = pendingInvites.map(i => i.id)
  if (ids.length === 0) return

  sending.value = true
  try {
    const res = await api.post(`/api/invitations/send`, { invitation_ids: ids })
    const failedReasons = res.results ? res.results.filter(r => r.status === 'failed').map(r => '- ' + (r.error || 'Erreur inconnue')).join('\n') : ''
    alert(`Envoi terminé !\n\nSuccès: ${res.sent}\nÉchecs: ${res.failed}\nIgnorés (pas d'email): ${res.skipped}${failedReasons ? '\n\nCauses des échecs :\n' + failedReasons : ''}`)
    await api.fetchInvitations(eventId)
  } catch (err) {
    console.error(err)
    alert('Erreur: ' + err.message)
  } finally {
    sending.value = false
  }
}

async function openAddInvites() {
  modalSearch.value = ''
  selectedIds.value = new Set()
  addError.value = ''
  if (!api.invites.length) await api.fetchInvites()
  showAddModal.value = true
}

async function addInvitations() {
  if (!selectedIds.value.size) return
  adding.value = true
  addError.value = ''
  try {
    const ids = [...selectedIds.value]
    await api.post('/api/invitations', { evenement_id: eventId, invite_ids: ids })
    await api.fetchInvitations(eventId)
    showAddModal.value = false
  } catch (err) {
    addError.value = err.message || 'Erreur lors de l\'ajout.'
  } finally {
    adding.value = false
  }
}

function openDetail(inv) {
  detailInv.value = inv
  showDetail.value = true
}

function confirmDelete(inv) {
  deletingInv.value = inv
  showDeleteModal.value = true
}

async function doDelete() {
  if (!deletingInv.value) return
  deleting.value = true
  try {
    await api.del(`/api/invitations/${deletingInv.value.id}`)
    api.invitations = api.invitations.filter(i => i.id !== deletingInv.value.id)
    showDeleteModal.value = false
    deletingInv.value = null
  } finally {
    deleting.value = false
  }
}

const copySuccess = ref(false)

function getFullRsvpUrl(token) {
  return window.location.origin + '/rsvp/' + token
}

async function copyRsvpLink(token) {
  const url = getFullRsvpUrl(token)
  try {
    await navigator.clipboard.writeText(url)
    copySuccess.value = true
    setTimeout(() => {
      copySuccess.value = false
    }, 2000)
  } catch (err) {
    console.error('Erreur lors de la copie :', err)
  }
}
</script>

<style scoped>
.inv-shell { display: flex; flex-direction: column; gap: 20px; }

/* Stats bar */
.inv-stats-bar {
  display: flex; gap: 24px; flex-wrap: wrap;
  padding-top: 12px; padding-bottom: 12px;
  border-top: 1px solid rgba(132,89,54,.1);
}
.inv-stat { display: flex; align-items: baseline; gap: 8px; }
.inv-stat-num { font-size: 1.55rem; font-weight: 900; color: var(--rouge); }
.inv-stat.green .inv-stat-num { color: #2e7d32; }
.inv-stat.red .inv-stat-num { color: var(--rouge); }
.inv-stat.blue .inv-stat-num { color: #1565c0; }
.inv-stat-label { font-size: .76rem; font-weight: 700; color: var(--brun); opacity: .7; text-transform: uppercase; letter-spacing: .6px; }

/* Toolbar */
.inv-toolbar {
  display: flex; gap: 12px; flex-wrap: wrap; align-items: center;
  padding-top: 0; border-top: 1px solid rgba(132,89,54,.1);
}
.inv-search-wrap { position: relative; flex: 1; min-width: 180px; display: flex; align-items: center; }
.inv-search-icon {
  position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
  color: var(--brun); opacity: .5; pointer-events: none;
}
.inv-search-input {
  width: 100%; padding: 10px 16px 10px 40px;
  border: 2px solid #e8ddd0; border-radius: 999px;
  font-size: .9rem; background: var(--creme); color: var(--noir);
  outline: none; transition: all .25s;
}
.inv-search-input:focus { border-color: var(--or); background: #fff; box-shadow: 0 0 0 4px rgba(249,178,51,.1); }
.inv-filter-select {
  padding: 10px 36px 10px 14px;
  border: 2px solid #e8ddd0; border-radius: 999px;
  font-size: .88rem; background: var(--creme); color: var(--noir);
  outline: none; transition: all .25s; min-width: 160px;
}
.inv-filter-select:focus { border-color: var(--or); }
.inv-actions { display: flex; gap: 10px; flex-shrink: 0; flex-wrap: wrap; }

.btn-send {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 18px; background: rgba(46,125,50,.1);
  color: #2e7d32; border: 1.5px solid rgba(46,125,50,.3);
  border-radius: 999px; font-size: .84rem; font-weight: 700;
  cursor: pointer; transition: all .25s; white-space: nowrap;
}
.btn-send:hover:not(:disabled) { background: #2e7d32; color: #fff; }
.btn-send:disabled { opacity: .5; cursor: not-allowed; }

.btn-create {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 20px; background: linear-gradient(135deg, var(--brun), var(--or));
  color: #fff; border: none; border-radius: 999px;
  font-size: .84rem; font-weight: 700; cursor: pointer;
  white-space: nowrap; transition: all .25s;
  box-shadow: 0 6px 16px rgba(89,55,22,.2);
}
.btn-create:hover { transform: translateY(-1px); filter: brightness(1.06); }

.btn-scan {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 18px; background: rgba(21,101,192,.1);
  color: #1565c0; border: 1.5px solid rgba(21,101,192,.3);
  border-radius: 999px; font-size: .84rem; font-weight: 700;
  cursor: pointer; transition: all .25s; white-space: nowrap; text-decoration: none;
}
.btn-scan:hover { background: #1565c0; color: #fff; }

/* Loading */
.inv-loading {
  display: flex; align-items: center; justify-content: center; gap: 14px;
  padding: 60px 20px; color: var(--brun); font-weight: 700; opacity: .7;
}

/* Table */
.inv-table-wrap { overflow-x: auto; }
.inv-table { width: 100%; border-collapse: collapse; min-width: 700px; }
.inv-table th {
  padding: 12px 16px;
  background: rgba(132,89,54,.05); color: var(--brun);
  font-size: .75rem; font-weight: 800; text-transform: uppercase; letter-spacing: .8px;
  text-align: left; border-bottom: 2px solid rgba(132,89,54,.1);
}
.col-actions { text-align: right; white-space: nowrap; }
.inv-row {
  border-bottom: 1px solid rgba(132,89,54,.07); cursor: pointer;
  transition: background .18s;
}
.inv-row:hover { background: rgba(249,178,51,.06); }
.inv-row td { padding: 12px 16px; font-size: .88rem; vertical-align: middle; }
.inv-name-cell { display: flex; align-items: center; gap: 11px; }
.inv-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: linear-gradient(135deg, var(--brun), var(--or));
  color: #fff; font-size: .78rem; font-weight: 800;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.inv-avatar.sm { width: 30px; height: 30px; font-size: .7rem; }
.inv-fullname { font-weight: 700; }
.inv-org { font-size: .76rem; color: var(--brun); opacity: .6; margin-top: 2px; }
.inv-email { color: var(--brun); text-decoration: none; font-size: .86rem; }
.inv-email:hover { color: var(--rouge); text-decoration: underline; }
.inv-date { font-size: .82rem; color: #666; }
.inv-empty { color: rgba(132,89,54,.4); }

/* Statut badges */
.statut-badge {
  display: inline-block; padding: 4px 12px; border-radius: 999px;
  font-size: .72rem; font-weight: 700; letter-spacing: .6px; text-transform: uppercase;
}
.badge-gray  { background: #f0ece8; color: #7a6050; border: 1px solid rgba(122,96,80,.2); }
.badge-green { background: #e8f5e9; color: #2e7d32; border: 1px solid rgba(46,125,50,.25); }
.badge-red   { background: #ffeaea; color: var(--rouge); border: 1px solid rgba(177,34,42,.2); }
.badge-blue  { background: #e3f2fd; color: #1565c0; border: 1px solid rgba(21,101,192,.2); }

/* Row actions */
.row-btn-qr, .row-btn-delete {
  background: none; border: none; cursor: pointer;
  width: 32px; height: 32px; border-radius: 8px;
  display: inline-flex; align-items: center; justify-content: center;
  transition: all .18s; margin-left: 4px; text-decoration: none;
}
.row-btn-qr { color: #1565c0; }
.row-btn-qr:hover { background: rgba(21,101,192,.1); }
.row-btn-delete { color: var(--rouge); }
.row-btn-delete:hover { background: rgba(177,34,42,.1); }
.row-statut-select {
  padding: 5px 28px 5px 10px; border: 1.5px solid #e8ddd0;
  border-radius: 8px; font-size: .78rem; background: var(--creme);
  color: var(--noir); outline: none; cursor: pointer;
  margin-left: 4px;
}

/* Empty state */
.inv-empty-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 16px; padding: 60px 20px; text-align: center;
}
.inv-empty-icon {
  width: 80px; height: 80px;
  background: rgba(132,89,54,.08); border: 2px dashed rgba(132,89,54,.2);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  color: rgba(132,89,54,.4);
}
.inv-empty-state p { color: var(--brun); opacity: .7; margin: 0; }

/* Modal */
.modal-backdrop {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(26,16,8,.55);
  display: flex; align-items: center; justify-content: center;
  padding: 20px; animation: fadeIn .2s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.modal-box {
  width: 100%; max-width: 580px;
  max-height: calc(100vh - 40px); overflow-y: auto;
  animation: modalIn .3s cubic-bezier(.34,1.56,.64,1);
}
.modal-box-lg {
  width: 100%; max-width: 700px;
  max-height: calc(100vh - 40px); overflow-y: auto;
  animation: modalIn .3s cubic-bezier(.34,1.56,.64,1);
}
@keyframes modalIn {
  from { opacity: 0; transform: scale(.92) translateY(20px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
.modal-confirm { max-width: 480px; }
.confirm-text { font-size: .92rem; color: #555; line-height: 1.6; margin: 0 0 24px; }
.modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
.btn-cancel {
  padding: 12px 22px; background: none;
  border: 2px solid rgba(132,89,54,.2); border-radius: 12px;
  color: var(--brun); font-size: .88rem; font-weight: 700; cursor: pointer; transition: all .2s;
}
.btn-cancel:hover { border-color: var(--brun); background: rgba(132,89,54,.06); }
.modal-submit { width: auto; padding: 12px 28px; margin-top: 0; }
.form-error-msg {
  display: flex; align-items: center; gap: 8px;
  background: #ffeaea; border: 1.5px solid var(--rouge); border-radius: 12px;
  padding: 10px 14px; color: var(--rouge); font-size: .84rem; font-weight: 600;
  margin-top: 12px;
}

/* Add contacts modal */
.modal-search-wrap { position: relative; margin-bottom: 14px; display: flex; align-items: center; }
.modal-select-actions {
  display: flex; gap: 12px; align-items: center; margin-bottom: 14px; flex-wrap: wrap;
}
.btn-select-all {
  padding: 6px 14px; background: none;
  border: 1.5px solid rgba(132,89,54,.2); border-radius: 999px;
  font-size: .78rem; font-weight: 700; color: var(--brun);
  cursor: pointer; transition: all .2s;
}
.btn-select-all:hover { background: rgba(132,89,54,.08); }
.selection-count { font-size: .8rem; color: var(--rouge); font-weight: 700; margin-left: auto; }
.contacts-list {
  max-height: 380px; overflow-y: auto;
  border: 1.5px solid rgba(132,89,54,.12); border-radius: 14px;
  margin-bottom: 12px;
}
.contact-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px; cursor: pointer;
  border-bottom: 1px solid rgba(132,89,54,.08);
  transition: background .18s;
}
.contact-item:last-child { border-bottom: none; }
.contact-item:hover:not(.already) { background: rgba(249,178,51,.07); }
.contact-item.selected { background: rgba(249,178,51,.12); }
.contact-item.already { opacity: .5; cursor: not-allowed; }
.contact-item input[type=checkbox] { width: 16px; height: 16px; flex-shrink: 0; cursor: pointer; }
.contact-name { font-weight: 700; font-size: .9rem; color: var(--noir); }
.contact-meta { font-size: .76rem; color: var(--brun); opacity: .7; margin-top: 2px; }
.already-label {
  margin-left: auto; font-size: .7rem; font-weight: 700;
  color: #2e7d32; background: #e8f5e9; padding: 3px 10px;
  border-radius: 999px;
}
.contacts-empty { text-align: center; padding: 30px; color: var(--brun); opacity: .6; }

/* Detail */
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
.detail-item { display: flex; flex-direction: column; gap: 4px; }
.detail-label { font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; color: var(--brun); opacity: .6; }
.detail-qr { text-align: center; margin-bottom: 24px; }
.qr-img { max-width: 200px; border: 1.5px solid rgba(132,89,54,.2); border-radius: 12px; margin: 0 auto 12px; display: block; }
.btn-dl-qr {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 20px; background: rgba(21,101,192,.1);
  color: #1565c0; border: 1.5px solid rgba(21,101,192,.3);
  border-radius: 999px; font-size: .84rem; font-weight: 700;
  text-decoration: none; transition: all .2s;
}
.btn-dl-qr:hover { background: #1565c0; color: #fff; }

@media (max-width: 640px) {
  .inv-stats-bar { gap: 16px; }
  .inv-toolbar { flex-direction: column; align-items: stretch; }
  .inv-actions { flex-direction: column; }
  .detail-grid { grid-template-columns: 1fr; }
}
</style>
