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
          </select>
        </div>

        <div v-if="loading" class="empty-state">
          <AppIcon name="loader" :size="20" /> Chargement des enregistrements…
        </div>

        <div v-else-if="filteredRecords.length === 0" class="empty-state">
          Aucun enregistrement trouvé{{ filterPole ? ` pour ${filterPole}` : '' }}.
        </div>

        <div v-else class="record-list">
          <div class="record-item" v-for="rec in filteredRecords" :key="rec.id">
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

const filteredRecords = computed(() => {
  const records = [...airtable.suiviRecords].sort((a, b) => {
    if (a.Date > b.Date) return -1
    if (a.Date < b.Date) return 1
    return 0
  })
  if (!filterPole.value) return records
  return records.filter(r => r['Pôle concerné'] === filterPole.value)
})

function poleIconName(pole) {
  return { 'Pôle Photo': 'camera', 'Pôle 3D': 'box', 'Pôle Récit': 'message-circle' }[pole] || 'bar-chart'
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
  gap: 0.75rem;
}

.record-item {
  padding: 1rem;
  background: var(--bg-card);
  border-radius: 10px;
  border: 1px solid var(--border);
}

.record-header {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  align-items: center;
  margin-bottom: 0.6rem;
}

.record-pole {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  color: var(--text);
}

.record-group {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.record-date {
  margin-left: auto;
  font-size: 0.8rem;
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

.record-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1rem;
  margin-bottom: 0.4rem;
}

.stat-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.stat-chip strong {
  color: var(--text);
}

.record-obs {
  font-size: 0.82rem;
  color: var(--text-muted);
  font-style: italic;
  margin-top: 0.4rem;
  padding-top: 0.4rem;
  border-top: 1px solid var(--border);
}

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
