<template>
  <div class="manage-actus-shell">
    <!-- Header -->
    <div class="manage-actus-header form-card">
      <div class="fh fh-a">
        <div class="fh-icon"><AppIcon name="image" :size="24" /></div>
        <div class="fh-title">Hero Slides (Carrousel Accueil)</div>
        <div class="fh-sub">Gérez les images et vidéos qui défilent sur la page d'accueil principale.</div>
      </div>
      <div class="header-actions fb">
        <button class="btn-create" @click="openCreate">
          <AppIcon name="plus" :size="16" /> Ajouter un slide
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="actus-loading">
      <AppIcon name="loader" :size="32" class="spin" />
      <span>Chargement des slides…</span>
    </div>

    <!-- Empty -->
    <div v-else-if="slides.length === 0" class="actus-empty">
      <div class="actus-empty-icon"><AppIcon name="image" :size="40" /></div>
      <p>Aucun slide pour le moment.</p>
      <button class="btn-create" @click="openCreate">
        <AppIcon name="plus" :size="16" /> Ajouter le premier slide
      </button>
    </div>

    <!-- Grid -->
    <div v-else>
      <div class="actus-grid">
        <div
          v-for="slide in slides"
          :key="slide.id"
          class="actu-card form-card"
          :class="{'opacity-50': !slide.actif}"
        >
          <div class="actu-card-header">
            <div class="actu-img-wrap" style="height: 140px; background: rgba(0,0,0,0.8); position: relative;">
              <div v-if="!slide.actif" style="position:absolute; top:5px; right:5px; background:var(--rouge); color:white; font-size:10px; padding:2px 6px; border-radius:4px; z-index:10; font-weight:bold;">INACTIF</div>
              <div style="position:absolute; top:5px; left:5px; background:rgba(0,0,0,0.6); color:white; font-size:10px; padding:2px 6px; border-radius:4px; z-index:10; font-weight:bold;">ORDRE: {{ slide.ordre }}</div>
              
              <img v-if="slide.media_type === 'image'" :src="slide.media_url" class="actu-img" style="object-fit: cover; width: 100%; height: 100%;" />
              <video v-else-if="slide.media_type === 'video'" :src="slide.media_url" muted loop autoplay playsinline style="object-fit: cover; width: 100%; height: 100%;"></video>
            </div>
            <div class="actu-card-info">
              <div class="actu-card-title" style="font-size: 12px; margin-bottom: 4px; color: var(--or);">{{ slide.titre_secondaire }}</div>
              <div style="font-weight: 700; color: var(--brun-fonce); font-size: 15px; margin-bottom: 4px; line-height: 1.2;">{{ slide.titre_principal }}</div>
            </div>
          </div>
          
          <div class="actu-card-body" v-if="slide.sous_titre">
            <p class="actu-card-desc" style="-webkit-line-clamp: 2;">{{ slide.sous_titre }}</p>
          </div>

          <div class="actu-card-footer">
            <button class="actu-btn-edit" @click="toggleActive(slide)" :title="slide.actif ? 'Désactiver' : 'Activer'" style="color:var(--brun-fonce)">
              <AppIcon :name="slide.actif ? 'eye-off' : 'eye'" :size="15" /> {{ slide.actif ? 'Masquer' : 'Afficher' }}
            </button>
            <button class="actu-btn-edit" @click="openEdit(slide)" title="Modifier">
              <AppIcon name="edit" :size="15" /> Éditer
            </button>
            <button class="actu-btn-delete" @click="confirmDelete(slide)" title="Supprimer">
              <AppIcon name="trash" :size="15" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <Teleport to="body">
      <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
        <div class="modal-box form-card" style="max-width: 600px;">
          <div class="fh fh-a">
            <div class="fh-icon"><AppIcon :name="editingItem ? 'edit' : 'plus'" :size="22" /></div>
            <div class="fh-title">{{ editingItem ? 'Modifier le slide' : 'Ajouter un slide' }}</div>
          </div>
          <div class="fb">
            <form @submit.prevent="saveItem" class="ev-form">
              
              <div class="fg-row">
                 <div class="fg" style="flex: 1;">
                  <label>Type de Média <span class="req">*</span></label>
                  <select v-model="form.media_type" required>
                    <option value="image">Image (.jpg, .png)</option>
                    <option value="video">Vidéo (.mp4, sans son)</option>
                  </select>
                </div>
                <div class="fg" style="flex: 1;">
                  <label>Ordre d'affichage <span class="req">*</span></label>
                  <input type="number" v-model.number="form.ordre" required placeholder="0, 1, 2..." />
                  <div class="help-text">Plus le nombre est petit, plus il apparaît en premier.</div>
                </div>
              </div>

              <div class="fg">
                <div class="image-upload-section">
                  <div class="upload-label-row">
                    <label>Fichier Média <span class="req">*</span></label>
                  </div>
                  
                  <div class="file-upload-zone">
                    <input type="file" id="media-file-input" :accept="form.media_type === 'image' ? 'image/*' : 'video/mp4,video/webm'" @change="onFileChange" />
                    
                    <div v-if="!mediaFile && !form.media_url" class="upload-prompt">
                      <AppIcon name="upload" :size="24" />
                      <span>Choisir {{ form.media_type === 'image' ? 'une image' : 'une vidéo' }} depuis l’appareil</span>
                    </div>
                    
                    <div v-else class="preview-inside-zone">
                      <div class="preview-image-wrap" v-if="form.media_type === 'image'">
                        <img v-if="mediaPreview" :src="mediaPreview" class="preview-img" />
                        <img v-else-if="form.media_url" :src="form.media_url" class="preview-img" />
                      </div>
                      <div class="preview-image-wrap" v-else-if="form.media_type === 'video'">
                        <video v-if="mediaPreview" :src="mediaPreview" class="preview-img" muted loop playsinline autoplay></video>
                        <video v-else-if="form.media_url" :src="form.media_url" class="preview-img" muted loop playsinline autoplay></video>
                      </div>
                      <button type="button" class="btn-change-image" @click="triggerFileInput">
                        <AppIcon name="camera" :size="14" /> Changer le média
                      </button>
                    </div>
                  </div>
                  <div v-if="form.media_type === 'video'" class="help-text" style="color:var(--rouge); margin-top:5px; font-weight:600;">⚠️ Astuce : Privilégiez des vidéos de moins de 50 Mo pour garantir un chargement fluide pour vos visiteurs.</div>
                </div>
              </div>

              <div class="fg">
                <label>Titre Secondaire (Sur-titre)</label>
                <input type="text" v-model="form.titre_secondaire" placeholder="Ex: C'EST NOUVEAU" />
              </div>

              <div class="fg">
                <label>Titre Principal (Grand)</label>
                <input type="text" v-model="form.titre_principal" placeholder="Ex: Inauguration du Musée" />
              </div>

              <div class="fg">
                <label>Sous-titre (Description optionnelle)</label>
                <textarea v-model="form.sous_titre" placeholder="Petit texte sous le titre principal..." rows="2"></textarea>
              </div>

              <div class="fg" style="display:flex; align-items:center; gap:10px;">
                <input type="checkbox" id="actifCheck" v-model="form.actif" style="width:18px; height:18px; cursor:pointer;" />
                <label for="actifCheck" style="margin:0; cursor:pointer;">Slide Actif (visible sur l'accueil)</label>
              </div>

              <div v-if="formError" class="ev-form-error" style="color:var(--rouge); background:#ffeaea; padding:10px; border-radius:8px; margin-bottom:10px; font-weight:600;">
                <AppIcon name="alert-triangle" :size="15" /> {{ formError }}
              </div>
              <div v-if="formSuccess" class="ev-form-success" style="color:var(--brun); background:#edf7ee; padding:10px; border-radius:8px; margin-bottom:10px; font-weight:600;">
                <AppIcon name="check" :size="15" /> {{ formSuccess }}
              </div>

              <div class="form-actions mt-4">
                <button type="button" class="btn-cancel" @click="closeModal" :disabled="saving">Annuler</button>
                <button type="submit" class="btn-save" :disabled="saving">
                  <AppIcon v-if="saving" name="loader" :size="16" class="spin" />
                  <AppIcon v-else name="save" :size="16" />
                  {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirmation Modal -->
    <Teleport to="body">
      <div v-if="deletingItem" class="modal-backdrop" style="z-index: 10002;">
        <div class="modal-box form-card delete-modal">
          <div class="fh fh-delete">
            <AppIcon name="alert-triangle" :size="24" />
            <div class="fh-title">Supprimer le slide ?</div>
          </div>
          <div class="fb">
            <p>Êtes-vous sûr de vouloir supprimer le slide "<strong>{{ deletingItem.titre_principal || 'Sans titre' }}</strong>" ? Cette action est irréversible.</p>
            <div class="form-actions mt-4">
              <button class="btn-cancel" @click="deletingItem = null" :disabled="saving">Annuler</button>
              <button class="btn-delete-confirm" @click="executeDelete" :disabled="saving">
                <AppIcon v-if="saving" name="loader" :size="16" class="spin" />
                <AppIcon v-else name="trash" :size="16" />
                {{ saving ? 'Suppression...' : 'Oui, supprimer' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useApiStore } from '../store/api'
import AppIcon from '../components/AppIcon.vue'

const api = useApiStore()

const slides = ref([])
const loading = ref(true)

const showModal = ref(false)
const editingItem = ref(null)
const deletingItem = ref(null)
const saving = ref(false)

const mediaFile = ref(null)
const mediaPreview = ref('')
const formError = ref('')
const formSuccess = ref('')

const defaultForm = {
  titre_principal: '',
  titre_secondaire: '',
  sous_titre: '',
  media_url: '',
  media_type: 'image',
  ordre: 0,
  actif: true
}
const form = ref({ ...defaultForm })

onMounted(() => {
  fetchSlides()
})

async function fetchSlides() {
  loading.value = true
  try {
    const data = await api.get('/api/hero-slides/admin/all')
    slides.value = data || []
  } catch (err) {
    console.error('Erreur chargement hero slides:', err)
    formError.value = 'Impossible de charger les slides.'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingItem.value = null
  form.value = { ...defaultForm, ordre: slides.value.length }
  mediaFile.value = null
  mediaPreview.value = ''
  formError.value = ''
  formSuccess.value = ''
  showModal.value = true
}

function openEdit(item) {
  editingItem.value = item
  form.value = { ...item }
  mediaFile.value = null
  mediaPreview.value = ''
  formError.value = ''
  formSuccess.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingItem.value = null
  mediaFile.value = null
  mediaPreview.value = ''
}

function confirmDelete(item) {
  deletingItem.value = item
}

async function executeDelete() {
  if (!deletingItem.value) return
  saving.value = true
  try {
    await api.del(`/api/hero-slides/${deletingItem.value.id}`)
    alert('Slide supprimé !')
    deletingItem.value = null
    fetchSlides()
    api.fetchHeroSlides() // Update public store
  } catch (err) {
    alert(err.message || 'Erreur lors de la suppression')
  } finally {
    saving.value = false
  }
}

async function toggleActive(item) {
  try {
    await api.put(`/api/hero-slides/${item.id}`, { actif: !item.actif })
    fetchSlides()
    api.fetchHeroSlides()
  } catch (err) {
    alert('Erreur lors du changement de statut')
  }
}

function triggerFileInput() {
  document.getElementById('media-file-input')?.click()
}

function onFileChange(e) {
  const file = e.target.files[0]
  if (!file) return

  // Verify size for video if needed, here we just warn
  if (file.type.startsWith('video/') && form.value.media_type !== 'video') {
    form.value.media_type = 'video'
  } else if (file.type.startsWith('image/') && form.value.media_type !== 'image') {
    form.value.media_type = 'image'
  }

  mediaFile.value = file
  
  // Preview
  if (mediaPreview.value) {
    URL.revokeObjectURL(mediaPreview.value)
  }
  mediaPreview.value = URL.createObjectURL(file)
}

async function uploadMediaFile() {
  if (!mediaFile.value) return form.value.media_url

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(mediaFile.value)
    reader.onload = async () => {
      try {
        const payload = {
          file: reader.result,
          fileName: mediaFile.value.name,
          mimeType: mediaFile.value.type
        }
        const res = await api.post('/api/hero-slides/upload', payload)
        resolve(res.url)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = (error) => reject(error)
  })
}

async function saveItem() {
  saving.value = true
  formError.value = ''
  formSuccess.value = ''
  try {
    let finalUrl = form.value.media_url
    if (mediaFile.value) {
      finalUrl = await uploadMediaFile()
    }

    if (!finalUrl) {
      throw new Error("Un média est requis pour le slide.")
    }

    const payload = { ...form.value, media_url: finalUrl }

    if (editingItem.value) {
      await api.put(`/api/hero-slides/${editingItem.value.id}`, payload)
    } else {
      await api.post('/api/hero-slides', payload)
    }

    closeModal()
    fetchSlides()
    api.fetchHeroSlides() // Update public store
  } catch (err) {
    console.error('Save error:', err)
    formError.value = err.message || 'Erreur lors de la sauvegarde'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
/* Reuse styles from ManageActualites/RevuePresse where possible */
.manage-actus-shell { max-width: 1200px; margin: 0 auto; padding-bottom: 60px; }
.manage-actus-header { display: flex; justify-content: space-between; align-items: center; padding: 24px; margin-bottom: 24px; }
.fh-icon { width: 48px; height: 48px; background: rgba(132, 89, 54, 0.1); color: var(--brun); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
.fh-title { font-family: 'Playfair Display', serif; font-size: 1.6rem; font-weight: 700; color: var(--brun-fonce); margin-bottom: 4px; }
.fh-sub { font-size: 0.95rem; color: #666; }
.header-actions { display: flex; gap: 16px; align-items: center; }
.btn-create { display: flex; align-items: center; gap: 8px; background: var(--brun); color: #fff; padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 0.95rem; border: none; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
.btn-create:hover { background: var(--or); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(249,178,51,0.2); }

.actus-loading, .actus-empty { text-align: center; padding: 60px 20px; color: #666; display: flex; flex-direction: column; align-items: center; gap: 16px; background: var(--blanc); border-radius: var(--radius); border: 1px solid #eee; }
.actus-empty-icon { color: rgba(132, 89, 54, 0.2); }

.actus-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px; }
.actu-card { display: flex; flex-direction: column; overflow: hidden; padding: 0; }
.actu-card-header { position: relative; }
.actu-card-info { padding: 16px 20px 8px; }
.actu-card-body { padding: 0 20px 16px; flex: 1; }
.actu-card-desc { font-size: 0.85rem; color: #666; line-height: 1.5; margin: 0; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.actu-card-footer { display: flex; border-top: 1px solid rgba(132, 89, 54, 0.1); background: #faf8f5; }
.actu-btn-edit, .actu-btn-delete { flex: 1; padding: 12px; border: none; background: transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; font-weight: 600; font-size: 0.85rem; transition: background 0.2s; }
.actu-btn-edit { color: var(--brun); }
.actu-btn-edit:hover { background: rgba(132, 89, 54, 0.05); }
.actu-btn-delete { color: var(--rouge); border-left: 1px solid rgba(132, 89, 54, 0.1); }
.actu-btn-delete:hover { background: rgba(211, 47, 47, 0.05); }

/* Form Styles */
.ev-form { display: flex; flex-direction: column; gap: 20px; }
.fg { display: flex; flex-direction: column; gap: 6px; }
.fg-row { display: flex; gap: 16px; }
.ev-form label { font-size: 0.85rem; font-weight: 700; color: var(--brun-fonce); text-transform: uppercase; letter-spacing: 0.5px; }
.req { color: var(--rouge); }
.ev-form input, .ev-form select, .ev-form textarea { padding: 12px 16px; border: 2px solid #eee; border-radius: 8px; font-family: inherit; font-size: 0.95rem; transition: border-color 0.2s; background: #faf8f5; }
.ev-form input:focus, .ev-form select:focus, .ev-form textarea:focus { outline: none; border-color: var(--or); background: #fff; }

.image-upload-section { background: rgba(132,89,54,0.03); border: 1px dashed rgba(132,89,54,0.2); border-radius: 12px; padding: 20px; }
.upload-label-row { margin-bottom: 16px; }
.file-upload-zone { position: relative; }
.file-upload-zone input[type="file"] { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; z-index: 2; }
.upload-prompt { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 30px; background: white; border-radius: 8px; color: var(--brun); border: 1px dashed rgba(132,89,54,0.3); transition: all 0.2s; }
.file-upload-zone:hover .upload-prompt { background: rgba(132,89,54,0.02); border-color: var(--or); }
.preview-inside-zone { position: relative; z-index: 3; background: #000; border-radius: 8px; overflow: hidden; display: flex; justify-content: center; align-items: center; min-height: 150px; }
.preview-image-wrap { width: 100%; display: flex; justify-content: center; }
.preview-img { max-width: 100%; max-height: 250px; object-fit: contain; }
.btn-change-image { position: absolute; bottom: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 0.8rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; z-index: 4; backdrop-filter: blur(4px); }
.btn-change-image:hover { background: rgba(0,0,0,0.9); }
.help-text { font-size: 0.75rem; color: #666; margin-top: 4px; }

.form-actions { display: flex; gap: 12px; justify-content: flex-end; padding-top: 16px; border-top: 1px solid #eee; }
.btn-save, .btn-cancel, .btn-delete-confirm { padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 0.95rem; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.2s; border: none; }
.btn-cancel { background: #f0f0f0; color: #555; }
.btn-cancel:hover { background: #e4e4e4; }
.btn-save { background: var(--brun); color: #fff; }
.btn-save:hover { background: var(--or); }
.btn-delete-confirm { background: var(--rouge); color: #fff; }
.btn-delete-confirm:hover { background: #b71c1c; }
.btn-save:disabled, .btn-delete-confirm:disabled { opacity: 0.7; cursor: not-allowed; }

/* Modal Styles */
.modal-backdrop { position: fixed; inset: 0; background: rgba(29, 25, 22, 0.8); backdrop-filter: blur(4px); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px; }
.modal-box { width: 100%; max-width: 700px; max-height: 90vh; overflow-y: auto; }
.fh-delete { display: flex; flex-direction: column; align-items: center; gap: 12px; color: var(--rouge); margin-bottom: 20px; }
.delete-modal { max-width: 400px; text-align: center; }

@media (max-width: 768px) {
  .manage-actus-header { flex-direction: column; align-items: flex-start; gap: 16px; }
  .header-actions { width: 100%; }
  .fg-row { flex-direction: column; }
}
</style>
