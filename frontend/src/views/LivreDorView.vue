<template>
  <div class="gal-shell">
    
    <!-- En-tête de la page (Hero Section) -->
    <section class="page-header-section" v-reveal="0">
      <div class="header-bg">
        <img src="/images/stand-mvg.jpeg" alt="Bannière Livre d'Or" class="header-bg-img-blur" />
        <img src="/images/stand-mvg.jpeg" alt="Livre d'Or Banner" class="header-bg-img-contain" />
        <div class="header-overlay"></div>
      </div>
      <div class="header-content">
        <span class="header-badge">Témoignages &amp; Partages</span>
        <h1 class="header-title">Livre d'Or du Musée</h1>
        <p class="header-subtitle">Les messages de nos visiteurs du monde entier. Cliquez sur une carte pour la lire.</p>
      </div>
    </section>

    <!-- Zone principale 3D -->
    <div 
      class="guestbook-container form-card" 
      v-reveal="100"
      @mousemove="handleParallax"
      @mouseleave="resetParallax"
      @touchmove.passive="handleParallax"
      @touchend="resetParallax"
      ref="containerRef"
    >
      <!-- Groupe de cartes entremêlées -->
      <div class="guestbook-cloud" :style="cloudStyle">
        <div 
          v-for="(msg, index) in messages" 
          :key="msg.id"
          class="guestbook-card glass"
          :style="getCardStyle(index)"
          @click="openCardModal(msg)"
        >
          <div class="card-pin"></div>
          <div class="card-quote">"</div>
          <p class="card-text">{{ msg.text }}</p>
          <div class="card-author" style="display: flex; align-items: center; gap: 10px; margin-top: 12px; margin-bottom: 3px;">
            <GuestbookAvatar :genre="msg.genre || 'homme'" :size="32" />
            <div style="display: flex; flex-direction: column; overflow: hidden;">
              <span class="author-name" style="white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">{{ msg.author }}</span>
              <span class="author-location" style="white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">{{ msg.location }}</span>
            </div>
          </div>
          <div class="card-date">{{ msg.date }}</div>
        </div>
      </div>

      <!-- Bouton flottant de signature -->
      <button class="fab-signature" @click="toggleForm(true)" title="Signer le livre d'or">
        <AppIcon name="edit-3" :size="20" />
        <span>Signer le Livre d'Or</span>
      </button>

      <!-- Contrôle de vitesse -->
      <div class="speed-control">
        <button class="speed-btn" @click="changeSpeed(-0.3)" title="Ralentir">−</button>
        <span class="speed-label">Vitesse</span>
        <button class="speed-btn" @click="changeSpeed(0.3)" title="Accélérer">+</button>
      </div>
    </div>

    <!-- Modale lecture d'une carte -->
    <Teleport to="body">
      <div v-if="selectedCard" class="modal-backdrop" @click.self="closeCardModal">
        <div class="card-modal-box form-card">
          <div class="fh fh-a">
            <div class="fh-icon"><AppIcon name="message-square" :size="22" /></div>
            <div class="fh-title">{{ selectedCard.author }}</div>
            <button class="btn-close-modal" @click="closeCardModal" title="Fermer">
              <AppIcon name="x" :size="20" />
            </button>
          </div>
          <div class="card-modal-body">
            <div class="card-modal-quote">"</div>
            <p class="card-modal-text">{{ selectedCard.text }}</p>
            <div class="card-modal-footer">
              <div class="card-modal-author" style="display: flex; align-items: center; gap: 12px;">
                <GuestbookAvatar :genre="selectedCard.genre || 'homme'" :size="42" />
                <div style="display: flex; flex-direction: column;">
                  <span class="author-name" style="font-size: 0.95rem;">{{ selectedCard.author }}</span>
                  <span class="author-location">{{ selectedCard.location }}</span>
                </div>
              </div>
              <div class="card-modal-date">{{ selectedCard.date }}</div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Tiroir formulaire -->
    <Teleport to="body">
      <div v-if="isFormOpen" class="modal-backdrop" @click.self="toggleForm(false)">
        <div class="drawer-box form-card">
          <div class="fh fh-a">
            <div class="fh-icon"><AppIcon name="edit-3" :size="22" /></div>
            <div class="fh-title">Laisser un message</div>
            <button class="btn-close-modal" @click="toggleForm(false)">
              <AppIcon name="x" :size="20" />
            </button>
          </div>
          <form @submit.prevent="submitMessage" class="fb" style="gap: 18px; padding: 24px; overflow-y: auto; flex: 1;">
            <div class="form-group">
              <label class="form-label" for="gb-author">Nom / Pseudo</label>
              <input id="gb-author" type="text" v-model="newMsg.author" required placeholder="Ex: Mamadou Diallo" class="form-control" />
            </div>

            <!-- Choix du genre avec avatars -->
            <div class="form-group">
              <label class="form-label">Genre (Avatar)</label>
              <div class="genre-selector">
                <label class="genre-pill" :class="{ active: newMsg.genre === 'homme' }">
                  <input type="radio" v-model="newMsg.genre" value="homme" class="genre-radio" />
                  <GuestbookAvatar genre="homme" :size="26" />
                  <span>Homme</span>
                </label>
                <label class="genre-pill" :class="{ active: newMsg.genre === 'femme' }">
                  <input type="radio" v-model="newMsg.genre" value="femme" class="genre-radio" />
                  <GuestbookAvatar genre="femme" :size="26" />
                  <span>Femme</span>
                </label>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="gb-location">Ville &amp; Pays</label>
              <input id="gb-location" type="text" v-model="newMsg.location" required placeholder="Ex: Labé, Guinée" class="form-control" />
            </div>
            <div class="form-group">
              <label class="form-label" for="gb-text">Votre message</label>
              <textarea id="gb-text" v-model="newMsg.text" required rows="5" placeholder="Partagez vos impressions sur la visite ou votre amour du patrimoine guinéen..." class="form-control" style="resize: none;"></textarea>
            </div>
            <button type="submit" class="btn-primary-custom" style="width:100%;padding:14px;border-radius:12px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px;">
              <AppIcon name="send" :size="16" /> Envoyer au Livre d'Or
            </button>
          </form>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useApiStore } from '../store/api.js'
import AppIcon from '../components/AppIcon.vue'
import GuestbookAvatar from '../components/GuestbookAvatar.vue'

const api = useApiStore()
const containerRef = ref(null)
const tiltX = ref(0)
const tiltY = ref(0)
const selectedCard = ref(null)
const isFormOpen = ref(false)
let animFrame = null
let startTime = null
const speedFactor = ref(1.0)

// Positions animées calculées par JS pour chaque carte
const cardPositions = ref([])

// Paramètres d'animation uniques par carte (calculés une fois)
let animParams = []

// Style du conteneur orbital (tilt souris uniquement)
const cloudStyle = computed(() => ({
  transform: `rotateX(${tiltX.value}deg) rotateY(${tiltY.value}deg)`
}))

// Style individuel de chaque carte : position entremêlée calculée par JS
function getCardStyle(index) {
  if (!cardPositions.value[index]) return {}
  const p = cardPositions.value[index]
  return {
    transform: `translate3d(${p.x}px, ${p.y}px, ${p.z}px) rotateX(${p.rx}deg) rotateY(${p.ry}deg)`
  }
}

// ─── Paramètres d'entremêlement propres à chaque carte ───
function initAnimParams(count) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 600
  const isTablet = typeof window !== 'undefined' && window.innerWidth < 1024

  const maxSpreadX = isMobile ? 180 : (isTablet ? 300 : 440)
  const maxSpreadY = isMobile ? 130 : (isTablet ? 180 : 300)
  const maxSpreadZ = isMobile ? 140 : (isTablet ? 220 : 360)
  const ampScale = isMobile ? 0.55 : (isTablet ? 0.8 : 1.0)

  animParams = Array.from({ length: count }, (_, i) => {
    const clusterX = (Math.random() - 0.5) * maxSpreadX
    const clusterY = (Math.random() - 0.5) * maxSpreadY
    const clusterZ = (Math.random() - 0.5) * maxSpreadZ

    return {
      cx: clusterX,
      cy: clusterY,
      cz: clusterZ,
      ax: (45 + Math.random() * 50) * ampScale,
      ay: (35 + Math.random() * 40) * ampScale,
      az: (45 + Math.random() * 55) * ampScale,
      fx: 0.18 + Math.random() * 0.35,
      fy: 0.14 + Math.random() * 0.30,
      fz: 0.10 + Math.random() * 0.25,
      px: Math.random() * Math.PI * 2,
      py: Math.random() * Math.PI * 2,
      pz: Math.random() * Math.PI * 2,
      baseRx: (Math.random() - 0.5) * 18,
      baseRy: (Math.random() - 0.5) * 24,
      rotAmp: 4 + Math.random() * 6,
      rotFreq: 0.12 + Math.random() * 0.2,
      rotPhase: Math.random() * Math.PI * 2,
    }
  })
}

// ─── Boucle d'animation ───
function startAnimation() {
  const tick = (timestamp) => {
    if (!startTime) startTime = timestamp
    const t = ((timestamp - startTime) / 1000) * speedFactor.value

    cardPositions.value = animParams.map(p => ({
      x: p.cx + Math.sin(t * p.fx + p.px) * p.ax,
      y: p.cy + Math.sin(t * p.fy + p.py) * p.ay,
      z: p.cz + Math.sin(t * p.fz + p.pz) * p.az,
      rx: p.baseRx + Math.sin(t * p.rotFreq + p.rotPhase) * p.rotAmp,
      ry: p.baseRy + Math.cos(t * p.rotFreq + p.rotPhase) * p.rotAmp,
    }))

    animFrame = requestAnimationFrame(tick)
  }
  animFrame = requestAnimationFrame(tick)
}

function changeSpeed(delta) {
  speedFactor.value = Math.max(0.2, Math.min(4.0, speedFactor.value + delta))
}

// ─── Parallax souris & tactile ───
function handleParallax(e) {
  if (!containerRef.value) return
  const clientX = e.touches ? e.touches[0].clientX : e.clientX
  const clientY = e.touches ? e.touches[0].clientY : e.clientY
  const rect = containerRef.value.getBoundingClientRect()
  const x = clientX - rect.left - rect.width / 2
  const y = clientY - rect.top - rect.height / 2
  tiltX.value = -(y / (rect.height / 2)) * 8
  tiltY.value = (x / (rect.width / 2)) * 10
}
function resetParallax() { tiltX.value = 0; tiltY.value = 0 }

// ─── Données ───
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
const newMsg = ref({ author: '', location: '', genre: 'homme', text: '' })

onMounted(() => {
  loadMessages()
})
onUnmounted(() => {
  if (animFrame) cancelAnimationFrame(animFrame)
})

async function loadMessages() {
  try {
    const data = await api.get('/api/livre-dor')
    if (Array.isArray(data) && data.length > 0) {
      messages.value = data
      localStorage.setItem('mvg_guestbook', JSON.stringify(data))
    } else {
      fallbackLoadLocal()
    }
  } catch (err) {
    fallbackLoadLocal()
  }

  initAnimParams(messages.value.length)
  if (animFrame) cancelAnimationFrame(animFrame)
  startTime = null
  startAnimation()
}

function fallbackLoadLocal() {
  const saved = localStorage.getItem('mvg_guestbook')
  let rawList = []
  if (saved) { try { rawList = JSON.parse(saved) } catch(e) { rawList = defaultMessages } }
  else { rawList = defaultMessages }
  messages.value = rawList
}

function openCardModal(msg) { selectedCard.value = msg }
function closeCardModal() { selectedCard.value = null }
function toggleForm(open) { isFormOpen.value = open }

async function submitMessage() {
  const today = new Date()
  const months = ['Janv.','Févr.','Mars','Avril','Mai','Juin','Juil.','Août','Sept.','Oct.','Nov.','Déc.']
  const formattedDate = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`
  
  const payload = {
    author: newMsg.value.author,
    location: newMsg.value.location,
    genre: newMsg.value.genre || 'homme',
    text: newMsg.value.text,
    date: formattedDate
  }

  let createdEntry = null

  try {
    createdEntry = await api.post('/api/livre-dor', payload)
  } catch (err) {
    createdEntry = { id: Date.now(), ...payload }
  }

  const saved = localStorage.getItem('mvg_guestbook')
  let currentList = []
  if (saved) { try { currentList = JSON.parse(saved) } catch(e) { currentList = [...defaultMessages] } }
  else { currentList = [...defaultMessages] }
  currentList.unshift(createdEntry)
  localStorage.setItem('mvg_guestbook', JSON.stringify(currentList))

  newMsg.value = { author: '', location: '', genre: 'homme', text: '' }
  isFormOpen.value = false
  await loadMessages()
  setTimeout(() => { selectedCard.value = createdEntry }, 400)
}
</script>

<style scoped>
.gal-shell { display: flex; flex-direction: column; gap: 24px; }

/* Page Header */
.page-header-section {
  position: relative; border-radius: 24px; overflow: hidden;
  min-height: 360px; display: flex; align-items: center; justify-content: flex-start;
  box-shadow: 0 15px 35px rgba(89,55,22,0.15); margin-top: 10px; padding: 40px 60px;
}
.header-bg { position: absolute; inset: 0; z-index: 1; }
.header-bg-img-blur {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: cover; filter: blur(30px); transform: scale(1.1); opacity: 0.9;
}
.header-bg-img-contain {
  position: relative; width: 100%; height: 100%;
  object-fit: contain; object-position: right center; z-index: 1;
}
.header-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(90deg, rgba(26,16,8,0.82) 0%, rgba(26,16,8,0.42) 45%, rgba(89,55,22,0.08) 100%);
  backdrop-filter: blur(1px);
}
.header-content { position: relative; z-index: 2; text-align: left; color: #fff; max-width: 520px; }
.header-badge {
  display: inline-block;
  background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3);
  padding: 6px 16px; border-radius: 999px;
  font-size: 0.72rem; font-weight: 700; letter-spacing: 2px;
  text-transform: uppercase; margin-bottom: 12px;
}
.header-title { font-size: 2.8rem; font-weight: 900; line-height: 1.15; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1.5px; }
.header-subtitle { font-size: 1rem; line-height: 1.55; opacity: 0.92; margin: 0; font-family: Arial, sans-serif; }

/* Zone principale */
.guestbook-container {
  position: relative;
  background: linear-gradient(160deg, #fffdf9 0%, #f5ede2 100%);
  border-radius: 24px;
  border: 1px solid rgba(132, 89, 54, 0.15);
  height: 640px;
  width: 100%;
  overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  perspective: 1000px;
  box-shadow: 0 10px 40px rgba(89, 55, 22, 0.07);
}
html.theme-musee .guestbook-container {
  background: linear-gradient(160deg, #0c0e1c 0%, #161929 100%) !important;
  border-color: rgba(212, 175, 55, 0.18) !important;
}

/* Groupe 3D (tilt souris) */
.guestbook-cloud {
  position: absolute;
  width: 100%; height: 100%;
  transform-style: preserve-3d;
  will-change: transform;
  /* Transition douce uniquement pour le tilt souris */
  transition: transform 0.18s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  display: flex; align-items: center; justify-content: center;
}

/* Carte individuelle entremêlée */
.guestbook-card {
  position: absolute;
  top: 50%; left: 50%;
  margin-top: -105px; margin-left: -105px;
  width: 210px;
  min-height: 180px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(132, 89, 54, 0.16);
  border-radius: 18px;
  padding: 18px 16px 14px;
  box-shadow: 0 6px 22px rgba(89, 55, 22, 0.10);
  cursor: pointer;
  backface-visibility: hidden;
  will-change: transform;
  transition: box-shadow 0.25s, border-color 0.25s, background-color 0.25s;
  display: flex; flex-direction: column;
}
html.theme-musee .guestbook-card {
  background: rgba(20, 23, 40, 0.9) !important;
  border-color: rgba(212, 175, 55, 0.22) !important;
}
.guestbook-card:hover {
  box-shadow: 0 18px 42px rgba(89, 55, 22, 0.28);
  border-color: var(--or);
  background: white;
  z-index: 50 !important;
}
html.theme-musee .guestbook-card:hover {
  background: rgb(24, 27, 46) !important;
  box-shadow: 0 18px 42px rgba(212,175,55,0.22) !important;
}

/* Punaise */
.card-pin {
  position: absolute; top: -8px; left: 50%; transform: translateX(-50%);
  width: 13px; height: 13px;
  background: linear-gradient(135deg, var(--or), var(--brun));
  border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.18);
}

.card-quote { font-size: 1.8rem; font-family: Georgia, serif; color: var(--or); line-height: 0.9; margin-bottom: 4px; }

.card-text {
  font-size: 0.79rem; line-height: 1.5;
  color: var(--noir); margin: 0 0 auto 0;
  display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical;
  overflow: hidden; flex: 1;
}
html.theme-musee .card-text { color: rgba(255,255,255,0.87) !important; }

.card-author { display: flex; flex-direction: column; margin-top: 12px; margin-bottom: 3px; }
.author-name { font-size: 0.80rem; font-weight: 700; color: var(--brun); }
html.theme-musee .author-name { color: var(--or) !important; }
.author-location { font-size: 0.68rem; color: #888; }
html.theme-musee .author-location { color: rgba(255,255,255,0.42) !important; }
.card-date { font-size: 0.64rem; color: #bbb; text-align: right; }

/* Contrôle de vitesse */
.speed-control {
  position: absolute; bottom: 18px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 12px;
  background: rgba(255,255,255,0.88); border: 1px solid rgba(132,89,54,0.15);
  border-radius: 99px; padding: 6px 18px;
  z-index: 30; backdrop-filter: blur(8px);
}
html.theme-musee .speed-control {
  background: rgba(18,20,32,0.88) !important;
  border-color: rgba(212,175,55,0.2) !important;
}
.speed-btn {
  width: 28px; height: 28px; border-radius: 50%;
  border: 1.5px solid rgba(132,89,54,0.2);
  background: white; color: var(--brun);
  font-size: 1.1rem; font-weight: 700;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
html.theme-musee .speed-btn { background: rgba(255,255,255,0.08) !important; color: var(--or) !important; }
.speed-btn:hover { background: var(--brun); color: white; }
.speed-label { font-size: 0.74rem; font-weight: 600; color: var(--brun); }
html.theme-musee .speed-label { color: var(--or) !important; }

/* FAB signature */
.fab-signature {
  position: absolute; bottom: 18px; right: 22px;
  background: linear-gradient(135deg, var(--brun), var(--or));
  color: white; border: none; border-radius: 99px;
  padding: 11px 20px; font-weight: 700; font-size: 0.88rem;
  display: flex; align-items: center; gap: 9px;
  cursor: pointer; box-shadow: 0 6px 20px rgba(89,55,22,0.3);
  transition: all 0.3s; z-index: 30;
}
.fab-signature:hover { transform: scale(1.04) translateY(-2px); box-shadow: 0 10px 28px rgba(89,55,22,0.45); }

/* Modale */
.modal-backdrop {
  position: fixed; inset: 0;
  background: rgba(8,4,2,0.65); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center; z-index: 9999;
}
.card-modal-box {
  width: 90%; max-width: 480px;
  animation: pop-in 0.32s cubic-bezier(0.16,1,0.3,1) forwards;
}
html.theme-musee .card-modal-box { background: rgb(18,20,32) !important; border: 1px solid rgba(212,175,55,0.22) !important; }
@keyframes pop-in { from { opacity:0; transform:scale(0.82) translateY(24px); } to { opacity:1; transform:scale(1) translateY(0); } }
.card-modal-body { padding: 24px 28px 28px; }
.card-modal-quote { font-size: 3.6rem; font-family: Georgia, serif; color: var(--or); line-height: 0.65; margin-bottom: 14px; }
.card-modal-text { font-size: 1.02rem; line-height: 1.68; color: var(--noir); margin: 0 0 24px; font-style: italic; }
html.theme-musee .card-modal-text { color: rgba(255,255,255,0.9) !important; }
.card-modal-footer { display: flex; align-items: flex-end; justify-content: space-between; border-top: 1px dashed rgba(132,89,54,0.18); padding-top: 16px; }
.card-modal-author { display: flex; flex-direction: column; gap: 2px; }
.card-modal-date { font-size: 0.72rem; color: #aaa; }

/* Drawer */
.drawer-box {
  background: white; width: 100%; max-width: 440px;
  height: 100vh; position: fixed; right: 0; top: 0;
  display: flex; flex-direction: column;
  box-shadow: -10px 0 50px rgba(0,0,0,0.18);
  animation: slideIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards; overflow: hidden;
}
html.theme-musee .drawer-box { background: rgb(18,20,32) !important; border-left: 1px solid rgba(212,175,55,0.2) !important; }
@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }

.form-group { display: flex; flex-direction: column; gap: 7px; }
.form-label { font-size: 0.80rem; font-weight: 700; color: var(--brun); text-transform: uppercase; letter-spacing: 0.5px; }
html.theme-musee .form-label { color: var(--or) !important; }
.form-control {
  padding: 11px 15px; border-radius: 10px;
  border: 1.5px solid rgba(132,89,54,0.22);
  font-size: 0.9rem; background: #fdfaf7; color: var(--noir);
  outline: none; transition: all 0.22s; width: 100%; box-sizing: border-box;
}
html.theme-musee .form-control { background: rgba(255,255,255,0.05) !important; border-color: rgba(212,175,55,0.22) !important; color: white !important; }
.form-control:focus { border-color: var(--or); background: white; box-shadow: 0 0 0 3px rgba(212,175,55,0.15); }
html.theme-musee .form-control:focus { background: rgba(255,255,255,0.08) !important; box-shadow: 0 0 0 3px rgba(212,175,55,0.22) !important; }

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

@media (max-width: 768px) {
  .page-header-section { padding: 24px; min-height: 200px; border-radius: 16px; margin-top: 0; }
  .header-title { font-size: 1.7rem; }
  
  /* Affichage en carrousel horizontal scrollable sur mobile */
  .guestbook-container { 
    height: 480px;
    padding: 16px 0;
    display: flex; 
    align-items: center;
    overflow: hidden;
  }
  
  .guestbook-cloud {
    position: relative;
    top: auto;
    left: auto;
    width: 100%;
    height: 100%;
    transform: none !important;
    transform-style: flat;
    display: flex;
    flex-direction: row;
    gap: 16px;
    padding: 20px 16px;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
  }

  /* Cacher la barre de scroll sur Webkit pour un look plus propre */
  .guestbook-cloud::-webkit-scrollbar {
    display: none;
  }

  .guestbook-card { 
    position: relative;
    top: auto;
    left: auto;
    min-width: 80vw !important; 
    max-width: 80vw !important;
    height: 100% !important;
    margin: 0 !important; 
    padding: 20px; 
    transform: none !important;
    cursor: default;
    scroll-snap-align: center;
    display: flex;
    flex-direction: column;
  }

  .card-pin {
    display: none;
  }

  .speed-control {
    display: none;
  }
  
  .card-modal-box { max-width: 95%; }
  .fab-signature { padding: 12px 18px; font-size: 0.90rem; bottom: 20px; right: 20px; }
}
</style>
