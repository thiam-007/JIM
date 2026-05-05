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

        <div class="empty-state" v-else>
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
  gap: 14px;
  margin-bottom: 20px;
}
.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  margin-bottom: 20px;
}
.filter-row label {
  font-size: .85rem;
  font-weight: 700;
  color: var(--brun);
  text-transform: uppercase;
}
.filter-row select {
  width: 100%;
  max-width: 420px;
}
.session-list {
  display: grid;
  gap: 14px;
  margin-bottom: 20px;
}
.session-item {
  padding: 16px;
  background: var(--creme);
  border: 1px solid #e8ddd0;
  border-radius: 14px;
}
.session-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.session-name {
  font-weight: 700;
  color: var(--brun);
}
.session-count {
  color: var(--rouge);
  font-weight: 800;
}
.session-bar-bg {
  height: 12px;
  background: #f3e8dd;
  border-radius: 999px;
  overflow: hidden;
}
.session-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--or), var(--rouge));
  border-radius: 999px;
}
.empty-state {
  padding: 18px;
  background: #fff7e6;
  border: 1px solid #f1d7b3;
  border-radius: 14px;
}
.info-block {
  margin-top: 18px;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(132, 89, 54, .08);
  color: var(--brun);
}
.info-block.warning {
  background: rgba(177, 34, 42, .08);
}
</style>
