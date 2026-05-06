<template>
  <div class="form-panel active">
    <div class="form-card">
      <div class="fh fh-s">
        <div class="fh-icon"><AppIcon name="bar-chart" :size="26" /></div>
        <div class="fh-title">Suivi par Pôle</div>
        <div class="fh-sub">Renseigné par le·la référent·e après chaque rotation de groupe</div>
      </div>
      <div class="fb">
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

        <div class="fr" v-reveal="60">
          <div class="fg">
            <label>Groupe ID <span class="req">*</span></label>
            <input type="text" placeholder="Ex : R001, J003, V002…" v-model="groupId" />
          </div>
          <div class="fg">
            <label>Groupe attribué <span class="req">*</span></label>
            <select v-model="groupColor">
              <option value="">— Sélectionner —</option>
              <option value="Rouge">Groupe Rouge</option>
              <option value="Jaune">Groupe Jaune</option>
              <option value="Vert">Groupe Vert</option>
            </select>
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
import { ref } from 'vue'
import { useAirtableStore } from '../store/airtable'
import AppIcon from './AppIcon.vue'

const airtable = useAirtableStore()
const pole = ref('')
const groupId = ref('')
const groupColor = ref('')
const passed = ref('')
const active = ref('')
const content = ref('')
const notes = ref([])

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

function pickPole(value) {
  pole.value = value
}

function resetForm() {
  pole.value = ''
  groupId.value = ''
  groupColor.value = ''
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
  if (!pole.value || !groupId.value.trim() || !groupColor.value || passed.value === '' || active.value === '' || content.value === '') {
    errorMessage.value = 'Veuillez remplir tous les champs obligatoires.'
    return
  }
  submitting.value = true
  try {
    await airtable.sendRecord('s', {
      Référence: `${pole.value} · ${groupId.value.trim()}`,
      'Pôle concerné': pole.value,
      'Groupe ID': groupId.value.trim(),
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
</script>

<style scoped>
.obs-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}
@media (max-width: 580px) { .obs-grid { grid-template-columns: 1fr; } }

.obs-item {
  display: flex;
  align-items: center;
  gap: 10px;
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
  flex-shrink: 0;
  color: transparent;
  transition: all .2s ease;
}
.obs-item:has(input:checked) { border-color: var(--rouge); background: rgba(177,34,42,.06); }
.obs-item:has(input:checked) .obs-check {
  background: var(--rouge);
  border-color: var(--rouge);
  color: #fff;
}
.obs-label {
  font-size: .84rem;
  font-weight: 600;
  color: var(--brun);
  line-height: 1.2;
}
.obs-item:has(input:checked) .obs-label { color: var(--rouge); }
</style>
