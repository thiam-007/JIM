<template>
  <div class="form-panel active">
    <div class="form-card">
      <div class="fh fh-a">
        <div class="fh-icon"><AppIcon name="file-text" :size="26" /></div>
        <div class="fh-title">Enregistrement des participant·e·s</div>
        <div class="fh-sub">Suivi des présences par jour et par lieu · JIM 2026</div>
      </div>
      <div class="fb">
        <div class="stats-summary" v-reveal="0">
          <div class="stat-card">
            <strong>Total inscriptions</strong>
            <span>{{ totalRegistrations }}</span>
          </div>
          <div class="stat-card">
            <strong>Créneaux enregistrés</strong>
            <span>{{ Object.keys(sessionCounts).length }}</span>
          </div>
        </div>

        <!-- Sélection du jour -->
        <div class="sd"><div class="sl"></div><span>Jour <span class="req">*</span></span><div class="sl" style="background:linear-gradient(90deg,transparent,var(--or))"></div></div>
        <div class="jour-grid" v-reveal="40">
          <div
            v-for="jour in jours"
            :key="jour.id"
            class="jour-card"
            :class="{ sel: selectedJour === jour.id }"
            @click="selectedJour = jour.id; onJourChange()"
          >
            <div class="jour-num">{{ jour.label }}</div>
            <div class="jour-date">{{ jour.date }}</div>
          </div>
        </div>

        <!-- Sélection du lieu -->
        <div class="sd" v-if="selectedJour"><div class="sl"></div><span>Lieu <span class="req">*</span></span><div class="sl" style="background:linear-gradient(90deg,transparent,var(--or))"></div></div>
        <Transition name="slide-down">
          <div class="lieu-grid" v-if="selectedJour" v-reveal="60">
            <div
              v-for="lieu in lieux"
              :key="lieu.id"
              class="lieu-card"
              :class="{ sel: selectedLieu === lieu.id }"
              @click="selectedLieu = lieu.id"
            >
              <div class="lieu-icon"><AppIcon :name="lieu.icon" :size="26" /></div>
              <div class="lieu-name">{{ lieu.label }}</div>
            </div>
          </div>
        </Transition>

        <!-- Sélection du créneau -->
        <Transition name="slide-down">
          <div v-if="selectedLieu">
            <div class="sd"><div class="sl"></div><span>Créneau</span><div class="sl" style="background:linear-gradient(90deg,transparent,var(--or))"></div></div>
            <div class="rg" v-reveal="80">
              <div
                v-for="c in creneaux"
                :key="c"
                class="rp"
                :class="{ sel: selectedCreneau === c }"
                @click="selectedCreneau = selectedCreneau === c ? '' : c"
              >{{ c }}</div>
            </div>
            <div class="session-preview" v-if="sessionLabel" v-reveal="90">
              <AppIcon name="check-circle" :size="14" />
              {{ sessionLabel }}
            </div>
          </div>
        </Transition>

        <!-- Champs participant -->
        <div class="sd" v-if="selectedLieu"><div class="sl"></div><span>Participant·e</span><div class="sl" style="background:linear-gradient(90deg,transparent,var(--or))"></div></div>

        <Transition name="slide-down">
          <div v-if="selectedLieu">
            <div class="fr" v-reveal="100">
              <div class="fg"><label>Nom et Prénom <span class="req">*</span></label><input type="text" v-model="name" placeholder="Votre nom complet" /></div>
              <div class="fg"><label>Email <span class="req">*</span></label><input type="email" v-model="email" placeholder="votre@email.com" /></div>
            </div>

            <div class="fr" v-reveal="120">
              <div class="fg"><label>Téléphone</label><input type="tel" v-model="phone" placeholder="+224 6XX XXX XXX" /></div>
              <div class="fg"><label>Organisation / Fonction</label><input type="text" v-model="organization" placeholder="Organisateur·rice, invité·e, référent·e…" /></div>
            </div>

            <div class="fr" v-reveal="140">
              <div class="fg"><label>Public ciblé</label><input type="text" v-model="publicType" placeholder="Ex : Invités PROVGUI, Tout public" /></div>
              <div class="fg"><label>Nombre de participant·e·s</label><input type="number" min="1" v-model="count" placeholder="1" /></div>
            </div>

            <div class="fg" v-reveal="160">
              <label>Commentaire / Note</label>
              <textarea v-model="notes" placeholder="Remarques, besoins, informations complémentaires…"></textarea>
            </div>

            <div class="nl" :class="{ on: contactConsent }" @click="toggleContactConsent()" v-reveal="170">
              <div class="sw"></div>
              <span class="nl-lbl">
                <AppIcon name="mail" :size="15" />
                Le participant accepte d'être contacté·e après l'événement
              </span>
            </div>

            <button class="bsub bsub-a" v-ripple :disabled="submitting" @click="submitForm" v-reveal="180">
              <AppIcon :name="submitting ? 'loader' : 'send'" :size="18" />
              <span>{{ submitting ? 'Enregistrement…' : 'Enregistrer la participation' }}</span>
            </button>

            <div class="emsg" :class="{ on: errorMessage }">
              <AppIcon name="alert-triangle" :size="16" /> {{ errorMessage }}
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
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useAirtableStore } from '../store/airtable'
import AppIcon from './AppIcon.vue'

const airtable = useAirtableStore()

// ─── Sélecteurs ───
const selectedJour   = ref('')
const selectedLieu   = ref('')
const selectedCreneau = ref('')

// ─── Champs participant ───
const name          = ref('')
const email         = ref('')
const phone         = ref('')
const organization  = ref('')
const publicType    = ref('')
const count         = ref(1)
const notes         = ref('')
const contactConsent = ref(false)
const errorMessage  = ref('')
const submitted     = ref(false)
const submitting    = ref(false)

const totalRegistrations = computed(() => airtable.totalRegistrations)
const sessionCounts      = computed(() => airtable.sessionCounts)

const jours = [
  { id: 'jour1', label: 'Jour 1', date: '16 Mai 2026', value: '16 Mai' },
  { id: 'jour2', label: 'Jour 2', date: '17 Mai 2026', value: '17 Mai' },
  { id: 'jour3', label: 'Jour 3', date: '18 Mai 2026', value: '18 Mai' },
]

const lieux = [
  { id: 'conf',      label: 'Salle de conférence',              icon: 'users',    value: 'Salle de conférence' },
  { id: 'ccfg',     label: 'CCFG',                              icon: 'landmark', value: 'CCFG' },
  { id: 'spectacle', label: 'Salle des spectacles / conférence', icon: 'film',    value: 'Salle de spectacle' },
]

const creneaux = ['Matin', 'Après-midi', 'Soir']

// Libellé composé affiché en aperçu et envoyé à Airtable
const sessionLabel = computed(() => {
  if (!selectedJour.value || !selectedLieu.value) return ''
  const jour = jours.find(j => j.id === selectedJour.value)
  const lieu = lieux.find(l => l.id === selectedLieu.value)
  const parts = [jour.value, lieu.value]
  if (selectedCreneau.value) parts.push(selectedCreneau.value)
  return parts.join(' · ')
})

// Remettre lieu + créneau à zéro quand on change de jour
function onJourChange() {
  selectedLieu.value    = ''
  selectedCreneau.value = ''
}

function toggleContactConsent() {
  contactConsent.value = !contactConsent.value
}

function resetForm() {
  selectedJour.value    = ''
  selectedLieu.value    = ''
  selectedCreneau.value = ''
  name.value           = ''
  email.value          = ''
  phone.value          = ''
  organization.value   = ''
  publicType.value     = ''
  count.value          = 1
  notes.value          = ''
  contactConsent.value = false
  errorMessage.value   = ''
  submitted.value      = false
  submitting.value     = false
}

async function submitForm() {
  errorMessage.value = ''
  if (!selectedJour.value || !selectedLieu.value) {
    errorMessage.value = 'Veuillez sélectionner un jour et un lieu.'
    return
  }
  if (!name.value.trim() || !email.value.trim()) {
    errorMessage.value = 'Veuillez remplir le nom et l\'email.'
    return
  }
  submitting.value = true
  try {
    await airtable.sendRecord('e', {
      Session:                      sessionLabel.value,
      Jour:                         jours.find(j => j.id === selectedJour.value)?.value,
      Lieu:                         lieux.find(l => l.id === selectedLieu.value)?.value,
      Créneau:                      selectedCreneau.value || '',
      'Nom et Prénom':              name.value.trim(),
      Email:                        email.value.trim(),
      Téléphone:                    phone.value.trim(),
      'Organisation / Fonction':    organization.value.trim(),
      'Public ciblé':               publicType.value.trim(),
      'Nombre de participant·e·s':  count.value ? parseInt(count.value, 10) : 1,
      'Accepte contact':            contactConsent.value ? 'Oui' : 'Non',
      Notes:                        notes.value.trim()
    })
    airtable.addEventRegistration({
      session: sessionLabel.value,
      count:   count.value ? parseInt(count.value, 10) : 1,
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

<style scoped>
/* ─── Grille des jours ─── */
.jour-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 8px;
}

.jour-card {
  border: 2px solid #e8ddd0;
  border-radius: 14px;
  padding: 16px 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.28s cubic-bezier(.4, 0, .2, 1);
  background: rgba(255,255,255,.95);
  user-select: none;
}
.jour-card:hover {
  border-color: var(--or);
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(132,89,54,.12);
}
.jour-card.sel {
  border-color: var(--or);
  background: linear-gradient(135deg, rgba(132,89,54,.08), rgba(249,178,51,.1));
  box-shadow: 0 8px 22px rgba(132,89,54,.18);
}
.jour-num {
  font-size: 1rem;
  font-weight: 900;
  color: var(--brun);
  text-transform: uppercase;
  letter-spacing: 1px;
}
.jour-card.sel .jour-num { color: var(--or); }
.jour-date {
  font-size: .78rem;
  color: #999;
  margin-top: 4px;
  font-weight: 600;
}
.jour-card.sel .jour-date { color: var(--brun); }

/* ─── Grille des lieux ─── */
.lieu-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 8px;
}

.lieu-card {
  border: 2px solid #e8ddd0;
  border-radius: 14px;
  padding: 18px 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.28s cubic-bezier(.4, 0, .2, 1);
  background: rgba(255,255,255,.95);
  user-select: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.lieu-card:hover {
  border-color: var(--or);
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(132,89,54,.12);
}
.lieu-card.sel {
  border-color: var(--rouge);
  background: rgba(177,34,42,.07);
  box-shadow: 0 8px 22px rgba(177,34,42,.14);
}
.lieu-icon { color: var(--or); transition: color 0.25s; }
.lieu-card.sel .lieu-icon { color: var(--rouge); }
.lieu-name {
  font-size: .78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .3px;
  color: var(--brun);
  line-height: 1.3;
}
.lieu-card.sel .lieu-name { color: var(--rouge); }

/* ─── Aperçu session composée ─── */
.session-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 14px;
  background: linear-gradient(135deg, rgba(132,89,54,.06), rgba(249,178,51,.08));
  border: 1px solid rgba(132,89,54,.18);
  border-radius: 10px;
  font-size: .82rem;
  font-weight: 600;
  color: var(--brun);
}
.session-preview .app-icon { color: var(--or); flex-shrink: 0; }

/* ─── Transitions ─── */
.slide-down-enter-active {
  animation: slideDown 0.35s cubic-bezier(.22, 1, .36, 1);
}
.slide-down-leave-active {
  animation: slideDown 0.2s ease-in reverse;
}
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-12px); }
  to   { opacity: 1; transform: translateY(0); }
}

@media (max-width: 580px) {
  .jour-grid { grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .lieu-grid { grid-template-columns: 1fr; }
}
</style>
