<template>
  <div class="gal-shell">
    <!-- En-tête de la galerie -->
    <section class="page-header-section" v-reveal="0">
      <div class="header-bg">
        <img src="/images/banner-mvg.jpeg" alt="Bannière Galerie 3D" class="header-bg-img-blur" />
        <img src="/images/banner-mvg.jpeg" alt="Galerie 3D Banner" class="header-bg-img-contain" />
        <div class="header-overlay"></div>
      </div>
      <div class="header-content text-center">
        <span class="header-badge">Technologie & Patrimoine</span>
        <h1 class="header-title">Galerie 3D du Musée</h1>
        <p class="header-subtitle">Explorez les collections nationales numérisées en 3D interactive et écoutez l'histoire de chaque trésor.</p>
      </div>
    </section>

    <!-- ─── Sélecteur de Mode ─── -->
    <div class="gal-mode-container" v-reveal="60">
      <div class="gal-mode-selector">
        <button class="mode-toggle-btn" :class="{ active: isImmersiveMode }" @click="isImmersiveMode = true">
          <AppIcon name="eye" :size="16" /> Visite Immersive 3D
        </button>
        <button class="mode-toggle-btn" :class="{ active: !isImmersiveMode }" @click="isImmersiveMode = false">
          <AppIcon name="grid" :size="16" /> Vue Catalogue
        </button>
      </div>
    </div>

    <!-- ──────────────────────────────────────────────────────── -->
    <!-- ─── MODE A : EXPOSITION IMMERSIVE 3D (Default) ──────── -->
    <!-- ──────────────────────────────────────────────────────── -->
    <div v-if="isImmersiveMode" class="immersive-museum-container" v-reveal="100">
      <div class="museum-layout">
        
        <!-- Panneau de Storytelling (Gauche) -->
        <div class="museum-sidebar glass">
          <span class="museum-badge">{{ activeItem?.category }}</span>
          <h2 class="museum-title">{{ activeItem?.name }}</h2>
          <div class="section-divider"></div>
          <p class="museum-desc">{{ activeItem?.story }}</p>
          
          <div class="museum-audio-box">
            <button 
              class="btn-museum-audio" 
              :class="{ playing: playingArtifactId === activeItem?.id }" 
              @click="playArtifactSound(activeItem)"
            >
              <AppIcon :name="playingArtifactId === activeItem?.id ? 'square' : 'headphones'" :size="16" />
              <span>{{ playingArtifactId === activeItem?.id ? 'Arrêter l\'Audio Guide' : 'Lancer l\'Audio Guide' }}</span>
            </button>
          </div>
          
          <div class="museum-ar-box" style="margin-top: 12px;">
            <button 
              class="btn-museum-ar" 
              @click="openARModal(activeItem)"
            >
              <AppIcon name="aperture" :size="16" />
              <span>Placer l'objet chez soi (AR)</span>
            </button>
          </div>
        </div>

        <!-- Zone d'exposition centrale 3D -->
        <div class="museum-display-area">
          <div v-if="iframeLoading" class="museum-spinner">
            <AppIcon name="loader" :size="42" class="spin-icon" />
            <span>Préparation de l'œuvre 3D...</span>
          </div>
          <iframe 
            v-show="!iframeLoading"
            :key="activeItem?.id"
            :src="`https://sketchfab.com/models/${activeItem?.sketchfabId}/embed?autostart=1&internal=1&tracking=0&ui_ar=1&ui_infos=0&ui_pane=0&ui_theme=dark`"
            title="Sketchfab 3D Viewer"
            frameborder="0"
            allowfullscreen
            mozallowfullscreen="true"
            webkitallowfullscreen="true"
            allow="autoplay; fullscreen; xr-spatial-tracking"
            class="museum-iframe"
            @load="onIframeLoaded"
          ></iframe>
          <div class="museum-help-tip" v-show="!iframeLoading">
            <AppIcon name="info" :size="12" />
            <span>Un problème avec le lecteur 3D ? Activez l'accélération matérielle de votre navigateur.</span>
          </div>
        </div>

      </div>

      <!-- Barre de contrôle inférieure (Vignettes & Flèches) -->
      <div class="museum-footer glass">
        <button class="nav-arrow prev" @click="navigateItem(-1)" title="Œuvre précédente">
          <AppIcon name="chevron-left" :size="24" />
        </button>
        
        <div class="museum-thumbnails-scroll">
          <div 
            v-for="(item, idx) in items3D" 
            :key="item.id" 
            class="thumb-item"
            :class="{ active: activeIdx === idx }"
            @click="selectActiveIdx(idx)"
          >
            <img :src="item.image" :alt="item.name" />
            <div class="thumb-caption">{{ item.name }}</div>
          </div>
        </div>

        <button class="nav-arrow next" @click="navigateItem(1)" title="Œuvre suivante">
          <AppIcon name="chevron-right" :size="24" />
        </button>
      </div>
    </div>

    <!-- ──────────────────────────────────────────────────────── -->
    <!-- ─── MODE B : CATALOGUE PAGINÉ ───────────────────────── -->
    <!-- ──────────────────────────────────────────────────────── -->
    <div v-else class="catalogue-container">
      <!-- Barre de Recherche et Filtres -->
      <div class="gal-controls form-card" v-reveal="80">
        <div class="fb" style="padding: 16px;">
          <div class="gal-search-row">
            <div class="gal-search-wrap">
              <AppIcon name="search" :size="16" class="gal-search-icon" />
              <input
                type="text"
                v-model="search"
                placeholder="Rechercher une œuvre 3D…"
                class="gal-search-input"
              />
            </div>
            
            <!-- Filtres de Catégories -->
            <div class="category-tabs">
              <button 
                v-for="cat in categories" 
                :key="cat.value" 
                class="cat-btn"
                :class="{ active: currentCategory === cat.value }"
                @click="currentCategory = cat.value"
              >
                {{ cat.label }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Grille des Modèles -->
      <div class="gal-grid-container">
        <div v-if="filteredItems.length === 0" class="gal-empty" v-reveal="120">
          <div class="gal-empty-icon"><AppIcon name="box" :size="40" /></div>
          <p>Aucune œuvre ne correspond à votre recherche ou catégorie.</p>
        </div>

        <div v-else class="gal-grid">
          <div 
            v-for="item in paginatedItems" 
            :key="item.id" 
            class="gal-card glass"
            v-tilt-3d
            v-reveal="150"
          >
            <div class="gal-card-img-wrap">
              <img :src="item.image" :alt="item.name" class="gal-card-img" />
              <div class="gal-card-badge">{{ item.category }}</div>
            </div>
            
            <div class="gal-card-content">
              <h3 class="gal-card-title">{{ item.name }}</h3>
              <p class="gal-card-desc">{{ item.desc }}</p>
              
              <div class="gal-card-actions">
                <!-- Bouton Visionneuse 3D -->
                <button class="btn-3d-play" @click="openCatalog3DModal(item)">
                  <AppIcon name="box" :size="15" />
                  <span>Visualiser en 3D</span>
                </button>

                <!-- Bouton Audio Guide -->
                <button class="btn-3d-audio" :class="{ playing: playingArtifactId === item.id }" @click="playArtifactSound(item)">
                  <AppIcon :name="playingArtifactId === item.id ? 'square' : 'headphones'" :size="15" />
                  <span>{{ playingArtifactId === item.id ? 'Pause' : 'Audio Guide' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Commandes de pagination -->
      <div v-if="totalPages > 1" class="pagination-controls">
        <button class="page-btn" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">
          <AppIcon name="chevron-left" :size="16" /> Précédent
        </button>
        <span class="page-info">Page {{ currentPage }} sur {{ totalPages }}</span>
        <button class="page-btn" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">
          Suivant <AppIcon name="chevron-right" :size="16" />
        </button>
      </div>
    </div>

    <!-- Modale de secours Sketchfab (utilisée dans le mode catalogue) -->
    <Teleport to="body">
      <div v-if="showCatalog3DModal" class="modal-backdrop" @click.self="closeCatalog3DModal">
        <div class="modal-box gal-3d-modal-box form-card">
          <div class="fh fh-a">
            <div class="fh-icon"><AppIcon name="box" :size="22" /></div>
            <div class="fh-title">{{ catalogActiveItem?.name }}</div>
            <div class="fh-sub">{{ catalogActiveItem?.category }}</div>
            <button class="btn-close-modal" @click="closeCatalog3DModal" title="Fermer">
              <AppIcon name="x" :size="20" />
            </button>
          </div>
          <div class="fb p-0" style="position: relative; height: 500px; background: #000;">
            <iframe 
              v-if="catalogActiveItem"
              :src="`https://sketchfab.com/models/${catalogActiveItem.sketchfabId}/embed?autostart=1&internal=1&tracking=0&ui_ar=1&ui_infos=0&ui_pane=0&ui_theme=dark`"
              title="Sketchfab 3D Viewer"
              frameborder="0"
              allowfullscreen
              mozallowfullscreen="true"
              webkitallowfullscreen="true"
              allow="autoplay; fullscreen; xr-spatial-tracking"
              class="sketchfab-iframe"
            ></iframe>
          </div>
        </div>
      </div>
    </Teleport>
    <!-- ─── Modale Réalité Augmentée (AR) ─── -->
    <Teleport to="body">
      <div v-if="showARModal" class="modal-backdrop" @click.self="closeARModal">
        <div class="modal-box ar-modal-box form-card">
          <div class="fh fh-a">
            <div class="fh-icon"><AppIcon name="aperture" :size="22" /></div>
            <div class="fh-title">Réalité Augmentée (AR)</div>
            <button class="btn-close-modal" @click="closeARModal" title="Fermer">
              <AppIcon name="x" :size="20" />
            </button>
          </div>
          <div class="fb" style="text-align: center; padding: 24px; display: flex; flex-direction: column; align-items: center; gap: 16px;">
            <p style="font-size: 0.92rem; line-height: 1.5; color: var(--noir); margin: 0;">
              {{ isMobileDevice ? "Pour projeter cette œuvre chez vous :" : "Scannez ce QR Code avec votre téléphone portable pour projeter cette œuvre chez vous en Réalité Augmentée !" }}
            </p>
            
            <!-- Desktop mode: QR Code -->
            <div v-if="!isMobileDevice" class="ar-qrcode-wrap" style="margin: 10px 0;">
              <img :src="`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(getARURL(activeItem))}`" alt="QR Code AR" style="border: 4px solid var(--brun); border-radius: 12px; display: block;" />
            </div>

            <!-- Instructions -->
            <div class="ar-instructions" style="text-align: left; background: rgba(132, 89, 54, 0.05); padding: 16px; border-radius: 12px; border: 1px solid rgba(132, 89, 54, 0.15); width: 100%; box-sizing: border-box;">
              <ol style="margin: 0; padding-left: 20px; font-size: 0.84rem; line-height: 1.6; color: var(--noir);">
                <li style="margin-bottom: 6px;">{{ isMobileDevice ? "Appuyez sur l'icône de cube AR (Réalité Augmentée) intégrée en bas à droite de l'objet 3D" : "Ouvrez l'appareil photo de votre smartphone" }}</li>
                <li style="margin-bottom: 6px;">{{ isMobileDevice ? "Déplacez lentement votre téléphone pour cibler une surface plane (sol ou table)" : "Scannez le code QR ci-dessus pour ouvrir la page sur votre mobile" }}</li>
                <li>L'objet 3D va apparaître en taille réelle directement dans votre pièce !</li>
              </ol>
            </div>

            <button class="btn-primary-custom" @click="closeARModal" style="width: 100%; padding: 12px; border-radius: 12px; font-size: 0.9rem; font-weight: 700; cursor: pointer;">
              J'ai compris
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
<script setup>
import { ref, computed, onUnmounted, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'

const route = useRoute()

// États de navigation des modes
const isImmersiveMode = ref(true)

// --- États du Mode Immersion ---
const activeIdx = ref(0)
const iframeLoading = ref(true)

const showARModal = ref(false)
const isMobileDevice = ref(false)

onMounted(() => {
  isMobileDevice.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  
  if (route.query.item) {
    const idx = items3D.value.findIndex(item => item.id === route.query.item)
    if (idx !== -1) {
      activeIdx.value = idx
      isImmersiveMode.value = true
      
      if (route.query.ar === 'true') {
        showARModal.value = true
      }
    }
  }
})

function openARModal(item) {
  showARModal.value = true
}

function closeARModal() {
  showARModal.value = false
}

function getARURL(item) {
  if (!item) return ''
  const base = window.location.origin
  return `${base}/galerie-3d?item=${item.id}&ar=true`
}

const activeItem = computed(() => items3D.value[activeIdx.value])

function selectActiveIdx(idx) {
  if (idx === activeIdx.value) return
  iframeLoading.value = true
  activeIdx.value = idx
  
  // Enchaîner l'audio guide s'il était déjà en cours d'écoute
  if (playingArtifactId.value !== null) {
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    playingArtifactId.value = null
    setTimeout(() => {
      playArtifactSound(activeItem.value)
    }, 150)
  }
}

function navigateItem(direction) {
  const len = items3D.value.length
  let newIdx = (activeIdx.value + direction + len) % len
  selectActiveIdx(newIdx)
}

function onIframeLoaded() {
  iframeLoading.value = false
}

// --- États du Mode Catalogue ---
const search = ref('')
const currentCategory = ref('all')
const showCatalog3DModal = ref(false)
const catalogActiveItem = ref(null)

const categories = [
  { label: 'Toutes les œuvres', value: 'all' },
  { label: 'Masques Rituels', value: 'Masques' },
  { label: 'Statues & Effigies', value: 'Statues' },
  { label: 'Objets Sacrés & Royaux', value: 'Sacres' },
  { label: 'Céramiques & Calebasses', value: 'Utilitaires' },
  { label: 'Architecture & Sites', value: 'Architecture' }
]

function openCatalog3DModal(item) {
  if (window.speechSynthesis) window.speechSynthesis.cancel()
  playingArtifactId.value = null
  catalogActiveItem.value = item
  showCatalog3DModal.value = true
}

function closeCatalog3DModal() {
  showCatalog3DModal.value = false
  catalogActiveItem.value = null
}

// Base de données des 12 objets 3D réels Sketchfab
const items3D = ref([
  {
    id: 'rg1991806',
    sketchfabId: 'f37ff264e47e4d218e21eb1656a6c393',
    name: 'R.G. 1991.806.MNG',
    category: 'Masques',
    image: '/images/galerie-3d/cover/R.G. 1991.806.MNG.png',
    desc: 'Masque anthropomorphe traditionnel de la Guinée Forestière sculpté à la main.',
    story: 'Ce masque anthropomorphe en bois sombre provient des collections historiques du Musée National de Guinée sous le code R.G 1991.806. Il était utilisé en Guinée Forestière au cours des rites de passage et d\'initiation des jeunes adultes, transmettant force spirituelle et autorité ancestrales.',
    freq: 220.00
  },
  {
    id: 'rg19948',
    sketchfabId: 'fdd8453ae341409a8097c0b684990923',
    name: 'R.G. 1994.8.MNG',
    category: 'Statues',
    image: '/images/galerie-3d/cover/nimba_portée.png',
    desc: 'Statue en bois de Basse-Guinée, symbole protecteur du village et du foyer.',
    story: 'Répertoriée sous le code R.G 1994.8, cette statue anthropomorphe incarne un esprit de protection. Disposée à l\'entrée des habitations familiales en Basse-Guinée, elle chassait les forces négatives et assurait la fécondité et la prospérité.',
    freq: 246.94
  },
  {
    id: 'rg2004082',
    sketchfabId: 'e6e9ee2dcfa343e1a472e1df84934b8f',
    name: 'R.G. 2004.082.MNG',
    category: 'Sacres',
    image: '/images/banner-mvg.jpeg',
    desc: 'Support rituel orné destiné à recevoir des offrandes sacrées.',
    story: 'Cet objet rituel (R.G 2004.082) en bois sculpté est le témoin d\'anciennes pratiques spirituelles guinéennes. Utilisé lors des prières communautaires, il recevait les libations destinées à apaiser les ancêtres et les dieux de la nature.',
    freq: 261.63
  },
  {
    id: 'rg20040092',
    sketchfabId: '0e17527f2bc148cb8c48a7da980f9ad5',
    name: 'R.G. 2004.0092.MNG',
    category: 'Utilitaires',
    image: '/images/galerie-3d/cover/R.G. 2004.0092.MNG.png',
    desc: 'Calebasse traditionnelle polie et gravée de motifs géométriques peuls.',
    story: 'Enregistrée sous la référence R.G 2004.0092, cette calebasse est typique du savoir-faire artisanal du Fouta Djallon. Ornée de motifs géométriques gravés au fer chaud, elle servait à conserver le lait frais ou le miel.',
    freq: 293.66
  },
  {
    id: 'fougoumba',
    sketchfabId: 'c4435b6577114ed28f19b6db75ce38cb',
    name: 'Case de Fougoumba',
    category: 'Architecture',
    image: '/images/galerie-3d/cover/Case de Fougoumba.png',
    desc: 'La case sacrée où se tenait le couronnement solennel des Almamys du Fouta.',
    story: 'La case de Fougoumba est un monument historique exceptionnel situé dans la préfecture de Dalaba. C\'est dans ce temple sacré à toit de chaume géant que s\'effectuait le rituel traditionnel de couronnement des souverains de l\'État théocratique du Fouta Djallon.',
    freq: 329.63
  },
  {
    id: 'dalaba',
    sketchfabId: 'a03dd58bbdbd4505b54c83d453fb6731',
    name: 'Habitation de Dalaba',
    category: 'Architecture',
    image: '/images/galerie-3d/cover/dalaba.png',
    desc: 'Case traditionnelle à toiture conique en paille typique de Moyenne-Guinée.',
    story: 'Cette modélisation 3D reproduit les habitations cylindriques à toit de chaume typiques de Moyenne-Guinée. Leurs structures épaisses et le chaume permettent de conserver une température agréable face aux fortes amplitudes thermiques des hauteurs du Fouta.',
    freq: 349.23
  },
  {
    id: 'rg1991394',
    sketchfabId: 'b9d3456de8cd429589c982cbe5eb3471',
    name: 'R.G. 1991.394.MNG',
    category: 'Utilitaires',
    image: '/images/galerie-3d/cover/R.G. 1991.394.MNG.png',
    desc: 'Jarre traditionnelle en terre cuite pour la conservation de l\'eau fraîche.',
    story: 'Cette jarre en argile modelée à la main (R.G 1991.394) provient de la Haute-Guinée. Sa surface texturée et ses légers décors peints servaient à la fois d\'esthétique et d\'isolation thermique pour rafraîchir l\'eau potable du foyer.',
    freq: 392.00
  },
  {
    id: 'nimba',
    sketchfabId: '8039d20c33d04a9c8100adad66442d77',
    name: 'Le Grand Masque Nimba',
    category: 'Masques',
    image: '/images/galerie-3d/cover/nimba.png',
    desc: 'Masque d\'épaule baga monumental représentant la déesse de la maternité et de la récolte.',
    story: 'Le masque Nimba (ou D\'mba) est l\'œuvre emblématique de la Guinée maritime. Représentant l\'idéal féminin de bonté et de force chez les Baga, ce masque d\'épaule géant est porté pour célébrer le travail de la terre, les moissons et les naissances.',
    freq: 440.00
  },
  {
    id: 'atshiol',
    sketchfabId: 'ea7b4ee811614c32aab14272a55d1a0a',
    name: 'Le Masque Atshiol',
    category: 'Masques',
    image: '/images/galerie-3d/cover/asthiol.png',
    desc: 'Masque cimier traditionnel zoomorphe représentant l\'esprit suprême protecteur.',
    story: 'Le masque Atshiol (A-Tshol) est une entité spirituelle majeure chez les peuples côtiers baga. Sculpté sous une forme combinant bec d\'oiseau et tête de reptile, il veillait à la cohésion sociale et intervenait lors des décisions de justice importantes.',
    freq: 493.88
  },
  {
    id: 'nimbaporte',
    sketchfabId: '661008aadd844d689be698aaae368c78',
    name: 'Nimba Porté avec Costume',
    category: 'Masques',
    image: '/images/galerie-3d/cover/nimba_portée.png',
    desc: 'Modélisation du danseur rituel revêtu du costume intégral en fibres de raphia.',
    story: 'Cette reconstitution montre le masque Nimba en pleine action rituelle. Le porteur dissimule son corps sous une épaisse jupe de fibres végétales de raphia. Ses yeux regardent à travers des fentes taillées au niveau de la poitrine de la structure en bois.',
    freq: 523.25
  },
  {
    id: 'kouranko',
    sketchfabId: 'bd6e7d8723e345eabf1fcb6741b89906',
    name: 'Le Masque Kouranko',
    category: 'Masques',
    image: '/images/galerie-3d/cover/masque_kouranko.png',
    desc: 'Masque zoomorphe en bois noirci utilisé par les confréries de chasseurs.',
    story: 'Ce masque provient des traditions du peuple Kouranko en Haute-Guinée. Porté par les confréries de chasseurs, il facilitait la connexion spirituelle avec les forces de la nature sauvage pour bénir et protéger les expéditions de traque.',
    freq: 587.33
  },
  {
    id: 'simogui',
    sketchfabId: '29f19921327d4bef8a013cc71b7db034',
    name: 'Le Masque Simogui',
    category: 'Masques',
    image: '/images/galerie-3d/cover/simogui.png',
    desc: 'Masque serpentiforme vertical incarnant l\'esprit de l\'eau.',
    story: 'Le masque Simogui représente le python ou serpent d\'eau stylisé. Mesurant parfois près d\'un mètre prés de cinquante de hauteur, il dansait lors des cérémonies d\'initiation côtières pour attirer la bienveillance des esprits de l\'eau sur les récoltes rizicoles.',
    freq: 659.25
  }
])

// Filtrage des éléments
const filteredItems = computed(() => {
  let res = items3D.value
  
  if (currentCategory.value !== 'all') {
    res = res.filter(item => item.category === currentCategory.value)
  }
  
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    res = res.filter(item => 
      item.name.toLowerCase().includes(q) || 
      item.desc.toLowerCase().includes(q) || 
      item.category.toLowerCase().includes(q)
    )
  }
  
  return res
})

// Pagination
const currentPage = ref(1)
const itemsPerPage = 6

const totalPages = computed(() => Math.ceil(filteredItems.value.length / itemsPerPage) || 1)

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredItems.value.slice(start, end)
})

watch([search, currentCategory], () => {
  currentPage.value = 1
})

function changePage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    const target = document.querySelector('.gal-controls')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
}

// Logique Audio Guide
const playingArtifactId = ref(null)
let currentUtterance = null

function playKoraPluck(frequency) {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = audioCtx.createOscillator()
    const gainNode = audioCtx.createGain()
    const filter = audioCtx.createBiquadFilter()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime)
    
    gainNode.gain.setValueAtTime(0.8, audioCtx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2)

    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(1000, audioCtx.currentTime)
    filter.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 1.0)

    osc.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(audioCtx.destination)

    osc.start()
    osc.stop(audioCtx.currentTime + 1.5)
  } catch (e) {
    console.error("Audio Context error:", e)
  }
}

function playArtifactSound(item) {
  if (!item) return
  if (playingArtifactId.value === item.id) {
    if (window.speechSynthesis) window.speechSynthesis.cancel()
    playingArtifactId.value = null
    return
  }

  if (window.speechSynthesis) window.speechSynthesis.cancel()
  playingArtifactId.value = item.id

  playKoraPluck(item.freq)

  if (window.speechSynthesis) {
    currentUtterance = new SpeechSynthesisUtterance(item.story)
    currentUtterance.lang = 'fr-FR'
    currentUtterance.rate = 1.0
    currentUtterance.pitch = 0.95

    currentUtterance.onend = () => {
      playingArtifactId.value = null
    }
    currentUtterance.onerror = () => {
      playingArtifactId.value = null
    }

    window.speechSynthesis.speak(currentUtterance)
  } else {
    setTimeout(() => {
      playingArtifactId.value = null
    }, 3000)
  }
}

onUnmounted(() => {
  if (window.speechSynthesis) window.speechSynthesis.cancel()
})
</script>

<style scoped>
.gal-shell {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Page Header / Hero */
.page-header-section {
  position: relative;
  border-radius: 24px;
  overflow: hidden;
  min-height: 420px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  box-shadow: 0 15px 35px rgba(89,55,22,0.15);
  margin-top: 10px;
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
    padding: 24px;
    min-height: 220px;
    border-radius: 16px;
    margin-top: 0;
  }
  .header-title {
    font-size: 1.8rem;
  }
  .header-subtitle {
    font-size: 0.9rem;
  }
}

/* Commutateur de Mode */
.gal-mode-container {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}

.gal-mode-selector {
  display: inline-flex;
  padding: 6px;
  background: rgba(132, 89, 54, 0.08);
  border: 1px solid rgba(132, 89, 54, 0.15);
  border-radius: 99px;
  gap: 4px;
}

html.theme-musee .gal-mode-selector {
  background: rgba(18, 20, 32, 0.6);
  border-color: rgba(212, 175, 55, 0.2);
}

.mode-toggle-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 22px;
  border-radius: 99px;
  border: none;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  color: var(--brun);
  background: transparent;
  transition: all 0.25s;
}

.mode-toggle-btn:hover {
  background: rgba(132, 89, 54, 0.05);
}

.mode-toggle-btn.active {
  background: linear-gradient(135deg, var(--brun), var(--or));
  color: white;
  box-shadow: 0 4px 14px rgba(89, 55, 22, 0.18);
}

/* ──────────────────────────────────────────────────────── */
/* ─── STYLES DU MODE EXPOSITION IMMERSIVE 3D ──────────── */
/* ──────────────────────────────────────────────────────── */
.immersive-museum-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 680px;
}

.museum-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  min-height: 520px;
}

@media(min-width: 992px) {
  .museum-layout {
    grid-template-columns: 340px 1fr;
  }
}

/* Panneau de Storytelling à Gauche */
.museum-sidebar {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(132, 89, 54, 0.15);
  border-radius: 24px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(89, 55, 22, 0.06);
}

html.theme-musee .museum-sidebar {
  background: rgba(18, 20, 32, 0.85) !important;
  border-color: rgba(212, 175, 55, 0.25) !important;
}

.museum-badge {
  display: inline-block;
  align-self: flex-start;
  background: var(--brun);
  color: white;
  padding: 4px 12px;
  border-radius: 99px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 12px;
}

.museum-title {
  font-size: 1.5rem;
  font-weight: 900;
  color: var(--brun);
  margin: 0 0 10px;
  line-height: 1.25;
}

.museum-desc {
  font-size: 0.9rem;
  line-height: 1.6;
  color: #555;
  margin-top: 14px;
  flex: 1;
}

html.theme-musee .museum-desc {
  color: rgba(255, 255, 255, 0.75) !important;
}

.museum-audio-box {
  margin-top: 24px;
  border-top: 1px dashed rgba(132, 89, 54, 0.15);
  padding-top: 20px;
}

.btn-museum-audio {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 20px;
  border-radius: 14px;
  border: none;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  background: linear-gradient(135deg, var(--brun), var(--or));
  color: white;
  box-shadow: 0 4px 14px rgba(89, 55, 22, 0.15);
  transition: all 0.25s;
}

.btn-museum-audio:hover {
  filter: brightness(1.06);
  transform: translateY(-1px);
}

.btn-museum-audio.playing {
  background: var(--or);
  animation: pulse-audio 1.5s infinite alternate;
}

.btn-museum-ar {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px 20px;
  border-radius: 14px;
  border: 1.5px solid rgba(132, 89, 54, 0.25);
  background: white;
  color: var(--brun);
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(89, 55, 22, 0.05);
  transition: all 0.25s;
}
html.theme-musee .btn-museum-ar {
  background: var(--blanc) !important;
  color: var(--brun) !important;
  border-color: rgba(212, 175, 55, 0.2) !important;
}
.btn-museum-ar:hover {
  background: rgba(132, 89, 54, 0.05);
  transform: translateY(-1px);
}
.ar-modal-box {
  width: 95%;
  max-width: 420px;
}
.ar-qrcode-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(89, 55, 22, 0.08);
}


/* Zone centrale 3D d'exposition */
.museum-display-area {
  position: relative;
  border-radius: 24px;
  border: 1px solid rgba(132, 89, 54, 0.15);
  background: #000;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 380px;
}

html.theme-musee .museum-display-area {
  border-color: rgba(212, 175, 55, 0.25) !important;
  box-shadow: 0 8px 32px rgba(212, 175, 55, 0.08);
}

.museum-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

.museum-help-tip {
  position: absolute;
  bottom: 8px;
  right: 12px;
  background: rgba(0, 0, 0, 0.7);
  color: rgba(255, 255, 255, 0.8);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.68rem;
  display: flex;
  align-items: center;
  gap: 6px;
  pointer-events: none;
  z-index: 5;
}

.museum-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  color: var(--brun);
  font-weight: 700;
  font-size: 1rem;
}

.spin-icon {
  animation: spin 1.2s infinite linear;
}

/* Barre de Contrôle Inférieure Vignettes */
.museum-footer {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(132, 89, 54, 0.15);
  border-radius: 24px;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 8px 32px rgba(89, 55, 22, 0.05);
}

html.theme-musee .museum-footer {
  background: rgba(18, 20, 32, 0.85) !important;
  border-color: rgba(212, 175, 55, 0.25) !important;
}

.nav-arrow {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1.5px solid rgba(132, 89, 54, 0.2);
  background: white;
  color: var(--brun);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.25s;
  flex-shrink: 0;
}

html.theme-musee .nav-arrow {
  background: var(--blanc) !important;
  color: var(--brun) !important;
  border-color: rgba(212, 175, 55, 0.2) !important;
}

.nav-arrow:hover {
  background: var(--brun);
  color: white;
  border-color: var(--brun);
  transform: scale(1.05);
}

.museum-thumbnails-scroll {
  flex: 1;
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 6px 4px;
  scroll-behavior: smooth;
  scrollbar-width: thin;
  scrollbar-color: var(--brun) transparent;
}

.museum-thumbnails-scroll::-webkit-scrollbar {
  height: 4px;
}

.museum-thumbnails-scroll::-webkit-scrollbar-thumb {
  background: var(--brun);
  border-radius: 4px;
}

.thumb-item {
  width: 80px;
  height: 72px;
  border-radius: 12px;
  border: 2px solid transparent;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.25s;
  opacity: 0.6;
}

.thumb-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-item.active {
  opacity: 1;
  border-color: var(--brun);
  box-shadow: 0 0 10px rgba(132, 89, 54, 0.3);
  transform: scale(1.04);
}

html.theme-musee .thumb-item.active {
  border-color: var(--brun);
  box-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
}

.thumb-caption {
  position: absolute;
  bottom: 0;
  inset-x: 0;
  background: rgba(0, 0, 0, 0.65);
  color: white;
  font-size: 0.58rem;
  text-align: center;
  padding: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 700;
}

/* ──────────────────────────────────────────────────────── */
/* ─── STYLES DU MODE CATALOGUE PAGINÉ ─────────────────── */
/* ──────────────────────────────────────────────────────── */
.gal-search-row {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

@media(min-width: 992px) {
  .gal-search-row {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.gal-search-wrap {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.gal-search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--brun);
  opacity: .5;
  pointer-events: none;
}

.gal-search-input {
  width: 100%;
  padding: 12px 16px 12px 40px;
  border: 2px solid #e8ddd0;
  border-radius: 999px;
  font-size: .92rem;
  background: var(--creme);
  color: var(--noir);
  outline: none;
  transition: all .25s;
}

.gal-search-input:focus {
  border-color: var(--or);
  background: #fff;
  box-shadow: 0 0 0 4px rgba(249,178,51,.1);
}

.category-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.cat-btn {
  padding: 10px 18px;
  border-radius: 99px;
  background: rgba(132, 89, 54, 0.05);
  border: 1px solid rgba(132, 89, 54, 0.15);
  color: var(--brun);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s;
}

.cat-btn:hover {
  background: rgba(132, 89, 54, 0.1);
  transform: translateY(-1px);
}

.cat-btn.active {
  background: linear-gradient(135deg, var(--brun), var(--or));
  color: white;
  border-color: var(--brun);
  box-shadow: 0 4px 12px rgba(89, 55, 22, 0.15);
}

/* Grille */
.gal-grid-container {
  min-height: 400px;
  margin-bottom: 40px;
}

.gal-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.gal-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 60px 20px;
  text-align: center;
}

.gal-empty-icon {
  width: 80px;
  height: 80px;
  background: rgba(132,89,54,.08);
  border: 2px dashed rgba(132,89,54,.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(132,89,54,.4);
}

.gal-empty p {
  color: var(--brun);
  opacity: .7;
  font-size: .95rem;
  margin: 0;
}

/* Carte */
.gal-card {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(132, 89, 54, 0.14);
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 16px rgba(89, 55, 22, 0.05);
  transition: all 0.28s cubic-bezier(.4,0,.2,1);
}

html.theme-musee .gal-card {
  background: rgba(18, 20, 32, 0.92) !important;
  border-color: rgba(212, 175, 55, 0.25) !important;
}

.gal-card-img-wrap {
  width: 100%;
  height: 180px;
  overflow: hidden;
  position: relative;
  border-bottom: 1px solid rgba(132, 89, 54, 0.1);
}

.gal-card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.gal-card:hover .gal-card-img {
  transform: scale(1.04);
}

.gal-card-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: var(--brun);
  color: white;
  padding: 4px 10px;
  border-radius: 99px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.gal-card-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.gal-card-title {
  margin: 0 0 8px;
  font-size: 1.15rem;
  font-weight: 900;
  color: var(--brun);
}

.gal-card-desc {
  margin: 0 0 20px;
  font-size: 0.85rem;
  line-height: 1.45;
  color: #666;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

html.theme-musee .gal-card-desc {
  color: rgba(255, 255, 255, 0.7) !important;
}

.gal-card-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.btn-3d-play, .btn-3d-audio {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s;
  border: none;
}

.btn-3d-play {
  background: linear-gradient(135deg, var(--brun), var(--or));
  color: white;
}

.btn-3d-play:hover {
  filter: brightness(1.08);
  transform: translateY(-1px);
}

.btn-3d-audio {
  background: rgba(132, 89, 54, 0.08);
  border: 1px solid rgba(132, 89, 54, 0.15);
  color: var(--brun);
}

.btn-3d-audio:hover {
  background: rgba(132, 89, 54, 0.14);
}

.btn-3d-audio.playing {
  background: var(--or);
  color: white;
  border-color: var(--or);
  animation: pulse-audio 1.5s infinite alternate;
}

/* Modale de secours Sketchfab */
.gal-3d-modal-box {
  width: 90%;
  max-width: 900px;
  padding: 0;
  overflow: hidden;
  border: 1px solid rgba(132, 89, 54, 0.2);
}

html.theme-musee .gal-3d-modal-box {
  border-color: rgba(212, 175, 55, 0.3) !important;
}

.sketchfab-iframe {
  width: 100%;
  height: 100%;
  display: block;
}

.btn-close-modal {
  position: absolute;
  right: 16px;
  top: 16px;
  background: transparent;
  border: none;
  color: var(--brun);
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.btn-close-modal:hover {
  opacity: 1;
}

/* Pagination styles */
.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 30px;
  margin-bottom: 40px;
}

.page-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 18px;
  border-radius: 99px;
  background: white;
  border: 1.5px solid rgba(132, 89, 54, 0.25);
  color: var(--brun);
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.25s;
}

html.theme-musee .page-btn {
  background: var(--blanc) !important;
  color: var(--brun) !important;
  border-color: rgba(212, 175, 55, 0.3) !important;
}

.page-btn:hover:not(:disabled) {
  background: var(--brun);
  color: white;
  border-color: var(--brun);
  transform: translateY(-1px);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}

.page-info {
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--brun);
}

/* Keyframes */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse-audio {
  from {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(249, 178, 51, 0.4);
  }
  to {
    transform: scale(1.02);
    box-shadow: 0 0 8px 4px rgba(249, 178, 51, 0.2);
  }
}
</style>
