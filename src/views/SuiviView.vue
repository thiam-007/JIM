<template>
  <div>
    <SuiviPoleForm />

    <div class="form-card suivi-records" v-if="airtable.isConnected">
      <div class="fh fh-s">
        <div class="fh-icon"><AppIcon name="file-text" :size="26" /></div>
        <div class="fh-title">Enregistrements par Pôle</div>
        <div class="fh-sub">Historique des suivis saisis</div>
      </div>

      <div class="fb">
        <div class="filter-row">
          <label>Filtrer par pôle</label>
          <select v-model="filterPole">
            <option value="">Tous les pôles</option>
            <option value="Pôle Photo">Pôle Photo</option>
            <option value="Pôle 3D">Pôle 3D</option>
            <option value="Pôle Récit">Pôle Récit</option>
            <option value="Pôle Musique">Pôle Musique</option>
          </select>
        </div>

        <div v-if="loading" class="empty-state">
          <AppIcon name="loader" :size="20" /> Chargement des enregistrements…
        </div>

        <div v-else-if="filteredRecords.length === 0" class="empty-state">
          Aucun enregistrement trouvé{{ filterPole ? ` pour ${filterPole}` : '' }}.
        </div>

        <div v-else class="record-list">
          <div class="records-count">{{ filteredRecords.length }} enregistrement{{ filteredRecords.length > 1 ? 's' : '' }}</div>
          <div class="record-item" v-for="rec in visibleRecords" :key="rec.id">
            <div class="record-header">
              <span class="record-pole">
                <AppIcon :name="poleIconName(rec['Pôle concerné'])" :size="15" />
                {{ rec['Pôle concerné'] || '—' }}
              </span>
              <span class="record-group">
                <span class="dot-sm" :class="`dot-${(rec['Groupe attribué'] || '').toLowerCase()}`"></span>
                {{ rec['Groupe attribué'] || '' }} · {{ rec['Groupe ID'] || '—' }}
              </span>
              <span class="record-date">{{ rec.Date || '' }}</span>
            </div>
            <div class="record-stats">
              <span class="stat-chip">
                <AppIcon name="users" :size="13" />
                Passés : <strong>{{ rec['Participants passés'] ?? '—' }}</strong>
              </span>
              <span class="stat-chip">
                <AppIcon name="user" :size="13" />
                Actifs : <strong>{{ rec['Participants actifs'] ?? '—' }}</strong>
              </span>
              <span class="stat-chip">
                <AppIcon name="file-text" :size="13" />
                Contenus : <strong>{{ rec['Contenus produits'] ?? '—' }}</strong>
              </span>
            </div>
            <div class="record-obs" v-if="rec.Observations">{{ rec.Observations }}</div>
          </div>
          <button v-if="hasMore" class="btn-voir-plus" @click="visibleCount += PAGE_SIZE">
            <AppIcon name="chevron-down" :size="15" />
            Voir plus ({{ filteredRecords.length - visibleCount }} restants)
          </button>
        </div>
      </div>
    </div>

    <div class="form-card suivi-records" v-else>
      <div class="fb">
        <div class="info-block warning">
          <p>Connectez-vous à Airtable avec votre Personal Access Token pour voir les enregistrements.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import SuiviPoleForm from '../components/SuiviPoleForm.vue'
import AppIcon from '../components/AppIcon.vue'
import { useAirtableStore } from '../store/airtable'

const airtable = useAirtableStore()
const filterPole = ref('')
const loading = ref(false)
const PAGE_SIZE = 10
const visibleCount = ref(PAGE_SIZE)

const filteredRecords = computed(() => {
  const records = [...airtable.suiviRecords].sort((a, b) => {
    if (a.Date > b.Date) return -1
    if (a.Date < b.Date) return 1
    return 0
  })
  if (!filterPole.value) return records
  return records.filter(r => r['Pôle concerné'] === filterPole.value)
})

const visibleRecords = computed(() => filteredRecords.value.slice(0, visibleCount.value))
const hasMore = computed(() => visibleCount.value < filteredRecords.value.length)

watch(filterPole, () => { visibleCount.value = PAGE_SIZE })

function poleIconName(pole) {
  return { 'Pôle Photo': 'camera', 'Pôle 3D': 'box', 'Pôle Récit': 'message-circle', 'Pôle Musique': 'music' }[pole] || 'bar-chart'
}

async function loadData() {
  if (!airtable.isConnected) return
  loading.value = true
  await airtable.loadSuivi()
  loading.value = false
}

onMounted(loadData)

watch(() => airtable.isConnected, (connected) => {
  if (connected) loadData()
})
</script>

<style scoped>
.suivi-records {
  margin-top: 1.5rem;
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

.record-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.record-item {
  padding: 0.5rem 0.75rem;
  background: var(--bg-card);
  border-radius: 8px;
  border: 1px solid var(--border);
}

.record-header {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.75rem;
  align-items: center;
  margin-bottom: 0.3rem;
}

.record-pole {
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 700;
  font-size: 0.82rem;
  color: var(--text);
}

.record-group {
  display: flex;
  align-items: center;
  gap: 5px;
  color: var(--text-muted);
  font-size: 0.8rem;
}

.record-date {
  margin-left: auto;
  font-size: 0.74rem;
  color: var(--text-muted);
}

.dot-sm {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  display: inline-block;
}
.dot-rouge { background: #dc3545; }
.dot-jaune { background: #d4a017; }
.dot-vert  { background: #28a745; }
.dot-bleu  { background: #2563eb; }

.record-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.2rem 0.75rem;
  margin-bottom: 0.2rem;
}

.stat-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.76rem;
  color: var(--text-muted);
}

.stat-chip strong {
  color: var(--text);
}

.record-obs {
  font-size: 0.74rem;
  color: var(--text-muted);
  font-style: italic;
  margin-top: 0.25rem;
  padding-top: 0.25rem;
  border-top: 1px solid var(--border);
}

.records-count {
  font-size: .72rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .8px; color: #aaa; margin-bottom: 10px;
}
.btn-voir-plus {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  width: 100%; margin-top: 10px; padding: 12px;
  background: none; border: 1.5px dashed rgba(132,89,54,.25);
  border-radius: 12px; color: var(--brun); font-size: .82rem;
  font-weight: 700; cursor: pointer; transition: all .2s;
}
.btn-voir-plus:hover { background: rgba(132,89,54,.05); border-color: var(--or); }

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 2rem;
  color: var(--text-muted);
}

.info-block.warning {
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #ff6b35;
  background: rgba(255, 107, 53, 0.1);
}
</style>
