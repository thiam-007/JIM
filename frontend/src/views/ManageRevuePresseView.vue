<template>
  <div class="manage-actus-shell">
    <!-- Header -->
    <div class="manage-actus-header form-card">
      <div class="fh fh-a">
        <div class="fh-icon"><AppIcon name="award" :size="24" /></div>
        <div class="fh-title">Revue de Presse</div>
        <div class="fh-sub">Gérez les articles de médias parlant du Musée Virtuel de Guinée.</div>
      </div>
      <div class="header-actions fb">
        <div class="search-row">
          <div class="search-wrap">
            <AppIcon name="search" :size="16" class="search-icon" />
            <input
              type="text"
              v-model="search"
              placeholder="Rechercher un média ou un titre…"
              class="search-input"
            />
          </div>
          <button class="btn-create" @click="openCreate">
            <AppIcon name="plus" :size="16" /> Ajouter un article
          </button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="actus-loading">
      <AppIcon name="loader" :size="32" class="spin" />
      <span>Chargement de la revue de presse…</span>
    </div>

    <!-- Empty -->
    <div v-else-if="filteredRevue.length === 0" class="actus-empty">
      <div class="actus-empty-icon"><AppIcon name="award" :size="40" /></div>
      <p v-if="search">Aucun article ne correspond à "<strong>{{ search }}</strong>"</p>
      <p v-else>Aucun article pour le moment dans la revue de presse !</p>
      <button class="btn-create" @click="openCreate">
        <AppIcon name="plus" :size="16" /> Ajouter le premier article
      </button>
    </div>

    <!-- Grid -->
    <div v-else>
      <div class="actus-grid">
        <div
          v-for="actu in paginatedRevue"
          :key="actu.id"
          class="actu-card form-card"
        >
          <div class="actu-card-header">
            <div class="actu-img-wrap" style="height: 120px; background: rgba(132,89,54,0.05); padding: 10px;">
              <img v-if="actu.image_url" :src="actu.image_url" :alt="actu.media_nom" class="actu-img" style="object-fit: contain; width: 100%; height: 100%;" />
              <div v-else style="display:flex; height: 100%; align-items:center; justify-content:center; color:rgba(132,89,54,0.4); font-size:12px; font-weight:700;">{{ actu.media_nom }}</div>
            </div>
            <div class="actu-card-info">
              <div class="actu-card-title" style="font-size: 14px; margin-bottom: 4px;">{{ actu.media_nom }}</div>
              <div style="font-weight: 700; color: var(--brun-fonce); font-size: 15px; margin-bottom: 6px; line-height: 1.3;">{{ actu.titre }}</div>
              <div class="actu-card-date">
                <span>{{ formatDate(actu.date_publication) }}</span>
              </div>
            </div>
          </div>
          
          <div class="actu-card-body" v-if="actu.description">
            <p class="actu-card-desc">{{ actu.description }}</p>
          </div>

          <div class="actu-card-footer">
            <a v-if="actu.url_lien" :href="actu.url_lien" target="_blank" class="actu-btn-edit" style="text-decoration:none; color: var(--brun-fonce); border: 1px solid rgba(132,89,54,0.2);">
              <AppIcon name="external-link" :size="15" /> Lien
            </a>
            <button class="actu-btn-edit" @click="openEdit(actu)" title="Modifier">
              <AppIcon name="edit" :size="15" /> Éditer
            </button>
            <button class="actu-btn-delete" @click="confirmDelete(actu)" title="Supprimer">
              <AppIcon name="trash" :size="15" />
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
        <div class="modal-box form-card">
          <div class="fh fh-a">
            <div class="fh-icon"><AppIcon :name="editingItem ? 'edit' : 'plus'" :size="22" /></div>
            <div class="fh-title">{{ editingItem ? 'Modifier l\'article de presse' : 'Ajouter une mention presse' }}</div>
          </div>
          <div class="fb">
            <form @submit.prevent="saveItem" class="ev-form">
              <div class="fg">
                <label>Nom du média <span class="req">*</span></label>
                <input type="text" v-model="form.media_nom" required placeholder="Ex : Guinée News, RFI, TV5 Monde" />
              </div>

              <div class="fg">
                <label>Titre de l'article <span class="req">*</span></label>
                <input type="text" v-model="form.titre" required placeholder="Ex : Le Musée Virtuel de Guinée innove..." />
              </div>

              <div class="fg">
                <label>Date de publication</label>
                <input type="datetime-local" v-model="form.date_publication" />
              </div>

              <div class="fg">
                <label>Lien de l'article (URL) <span class="req">*</span></label>
                <input type="url" v-model="form.url_lien" required placeholder="https://..." />
              </div>

              <div class="fg">
                <label>Description / Extrait (Optionnel)</label>
                <textarea v-model="form.description" placeholder="Un petit extrait de l'article pour inciter à la lecture..." rows="3"></textarea>
              </div>

              <div class="fg">
                <div class="image-upload-section">
                  <div class="upload-label-row">
                    <label>Logo du média ou image d'illustration <span class="req">*</span></label>
                    <div class="mode-tabs">
                      <button type="button" class="tab-btn" :class="{ active: imageMode === 'file' }" @click="imageMode = 'file'">Téléverser</button>
                      <button type="button" class="tab-btn" :class="{ active: imageMode === 'url' }" @click="imageMode = 'url'">Lien URL</button>
                    </div>
                  </div>
                  
                  <div v-show="imageMode === 'file'">
                    <div class="file-upload-zone">
                      <input type="file" id="image-file-input" accept="image/*" @change="onFileChange" />
                      
                      <div v-if="!imageFile && !form.image_url" class="upload-prompt">
                        <AppIcon name="upload" :size="24" />
                        <span>Choisir depuis l’appareil ou la galerie</span>
                      </div>
                      
                      <div v-else class="preview-inside-zone">
                        <div class="preview-img-wrap">
                          <img :src="getPreviewSrc(imageFile ? imageFile.base64 : form.image_url)" class="preview-img" @error="onImageError" />
                        </div>
                        <div class="preview-details">
                          <div class="preview-filename">{{ imageFile ? imageFile.name : 'Image existante (cliquez pour remplacer)' }}</div>
                        </div>
                        <button type="button" class="btn-remove-file-absolute" @click.stop.prevent="removeFile" title="Supprimer l'image">
                          <AppIcon name="trash" :size="16" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div v-show="imageMode === 'url'">
                    <input type="text" v-model="form.image_url" placeholder="https://..." @input="isCoverLoadError = false" />
                    <div v-if="form.image_url" class="preview-container flex-col align-start gap-2">
                      <div class="preview-row">
                        <div class="preview-img-wrap">
                          <img :src="getPreviewSrc(form.image_url)" class="preview-img" @error="isCoverLoadError = true" @load="isCoverLoadError = false" />
                        </div>
                        <div class="preview-details">
                          <div class="preview-filename">Aperçu du lien</div>
                        </div>
                      </div>
                      <div v-if="isCoverLoadError" class="url-error-warning">
                        <AppIcon name="alert-circle" :size="14" />
                        <span>Ce lien n'est pas valide ou bloqué. Téléversez plutôt l'image.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="formError" class="ev-form-error">
                <AppIcon name="alert-triangle" :size="15" /> {{ formError }}
              </div>

              <div class="ev-form-actions">
                <button type="button" class="btn-cancel" @click="closeModal">Annuler</button>
                <button type="submit" class="bsub bsub-a" :disabled="saving">
                  <AppIcon :name="saving ? 'loader' : 'check'" :size="16" />
                  {{ saving ? 'Enregistrement…' : (editingItem ? 'Mettre à jour' : 'Ajouter l\'article') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div v-if="showDeleteModal" class="modal-backdrop" @click.self="showDeleteModal = false">
        <div class="modal-box modal-confirm form-card">
          <div class="fh fh-s">
            <div class="fh-icon"><AppIcon name="trash" :size="22" /></div>
            <div class="fh-title">Supprimer l'article</div>
          </div>
          <div class="fb">
            <p class="confirm-text">
              Êtes-vous sûr de vouloir supprimer l'article <strong>{{ deletingItem?.titre }}</strong> ?
              Cette action est irréversible.
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
import { ref, computed, onMounted, watch } from 'vue'
import { useApiStore } from '../store/api.js'
import AppIcon from '../components/AppIcon.vue'

const api = useApiStore()

const loading = ref(false)
const revuePresse = ref([])
const search = ref('')
const showModal = ref(false)
const showDeleteModal = ref(false)
const editingItem = ref(null)
const deletingItem = ref(null)
const saving = ref(false)
const deleting = ref(false)
const formError = ref('')
const isCoverLoadError = ref(false)
const imagePlaceholder = '/images/side-photo.jpeg'

const form = ref({
  titre: '',
  media_nom: '',
  description: '',
  url_lien: '',
  date_publication: '',
  image_url: ''
})

const imageFile = ref(null)
const imageMode = ref('file')

onMounted(async () => {
  await fetchRevuePresse()
})

async function fetchRevuePresse() {
  loading.value = true
  try {
    const data = await api.get('/api/revue-presse')
    revuePresse.value = data || []
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

const filteredRevue = computed(() => {
  if (!search.value.trim()) return revuePresse.value
  const q = search.value.toLowerCase().trim()
  return revuePresse.value.filter(a =>
    (a.titre || '').toLowerCase().includes(q) ||
    (a.media_nom || '').toLowerCase().includes(q) ||
    (a.description || '').toLowerCase().includes(q)
  )
})

// Pagination
const currentPage = ref(1)
const itemsPerPage = 6

const totalPages = computed(() => Math.ceil(filteredRevue.value.length / itemsPerPage) || 1)

const paginatedRevue = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredRevue.value.slice(start, end)
})

watch(search, () => {
  currentPage.value = 1
})

function changePage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date(dateStr))
  } catch {
    return dateStr
  }
}

function toLocalISOString(date) {
  const pad = (num) => (num < 10 ? '0' : '') + num
  return date.getFullYear() +
    '-' + pad(date.getMonth() + 1) +
    '-' + pad(date.getDate()) +
    'T' + pad(date.getHours()) +
    ':' + pad(date.getMinutes())
}

function isValidUrl(string) {
  if (!string) return false
  try {
    const url = new URL(string)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch (_) {
    return false
  }
}

function normalizeImageSource(value) {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('data:image/') || trimmed.startsWith('/') || trimmed.startsWith('blob:')) return trimmed
  if (/^(https?:\/\/|\/\/)/i.test(trimmed)) return trimmed
  if (trimmed.includes('unsplash.com') || trimmed.includes('images.unsplash.com')) return `https://${trimmed}`
  return `https://${trimmed}`
}

function getPreviewSrc(value) {
  const normalized = normalizeImageSource(value)
  if (!normalized) return imagePlaceholder
  if (normalized.startsWith('data:') || normalized.startsWith('/') || normalized.startsWith('blob:')) {
    return normalized
  }
  if (isValidUrl(normalized)) {
    if (normalized.includes('supabase.co')) {
      return normalized
    }
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
    return `${apiUrl}/api/proxy-image?url=${encodeURIComponent(normalized)}`
  }
  return imagePlaceholder
}

function onImageError(event) {
  event.target.src = imagePlaceholder
}

function onFileChange(event) {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    imageFile.value = {
      base64: e.target.result,
      name: file.name,
      mimeType: file.type
    }
  }
  reader.readAsDataURL(file)
}

function removeFile() {
  if (imageFile.value) {
    imageFile.value = null
    const input = document.getElementById('image-file-input')
    if (input) input.value = ''
  } else {
    form.value.image_url = ''
  }
}

function openCreate() {
  formError.value = ''
  editingItem.value = null
  form.value = {
    titre: '',
    media_nom: '',
    description: '',
    url_lien: '',
    date_publication: toLocalISOString(new Date()),
    image_url: ''
  }
  imageFile.value = null
  imageMode.value = 'file'
  showModal.value = true
}

function openEdit(item) {
  formError.value = ''
  editingItem.value = item
  let d = item.date_publication
  if (d) {
    const dt = new Date(d)
    if (!isNaN(dt.getTime())) d = toLocalISOString(dt)
  } else {
    d = toLocalISOString(new Date())
  }
  form.value = {
    titre: item.titre,
    media_nom: item.media_nom,
    description: item.description || '',
    url_lien: item.url_lien || '',
    date_publication: d,
    image_url: item.image_url || ''
  }
  imageFile.value = null
  imageMode.value = (item.image_url && !item.image_url.startsWith('data:') && !item.image_url.includes('supabase.co') && item.image_url !== imagePlaceholder) ? 'url' : 'file'
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function saveItem() {
  formError.value = ''
  saving.value = true
  try {
    let finalImageUrl = normalizeImageSource(form.value.image_url) || null
    if (imageMode.value === 'file' && imageFile.value) {
      const uploadRes = await api.post('/api/actualites/upload', {
        file: imageFile.value.base64,
        fileName: imageFile.value.name,
        mimeType: imageFile.value.mimeType
      })
      finalImageUrl = uploadRes.url
    }

    const payload = { ...form.value, image_url: finalImageUrl }
    if (!payload.date_publication) payload.date_publication = new Date().toISOString()
    else payload.date_publication = new Date(payload.date_publication).toISOString()

    if (editingItem.value) {
      const res = await api.put(`/api/revue-presse/${editingItem.value.id}`, payload)
      const index = revuePresse.value.findIndex(a => a.id === editingItem.value.id)
      if (index !== -1) revuePresse.value[index] = res
    } else {
      const res = await api.post('/api/revue-presse', payload)
      revuePresse.value.unshift(res)
    }
    showModal.value = false
  } catch (err) {
    formError.value = err.message || "Erreur lors de l'enregistrement"
  } finally {
    saving.value = false
  }
}

function confirmDelete(item) {
  deletingItem.value = item
  showDeleteModal.value = true
}

async function doDelete() {
  if (!deletingItem.value) return
  deleting.value = true
  try {
    await api.del(`/api/revue-presse/${deletingItem.value.id}`)
    revuePresse.value = revuePresse.value.filter(a => a.id !== deletingItem.value.id)
    showDeleteModal.value = false
  } catch (err) {
    console.error('Delete error', err)
    alert("Impossible de supprimer l'article.")
  } finally {
    deleting.value = false
    deletingItem.value = null
  }
}
</script>

<style scoped>
.manage-actus-shell { display: flex; flex-direction: column; gap: 24px; }
.manage-actus-header { display: flex; flex-direction: column; gap: 16px; }
@media (min-width: 600px) {
  .manage-actus-header { flex-direction: row; align-items: flex-start; justify-content: space-between; }
}

.search-row { display: flex; gap: 12px; align-items: center; width: 100%; flex-wrap: wrap; justify-content: flex-end; }
.search-wrap { position: relative; max-width: 300px; width: 100%; }
.search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: rgba(132,89,54,.4); }
.search-input { width: 100%; padding: 10px 14px 10px 40px; border: 2px solid rgba(132,89,54,.15); border-radius: 999px; font-family: 'Lato', sans-serif; font-size: .86rem; color: var(--brun); outline: none; transition: all .2s; }
.search-input:focus { border-color: rgba(249,178,51,.6); background: rgba(249,178,51,.05); }

.btn-create { display: inline-flex; align-items: center; gap: 8px; padding: 12px 22px; background: linear-gradient(135deg, var(--brun), var(--or)); color: #fff; border: none; border-radius: 999px; font-size: .86rem; font-weight: 700; cursor: pointer; box-shadow: 0 6px 18px rgba(89,55,22,.2); transition: all .2s; }
.btn-create:hover { filter: brightness(1.1); transform: translateY(-1px); }

.actus-loading { display: flex; align-items: center; justify-content: center; gap: 14px; padding: 60px 20px; color: var(--brun); font-weight: 700; opacity: .7; }
.actus-empty { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 60px 20px; text-align: center; }
.actus-empty-icon { width: 80px; height: 80px; background: rgba(132,89,54,.08); border: 2px dashed rgba(132,89,54,.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: rgba(132,89,54,.4); }

.actus-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; }
.actu-card { display: flex; flex-direction: column; padding: 0; overflow: hidden; }
.actu-card-header { padding: 0; display: flex; flex-direction: column; }
.actu-img-wrap { width: 100%; display: flex; align-items: center; justify-content: center; }
.actu-card-info { padding: 16px; }
.actu-card-date { margin-top: 8px; font-size: .75rem; font-weight: 600; color: rgba(132,89,54,.6); text-transform: uppercase; letter-spacing: 1px; }

.actu-card-body { padding: 0 16px 16px; flex-grow: 1; }
.actu-card-desc { font-size: .86rem; color: rgba(132,89,54,.8); line-height: 1.5; margin: 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }

.actu-card-footer { display: flex; border-top: 1px solid rgba(132,89,54,.08); padding: 12px 16px; gap: 8px; align-items: center; }
.actu-btn-edit { flex-grow: 1; padding: 8px 0; display: flex; align-items: center; justify-content: center; gap: 6px; background: rgba(132,89,54,.06); color: var(--brun); border: none; border-radius: 6px; font-size: .8rem; font-weight: 700; cursor: pointer; transition: all .2s; }
.actu-btn-edit:hover { background: rgba(132,89,54,.12); }
.actu-btn-delete { padding: 8px 12px; background: rgba(177,34,42,.06); color: var(--rouge); border: none; border-radius: 6px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all .2s; }
.actu-btn-delete:hover { background: rgba(177,34,42,.12); }

.pagination-controls { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 30px; }
.page-btn { padding: 8px 16px; background: rgba(132,89,54,.1); border: none; border-radius: 999px; display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 700; color: var(--brun); transition: all .2s; }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-btn:not(:disabled):hover { background: rgba(132,89,54,.2); }
.page-info { font-size: .9rem; font-weight: 700; color: var(--brun-fonce); }

.modal-backdrop { position: fixed; inset: 0; z-index: 1000; background: rgba(26,16,8,.55); display: flex; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(2px); }
.modal-box { width: 100%; max-width: 650px; max-height: calc(100vh - 40px); overflow-y: auto; }
.modal-confirm { max-width: 480px; }
.ev-form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
.btn-cancel { padding: 12px 22px; background: none; border: 2px solid rgba(132,89,54,.2); border-radius: 12px; color: var(--brun); font-weight: 700; cursor: pointer; transition: all .2s; }
.btn-cancel:hover { border-color: var(--brun); background: rgba(132,89,54,.06); }
.ev-form-error { display: flex; align-items: center; gap: 8px; background: #ffeaea; border: 1.5px solid var(--rouge); border-radius: 12px; padding: 10px 14px; color: var(--rouge); font-size: .84rem; font-weight: 600; margin-top: 12px; }

.image-upload-section { display: flex; flex-direction: column; gap: 12px; }
.upload-label-row { display: flex; align-items: center; justify-content: space-between; }
.mode-tabs { display: flex; background: rgba(132,89,54,0.08); border-radius: 8px; padding: 3px; }
.tab-btn { padding: 4px 12px; border: none; background: transparent; font-size: 0.8rem; font-weight: 600; border-radius: 6px; cursor: pointer; color: rgba(132,89,54,0.6); transition: all 0.2s; }
.tab-btn.active { background: white; color: var(--brun-fonce); box-shadow: 0 2px 5px rgba(132,89,54,0.1); }
.file-upload-zone { position: relative; border: 2px dashed rgba(132,89,54,0.2); border-radius: 12px; min-height: 120px; display: flex; align-items: center; justify-content: center; background: rgba(132,89,54,0.02); transition: all 0.2s; overflow: hidden; cursor: pointer; }
.file-upload-zone:hover { border-color: rgba(132,89,54,0.4); background: rgba(132,89,54,0.05); }
.file-upload-zone input[type="file"] { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 10; }
.upload-prompt { display: flex; flex-direction: column; align-items: center; gap: 8px; color: rgba(132,89,54,0.5); font-size: 0.85rem; font-weight: 600; pointer-events: none; }
.preview-inside-zone { display: flex; align-items: center; gap: 16px; padding: 12px; width: 100%; height: 100%; background: white; pointer-events: none; }
.preview-img-wrap { width: 80px; height: 80px; border-radius: 8px; overflow: hidden; border: 1px solid rgba(132,89,54,0.1); flex-shrink: 0; background: #f5f5f5; }
.preview-img { width: 100%; height: 100%; object-fit: cover; }
.preview-details { display: flex; flex-direction: column; flex-grow: 1; }
.preview-filename { font-size: 0.85rem; font-weight: 700; color: var(--brun-fonce); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 250px; }
.btn-remove-file-absolute { position: absolute; top: 12px; right: 12px; width: 32px; height: 32px; border-radius: 50%; background: white; border: 1px solid rgba(177,34,42,0.2); color: var(--rouge); display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 20; pointer-events: auto; box-shadow: 0 4px 12px rgba(177,34,42,0.1); transition: all 0.2s; }
.btn-remove-file-absolute:hover { background: rgba(177,34,42,0.05); border-color: rgba(177,34,42,0.4); transform: scale(1.05); }
.preview-container { padding: 12px; border: 1px solid rgba(132,89,54,0.15); border-radius: 12px; background: rgba(132,89,54,0.03); margin-top: 10px; }
.preview-row { display: flex; gap: 12px; align-items: center; }
.url-error-warning { display: flex; align-items: center; gap: 6px; color: var(--rouge); font-size: 0.8rem; background: rgba(177,34,42,0.05); padding: 8px 12px; border-radius: 6px; }
</style>
