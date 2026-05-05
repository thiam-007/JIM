<template>
  <div class="form-panel active">
    <div class="form-card">
      <div class="fh fh-v">
        <div class="fh-icon">⭐</div>
        <div class="fh-title">Avis Visiteurs</div>
        <div class="fh-sub">Questionnaire de sortie · Partagez votre expérience JIM 2026</div>
      </div>
      <div class="fb">
        <div class="fr">
          <div class="fg"><label>Nom et Prénom <span class="req">*</span></label><input type="text" placeholder="Votre nom complet" v-model="name" /></div>
          <div class="fg"><label>Email</label><input type="email" placeholder="votre@email.com" v-model="email" /></div>
        </div>
        <div class="fg"><label>Téléphone</label><input type="tel" placeholder="+224 6XX XXX XXX" v-model="phone" /></div>

        <div class="sd"><div class="sl"></div><span>Votre expérience</span><div class="sl" style="background:linear-gradient(90deg,transparent,#2d6a4a)"></div></div>

        <div class="fg">
          <label>Pôle préféré <span class="req">*</span></label>
          <div class="pc">
            <div class="pcard" :class="{ sel: preferredPole === 'Pôle Photo' }" @click="pickPole('Pôle Photo')"><span class="pck">✓</span><div class="pi">📸</div><div class="pn">Pôle Photo</div></div>
            <div class="pcard" :class="{ sel: preferredPole === 'Pôle 3D' }" @click="pickPole('Pôle 3D')"><span class="pck">✓</span><div class="pi">🧊</div><div class="pn">Pôle 3D</div></div>
            <div class="pcard" :class="{ sel: preferredPole === 'Pôle Récit' }" @click="pickPole('Pôle Récit')"><span class="pck">✓</span><div class="pi">🗣️</div><div class="pn">Pôle Récit</div></div>
          </div>
        </div>

        <div class="fg"><label>Qu'avez-vous découvert ?</label><textarea placeholder="Décrivez ce que vous avez appris ou découvert aujourd'hui…" v-model="discoveries"></textarea></div>

        <div class="fg">
          <label>Note de satisfaction <span class="req">*</span></label>
          <div class="stars">
            <span class="star" :class="{ on: rating >= 1 }" @click="rateStar(1)">★</span>
            <span class="star" :class="{ on: rating >= 2 }" @click="rateStar(2)">★</span>
            <span class="star" :class="{ on: rating >= 3 }" @click="rateStar(3)">★</span>
            <span class="star" :class="{ on: rating >= 4 }" @click="rateStar(4)">★</span>
            <span class="star" :class="{ on: rating >= 5 }" @click="rateStar(5)">★</span>
          </div>
          <div class="star-hint">{{ starHint }}</div>
        </div>

        <div class="sd"><div class="sl"></div><span>Rester en contact</span><div class="sl" style="background:linear-gradient(90deg,transparent,#2d6a4a)"></div></div>

        <div class="fg">
          <div class="nl" :class="{ on: newsletter }" @click="toggleNewsletter">
            <div class="sw"></div>
            <span class="nl-lbl">📧 Je souhaite recevoir la newsletter du Musée Virtuel de Guinée</span>
          </div>
        </div>

        <button class="bsub bsub-v" :disabled="submitting" @click="submitForm">
          <span>{{ submitting ? '⏳ Enregistrement…' : '✓ Envoyer mon avis' }}</span>
        </button>
        <div class="emsg" :class="{ on: errorMessage }">⚠️ {{ errorMessage || 'Veuillez remplir tous les champs obligatoires.' }}</div>
        <div class="omsg" :class="{ on: submitted }">
          <span class="oico">🙏</span>
          <h3>Merci pour votre avis !</h3>
          <p>Votre retour aide le Musée Virtuel de Guinée à améliorer ses activités.</p>
          <button class="breset" @click="resetForm">+ Nouvel avis</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAirtableStore } from '../store/airtable'

const airtable = useAirtableStore()
const name = ref('')
const email = ref('')
const phone = ref('')
const preferredPole = ref('')
const discoveries = ref('')
const rating = ref(0)
const newsletter = ref(false)
const errorMessage = ref('')
const submitted = ref(false)
const submitting = ref(false)

const starHints = ['', '😕 Décevant', '😐 Passable', '🙂 Bien', '😊 Très bien', '🤩 Excellent !']
const starHint = computed(() => starHints[rating.value])

function pickPole(value) {
  preferredPole.value = value
}

function rateStar(value) {
  rating.value = value
}

function toggleNewsletter() {
  newsletter.value = !newsletter.value
}

function resetForm() {
  name.value = ''
  email.value = ''
  phone.value = ''
  preferredPole.value = ''
  discoveries.value = ''
  rating.value = 0
  newsletter.value = false
  errorMessage.value = ''
  submitted.value = false
  submitting.value = false
}

async function submitForm() {
  errorMessage.value = ''
  if (!name.value.trim() || !preferredPole.value || rating.value === 0) {
    errorMessage.value = 'Veuillez remplir tous les champs obligatoires.'
    return
  }
  submitting.value = true
  try {
    await airtable.sendRecord('v', {
      'Nom et Prénom': name.value.trim(),
      Email: email.value.trim(),
      Téléphone: phone.value.trim(),
      'Pôle préféré': preferredPole.value,
      Découverte: discoveries.value.trim(),
      'Note de satisfaction': rating.value,
      Newsletter: newsletter.value ? 'Oui' : 'Non'
    })
    submitted.value = true
  } catch (error) {
    errorMessage.value = `Erreur Airtable : ${error.message}`
  } finally {
    submitting.value = false
  }
}
</script>
