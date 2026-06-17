<template>
  <div class="profile-shell">
    <div class="page-header-section" v-reveal="0">
      <div class="header-bg">
        <div class="header-overlay"></div>
      </div>
      <div class="header-content">
        <span class="header-badge">Paramètres</span>
        <h1 class="header-title">Mon Profil</h1>
        <p class="header-subtitle">Gérez vos informations et votre mot de passe</p>
      </div>
    </div>

    <section class="main-content-section" v-reveal="100">
      <div class="profile-container">
        <div class="profile-left-col">
          <!-- Informations du profil -->
        <div class="form-card profile-info-card">
          <div class="fh fh-a">
            <div class="fh-icon"><AppIcon name="user" :size="24" /></div>
            <div class="fh-title">Informations Personnelles</div>
          </div>
          <div class="fb profile-info-body">
            <div class="avatar-large">
              <AppIcon name="user" :size="48" />
            </div>
            <div class="info-details">
              <h3>{{ fullName }}</h3>
              <p class="info-email"><AppIcon name="mail" :size="16" /> {{ apiStore.userEmail }}</p>
              <span class="info-role">{{ roleLabel }}</span>
            </div>
          </div>
        </div>

        <!-- Déconnexion -->
        <div class="form-card profile-logout-card" style="border: 1px solid rgba(177, 34, 42, 0.2);">
          <div class="fb" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
            <div>
              <h3 style="color: var(--rouge); margin-bottom: 4px;">Déconnexion</h3>
              <p style="font-size: 0.9rem; color: #666; margin: 0;">Fermer la session actuelle.</p>
            </div>
            <button class="bsub" style="background: rgba(177, 34, 42, 0.1); color: var(--rouge); margin-top: 0; width: auto;" @click="handleLogout">
              <AppIcon name="log-out" :size="16" /> Se déconnecter
            </button>
          </div>
        </div>
      </div>

      <div class="profile-right-col">
        <!-- Modifier Mot de passe -->
        <div class="form-card profile-pwd-card">
          <div class="fh fh-a">
            <div class="fh-icon"><AppIcon name="key" :size="24" /></div>
            <div class="fh-title">Modifier le mot de passe</div>
          </div>
          <div class="fb">
            <form @submit.prevent="updatePassword" class="ev-form">
              <div class="fg">
                <label>Mot de passe actuel</label>
                <div style="position: relative;">
                  <input :type="showPwdCurrent ? 'text' : 'password'" v-model="pwdForm.current" required placeholder="Votre mot de passe actuel" />
                  <button type="button" class="pwd-toggle-btn" @click="showPwdCurrent = !showPwdCurrent">
                    <AppIcon :name="showPwdCurrent ? 'eye-off' : 'eye'" :size="16" />
                  </button>
                </div>
              </div>
              
              <div class="fr">
                <div class="fg">
                  <label>Nouveau mot de passe</label>
                  <div style="position: relative;">
                    <input :type="showPwdNew ? 'text' : 'password'" v-model="pwdForm.new" required placeholder="Au moins 6 caractères" minlength="6" />
                    <button type="button" class="pwd-toggle-btn" @click="showPwdNew = !showPwdNew">
                      <AppIcon :name="showPwdNew ? 'eye-off' : 'eye'" :size="16" />
                    </button>
                  </div>
                </div>
                <div class="fg">
                  <label>Confirmer le nouveau</label>
                  <input :type="showPwdNew ? 'text' : 'password'" v-model="pwdForm.confirm" required placeholder="Répéter le mot de passe" minlength="6" />
                </div>
              </div>

              <div v-if="pwdForm.error" class="form-error-msg">
                <AppIcon name="alert-triangle" :size="15" /> {{ pwdForm.error }}
              </div>
              <div v-if="pwdForm.success" class="form-success-msg" style="background: #e6f7eb; border: 1.5px solid var(--vert); border-radius: 12px; padding: 10px 14px; color: var(--vert); font-size: .84rem; font-weight: 600; margin-top: 12px; display: flex; align-items: center; gap: 8px;">
                <AppIcon name="check-circle" :size="15" /> {{ pwdForm.success }}
              </div>

              <div style="margin-top: 24px; text-align: right;">
                <button type="submit" class="bsub bsub-a modal-submit" :disabled="pwdForm.loading">
                  <AppIcon :name="pwdForm.loading ? 'loader' : 'check'" :size="16" :class="{ 'spin': pwdForm.loading }" />
                  {{ pwdForm.loading ? 'Mise à jour...' : 'Enregistrer le mot de passe' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useApiStore } from '../store/api.js'
import AppIcon from '../components/AppIcon.vue'

const apiStore = useApiStore()
const router = useRouter()

const fullName = computed(() => {
  if (apiStore.userPrenom || apiStore.userNom) {
    return `${apiStore.userPrenom || ''} ${apiStore.userNom || ''}`.trim()
  }
  return 'Administrateur'
})

const roleLabel = computed(() => {
  return apiStore.isSuperAdmin ? 'Super Administrateur' : 'Administrateur'
})

const showPwdCurrent = ref(false)
const showPwdNew = ref(false)

const pwdForm = ref({
  current: '',
  new: '',
  confirm: '',
  error: '',
  success: '',
  loading: false
})

async function updatePassword() {
  pwdForm.value.error = ''
  pwdForm.value.success = ''
  
  if (pwdForm.value.new !== pwdForm.value.confirm) {
    pwdForm.value.error = 'Les nouveaux mots de passe ne correspondent pas.'
    return
  }
  if (pwdForm.value.new.length < 6) {
    pwdForm.value.error = 'Le nouveau mot de passe doit faire au moins 6 caractères.'
    return
  }

  pwdForm.value.loading = true
  try {
    const res = await apiStore.put('/api/auth/password', {
      currentPassword: pwdForm.value.current,
      newPassword: pwdForm.value.new
    })
    pwdForm.value.success = res.message || 'Mot de passe mis à jour avec succès.'
    pwdForm.value.current = ''
    pwdForm.value.new = ''
    pwdForm.value.confirm = ''
    
    // Clear success message after 4 seconds
    setTimeout(() => {
      pwdForm.value.success = ''
    }, 4000)
  } catch (err) {
    pwdForm.value.error = err.message || 'Erreur lors de la mise à jour.'
  } finally {
    pwdForm.value.loading = false
  }
}

function handleLogout() {
  apiStore.logout()
  router.push('/')
}
</script>

<style scoped>
/* Page Header / Banner */
.page-header-section {
  position: relative;
  border-radius: 0;
  overflow: hidden;
  min-height: 250px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  box-shadow: 0 10px 25px rgba(89,55,22,0.1);
  margin-top: 0;
  margin-bottom: 24px;
  margin-left: -20px;
  width: calc(100% + 40px);
  padding: 30px 40px;
}
.header-bg {
  position: absolute; inset: 0; z-index: 1;
}
.header-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(90deg, rgba(26,16,8,0.8) 0%, rgba(26,16,8,0.4) 40%, rgba(89,55,22,0.1) 100%);
}
.header-content {
  position: relative; z-index: 2;
  text-align: left; color: #fff;
  max-width: 500px;
}
.header-badge {
  display: inline-block;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.3);
  padding: 6px 16px; border-radius: 999px;
  font-size: 0.72rem; font-weight: 700; letter-spacing: 2px;
  text-transform: uppercase; margin-bottom: 12px;
}
.header-title {
  font-size: 2.8rem; font-weight: 900; line-height: 1.15;
  margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1.5px;
}
.header-subtitle {
  font-size: 1.05rem; line-height: 1.5; opacity: 0.95;
  margin: 0; font-family: Arial, sans-serif;
}
@media (max-width: 600px) {
  .page-header-section {
    padding: 20px 20px;
    min-height: 180px;
  }
  .header-title { font-size: 1.8rem; }
  .header-subtitle { font-size: 0.9rem; }
}

.profile-shell {
  min-height: calc(100vh - 140px);
}
.profile-container {
  max-width: 1000px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 24px;
}
.profile-left-col,
.profile-right-col {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
@media (max-width: 768px) {
  .profile-container {
    grid-template-columns: 1fr;
  }
}
.profile-info-card {
  overflow: hidden;
}
.profile-info-body {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 24px;
}
.avatar-large {
  width: 90px;
  height: 90px;
  background: rgba(255, 127, 80, 0.15);
  color: var(--prim-orange);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.info-details h3 {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 8px;
}
.info-email {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 0.95rem;
  margin-bottom: 12px;
}
.info-role {
  display: inline-block;
  background: rgba(0,0,0,0.05);
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--brun);
}
.pwd-toggle-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pwd-toggle-btn:hover {
  color: var(--prim-orange);
}
.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  100% { transform: rotate(360deg); }
}
</style>
