<template>
  <div class="contact-shell">
    <!-- Hero Banner -->
    <section class="contact-hero form-card" v-reveal="0">
      <div class="contact-badge">
        <AppIcon name="mail" :size="16" /> Contact MVG
      </div>
      <h1>Nous sommes à votre écoute</h1>
      <p>
        Pour toute demande de partenariat, d’information sur les événements ou d’accompagnement autour du projet MVG,
        n'hésitez pas à nous écrire. L'équipe du Musée Virtuel de Guinée reviendra vers vous rapidement.
      </p>
    </section>

    <!-- Main Content Layout -->
    <div class="contact-layout-grid" v-reveal="100">
      <!-- Left side: Premium Message Form -->
      <div class="form-card contact-form-card">
        <div class="fh fh-a">
          <div class="fh-icon"><AppIcon name="send" :size="20" /></div>
          <div class="fh-title">Envoyer un message</div>
          <div class="fh-sub">Remplissez le formulaire ci-dessous pour soumettre votre demande.</div>
        </div>
        
        <div class="fb">
          <div v-if="success" class="omsg on">
            <div class="oico"><AppIcon name="check-circle" :size="48" /></div>
            <h3>Message envoyé avec succès !</h3>
          </div>

          <form v-else @submit.prevent="handleSubmit">
            <div class="fr">
              <div class="fg">
                <label for="prenom">Prénom <span class="req">*</span></label>
                <input type="text" id="prenom" v-model="form.prenom" required placeholder="Votre prénom" />
              </div>
              <div class="fg">
                <label for="nom">Nom <span class="req">*</span></label>
                <input type="text" id="nom" v-model="form.nom" required placeholder="Votre nom" />
              </div>
            </div>

            <div class="fg">
              <label for="email">Adresse E-mail <span class="req">*</span></label>
              <input type="email" id="email" v-model="form.email" required placeholder="Ex : nom@exemple.com" />
            </div>

            <div class="fg">
              <label for="sujet">Objet du message <span class="req">*</span></label>
              <select id="sujet" v-model="form.sujet" required>
                <option value="" disabled selected>Sélectionnez l'objet de votre demande...</option>
                <option value="Partenariat / Collaboration">Demande de partenariat ou collaboration</option>
                <option value="Information Événements">Information sur les expositions / événements</option>
                <option value="Presse & Médias">Demande presse & relations publiques</option>
                <option value="Signalement / Support">Support technique ou signalement de bug</option>
                <option value="Autre demande">Autre demande générale</option>
              </select>
            </div>

            <div class="fg">
              <label for="message">Votre message <span class="req">*</span></label>
              <textarea id="message" v-model="form.message" required placeholder="Saisissez ici le contenu de votre message..." rows="6"></textarea>
            </div>

            <div v-if="error" class="emsg on">
              <AppIcon name="alert-triangle" :size="15" /> {{ error }}
            </div>

            <button type="submit" class="bsub bsub-a" :disabled="submitting">
              <AppIcon :name="submitting ? 'loader' : 'send'" :class="{ spin: submitting }" :size="16" />
              {{ submitting ? 'Envoi en cours...' : 'Envoyer mon message' }}
            </button>
          </form>
        </div>
      </div>

      <!-- Right side: Sidebar Information -->
      <div class="contact-sidebar">
        <!-- Direct E-mail card -->
        <div class="contact-card-sidebar form-card mb-4">
          <div class="fh fh-v py-3">
            <div class="fh-title font-sm">
              <AppIcon name="mail" :size="16" /> Contact Direct
            </div>
          </div>
          <div class="fb py-4 flex-col gap-3">
            <div class="direct-contact-item">
              <h4>Par e-mail</h4>
              <p>
                <a href="mailto:musee@expertisefrance.fr" class="direct-link">
                  musee@expertisefrance.fr
                </a>
              </p>
            </div>
            <div class="direct-contact-item mt-2">
              <h4>Temps de réponse moyen</h4>
              <p class="text-muted">Sous 24 à 48 heures ouvrées.</p>
            </div>
          </div>
        </div>

        <!-- Location card -->
        <div class="contact-card-sidebar form-card">
          <div class="fh fh-a py-3">
            <div class="fh-title font-sm">
              <AppIcon name="map-pin" :size="16" /> Siège & Présence
            </div>
          </div>
          <div class="fb py-4 flex-col gap-3">
            <div class="direct-contact-item">
              <h4>Localisation principale</h4>
              <p>Musée National de Guinée · Conakry, République de Guinée</p>
            </div>
            <div class="direct-contact-item mt-2">
              <h4>Partenaires institutionnels</h4>
              <p class="text-muted">Expertise France, Ambassade de la France en Guinée et en Sierra Leone, CCFG, Ministère de la Culture, du Tourisme et de l'Artisanat de Guinée.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import { useApiStore } from '../store/api.js'

const api = useApiStore()

const form = ref({
  prenom: '',
  nom: '',
  email: '',
  sujet: '',
  message: ''
})

const sentData = ref(null)
const submitting = ref(false)
const success = ref(false)
const error = ref('')

async function handleSubmit() {
  submitting.value = true
  error.value = ''

  try {
    const result = await api.post('/api/contact', { ...form.value })
    sentData.value = { ...form.value }
    success.value = true
    if (result?.emailSent === false) {
      error.value = 'Votre message a bien été enregistré, mais l’e-mail de notification n’a pas pu être envoyé.'
    } else {
      setTimeout(() => {
        resetForm()
      }, 4000)
    }
  } catch (err) {
    error.value = err.message || "Une erreur est survenue lors de l'envoi de votre message. Veuillez réessayer."
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  form.value = {
    prenom: '',
    nom: '',
    email: '',
    sujet: '',
    message: ''
  }
  success.value = false
  sentData.value = null
}
</script>

<style scoped>
.contact-shell {
  display: flex;
  flex-direction: column;
  gap: 28px;
  padding-bottom: 40px;
}
.contact-hero {
  padding: 36px 40px;
  border-radius: 24px;
}
.contact-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(249, 178, 51, 0.12);
  color: var(--or);
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.contact-hero h1 {
  margin: 18px 0 12px;
  font-size: 2.2rem;
  color: var(--brun);
}
.contact-hero p {
  margin: 0;
  max-width: 800px;
  line-height: 1.7;
  color: #5e4632;
  font-size: 1.05rem;
}
.contact-layout-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 28px;
}
@media (max-width: 820px) {
  .contact-layout-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 600px) {
  .contact-hero {
    padding: 24px;
    border-radius: 16px;
  }
  .contact-hero h1 {
    font-size: 1.8rem;
  }
}
.contact-form-card {
  border-radius: 24px;
}
.font-sm {
  font-size: 0.95rem !important;
  display: flex;
  align-items: center;
  gap: 8px;
}
.contact-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.contact-card-sidebar {
  border-radius: 20px;
}
.mb-4 {
  margin-bottom: 1rem;
}
.flex-col {
  display: flex;
  flex-direction: column;
}
.gap-2 {
  gap: 8px;
}
.gap-3 {
  gap: 12px;
}
.direct-contact-item h4 {
  margin: 0 0 6px;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--brun);
}
.direct-contact-item p {
  margin: 0;
  font-size: 1.05rem;
  color: var(--noir);
}
.text-muted {
  color: #7c644f;
  font-size: 0.9rem !important;
}
.direct-link {
  color: var(--rouge);
  text-decoration: none;
  font-weight: 700;
  transition: color 0.2s ease;
}
.direct-link:hover {
  color: var(--or);
}
.mt-2 {
  margin-top: 8px;
}
.spin {
  animation: spinner-rotate 1s linear infinite;
}
@keyframes spinner-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
