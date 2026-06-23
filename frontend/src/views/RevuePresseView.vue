<template>
  <div class="actualites-wrapper">

    <!-- En-tête / Hero Section -->
    <section class="page-header-section" v-reveal="0">
      <div class="header-bg">
        <img src="/images/banner_actualites.png" alt="" class="header-bg-img-blur" />
        <img src="/images/banner_actualites.png" alt="Actualités Banner" class="header-bg-img-contain" />
        <div class="header-overlay"></div>
      </div>
      <div class="header-content">
        <span class="header-badge">Musée Virtuel de Guinée</span>
        <h1 class="header-title">Revue de Presse</h1>
        <p class="header-subtitle">Découvrez ce que les médias disent de notre projet et de nos expositions.</p>
      </div>
    </section>

    <!-- Section Principale avec Recherche -->
    <section class="main-content-section" v-reveal="100">
      <div class="filter-bar-wrap glass">
        <div class="search-input-wrap">
          <AppIcon name="search" :size="18" class="search-icon" />
          <input 
            type="text" 
            v-model="searchQuery" 
            placeholder="Rechercher par média, titre ou mot-clé..." 
            class="search-input"
          />
          <button v-if="searchQuery" @click="searchQuery = ''" class="clear-search-btn">
            <AppIcon name="x" :size="16" />
          </button>
        </div>
      </div>

      <!-- Chargement -->
      <div v-if="loading" class="loader-state py-4 text-center">
        <AppIcon name="loader" class="spin mb-2" :size="32" />
        <p>Chargement de la revue de presse...</p>
      </div>

      <!-- Liste vide -->
      <div v-else-if="filteredRevue.length === 0" class="empty-state py-4 text-center glass">
        <AppIcon name="award" :size="48" class="opacity-50 mb-2" />
        <h3>Aucun article trouvé</h3>
        <p>Ajustez votre recherche ou revenez plus tard.</p>
        <button v-if="searchQuery" @click="searchQuery = ''" class="btn-primary-custom mt-2 inline-flex">
          Réinitialiser la recherche
        </button>
      </div>

      <!-- Grille des articles -->
      <div v-else>
        <div class="news-cards-grid">
          <div 
            v-for="article in paginatedRevue" 
            :key="article.id" 
            class="news-card glass"
            v-reveal="150"
          >
            <!-- Si l'article a une image, on l'affiche. Sinon, un encart avec le nom du média -->
            <div class="news-img-wrap" style="height: 180px; background: rgba(132,89,54,0.05); padding: 20px;">
              <img v-if="article.image_url" :src="article.image_url" :alt="article.media_nom" class="news-card-img" style="object-fit: contain; width: 100%; height: 100%;" loading="lazy" />
              <div v-else style="display:flex; height: 100%; align-items:center; justify-content:center; color:rgba(132,89,54,0.4); font-size:18px; font-weight:900; text-transform: uppercase;">
                {{ article.media_nom }}
              </div>
              <div class="news-date-badge">{{ formatShortDate(article.date_publication) }}</div>
            </div>
            
            <div class="news-content-wrap">
              <div class="media-name-badge">{{ article.media_nom }}</div>
              <h3 class="news-card-title">{{ article.titre }}</h3>
              <p v-if="article.description" class="news-card-desc">{{ article.description }}</p>
              
              <a v-if="article.url_lien" :href="article.url_lien" target="_blank" rel="noopener noreferrer" class="news-link">
                Lire l'article original <AppIcon name="external-link" :size="14" />
              </a>
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
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useApiStore } from '../store/api.js'
import AppIcon from '../components/AppIcon.vue'
import { animate, stagger } from 'animejs'

const api = useApiStore()

const searchQuery = ref('')
const loading = ref(false)
const revuePresse = ref([])

onMounted(async () => {
  loading.value = true
  try {
    const data = await api.get('/api/revue-presse')
    revuePresse.value = data || []
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
})

const filteredRevue = computed(() => {
  const q = searchQuery.value.toLowerCase().trim()
  if (!q) return revuePresse.value
  return revuePresse.value.filter(news => 
    (news.titre && news.titre.toLowerCase().includes(q)) || 
    (news.description && news.description.toLowerCase().includes(q)) ||
    (news.media_nom && news.media_nom.toLowerCase().includes(q))
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

watch(searchQuery, () => {
  currentPage.value = 1
})

function changePage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

watch(filteredRevue, async (newVal) => {
  if (newVal && newVal.length > 0) {
    await nextTick()
    animate('.news-card', {
      translateY: [40, 0],
      opacity: [0, 1],
      delay: stagger(100),
      duration: 800,
      easing: 'easeOutCubic'
    })
  }
}, { immediate: true })

function formatShortDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric'
    }).format(new Date(dateStr))
  } catch { return dateStr }
}
</script>

<style scoped>
.actualites-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 40px;
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

/* Filter bar */
.filter-bar-wrap {
  border-radius: var(--radius);
  padding: 16px 24px;
  border: 1px solid rgba(132, 89, 54, 0.12);
  box-shadow: 0 8px 24px rgba(89, 55, 22, 0.04);
  margin-bottom: 28px;
}
.search-input-wrap {
  display: flex;
  align-items: center;
  position: relative;
  background: var(--creme);
  border: 2px solid #e8ddd0;
  border-radius: 14px;
  padding: 4px 16px;
  transition: var(--trans);
}
.search-input-wrap:focus-within {
  border-color: var(--or);
  background: var(--blanc);
  box-shadow: 0 0 0 4px rgba(249, 178, 51, 0.1);
  transform: translateY(-1px);
}
.search-icon {
  color: var(--brun);
  opacity: 0.7;
  margin-right: 12px;
}
.search-input {
  border: none;
  background: transparent;
  outline: none;
  width: 100%;
  padding: 10px 0;
  font-size: 0.95rem;
  color: var(--noir);
}
.clear-search-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--brun);
  opacity: 0.6;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s;
}
.clear-search-btn:hover {
  opacity: 1;
}

/* News cards grid */
.news-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 28px;
}
.news-card {
  border-radius: var(--radius);
  overflow: hidden;
  border: 1px solid rgba(132, 89, 54, 0.12);
  box-shadow: 0 10px 28px rgba(89, 55, 22, 0.05);
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.news-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 16px 36px rgba(89, 55, 22, 0.12);
  border-color: rgba(132, 89, 54, 0.25);
}
.news-img-wrap {
  position: relative;
  width: 100%;
  overflow: hidden;
}
.news-card-img {
  transition: transform 0.5s ease;
}
.news-card:hover .news-card-img {
  transform: scale(1.05);
}
.news-date-badge {
  position: absolute;
  bottom: 12px;
  left: 12px;
  background: rgba(26, 16, 8, 0.85);
  color: var(--gold);
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.72rem;
  font-weight: 700;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(249, 178, 51, 0.25);
}
.media-name-badge {
  font-size: 0.75rem;
  font-weight: 800;
  color: var(--brun);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
}
.news-content-wrap {
  padding: 24px;
  display: flex;
  flex-direction: column;
  flex: 1;
}
.news-card-title {
  margin: 0 0 10px;
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--brun-fonce);
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.news-card-desc {
  margin: 0 0 18px;
  font-size: 0.86rem;
  line-height: 1.5;
  color: #555;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.news-link {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--rouge);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: transform 0.2s;
  margin-top: auto;
  text-decoration: none;
}
.news-card:hover .news-link {
  transform: translateX(4px);
  text-decoration: underline;
}

/* Glassmorphism style */
.glass {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
}

/* Loading & Empty states */
.loader-state, .empty-state {
  border-radius: var(--radius);
  padding: 48px;
}
.empty-state {
  border: 1.5px dashed rgba(132, 89, 54, 0.2);
}
.empty-state h3 {
  margin: 12px 0 6px;
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--brun);
}
.empty-state p {
  margin: 0;
  font-size: 0.86rem;
  color: #666;
}
.btn-primary-custom {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, var(--brun), var(--or));
  color: #fff;
  border: none;
  border-radius: 12px;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.25s;
  box-shadow: 0 6px 20px rgba(89, 55, 22, 0.25);
  margin-top: 14px;
}
.btn-primary-custom:hover {
  transform: translateY(-2px);
  filter: brightness(1.08);
  box-shadow: 0 10px 24px rgba(89, 55, 22, 0.35);
}

.pagination-controls { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 30px; }
.page-btn { padding: 8px 16px; background: rgba(132,89,54,.1); border: none; border-radius: 999px; display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 700; color: var(--brun); transition: all .2s; }
.page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.page-btn:not(:disabled):hover { background: rgba(132,89,54,.2); }
.page-info { font-size: .9rem; font-weight: 700; color: var(--brun-fonce); }

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
  .filter-bar-wrap {
    padding: 12px 16px;
  }
}
</style>
