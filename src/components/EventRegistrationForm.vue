<template>
  <div class="form-panel active">
    <div class="form-card">
      <div class="fh fh-a">
        <div class="fh-icon"><AppIcon name="file-text" :size="26" /></div>
        <div class="fh-title">Enregistrement des participant·e·s</div>
        <div class="fh-sub">Suivi des inscriptions pour toutes les activités et ateliers JIM 2026</div>
      </div>
      <div class="fb">
        <div class="stats-summary" v-reveal="0">
          <div class="stat-card">
            <strong>Total inscriptions</strong>
            <span>{{ totalRegistrations }}</span>
          </div>
          <div class="stat-card">
            <strong>Sessions inscrites</strong>
            <span>{{ Object.keys(sessionCounts).length }}</span>
          </div>
        </div>

        <div class="fg" v-reveal="50">
          <label>Session / Atelier <span class="req">*</span></label>
          <select v-model="session">
            <option value="">— Sélectionner —</option>
            <option v-for="item in sessions" :key="item.id" :value="item.title">
              {{ item.time }} · {{ item.location }} · {{ item.title }}
            </option>
          </select>
        </div>

        <div class="fr" v-reveal="80">
          <div class="fg"><label>Nom et Prénom <span class="req">*</span></label><input type="text" v-model="name" placeholder="Votre nom complet" /></div>
          <div class="fg"><label>Email <span class="req">*</span></label><input type="email" v-model="email" placeholder="votre@email.com" /></div>
        </div>

        <div class="fr" v-reveal="100">
          <div class="fg"><label>Téléphone</label><input type="tel" v-model="phone" placeholder="+224 6XX XXX XXX" /></div>
          <div class="fg"><label>Organisation / Fonction</label><input type="text" v-model="organization" placeholder="Organisateur·rice, invité·e, référent·e…" /></div>
        </div>

        <div class="fr" v-reveal="120">
          <div class="fg"><label>Public ciblé</label><input type="text" v-model="publicType" placeholder="Ex : Invités PROVGUI, Tout public" /></div>
          <div class="fg"><label>Nombre de participant·e·s</label><input type="number" min="1" v-model="count" placeholder="1" /></div>
        </div>

        <div class="fg" v-reveal="140">
          <label>Commentaire / Note</label>
          <textarea v-model="notes" placeholder="Remarques, besoins, informations complémentaires…"></textarea>
        </div>

        <div class="nl" :class="{ on: contactConsent }" @click="toggleContactConsent()" v-reveal="160">
          <div class="sw"></div>
          <span class="nl-lbl">
            <AppIcon name="mail" :size="15" />
            Le participant accepte d'être contacté·e après l'événement
          </span>
        </div>

        <button class="bsub bsub-a" v-ripple :disabled="submitting" @click="submitForm">
          <AppIcon :name="submitting ? 'loader' : 'send'" :size="18" />
          <span>{{ submitting ? 'Enregistrement…' : 'Enregistrer la participation' }}</span>
        </button>

        <div class="emsg" :class="{ on: errorMessage }">
          <AppIcon name="alert-triangle" :size="16" /> {{ errorMessage || 'Veuillez remplir tous les champs obligatoires.' }}
        </div>
        <div class="omsg" :class="{ on: submitted }">
          <div class="oico"><AppIcon name="check-circle" :size="52" /></div>
          <h3>Participant·e enregistré·e !</h3>
          <p>La participation a bien été sauvegardée dans Airtable.</p>
          <button class="breset" @click="resetForm">
            <AppIcon name="refresh-cw" :size="14" /> Nouvelle inscription
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useAirtableStore } from '../store/airtable'
import AppIcon from './AppIcon.vue'

const airtable = useAirtableStore()
const session = ref('')
const name = ref('')
const email = ref('')
const phone = ref('')
const organization = ref('')
const publicType = ref('')
const count = ref(1)
const notes = ref('')
const contactConsent = ref(false)
const errorMessage = ref('')
const submitted = ref(false)
const submitting = ref(false)

const totalRegistrations = computed(() => airtable.totalRegistrations)
const sessionCounts = computed(() => airtable.sessionCounts)

const sessions = [
  { id: '1',  time: '8h30',               location: 'Salle de conférence',                     title: 'Accueil des participant·e·s',                      audience: 'Invités du projet PROVGUI' },
  { id: '2',  time: '9h00 – 9h45',        location: 'Salle de conférence',                     title: 'Présentation PROV-GUI & REPAT-GUI',                audience: 'Invités du projet PROVGUI' },
  { id: '3',  time: '9h45 – 10h45',       location: 'Salle de conférence',                     title: 'Interventions collaborateurs PROV-GUI',            audience: 'Invités du projet PROVGUI' },
  { id: '4',  time: '10h45 – 11h00',      location: 'À préciser',                              title: 'Pause-café',                                       audience: 'Invités du projet PROVGUI' },
  { id: '5',  time: '11h00 – 12h30',      location: 'Salle de conférence',                     title: 'Cadres politiques, juridiques et diplomatiques',   audience: 'Invités du projet PROVGUI' },
  { id: '6',  time: '12h30 – 13h30',      location: 'À préciser',                              title: 'Pause déjeuner',                                   audience: 'Invités du projet PROVGUI' },
  { id: '7',  time: '13h30 – 16h30',      location: 'Salle de conférence',                     title: 'Table ronde provenance et projets',                audience: 'Invités du projet PROVGUI' },
  { id: '8',  time: '18h00 – 20h00',      location: 'CCFG',                                    title: 'Projection Dahomey · conférence-débat',            audience: 'Tout public' },
  { id: '9',  time: '20h00 – 22h00',      location: 'CCFG',                                    title: 'Cocktail',                                         audience: 'Sur invitation uniquement' },
  { id: '10', time: '8h30 – 10h00',       location: 'Salle des spectacles / salle de conférence', title: 'Session 1 « La voix aux communautés »',        audience: 'Invités du projet PROVGUI' },
  { id: '11', time: '10h00 – 10h30',      location: 'À préciser',                              title: 'Pause-café',                                       audience: 'Invités du projet PROVGUI' },
  { id: '12', time: '10h30 – 12h30',      location: 'Salle des spectacles / salle de conférence', title: "Temps d'échange",                              audience: 'Invités du projet PROVGUI' },
  { id: '13', time: '12h30 – 13h30',      location: 'À préciser',                              title: 'Pause déjeuner',                                   audience: 'Invités du projet PROVGUI' },
  { id: '14', time: '13h30 – 15h00',      location: 'Salle des spectacles',                    title: 'Atelier participatif',                             audience: 'Invités du projet PROVGUI' },
  { id: '15', time: '15h00 – 16h00',      location: 'Salle des spectacle',                     title: 'Restitution en plénière',                          audience: 'Invités du projet PROVGUI' },
  { id: '16', time: 'À partir de 16h00',  location: 'Salle de spectacle',                      title: 'Conférence Patrimoine & arts contemporains',       audience: 'Tout public' },
  { id: '17', time: '18h00',              location: 'Espace extérieur',                        title: 'DJ & Concert',                                     audience: 'Tout public' }
]

function toggleContactConsent() {
  contactConsent.value = !contactConsent.value
}

function resetForm() {
  session.value = ''
  name.value = ''
  email.value = ''
  phone.value = ''
  organization.value = ''
  publicType.value = ''
  count.value = 1
  notes.value = ''
  contactConsent.value = false
  errorMessage.value = ''
  submitted.value = false
  submitting.value = false
}

async function submitForm() {
  errorMessage.value = ''
  if (!session.value || !name.value.trim() || !email.value.trim()) {
    errorMessage.value = 'Veuillez remplir tous les champs obligatoires.'
    return
  }
  submitting.value = true
  try {
    await airtable.sendRecord('e', {
      Session: session.value,
      'Nom et Prénom': name.value.trim(),
      Email: email.value.trim(),
      Téléphone: phone.value.trim(),
      'Organisation / Fonction': organization.value.trim(),
      'Public ciblé': publicType.value.trim(),
      'Nombre de participant·e·s': count.value ? parseInt(count.value, 10) : 1,
      'Accepte contact': contactConsent.value ? 'Oui' : 'Non',
      Notes: notes.value.trim()
    })
    airtable.addEventRegistration({
      session: session.value,
      count: count.value ? parseInt(count.value, 10) : 1,
      contactConsent: contactConsent.value
    })
    submitted.value = true
  } catch (error) {
    errorMessage.value = `Erreur Airtable : ${error.message}`
  } finally {
    submitting.value = false
  }
}
</script>
