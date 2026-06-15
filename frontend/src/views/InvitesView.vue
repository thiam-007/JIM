<template>
  <div class="inv-shell">

    <!-- ─── En-tête ─── -->
    <div class="form-card">
      <div class="fh fh-a">
        <div class="fh-icon"><AppIcon name="users" :size="24" /></div>
        <div class="fh-title">Invités</div>
        <div class="fh-sub">Gestion des contacts et invités — MVG event's</div>
      </div>
      <div class="fb inv-toolbar">
        <div class="inv-search-wrap">
          <AppIcon name="search" :size="16" class="inv-search-icon" />
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Rechercher par nom, email, organisation…"
            class="inv-search-input"
            @input="onSearch"
          />
          <button v-if="searchQuery" class="inv-search-clear" @click="clearSearch">
            <AppIcon name="x" :size="14" />
          </button>
        </div>
        <div class="inv-actions">
          <label class="btn-import" title="Importer un fichier CSV">
            <AppIcon name="upload" :size="16" /> Importer CSV
            <input type="file" accept=".csv" @change="importCSV" style="display:none" ref="csvInput" />
          </label>
          <button class="btn-create" @click="openCreate">
            <AppIcon name="plus" :size="16" /> Ajouter un invité
          </button>
        </div>
      </div>
    </div>

    <!-- ─── Import feedback ─── -->
    <div v-if="importMsg" class="inv-import-msg" :class="importMsg.type">
      <AppIcon :name="importMsg.type === 'success' ? 'check-circle' : 'alert-triangle'" :size="16" />
      {{ importMsg.text }}
    </div>

    <!-- ─── Chargement ─── -->
    <div v-if="loading" class="inv-loading">
      <AppIcon name="loader" :size="32" />
      <span>Chargement des invités…</span>
    </div>

    <!-- ─── Contenu ─── -->
    <div v-else class="form-card">
      <!-- Stats bar -->
      <div class="inv-stats-bar">
        <div class="inv-stat">
          <span class="inv-stat-num">{{ api.invites.length }}</span>
          <span class="inv-stat-label">Total invités</span>
        </div>
        <div class="inv-stat" v-if="searchQuery">
          <span class="inv-stat-num">{{ paginatedInvites.length }}</span>
          <span class="inv-stat-label">Résultats</span>
        </div>
      </div>

      <!-- Table -->
      <div class="inv-table-wrap">
        <table class="inv-table" v-if="api.invites.length > 0">
          <thead>
            <tr>
              <th @click="sortBy('nom')" class="sortable">
                Nom <AppIcon :name="sortField === 'nom' ? (sortDir === 'asc' ? 'chevron-up' : 'chevron-down') : 'chevrons-updown'" :size="13" />
              </th>
              <th>Email</th>
              <th>Organisation</th>
              <th>Poste</th>
              <th class="col-center">Invitations</th>
              <th class="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="inv in paginatedInvites" :key="inv.id" class="inv-row">
              <td class="inv-name-cell">
                <div class="inv-avatar">{{ initials(inv) }}</div>
                <div>
                  <div class="inv-fullname">{{ inv.prenom }} {{ inv.nom }}</div>
                  <div v-if="inv.telephone" class="inv-phone">{{ inv.telephone }}</div>
                </div>
              </td>
              <td>
                <a v-if="inv.email" :href="`mailto:${inv.email}`" class="inv-email">{{ inv.email }}</a>
                <span v-else class="inv-empty-cell">—</span>
              </td>
              <td>{{ inv.organisation || '—' }}</td>
              <td>{{ inv.titre_poste || '—' }}</td>
              <td class="col-center">
                <span class="inv-count-badge" v-if="inv.invitations_count">{{ inv.invitations_count }}</span>
                <span v-else class="inv-empty-cell">0</span>
              </td>
              <td class="col-actions">
                <button class="row-btn-edit" @click="openEdit(inv)" title="Modifier">
                  <AppIcon name="edit" :size="15" />
                </button>
                <button class="row-btn-delete" @click="confirmDelete(inv)" title="Supprimer">
                  <AppIcon name="trash" :size="15" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- État vide -->
        <div v-else class="inv-empty">
          <div class="inv-empty-icon"><AppIcon name="users" :size="40" /></div>
          <p v-if="searchQuery">Aucun invité ne correspond à "<strong>{{ searchQuery }}</strong>"</p>
          <p v-else>Aucun invité enregistré. Ajoutez votre premier invité !</p>
          <button class="btn-create" @click="openCreate">
            <AppIcon name="plus" :size="16" /> Ajouter un invité
          </button>
        </div>
      </div>

      <!-- Pagination -->
      <div class="inv-pagination" v-if="totalPages > 1">
        <button class="page-btn" :disabled="currentPage === 1" @click="currentPage--">
          <AppIcon name="chevron-left" :size="16" />
        </button>
        <span class="page-info">Page {{ currentPage }} / {{ totalPages }}</span>
        <button class="page-btn" :disabled="currentPage === totalPages" @click="currentPage++">
          <AppIcon name="chevron-right" :size="16" />
        </button>
      </div>
    </div>

    <!-- ─── Modal Créer / Modifier ─── -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
        <div class="modal-box form-card">
          <div class="fh fh-a">
            <div class="fh-icon"><AppIcon :name="editingInv ? 'edit' : 'user-plus'" :size="22" /></div>
            <div class="fh-title">{{ editingInv ? 'Modifier l\'invité' : 'Nouvel invité' }}</div>
          </div>
          <div class="fb">
            <form @submit.prevent="saveInv">
              <div class="fr">
                <div class="fg">
                  <label>Prénom <span class="req">*</span></label>
                  <input type="text" v-model="form.prenom" required placeholder="Ex : Mamadou" />
                </div>
                <div class="fg">
                  <label>Nom <span class="req">*</span></label>
                  <input type="text" v-model="form.nom" required placeholder="Ex : Diallo" />
                </div>
              </div>
              <div class="fr">
                <div class="fg">
                  <label>Email</label>
                  <input type="email" v-model="form.email" placeholder="contact@example.com" />
                </div>
                <div class="fg">
                  <label>Téléphone</label>
                  <input type="tel" v-model="form.telephone" placeholder="+224 6XX XX XX XX" />
                </div>
              </div>
              <div class="fr">
                <div class="fg">
                  <label>Organisation</label>
                  <input type="text" v-model="form.organisation" placeholder="Ex : Ministère de la Culture" />
                </div>
                <div class="fg">
                  <label>Titre / Poste</label>
                  <input type="text" v-model="form.titre_poste" placeholder="Ex : Directeur général" />
                </div>
              </div>
              <div class="fg">
                <label>Notes</label>
                <textarea v-model="form.notes" placeholder="Notes internes…" rows="3"></textarea>
              </div>

              <div v-if="formError" class="form-error-msg">
                <AppIcon name="alert-triangle" :size="15" /> {{ formError }}
              </div>

              <div class="modal-actions">
                <button type="button" class="btn-cancel" @click="closeModal">Annuler</button>
                <button type="submit" class="bsub bsub-a modal-submit" :disabled="saving">
                  <AppIcon :name="saving ? 'loader' : 'check'" :size="16" />
                  {{ saving ? 'Enregistrement…' : (editingInv ? 'Mettre à jour' : 'Ajouter l\'invité') }}
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
            <div class="fh-title">Supprimer l'invité</div>
          </div>
          <div class="fb">
            <p class="confirm-text">
              Êtes-vous sûr de vouloir supprimer <strong>{{ deletingInv?.prenom }} {{ deletingInv?.nom }}</strong> ?
              Toutes ses invitations seront également supprimées.
            </p>
            <div class="modal-actions">
              <button class="btn-cancel" @click="showDeleteModal = false">Annuler</button>
              <button class="bsub bsub-s modal-submit" @click="doDelete" :disabled="deleting">
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
import { useApiStore } from '../store/api.js'
import AppIcon from '../components/AppIcon.vue'

const api = useApiStore()

const loading = ref(false)
const searchQuery = ref('')
const searchTimeout = ref(null)
const sortField = ref('nom')
const sortDir = ref('asc')
const currentPage = ref(1)
const PAGE_SIZE = 25

const showModal = ref(false)
const showDeleteModal = ref(false)
const editingInv = ref(null)
const deletingInv = ref(null)
const saving = ref(false)
const deleting = ref(false)
const formError = ref('')
const importMsg = ref(null)
const csvInput = ref(null)

const form = ref({
  prenom: '', nom: '', email: '', telephone: '',
  organisation: '', titre_poste: '', notes: ''
})

onMounted(async () => {
  loading.value = true
  try {
    await api.fetchInvites()
  } finally {
    loading.value = false
  }
})

function onSearch() {
  clearTimeout(searchTimeout.value)
  currentPage.value = 1
  searchTimeout.value = setTimeout(async () => {
    loading.value = true
    try {
      await api.fetchInvites(searchQuery.value)
    } finally {
      loading.value = false
    }
  }, 400)
}

function clearSearch() {
  searchQuery.value = ''
  onSearch()
}

function sortBy(field) {
  if (sortField.value === field) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDir.value = 'asc'
  }
  currentPage.value = 1
}

const sortedInvites = computed(() => {
  const list = [...api.invites]
  list.sort((a, b) => {
    const va = (a[sortField.value] || '').toLowerCase()
    const vb = (b[sortField.value] || '').toLowerCase()
    return sortDir.value === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
  })
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(sortedInvites.value.length / PAGE_SIZE)))

const paginatedInvites = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return sortedInvites.value.slice(start, start + PAGE_SIZE)
})

function initials(inv) {
  const p = (inv.prenom || '').charAt(0).toUpperCase()
  const n = (inv.nom || '').charAt(0).toUpperCase()
  return p + n || '?'
}

function openCreate() {
  editingInv.value = null
  form.value = { prenom: '', nom: '', email: '', telephone: '', organisation: '', titre_poste: '', notes: '' }
  formError.value = ''
  showModal.value = true
}

function openEdit(inv) {
  editingInv.value = inv
  form.value = {
    prenom: inv.prenom || '',
    nom: inv.nom || '',
    email: inv.email || '',
    telephone: inv.telephone || '',
    organisation: inv.organisation || '',
    titre_poste: inv.titre_poste || '',
    notes: inv.notes || ''
  }
  formError.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingInv.value = null
}

async function saveInv() {
  formError.value = ''
  if (!form.value.prenom.trim()) { formError.value = 'Le prénom est obligatoire.'; return }
  if (!form.value.nom.trim()) { formError.value = 'Le nom est obligatoire.'; return }
  saving.value = true
  try {
    if (editingInv.value) {
      const updated = await api.put(`/api/invites/${editingInv.value.id}`, form.value)
      const idx = api.invites.findIndex(i => i.id === editingInv.value.id)
      if (idx !== -1) api.invites[idx] = updated
    } else {
      const created = await api.post('/api/invites', form.value)
      api.invites.unshift(created)
    }
    closeModal()
  } catch (err) {
    formError.value = err.message || 'Erreur lors de l\'enregistrement.'
  } finally {
    saving.value = false
  }
}

function confirmDelete(inv) {
  deletingInv.value = inv
  showDeleteModal.value = true
}

async function doDelete() {
  if (!deletingInv.value) return
  deleting.value = true
  try {
    await api.del(`/api/invites/${deletingInv.value.id}`)
    api.invites = api.invites.filter(i => i.id !== deletingInv.value.id)
    showDeleteModal.value = false
    deletingInv.value = null
  } finally {
    deleting.value = false
  }
}

async function importCSV(event) {
  const file = event.target.files[0]
  if (!file) return
  importMsg.value = null

  let text = await file.text()
  // Supprimer le BOM (Byte Order Mark) ajouté par Excel
  text = text.replace(/^\uFEFF/, '').trim()
  const lines = text.split('\n')
  if (lines.length < 2) {
    importMsg.value = { type: 'error', text: 'Le fichier CSV est vide ou invalide.' }
    return
  }

  const separator = lines[0].includes(';') ? ';' : ','
  const headers = lines[0].split(separator).map(h => h.trim().replace(/^"|"$/g, '').toLowerCase())
  const records = []

  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(separator).map(c => c.trim().replace(/^"|"$/g, ''))
    if (cells.every(c => !c)) continue
    const row = {}
    headers.forEach((h, idx) => { row[h] = cells[idx] || '' })
    if (row.prenom || row.nom) records.push(row)
  }

  if (!records.length) {
    importMsg.value = { type: 'error', text: 'Aucune ligne valide trouvée dans le fichier CSV.' }
    return
  }

  try {
    const result = await api.post('/api/invites/bulk', { invites: records })
    importMsg.value = { type: 'success', text: `${result.created || records.length} invités importés avec succès.` }
    await api.fetchInvites()
  } catch (err) {
    importMsg.value = { type: 'error', text: err.message || 'Erreur lors de l\'import.' }
  }

  if (csvInput.value) csvInput.value.value = ''
  setTimeout(() => { importMsg.value = null }, 5000)
}
</script>

<style scoped>
.inv-shell { display: flex; flex-direction: column; gap: 20px; }

/* Toolbar */
.inv-toolbar {
  display: flex; align-items: center; gap: 14px;
  flex-wrap: wrap; padding-top: 14px; padding-bottom: 14px;
}
.inv-search-wrap {
  position: relative; flex: 1; min-width: 220px;
  display: flex; align-items: center;
}
.inv-search-icon {
  position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
  color: var(--brun); opacity: .5; pointer-events: none;
}
.inv-search-input {
  width: 100%; padding: 11px 40px 11px 40px;
  border: 2px solid #e8ddd0; border-radius: 999px;
  font-size: .92rem; background: var(--creme);
  color: var(--noir); outline: none; transition: all .25s;
}
.inv-search-input:focus {
  border-color: var(--or); background: #fff;
  box-shadow: 0 0 0 4px rgba(249,178,51,.1);
}
.inv-search-clear {
  position: absolute; right: 14px;
  background: none; border: none; cursor: pointer;
  color: #aaa; display: flex; align-items: center;
  transition: color .2s;
}
.inv-search-clear:hover { color: var(--brun); }
.inv-actions { display: flex; gap: 10px; align-items: center; flex-shrink: 0; }

.btn-import {
  display: flex; align-items: center; gap: 8px;
  padding: 11px 20px; background: rgba(132,89,54,.08);
  color: var(--brun); border: 1.5px solid rgba(132,89,54,.25);
  border-radius: 999px; font-size: .86rem; font-weight: 700;
  cursor: pointer; transition: all .25s; white-space: nowrap;
}
.btn-import:hover { background: rgba(132,89,54,.16); border-color: var(--brun); }

.btn-create {
  display: flex; align-items: center; gap: 8px;
  padding: 11px 22px; background: linear-gradient(135deg, var(--brun), var(--or));
  color: #fff; border: none; border-radius: 999px;
  font-size: .86rem; font-weight: 700; cursor: pointer;
  white-space: nowrap; transition: all .25s;
  box-shadow: 0 6px 18px rgba(89,55,22,.2);
}
.btn-create:hover { transform: translateY(-1px); filter: brightness(1.06); }

/* Stats bar */
.inv-stats-bar {
  display: flex; gap: 24px; padding: 16px 32px;
  border-bottom: 1px solid rgba(132,89,54,.1);
  background: rgba(132,89,54,.03);
}
.inv-stat { display: flex; align-items: baseline; gap: 8px; }
.inv-stat-num { font-size: 1.6rem; font-weight: 900; color: var(--rouge); }
.inv-stat-label { font-size: .78rem; font-weight: 700; color: var(--brun); opacity: .7; text-transform: uppercase; letter-spacing: .8px; }

/* Table */
.inv-table-wrap { overflow-x: auto; }
.inv-table {
  width: 100%; border-collapse: collapse;
  min-width: 640px;
}
.inv-table th {
  padding: 12px 16px;
  background: rgba(132,89,54,.05);
  color: var(--brun); font-size: .76rem; font-weight: 800;
  text-transform: uppercase; letter-spacing: .8px;
  text-align: left; border-bottom: 2px solid rgba(132,89,54,.1);
  white-space: nowrap;
}
.inv-table th.sortable {
  cursor: pointer; user-select: none;
  display: flex; align-items: center; gap: 6px;
}
.inv-table th.sortable:hover { color: var(--rouge); }
.col-center { text-align: center; }
.col-actions { text-align: right; white-space: nowrap; }
.inv-row {
  border-bottom: 1px solid rgba(132,89,54,.07);
  transition: background .18s;
}
.inv-row:hover { background: rgba(249,178,51,.05); }
.inv-row td { padding: 12px 16px; font-size: .88rem; color: var(--noir); vertical-align: middle; }
.inv-name-cell { display: flex; align-items: center; gap: 12px; }
.inv-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: linear-gradient(135deg, var(--brun), var(--or));
  color: #fff; font-size: .78rem; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.inv-fullname { font-weight: 700; color: var(--noir); }
.inv-phone { font-size: .76rem; color: var(--brun); opacity: .6; margin-top: 2px; }
.inv-email { color: var(--brun); text-decoration: none; }
.inv-email:hover { color: var(--rouge); text-decoration: underline; }
.inv-empty-cell { color: rgba(132,89,54,.35); }
.inv-count-badge {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 50%;
  background: rgba(249,178,51,.18); color: #8a6600;
  font-size: .8rem; font-weight: 800;
}

.row-btn-edit, .row-btn-delete {
  background: none; border: none; cursor: pointer;
  width: 32px; height: 32px; border-radius: 8px;
  display: inline-flex; align-items: center; justify-content: center;
  transition: all .18s; margin-left: 4px;
}
.row-btn-edit { color: var(--brun); }
.row-btn-edit:hover { background: rgba(132,89,54,.12); }
.row-btn-delete { color: var(--rouge); }
.row-btn-delete:hover { background: rgba(177,34,42,.1); }

/* Empty state */
.inv-empty {
  display: flex; flex-direction: column; align-items: center;
  gap: 16px; padding: 60px 20px; text-align: center;
}
.inv-empty-icon {
  width: 80px; height: 80px;
  background: rgba(132,89,54,.08); border: 2px dashed rgba(132,89,54,.2);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  color: rgba(132,89,54,.4);
}
.inv-empty p { color: var(--brun); opacity: .7; margin: 0; }

/* Pagination */
.inv-pagination {
  display: flex; align-items: center; justify-content: center;
  gap: 16px; padding: 20px;
  border-top: 1px solid rgba(132,89,54,.08);
}
.page-btn {
  width: 36px; height: 36px; border-radius: 50%;
  border: 1.5px solid rgba(132,89,54,.2);
  background: none; color: var(--brun);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all .2s;
}
.page-btn:hover:not(:disabled) { background: rgba(132,89,54,.1); }
.page-btn:disabled { opacity: .35; cursor: not-allowed; }
.page-info { font-size: .84rem; font-weight: 700; color: var(--brun); }

/* Loading */
.inv-loading {
  display: flex; align-items: center; justify-content: center; gap: 14px;
  padding: 60px 20px; color: var(--brun); font-weight: 700; opacity: .7;
}

/* Import message */
.inv-import-msg {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 20px; border-radius: 16px;
  font-size: .88rem; font-weight: 600;
  animation: fadeInUp .3s ease;
}
.inv-import-msg.success { background: #e8f5e9; border: 1.5px solid rgba(46,125,50,.3); color: #2e7d32; }
.inv-import-msg.error { background: #ffeaea; border: 1.5px solid rgba(177,34,42,.3); color: var(--rouge); }

/* Modal */
.modal-backdrop {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(26,16,8,.55);
  display: flex; align-items: center; justify-content: center;
  padding: 20px; animation: fadeIn .2s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.modal-box {
  width: 100%; max-width: 660px;
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
  color: var(--brun); font-size: .88rem; font-weight: 700; cursor: pointer;
  transition: all .2s;
}
.btn-cancel:hover { border-color: var(--brun); background: rgba(132,89,54,.06); }
.modal-submit { width: auto; padding: 12px 28px; margin-top: 0; }
.form-error-msg {
  display: flex; align-items: center; gap: 8px;
  background: #ffeaea; border: 1.5px solid var(--rouge); border-radius: 12px;
  padding: 10px 14px; color: var(--rouge); font-size: .84rem; font-weight: 600;
  margin-top: 12px;
}

@keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 640px) {
  .inv-toolbar { flex-direction: column; align-items: stretch; }
  .inv-actions { flex-direction: column; }
  .btn-create, .btn-import { justify-content: center; }
  .modal-actions { flex-direction: column-reverse; }
  .btn-cancel, .modal-submit { width: 100%; text-align: center; justify-content: center; }
}
</style>
