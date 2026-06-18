<template>
  <div class="detail-wrapper">
    <!-- Error/Loading states -->
    <div v-if="api.loading && !currentNews" class="loader-state py-4 text-center glass" v-reveal="50">
      <AppIcon name="loader" class="spin mb-2" :size="32" />
      <p>Chargement de l'article...</p>
    </div>

    <div v-else-if="!currentNews" class="empty-state py-4 text-center glass" v-reveal="50">
      <AppIcon name="alert-triangle" :size="48" class="opacity-50 mb-2 text-red" />
      <h3>Article introuvable</h3>
      <p>L'article que vous cherchez n'existe pas ou a été supprimé.</p>
      <RouterLink to="/actualites" class="btn-primary-custom mt-2 inline-flex">
        Retourner aux actualités
      </RouterLink>
    </div>

    <div v-else class="detail-grid" v-reveal="100">
      <!-- Article Content -->
      <article class="article-main form-card">
        <div class="article-banner">
          <img :src="currentNews.imageDetailUrl" :alt="currentNews.titre" class="banner-img" @error="($event.target.src = '/images/side-photo.jpeg')" />
          <div class="article-meta-overlay">
            <span class="date-badge"><AppIcon name="calendar" :size="12" /> {{ currentNews.date_evenement ? formatDate(currentNews.date_evenement) : 'À venir' }}</span>
          </div>
        </div>

        <div class="article-body">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap;">
            <h1 class="article-title" style="margin: 0;">{{ currentNews.titre }}</h1>
            <button class="btn-primary-custom" @click="shareNews" style="padding: 8px 14px; font-size: 0.85rem; width: auto; flex-shrink: 0;">
              <AppIcon name="share-2" :size="14" /> Partager
            </button>
          </div>
          <p class="article-lead mt-3">{{ currentNews.description }}</p>
          <div class="article-divider"></div>
          <div class="article-content markdown-body" v-html="renderMarkdown(currentNews.contenu)"></div>
        </div>
      </article>

      <!-- Sidebar Suggestions -->
      <aside class="article-sidebar">
        <div class="sidebar-block form-card">
          <div class="sidebar-header">
            <h3>À lire également</h3>
            <div class="title-divider"></div>
          </div>
          <div class="sidebar-body">
            <div 
              v-for="news in suggestions" 
              :key="news.id" 
              class="suggestion-item"
              @click="readNews(news.id)"
            >
              <div class="suggestion-img-wrap">
                <img :src="news.imageUrl" :alt="news.titre" class="suggestion-img" loading="lazy" @error="($event.target.src = '/images/side-photo.jpeg')" />
              </div>
              <div class="suggestion-info">
                <h4 class="suggestion-title">{{ news.titre }}</h4>
                <span class="suggestion-date">{{ news.date_evenement ? formatShortDate(news.date_evenement) : 'À venir' }}</span>
              </div>
            </div>
            <div v-if="suggestions.length === 0" class="empty-suggestions">
              <p>Aucun autre article disponible.</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useApiStore } from '../store/api.js'
import AppIcon from '../components/AppIcon.vue'
import { renderMarkdown } from '../utils/markdown.js'

const route = useRoute()
const router = useRouter()
const api = useApiStore()

onMounted(async () => {
  if (api.actualites.length === 0) {
    await api.fetchActualites()
  }
})

// Find current news item
const currentNews = computed(() => {
  const newsId = route.params.id
  return (api.actualites || []).find(n => String(n.id) === String(newsId))
})

// Suggestions: other articles excluding the current one, maximum 3
const suggestions = computed(() => {
  const newsId = route.params.id
  return (api.actualites || [])
    .filter(n => String(n.id) !== String(newsId))
    .slice(0, 3)
})

function readNews(id) {
  router.push({ name: 'ActualiteDetail', params: { id } })
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date(dateStr))
  } catch { return dateStr }
}

function formatShortDate(dateStr) {
  if (!dateStr) return ''
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric'
    }).format(new Date(dateStr))
  } catch { return dateStr }
}

async function shareNews() {
  if (!currentNews.value) return
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  const shareLink = `${backendUrl}/api/share/actualite/${currentNews.value.id}`
  
  if (navigator.share) {
    try {
      await navigator.share({
        title: currentNews.value.titre,
        text: currentNews.value.description ? currentNews.value.description.slice(0, 100) + '...' : 'Lisez cet article du Musée Virtuel de Guinée',
        url: shareLink
      })
    } catch (err) {
      console.error('Erreur lors du partage', err)
    }
  } else {
    try {
      await navigator.clipboard.writeText(shareLink)
      alert("Lien de partage copié dans le presse-papier !")
    } catch (err) {
      alert("Impossible de copier le lien.")
    }
  }
}
</script>

<style scoped>
.detail-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 40px;
}

.public-breadcrumbs {
  margin-top: 10px;
  margin-bottom: 4px;
}

/* Detail grid layout */
.detail-grid {
  display: grid;
  grid-template-columns: 2.2fr 1fr;
  gap: 28px;
  align-items: start;
}

/* Main article block */
.article-main {
  box-shadow: var(--shadow);
  border: 1px solid rgba(132, 89, 54, 0.15);
}
.article-banner {
  position: relative;
  height: 380px;
  width: 100%;
  overflow: hidden;
  border-bottom: 1.5px solid rgba(132, 89, 54, 0.12);
}
.banner-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.article-meta-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 24px;
  background: linear-gradient(0deg, rgba(26,16,8,0.8) 0%, transparent 100%);
  display: flex;
  align-items: flex-end;
}
.date-badge {
  background: rgba(26, 16, 8, 0.7);
  color: var(--gold);
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.78rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(249, 178, 51, 0.2);
}

.article-body {
  padding: 36px 40px;
  background: var(--surface);
}
.article-title {
  font-size: 2.2rem;
  font-weight: 900;
  color: var(--brun);
  margin: 0 0 16px;
  line-height: 1.25;
}
.article-lead {
  font-size: 1.1rem;
  line-height: 1.6;
  color: #444;
  margin: 0 0 24px;
  font-weight: 600;
  font-style: italic;
}
.article-divider {
  width: 60px;
  height: 4px;
  background: var(--rouge);
  border-radius: 2px;
  margin-bottom: 28px;
}
.article-content {
  font-size: 0.95rem;
  line-height: 1.75;
  color: #333;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}
/* Styles Markdown */
.markdown-body :deep(p) { margin-bottom: 1em; }
.markdown-body :deep(strong) { font-weight: 800; color: var(--brun); }
.markdown-body :deep(ul) { padding-left: 24px; margin-bottom: 1em; list-style-type: disc; }
.markdown-body :deep(ol) { padding-left: 24px; margin-bottom: 1em; list-style-type: decimal; }
.markdown-body :deep(li) { margin-bottom: 0.5em; }
.markdown-body :deep(h1), .markdown-body :deep(h2), .markdown-body :deep(h3) { color: var(--brun); margin-top: 1.5em; margin-bottom: 0.5em; }
.markdown-body :deep(blockquote) { border-left: 4px solid var(--or); padding-left: 16px; color: #555; font-style: italic; background: rgba(249, 178, 51, 0.05); margin: 1em 0; padding: 10px 16px; border-radius: 0 8px 8px 0; }
.markdown-body :deep(a) { color: var(--rouge); text-decoration: underline; font-weight: 600; }

/* Sidebar block */
.article-sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.sidebar-block {
  border: 1px solid rgba(132, 89, 54, 0.15);
  background: var(--surface);
}
.sidebar-header {
  padding: 20px 24px 14px;
  border-bottom: 1px solid rgba(132, 89, 54, 0.08);
}
.sidebar-header h3 {
  font-size: 1.05rem;
  font-weight: 900;
  color: var(--brun);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin: 0 0 6px;
}
.title-divider {
  width: 30px;
  height: 3px;
  background: var(--or);
  border-radius: 1.5px;
}
.sidebar-body {
  padding: 18px 24px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* Suggestion items */
.suggestion-item {
  display: flex;
  gap: 12px;
  cursor: pointer;
  align-items: center;
  transition: transform 0.25s ease;
}
.suggestion-item:hover {
  transform: translateX(4px);
}
.suggestion-img-wrap {
  width: 70px;
  height: 70px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid rgba(132, 89, 54, 0.1);
}
.suggestion-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.suggestion-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.suggestion-title {
  margin: 0;
  font-size: 0.86rem;
  font-weight: 800;
  color: var(--noir);
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.suggestion-date {
  font-size: 0.72rem;
  color: #777;
  font-weight: 600;
}
.empty-suggestions {
  font-size: 0.84rem;
  color: #888;
  font-style: italic;
  text-align: center;
  padding: 10px 0;
}

/* States styling */
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
.text-red {
  color: var(--rouge);
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
}
.btn-primary-custom:hover {
  transform: translateY(-2px);
  filter: brightness(1.08);
  box-shadow: 0 10px 24px rgba(89, 55, 22, 0.35);
}

@media (max-width: 900px) {
  .detail-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

@media (max-width: 600px) {
  .article-banner {
    height: 240px;
  }
  .article-body {
    padding: 24px 20px;
  }
  .article-title {
    font-size: 1.6rem;
  }
  .article-lead {
    font-size: 0.95rem;
  }
  .article-content {
    font-size: 0.88rem;
  }
}
</style>
