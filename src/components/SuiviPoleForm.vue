<template>
  <div class="form-panel active">
    <div class="form-card">
      <div class="fh fh-s">
        <div class="fh-icon">📊</div>
        <div class="fh-title">Suivi par Pôle</div>
        <div class="fh-sub">Renseigné par le·la référent·e après chaque rotation de groupe</div>
      </div>
      <div class="fb">
        <div class="fg">
          <label>Pôle concerné <span class="req">*</span></label>
          <div class="pc">
            <div class="pcard" :class="{ sel: pole === 'Pôle Photo' }" @click="pickPole('Pôle Photo')"><span class="pck">✓</span><div class="pi">📸</div><div class="pn">Pôle Photo</div></div>
            <div class="pcard" :class="{ sel: pole === 'Pôle 3D' }" @click="pickPole('Pôle 3D')"><span class="pck">✓</span><div class="pi">🧊</div><div class="pn">Pôle 3D</div></div>
            <div class="pcard" :class="{ sel: pole === 'Pôle Récit' }" @click="pickPole('Pôle Récit')"><span class="pck">✓</span><div class="pi">🗣️</div><div class="pn">Pôle Récit</div></div>
          </div>
        </div>

        <div class="fg" v-if="pole">
          <label>Groupe <span class="req">*</span></label>
          <div v-if="loadingGroups" class="groups-loading">⏳ Chargement des groupes…</div>
          <div v-else-if="availableGroups.length === 0" class="groups-empty">
            ✅ Tous les groupes enregistrés ont déjà été saisis pour ce pôle.
          </div>
          <div v-else class="group-select-list">
            <div
              v-for="g in availableGroups"
              :key="g.groupId"
              class="group-option"
              :class="{ sel: groupId === g.groupId, ['gc-' + g.color.toLowerCase()]: true }"
              @click="pickGroup(g)"
            >
              <span class="go-dot">{{ colorDot(g.color) }}</span>
              <span class="go-id">{{ g.groupId }}</span>
              <span class="go-info">{{ g.color }} · {{ g.count }} pers.</span>
            </div>
          </div>
        </div>

        <template v-if="groupId">
          <div class="sd"><div class="sl"></div><span>Données de participation</span><div class="sl" style="background:linear-gradient(90deg,transparent,var(--rouge))"></div></div>

          <div class="fr">
            <div class="fg"><label>Participants passé(e)s <span class="req">*</span></label><input type="number" min="0" placeholder="0" v-model="passed" /></div>
            <div class="fg"><label>Participants actif(ves) <span class="req">*</span></label><input type="number" min="0" placeholder="0" v-model="active" /></div>
          </div>
          <div class="fg"><label>Contenus produits <span class="req">*</span></label><input type="number" min="0" placeholder="Nb de photos / modèles 3D / récits…" v-model="content" /></div>
          <div class="fg"><label>Observations et commentaires</label><textarea placeholder="Fluide · Attente · Problème technique · Forte participation…" v-model="notes"></textarea></div>

          <button class="bsub bsub-s" :disabled="submitting" @click="submitForm">
            <span>{{ submitting ? '⏳ Enregistrement…' : '✓ Enregistrer le suivi' }}</span>
          </button>
        </template>

        <div class="emsg" :class="{ on: errorMessage }">⚠️ {{ errorMessage || 'Veuillez remplir tous les champs obligatoires.' }}</div>
        <div class="omsg" :class="{ on: submitted }">
          <span class="oico">✅</span>
          <h3>Suivi enregistré !</h3>
          <p>Les données du pôle ont bien été sauvegardées dans Airtable.</p>
          <button class="breset" @click="resetForm">+ Nouveau suivi</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAirtableStore } from '../store/airtable'

const airtable = useAirtableStore()
const pole = ref('')
const groupId = ref('')
const groupColor = ref('')
const passed = ref('')
const active = ref('')
const content = ref('')
const notes = ref('')
const errorMessage = ref('')
const submitted = ref(false)
const submitting = ref(false)
const loadingGroups = ref(false)

// IDs des groupes déjà saisis pour le pôle sélectionné
const doneGroupIds = computed(() => {
  if (!pole.value) return new Set()
  return new Set(
    airtable.suiviRecords
      .filter(r => r['Pôle concerné'] === pole.value)
      .map(r => r['Groupe ID'])
      .filter(Boolean)
  )
})

// Groupes de l'accueil qui n'ont pas encore été traités pour ce pôle
const availableGroups = computed(() => {
  return airtable.accueilRecords
    .filter(r => r['Groupe ID'] && !doneGroupIds.value.has(r['Groupe ID']))
    .map(r => ({
      groupId: r['Groupe ID'],
      color: r['Groupe attribué'] || '',
      count: r['Nombre de personnes'] || 0,
      profile: r['Profil du public'] || ''
    }))
    .sort((a, b) => a.groupId.localeCompare(b.groupId))
})

function colorDot(color) {
  return { Rouge: '🔴', Jaune: '🟡', Vert: '🟢' }[color] || '⚪'
}

function pickPole(value) {
  pole.value = value
  groupId.value = ''
  groupColor.value = ''
}

function pickGroup(g) {
  groupId.value = g.groupId
  groupColor.value = g.color
}

function resetForm() {
  pole.value = ''
  groupId.value = ''
  groupColor.value = ''
  passed.value = ''
  active.value = ''
  content.value = ''
  notes.value = ''
  errorMessage.value = ''
  submitted.value = false
  submitting.value = false
}

async function loadData() {
  if (!airtable.isConnected) return
  loadingGroups.value = true
  await Promise.all([airtable.loadAccueil(), airtable.loadSuivi()])
  loadingGroups.value = false
}

async function submitForm() {
  errorMessage.value = ''
  if (!pole.value || !groupId.value || passed.value === '' || active.value === '' || content.value === '') {
    errorMessage.value = 'Veuillez remplir tous les champs obligatoires.'
    return
  }
  submitting.value = true
  try {
    await airtable.sendRecord('s', {
      Référence: `${pole.value} · ${groupId.value}`,
      'Pôle concerné': pole.value,
      'Groupe ID': groupId.value,
      'Groupe attribué': groupColor.value,
      'Participants passés': parseInt(passed.value, 10),
      'Participants actifs': parseInt(active.value, 10),
      'Contenus produits': parseInt(content.value, 10),
      Observations: notes.value.trim()
    })
    submitted.value = true
    await Promise.all([airtable.loadSuivi(), airtable.loadAccueil()])
  } catch (error) {
    errorMessage.value = `Erreur Airtable : ${error.message}`
  } finally {
    submitting.value = false
  }
}

onMounted(loadData)
watch(() => airtable.isConnected, (connected) => { if (connected) loadData() })
</script>

<style scoped>
.groups-loading,
.groups-empty {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 0.9rem;
}

.group-select-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.group-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 1rem;
  border-radius: 8px;
  border: 2px solid var(--border);
  background: var(--bg-card);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.group-option:hover {
  border-color: var(--or);
}

.group-option.sel {
  border-color: var(--or);
  background: rgba(var(--or-rgb, 200, 150, 30), 0.08);
}

.go-dot {
  font-size: 1.1rem;
}

.go-id {
  font-weight: 700;
  font-size: 1rem;
  flex: 0 0 auto;
}

.go-info {
  color: var(--text-muted);
  font-size: 0.85rem;
  margin-left: auto;
}
</style>
