<template>
  <div class="form-panel active">
    <div class="form-card">
      <div class="fh fh-a">
        <div class="fh-icon"><AppIcon name="landmark" :size="26" /></div>
        <div class="fh-title">Accueil des Visiteurs</div>
        <div class="fh-sub">Enregistrement à l'entrée · JIM 2026 · Musée National de Guinée</div>
      </div>
      <div class="fb">
        <div class="fr" v-reveal="0">
          <div class="fg">
            <label>Heure d'arrivée <span class="req">*</span></label>
            <input type="time" v-model="arrivalTime" />
          </div>
          <div class="fg">
            <label>Nombre de personnes <span class="req">*</span></label>
            <input type="number" min="1" max="100" placeholder="Ex : 12" v-model="peopleCount" />
          </div>
        </div>

        <div class="sd"><div class="sl"></div><span>Attribution du groupe</span><div class="sl" style="background:linear-gradient(90deg,transparent,var(--or))"></div></div>

        <div class="fg" v-reveal="50">
          <label>Groupe attribué <span class="req">*</span></label>
          <div class="gs">
            <div class="gb rouge" :class="{ sel: selectedGroup === 'Rouge' }" @click="pickGroup('rouge')">
              <span class="group-dot rouge-dot"></span>Groupe Rouge
            </div>
            <div class="gb jaune" :class="{ sel: selectedGroup === 'Jaune' }" @click="pickGroup('jaune')">
              <span class="group-dot jaune-dot"></span>Groupe Jaune
            </div>
            <div class="gb vert" :class="{ sel: selectedGroup === 'Vert' }" @click="pickGroup('vert')">
              <span class="group-dot vert-dot"></span>Groupe Vert
            </div>
            <div class="gb bleu" :class="{ sel: selectedGroup === 'Bleu' }" @click="pickGroup('bleu')">
              <span class="group-dot bleu-dot"></span>Groupe Bleu
            </div>
          </div>
        </div>

        <div class="fg" v-reveal="80">
          <label>Groupe ID <span class="req">*</span></label>
          <div class="id-disp" :class="{ filled: groupId }">{{ groupId || '—' }}</div>
          <div style="font-size:.7rem;color:#999;margin-top:4px">Généré automatiquement selon la couleur du groupe.</div>
        </div>

        <div class="sd"><div class="sl"></div><span>Profil du public</span><div class="sl" style="background:linear-gradient(90deg,transparent,var(--or))"></div></div>

        <div class="fg" v-reveal="100">
          <label>Profil du public <span class="req">*</span></label>
          <div class="rg">
            <div class="rp" :class="{ sel: selectedProfile === 'Étudiant(e)' }" @click="pickProfile('Étudiant(e)')">
              <AppIcon name="graduation-cap" :size="15" /> Étudiant(e)
            </div>
            <div class="rp" :class="{ sel: selectedProfile === 'Jeune public' }" @click="pickProfile('Jeune public')">
              <AppIcon name="user" :size="15" /> Jeune public
            </div>
            <div class="rp" :class="{ sel: selectedProfile === 'Professionnel(le)' }" @click="pickProfile('Professionnel(le)')">
              <AppIcon name="briefcase" :size="15" /> Professionnel(le)
            </div>
            <div class="rp" :class="{ sel: selectedProfile === 'Grand public' }" @click="pickProfile('Grand public')">
              <AppIcon name="users" :size="15" /> Grand public
            </div>
            <div class="rp" :class="{ sel: selectedProfile === 'Autres' }" @click="pickProfile('Autres')">
              <AppIcon name="sparkles" :size="15" /> Autres
            </div>
          </div>
        </div>

        <button class="bsub bsub-a" v-ripple :disabled="submitting" @click="submitForm">
          <AppIcon :name="submitting ? 'loader' : 'check'" :size="18" />
          <span>{{ submitting ? 'Enregistrement…' : "Enregistrer l'arrivée" }}</span>
        </button>

        <div class="emsg" :class="{ on: errorMessage }">
          <AppIcon name="alert-triangle" :size="16" /> {{ errorMessage || 'Veuillez remplir tous les champs obligatoires.' }}
        </div>
        <div class="omsg" :class="{ on: submitted }">
          <div class="oico"><AppIcon name="check-circle" :size="52" /></div>
          <h3>Arrivée enregistrée !</h3>
          <p>Le groupe a bien été accueilli et sauvegardé dans Airtable.</p>
          <button class="breset" @click="resetForm">
            <AppIcon name="refresh-cw" :size="14" /> Nouveau groupe
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAirtableStore } from '../store/airtable'
import AppIcon from './AppIcon.vue'

const airtable = useAirtableStore()
const arrivalTime = ref('')
const peopleCount = ref('')
const selectedGroup = ref('')
const groupId = ref('')
const selectedProfile = ref('')
const errorMessage = ref('')
const submitted = ref(false)
const submitting = ref(false)

const groupCounters = reactive({ rouge: 0, jaune: 0, vert: 0, bleu: 0 })

function formatGroupId(color) {
  const prefix = { rouge: 'R', jaune: 'J', vert: 'V', bleu: 'B' }[color]
  return `${prefix}${String(groupCounters[color]).padStart(3, '0')}`
}

function pickGroup(color) {
  selectedGroup.value = color.charAt(0).toUpperCase() + color.slice(1)
  groupCounters[color] += 1
  groupId.value = formatGroupId(color)
}

function pickProfile(value) {
  selectedProfile.value = value
}

function resetForm() {
  arrivalTime.value = ''
  peopleCount.value = ''
  selectedGroup.value = ''
  groupId.value = ''
  selectedProfile.value = ''
  errorMessage.value = ''
  submitted.value = false
  submitting.value = false
}

async function submitForm() {
  errorMessage.value = ''
  if (!arrivalTime.value || !peopleCount.value || !selectedGroup.value || !groupId.value || !selectedProfile.value) {
    errorMessage.value = 'Veuillez remplir tous les champs obligatoires.'
    return
  }
  submitting.value = true
  try {
    await airtable.sendRecord('a', {
      'Groupe ID': groupId.value,
      "Heure d'arrivée": arrivalTime.value,
      'Nombre de personnes': parseInt(peopleCount.value, 10),
      'Groupe attribué': selectedGroup.value,
      'Profil du public': selectedProfile.value
    })
    // Ajouter immédiatement au store pour que SuiviPôle voie le nouveau groupe
    airtable.addAccueilRecord({
      groupeId: groupId.value,
      groupe: selectedGroup.value,
      personnes: parseInt(peopleCount.value, 10),
      heure: arrivalTime.value,
    })
    // Sauvegarder les compteurs pour persistance entre sessions
    localStorage.setItem('jim_counters', JSON.stringify({ rouge: groupCounters.rouge, jaune: groupCounters.jaune, vert: groupCounters.vert, bleu: groupCounters.bleu }))
    submitted.value = true
  } catch (error) {
    errorMessage.value = `Erreur Airtable : ${error.message}`
    // Annuler l'incrément si l'envoi a échoué
    groupCounters[selectedGroup.value.toLowerCase()] -= 1
    groupId.value = ''
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  const now = new Date()
  arrivalTime.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  // Initialiser les compteurs depuis Airtable pour garantir l'unicité des IDs
  try {
    const records = await airtable.fetchRecords('a')
    records.forEach(r => {
      const id = r.fields?.['Groupe ID'] || ''
      const match = id.match(/^([RJVB])(\d+)$/)
      if (match) {
        const num = parseInt(match[2], 10)
        if (match[1] === 'R' && num > groupCounters.rouge) groupCounters.rouge = num
        if (match[1] === 'J' && num > groupCounters.jaune) groupCounters.jaune = num
        if (match[1] === 'V' && num > groupCounters.vert)  groupCounters.vert  = num
          if (match[1] === 'B' && num > groupCounters.bleu)  groupCounters.bleu  = num
      }
    })
    localStorage.setItem('jim_counters', JSON.stringify({ rouge: groupCounters.rouge, jaune: groupCounters.jaune, vert: groupCounters.vert, bleu: groupCounters.bleu }))
  } catch {
    // Fallback : localStorage si Airtable inaccessible
    try {
      const saved = JSON.parse(localStorage.getItem('jim_counters') || '{}')
      if (saved.rouge > 0) groupCounters.rouge = saved.rouge
      if (saved.jaune > 0) groupCounters.jaune = saved.jaune
      if (saved.vert  > 0) groupCounters.vert  = saved.vert
      if (saved.bleu  > 0) groupCounters.bleu  = saved.bleu
    } catch { /* ignore */ }
  }
})
</script>

<style scoped>
.group-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}
.gb:hover .group-dot { transform: scale(1.3); }
.rouge-dot { background: #dc3545; box-shadow: 0 0 0 2px rgba(220,53,69,.25); }
.jaune-dot { background: #d4a017; box-shadow: 0 0 0 2px rgba(212,160,23,.25); }
.vert-dot  { background: #28a745; box-shadow: 0 0 0 2px rgba(40,167,69,.25); }
.bleu-dot  { background: #2563eb; box-shadow: 0 0 0 2px rgba(37,99,235,.25); }
</style>
