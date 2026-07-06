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
          <label class="btn-import" title="Importer un fichier Excel ou CSV">
            <AppIcon name="upload" :size="16" /> Importer Excel / CSV
            <input type="file" accept=".xlsx, .xls, .csv" @change="importExcelOrCSV" style="display:none" ref="fileInput" />
          </label>
          <button class="btn-import" @click="importFromNewsletter" :disabled="importingFromNewsletter" title="Importer les abonnés de la newsletter comme contacts/invités">
            <AppIcon :name="importingFromNewsletter ? 'loader' : 'mail'" :size="16" :class="{ spin: importingFromNewsletter }" />
            {{ importingFromNewsletter ? 'Importation…' : 'Importer Abonnés' }}
          </button>
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
import * as XLSX from 'xlsx'
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
const fileInput = ref(null)
const importingFromNewsletter = ref(false)

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

async function importExcelOrCSV(event) {
  const file = event.target.files[0]
  if (!file) return
  importMsg.value = null

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[firstSheetName]
      const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" })
      
      const records = []
      
      json.forEach(row => {
        // Recherche des clés sans sensibilité à la casse
        const pKey = Object.keys(row).find(k => k.toLowerCase() === 'prénom' || k.toLowerCase() === 'prenom' || k.toLowerCase() === 'first name' || k.toLowerCase() === 'firstname')
        const nKey = Object.keys(row).find(k => k.toLowerCase() === 'nom' || k.toLowerCase() === 'last name' || k.toLowerCase() === 'lastname')
        const eKey = Object.keys(row).find(k => k.toLowerCase() === 'email' || k.toLowerCase() === 'e-mail' || k.toLowerCase() === 'courriel')
        const tKey = Object.keys(row).find(k => k.toLowerCase() === 'téléphone' || k.toLowerCase() === 'telephone' || k.toLowerCase() === 'tel' || k.toLowerCase() === 'phone')
        const oKey = Object.keys(row).find(k => k.toLowerCase() === 'organisation' || k.toLowerCase() === 'société' || k.toLowerCase() === 'entreprise' || k.toLowerCase() === 'company' || k.toLowerCase() === 'institution')
        const posKey = Object.keys(row).find(k => k.toLowerCase() === 'poste' || k.toLowerCase() === 'fonction' || k.toLowerCase() === 'titre' || k.toLowerCase() === 'position' || k.toLowerCase() === 'role')
        const notesKey = Object.keys(row).find(k => k.toLowerCase() === 'notes' || k.toLowerCase() === 'note' || k.toLowerCase() === 'observation' || k.toLowerCase() === 'observations')
        
        let prenom = pKey ? String(row[pKey]).trim() : ''
        let nom = nKey ? String(row[nKey]).trim() : ''
        const email = eKey ? String(row[eKey]).trim() : ''
        const telephone = tKey ? String(row[tKey]).trim() : ''
        const organisation = oKey ? String(row[oKey]).trim() : ''
        const titre_poste = posKey ? String(row[posKey]).trim() : ''
        const notes = notesKey ? String(row[notesKey]).trim() : ''

        // Gestion du cas où le nom complet figure dans une seule colonne
        if (!prenom && !nom) {
          const fullnameKey = Object.keys(row).find(k => k.toLowerCase().includes('nom complet') || k.toLowerCase().includes('nom prénom') || k.toLowerCase().includes('nom prenom') || k.toLowerCase() === 'name' || k.toLowerCase() === 'fullname')
          if (fullnameKey && row[fullnameKey]) {
            const parts = String(row[fullnameKey]).trim().split(/\s+/)
            if (parts.length > 1) {
              prenom = parts[0]
              nom = parts.slice(1).join(' ')
            } else {
              nom = parts[0]
            }
          }
        }

        if (prenom || nom) {
          records.push({ prenom, nom, email, telephone, organisation, titre_poste, notes })
        }
      })

      if (records.length === 0) {
        importMsg.value = { type: 'error', text: 'Aucun contact valide trouvé dans le fichier.' }
        return
      }

      const result = await api.post('/api/invites/bulk', { invites: records })
      importMsg.value = { type: 'success', text: `${result.created || records.length} contact(s) importé(s) avec succès.` }
      await api.fetchInvites()
    } catch (err) {
      console.error(err)
      importMsg.value = { type: 'error', text: 'Erreur lors de la lecture du fichier. Assurez-vous qu\'il s\'agit d\'un fichier Excel ou CSV valide.' }
    }
  }
  
  reader.readAsArrayBuffer(file)
  if (fileInput.value) fileInput.value.value = ''
  setTimeout(() => { importMsg.value = null }, 5000)
}

async function importFromNewsletter() {
  importingFromNewsletter.value = true
  importMsg.value = null
  try {
    // 1. Récupérer les abonnés
    const subscribers = await api.get('/api/newsletter/subscribers')
    if (!subscribers || subscribers.length === 0) {
      importMsg.value = { type: 'error', text: 'Aucun abonné trouvé dans la newsletter.' }
      return
    }

    // 2. Récupérer les invités existants pour éviter les doublons par email
    await api.fetchInvites()
    const existingEmails = new Set(api.invites.map(i => (i.email || '').toLowerCase().trim()).filter(Boolean))

    const recordsToImport = []
    subscribers.forEach(sub => {
      if (!sub.email) return
      const cleanEmail = sub.email.toLowerCase().trim()
      
      // Sauter si l'email existe déjà dans la liste des contacts
      if (existingEmails.has(cleanEmail)) return

      let prenom = (sub.prenom || '').trim()
      let nom = (sub.nom || '').trim()
      
      // Extraction intelligente du prénom/nom à partir du pseudonyme de l'email si absent
      if (!prenom && !nom) {
        const username = sub.email.split('@')[0]
        const parts = username.split(/[\._-]/)
        if (parts.length > 1) {
          prenom = parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
          nom = parts.slice(1).join(' ').replace(/\b\w/g, c => c.toUpperCase())
        } else {
          prenom = username.charAt(0).toUpperCase() + username.slice(1)
          nom = 'Abonné'
        }
      }

      recordsToImport.push({
        prenom: prenom || 'Abonné',
        nom: nom || 'Newsletter',
        email: sub.email,
        telephone: '',
        organisation: sub.institution || '',
        titre_poste: sub.fonction || '',
        notes: 'Importé depuis la newsletter'
      })
    })

    if (recordsToImport.length === 0) {
      importMsg.value = { type: 'success', text: 'Tous vos abonnés figurent déjà dans votre liste de contacts.' }
      return
    }

    // 3. Envoi en masse au backend
    const result = await api.post('/api/invites/bulk', { invites: recordsToImport })
    importMsg.value = { type: 'success', text: `${result.created || recordsToImport.length} abonné(s) importé(s) comme contact(s) avec succès.` }
    
    // Recharger la liste d'affichage
    await api.fetchInvites()
  } catch (err) {
    console.error(err)
    importMsg.value = { type: 'error', text: err.message || 'Erreur lors de l\'importation des abonnés.' }
  } finally {
    importingFromNewsletter.value = false
    setTimeout(() => { importMsg.value = null }, 5000)
  }
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
