<template>
  <div class="ck-shell">

    <!-- ─── En-tête ─── -->
    <div class="form-card">
      <div class="fh fh-v">
        <div class="fh-icon"><AppIcon name="scan" :size="24" /></div>
        <div>
          <div class="fh-title">Check-in QR Code</div>
          <div class="fh-sub" v-if="evenement">{{ evenement.titre }}</div>
          <div class="fh-sub" v-else>Contrôle d'accès — MVG event's</div>
        </div>
      </div>
      <!-- Live counter -->
      <div class="ck-counter fb" v-if="!loading">
        <div class="ck-counter-item">
          <AppIcon name="users" :size="20" class="ck-counter-icon blue" />
          <div>
            <div class="ck-counter-num">{{ checkinLog.length }}</div>
            <div class="ck-counter-label">Check-ins aujourd'hui</div>
          </div>
        </div>
        <div class="ck-counter-item">
          <AppIcon name="check-circle" :size="20" class="ck-counter-icon green" />
          <div>
            <div class="ck-counter-num">{{ totalInscrits }}</div>
            <div class="ck-counter-label">Total inscrits</div>
          </div>
        </div>
        <div class="ck-progress-wrap">
          <div class="ck-progress-bar">
            <div class="ck-progress-fill" :style="`width:${progressPct}%`"></div>
          </div>
          <div class="ck-progress-label">{{ progressPct }}% présents</div>
        </div>
      </div>
    </div>

    <div class="ck-content">

      <div style="display: flex; flex-direction: column; gap: 20px;">
        <!-- ─── Zone de scan ─── -->
        <div class="ck-scanner-card form-card">
          <div class="fb">
            <div class="ck-scan-area">
              <video ref="videoEl" class="ck-video" autoplay muted playsinline></video>
              <canvas ref="canvasEl" class="ck-canvas" style="display:none"></canvas>
              <div class="ck-scan-overlay">
                <div class="ck-scan-frame">
                  <div class="corner tl"></div>
                  <div class="corner tr"></div>
                  <div class="corner bl"></div>
                  <div class="corner br"></div>
                  <div class="scan-line"></div>
                </div>
                <div class="ck-scan-hint" v-if="scanning">Cadrez le code QR d'invitation</div>
                <div class="ck-scan-hint paused" v-else>Traitement en cours...</div>
              </div>
            </div>

            <!-- Contrôles caméra -->
            <div class="ck-cam-controls">
              <button v-if="!cameraActive" class="btn-start-cam" @click="startCamera">
                <AppIcon name="camera" :size="18" /> Activer la caméra
              </button>
              <button v-else class="btn-stop-cam" @click="stopCamera">
                <AppIcon name="x" :size="18" /> Arrêter la caméra
              </button>
              <button v-if="cameraActive" class="btn-flip-cam" @click="flipCamera">
                <AppIcon name="refresh-cw" :size="16" /> Changer de caméra
              </button>
            </div>

            <!-- Résultat du scan -->
            <Transition name="result">
              <div v-if="scanResult" class="ck-result" :class="scanResult.type">
                <div class="ck-result-icon">
                  <AppIcon :name="scanResult.type === 'success' ? 'check-circle' : 'alert-triangle'" :size="32" />
                </div>
                <div class="ck-result-body">
                  <div class="ck-result-name">{{ scanResult.name }}</div>
                  <div class="ck-result-msg">{{ scanResult.message }}</div>
                </div>
              </div>
            </Transition>
          </div>
        </div>

        <!-- ─── Statistiques des profils émargés ─── -->
        <div class="form-card profile-stats-card" v-if="!loading && checkinLog.length > 0" style="box-shadow: 0 10px 30px rgba(132,89,54,0.06); border: 1.5px solid rgba(132,89,54,0.1);">
          <div class="fh fh-a" style="padding: 16px 24px; border-bottom: 1px solid rgba(132,89,54,0.08);">
            <div class="fh-icon" style="color: #fff;"><AppIcon name="bar-chart" :size="18" /></div>
            <div>
              <div class="fh-title" style="font-size: 1rem; color: #fff;">Répartition des présents</div>
              <div class="fh-sub" style="font-size: 0.76rem; color: rgba(255,255,255,0.85);">Top organisations et fonctions des présents</div>
            </div>
          </div>
          <div class="fb" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 18px 24px;">
            <!-- Col 1: Organisations -->
            <div>
              <h4 style="margin: 0 0 12px; font-size: 0.8rem; text-transform: uppercase; color: var(--brun); letter-spacing: 0.5px; border-left: 3px solid var(--brun); padding-left: 8px;">Organisations</h4>
              <div v-if="profileStats.topOrgs.length" style="display: flex; flex-direction: column; gap: 8px;">
                <div v-for="org in profileStats.topOrgs" :key="org.name" style="font-size: 0.82rem;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 2px; font-weight: 600;">
                    <span style="color: var(--noir); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 80%;">{{ org.name }}</span>
                    <span style="color: var(--rouge);">{{ org.count }}</span>
                  </div>
                  <div style="height: 5px; background: rgba(132,89,54,0.08); border-radius: 3px; overflow: hidden;">
                    <div style="height: 100%; background: var(--brun); border-radius: 3px;" :style="`width: ${Math.round((org.count / checkinLog.length) * 100)}%`"></div>
                  </div>
                </div>
              </div>
              <p v-else style="font-size: 0.8rem; color: #888; font-style: italic;">Aucune donnée</p>
            </div>
            <!-- Col 2: Fonctions -->
            <div>
              <h4 style="margin: 0 0 12px; font-size: 0.8rem; text-transform: uppercase; color: var(--brun); letter-spacing: 0.5px; border-left: 3px solid var(--or); padding-left: 8px;">Fonctions / Postes</h4>
              <div v-if="profileStats.topJobs.length" style="display: flex; flex-direction: column; gap: 8px;">
                <div v-for="job in profileStats.topJobs" :key="job.name" style="font-size: 0.82rem;">
                  <div style="display: flex; justify-content: space-between; margin-bottom: 2px; font-weight: 600;">
                    <span style="color: var(--noir); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 80%;">{{ job.name }}</span>
                    <span style="color: var(--rouge);">{{ job.count }}</span>
                  </div>
                  <div style="height: 5px; background: rgba(132,89,54,0.08); border-radius: 3px; overflow: hidden;">
                    <div style="height: 100%; background: var(--or); border-radius: 3px;" :style="`width: ${Math.round((job.count / checkinLog.length) * 100)}%`"></div>
                  </div>
                </div>
              </div>
              <p v-else style="font-size: 0.8rem; color: #888; font-style: italic;">Aucune donnée</p>
            </div>
          </div>
        </div>
      </div>

      <!-- ─── Saisie manuelle ─── -->
      <div class="ck-manual-card form-card">
        <div class="fh fh-a" style="padding:20px 28px;">
          <div class="fh-icon"><AppIcon name="edit" :size="20" /></div>
          <div class="fh-title" style="font-size:1.1rem;">Saisie manuelle</div>
        </div>
        <div class="fb">
          <p class="ck-manual-desc">Entrez le token QR ou recherchez l'invité par nom.</p>
          <div class="ck-manual-row" style="position: relative;">
            <div class="ck-manual-input-wrap" style="width: 100%;">
              <AppIcon name="search" :size="16" class="ck-manual-icon" />
              <input
                type="text"
                v-model="manualInput"
                placeholder="Rechercher par nom ou token QR…"
                class="ck-manual-input"
                @keyup.enter="doManualCheckin"
              />
            </div>
            <button class="btn-manual" @click="doManualCheckin" :disabled="!manualInput.trim() || processing">
              <AppIcon :name="processing ? 'loader' : 'check'" :size="16" />
              {{ processing ? 'Vérification…' : 'Valider' }}
            </button>

            <!-- Liste d'autocomplétion / suggestions -->
            <div v-if="suggestions.length > 0" class="manual-autocomplete-dropdown">
              <button
                v-for="s in suggestions"
                :key="s.id"
                type="button"
                class="autocomplete-item"
                @click="handleSelectSuggestion(s)"
                :disabled="s.statut === 'present'"
              >
                <div class="autocomplete-info">
                  <span class="autocomplete-name">{{ s.invites?.prenom }} {{ s.invites?.nom }}</span>
                  <span class="autocomplete-meta">
                    {{ s.invites?.organisation || 'Sans organisation' }}
                    <span v-if="s.invites?.titre_poste">· {{ s.invites?.titre_poste }}</span>
                  </span>
                </div>
                <div class="autocomplete-badge" :class="s.statut">
                  {{ s.statut === 'present' ? 'Déjà présent' : 'Émarger' }}
                </div>
              </button>
            </div>
          </div>
          <div v-if="manualError" class="ck-manual-error" style="display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <AppIcon name="alert-triangle" :size="15" /> <span>{{ manualError }}</span>
            </div>
            
            <!-- Liste des correspondances multiples -->
            <div v-if="manualMatches.length > 0" class="manual-matches-list" style="margin-top: 8px; display: flex; flex-direction: column; gap: 8px; width: 100%;">
              <button
                v-for="m in manualMatches"
                :key="m.id"
                type="button"
                class="btn-match-select"
                @click="selectMatch(m)"
                style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: rgba(255,255,255,0.9); border: 1.5px solid rgba(132,89,54,0.18); border-radius: 10px; cursor: pointer; text-align: left; transition: all 0.2s;"
              >
                <div>
                  <div style="font-weight: 700; color: var(--noir);">{{ m.prenom }} {{ m.nom }}</div>
                  <div style="font-size: 0.76rem; color: #666; margin-top: 2px;">
                    {{ m.organisation }} <span v-if="m.organisation && m.titre_poste">·</span> {{ m.titre_poste }}
                  </div>
                </div>
                <div style="font-size: 0.78rem; font-weight: 700; color: var(--rouge); background: rgba(177,34,42,0.06); padding: 4px 10px; border-radius: 999px;">
                  Sélectionner
                </div>
              </button>
            </div>
          </div>
          <div class="ck-manual-row" style="margin-top: 14px; display: flex; justify-content: flex-end;">
            <button type="button" class="btn-import" @click="showRegisterModal = true" style="font-size: 0.85rem; font-weight: 700; border-radius: 999px;">
              <AppIcon name="user-plus" :size="15" /> Enregistrer sur place
            </button>
          </div>
        </div>
      </div>

    </div>

    <!-- ─── Modal Enregistrement sur place ─── -->
    <Teleport to="body">
      <div v-if="showRegisterModal" class="modal-backdrop" @click.self="showRegisterModal = false">
        <div class="modal-box form-card">
          <div class="fh fh-a">
            <div class="fh-icon"><AppIcon name="user-plus" :size="22" /></div>
            <div class="fh-title">Enregistrement sur place</div>
          </div>
          <div class="fb">
            <p style="font-size: 0.85rem; color: #666; margin-top: -10px; margin-bottom: 15px;">
              💡 <em>Saisie rapide : renseignez uniquement le prénom et le nom. L'e-mail et l'organisation sont optionnels et peuvent être laissés vides pour gagner du temps.</em>
            </p>
            <form @submit.prevent="submitRegisterOnsite">
              <div class="fr">
                <div class="fg">
                  <label>Prénom <span class="req">*</span></label>
                  <input type="text" v-model="registerForm.prenom" ref="prenomInputRef" @keyup.enter="focusNom" required placeholder="Ex : Mamadou" />
                </div>
                <div class="fg">
                  <label>Nom <span class="req">*</span></label>
                  <input type="text" v-model="registerForm.nom" ref="nomInputRef" @keyup.enter="submitRegisterOnsite" required placeholder="Ex : Diallo" />
                </div>
              </div>
              <div class="fr">
                <div class="fg">
                  <label>Organisation / Institution</label>
                  <input type="text" v-model="registerForm.organisation" placeholder="Ex : Ministère de la Culture" />
                </div>
                <div class="fg">
                  <label>Titre / Fonction</label>
                  <input type="text" v-model="registerForm.titre_poste" placeholder="Ex : Étudiant, Directeur..." />
                </div>
              </div>
              <div class="fg" style="margin-top: 10px;">
                <label>Adresse e-mail (Optionnel)</label>
                <input type="email" v-model="registerForm.email" placeholder="Ex : nom@domaine.com" />
              </div>

              <div v-if="registerError" class="form-error-msg">
                <AppIcon name="alert-triangle" :size="15" /> {{ registerError }}
              </div>

              <div class="modal-actions">
                <button type="button" class="btn-cancel" @click="showRegisterModal = false">Annuler</button>
                <button type="submit" class="bsub bsub-a modal-submit" :disabled="registerLoading">
                  <AppIcon :name="registerLoading ? 'loader' : 'check'" :size="16" />
                  {{ registerLoading ? 'Enregistrement…' : 'Enregistrer & Émarger' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ─── Historique des check-ins ─── -->
    <div class="form-card" v-if="checkinLog.length > 0">
      <div class="fh fh-a" style="padding:20px 28px;">
        <div class="fh-icon"><AppIcon name="clock" :size="20" /></div>
        <div>
          <div class="fh-title" style="font-size:1.1rem;">Derniers check-ins</div>
          <div class="fh-sub">Les 10 dernières entrées enregistrées</div>
        </div>
      </div>
      <div class="ck-log-list">
        <div
          v-for="(entry, idx) in checkinLog.slice(0, 10)"
          :key="entry.id || idx"
          class="ck-log-item"
          :style="`animation-delay: ${idx * 0.05}s`"
        >
          <div class="ck-log-avatar">{{ initials(entry) }}</div>
          <div class="ck-log-info">
            <div class="ck-log-name">{{ entry.prenom }} {{ entry.nom }}</div>
            <div class="ck-log-meta">{{ entry.organisation || '' }}</div>
          </div>
          <div class="ck-log-time">{{ formatTime(entry.checked_at || entry.timestamp) }}</div>
          <div class="ck-log-badge"><AppIcon name="check-circle" :size="16" /></div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useApiStore } from '../store/api.js'
import AppIcon from '../components/AppIcon.vue'

const route = useRoute()
const api = useApiStore()
const eventId = route.params.eventId

const evenement = ref(null)
const loading = ref(false)
const cameraActive = ref(false)
const scanning = ref(false)
const scanResult = ref(null)
const checkinLog = ref([])
const totalInscrits = ref(0)
const videoEl = ref(null)
const canvasEl = ref(null)
const manualInput = ref('')
const manualError = ref('')
const manualMatches = ref([])
const processing = ref(false)
const showRegisterModal = ref(false)
const registerLoading = ref(false)
const registerError = ref('')
const registerForm = ref({ prenom: '', nom: '', organisation: '', titre_poste: '', email: '' })

const prenomInputRef = ref(null)
const nomInputRef = ref(null)

// Focus automatique sur le premier champ quand la modale s'ouvre
watch(showRegisterModal, async (newVal) => {
  if (newVal) {
    await nextTick()
    prenomInputRef.value?.focus()
  }
})

function focusNom() {
  nomInputRef.value?.focus()
}

const invitationsList = ref([])

const suggestions = computed(() => {
  const query = manualInput.value.trim().toLowerCase()
  if (query.length < 2) return []
  return invitationsList.value.filter(i => {
    if (!i.invites) return false
    const prenom = (i.invites.prenom || '').toLowerCase()
    const nom = (i.invites.nom || '').toLowerCase()
    const org = (i.invites.organisation || '').toLowerCase()
    return prenom.includes(query) || nom.includes(query) || org.includes(query)
  }).slice(0, 10)
})

const profileStats = computed(() => {
  const orgMap = {}
  const jobMap = {}
  
  checkinLog.value.forEach(item => {
    const org = (item.organisation || 'Non spécifié').trim() || 'Non spécifié'
    const job = (item.titre_poste || 'Non spécifié').trim() || 'Non spécifié'
    
    orgMap[org] = (orgMap[org] || 0) + 1
    jobMap[job] = (jobMap[job] || 0) + 1
  })
  
  const topOrgs = Object.entries(orgMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    
  const topJobs = Object.entries(jobMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    
  return { topOrgs, topJobs }
})
let stream = null
let scanLoop = null
let jsQR = null
let facingMode = 'environment'
let resultTimer = null

const progressPct = computed(() => {
  if (!totalInscrits.value) return 0
  return Math.round((checkinLog.value.length / totalInscrits.value) * 100)
})

onMounted(async () => {
  loading.value = true
  try {
    // Load jsQR dynamically from CDN (avoids build-time resolution)
    try {
      const modUrl = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js'
      await new Promise((resolve, reject) => {
        if (window.jsQR) { jsQR = window.jsQR; resolve(); return }
        const script = document.createElement('script')
        script.src = modUrl
        script.onload = () => { jsQR = window.jsQR; resolve() }
        script.onerror = reject
        document.head.appendChild(script)
      })
    } catch {
      console.warn('jsQR non disponible — scan QR désactivé. Utilisez la saisie manuelle.')
    }

    // Load event data
    const [evts, log, invs] = await Promise.allSettled([
      api.get('/api/evenements'),
      api.get(`/api/checkin/${eventId}/log`),
      api.get(`/api/invitations?evenement_id=${eventId}`)
    ])
    if (evts.status === 'fulfilled') {
      evenement.value = (evts.value || []).find(e => String(e.id) === String(eventId)) || null
    }
    if (invs.status === 'fulfilled') {
      invitationsList.value = invs.value || []
      totalInscrits.value = invitationsList.value.filter(i => i.statut === 'inscrit' || i.statut === 'present').length
    }
    if (log.status === 'fulfilled') {
      const rawLog = log.value?.log || log.value || []
      // Normalisation du log pour un affichage uniforme (nom, prénom, organisation, checked_at)
      checkinLog.value = rawLog.map(row => ({
        id: row.id,
        prenom: row.invitations?.invites?.prenom || '',
        nom: row.invitations?.invites?.nom || '',
        organisation: row.invitations?.invites?.organisation || '',
        titre_poste: row.invitations?.invites?.titre_poste || '',
        checked_at: row.scanned_at
      }))
    }
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  stopCamera()
})

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } }
    })
    if (videoEl.value) {
      videoEl.value.srcObject = stream
      await videoEl.value.play()
      cameraActive.value = true
      scanning.value = true
      startScanLoop()
    }
  } catch (err) {
    console.error('Erreur caméra:', err)
    scanResult.value = {
      type: 'error',
      name: 'Caméra inaccessible',
      message: 'Veuillez autoriser l\'accès à la caméra ou utiliser la saisie manuelle.'
    }
  }
}

function stopCamera() {
  scanning.value = false
  cameraActive.value = false
  if (scanLoop) { cancelAnimationFrame(scanLoop); scanLoop = null }
  if (stream) {
    stream.getTracks().forEach(t => t.stop())
    stream = null
  }
  if (videoEl.value) videoEl.value.srcObject = null
}

async function flipCamera() {
  facingMode = facingMode === 'environment' ? 'user' : 'environment'
  stopCamera()
  await startCamera()
}

function startScanLoop() {
  if (!jsQR) return
  function tick() {
    if (!scanning.value || !videoEl.value || !canvasEl.value) return
    const video = videoEl.value
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const canvas = canvasEl.value
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height)
      if (code && code.data) {
        handleScanResult(code.data)
        return // pause for result
      }
    }
    scanLoop = requestAnimationFrame(tick)
  }
  scanLoop = requestAnimationFrame(tick)
}

async function handleScanResult(scannedText) {
  if (processing.value) return
  scanning.value = false
  processing.value = true
  try {
    let token = scannedText
    try {
      const url = new URL(scannedText)
      // Gérer les barres obliques de fin de l'URL
      const pathname = url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname
      const parts = pathname.split('/')
      token = parts[parts.length - 1]
    } catch(e) {
      // scannedText n'est pas une URL, on garde tel quel
    }
    // Nettoyage au cas où .png traîne
    if (token.endsWith('.png')) token = token.slice(0, -4)
    token = token.trim().toLowerCase()

    const result = await api.post('/api/checkin/scan', { token, evenement_id: eventId })
    scanResult.value = {
      type: 'success',
      name: `${result.invite?.prenom || ''} ${result.invite?.nom || ''}`.trim() || 'Invité',
      message: 'Bienvenue !'
    }
    // Ajouter au log de check-in normalisé
    checkinLog.value.unshift({
      id: result.id || Math.random().toString(),
      prenom: result.invite?.prenom || '',
      nom: result.invite?.nom || '',
      organisation: result.invite?.organisation || '',
      titre_poste: result.invite?.titre_poste || '',
      checked_at: new Date().toISOString()
    })
    await loadInvitationsList()
  } catch (err) {
    scanResult.value = {
      type: 'error',
      name: 'QR invalide ou déjà scanné',
      message: err.message || 'Ce code QR ne correspond à aucune invitation valide.'
    }
  } finally {
    processing.value = false
    clearTimeout(resultTimer)
    resultTimer = setTimeout(() => {
      scanResult.value = null
      if (cameraActive.value) {
        scanning.value = true
        startScanLoop()
      }
    }, 3500)
  }
}

async function doManualCheckin() {
  if (!manualInput.value.trim() || processing.value) return
  manualError.value = ''
  manualMatches.value = []
  processing.value = true
  try {
    const result = await api.post('/api/checkin/scan', {
      token: manualInput.value.trim(),
      evenement_id: eventId
    })
    scanResult.value = {
      type: 'success',
      name: `${result.invite?.prenom || ''} ${result.invite?.nom || ''}`.trim() || 'Invité',
      message: 'Bienvenue !'
    }
    // Ajouter au log de check-in normalisé
    checkinLog.value.unshift({
      id: result.id || Math.random().toString(),
      prenom: result.invite?.prenom || '',
      nom: result.invite?.nom || '',
      organisation: result.invite?.organisation || '',
      titre_poste: result.invite?.titre_poste || '',
      checked_at: new Date().toISOString()
    })
    manualInput.value = ''
    await loadInvitationsList()
  } catch (err) {
    if (err.matches) {
      manualMatches.value = err.matches
      manualError.value = 'Plusieurs correspondances trouvées. Veuillez sélectionner la bonne personne :'
    } else {
      manualError.value = err.message || 'Token ou nom introuvable.'
    }
  } finally {
    processing.value = false
  }
}

async function selectMatch(match) {
  manualError.value = ''
  manualMatches.value = []
  processing.value = true
  try {
    const result = await api.post('/api/checkin/scan', {
      token: match.token,
      evenement_id: eventId
    })
    scanResult.value = {
      type: 'success',
      name: `${result.invite?.prenom || ''} ${result.invite?.nom || ''}`.trim() || 'Invité',
      message: 'Bienvenue !'
    }
    // Ajouter au log de check-in normalisé
    checkinLog.value.unshift({
      id: result.id || Math.random().toString(),
      prenom: result.invite?.prenom || '',
      nom: result.invite?.nom || '',
      organisation: result.invite?.organisation || '',
      titre_poste: result.invite?.titre_poste || '',
      checked_at: new Date().toISOString()
    })
    manualInput.value = ''
    await loadInvitationsList()
  } catch (err) {
    manualError.value = err.message || 'Erreur lors de la validation.'
  } finally {
    processing.value = false
  }
}

async function loadInvitationsList() {
  try {
    const res = await api.get(`/api/invitations?evenement_id=${eventId}`)
    invitationsList.value = res || []
    totalInscrits.value = invitationsList.value.filter(i => i.statut === 'inscrit' || i.statut === 'present').length
  } catch (err) {
    console.error('Erreur rechargement invitations:', err)
  }
}

async function handleSelectSuggestion(invitationItem) {
  manualInput.value = ''
  processing.value = true
  manualError.value = ''
  try {
    const result = await api.post('/api/checkin/scan', {
      token: invitationItem.token,
      evenement_id: eventId
    })
    scanResult.value = {
      type: 'success',
      name: `${result.invite?.prenom || ''} ${result.invite?.nom || ''}`.trim() || 'Invité',
      message: 'Bienvenue !'
    }
    // Ajouter au log de check-in normalisé
    checkinLog.value.unshift({
      id: result.id || Math.random().toString(),
      prenom: result.invite?.prenom || '',
      nom: result.invite?.nom || '',
      organisation: result.invite?.organisation || '',
      titre_poste: result.invite?.titre_poste || '',
      checked_at: new Date().toISOString()
    })
    await loadInvitationsList()
  } catch (err) {
    manualError.value = err.message || 'Erreur lors de la validation.'
  } finally {
    processing.value = false
  }
}

function initials(entry) {
  const p = (entry.prenom || '').charAt(0).toUpperCase()
  const n = (entry.nom || '').charAt(0).toUpperCase()
  return p + n || '?'
}

function formatTime(ts) {
  if (!ts) return ''
  try {
    return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(ts))
  } catch { return '' }
}

async function submitRegisterOnsite() {
  if (!registerForm.value.prenom.trim() || !registerForm.value.nom.trim()) return
  registerLoading.value = true
  registerError.value = ''
  try {
    const result = await api.post('/api/checkin/register-onsite', {
      ...registerForm.value,
      evenement_id: eventId,
      agent: api.user?.name || 'Accueil'
    })
    
    showRegisterModal.value = false
    registerForm.value = { prenom: '', nom: '', organisation: '', titre_poste: '', email: '' }
    
    // Afficher le résultat avec succès
    scanResult.value = {
      type: 'success',
      name: `${result.invite?.prenom || ''} ${result.invite?.nom || ''}`.trim() || 'Invité',
      message: 'Bienvenue ! (Enregistré sur place)'
    }
    
    // Ajouter au log de check-in normalisé
    checkinLog.value.unshift({
      id: result.id || Math.random().toString(),
      prenom: result.invite?.prenom || '',
      nom: result.invite?.nom || '',
      organisation: result.invite?.organisation || '',
      checked_at: new Date().toISOString()
    })
    
    totalInscrits.value++
  } catch (err) {
    registerError.value = err.message || 'Erreur lors de l\'enregistrement.'
  } finally {
    registerLoading.value = false
  }
}
</script>

<style scoped>
.ck-shell { display: flex; flex-direction: column; gap: 20px; }

/* Counter */
.ck-counter {
  display: flex; gap: 28px; align-items: center; flex-wrap: wrap;
  padding-top: 12px; padding-bottom: 12px;
  border-top: 1px solid rgba(255,255,255,.15);
}
.ck-counter-item { display: flex; align-items: center; gap: 12px; }
.ck-counter-icon { color: var(--or); }
.ck-counter-icon.blue { color: #1565c0; }
.ck-counter-icon.green { color: #2e7d32; }
.ck-counter-num { font-size: 1.8rem; font-weight: 900; color: var(--blanc); line-height: 1; }
.ck-counter-label { font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; color: rgba(255,255,255,.7); }
.ck-progress-wrap { flex: 1; min-width: 140px; }
.ck-progress-bar {
  height: 8px; background: rgba(255,255,255,.2); border-radius: 4px; overflow: hidden; margin-bottom: 6px;
}
.ck-progress-fill {
  height: 100%; background: linear-gradient(90deg, #4caf50, #81c784);
  border-radius: 4px; transition: width .5s ease;
}
.ck-progress-label { font-size: .76rem; color: rgba(255,255,255,.8); font-weight: 700; }

/* Content layout */
.ck-content { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
@media (max-width: 720px) { .ck-content { grid-template-columns: 1fr; } }

/* Scanner card */
.ck-scanner-card { overflow: hidden; }
.ck-scan-area {
  position: relative; background: #000;
  border-radius: 14px; overflow: hidden;
  aspect-ratio: 4/3; max-height: 380px;
  display: flex; align-items: center; justify-content: center;
}
.ck-video { width: 100%; height: 100%; object-fit: cover; display: block; }
.ck-canvas { display: none; }
.ck-scan-overlay {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
}
.ck-scan-frame {
  width: 200px; height: 200px; position: relative;
}
.corner {
  position: absolute; width: 28px; height: 28px;
  border-color: var(--or); border-style: solid;
}
.corner.tl { top: 0; left: 0; border-width: 3px 0 0 3px; border-radius: 4px 0 0 0; }
.corner.tr { top: 0; right: 0; border-width: 3px 3px 0 0; border-radius: 0 4px 0 0; }
.corner.bl { bottom: 0; left: 0; border-width: 0 0 3px 3px; border-radius: 0 0 0 4px; }
.corner.br { bottom: 0; right: 0; border-width: 0 3px 3px 0; border-radius: 0 0 4px 0; }
.ck-scan-line {
  position: absolute; left: 8px; right: 8px; top: 0;
  height: 2px; background: linear-gradient(90deg, transparent, var(--or), transparent);
  opacity: 0;
}
.ck-scan-line.active {
  opacity: 1;
  animation: scanLine 2s ease-in-out infinite;
}
@keyframes scanLine {
  0%   { top: 0; }
  50%  { top: calc(100% - 2px); }
  100% { top: 0; }
}

/* Camera controls */
.ck-cam-controls {
  display: flex; gap: 10px; margin-top: 14px; flex-wrap: wrap;
}
.btn-start-cam, .btn-stop-cam, .btn-flip-cam {
  display: flex; align-items: center; gap: 8px;
  padding: 11px 20px; border: none; border-radius: 999px;
  font-size: .86rem; font-weight: 700; cursor: pointer; transition: all .25s;
}
.btn-start-cam {
  background: linear-gradient(135deg, #1a3a2a, #2d6a4a);
  color: #fff; box-shadow: 0 6px 18px rgba(26,58,42,.25); flex: 1;
}
.btn-start-cam:hover { filter: brightness(1.1); }
.btn-stop-cam {
  background: rgba(177,34,42,.1); color: var(--rouge);
  border: 1.5px solid rgba(177,34,42,.25); flex: 1;
}
.btn-stop-cam:hover { background: var(--rouge); color: #fff; }
.btn-flip-cam {
  background: rgba(132,89,54,.1); color: var(--brun);
  border: 1.5px solid rgba(132,89,54,.2);
}
.btn-flip-cam:hover { background: rgba(132,89,54,.2); }

/* Scan result */
.ck-result {
  display: flex; align-items: center; gap: 16px;
  padding: 18px 20px; border-radius: 16px;
  margin-top: 16px; font-weight: 600;
  animation: resultPop .4s cubic-bezier(.34,1.56,.64,1);
}
.ck-result.success { background: #e8f5e9; border: 2px solid rgba(46,125,50,.35); color: #1b5e20; }
.ck-result.error   { background: #ffeaea; border: 2px solid rgba(177,34,42,.35); color: var(--rouge); }
.ck-result-icon { flex-shrink: 0; }
.ck-result-name { font-size: 1.1rem; font-weight: 900; margin-bottom: 4px; }
.ck-result-msg { font-size: .86rem; opacity: .85; }
@keyframes resultPop {
  from { opacity: 0; transform: scale(.88) translateY(12px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
.result-enter-active { animation: resultPop .4s cubic-bezier(.34,1.56,.64,1); }
.result-leave-active { animation: resultPop .25s ease reverse; }

/* Manual input */
.ck-manual-desc { font-size: .88rem; color: #666; margin: 0 0 14px; }
.ck-manual-row { display: flex; gap: 10px; align-items: center; }
.ck-manual-input-wrap { position: relative; flex: 1; display: flex; align-items: center; }
.ck-manual-icon {
  position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
  color: var(--brun); opacity: .5; pointer-events: none;
}
.ck-manual-input {
  width: 100%; padding: 12px 16px 12px 40px;
  border: 2px solid #e8ddd0; border-radius: 999px;
  font-size: .92rem; background: var(--creme); color: var(--noir);
  outline: none; transition: all .25s;
}
.ck-manual-input:focus { border-color: var(--or); background: #fff; box-shadow: 0 0 0 4px rgba(249,178,51,.1); }
.btn-manual {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 22px; background: linear-gradient(135deg, #1a3a2a, #2d6a4a);
  color: #fff; border: none; border-radius: 999px;
  font-size: .88rem; font-weight: 700; cursor: pointer;
  white-space: nowrap; transition: all .25s;
  box-shadow: 0 6px 16px rgba(26,58,42,.2);
}
.btn-manual:hover:not(:disabled) { filter: brightness(1.1); }
.btn-manual:disabled { opacity: .5; cursor: not-allowed; }
.ck-manual-error {
  display: flex; align-items: center; gap: 8px;
  background: #ffeaea; border: 1.5px solid var(--rouge); border-radius: 12px;
  padding: 10px 14px; color: var(--rouge); font-size: .84rem; font-weight: 600;
  margin-top: 12px;
}

/* Log */
.ck-log-list { padding: 0 20px 20px; }
.ck-log-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 0; border-bottom: 1px solid rgba(132,89,54,.08);
  animation: fadeInUp .4s ease-out backwards;
}
.ck-log-item:last-child { border-bottom: none; }
.ck-log-avatar {
  width: 38px; height: 38px; border-radius: 50%;
  background: linear-gradient(135deg, #1a3a2a, #2d6a4a);
  color: #fff; font-size: .78rem; font-weight: 800;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.ck-log-info { flex: 1; }
.ck-log-name { font-weight: 700; font-size: .92rem; color: var(--noir); }
.ck-log-meta { font-size: .76rem; color: var(--brun); opacity: .6; margin-top: 2px; }
.ck-log-time { font-size: .78rem; color: #888; font-variant-numeric: tabular-nums; }
.ck-log-badge { color: #2e7d32; }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* Modals & Buttons */
.btn-import {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 20px; background: rgba(132,89,54,.08);
  color: var(--brun); border: 1.5px solid rgba(132,89,54,.25);
  border-radius: 999px; font-size: .86rem; font-weight: 700;
  cursor: pointer; transition: all .25s; white-space: nowrap;
}
.btn-import:hover { background: rgba(132,89,54,.16); border-color: var(--brun); }

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

/* Autocomplete suggestions dropdown styling */
.manual-autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1.5px solid rgba(132,89,54,0.15);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  z-index: 100;
  max-height: 240px;
  overflow-y: auto;
  margin-top: 5px;
}
.autocomplete-item {
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(132,89,54,0.05);
  cursor: pointer;
  text-align: left;
  transition: background 0.2s;
}
.autocomplete-item:last-child {
  border-bottom: none;
}
.autocomplete-item:hover:not(:disabled) {
  background: rgba(132,89,54,0.05);
}
.autocomplete-item:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
.autocomplete-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.autocomplete-name {
  font-weight: 700;
  color: var(--noir);
  font-size: 0.88rem;
}
.autocomplete-meta {
  font-size: 0.74rem;
  color: #777;
}
.autocomplete-badge {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
}
.autocomplete-badge.present {
  background: #f0f0f0;
  color: #888;
}
.autocomplete-badge:not(.present) {
  background: rgba(46,125,50,0.1);
  color: #2e7d32;
}
</style>
