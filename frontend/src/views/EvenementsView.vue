<template>
  <div class="ev-shell">
    <!-- En-tête / Hero Section -->
    <section class="page-header-section" v-reveal="0">
      <div class="header-bg">
        <img src="/images/banner_evenements.png" alt="" class="header-bg-img-blur" />
        <img src="/images/banner_evenements.png" alt="Événements Banner" class="header-bg-img-contain" />
        <div class="header-overlay"></div>
      </div>
      <div class="header-content">
        <span class="header-badge">Musée Virtuel de Guinée</span>
        <h1 class="header-title">Événements</h1>
        <p class="header-subtitle">Vivez la culture guinéenne en direct ou en virtuel. Expositions, vernissages et ateliers.</p>
      </div>
    </section>

    <!-- ─── En-tête de recherche ─── -->
    <div class="ev-header form-card" style="margin-bottom: 24px;">
      <div class="fb" style="padding: 16px;">
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
          <button v-if="api.isConnected" class="btn-create" @click="openCreate">
            <AppIcon name="plus" :size="16" /> Créer un événement
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
      <button v-if="api.isConnected" class="btn-create" @click="openCreate">
        <AppIcon name="plus" :size="16" /> Créer un événement
      </button>
    </div>

    <!-- ─── Grille d'événements ─── -->
    <div v-else>
      <div class="ev-grid">
        <div
          v-for="evt in paginatedEvents"
        :key="evt.id"
        class="ev-card"
        @click="goToEvent(evt)"
      >
        <div v-if="evt.image_url" class="ev-card-img-wrap">
          <img :src="getPreviewSrc(evt.image_url)" loading="lazy" alt="Event Cover" />
        </div>
        
        <div class="ev-card-content">
          <div class="ev-card-top">
            <div class="ev-card-title">{{ evt.titre }}</div>
            <div style="display: flex; gap: 6px; flex-wrap: wrap; align-items: center;">
              <span class="ev-badge" :class="formatBadgeClass(evt.format)">{{ formatLabel(evt.format) }}</span>
              <span class="ev-badge" :class="badgeClass(evt.statut)">{{ statutLabel(evt.statut) }}</span>
            </div>
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

        <div v-if="evt.description" class="ev-card-desc markdown-body" v-html="renderMarkdown(evt.description)"></div>

        <div v-if="api.isConnected" class="ev-card-footer">
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
            title="Invitations & Inscriptions"
          >
            <AppIcon name="mail" :size="15" /> Invitations
          </button>
          <button
            class="ev-btn-checkin"
            @click.stop="goToCheckin(evt)"
            title="Émargement / Scan QR"
          >
            <AppIcon name="scan" :size="15" /> Émargement
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

      <!-- Pagination Controls -->
      <div v-if="totalPages > 1" class="pagination-controls mt-4" style="margin-bottom: 20px;">
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
                  <input type="text" v-model="form.titre" required placeholder="Ex : Vernissage MVG" />
                </div>
                <div class="fg">
                  <label>Lieu</label>
                  <input type="text" v-model="form.lieu" placeholder="Ex : Centre culturel franco-guinéen" />
                </div>
              </div>

              <div class="fg">
                <label>Description</label>
                <textarea v-model="form.description" placeholder="Description de l'événement…" rows="3"></textarea>
                <div style="font-size: 0.8rem; color: #6a5040; margin-top: 6px; opacity: 0.8;">
                  <AppIcon name="info" :size="12" style="display: inline-block; vertical-align: middle; margin-right: 4px;" />
                  <strong>Astuce de formatage :</strong> Utilisez <code>**texte**</code> pour mettre en <strong>gras</strong>, ou commencez une ligne par <code>- </code> pour créer une liste à puces.
                </div>
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
                  <label>Format</label>
                  <select v-model="form.format">
                    <option value="presentiel">Présentiel</option>
                    <option value="virtuel">Virtuel</option>
                    <option value="hybride">Hybride</option>
                  </select>
                </div>
              </div>

              <div class="fr">
                <div class="fg">
                  <label>Statut</label>
                  <select v-model="form.statut">
                    <option value="brouillon">Brouillon</option>
                    <option value="a_venir">À venir</option>
                    <option value="publie">Publié</option>
                    <option value="termine">Terminé</option>
                  </select>
                </div>
              </div>

              <!-- Photo de l'événement -->
              <div class="fg">
                <div class="image-upload-section">
                  <div class="upload-label-row">
                    <label>Image de couverture de l'événement</label>
                    <div class="mode-tabs">
                      <button type="button" class="tab-btn" :class="{ active: imageMode === 'file' }" @click="imageMode = 'file'">Téléverser</button>
                      <button type="button" class="tab-btn" :class="{ active: imageMode === 'url' }" @click="imageMode = 'url'">Lien URL</button>
                    </div>
                  </div>
                  
                  <!-- Local file mode -->
                  <div v-show="imageMode === 'file'">
                    <div class="file-upload-zone">
                      <input type="file" id="event-file-input" accept="image/*" @change="onFileChange($event)" />
                      
                      <!-- If no file is selected yet and no image_url exists -->
                      <div v-if="!imageFile && !form.image_url" class="upload-prompt">
                        <AppIcon name="upload" :size="24" />
                        <span>Choisir depuis l’appareil ou la galerie</span>
                      </div>
                      
                      <!-- If there is a file or image_url, show the preview inside the zone -->
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
                  
                  <!-- External URL mode -->
                  <div v-show="imageMode === 'url'">
                    <input type="text" v-model="form.image_url" placeholder="https://exemple.com/image.jpg" @input="isImageLoadError = false" />
                    <div v-if="form.image_url" class="preview-container flex-col align-start gap-2">
                      <div class="preview-row">
                        <div class="preview-img-wrap">
                          <img :src="getPreviewSrc(form.image_url)" class="preview-img" @error="isImageLoadError = true" @load="isImageLoadError = false" />
                        </div>
                        <div class="preview-details">
                          <div class="preview-filename">Aperçu du lien externe</div>
                        </div>
                      </div>
                      <div v-if="isImageLoadError" class="url-error-warning">
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

    <!-- ─── Modal Détail Événement (pour Visiteurs) ─── -->
    <Teleport to="body">
      <div v-if="showDetailModal" class="modal-backdrop" @click.self="closeDetailModal">
        <div class="modal-box form-card">
          <div class="fh fh-a">
            <div class="fh-icon"><AppIcon name="info" :size="22" /></div>
            <div class="fh-title">Détail de l'Événement</div>
          </div>
          <div class="fb">
            <div class="event-detail-popup">
              <div v-if="detailEvt?.image_url" class="ev-detail-img-wrap mb-3">
                <img :src="getPreviewSrc(detailEvt.image_url)" alt="Event Cover" class="ev-detail-img" />
              </div>
              <h2 class="ev-title-large">{{ detailEvt?.titre }}</h2>
              
              <div class="ev-meta-large mt-3">
                <div class="ev-meta-large-item" v-if="detailEvt?.date_debut">
                  <AppIcon name="calendar" :size="16" />
                  <strong>Date :</strong> {{ formatDate(detailEvt.date_debut) }}
                  <span v-if="detailEvt.date_fin"> - {{ formatDate(detailEvt.date_fin) }}</span>
                </div>
                <div class="ev-meta-large-item" v-if="detailEvt?.lieu">
                  <AppIcon name="map-pin" :size="16" />
                  <strong>Lieu :</strong> {{ detailEvt.lieu }}
                </div>
                <div class="ev-meta-large-item" v-if="detailEvt?.format">
                  <AppIcon name="box" :size="16" />
                  <strong>Format :</strong> 
                  <span class="ev-badge inline" :class="formatBadgeClass(detailEvt.format)">
                    {{ formatLabel(detailEvt.format) }}
                  </span>
                </div>
              </div>

              <div class="ev-description-large mt-4">
                <h4>Description de l'événement</h4>
                <div v-if="detailEvt?.description" class="markdown-body" v-html="renderMarkdown(detailEvt.description)"></div>
                <p v-else>Aucune description disponible pour cet événement.</p>
              </div>

              <div class="ev-form-actions mt-4">
                <button class="btn-cancel" @click="closeDetailModal">Fermer</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useApiStore } from '../store/api.js'
import AppIcon from '../components/AppIcon.vue'
import { renderMarkdown } from '../utils/markdown.js'
import { animate, stagger } from 'animejs'

const router = useRouter()
const route = useRoute()
const api = useApiStore()

const search = ref('')
const showModal = ref(false)
const showDeleteModal = ref(false)
const editingEvt = ref(null)
const deletingEvt = ref(null)
const saving = ref(false)
const deleting = ref(false)
const formError = ref('')
const isImageLoadError = ref(false)

const showDetailModal = ref(false)
const detailEvt = ref(null)

function closeDetailModal() {
  showDetailModal.value = false
  detailEvt.value = null
}

const form = ref({
  titre: '',
  description: '',
  date_debut: '',
  date_fin: '',
  lieu: '',
  capacite: '',
  format: 'presentiel',
  statut: 'brouillon',
  image_url: ''
})

const imageFile = ref(null) // { base64: '', name: '', mimeType: '' }
const imageMode = ref('file') // 'file' | 'url'
const imagePlaceholder = '/images/side-photo.jpeg'

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
  imageFile.value = null
  const input = document.getElementById('event-file-input')
  if (input) input.value = ''
  form.value.image_url = ''
}

onMounted(async () => {
  await api.fetchEvenements()
  if (route.query.create === 'true') {
    openCreate()
  }
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

// Pagination
const currentPage = ref(1)
const itemsPerPage = 6

const totalPages = computed(() => Math.ceil(filteredEvents.value.length / itemsPerPage) || 1)

const paginatedEvents = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredEvents.value.slice(start, end)
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

watch(filteredEvents, async (newVal) => {
  if (newVal && newVal.length > 0) {
    await nextTick()
    animate('.ev-card', {
      translateY: [40, 0],
      opacity: [0, 1],
      delay: stagger(100),
      duration: 800,
      easing: 'easeOutCubic'
    })
  }
}, { immediate: true })

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
  if (statut === 'a_venir') return 'badge-purple'
  return 'badge-gray'
}

function statutLabel(statut) {
  if (statut === 'publie') return 'Publié'
  if (statut === 'termine') return 'Terminé'
  if (statut === 'a_venir') return 'À venir'
  return 'Brouillon'
}

function openCreate() {
  editingEvt.value = null
  form.value = { titre: '', description: '', date_debut: '', date_fin: '', lieu: '', capacite: '', format: 'presentiel', statut: 'brouillon', image_url: '' }
  imageFile.value = null
  imageMode.value = 'file'
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
    format: evt.format || 'presentiel',
    statut: evt.statut || 'brouillon',
    image_url: evt.image_url === '/images/side-photo.jpeg' ? '' : (evt.image_url || '')
  }
  imageFile.value = null
  imageMode.value = (evt.image_url && !evt.image_url.startsWith('data:') && !evt.image_url.includes('supabase.co') && evt.image_url !== '/images/side-photo.jpeg') ? 'url' : 'file'
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
    let finalImageUrl = normalizeImageSource(form.value.image_url) || null

    if (imageMode.value === 'file' && imageFile.value) {
      const uploadRes = await api.post('/api/actualites/upload', {
        file: imageFile.value.base64,
        fileName: imageFile.value.name,
        mimeType: imageFile.value.mimeType,
        bucket: 'evenements'
      })
      finalImageUrl = uploadRes.url
    }

    const body = { 
      ...form.value,
      image_url: finalImageUrl
    }
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
  if (api.isConnected) {
    router.push({ name: 'Invitations', params: { eventId: evt.id } })
  } else {
    detailEvt.value = evt
    showDetailModal.value = true
  }
}

function goToInvitations(evt) {
  router.push({ name: 'Invitations', params: { eventId: evt.id } })
}

function goToCheckin(evt) {
  router.push({ name: 'Checkin', params: { eventId: evt.id } })
}

function formatBadgeClass(format) {
  if (format === 'virtuel') return 'badge-blue'
  if (format === 'hybride') return 'badge-purple'
  return 'badge-green'
}

function formatLabel(format) {
  if (format === 'virtuel') return 'Virtuel'
  if (format === 'hybride') return 'Hybride'
  return 'Présentiel'
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
  cursor: pointer;
  transition: all .28s cubic-bezier(.4,0,.2,1);
  box-shadow: 0 4px 16px rgba(89,55,22,.06);
  display: flex; flex-direction: column;
  animation: fadeInUp .5s ease-out backwards;
  overflow: hidden;
}
.ev-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 40px rgba(89,55,22,.14);
  border-color: rgba(132,89,54,.28);
}
.ev-card-img-wrap {
  width: 100%;
  height: 180px;
  overflow: hidden;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(132,89,54,.1);
}
.ev-card-img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}
.ev-card:hover .ev-card-img-wrap img {
  transform: scale(1.05);
}
.ev-card-content {
  padding: 22px 22px 16px;
  display: flex; flex-direction: column; gap: 12px;
  flex: 1;
}
.ev-card-top {
  display: flex; align-items: flex-start;
  justify-content: space-between; gap: 10px;
  flex-wrap: wrap;
}
.ev-card-title {
  font-size: 1.08rem; font-weight: 800; color: var(--noir);
  line-height: 1.3; flex: 1 1 220px; min-width: 0;
  overflow-wrap: anywhere;
}
.ev-badge {
  padding: 4px 12px; border-radius: 999px;
  font-size: .7rem; font-weight: 700; letter-spacing: .8px;
  text-transform: uppercase; white-space: nowrap; flex-shrink: 0;
}
.badge-gray  { background: #f0ece8; color: #7a6050; border: 1px solid rgba(122,96,80,.2); }
.badge-green { background: #e8f5e9; color: #2e7d32; border: 1px solid rgba(46,125,50,.2); }
.badge-blue  { background: #e3f2fd; color: #1565c0; border: 1px solid rgba(21,101,192,.2); }
.badge-purple { background: #f3e5f5; color: #7b1fa2; border: 1px solid rgba(123,31,162,.2); }

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
  flex-wrap: wrap;
}
.ev-btn-edit, .ev-btn-invite, .ev-btn-checkin, .ev-btn-delete {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 7px 14px; border-radius: 999px;
  font-size: .78rem; font-weight: 700; cursor: pointer;
  transition: all .2s; border: 1.5px solid transparent;
  flex: 1 1 110px;
  min-width: 110px;
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
.ev-btn-checkin {
  background: rgba(46,125,50,.1); color: #2e7d32;
  border-color: rgba(46,125,50,.3);
}
.ev-btn-checkin:hover { background: #2e7d32; color: #fff; }
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
  .ev-card-footer { flex-direction: column; }
  .ev-btn-edit, .ev-btn-invite, .ev-btn-checkin, .ev-btn-delete { width: 100%; min-width: 0; flex: none; }
  .ev-btn-delete { margin-left: 0; }
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
  margin-bottom: 15px;
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
  .upload-prompt span {
    font-size: 0.85rem;
  }
}

/* Page Header Banner */
.page-header-section {
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  min-height: 420px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  box-shadow: 0 15px 35px rgba(89,55,22,0.15);
  margin-bottom: 24px;
  padding: 40px 60px;
}
.header-bg {
  position: absolute; inset: 0; z-index: 1;
}
.header-bg-img-blur {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(30px);
  transform: scale(1.1);
  opacity: 0.9;
}
.header-bg-img-contain {
  position: relative;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: right center;
  z-index: 1;
}
.header-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(90deg, rgba(26,16,8,0.8) 0%, rgba(26,16,8,0.4) 40%, rgba(89,55,22,0.1) 100%);
  backdrop-filter: blur(1px);
}
.header-content {
  position: relative; z-index: 2;
  text-align: left; color: #fff;
  max-width: 500px;
}
.header-badge {
  display: inline-block;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.3);
  padding: 6px 16px; border-radius: 999px;
  font-size: 0.72rem; font-weight: 700; letter-spacing: 2px;
  text-transform: uppercase; margin-bottom: 12px;
}
.header-title {
  font-size: 2.8rem; font-weight: 900; line-height: 1.15;
  margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1.5px;
}
.header-subtitle {
  font-size: 1.05rem; line-height: 1.5; opacity: 0.95;
  margin: 0; max-width: 580px; font-family: Arial, sans-serif;
}

@media (max-width: 600px) {
  .page-header-section {
    padding: 30px 20px;
    min-height: 200px;
  }
  .header-title {
    font-size: 1.8rem;
  }
  .header-subtitle {
    font-size: 0.9rem;
  }
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
.ev-detail-img-wrap {
  width: 100%;
  height: 220px;
  border-radius: 16px;
  overflow: hidden;
  border: 1.5px solid rgba(132, 89, 54, 0.15);
}
.ev-detail-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.mb-3 {
  margin-bottom: 16px;
}

/* Modal Détails Visiteurs */
.event-detail-popup h2.ev-title-large {
  margin: 0;
  font-size: 1.5rem;
  color: var(--brun);
  font-weight: 800;
  line-height: 1.35;
}
.ev-meta-large {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgba(132, 89, 54, 0.05);
  padding: 16px;
  border-radius: 16px;
  border: 1.5px solid rgba(132, 89, 54, 0.12);
}
.ev-meta-large-item {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.95rem;
  color: var(--noir);
}
.ev-meta-large-item strong {
  color: var(--brun);
}
.ev-description-large h4 {
  font-size: 1.05rem; font-weight: 800; color: var(--brun); margin-bottom: 10px;
}
.ev-description-large p {
  font-size: 0.95rem; color: #444; line-height: 1.6; margin: 0; white-space: pre-wrap;
}

/* Styles Markdown (réutilisés) */
.markdown-body :deep(p) { margin-bottom: 0.8em; }
.markdown-body :deep(strong) { font-weight: 800; color: var(--brun); }
.markdown-body :deep(ul) { padding-left: 20px; margin-bottom: 0.8em; list-style-type: disc; }
.markdown-body :deep(ol) { padding-left: 20px; margin-bottom: 0.8em; list-style-type: decimal; }
.markdown-body :deep(li) { margin-bottom: 0.3em; }
.markdown-body :deep(h1), .markdown-body :deep(h2), .markdown-body :deep(h3) { color: var(--brun); margin-top: 1em; margin-bottom: 0.5em; }
.markdown-body :deep(blockquote) { border-left: 4px solid var(--or); padding-left: 12px; color: #555; font-style: italic; background: rgba(249, 178, 51, 0.05); margin: 0.8em 0; padding: 8px 12px; border-radius: 0 6px 6px 0; }
.markdown-body :deep(a) { color: var(--rouge); text-decoration: underline; font-weight: 600; }
.mt-3 { margin-top: 14px; }
.mt-4 { margin-top: 20px; }
.ev-badge.inline {
  display: inline-block;
  vertical-align: middle;
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
</style>
