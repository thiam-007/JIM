<template>
  <div class="ev-shell">
    <!-- ─── En-tête ─── -->
    <div class="ev-header form-card">
      <div class="fh fh-a">
        <div class="fh-icon"><AppIcon name="calendar" :size="24" /></div>
        <div class="fh-title">Événements</div>
        <div class="fh-sub">Gestion des événements JIM 2026 — Musée Virtuel de Guinée</div>
      </div>
      <div class="ev-header-actions fb">
        <div class="ev-search-row">
          <div class="ev-search-wrap">
            <AppIcon name="search" :size="16" class="ev-search-icon" />
            <input
              type="text"
              v-model="search"
              placeholder="Rechercher un événement…"
              class="ev-search-input"
            />
          </div>
          <button class="btn-create" @click="openCreate">
            <AppIcon name="plus" :size="16" /> Créer
          </button>
        </div>
      </div>
    </div>

    <!-- ─── États de chargement / vide ─── -->
    <div v-if="api.loading" class="ev-loading">
      <AppIcon name="loader" :size="32" />
      <span>Chargement des événements…</span>
    </div>

    <div v-else-if="!api.loading && filteredEvents.length === 0" class="ev-empty">
      <div class="ev-empty-icon"><AppIcon name="calendar" :size="40" /></div>
      <p v-if="search">Aucun événement ne correspond à "<strong>{{ search }}</strong>"</p>
      <p v-else>Aucun événement pour le moment. Créez votre premier événement !</p>
      <button class="btn-create" @click="openCreate">
        <AppIcon name="plus" :size="16" /> Créer un événement
      </button>
    </div>

    <!-- ─── Grille d'événements ─── -->
    <div v-else class="ev-grid">
      <div
        v-for="evt in filteredEvents"
        :key="evt.id"
        class="ev-card"
        @click="goToEvent(evt)"
      >
        <div class="ev-card-top">
          <div class="ev-card-title">{{ evt.titre }}</div>
          <span class="ev-badge" :class="badgeClass(evt.statut)">{{ statutLabel(evt.statut) }}</span>
        </div>

        <div class="ev-card-meta">
          <div class="ev-meta-item" v-if="evt.date_debut">
            <AppIcon name="calendar" :size="14" />
            <span>{{ formatDate(evt.date_debut) }}</span>
          </div>
          <div class="ev-meta-item" v-if="evt.lieu">
            <AppIcon name="map-pin" :size="14" />
            <span>{{ evt.lieu }}</span>
          </div>
          <div class="ev-meta-item" v-if="evt.capacite">
            <AppIcon name="users" :size="14" />
            <span>{{ evt.capacite }} places</span>
          </div>
          <div class="ev-meta-item" v-if="evt.inscriptions_count !== undefined">
            <AppIcon name="check-circle" :size="14" />
            <span>{{ evt.inscriptions_count }} inscrit{{ evt.inscriptions_count !== 1 ? 's' : '' }}</span>
          </div>
        </div>

        <div v-if="evt.description" class="ev-card-desc">{{ evt.description }}</div>

        <div class="ev-card-footer">
          <button
            class="ev-btn-edit"
            @click.stop="openEdit(evt)"
            title="Modifier"
          >
            <AppIcon name="edit" :size="15" /> Modifier
          </button>
          <button
            class="ev-btn-invite"
            @click.stop="goToInvitations(evt)"
            title="Invitations"
          >
            <AppIcon name="mail" :size="15" /> Invitations
          </button>
          <button
            class="ev-btn-delete"
            @click.stop="confirmDelete(evt)"
            title="Supprimer"
          >
            <AppIcon name="trash" :size="15" />
          </button>
        </div>
      </div>
    </div>

    <!-- ─── Modal Créer / Modifier ─── -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
        <div class="modal-box form-card">
          <div class="fh fh-a">
            <div class="fh-icon"><AppIcon :name="editingEvt ? 'edit' : 'plus'" :size="22" /></div>
            <div class="fh-title">{{ editingEvt ? 'Modifier l\'événement' : 'Nouvel événement' }}</div>
          </div>
          <div class="fb">
            <form @submit.prevent="saveEvt" class="ev-form">
              <div class="fr">
                <div class="fg">
                  <label>Titre <span class="req">*</span></label>
                  <input type="text" v-model="form.titre" required placeholder="Ex : Vernissage JIM 2026" />
                </div>
                <div class="fg">
                  <label>Lieu</label>
                  <input type="text" v-model="form.lieu" placeholder="Ex : Centre culturel franco-guinéen" />
                </div>
              </div>

              <div class="fg">
                <label>Description</label>
                <textarea v-model="form.description" placeholder="Description de l'événement…" rows="3"></textarea>
              </div>

              <div class="fr">
                <div class="fg">
                  <label>Date de début</label>
                  <input type="datetime-local" v-model="form.date_debut" />
                </div>
                <div class="fg">
                  <label>Date de fin</label>
                  <input type="datetime-local" v-model="form.date_fin" />
                </div>
              </div>

              <div class="fr">
                <div class="fg">
                  <label>Capacité</label>
                  <input type="number" v-model.number="form.capacite" min="0" placeholder="Ex : 200" />
                </div>
                <div class="fg">
                  <label>Statut</label>
                  <select v-model="form.statut">
                    <option value="brouillon">Brouillon</option>
                    <option value="publie">Publié</option>
                    <option value="termine">Terminé</option>
                  </select>
                </div>
              </div>

              <div v-if="formError" class="ev-form-error">
                <AppIcon name="alert-triangle" :size="15" /> {{ formError }}
              </div>

              <div class="ev-form-actions">
                <button type="button" class="btn-cancel" @click="closeModal">Annuler</button>
                <button type="submit" class="bsub bsub-a" :disabled="saving">
                  <AppIcon :name="saving ? 'loader' : 'check'" :size="16" />
                  {{ saving ? 'Enregistrement…' : (editingEvt ? 'Mettre à jour' : 'Créer l\'événement') }}
                </button>
              </div>
            </form>
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
            <div class="fh-title">Supprimer l'événement</div>
          </div>
          <div class="fb">
            <p class="confirm-text">
              Êtes-vous sûr de vouloir supprimer <strong>{{ deletingEvt?.titre }}</strong> ?
              Cette action est irréversible et supprimera toutes les invitations associées.
            </p>
            <div class="ev-form-actions">
              <button class="btn-cancel" @click="showDeleteModal = false">Annuler</button>
              <button class="bsub bsub-s" @click="doDelete" :disabled="deleting">
                <AppIcon :name="deleting ? 'loader' : 'trash'" :size="16" />
                {{ deleting ? 'Suppression…' : 'Supprimer définitivement' }}
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
import { useRouter } from 'vue-router'
import { useApiStore } from '../store/api.js'
import AppIcon from '../components/AppIcon.vue'

const router = useRouter()
const api = useApiStore()

const search = ref('')
const showModal = ref(false)
const showDeleteModal = ref(false)
const editingEvt = ref(null)
const deletingEvt = ref(null)
const saving = ref(false)
const deleting = ref(false)
const formError = ref('')

const form = ref({
  titre: '',
  description: '',
  date_debut: '',
  date_fin: '',
  lieu: '',
  capacite: '',
  statut: 'brouillon'
})

onMounted(async () => {
  await api.fetchEvenements()
})

const filteredEvents = computed(() => {
  if (!search.value.trim()) return api.evenements
  const q = search.value.toLowerCase()
  return api.evenements.filter(e =>
    (e.titre || '').toLowerCase().includes(q) ||
    (e.lieu || '').toLowerCase().includes(q) ||
    (e.description || '').toLowerCase().includes(q)
  )
})

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

function badgeClass(statut) {
  if (statut === 'publie') return 'badge-green'
  if (statut === 'termine') return 'badge-blue'
  return 'badge-gray'
}

function statutLabel(statut) {
  if (statut === 'publie') return 'Publié'
  if (statut === 'termine') return 'Terminé'
  return 'Brouillon'
}

function openCreate() {
  editingEvt.value = null
  form.value = { titre: '', description: '', date_debut: '', date_fin: '', lieu: '', capacite: '', statut: 'brouillon' }
  formError.value = ''
  showModal.value = true
}

function openEdit(evt) {
  editingEvt.value = evt
  form.value = {
    titre: evt.titre || '',
    description: evt.description || '',
    date_debut: evt.date_debut ? evt.date_debut.slice(0, 16) : '',
    date_fin: evt.date_fin ? evt.date_fin.slice(0, 16) : '',
    lieu: evt.lieu || '',
    capacite: evt.capacite || '',
    statut: evt.statut || 'brouillon'
  }
  formError.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingEvt.value = null
}

async function saveEvt() {
  formError.value = ''
  if (!form.value.titre.trim()) { formError.value = 'Le titre est obligatoire.'; return }
  saving.value = true
  try {
    const body = { ...form.value }
    if (!body.capacite) delete body.capacite
    if (!body.date_debut) delete body.date_debut
    if (!body.date_fin) delete body.date_fin
    if (editingEvt.value) {
      const updated = await api.put(`/api/evenements/${editingEvt.value.id}`, body)
      const idx = api.evenements.findIndex(e => e.id === editingEvt.value.id)
      if (idx !== -1) api.evenements[idx] = updated
    } else {
      const created = await api.post('/api/evenements', body)
      api.evenements.unshift(created)
    }
    closeModal()
  } catch (err) {
    formError.value = err.message || 'Erreur lors de l\'enregistrement.'
  } finally {
    saving.value = false
  }
}

function confirmDelete(evt) {
  deletingEvt.value = evt
  showDeleteModal.value = true
}

async function doDelete() {
  if (!deletingEvt.value) return
  deleting.value = true
  try {
    await api.del(`/api/evenements/${deletingEvt.value.id}`)
    api.evenements = api.evenements.filter(e => e.id !== deletingEvt.value.id)
    showDeleteModal.value = false
    deletingEvt.value = null
  } catch (err) {
    formError.value = err.message
  } finally {
    deleting.value = false
  }
}

function goToEvent(evt) {
  router.push({ name: 'Invitations', params: { eventId: evt.id } })
}

function goToInvitations(evt) {
  router.push({ name: 'Invitations', params: { eventId: evt.id } })
}
</script>

<style scoped>
.ev-shell { display: flex; flex-direction: column; gap: 24px; }

/* Header actions */
.ev-header-actions { padding-top: 16px; padding-bottom: 16px; }
.ev-search-row {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
}
.ev-search-wrap {
  position: relative; flex: 1; min-width: 200px;
}
.ev-search-icon {
  position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
  color: var(--brun); opacity: .5; pointer-events: none;
}
.ev-search-input {
  width: 100%; padding: 12px 16px 12px 40px;
  border: 2px solid #e8ddd0; border-radius: 999px;
  font-size: .92rem; background: var(--creme);
  color: var(--noir); outline: none; transition: all .25s;
}
.ev-search-input:focus {
  border-color: var(--or); background: #fff;
  box-shadow: 0 0 0 4px rgba(249,178,51,.1);
}
.btn-create {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 22px; background: linear-gradient(135deg, var(--brun), var(--or));
  color: #fff; border: none; border-radius: 999px;
  font-size: .86rem; font-weight: 700; cursor: pointer;
  white-space: nowrap; transition: all .25s;
  box-shadow: 0 6px 18px rgba(89,55,22,.2);
}
.btn-create:hover { transform: translateY(-1px); filter: brightness(1.06); }

/* Loading */
.ev-loading {
  display: flex; align-items: center; justify-content: center; gap: 14px;
  padding: 60px 20px; color: var(--brun); font-weight: 700;
  font-size: 1rem; opacity: .7;
}

/* Empty state */
.ev-empty {
  display: flex; flex-direction: column; align-items: center;
  gap: 16px; padding: 60px 20px; text-align: center;
}
.ev-empty-icon {
  width: 80px; height: 80px;
  background: rgba(132,89,54,.08); border: 2px dashed rgba(132,89,54,.2);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  color: rgba(132,89,54,.4);
}
.ev-empty p { color: var(--brun); opacity: .7; font-size: .95rem; margin: 0; }

/* Grid */
.ev-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

/* Event card */
.ev-card {
  background: rgba(255,255,255,.92);
  border: 1px solid rgba(132,89,54,.14);
  border-radius: 20px;
  padding: 22px 22px 16px;
  cursor: pointer;
  transition: all .28s cubic-bezier(.4,0,.2,1);
  box-shadow: 0 4px 16px rgba(89,55,22,.06);
  display: flex; flex-direction: column; gap: 12px;
  animation: fadeInUp .5s ease-out backwards;
}
.ev-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 40px rgba(89,55,22,.14);
  border-color: rgba(132,89,54,.28);
}
.ev-card-top {
  display: flex; align-items: flex-start;
  justify-content: space-between; gap: 10px;
}
.ev-card-title {
  font-size: 1.08rem; font-weight: 800; color: var(--noir);
  line-height: 1.3; flex: 1;
}
.ev-badge {
  padding: 4px 12px; border-radius: 999px;
  font-size: .7rem; font-weight: 700; letter-spacing: .8px;
  text-transform: uppercase; white-space: nowrap; flex-shrink: 0;
}
.badge-gray  { background: #f0ece8; color: #7a6050; border: 1px solid rgba(122,96,80,.2); }
.badge-green { background: #e8f5e9; color: #2e7d32; border: 1px solid rgba(46,125,50,.2); }
.badge-blue  { background: #e3f2fd; color: #1565c0; border: 1px solid rgba(21,101,192,.2); }

/* Meta */
.ev-card-meta { display: flex; flex-wrap: wrap; gap: 10px; }
.ev-meta-item {
  display: flex; align-items: center; gap: 5px;
  font-size: .8rem; color: var(--brun); opacity: .8;
  background: rgba(132,89,54,.07); padding: 4px 10px;
  border-radius: 999px;
}
.ev-card-desc {
  font-size: .84rem; color: #666; line-height: 1.5;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden;
}
.ev-card-footer {
  display: flex; align-items: center; gap: 8px;
  border-top: 1px solid rgba(132,89,54,.1); padding-top: 12px; margin-top: 4px;
}
.ev-btn-edit, .ev-btn-invite, .ev-btn-delete {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px; border-radius: 999px;
  font-size: .78rem; font-weight: 700; cursor: pointer;
  transition: all .2s; border: 1.5px solid transparent;
}
.ev-btn-edit {
  background: rgba(132,89,54,.08); color: var(--brun);
  border-color: rgba(132,89,54,.2);
}
.ev-btn-edit:hover { background: var(--brun); color: #fff; }
.ev-btn-invite {
  background: rgba(249,178,51,.1); color: #8a6600;
  border-color: rgba(249,178,51,.3);
}
.ev-btn-invite:hover { background: var(--or); color: #fff; }
.ev-btn-delete {
  margin-left: auto;
  background: rgba(177,34,42,.07); color: var(--rouge);
  border-color: rgba(177,34,42,.2); padding: 7px 12px;
}
.ev-btn-delete:hover { background: var(--rouge); color: #fff; }

/* Modal */
.modal-backdrop {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(26,16,8,.55);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
  animation: fadeIn .2s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.modal-box {
  width: 100%; max-width: 640px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  animation: modalIn .3s cubic-bezier(.34,1.56,.64,1);
}
@keyframes modalIn {
  from { opacity: 0; transform: scale(.92) translateY(20px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
.modal-confirm { max-width: 480px; }
.confirm-text {
  font-size: .92rem; color: #555; line-height: 1.6; margin: 0 0 24px;
}

/* Form actions */
.ev-form-actions {
  display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;
}
.btn-cancel {
  padding: 12px 22px; background: none;
  border: 2px solid rgba(132,89,54,.2); border-radius: 12px;
  color: var(--brun); font-size: .88rem; font-weight: 700; cursor: pointer;
  transition: all .2s;
}
.btn-cancel:hover { border-color: var(--brun); background: rgba(132,89,54,.06); }
.ev-form .bsub { width: auto; padding: 12px 28px; margin-top: 0; }

/* Form error */
.ev-form-error {
  display: flex; align-items: center; gap: 8px;
  background: #ffeaea; border: 1.5px solid var(--rouge); border-radius: 12px;
  padding: 10px 14px; color: var(--rouge); font-size: .84rem; font-weight: 600;
  margin-top: 12px;
}

@media (max-width: 600px) {
  .ev-grid { grid-template-columns: 1fr; }
  .ev-form-actions { flex-direction: column-reverse; }
  .btn-cancel, .ev-form .bsub { width: 100%; text-align: center; justify-content: center; }
}
</style>
