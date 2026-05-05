<template>
  <section class="stats-page">
    <div class="form-card">
      <div class="fh fh-a">
        <div class="fh-icon">📈</div>
        <div class="fh-title">Statistiques JIM 2026</div>
        <div class="fh-sub">Suivi des inscriptions et des participant·e·s par session</div>
      </div>
      <div class="fb">
        <p>Analysez les inscriptions enregistrées pour les activités et ateliers du programme. Les données sont reprises depuis Airtable si vous êtes connecté·e, et complétées par les enregistrements saisis localement.</p>

        <div class="stats-summary">
          <div class="stat-card">
            <strong>Total inscriptions</strong>
            <span>{{ totalRegistrations }}</span>
          </div>
          <div class="stat-card">
            <strong>Sessions actives</strong>
            <span>{{ sessionCount }}</span>
          </div>
          <div class="stat-card">
            <strong>Avis reçus</strong>
            <span>{{ totalAvis }}</span>
          </div>
          <div class="stat-card">
            <strong>Note moyenne</strong>
            <span>{{ averageRating.toFixed(1) }}/5</span>
          </div>
        </div>

        <div class="filter-row">
          <label>Filtrer par session</label>
          <select v-model="selectedSession">
            <option value="">Toutes les sessions</option>
            <option v-for="session in sessionTitles" :key="session" :value="session">{{ session }}</option>
          </select>
        </div>

        <div class="session-list" v-if="summaryEntries.length">
          <div class="session-item" v-for="entry in summaryEntries" :key="entry.session">
            <div class="session-meta">
              <div class="session-name">{{ entry.session }}</div>
              <div class="session-count">{{ entry.count }} participant·e·s</div>
            </div>
            <div class="session-bar-bg">
              <div class="session-bar" :style="{ width: `${entry.width}%` }"></div>
            </div>
          </div>
        </div>

        <div class="avis-section" v-if="airtable.avisRecords.length">
          <h3>Avis des visiteurs</h3>
          <div class="avis-list">
            <div class="avis-item" v-for="avis in airtable.avisRecords.slice(0, 10)" :key="avis.id">
              <div class="avis-rating">⭐ {{ avis.Note || 'N/A' }}/5</div>
              <div class="avis-comment">{{ avis.Commentaire || 'Aucun commentaire' }}</div>
              <div class="avis-date">{{ avis.Date || 'Date inconnue' }}</div>
            </div>
          </div>
          <p v-if="airtable.avisRecords.length > 10">... et {{ airtable.avisRecords.length - 10 }} autres avis</p>
        </div>

        <div class="empty-state" v-else-if="!summaryEntries.length && !airtable.avisRecords.length">
          <p>Aucun enregistrement trouvé pour le moment. Enregistrez d’abord des participant·e·s via la page Programme ou connectez-vous à Airtable.</p>
        </div>

        <div class="info-block" v-if="airtable.isConnected">
          <p>Les données Airtable sont chargées et utilisées pour générer ces statistiques.</p>
        </div>
        <div class="info-block warning" v-else>
          <p>Pour charger les données historisées, connectez-vous à Airtable avec votre Personal Access Token.</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useAirtableStore } from '../store/airtable'

const airtable = useAirtableStore()
const selectedSession = ref('')

const totalRegistrations = computed(() => airtable.totalRegistrations)
const sessionCount = computed(() => Object.keys(airtable.sessionCounts).length)
const sessionTitles = computed(() => Object.keys(airtable.sessionCounts).sort())
const totalAvis = computed(() => airtable.avisRecords.length)
const averageRating = computed(() => {
  const ratings = airtable.avisRecords.map(r => parseFloat(r.Note || 0)).filter(r => r > 0)
  return ratings.length ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0
})

const summaryEntries = computed(() => {
  const items = Object.entries(airtable.sessionCounts)
    .map(([session, count]) => ({ session, count }))
    .sort((a, b) => b.count - a.count)

  const filtered = selectedSession.value
    ? items.filter((item) => item.session === selectedSession.value)
    : items

  const maxCount = filtered.reduce((max, item) => Math.max(max, item.count), 0) || 1
  return filtered.map((item) => ({ ...item, width: (item.count / maxCount) * 100 }))
})

watch(
  () => airtable.isConnected,
  async (connected) => {
    if (connected) {
      try {
        await airtable.loadEventRegistrations()
        await airtable.loadAvis()
      } catch (error) {
        console.warn('Impossible de charger les statistiques Airtable :', error.message)
      }
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.stats-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--bg-card);
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
  border: 1px solid var(--border);
}

.stat-card strong {
  display: block;
  font-size: 0.9rem;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}

.stat-card span {
  font-size: 2rem;
  font-weight: bold;
  color: var(--or);
}

.filter-row {
  margin-bottom: 1rem;
}

.filter-row label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.filter-row select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: var(--bg);
  color: var(--text);
}

.session-list {
  margin-bottom: 2rem;
}

.session-item {
  margin-bottom: 1rem;
  padding: 1rem;
  background: var(--bg-card);
  border-radius: 8px;
  border: 1px solid var(--border);
}

.session-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.session-name {
  font-weight: 500;
}

.session-count {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.session-bar-bg {
  height: 8px;
  background: var(--bg);
  border-radius: 4px;
  overflow: hidden;
}

.session-bar {
  height: 100%;
  background: var(--or);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.avis-section {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border);
}

.avis-section h3 {
  margin-bottom: 1rem;
  color: var(--text);
}

.avis-list {
  margin-bottom: 1rem;
}

.avis-item {
  padding: 1rem;
  background: var(--bg-card);
  border-radius: 8px;
  border: 1px solid var(--border);
  margin-bottom: 0.5rem;
}

.avis-rating {
  font-weight: bold;
  color: var(--or);
  margin-bottom: 0.5rem;
}

.avis-comment {
  margin-bottom: 0.5rem;
}

.avis-date {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-muted);
}

.info-block {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 8px;
  background: var(--bg-card);
  border: 1px solid var(--border);
}

.info-block.warning {
  border-color: #ff6b35;
  background: rgba(255, 107, 53, 0.1);
}

@media (min-width: 768px) {
  .stats-summary {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
