<template>
  <div class="form-panel active">
    <div class="form-card">
      <div class="fh fh-a">
        <div class="fh-icon">🏛️</div>
        <div class="fh-title">Accueil des Visiteurs</div>
        <div class="fh-sub">Enregistrement à l'entrée · JIM 2026 · Musée National de Guinée</div>
      </div>
      <div class="fb">
        <div class="fr">
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

        <div class="fg">
          <label>Groupe attribué <span class="req">*</span></label>
          <div class="gs">
            <div class="gb rouge" :class="{ sel: selectedGroup === 'Rouge' }" @click="pickGroup('rouge')"><span class="dot">🔴</span>Groupe Rouge</div>
            <div class="gb jaune" :class="{ sel: selectedGroup === 'Jaune' }" @click="pickGroup('jaune')"><span class="dot">🟡</span>Groupe Jaune</div>
            <div class="gb vert" :class="{ sel: selectedGroup === 'Vert' }" @click="pickGroup('vert')"><span class="dot">🟢</span>Groupe Vert</div>
          </div>
        </div>

        <div class="fg">
          <label>Groupe ID <span class="req">*</span></label>
          <div class="id-disp" :class="{ filled: groupId }">{{ groupId || '—' }}</div>
          <div style="font-size:.7rem;color:#999;margin-top:4px">Généré automatiquement selon la couleur du groupe.</div>
        </div>

        <div class="sd"><div class="sl"></div><span>Profil du public</span><div class="sl" style="background:linear-gradient(90deg,transparent,var(--or))"></div></div>

        <div class="fg">
          <label>Profil du public <span class="req">*</span></label>
          <div class="rg">
            <div class="rp" :class="{ sel: selectedProfile === 'Étudiant(e)' }" @click="pickProfile('Étudiant(e)')">🎓 Étudiant(e)</div>
            <div class="rp" :class="{ sel: selectedProfile === 'Jeune public' }" @click="pickProfile('Jeune public')">🧒 Jeune public</div>
            <div class="rp" :class="{ sel: selectedProfile === 'Professionnel(le)' }" @click="pickProfile('Professionnel(le)')">💼 Professionnel(le)</div>
            <div class="rp" :class="{ sel: selectedProfile === 'Grand public' }" @click="pickProfile('Grand public')">👥 Grand public</div>
            <div class="rp" :class="{ sel: selectedProfile === 'Autres' }" @click="pickProfile('Autres')">✨ Autres</div>
          </div>
        </div>

        <button class="bsub bsub-a" :disabled="submitting" @click="submitForm">
          <span>{{ submitting ? '⏳ Enregistrement…' : '✓ Enregistrer l’arrivée' }}</span>
        </button>

        <div class="emsg" :class="{ on: errorMessage }">⚠️ {{ errorMessage || 'Veuillez remplir tous les champs obligatoires.' }}</div>
        <div class="omsg" :class="{ on: submitted }">
          <span class="oico">✅</span>
          <h3>Arrivée enregistrée !</h3>
          <p>Le groupe a bien été accueilli et sauvegardé dans Airtable.</p>
          <button class="breset" @click="resetForm">+ Nouveau groupe</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAirtableStore } from '../store/airtable'

const airtable = useAirtableStore()
const arrivalTime = ref('')
const peopleCount = ref('')
const selectedGroup = ref('')
const groupId = ref('')
const selectedProfile = ref('')
const errorMessage = ref('')
const submitted = ref(false)
const submitting = ref(false)

const groupCounters = reactive({ rouge: 0, jaune: 0, vert: 0 })

function formatGroupId(color) {
  const prefix = { rouge: 'R', jaune: 'J', vert: 'V' }[color]
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
    submitted.value = true
  } catch (error) {
    errorMessage.value = `Erreur Airtable : ${error.message}`
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  const now = new Date()
  arrivalTime.value = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
})
</script>
