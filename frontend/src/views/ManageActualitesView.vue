<template>
  <div class="manage-actus-shell">
    <!-- Header -->
    <div class="manage-actus-header form-card">
      <div class="fh fh-a">
        <div class="fh-icon"><AppIcon name="file-text" :size="24" /></div>
        <div class="fh-title">Gestion des Actualités</div>
        <div class="fh-sub">Ajoutez, modifiez ou supprimez les actualités de la vitrine visiteur.</div>
      </div>
      <div class="header-actions fb">
        <div class="search-row">
          <div class="search-wrap">
            <AppIcon name="search" :size="16" class="search-icon" />
            <input
              type="text"
              v-model="search"
              placeholder="Rechercher une actualité…"
              class="search-input"
            />
          </div>
          <button class="btn-create" @click="openCreate">
            <AppIcon name="plus" :size="16" /> Créer un article
          </button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="api.loading" class="actus-loading">
      <AppIcon name="loader" :size="32" class="spin" />
      <span>Chargement des actualités…</span>
    </div>

    <!-- Empty -->
    <div v-else-if="filteredActualites.length === 0" class="actus-empty">
      <div class="actus-empty-icon"><AppIcon name="file-text" :size="40" /></div>
      <p v-if="search">Aucun article ne correspond à "<strong>{{ search }}</strong>"</p>
      <p v-else>Aucun article pour le moment. Créez votre première actualité !</p>
      <button class="btn-create" @click="openCreate">
        <AppIcon name="plus" :size="16" /> Créer une actualité
      </button>
    </div>

    <!-- Grid -->
    <div v-else>
      <div class="actus-grid">
        <div
          v-for="actu in paginatedActualites"
        :key="actu.id"
        class="actu-card form-card"
      >
        <div class="actu-card-header">
          <div class="actu-img-wrap">
            <img :src="actu.imageUrl" :alt="actu.titre" class="actu-img" />
          </div>
          <div class="actu-card-info">
            <div class="actu-card-title">{{ actu.titre }}</div>
            <div class="actu-card-date">
              <span v-if="!actu.date_evenement" class="status-badge status-a_venir">À venir</span>
              <span v-else>{{ formatDate(actu.date_evenement) }}</span>
            </div>
          </div>
        </div>
        
        <div class="actu-card-body">
          <p class="actu-card-desc">{{ actu.description }}</p>
        </div>

        <div class="actu-card-footer">
          <button
            class="actu-btn-edit"
            @click="openEdit(actu)"
            title="Modifier"
          >
            <AppIcon name="edit" :size="15" /> Modifier
          </button>
          <button
            class="actu-btn-delete"
            @click="confirmDelete(actu)"
            title="Supprimer"
          >
            <AppIcon name="trash" :size="15" /> Supprimer
          </button>
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
    </div>

    <!-- Create/Edit Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
        <div class="modal-box form-card">
          <div class="fh fh-a">
            <div class="fh-icon"><AppIcon :name="editingActu ? 'edit' : 'plus'" :size="22" /></div>
            <div class="fh-title">{{ editingActu ? 'Modifier l\'actualité' : 'Nouvel article' }}</div>
          </div>
          <div class="fb">
            <form @submit.prevent="saveActu" class="ev-form">
              <div class="fg">
                <label>Titre de l'actualité <span class="req">*</span></label>
                <input type="text" v-model="form.titre" required placeholder="Ex : Lancement de la numérisation 3D" />
              </div>

              <div class="fg">
                <label>Date de l'événement / publication</label>
                <input type="datetime-local" v-model="form.date_evenement" />
                <div style="font-size: 0.8rem; color: #6a5040; margin-top: 4px; opacity: 0.8;">
                  Laissez vide pour utiliser la date de création par défaut.
                </div>
              </div>

              <div class="fg">
                <label>Description (Résumé court) <span class="req">*</span></label>
                <textarea v-model="form.description" required placeholder="Un court résumé affiché sur les cartes de la page d'accueil (2-3 phrases)..." rows="3"></textarea>
              </div>

              <div class="fg">
                <label>Date de l'événement (Optionnel)</label>
                <input type="datetime-local" v-model="form.date_evenement" />
                <div style="font-size: 0.8rem; color: #6a5040; margin-top: 6px; opacity: 0.8;">
                  Laissez ce champ vide pour afficher l'étiquette <strong>"À venir"</strong>.
                </div>
              </div>

              <div class="fg">
                <label>Auteur de l'article (Optionnel)</label>
                <input type="text" v-model="form.auteur" placeholder="Ex: Jean Dupont" />
              </div>

              <div class="fg">
                <label>Contenu complet <span class="req">*</span></label>
                <textarea v-model="form.contenu" required placeholder="Le corps complet de l'article avec tous les détails..." rows="8"></textarea>
                <div style="font-size: 0.8rem; color: #6a5040; margin-top: 6px; opacity: 0.8;">
                  <AppIcon name="info" :size="12" style="display: inline-block; vertical-align: middle; margin-right: 4px;" />
                  <strong>Astuce de formatage :</strong> Utilisez <code>**texte**</code> pour mettre en <strong>gras</strong>, ou commencez une ligne par <code>- </code> pour créer une liste à puces.
                </div>
              </div>

              <!-- Photo de couverture -->
              <div class="fg">
                <div class="image-upload-section">
                  <div class="upload-label-row">
                    <label>Photo de couverture (Accueil / Liste) <span class="req">*</span></label>
                    <div class="mode-tabs">
                      <button type="button" class="tab-btn" :class="{ active: coverMode === 'file' }" @click="coverMode = 'file'">Téléverser</button>
                      <button type="button" class="tab-btn" :class="{ active: coverMode === 'url' }" @click="coverMode = 'url'">Lien URL</button>
                    </div>
                  </div>
                  
                  <!-- Local file mode -->
                  <div v-show="coverMode === 'file'">
                    <div class="file-upload-zone">
                      <input type="file" id="cover-file-input" accept="image/*" @change="onFileChange($event, 'cover')" />
                      
                      <div v-if="!coverFile && !form.image_url" class="upload-prompt">
                        <AppIcon name="upload" :size="24" />
                        <span>Choisir depuis l’appareil ou la galerie</span>
                      </div>
                      
                      <div v-else class="preview-inside-zone">
                        <div class="preview-img-wrap">
                          <img :src="getPreviewSrc(coverFile ? coverFile.base64 : form.image_url)" class="preview-img" @error="onImageError" />
                        </div>
                        <div class="preview-details">
                          <div class="preview-filename">{{ coverFile ? coverFile.name : 'Image existante (cliquez pour remplacer)' }}</div>
                        </div>
                        <button type="button" class="btn-remove-file-absolute" @click.stop.prevent="removeFile('cover')" title="Supprimer l'image">
                          <AppIcon name="trash" :size="16" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <!-- External URL mode -->
                  <div v-show="coverMode === 'url'">
                    <input type="text" v-model="form.image_url" placeholder="https://exemple.com/image.jpg" @input="isCoverLoadError = false" />
                    <div v-if="form.image_url" class="preview-container flex-col align-start gap-2">
                      <div class="preview-row">
                        <div class="preview-img-wrap">
                          <img :src="getPreviewSrc(form.image_url)" class="preview-img" @error="isCoverLoadError = true" @load="isCoverLoadError = false" />
                        </div>
                        <div class="preview-details">
                          <div class="preview-filename">Aperçu du lien de couverture</div>
                        </div>
                      </div>
                      <div v-if="isCoverLoadError" class="url-error-warning">
                        <AppIcon name="alert-circle" :size="14" />
                        <span>Ce lien n'est pas une image valide ou est bloqué (CORS/Hotlink). Téléversez plutôt l'image.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Photo de détail -->
              <div class="fg">
                <div class="image-upload-section">
                  <div class="upload-label-row">
                    <label>Photo de détail (Bannière de l'article) <span class="req">*</span></label>
                    <div class="mode-tabs">
                      <button type="button" class="tab-btn" :class="{ active: detailMode === 'file' }" @click="detailMode = 'file'">Téléverser</button>
                      <button type="button" class="tab-btn" :class="{ active: detailMode === 'url' }" @click="detailMode = 'url'">Lien URL</button>
                    </div>
                  </div>
                  
                  <!-- Local file mode -->
                  <div v-show="detailMode === 'file'">
                    <div class="file-upload-zone">
                      <input type="file" id="detail-file-input" accept="image/*" @change="onFileChange($event, 'detail')" />
                      
                      <div v-if="!detailFile && !form.image_detail_url" class="upload-prompt">
                        <AppIcon name="upload" :size="24" />
                        <span>Choisir depuis l’appareil ou la galerie</span>
                      </div>
                      
                      <div v-else class="preview-inside-zone">
                        <div class="preview-img-wrap">
                          <img :src="getPreviewSrc(detailFile ? detailFile.base64 : form.image_detail_url)" class="preview-img" @error="onImageError" />
                        </div>
                        <div class="preview-details">
                          <div class="preview-filename">{{ detailFile ? detailFile.name : 'Image existante (cliquez pour remplacer)' }}</div>
                        </div>
                        <button type="button" class="btn-remove-file-absolute" @click.stop.prevent="removeFile('detail')" title="Supprimer l'image">
                          <AppIcon name="trash" :size="16" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <!-- External URL mode -->
                  <div v-show="detailMode === 'url'">
                    <input type="text" v-model="form.image_detail_url" placeholder="https://exemple.com/image_detail.jpg" @input="isDetailLoadError = false" />
                    <div v-if="form.image_detail_url" class="preview-container flex-col align-start gap-2">
                      <div class="preview-row">
                        <div class="preview-img-wrap">
                          <img :src="getPreviewSrc(form.image_detail_url)" class="preview-img" @error="isDetailLoadError = true" @load="isDetailLoadError = false" />
                        </div>
                        <div class="preview-details">
                          <div class="preview-filename">Aperçu du lien de détail</div>
                        </div>
                      </div>
                      <div v-if="isDetailLoadError" class="url-error-warning">
                        <AppIcon name="alert-circle" :size="14" />
                        <span>Ce lien n'est pas une image valide ou est bloqué (CORS/Hotlink). Téléversez plutôt l'image.</span>
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
                  {{ saving ? 'Enregistrement…' : (editingActu ? 'Mettre à jour' : 'Créer l\'article') }}
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
            <div class="fh-title">Supprimer l'actualité</div>
          </div>
          <div class="fb">
            <p class="confirm-text">
              Êtes-vous sûr de vouloir supprimer l'article <strong>{{ deletingActu?.titre }}</strong> ?
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
import { RouterLink } from 'vue-router'
import { useApiStore } from '../store/api.js'
import AppIcon from '../components/AppIcon.vue'

const api = useApiStore()

const search = ref('')
const showModal = ref(false)
const showDeleteModal = ref(false)
const editingActu = ref(null)
const deletingActu = ref(null)
const saving = ref(false)
const deleting = ref(false)
const formError = ref('')
const showDeleteModal = ref(false)
const isCoverLoadError = ref(false)
const isDetailLoadError = ref(false)
const imagePlaceholder = '/images/side-photo.jpeg'

const form = ref({
  titre: '',
  description: '',
  contenu: '',
  auteur: '',
  image_url: '',
  image_detail_url: '',
  date_evenement: ''
})

const coverFile = ref(null) // { base64: '', name: '', mimeType: '' }
const coverMode = ref('file') // 'file' | 'url'

const detailFile = ref(null) // { base64: '', name: '', mimeType: '' }
const detailMode = ref('file') // 'file' | 'url'

onMounted(async () => {
  await api.fetchActualites()
})

const filteredActualites = computed(() => {
  if (!search.value.trim()) return api.actualites
  const q = search.value.toLowerCase().trim()
  return api.actualites.filter(a =>
    (a.titre || '').toLowerCase().includes(q) ||
    (a.description || '').toLowerCase().includes(q) ||
    (a.contenu || '').toLowerCase().includes(q)
  )
})

// Pagination
const currentPage = ref(1)
const itemsPerPage = 6

const totalPages = computed(() => Math.ceil(filteredActualites.value.length / itemsPerPage) || 1)

const paginatedActualites = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredActualites.value.slice(start, end)
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

function onFileChange(event, type) {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const base64 = e.target.result
    if (type === 'cover') {
      coverFile.value = {
        base64,
        name: file.name,
        mimeType: file.type
      }
    } else {
      detailFile.value = {
        base64,
        name: file.name,
        mimeType: file.type
      }
    }
  }
  reader.readAsDataURL(file)
}

function removeFile(type) {
  if (type === 'cover') {
    if (coverFile.value) {
      coverFile.value = null
      const input = document.getElementById('cover-file-input')
      if (input) input.value = ''
    } else {
      form.value.image_url = ''
    }
  } else {
    if (detailFile.value) {
      detailFile.value = null
      const input = document.getElementById('detail-file-input')
      if (input) input.value = ''
    } else {
      form.value.image_detail_url = ''
    }
  }
}

function openCreate() {
  editingActu.value = null
  form.value = { titre: '', description: '', contenu: '', auteur: '', image_url: '', image_detail_url: '' }
  coverFile.value = null
  detailFile.value = null
  coverMode.value = 'file'
  detailMode.value = 'file'
  formError.value = ''
  showModal.value = true
}

function openEdit(actu) {
  editingActu.value = actu
  form.value = {
    titre: actu.titre || '',
    description: actu.description || '',
    contenu: actu.contenu || '',
    auteur: actu.auteur || '',
    image_url: actu.imageUrl === '/images/side-photo.jpeg' ? '' : (actu.imageUrl || ''),
    image_detail_url: actu.imageDetailUrl === '/images/side-photo.jpeg' ? '' : (actu.imageDetailUrl || ''),
    date_evenement: actu.publieLe ? new Date(actu.publieLe).toISOString().slice(0, 16) : ''
  }
  coverFile.value = null
  detailFile.value = null
  coverMode.value = (actu.imageUrl && !actu.imageUrl.startsWith('data:') && !actu.imageUrl.includes('supabase.co') && actu.imageUrl !== '/images/side-photo.jpeg') ? 'url' : 'file'
  detailMode.value = (actu.imageDetailUrl && !actu.imageDetailUrl.startsWith('data:') && !actu.imageDetailUrl.includes('supabase.co') && actu.imageDetailUrl !== '/images/side-photo.jpeg') ? 'url' : 'file'
  formError.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingActu.value = null
}

async function saveActu() {
  formError.value = ''
  if (!form.value.titre.trim()) { formError.value = 'Le titre est obligatoire.'; return }
  if (!form.value.description.trim()) { formError.value = 'La description est obligatoire.'; return }
  if (!form.value.contenu.trim()) { formError.value = 'Le contenu est obligatoire.'; return }

  saving.value = true
  try {
    let finalImageUrl = normalizeImageSource(form.value.image_url) || null
    let finalImageDetailUrl = normalizeImageSource(form.value.image_detail_url) || null

    if (coverMode.value === 'file' && coverFile.value) {
      const uploadRes = await api.post('/api/actualites/upload', {
        file: coverFile.value.base64,
        fileName: coverFile.value.name,
        mimeType: coverFile.value.mimeType
      })
      finalImageUrl = uploadRes.url
    }

    if (detailMode.value === 'file' && detailFile.value) {
      const uploadRes = await api.post('/api/actualites/upload', {
        file: detailFile.value.base64,
        fileName: detailFile.value.name,
        mimeType: detailFile.value.mimeType
      })
      finalImageDetailUrl = uploadRes.url
    }

    const body = {
      titre: form.value.titre.trim(),
      description: form.value.description.trim(),
      contenu: form.value.contenu.trim(),
      auteur: form.value.auteur ? form.value.auteur.trim() : null,
      image_url: finalImageUrl,
      image_detail_url: finalImageDetailUrl,
      date_evenement: form.value.date_evenement || null
    }

    if (editingActu.value) {
      const updated = await api.put(`/api/actualites/${editingActu.value.id}`, body)
      const idx = api.actualites.findIndex(a => a.id === editingActu.value.id)
      if (idx !== -1) {
        api.actualites[idx] = {
          id: updated.id,
          titre: updated.titre,
          description: updated.description,
          contenu: updated.contenu,
          auteur: updated.auteur,
          publieLe: updated.created_at,
          imageUrl: updated.image_url || '/images/side-photo.jpeg',
          imageDetailUrl: updated.image_detail_url || updated.image_url || '/images/side-photo.jpeg'
        }
      }
    } else {
      const created = await api.post('/api/actualites', body)
      api.actualites.unshift({
        id: created.id,
        titre: created.titre,
        description: created.description,
        contenu: created.contenu,
        auteur: created.auteur,
        publieLe: created.created_at,
        imageUrl: created.image_url || '/images/side-photo.jpeg',
        imageDetailUrl: created.image_detail_url || created.image_url || '/images/side-photo.jpeg'
      })
    }
    closeModal()
  } catch (err) {
    formError.value = err.message || 'Erreur lors de l\'enregistrement.'
  } finally {
    saving.value = false
  }
}

function confirmDelete(actu) {
  deletingActu.value = actu
  showDeleteModal.value = true
}

async function doDelete() {
  if (!deletingActu.value) return
  deleting.value = true
  try {
    await api.del(`/api/actualites/${deletingActu.value.id}`)
    api.actualites = api.actualites.filter(a => a.id !== deletingActu.value.id)
    showDeleteModal.value = false
    deletingActu.value = null
  } catch (err) {
    formError.value = err.message
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.manage-actus-shell { display: flex; flex-direction: column; gap: 24px; }

/* Header actions */
.search-row {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
}
.search-wrap {
  position: relative; flex: 1; min-width: 200px;
}
.search-icon {
  position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
  color: var(--brun); opacity: .5; pointer-events: none;
}
.search-input {
  width: 100%; padding: 12px 16px 12px 40px;
  border: 2px solid #e8ddd0; border-radius: 999px;
  font-size: .92rem; background: var(--creme);
  color: var(--noir); outline: none; transition: all .25s;
}
.search-input:focus {
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

/* Loading & Empty */
.actus-loading {
  display: flex; align-items: center; justify-content: center; gap: 14px;
  padding: 60px 20px; color: var(--brun); font-weight: 700;
  font-size: 1rem; opacity: .7;
}
.actus-empty {
  display: flex; flex-direction: column; align-items: center;
  gap: 16px; padding: 60px 20px; text-align: center;
}
.actus-empty-icon {
  width: 80px; height: 80px;
  background: rgba(132,89,54,.08); border: 2px dashed rgba(132,89,54,.2);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  color: rgba(132,89,54,.4);
}
.actus-empty p { color: var(--brun); opacity: .7; font-size: .95rem; margin: 0; }

/* Grid */
.actus-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

/* Card */
.actu-card {
  background: rgba(255,255,255,.92);
  border: 1px solid rgba(132,89,54,.14);
  border-radius: 20px;
  padding: 20px;
  display: flex; flex-direction: column; gap: 14px;
}
.actu-card-header {
  display: flex; gap: 12px; align-items: center;
}
.actu-img-wrap {
  width: 60px; height: 60px; border-radius: 10px; overflow: hidden; flex-shrink: 0;
  border: 1px solid rgba(132,89,54,0.1);
}
.actu-img { width: 100%; height: 100%; object-fit: cover; }
.actu-card-info { flex: 1; min-width: 0; }
.actu-card-title { font-size: 0.95rem; font-weight: 800; color: var(--noir); margin-bottom: 2px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; }
.actu-card-date { font-size: 0.72rem; color: #777; font-weight: 600; }
.actu-card-desc { font-size: 0.82rem; color: #555; line-height: 1.45; margin: 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }

.actu-card-footer {
  display: flex; align-items: center; gap: 8px;
  border-top: 1px solid rgba(132,89,54,.1); padding-top: 12px; margin-top: auto;
}
.actu-btn-edit, .actu-btn-delete {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px; border-radius: 999px;
  font-size: .78rem; font-weight: 700; cursor: pointer;
  transition: all .2s; border: 1.5px solid transparent;
}
.actu-btn-edit {
  background: rgba(132,89,54,.08); color: var(--brun);
  border-color: rgba(132,89,54,.2);
}
.actu-btn-edit:hover { background: var(--brun); color: #fff; }
.actu-btn-delete {
  margin-left: auto;
  background: rgba(177,34,42,.07); color: var(--rouge);
  border-color: rgba(177,34,42,.2);
}
.actu-btn-delete:hover { background: var(--rouge); color: #fff; }

/* Modal and Forms */
.modal-backdrop {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(26,16,8,.55);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
  animation: fadeIn .2s ease;
  backdrop-filter: blur(2px);
}
.modal-box {
  width: 100%; max-width: 640px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  animation: modalIn .3s cubic-bezier(.34,1.56,.64,1);
}
.modal-confirm { max-width: 480px; }
.confirm-text { font-size: .92rem; color: #555; line-height: 1.6; margin: 0 0 24px; }

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

.ev-form-error {
  display: flex; align-items: center; gap: 8px;
  background: #ffeaea; border: 1.5px solid var(--rouge); border-radius: 12px;
  padding: 10px 14px; color: var(--rouge); font-size: .84rem; font-weight: 600;
  margin-top: 12px;
}

@media (max-width: 600px) {
  .actus-grid { grid-template-columns: 1fr; }
  .ev-form-actions { flex-direction: column-reverse; }
  .btn-cancel, .ev-form .bsub { width: 100%; text-align: center; justify-content: center; }
}

/* Image upload system styling */
.image-upload-section {
  border: 1px solid rgba(132, 89, 54, 0.15);
  border-radius: 14px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.5);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.upload-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.mode-tabs {
  display: flex;
  gap: 4px;
  background: #ede3d7;
  padding: 4px;
  border-radius: 8px;
}
.tab-btn {
  padding: 6px 12px;
  border: none;
  background: none;
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--brun);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}
.tab-btn.active {
  background: #fff;
  color: var(--noir);
  box-shadow: 0 2px 6px rgba(0,0,0,0.06);
}
.file-upload-zone {
  border: 2px dashed #dcd0bf;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  position: relative;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--creme);
}
.file-upload-zone:hover {
  border-color: var(--or);
  background: #fff;
}
.file-upload-zone input[type="file"] {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  width: 100%;
  height: 100%;
  z-index: 2;
}
.preview-inside-zone {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255, 255, 255, 0.85);
  padding: 10px;
  border-radius: 10px;
  position: relative;
  z-index: 1;
  pointer-events: none;
  width: 100%;
}
.btn-remove-file-absolute {
  position: relative;
  z-index: 3;
  pointer-events: auto;
  background: none;
  border: none;
  color: var(--rouge);
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}
.btn-remove-file-absolute:hover {
  background-color: rgba(177, 34, 42, 0.08);
}
.upload-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--brun);
  opacity: 0.8;
  font-size: 0.84rem;
}
.preview-container {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
  background: rgba(255, 255, 255, 0.8);
  padding: 10px;
  border-radius: 10px;
  border: 1px solid rgba(132, 89, 54, 0.1);
}
.preview-img-wrap {
  width: 80px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid rgba(132, 89, 54, 0.15);
  flex-shrink: 0;
}
.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.preview-details {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.preview-filename {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--noir);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.preview-actions {
  display: flex;
}
.btn-remove-file {
  background: none;
  border: none;
  color: var(--rouge);
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}
.btn-remove-file:hover {
  background-color: rgba(177, 34, 42, 0.08);
}
.url-error-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--rouge);
  font-size: 0.78rem;
  font-weight: 600;
  margin-top: 6px;
  background: rgba(177, 34, 42, 0.06);
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(177, 34, 42, 0.15);
  width: 100%;
}
.preview-row {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}
.align-start {
  align-items: flex-start;
}
.gap-2 {
  gap: 8px;
}
.flex-col {
  display: flex;
  flex-direction: column;
}
</style>
