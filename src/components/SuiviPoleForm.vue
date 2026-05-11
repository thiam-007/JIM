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

        <div class="fr">
          <div class="fg">
            <label>Groupe ID <span class="req">*</span></label>
            <input type="text" placeholder="Ex : R001, J003, V002…" v-model="groupId" />
          </div>
          <div class="fg">
            <label>Groupe attribué <span class="req">*</span></label>
            <select v-model="groupColor">
              <option value="">— Sélectionner —</option>
              <option value="Rouge">🔴 Groupe Rouge</option>
              <option value="Jaune">🟡 Groupe Jaune</option>
              <option value="Vert">🟢 Groupe Vert</option>
            </select>
          </div>
        </div>

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
import { ref } from 'vue'
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
  notes.value = ''
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
      Observations: notes.value.trim()
    })
    submitted.value = true
    await airtable.loadSuivi()
  } catch (error) {
    errorMessage.value = `Erreur Airtable : ${error.message}`
  } finally {
    submitting.value = false
  }
}
</script>
