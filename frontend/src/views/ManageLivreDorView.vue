<template>
  <div class="manage-actus-shell">
    <!-- Header -->
    <div class="manage-actus-header form-card">
      <div class="fh fh-a">
        <div class="fh-icon"><AppIcon name="book-open" :size="24" /></div>
        <div class="fh-title">Gestion du Livre d'Or</div>
        <div class="fh-sub">Supervisez, éditez, corrigez les fautes d'orthographe ou supprimez les témoignages des visiteurs.</div>
      </div>
      <div class="header-actions fb">
        <div class="search-row">
          <div class="search-wrap">
            <AppIcon name="search" :size="16" class="search-icon" />
            <input
              type="text"
              v-model="search"
              placeholder="Rechercher par auteur, ville ou contenu…"
              class="search-input"
            />
          </div>
          <button class="btn-create" @click="openCreate">
            <AppIcon name="plus" :size="16" /> Ajouter un témoignage
          </button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="actus-loading">
      <AppIcon name="loader" :size="32" class="spin" />
      <span>Chargement des témoignages du livre d'or…</span>
    </div>

    <!-- Empty -->
    <div v-else-if="filteredMessages.length === 0" class="actus-empty">
      <div class="actus-empty-icon"><AppIcon name="book-open" :size="40" /></div>
      <p v-if="search">Aucun témoignage ne correspond à "<strong>{{ search }}</strong>"</p>
      <p v-else>Aucun message dans le livre d'or pour le moment !</p>
      <button class="btn-create" @click="openCreate">
        <AppIcon name="plus" :size="16" /> Ajouter le premier témoignage
      </button>
    </div>

    <!-- Grid -->
    <div v-else>
      <div class="actus-grid">
        <div
          v-for="msg in paginatedMessages"
          :key="msg.id"
          class="actu-card form-card"
        >
          <div class="actu-card-header" style="padding: 16px;">
            <div class="actu-card-info" style="width: 100%;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <GuestbookAvatar :genre="msg.genre || 'homme'" :size="36" />
                  <span style="font-weight: 800; color: var(--brun-fonce); font-size: 16px;">{{ msg.author }}</span>
                </div>
                <span class="actu-card-date" style="font-size: 12px; opacity: 0.7;">{{ msg.date }}</span>
              </div>
              <div style="font-size: 12px; color: var(--or); font-weight: 700; margin-bottom: 8px; display: flex; align-items: center; gap: 4px;">
                <AppIcon name="map-pin" :size="12" /> {{ msg.location || 'Emplacement non précisé' }}
              </div>
            </div>
          </div>
          
          <div class="actu-card-body" style="padding: 0 16px 16px;">
            <p class="actu-card-desc" style="font-style: italic; color: var(--noir); line-height: 1.55;">
              "{{ msg.text }}"
            </p>
          </div>

          <div class="actu-card-footer">
            <button class="actu-btn-edit" @click="openEdit(msg)" title="Modifier / Corriger">
              <AppIcon name="edit-3" :size="15" /> Modifier
            </button>
            <button class="actu-btn-delete" @click="confirmDelete(msg)" title="Supprimer">
              <AppIcon name="trash-2" :size="15" /> Supprimer
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination Controls -->
      <div v-if="totalPages > 1" class="pagination-controls mt-4">
        <button class="page-btn" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
          <AppIcon name="chevron-left" :size="16" /> Précédent
        </button>
        <span class="page-info">Page {{ currentPage }} sur {{ totalPages }}</span>
        <button class="page-btn" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">
          Suivant <AppIcon name="chevron-right" :size="16" />
        </button>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
        <div class="modal-box form-card" style="max-width: 520px;">
          <div class="fh fh-a">
            <div class="fh-icon"><AppIcon name="book-open" :size="22" /></div>
            <div class="fh-title">{{ isEditing ? "Modifier le témoignage" : "Ajouter au Livre d'Or" }}</div>
            <button class="btn-close-modal" @click="closeModal" title="Fermer">
              <AppIcon name="x" :size="20" />
            </button>
          </div>

          <form @submit.prevent="saveMessage" class="fb" style="gap: 16px; padding: 24px;">
            <div class="form-group">
              <label class="form-label">Auteur / Pseudo <span class="req">*</span></label>
              <input
                type="text"
                v-model="form.author"
                required
                placeholder="Ex: Mamadou Diallo"
                class="form-control"
              />
            </div>

            <!-- Choix du genre -->
            <div class="form-group">
              <label class="form-label">Genre (Avatar)</label>
              <div class="genre-selector">
                <label class="genre-pill" :class="{ active: form.genre === 'homme' }">
                  <input type="radio" v-model="form.genre" value="homme" class="genre-radio" />
                  <GuestbookAvatar genre="homme" :size="26" />
                  <span>Homme</span>
                </label>
                <label class="genre-pill" :class="{ active: form.genre === 'femme' }">
                  <input type="radio" v-model="form.genre" value="femme" class="genre-radio" />
                  <GuestbookAvatar genre="femme" :size="26" />
                  <span>Femme</span>
                </label>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Ville &amp; Pays <span class="req">*</span></label>
              <input
                type="text"
                v-model="form.location"
                required
                placeholder="Ex: Labé, Guinée"
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Date du message</label>
              <input
                type="text"
                v-model="form.date"
                placeholder="Ex: 27 Juil. 2026"
                class="form-control"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Message / Témoignage <span class="req">*</span></label>
              <textarea
                v-model="form.text"
                required
                rows="5"
                placeholder="Message du visiteur..."
                class="form-control"
                style="resize: vertical;"
              ></textarea>
            </div>

            <div v-if="formError" class="emsg on">
              <AppIcon name="alert-triangle" :size="15" /> {{ formError }}
            </div>

            <div class="modal-actions" style="margin-top: 8px;">
              <button type="button" class="btn-cancel" @click="closeModal" :disabled="saving">Annuler</button>
              <button type="submit" class="btn-primary-custom" :disabled="saving">
                <AppIcon v-if="saving" name="loader" class="spin" :size="16" />
                <AppIcon v-else name="check" :size="16" />
                <span>{{ saving ? "Enregistrement..." : (isEditing ? "Enregistrer les modifications" : "Ajouter") }}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="modal-backdrop" @click.self="closeDeleteModal">
        <div class="modal-box form-card" style="max-width: 440px;">
          <div class="fh fh-a" style="border-bottom: 1px solid rgba(220,53,69,0.2);">
            <div class="fh-icon" style="background: rgba(220,53,69,0.1); color: #dc3545;">
              <AppIcon name="trash-2" :size="22" />
            </div>
            <div class="fh-title" style="color: #dc3545;">Supprimer le message</div>
            <button class="btn-close-modal" @click="closeDeleteModal">
              <AppIcon name="x" :size="20" />
            </button>
          </div>

          <div style="padding: 24px;">
            <p style="margin-bottom: 16px; font-size: 14px; line-height: 1.5; color: var(--noir);">
              Êtes-vous sûr de vouloir supprimer définitivement le témoignage de <strong>{{ itemToDelete?.author }}</strong> ?
            </p>
            <div style="background: rgba(132,89,54,0.06); padding: 12px 16px; border-radius: 12px; font-style: italic; font-size: 13px; margin-bottom: 20px; border-left: 3px solid var(--or);">
              "{{ itemToDelete?.text }}"
            </div>

            <div v-if="deleteError" class="emsg on" style="margin-bottom: 16px;">
              <AppIcon name="alert-triangle" :size="15" /> {{ deleteError }}
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-cancel" @click="closeDeleteModal" :disabled="deleting">Annuler</button>
              <button type="button" class="btn-danger-custom" @click="executeDelete" :disabled="deleting" style="background: #dc3545; color: white; border: none; padding: 10px 18px; border-radius: 10px; font-weight: 700; display: flex; align-items: center; gap: 8px; cursor: pointer;">
                <AppIcon v-if="deleting" name="loader" class="spin" :size="16" />
                <AppIcon v-else name="trash-2" :size="16" />
                <span>{{ deleting ? "Suppression..." : "Confirmer la suppression" }}</span>
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
import GuestbookAvatar from '../components/GuestbookAvatar.vue'

const api = useApiStore()

const defaultMessages = [
  { id: 1, author: 'Mamadou Diallo', location: 'Labé, Guinée', genre: 'homme', text: 'Une fierté immense de voir nos richesses culturelles modélisées avec cette qualité. La case de Fougoumba est splendide !', date: '27 Juil. 2026' },
  { id: 2, author: 'Sarah Jenkins', location: 'Londres, UK', genre: 'femme', text: 'Stunning design! The audio guide and 3D models are world-class. It feels like visiting Conakry from home.', date: '26 Juil. 2026' },
  { id: 3, author: 'Aissata Camara', location: 'Conakry, Guinée', genre: 'femme', text: 'Le masque Nimba est impressionnant en 3D. Merci pour cette initiative de digitalisation de notre patrimoine.', date: '25 Juil. 2026' },
  { id: 4, author: 'Jean-Pierre Dubois', location: 'Paris, France', genre: 'homme', text: 'Une expérience musée immersive magnifique. La constellation de particules et le son de Kora apportent une vraie âme au site.', date: '24 Juil. 2026' },
  { id: 5, author: 'Fatoumata Barry', location: 'Dalaba, Guinée', genre: 'femme', text: "Voir la case sacrée de Fougoumba modélisée ainsi est très émouvant. Notre histoire mérite cette visibilité.", date: '23 Juil. 2026' },
  { id: 6, author: 'Amadou Soumah', location: 'Boké, Guinée', genre: 'homme', text: "Félicitations pour ce travail exceptionnel ! C'est le futur de la transmission culturelle guinéenne.", date: '22 Juil. 2026' },
  { id: 7, author: 'Elena Rossi', location: 'Rome, Italie', genre: 'femme', text: 'Bellissimo! A great blend of technology and cultural heritage. The AR feature is incredible.', date: '21 Juil. 2026' },
  { id: 8, author: 'Sekou Condé', location: 'Kankan, Guinée', genre: 'homme', text: "Le Sosso Bala et l'histoire du Mandingue m'ont donné des frissons. Un grand merci aux développeurs.", date: '20 Juil. 2026' }
]

const messages = ref([])
const loading = ref(false)
const search = ref('')
const currentPage = ref(1)
const itemsPerPage = 8

// Modals
const showModal = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const formError = ref('')

const form = ref({
  id: null,
  author: '',
  location: '',
  genre: 'homme',
  text: '',
  date: ''
})

const showDeleteModal = ref(false)
const itemToDelete = ref(null)
const deleting = ref(false)
const deleteError = ref('')

onMounted(() => {
  loadMessages()
})

async function loadMessages() {
  loading.value = true
  try {
    const data = await api.get('/api/livre-dor')
    if (Array.isArray(data) && data.length > 0) {
      messages.value = data
      localStorage.setItem('mvg_guestbook', JSON.stringify(data))
    } else {
      loadFromLocalStorage()
    }
  } catch (e) {
    loadFromLocalStorage()
  } finally {
    loading.value = false
  }
}

function loadFromLocalStorage() {
  const saved = localStorage.getItem('mvg_guestbook')
  if (saved) {
    try { messages.value = JSON.parse(saved) } catch (e) { messages.value = [...defaultMessages] }
  } else {
    messages.value = [...defaultMessages]
    localStorage.setItem('mvg_guestbook', JSON.stringify(defaultMessages))
  }
}

function syncLocalStorage() {
  localStorage.setItem('mvg_guestbook', JSON.stringify(messages.value))
}

const filteredMessages = computed(() => {
  if (!search.value.trim()) return messages.value
  const q = search.value.toLowerCase()
  return messages.value.filter(m => 
    (m.author && m.author.toLowerCase().includes(q)) ||
    (m.location && m.location.toLowerCase().includes(q)) ||
    (m.text && m.text.toLowerCase().includes(q))
  )
})

const totalPages = computed(() => Math.ceil(filteredMessages.value.length / itemsPerPage) || 1)

const paginatedMessages = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredMessages.value.slice(start, start + itemsPerPage)
})

function changePage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

function openCreate() {
  isEditing.value = false
  const today = new Date()
  const months = ['Janv.','Févr.','Mars','Avril','Mai','Juin','Juil.','Août','Sept.','Oct.','Nov.','Déc.']
  const formattedDate = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`

  form.value = {
    id: null,
    author: '',
    location: '',
    genre: 'homme',
    text: '',
    date: formattedDate
  }
  formError.value = ''
  showModal.value = true
}

function openEdit(msg) {
  isEditing.value = true
  form.value = {
    id: msg.id,
    author: msg.author || '',
    location: msg.location || '',
    genre: msg.genre || 'homme',
    text: msg.text || '',
    date: msg.date || ''
  }
  formError.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function saveMessage() {
  if (!form.value.author.trim() || !form.value.text.trim()) {
    formError.value = 'Le nom et le message sont obligatoires.'
    return
  }

  saving.value = true
  formError.value = ''

  try {
    if (isEditing.value) {
      // Try API put
      try {
        const updated = await api.put(`/api/livre-dor/${form.value.id}`, form.value)
        const idx = messages.value.findIndex(m => m.id === form.value.id)
        if (idx !== -1) messages.value[idx] = updated
      } catch (err) {
        // Fallback local
        const idx = messages.value.findIndex(m => m.id === form.value.id)
        if (idx !== -1) {
          messages.value[idx] = { ...messages.value[idx], ...form.value }
        }
      }
    } else {
      // Try API post
      try {
        const created = await api.post('/api/livre-dor', form.value)
        messages.value.unshift(created)
      } catch (err) {
        // Fallback local
        const newMsg = {
          id: Date.now(),
          ...form.value
        }
        messages.value.unshift(newMsg)
      }
    }
    syncLocalStorage()
    showModal.value = false
  } catch (err) {
    formError.value = err.message || "Une erreur est survenue lors de l'enregistrement."
  } finally {
    saving.value = false
  }
}

function confirmDelete(msg) {
  itemToDelete.value = msg
  deleteError.value = ''
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
  itemToDelete.value = null
}

async function executeDelete() {
  if (!itemToDelete.value) return
  deleting.value = true
  deleteError.value = ''

  const id = itemToDelete.value.id
  try {
    try {
      await api.del(`/api/livre-dor/${id}`)
    } catch (err) {
      // Fallback local delete
    }
    messages.value = messages.value.filter(m => m.id !== id)
    syncLocalStorage()
    closeDeleteModal()
  } catch (err) {
    deleteError.value = err.message || "Erreur lors de la suppression."
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.manage-actus-shell {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.manage-actus-header {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.search-wrap {
  position: relative;
  flex: 1;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}

.search-input {
  width: 100%;
  padding: 11px 16px 11px 40px;
  border-radius: 12px;
  border: 1.5px solid rgba(132, 89, 54, 0.2);
  background: #fdfaf7;
  font-size: 0.9rem;
  outline: none;
  transition: all 0.22s;
  box-sizing: border-box;
}

html.theme-musee .search-input {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(212, 175, 55, 0.22);
  color: white;
}

.search-input:focus {
  border-color: var(--or);
  background: white;
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);
}

.btn-create {
  background: linear-gradient(135deg, var(--brun), var(--or));
  color: white;
  border: none;
  border-radius: 12px;
  padding: 11px 20px;
  font-weight: 700;
  font-size: 0.88rem;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.25s;
}

.btn-create:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(89, 55, 22, 0.3);
}

.actus-loading,
.actus-empty {
  text-align: center;
  padding: 60px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: #888;
}

.actus-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.actu-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(132, 89, 54, 0.14);
  background: white;
  transition: all 0.25s;
}

html.theme-musee .actu-card {
  background: rgba(20, 23, 40, 0.9);
  border-color: rgba(212, 175, 55, 0.22);
}

.actu-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 30px rgba(89, 55, 22, 0.12);
}

.actu-card-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 16px;
  border-top: 1px solid rgba(132, 89, 54, 0.1);
  background: rgba(132, 89, 54, 0.02);
}

.actu-btn-edit {
  background: white;
  border: 1px solid rgba(132, 89, 54, 0.2);
  color: var(--brun-fonce);
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

html.theme-musee .actu-btn-edit {
  background: rgba(255, 255, 255, 0.08);
  color: var(--or);
  border-color: rgba(212, 175, 55, 0.25);
}

.actu-btn-edit:hover {
  background: var(--brun);
  color: white;
  border-color: var(--brun);
}

.actu-btn-delete {
  background: rgba(220, 53, 69, 0.08);
  border: 1px solid rgba(220, 53, 69, 0.2);
  color: #dc3545;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.actu-btn-delete:hover {
  background: #dc3545;
  color: white;
}

.pagination-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.page-btn {
  background: white;
  border: 1.5px solid rgba(132, 89, 54, 0.2);
  padding: 8px 16px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.84rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--brun);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(10, 5, 2, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-box {
  width: 90%;
  animation: popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes popIn {
  from { opacity: 0; transform: scale(0.85) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-cancel {
  background: transparent;
  border: 1.5px solid rgba(132, 89, 54, 0.2);
  padding: 10px 18px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  color: var(--brun);
}

.genre-selector {
  display: flex;
  gap: 12px;
}

.genre-pill {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1.5px solid rgba(132, 89, 54, 0.2);
  background: #fdfaf7;
  cursor: pointer;
  font-weight: 700;
  font-size: 0.86rem;
  color: var(--brun);
  transition: all 0.22s;
}

html.theme-musee .genre-pill {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(212, 175, 55, 0.22);
  color: white;
}

.genre-radio {
  display: none;
}

.genre-pill.active {
  border-color: var(--or);
  background: rgba(212, 175, 55, 0.12);
  box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);
}
</style>
