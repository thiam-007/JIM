<template>
  <div class="form-panel active">
    <div class="form-card">
      <div class="fh fh-s">
        <div class="fh-icon"><AppIcon name="bar-chart" :size="26" /></div>
        <div class="fh-title">Suivi par Pôle</div>
        <div class="fh-sub">Renseigné par le·la référent·e après chaque rotation de groupe</div>
      </div>
      <div class="fb">

        <!-- Pôle concerné -->
        <div class="fg" v-reveal="0">
          <label>Pôle concerné <span class="req">*</span></label>
          <div class="pc">
            <div class="pcard" :class="{ sel: pole === 'Pôle Photo' }" @click="pickPole('Pôle Photo')">
              <span class="pck"><AppIcon name="check" :size="14" /></span>
              <div class="pi"><AppIcon name="camera" :size="28" /></div>
              <div class="pn">Pôle Photo</div>
            </div>
            <div class="pcard" :class="{ sel: pole === 'Pôle 3D' }" @click="pickPole('Pôle 3D')">
              <span class="pck"><AppIcon name="check" :size="14" /></span>
              <div class="pi"><AppIcon name="box" :size="28" /></div>
              <div class="pn">Pôle 3D</div>
            </div>
            <div class="pcard" :class="{ sel: pole === 'Pôle Récit' }" @click="pickPole('Pôle Récit')">
              <span class="pck"><AppIcon name="check" :size="14" /></span>
              <div class="pi"><AppIcon name="message-circle" :size="28" /></div>
              <div class="pn">Pôle Récit</div>
            </div>
          </div>
        </div>

        <!-- Sélecteur de groupe depuis l'accueil -->
        <div class="fg" v-reveal="60">
          <div class="gp-header">
            <label>Groupe <span class="req">*</span></label>
            <button class="gp-refresh-btn" @click="refreshGroups" :disabled="loadingGroups" title="Actualiser">
              <AppIcon :name="loadingGroups ? 'loader' : 'refresh-cw'" :size="14" />
              {{ loadingGroups ? 'Chargement…' : 'Actualiser' }}
            </button>
          </div>

          <!-- Groupe sélectionné -->
          <div v-if="selectedGroupData" class="gp-selected-banner" :class="`gp-sel-${selectedGroupData.groupe.toLowerCase()}`">
            <span class="gp-sel-dot" :class="`dot-${selectedGroupData.groupe.toLowerCase()}`"></span>
            <span class="gp-sel-id">{{ selectedGroupData.groupeId }}</span>
            <span class="gp-sel-pax">· {{ selectedGroupData.personnes }} pers.</span>
            <button class="gp-desel" @click="deselectGroup" title="Changer de groupe">
              <AppIcon name="x" :size="13" />
            </button>
          </div>

          <!-- Liste des groupes -->
          <div v-if="!selectedGroupData">
            <div v-if="loadingGroups" class="gp-state">
              <AppIcon name="loader" :size="20" /> Chargement des groupes…
            </div>
            <div v-else-if="accueilGroups.length === 0" class="gp-state gp-empty">
              <AppIcon name="inbox" :size="20" />
              Aucun groupe enregistré à l'accueil aujourd'hui.
            </div>
            <div v-else class="gp-list">
              <div
                v-for="g in accueilGroups"
                :key="g.groupeId"
                class="gp-item"
                :class="`gp-${g.groupe.toLowerCase()}`"
                @click="selectGroup(g)"
              >
                <span class="gp-dot" :class="`dot-${g.groupe.toLowerCase()}`"></span>
                <div class="gp-info">
                  <span class="gp-id">{{ g.groupeId }}</span>
                  <span class="gp-pax">{{ g.personnes }} personne{{ g.personnes > 1 ? 's' : '' }}</span>
                </div>
                <span class="gp-heure" v-if="g.heure">{{ g.heure }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="sd"><div class="sl"></div><span>Données de participation</span><div class="sl" style="background:linear-gradient(90deg,transparent,var(--rouge))"></div></div>

        <div class="fr" v-reveal="80">
          <div class="fg"><label>Participants passé(e)s <span class="req">*</span></label><input type="number" min="0" placeholder="0" v-model="passed" /></div>
          <div class="fg"><label>Participants actif(ves) <span class="req">*</span></label><input type="number" min="0" placeholder="0" v-model="active" /></div>
        </div>
        <div class="fg" v-reveal="100">
          <label>Contenus produits <span class="req">*</span></label>
          <input type="number" min="0" placeholder="Nb de photos / modèles 3D / récits…" v-model="content" />
        </div>
        <div class="fg" v-reveal="120">
          <label>Observations et commentaires</label>
          <div class="obs-grid">
            <label class="obs-item" v-for="obs in observationOptions" :key="obs">
              <input type="checkbox" :value="obs" v-model="notes" />
              <span class="obs-check"><AppIcon name="check" :size="12" /></span>
              <span class="obs-label">{{ obs }}</span>
            </label>
          </div>
        </div>

        <button class="bsub bsub-s" v-ripple :disabled="submitting" @click="submitForm">
          <AppIcon :name="submitting ? 'loader' : 'check'" :size="18" />
          <span>{{ submitting ? 'Enregistrement…' : 'Enregistrer le suivi' }}</span>
        </button>

        <div class="emsg" :class="{ on: errorMessage }">
          <AppIcon name="alert-triangle" :size="16" /> {{ errorMessage || 'Veuillez remplir tous les champs obligatoires.' }}
        </div>
        <div class="omsg" :class="{ on: submitted }">
          <div class="oico"><AppIcon name="check-circle" :size="52" /></div>
          <h3>Suivi enregistré !</h3>
          <p>Les données du pôle ont bien été sauvegardées dans Airtable.</p>
          <button class="breset" @click="resetForm">
            <AppIcon name="refresh-cw" :size="14" /> Nouveau suivi
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAirtableStore } from '../store/airtable'
import AppIcon from './AppIcon.vue'

const airtable = useAirtableStore()
const pole = ref('')
const groupId = ref('')
const groupColor = ref('')
const selectedGroupData = ref(null)
const passed = ref('')
const active = ref('')
const content = ref('')
const notes = ref([])
const loadingGroups = ref(false)

const observationOptions = [
  'Fluide',
  'Forte participation',
  'Attente',
  'Peu de participants',
  'Problème technique',
  'Matériel défaillant',
  'Questions fréquentes',
  'Enthousiasme élevé',
]
const errorMessage = ref('')
const submitted = ref(false)
const submitting = ref(false)

const accueilGroups = computed(() => airtable.accueilRecords)

function pickPole(value) {
  pole.value = value
}

function selectGroup(g) {
  selectedGroupData.value = g
  groupId.value = g.groupeId
  groupColor.value = g.groupe
}

function deselectGroup() {
  selectedGroupData.value = null
  groupId.value = ''
  groupColor.value = ''
}

async function refreshGroups() {
  loadingGroups.value = true
  await airtable.loadAccueil()
  loadingGroups.value = false
}

function resetForm() {
  pole.value = ''
  groupId.value = ''
  groupColor.value = ''
  selectedGroupData.value = null
  passed.value = ''
  active.value = ''
  content.value = ''
  notes.value = []
  errorMessage.value = ''
  submitted.value = false
  submitting.value = false
}

async function submitForm() {
  errorMessage.value = ''
  if (!pole.value || !groupId.value || !groupColor.value || passed.value === '' || active.value === '' || content.value === '') {
    errorMessage.value = 'Veuillez sélectionner un pôle, un groupe et remplir les données de participation.'
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
      Observations: notes.value.join(', ')
    })
    submitted.value = true
  } catch (error) {
    errorMessage.value = `Erreur Airtable : ${error.message}`
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  if (airtable.accueilRecords.length === 0) {
    loadingGroups.value = true
    await airtable.loadAccueil()
    loadingGroups.value = false
  }
})
</script>

<style scoped>
/* ─── Sélecteur de groupe ─── */
.gp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.gp-header label { margin-bottom: 0; }

.gp-refresh-btn {
  display: flex; align-items: center; gap: 6px;
  background: none; border: 1.5px solid #e8ddd0;
  border-radius: 10px; padding: 6px 12px;
  font-size: .72rem; font-weight: 700;
  color: var(--brun); cursor: pointer;
  transition: all .2s;
}
.gp-refresh-btn:hover:not(:disabled) { border-color: var(--or); background: rgba(249,178,51,.08); }
.gp-refresh-btn:disabled { opacity: .5; cursor: not-allowed; }

.gp-state {
  display: flex; align-items: center; gap: 10px;
  padding: 16px; border-radius: 14px;
  font-size: .84rem; font-weight: 600; color: #aaa;
  background: rgba(132,89,54,.04);
  border: 1.5px dashed #e8ddd0;
}
.gp-empty { color: #bbb; }

.gp-list {
  display: flex; flex-direction: column; gap: 8px;
}

.gp-item {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px;
  border: 2px solid #e8ddd0;
  border-radius: 14px;
  cursor: pointer;
  background: rgba(255,255,255,.95);
  transition: all .2s ease;
}
.gp-item:hover { transform: translateX(3px); }
.gp-rouge:hover { border-color: #dc3545; background: rgba(220,53,69,.05); }
.gp-jaune:hover { border-color: #d4a017; background: rgba(212,160,23,.05); }
.gp-vert:hover  { border-color: #28a745; background: rgba(40,167,69,.05); }

.gp-dot {
  width: 14px; height: 14px;
  border-radius: 50%; flex-shrink: 0;
}
.dot-rouge { background: #dc3545; box-shadow: 0 0 0 3px rgba(220,53,69,.2); }
.dot-jaune { background: #d4a017; box-shadow: 0 0 0 3px rgba(212,160,23,.2); }
.dot-vert  { background: #28a745; box-shadow: 0 0 0 3px rgba(40,167,69,.2); }

.gp-info {
  display: flex; flex-direction: column; flex: 1;
}
.gp-id {
  font-size: .95rem; font-weight: 900; color: var(--brun);
  font-family: monospace; letter-spacing: 1px;
}
.gp-pax {
  font-size: .72rem; color: #999; margin-top: 2px;
}
.gp-heure {
  font-size: .72rem; font-weight: 700; color: #bbb;
  font-variant-numeric: tabular-nums;
}

/* Groupe sélectionné */
.gp-selected-banner {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 2px solid transparent;
  font-weight: 700;
}
.gp-sel-rouge { background: rgba(220,53,69,.08); border-color: #dc3545; }
.gp-sel-jaune { background: rgba(212,160,23,.08); border-color: #d4a017; }
.gp-sel-vert  { background: rgba(40,167,69,.08);  border-color: #28a745; }

.gp-sel-id {
  font-size: 1rem; font-weight: 900; color: var(--brun);
  font-family: monospace; letter-spacing: 1px;
}
.gp-sel-pax {
  font-size: .82rem; color: #777; flex: 1;
}
.gp-desel {
  background: none; border: none;
  color: #bbb; cursor: pointer; padding: 2px;
  display: flex; align-items: center;
  transition: color .2s;
}
.gp-desel:hover { color: var(--rouge); }

/* ─── Observations ─── */
.obs-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
@media (max-width: 580px) { .obs-grid { grid-template-columns: 1fr; } }

.obs-item {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 14px;
  border: 2px solid #e8ddd0;
  border-radius: 12px;
  cursor: pointer;
  transition: all .25s ease;
  background: rgba(255,255,255,.95);
  user-select: none;
}
.obs-item:hover { border-color: var(--or); background: rgba(249,178,51,.06); }
.obs-item input[type=checkbox] { display: none; }
.obs-check {
  width: 20px; height: 20px;
  border: 2px solid #d0c4b4;
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; color: transparent;
  transition: all .2s ease;
}
.obs-item:has(input:checked) { border-color: var(--rouge); background: rgba(177,34,42,.06); }
.obs-item:has(input:checked) .obs-check {
  background: var(--rouge); border-color: var(--rouge); color: #fff;
}
.obs-label {
  font-size: .84rem; font-weight: 600; color: var(--brun); line-height: 1.2;
}
.obs-item:has(input:checked) .obs-label { color: var(--rouge); }
</style>
