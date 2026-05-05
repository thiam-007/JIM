<template>
  <section class="stats-page">
    <div class="form-card">
      <div class="fh fh-a">
        <div class="fh-icon"><AppIcon name="trending-up" :size="26" /></div>
        <div class="fh-title">Statistiques JIM 2026</div>
        <div class="fh-sub">Suivi des inscriptions et des participant·e·s par session</div>
      </div>
      <div class="fb">
        <div class="stats-summary">
          <div class="stat-card" v-reveal="0">
            <strong>Total inscriptions</strong>
            <span>{{ animatedTotal }}</span>
          </div>
          <div class="stat-card" v-reveal="100">
            <strong>Sessions actives</strong>
            <span>{{ sessionCount }}</span>
          </div>
          <div class="stat-card" v-reveal="200">
            <strong>Avis reçus</strong>
            <span>{{ totalAvis }}</span>
          </div>
          <div class="stat-card" v-reveal="300">
            <strong>Note moyenne</strong>
            <span>{{ averageRating.toFixed(1) }}<small>/5</small></span>
          </div>
        </div>

        <div class="filter-row" v-reveal="0">
          <label>Filtrer par session</label>
          <select v-model="selectedSession">
            <option value="">Toutes les sessions</option>
            <option v-for="session in sessionTitles" :key="session" :value="session">{{ session }}</option>
          </select>
        </div>

        <div class="session-list" v-if="summaryEntries.length" v-reveal="50">
          <div
            class="session-item"
            v-for="(entry, index) in summaryEntries"
            :key="entry.session"
            :style="{ animationDelay: `${index * 60}ms` }"
          >
            <div class="session-meta">
              <div class="session-name">{{ entry.session }}</div>
              <div class="session-count">
                <strong>{{ entry.count }}</strong> participant·e·s
              </div>
            </div>
            <div class="session-bar-bg">
              <div class="session-bar" :style="{ width: `${entry.width}%` }"></div>
            </div>
          </div>
        </div>

        <div class="avis-section" v-if="airtable.avisRecords.length" v-reveal="0">
          <h3>Avis des visiteurs</h3>
          <div class="avis-list">
            <div
              class="avis-item"
              v-for="(avis, index) in airtable.avisRecords.slice(0, 10)"
              :key="avis.id"
              :style="{ animationDelay: `${index * 50}ms` }"
            >
              <div class="avis-rating">
                <span v-for="n in 5" :key="n" class="avis-star" :class="{ lit: n <= (avis['Note de satisfaction'] || 0) }">
                  <AppIcon name="star" :size="14" />
                </span>
                <span class="avis-score">{{ avis['Note de satisfaction'] || 'N/A' }}/5</span>
              </div>
              <div class="avis-name">{{ avis['Nom et Prénom'] || 'Anonyme' }}</div>
              <div class="avis-comment" v-if="avis['Découverte']">{{ avis['Découverte'] }}</div>
              <div class="avis-date">{{ avis.Date || '' }}</div>
            </div>
          </div>
          <p v-if="airtable.avisRecords.length > 10" class="more-hint">
            + {{ airtable.avisRecords.length - 10 }} autres avis
          </p>
        </div>

        <div class="empty-state" v-else-if="!summaryEntries.length && !airtable.avisRecords.length" v-reveal="0">
          <AppIcon name="bar-chart" :size="40" />
          <p>Aucun enregistrement trouvé pour le moment. Enregistrez d'abord des participant·e·s via la page Programme ou connectez-vous à Airtable.</p>
        </div>

      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useAirtableStore } from '../store/airtable'
import AppIcon from '../components/AppIcon.vue'

const airtable = useAirtableStore()
const selectedSession = ref('')

const totalRegistrations = computed(() => airtable.totalRegistrations)
const sessionCount = computed(() => Object.keys(airtable.sessionCounts).length)
const sessionTitles = computed(() => Object.keys(airtable.sessionCounts).sort())
const totalAvis = computed(() => airtable.avisRecords.length)
const averageRating = computed(() => {
  const ratings = airtable.avisRecords.map(r => parseFloat(r['Note de satisfaction'] || 0)).filter(r => r > 0)
  return ratings.length ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : 0
})

// Animated counter
const animatedTotal = ref(0)
watch(totalRegistrations, (newVal) => {
  const start = animatedTotal.value
  const end = newVal
  const duration = 700
  const startTime = performance.now()
  function update(now) {
    const progress = Math.min((now - startTime) / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    animatedTotal.value = Math.round(start + (end - start) * eased)
    if (progress < 1) requestAnimationFrame(update)
  }
  requestAnimationFrame(update)
}, { immediate: true })

const summaryEntries = computed(() => {
  const items = Object.entries(airtable.sessionCounts)
    .map(([session, count]) => ({ session, count }))
    .sort((a, b) => b.count - a.count)

  const filtered = selectedSession.value
    ? items.filter(item => item.session === selectedSession.value)
    : items

  const maxCount = filtered.reduce((max, item) => Math.max(max, item.count), 0) || 1
  return filtered.map(item => ({ ...item, width: (item.count / maxCount) * 100 }))
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

.stat-card span small {
  font-size: 1rem;
  opacity: 0.6;
}

.filter-row { margin-bottom: 1.5rem; }
.filter-row label { display: block; margin-bottom: 0.5rem; }

.session-list { margin-bottom: 2rem; }

.session-item {
  margin-bottom: 1rem;
  padding: 1rem 1.2rem;
  background: rgba(255,255,255,.9);
  border-radius: 14px;
  border: 1px solid #e8ddd0;
  animation: fadeInUp 0.45s ease-out backwards;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.session-item:hover {
  transform: translateX(4px);
  box-shadow: 0 6px 18px rgba(132,89,54,.1);
}

.session-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.6rem;
}

.session-name { font-weight: 600; color: var(--brun); font-size: .9rem; }
.session-count { color: var(--or); font-size: .85rem; }
.session-count strong { font-weight: 900; }

.session-bar-bg {
  height: 8px;
  background: rgba(132,89,54,.1);
  border-radius: 4px;
  overflow: hidden;
}

.session-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--brun), var(--or));
  border-radius: 4px;
  transition: width 0.8s cubic-bezier(.22, 1, .36, 1);
}

.avis-section { margin-top: 2rem; padding-top: 2rem; border-top: 1px solid #e8ddd0; }
.avis-section h3 { margin-bottom: 1rem; }
.avis-list { margin-bottom: 1rem; }

.avis-item {
  padding: 1rem 1.2rem;
  background: rgba(255,255,255,.9);
  border-radius: 12px;
  border: 1px solid #e8ddd0;
  margin-bottom: 0.6rem;
  animation: fadeInUp 0.45s ease-out backwards;
  transition: transform 0.2s ease;
}
.avis-item:hover { transform: translateX(4px); }

.avis-rating {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 0.4rem;
}
.avis-star { color: #ddd; transition: color 0.15s; }
.avis-star.lit { color: var(--gold); }
.avis-score { font-weight: 700; color: var(--or); font-size: .82rem; margin-left: 6px; }
.avis-name { font-size: .82rem; font-weight: 700; color: var(--brun); margin-bottom: 0.2rem; }
.avis-comment { font-size: .88rem; color: var(--noir); margin-bottom: 0.3rem; }
.avis-date { font-size: .75rem; color: #999; }

.more-hint { font-size: .8rem; color: #999; font-style: italic; margin-top: 0.5rem; }

.empty-state {
  text-align: center;
  padding: 3rem 2rem;
  color: #bbb;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}
.empty-state p { color: #999; max-width: 360px; line-height: 1.6; }

.info-block {
  margin-top: 1.5rem;
  padding: 1rem 1.2rem;
  border-radius: 12px;
  background: #edf7ee;
  border: 1px solid rgba(76,175,80,.25);
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: .88rem;
  color: #2e7d32;
}
.info-block p { margin: 0; }
.info-block.warning {
  background: #fffaf0;
  border-color: rgba(249,178,51,.35);
  color: #7a5500;
}

@media (min-width: 768px) {
  .stats-summary { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
