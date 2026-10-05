<template>
  <div class="request-shell">
    <header class="request-header">
      <img src="/images/logo-dark.jpg" alt="Musée Virtuel de Guinée" />
      <div>
        <p>Musée Virtuel de Guinée</p>
        <h1>Demande d’invitation</h1>
      </div>
    </header>

    <main class="request-main">
      <section v-if="loading" class="request-panel request-state">Chargement de l’événement…</section>
      <section v-else-if="error" class="request-panel request-state request-error">
        <h2>Demande indisponible</h2>
        <p>{{ error }}</p>
      </section>
      <template v-else-if="evenement">
        <section class="request-event">
          <p class="request-kicker">Demande liée à l’événement</p>
          <h2>{{ evenement.titre }}</h2>
          <p v-if="evenement.date_debut" class="request-date">{{ formatDate(evenement.date_debut) }}</p>
          <p v-if="evenement.lieu" class="request-date">{{ evenement.lieu }}</p>
          <p class="request-note">Votre demande sera examinée par l’équipe. Elle ne confirme pas votre participation. Si elle est approuvée, vous recevrez une invitation par e-mail pour répondre.</p>
        </section>

        <section v-if="submitted" class="request-panel request-success" role="status">
          <AppIcon name="check-circle" :size="28" />
          <h2>Demande envoyée</h2>
          <p>{{ successMessage }}</p>
        </section>

        <form v-else class="request-panel request-form" @submit.prevent="submitRequest">
          <div class="request-field-grid">
            <label>Prénom *<input v-model.trim="form.first_name" required maxlength="100" autocomplete="given-name" /></label>
            <label>Nom *<input v-model.trim="form.last_name" required maxlength="100" autocomplete="family-name" /></label>
            <label class="field-wide">Adresse e-mail *<input v-model.trim="form.email" type="email" required maxlength="254" autocomplete="email" /></label>
            <label>Organisation<input v-model.trim="form.organization" maxlength="150" autocomplete="organization" /></label>
            <label>Fonction<input v-model.trim="form.job_title" maxlength="150" /></label>
            <label class="field-wide">Téléphone<input v-model.trim="form.phone" type="tel" maxlength="40" autocomplete="tel" /></label>
            <label class="field-wide">Motif de la demande<textarea v-model.trim="form.message" maxlength="1000" rows="4" placeholder="Quelques mots pour accompagner votre demande (facultatif)"></textarea></label>
          </div>

          <p class="request-privacy">Ces informations seront utilisées par l’équipe pour examiner votre demande et vous répondre.</p>
          <p v-if="submitError" class="request-error" role="alert">{{ submitError }}</p>
          <button class="request-submit" type="submit" :disabled="submitting">
            <AppIcon :name="submitting ? 'loader' : 'send'" :size="17" />
            {{ submitting ? 'Envoi en cours…' : 'Envoyer ma demande' }}
          </button>
        </form>
      </template>
    </main>

    <footer class="request-footer">Musée Virtuel de Guinée · MVG event’s</footer>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'

const route = useRoute()
const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '')
const evenement = ref(null)
const loading = ref(true)
const submitting = ref(false)
const submitted = ref(false)
const error = ref('')
const submitError = ref('')
const successMessage = ref('Votre demande a été enregistrée. Un accusé de réception vous sera envoyé par e-mail.')
const form = reactive({
  first_name: '',
  last_name: '',
  email: '',
  organization: '',
  job_title: '',
  phone: '',
  message: ''
})

onMounted(async () => {
  try {
    const response = await fetch(`${apiUrl}/api/rsvp/evenement/${encodeURIComponent(route.params.eventId)}`)
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error || 'Événement introuvable ou indisponible.')
    evenement.value = data
  } catch (requestError) {
    error.value = requestError.message
  } finally {
    loading.value = false
  }
})

async function submitRequest() {
  submitting.value = true
  submitError.value = ''
  try {
    const response = await fetch(`${apiUrl}/api/invitation-requests/${encodeURIComponent(route.params.eventId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(data.error || 'Impossible d’envoyer la demande.')
    successMessage.value = data.message || successMessage.value
    submitted.value = true
  } catch (requestError) {
    submitError.value = requestError.message
  } finally {
    submitting.value = false
  }
}

function formatDate(value) {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(new Date(value))
}
</script>

<style scoped>
.request-shell { min-height: 100vh; padding: 0 16px 32px; background: #f4f7f5; color: #17211e; font-family: Arial, Helvetica, sans-serif; }
.request-header { display: flex; align-items: center; gap: 16px; max-width: 760px; margin: 0 auto; padding: 24px 0; border-bottom: 1px solid #bdcec8; }
.request-header img { width: 86px; height: 54px; object-fit: contain; }
.request-header p { margin: 0 0 4px; color: #b45332; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
.request-header h1 { margin: 0; color: #28336f; font-size: 22px; }
.request-main { display: grid; gap: 18px; width: 100%; max-width: 680px; margin: 28px auto; }
.request-event { padding: 22px 24px; border-left: 4px solid #b45332; background: #fff; }
.request-kicker { margin: 0 0 8px; color: #b45332; font-size: 12px; font-weight: 700; text-transform: uppercase; }
.request-event h2, .request-state h2, .request-success h2 { margin: 0; color: #28336f; font-size: 21px; }
.request-date { margin: 10px 0 0; color: #3f514b; }
.request-note { margin: 16px 0 0; padding-top: 14px; border-top: 1px solid #e2eae6; line-height: 1.6; }
.request-panel { padding: 24px; border: 1px solid #d5e0dc; background: #fff; }
.request-field-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.request-field-grid label { display: grid; gap: 7px; color: #28336f; font-size: 13px; font-weight: 700; }
.field-wide { grid-column: 1 / -1; }
.request-field-grid input, .request-field-grid textarea { width: 100%; min-width: 0; padding: 11px 12px; border: 1px solid #bdcec8; border-radius: 4px; background: #fff; color: #17211e; font: inherit; font-weight: 400; }
.request-field-grid input:focus, .request-field-grid textarea:focus { border-color: #28336f; outline: 2px solid #28336f22; }
.request-submit { display: inline-flex; align-items: center; justify-content: center; gap: 9px; min-height: 44px; margin-top: 20px; padding: 0 18px; border: 0; border-radius: 4px; background: #28336f; color: #fff; font: inherit; font-weight: 700; cursor: pointer; }
.request-submit:disabled { opacity: .6; cursor: wait; }
.request-privacy { margin: 16px 0 0; color: #61716b; font-size: 12px; line-height: 1.5; }
.request-error { color: #a42d34; }
.request-success { color: #20623a; }
.request-success svg { margin-bottom: 10px; }
.request-state { line-height: 1.6; }
.request-footer { max-width: 680px; margin: 0 auto; padding-top: 16px; border-top: 1px solid #bdcec8; color: #52635d; font-size: 12px; text-align: center; }
@media (max-width: 560px) { .request-field-grid { grid-template-columns: 1fr; } .request-field-grid label { grid-column: 1 / -1; } .request-panel, .request-event { padding: 18px; } .request-submit { width: 100%; } }
</style>