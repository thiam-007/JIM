<template>
  <div class="app-wrapper">
    <!-- Si domaine administration et non connecté : écran de connexion plein écran dédié -->
    <div v-if="isAdminDomain && !apiStore.isConnected" class="admin-login-fullscreen">
      <div class="admin-login-box modal-box modal-confirm form-card">
        <div class="fh fh-a">
          <div class="fh-icon"><AppIcon name="lock" :size="22" /></div>
          <div class="fh-title">Connexion Équipe</div>
          <div class="fh-sub">Saisissez le mot de passe pour accéder à la gestion du Musée Virtuel de Guinée</div>
        </div>
        <div class="fb">
          <form @submit.prevent="handleLogin">
            <div class="fg">
              <label>Adresse E-mail</label>
              <input type="email" v-model="loginEmail" required placeholder="Ex : nom@expertisefrance.fr" />
            </div>
            <div class="fg">
              <label>Mot de passe</label>
              <div style="position: relative; display: flex; align-items: center;">
                <input :type="showPassword ? 'text' : 'password'" v-model="loginPassword" required placeholder="Mot de passe…" style="flex: 1; padding-right: 40px;" />
                <button type="button" @click="showPassword = !showPassword" style="position: absolute; right: 10px; background: none; border: none; cursor: pointer; color: #8b5a2b; display: flex; align-items: center; padding: 4px;" title="Afficher/Masquer le mot de passe">
                  <AppIcon :name="showPassword ? 'eye-off' : 'eye'" :size="18" />
                </button>
              </div>
            </div>
            <div v-if="loginError" class="form-error-msg">
              <AppIcon name="alert-triangle" :size="15" /> {{ loginError }}
            </div>
            <button type="submit" class="bsub bsub-a modal-submit" :disabled="loggingIn">
              <AppIcon :name="loggingIn ? 'loader' : 'check'" :size="16" />
              {{ loggingIn ? 'Connexion…' : 'Se connecter' }}
            </button>
          </form>
          <div style="margin-top: 24px; text-align: center; border-top: 1px solid #e8d4b8; padding-top: 16px;">
            <a href="#" @click.prevent="returnToPublicSite" style="color: #6a5040; text-decoration: none; font-size: 14px; display: inline-flex; align-items: center; gap: 6px; font-family: 'Arial', sans-serif;">
              <AppIcon name="arrow-left" :size="14" /> Retour au site public
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Sinon, afficher le site normal (vitrine visiteur ou site d'admin connecté) -->
    <template v-else>
      <header>
        <div class="header-inner">
          <RouterLink class="header-branding" to="/">
            <div class="logo-badge">
              <img src="/images/logo.jpeg" alt="MVG" />
            </div>
            <div class="logo-text">
              <div class="logo-title-wrap">
                <span class="logo-pre">MVG</span>
                <h1>event's</h1>
              </div>
              <span>Explorer, préserver et transmettre le patrimoine à l'ère du numérique</span>
            </div>
          </RouterLink>
        </div>
      </header>

      <div class="app-shell">
        <nav class="nav-tabs">
          <RouterLink class="nav-tab" :class="{ active: route.name === 'Home' }" to="/">
            <AppIcon name="home" :size="16" /> Accueil
          </RouterLink>
          <div v-if="!isAdminDomain" class="nav-dropdown-wrapper">
            <div class="nav-tab nav-tab-dropdown" :class="{ active: route.name === 'Apropos' || route.name === 'RevuePresse' }">
              <AppIcon name="info" :size="16" /> Le Projet
              <AppIcon name="chevron-down" :size="14" class="dropdown-icon" />
            </div>
            <div class="nav-dropdown-menu">
              <RouterLink class="nav-dropdown-item" :class="{ active: route.name === 'Apropos' }" to="/a-propos">
                <AppIcon name="info" :size="14" /> À propos
              </RouterLink>
              <RouterLink class="nav-dropdown-item" :class="{ active: route.name === 'RevuePresse' }" to="/revue-presse">
                <AppIcon name="award" :size="14" /> Revue de Presse
              </RouterLink>
            </div>
          </div>
          <RouterLink v-if="!isAdminDomain && !apiStore.isConnected" class="nav-tab" :class="{ active: route.name === 'Actualites' || route.name === 'ActualiteDetail' }" to="/actualites">
            <AppIcon name="file-text" :size="16" /> Actualité
          </RouterLink>
          <RouterLink class="nav-tab" :class="{ active: route.name === 'Evenements' }" to="/evenements">
            <AppIcon name="calendar" :size="16" /> Événement
          </RouterLink>
          <RouterLink v-if="apiStore.isConnected" class="nav-tab" :class="{ active: route.name === 'Invites' }" to="/invites">
            <AppIcon name="users" :size="16" /> Invités
          </RouterLink>
          <RouterLink v-if="apiStore.isConnected" class="nav-tab" :class="{ active: route.name === 'ManageActualites' }" to="/admin/actualites">
            <AppIcon name="file-text" :size="16" /> Gérer Actus
          </RouterLink>
          <RouterLink v-if="apiStore.isConnected && apiStore.isSuperAdmin" class="nav-tab" :class="{ active: route.name === 'ManageAdmins' }" to="/admin/utilisateurs">
            <AppIcon name="users" :size="16" /> Gérer Admins
          </RouterLink>
          <RouterLink v-if="apiStore.isConnected" class="nav-tab" :class="{ active: route.name === 'ManageNewsletters' }" to="/admin/newsletters">
            <AppIcon name="mail" :size="16" /> Newsletters
          </RouterLink>
          <RouterLink v-if="apiStore.isConnected" class="nav-tab" :class="{ active: route.name === 'ManageRevuePresse' }" to="/admin/revue-presse">
            <AppIcon name="award" :size="16" /> Revue Presse
          </RouterLink>
          <RouterLink v-if="!apiStore.isConnected" class="nav-tab" :class="{ active: route.name === 'Contact' }" to="/contact">
            <AppIcon name="mail" :size="16" /> Contact
          </RouterLink>
          <RouterLink v-if="apiStore.isConnected" class="nav-tab profile-tab" :class="{ active: route.name === 'Profile' }" to="/profil">
            <AppIcon name="user" :size="16" /> Mon Profil
          </RouterLink>
        </nav>

        <!-- Bannière mise à jour PWA -->
        <div v-if="needsRefresh" class="pwa-update-banner">
          <AppIcon name="refresh-cw" :size="16" />
          <span>Nouvelle version disponible</span>
          <button @click="updateApp">Mettre à jour</button>
        </div>

        <main>
          <RouterView v-slot="{ Component, route }">
            <Transition 
              mode="out-in"
              @enter="onPageEnter"
              @leave="onPageLeave"
              :css="false"
            >
              <component :is="Component" :key="route.path" />
            </Transition>
          </RouterView>
        </main>
      </div>

      <!-- ─── Partenaires Marquee ─── -->
      <div class="partners-marquee-section">
        <div class="marquee-content">
          <img src="/images/partenaires/ambassade-france-guinee.png" alt="Ambassade de France en Guinée" />
          <img src="/images/partenaires/ccfg.png" alt="CCFG" />
          <img src="/images/partenaires/expertise-france.png" alt="Expertise France" />
          <img src="/images/partenaires/mcta.jpg" alt="MCTA" />
          <img src="/images/partenaires/meae.png" alt="MEAE" />
          <img src="/images/partenaires/musee-national-guinee.jpg" alt="Musée National de Guinée" />
          <!-- Duplicate for loop -->
          <img src="/images/partenaires/ambassade-france-guinee.png" alt="Ambassade de France en Guinée" />
          <img src="/images/partenaires/ccfg.png" alt="CCFG" />
          <img src="/images/partenaires/expertise-france.png" alt="Expertise France" />
          <img src="/images/partenaires/mcta.jpg" alt="MCTA" />
          <img src="/images/partenaires/meae.png" alt="MEAE" />
          <img src="/images/partenaires/musee-national-guinee.jpg" alt="Musée National de Guinée" />
        </div>
      </div>

      <footer class="main-footer">
        <div class="footer-container">
          <!-- À gauche : Logo -->
          <div class="footer-col footer-logo">
            <RouterLink class="header-branding" to="/" style="align-items: flex-start;">
              <div class="logo-badge" style="width: 80px; height: 80px; align-self: center;">
                <img src="/images/logo.jpeg" alt="MVG" style="width: 68px; height: 68px;" />
              </div>
              <div class="logo-text">
                <div class="logo-title-wrap">
                  <span class="logo-pre" style="font-size: 1.6rem;">MVG</span>
                  <h1 style="font-size: 1.6rem;">event's</h1>
                </div>
                <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 2px; color: rgba(255,255,255,0.7); display: block; margin-top: 6px; line-height: 1.4;">Explorer, préserver et transmettre le patrimoine à l'ère du numérique</span>
              </div>
            </RouterLink>
          </div>

          <!-- Au centre : Liens utiles -->
          <div class="footer-col footer-links">
            <h3>Liens utiles</h3>
            <ul>
              <li><RouterLink to="/">Accueil</RouterLink></li>
              <li><RouterLink to="/a-propos">À propos</RouterLink></li>
              <li><RouterLink to="/evenements">Événements</RouterLink></li>
            </ul>
          </div>

          <!-- À droite : Réseaux Sociaux -->
          <div class="footer-col footer-social">
            <h3>Suivez-nous</h3>
            <div class="social-icons">
              <a href="https://www.facebook.com/profile.php?id=61584717626322" target="_blank" aria-label="Facebook" class="social-icon">
                <AppIcon name="facebook" :size="22" />
              </a>
              <a href="https://www.instagram.com/museevirtuelguinee?igsh=MWNsbmlrcGV6bnM3Nw==" target="_blank" aria-label="Instagram" class="social-icon">
                <AppIcon name="instagram" :size="22" />
              </a>
              <a href="https://twitter.com" target="_blank" aria-label="Twitter" class="social-icon">
                <AppIcon name="twitter" :size="22" />
              </a>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          &copy; {{ new Date().getFullYear() }} Musée Virtuel de Guinée · MVG event's
        </div>
      </footer>
      
      <!-- Modal Connexion Admin (conservé par sécurité, mais masqué par défaut) -->
      <Teleport to="body">
        <div v-if="showLoginModal" class="modal-backdrop" @click.self="closeLogin">
          <div class="modal-box modal-confirm form-card">
            <div class="fh fh-a">
              <div class="fh-icon"><AppIcon name="lock" :size="22" /></div>
              <div class="fh-title">Connexion Équipe</div>
              <div class="fh-sub">Saisissez le mot de passe pour accéder à la gestion</div>
            </div>
            <div class="fb">
              <form @submit.prevent="handleLogin">
                <div class="fg">
                  <label>Adresse E-mail</label>
                  <input type="email" v-model="loginEmail" required placeholder="Ex : nom@expertisefrance.fr" />
                </div>
                <div class="fg">
                  <label>Mot de passe</label>
                  <input type="password" v-model="loginPassword" required placeholder="Mot de passe…" />
                </div>
                <div v-if="loginError" class="form-error-msg">
                  <AppIcon name="alert-triangle" :size="15" /> {{ loginError }}
                </div>
                <div class="modal-actions">
                  <button type="button" class="btn-cancel" @click="closeLogin" :disabled="loggingIn">Annuler</button>
                  <button type="submit" class="bsub bsub-a modal-submit" :disabled="loggingIn">
                    <AppIcon :name="loggingIn ? 'loader' : 'check'" :size="16" />
                    {{ loggingIn ? 'Connexion…' : 'Se connecter' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Teleport>



      <!-- Scroll Progress Button -->
      <button class="scroll-top-btn" @click="handleScrollBtn" :aria-label="isScrolledDown ? 'Remonter' : 'Descendre'">
        <svg class="progress-circle" viewBox="0 0 100 100">
          <circle class="progress-bg" cx="50" cy="50" r="45"></circle>
          <circle class="progress-bar" cx="50" cy="50" r="45" :style="{ strokeDashoffset: 283 - (283 * scrollProgress) / 100 }"></circle>
        </svg>
        <AppIcon :name="isScrolledDown ? 'chevron-up' : 'chevron-down'" :size="20" class="scroll-icon" />
      </button>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter, RouterLink, RouterView } from 'vue-router'
import { useRegisterSW } from 'virtual:pwa-register/vue'
import { useApiStore } from './store/api.js'
import AppIcon from './components/AppIcon.vue'
import { animate } from 'animejs'

function onPageEnter(el, done) {
  animate(el, {
    opacity: [0, 1],
    translateY: [15, 0],
    duration: 300,
    easing: 'easeOutQuad',
    onComplete: done
  });
}

function onPageLeave(el, done) {
  animate(el, {
    opacity: [1, 0],
    translateY: [0, -10],
    duration: 150,
    easing: 'easeInQuad',
    onComplete: done
  });
}

const { needRefresh: needsRefresh, updateServiceWorker } = useRegisterSW({
  onRegisteredSW(_, r) {
    r && setInterval(() => r.update(), 60_000)
  }
})
function updateApp() {
  updateServiceWorker(true)
}

const route = useRoute()
const router = useRouter()
const apiStore = useApiStore()

// Détection réactive du sous-domaine admin
const isAdminDomain = computed(() => {
  const hostname = window.location.hostname
  const adminDomain = import.meta.env.VITE_ADMIN_DOMAIN || 'admin.mvg-events.com'
  const adminQueryParam = import.meta.env.VITE_ADMIN_QUERY_PARAM || 'admin'
  return hostname === adminDomain || 
         hostname.startsWith('admin.') || 
         new URLSearchParams(window.location.search).get(adminQueryParam) === 'true'
})

const showLoginModal = ref(false)
const showPassword = ref(false)
const loginEmail = ref('')
const loginPassword = ref('')
const loginError = ref('')
const loggingIn = ref(false)



function returnToPublicSite() {
  const publicUrl = import.meta.env.VITE_PUBLIC_DOMAIN || '/'
  window.location.href = publicUrl.replace('?admin=true', '').replace('&admin=true', '')
}

function openLogin() {
  loginEmail.value = ''
  loginPassword.value = ''
  loginError.value = ''
  showLoginModal.value = true
}

function closeLogin() {
  showLoginModal.value = false
}

async function handleLogin() {
  if (!loginEmail.value || !loginPassword.value) return
  loggingIn.value = true
  loginError.value = ''
  try {
    await apiStore.login(loginEmail.value.trim(), loginPassword.value)
    closeLogin()
    if (route.name !== 'Home') {
      router.push('/')
    }
  } catch (err) {
    loginError.value = err.message || 'Identifiants incorrects'
  } finally {
    loggingIn.value = false
  }
}

function handleLogout() {
  apiStore.logout()
  router.push('/')
}

// Scroll Progress Logic
const scrollProgress = ref(0)
const isScrolledDown = ref(false)

function onScroll() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop
  const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight
  if (docHeight > 0) {
    scrollProgress.value = (scrollTop / docHeight) * 100
  } else {
    scrollProgress.value = 0
  }
  isScrolledDown.value = scrollProgress.value > 50
}

function handleScrollBtn() {
  if (isScrolledDown.value) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } else {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
  }
}

onMounted(() => {
  if (isAdminDomain.value) {
    window.addEventListener('open-login', openLogin)
  }
  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('open-login', openLogin)
  window.removeEventListener('scroll', onScroll)
})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&family=Montserrat:ital,wght@0,300;0,400;0,600;0,700;1,300&display=swap');

:root {
  --or: #845936;
  --rouge: #B1222A;
  --brun: #593716;
  --terre: #8C3B2A;
  --gold: #F9B233;
  --blanc: #FFFFFF;
  --noir: #1a1008;
  --creme: #fdf6ed;
  --surface: rgba(255,255,255,.88);
  --shadow: 0 12px 40px rgba(89, 55, 22, .15);
  --radius: 20px;
  --trans: all .28s cubic-bezier(.4, 0, .2, 1);
}
*, *::before, *::after { box-sizing: border-box; }
html, body { min-height: 100%; }
body {
  margin: 0;
  font-family: Tahoma, Arial, Verdana, sans-serif;
  background: radial-gradient(circle at top left, rgba(249, 178, 51, .08), transparent 28%),
              linear-gradient(180deg, #fef9f2 0%, #f7e8d8 60%, #e8ddd0 100%);
  color: var(--noir);
}
html { scroll-behavior: smooth; }
::selection { background: rgba(249, 178, 51, .35); color: var(--noir); }
button, input, textarea, select { font: inherit; }
.app-wrapper { display: flex; flex-direction: column; min-height: 100vh; overflow-x: hidden; }
.app-shell { max-width: 1180px; margin: 0 auto; padding: 0 16px 28px; width: 100%; flex: 1; }

/* ─── Header ─── */
header {
  background:
    linear-gradient(135deg, rgba(46, 26, 11, 0.96) 0%, rgba(77, 43, 19, 0.94) 50%, rgba(20, 12, 6, 1) 100%),
    url('/images/motif-removebg-preview.png') center/auto 120% repeat;
  color: var(--blanc);
  padding: 24px 30px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, .3);
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 2px solid var(--gold);
  animation: fadeInDown 0.5s ease-out;
  overflow: hidden;
  width: 100%;
  transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
}
header:hover {
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45);
  border-bottom-color: #ffffff;
  background-position: center 30%;
}
.header-inner {
  max-width: 1180px; margin: 0 auto; width: 100%;
  display: flex; align-items: center; justify-content: space-between; gap: 18px;
}
.header-branding {
  display: flex; align-items: center; gap: 24px; flex: 1;
  text-decoration: none;
  color: inherit;
}
header::after {
  content: '';
  position: absolute;
  top: 0; left: -100%; width: 60%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.12), transparent);
  animation: headerShimmer 4s ease-in-out 1s infinite;
  pointer-events: none;
}
@keyframes headerShimmer {
  0%   { left: -60%; }
  60%, 100% { left: 120%; }
}
.logo-badge {
  width: 120px; height: 120px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  border: 2.5px solid rgba(249, 178, 51, 0.25);
  border-radius: 50%;
  padding: 4px;
  background: rgba(0, 0, 0, 0.2);
  transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
  animation: float 3s ease-in-out infinite;
}
header:hover .logo-badge {
  transform: scale(1.05) rotate(4deg);
  border-color: var(--gold);
  box-shadow: 0 0 25px rgba(249, 178, 51, 0.35);
}
.logo-badge img {
  width: 106px; height: 106px;
  object-fit: cover;
  border-radius: 50%;
  display: block;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,.25));
  transition: all 0.5s ease;
}
header:hover .logo-badge img {
  filter: drop-shadow(0 4px 12px rgba(249, 178, 51, 0.25));
}
.logo-text { flex: 1; }
.logo-title-wrap {
  display: flex; align-items: baseline; gap: 12px;
}
.logo-pre {
  font-family: 'Cinzel', serif;
  font-size: 2.1rem; font-weight: 800; color: var(--gold);
  letter-spacing: 4px;
  text-shadow: 0 2px 4px rgba(0,0,0,0.4);
  transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
}
header:hover .logo-pre {
  color: #ffffff;
  text-shadow: 0 0 15px rgba(249, 178, 51, 0.65);
}
.logo-title-wrap h1 {
  font-family: 'Montserrat', sans-serif;
  font-size: 2.1rem; font-weight: 300;
  letter-spacing: 5px;
  text-transform: uppercase;
  line-height: 1.15;
  margin: 0;
  color: #ffffff;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
}
header:hover .logo-title-wrap h1 {
  letter-spacing: 7px;
  font-weight: 400;
}
.logo-text span {
  font-family: 'Montserrat', sans-serif;
  font-size: 0.9rem;
  font-weight: 400;
  color: rgba(255,255,255,.75);
  letter-spacing: 4px;
  text-transform: uppercase;
  display: block;
  margin-top: 6px;
  transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
}
header:hover .logo-text span {
  color: var(--gold);
  letter-spacing: 5px;
}
.jim-badge {
  background: rgba(255,255,255,.18); color: var(--blanc);
  padding: 8px 16px; border-radius: 999px;
  font-size: .72rem; font-weight: 700; letter-spacing: 1.6px; text-transform: uppercase;
  border: 1px solid rgba(255,255,255,.35); white-space: nowrap;
}

/* ─── Nav ─── */
.nav-tabs {
  background: rgba(255,255,255,.92);
  display: flex; flex-wrap: wrap; justify-content: center;
  gap: 10px; padding: 10px;
  margin: 20px 0 0;
  border-radius: 999px;
  box-shadow: 0 10px 28px rgba(89, 55, 22, .08);
  animation: fadeInScale 0.6s ease-out 0.2s backwards;
}
.nav-tab {
  min-width: 140px;
  padding: 12px 18px;
  background: rgba(255,255,255,.9);
  border: 1px solid rgba(132, 89, 54, .14);
  color: var(--brun);
  cursor: pointer;
  font-size: .78rem; font-weight: 700;
  letter-spacing: .8px; text-transform: uppercase;
  transition: var(--trans);
  border-radius: 999px;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  white-space: nowrap; text-decoration: none;
}
.nav-tab:hover {
  color: var(--brun);
  transform: translateY(-2px) scale(1.01);
  box-shadow: 0 10px 22px rgba(132, 89, 54, .12);
}
.nav-tab.active {
  color: var(--blanc);
  background: linear-gradient(135deg, var(--brun), var(--or));
  border-color: transparent;
  box-shadow: 0 12px 28px rgba(132, 89, 54, .2);
}

/* Nav Dropdown */
.nav-dropdown-wrapper {
  position: relative;
  display: flex;
}
.nav-tab-dropdown {
  cursor: pointer;
}
.dropdown-icon {
  margin-left: 2px;
  transition: transform 0.2s;
}
.nav-dropdown-wrapper:hover .dropdown-icon {
  transform: rotate(180deg);
}
.nav-dropdown-menu {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(10px);
  margin-top: 8px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(89, 55, 22, 0.15);
  min-width: 200px;
  display: flex;
  flex-direction: column;
  padding: 8px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
  z-index: 100;
  border: 1px solid rgba(132, 89, 54, 0.1);
}
.nav-dropdown-wrapper:hover .nav-dropdown-menu {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0);
}
.nav-dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  color: var(--brun-fonce);
  text-decoration: none;
  font-size: 0.8rem;
  font-weight: 700;
  border-radius: 8px;
  transition: all 0.2s;
  text-transform: uppercase;
}
.nav-dropdown-item:hover, .nav-dropdown-item.active {
  background: rgba(132, 89, 54, 0.08);
  color: var(--brun);
}

/* ─── Partenaires Marquee ─── */
.partners-marquee-section {
  background: rgba(255,255,255,.6);
  border-top: 1px solid rgba(132,89,54,.15);
  border-bottom: 1px solid rgba(132,89,54,.15);
  padding: 24px 0;
  overflow: hidden;
  display: flex;
  white-space: nowrap;
  width: 100%;
}
.marquee-content {
  display: inline-flex;
  align-items: center;
  animation: marquee 30s linear infinite;
  gap: 60px;
  padding-left: 60px;
}
.marquee-content img {
  height: 60px;
  object-fit: contain;
  filter: grayscale(100%) opacity(0.7);
  transition: all 0.3s ease;
}
.marquee-content img:hover {
  filter: grayscale(0%) opacity(1);
  transform: scale(1.05);
}
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(calc(-50% - 30px)); }
}

/* ─── PWA Update Banner ─── */
.pwa-update-banner {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 20px;
  background: #1a3a2a; color: #fff;
  font-size: .82rem; font-weight: 600;
}
.pwa-update-banner button {
  margin-left: auto; padding: 6px 16px;
  background: #fff; color: #1a3a2a;
  border: none; border-radius: 8px;
  font-size: .8rem; font-weight: 700; cursor: pointer;
}

/* ─── API Banner ─── */
.api-banner {
  margin: 20px 0;
  padding: 20px 22px;
  border-radius: 24px;
  display: flex; align-items: flex-start; gap: 16px;
  font-size: .92rem; font-weight: 600;
  background: rgba(255,255,255,.95);
  border: 1px solid rgba(132, 89, 54, .12);
  box-shadow: 0 16px 38px rgba(132, 89, 54, .08);
  animation: slideInLeft 0.6s ease-out 0.3s backwards;
}
.api-banner.config { background: #fffaf0; border-color: rgba(249, 178, 51, .28); color: #7a5500; }
.api-banner.connected { background: #edf7ee; border-color: rgba(76, 175, 80, .25); color: #2e7d32; }
.api-icon {
  font-size: 1.5rem; flex-shrink: 0; margin-top: 3px;
  width: 44px; height: 44px;
  display: grid; place-items: center;
  background: rgba(255,255,255,.9); border-radius: 50%;
  box-shadow: 0 10px 24px rgba(132, 89, 54, .08);
  animation: fadeInScale 0.6s ease-out 0.5s backwards;
}
.api-token-row {
  display: flex; gap: 12px; flex-wrap: wrap;
  margin-top: 12px; align-items: center;
}
.api-token-input {
  flex: 1 1 320px;
  padding: 12px 16px;
  border: 2px solid rgba(132, 89, 54, .18);
  border-radius: 999px;
  font-family: 'Courier New', monospace; font-size: .9rem;
  background: var(--blanc); color: var(--brun);
  outline: none; transition: var(--trans);
}
.api-token-input:focus {
  border-color: var(--rouge);
  box-shadow: 0 0 0 4px rgba(249, 178, 51, .12);
}
.btn-connect {
  background: linear-gradient(135deg, var(--brun), var(--or));
  color: var(--blanc); border: none;
  padding: 12px 24px; border-radius: 999px;
  font-size: .86rem; font-weight: 700;
  cursor: pointer; transition: var(--trans);
  white-space: nowrap;
  display: flex; align-items: center; gap: 8px;
  position: relative; overflow: hidden;
}
.btn-connect:hover { transform: translateY(-1px); filter: brightness(1.05); }
.btn-disconnect {
  background: transparent; color: #2e7d32;
  border: 1.5px solid rgba(46,125,50,.35);
  padding: 8px 16px; border-radius: 999px;
  font-size: .78rem; font-weight: 700; cursor: pointer;
  display: flex; align-items: center; gap: 6px;
  transition: var(--trans);
}
.btn-disconnect:hover { background: rgba(46,125,50,.08); }

/* ─── Main / Footer ─── */
main { max-width: 1120px; margin: 28px auto 60px; padding: 0 20px; }

footer {
  text-align: center; padding: 26px 10px 12px;
  color: var(--brun); font-size: .78rem; font-weight: 700;
  letter-spacing: 1.4px; text-transform: uppercase;
  border-top: 1px solid rgba(132, 89, 54, .12); margin-top: 20px;
  animation: fadeInUp 0.8s ease-out 0.4s backwards;
}
footer em { color: var(--rouge); font-style: normal; }

/* ─── Page transitions ─── */
.page-enter-active { animation: pageEnter 0.38s cubic-bezier(.22, 1, .36, 1); }
.page-leave-active { animation: pageLeave 0.22s ease-in; }
@keyframes pageEnter {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes pageLeave {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(-10px); }
}

/* ─── Scroll-reveal ─── */
.will-reveal {
  opacity: 0;
  transform: translateY(28px);
  transition: opacity 0.55s ease, transform 0.55s ease;
}
.will-reveal.revealed {
  opacity: 1;
  transform: translateY(0);
}

/* ─── Ripple effect ─── */
.ripple-wave {
  position: absolute;
  border-radius: 50%;
  background: rgba(255,255,255,.35);
  pointer-events: none;
  animation: ripple-expand 0.55s ease-out forwards;
}
@keyframes ripple-expand {
  from { transform: scale(0); opacity: 1; }
  to   { transform: scale(2.5); opacity: 0; }
}

/* ─── Form shells ─── */
.form-panel { display: none; }
.form-panel.active { display: block; animation: slideIn .32s ease; }
@keyframes slideIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
.form-card {
  background: var(--surface); border-radius: var(--radius);
  box-shadow: var(--shadow); overflow: hidden;
  border: 1px solid rgba(255,255,255,.75);
  animation: fadeInUp 0.6s ease-out;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.form-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 34px rgba(89, 55, 22, .12);
}

/* ─── Stats summary ─── */
.stats-summary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-bottom: 20px; }
.stat-card {
  background: rgba(132, 89, 54, .08); border: 1px solid rgba(132, 89, 54, .16);
  border-radius: 18px; padding: 18px 20px;
  display: flex; flex-direction: column; gap: 8px;
  animation: fadeInScale 0.5s ease-out backwards;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.stat-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(132, 89, 54, .12); }
.stat-card:nth-child(1) { animation-delay: 0.1s; }
.stat-card:nth-child(2) { animation-delay: 0.2s; }
.stat-card:nth-child(3) { animation-delay: 0.3s; }
.stat-card:nth-child(4) { animation-delay: 0.4s; }
.stat-card strong { font-size: .82rem; text-transform: uppercase; letter-spacing: 1px; color: var(--brun); }
.stat-card span { font-size: 1.65rem; font-weight: 900; color: var(--rouge); }

/* ─── Session counts ─── */
.session-counts { margin-bottom: 18px; }
.session-counts ul { list-style: none; padding: 0; margin: 12px 0 0; }
.session-counts li {
  padding: 14px 16px; border: 1px solid #e8ddd0;
  border-radius: 16px; margin-bottom: 12px;
  background: #fff; color: var(--brun);
  animation: fadeInUp 0.5s ease-out backwards;
  transition: transform 0.2s ease;
}
.session-counts li:hover { transform: translateX(4px); }
.session-counts li:nth-child(1) { animation-delay: 0.1s; }
.session-counts li:nth-child(2) { animation-delay: 0.2s; }
.session-counts li:nth-child(3) { animation-delay: 0.3s; }
.session-counts li:nth-child(4) { animation-delay: 0.4s; }
.session-counts li:nth-child(5) { animation-delay: 0.5s; }
.session-counts li strong { color: var(--rouge); margin-right: 8px; }

/* ─── Form header ─── */
.fh { padding: 28px 32px 24px; position: relative; overflow: hidden; }
.fh::before {
  content: ''; position: absolute; inset: 0;
  background: repeating-linear-gradient(60deg, rgba(255,255,255,.06) 0, rgba(255,255,255,.06) 1px, transparent 1px, transparent 18px);
}
.fh-a { background: linear-gradient(135deg, var(--brun), var(--or)); }
.fh-s { background: linear-gradient(135deg, var(--rouge), var(--terre)); }
.fh-v { background: linear-gradient(135deg, #1a3a2a, #2d6a4a); }
.fh-icon {
  margin-bottom: 12px; position: relative; z-index: 1;
  width: 48px; height: 48px;
  background: rgba(255,255,255,.18); border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  box-shadow: 0 4px 16px rgba(0,0,0,.12);
  animation: float 4s ease-in-out infinite;
}
.fh-title {
  font-size: 1.45rem; font-weight: 900; color: var(--blanc);
  text-transform: uppercase; letter-spacing: 1.5px;
  position: relative; z-index: 1;
}
.fh-sub { color: rgba(255,255,255,.82); font-size: .82rem; margin-top: 8px; position: relative; z-index: 1; }
.fb { padding: 28px 32px; }
.fr { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
@media(max-width:580px) { .fr { grid-template-columns: 1fr; } .fb { padding: 20px; } }
.fg { margin-bottom: 20px; }

/* ─── Labels / inputs ─── */
label { display: block; font-size: .78rem; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; color: var(--brun); margin-bottom: 8px; }
.req { color: var(--rouge); margin-left: 3px; }
input[type=text], input[type=password], input[type=email], input[type=tel], input[type=time], input[type=number], select, textarea {
  width: 100%; padding: 14px 16px;
  border: 2px solid #e8ddd0; border-radius: 14px;
  font-family: 'Segoe UI', Tahoma, sans-serif;
  font-size: .92rem; color: var(--noir);
  background: var(--creme); transition: var(--trans); outline: none; appearance: none;
}
input:focus, select:focus, textarea:focus {
  border-color: var(--or); background: var(--blanc);
  box-shadow: 0 0 0 4px rgba(249, 178, 51, .1);
  transform: translateY(-1px);
}
select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23845936' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 16px center; padding-right: 40px;
}
textarea { resize: vertical; min-height: 100px; }

/* ─── Section divider ─── */
.sd { display: flex; align-items: center; gap: 10px; margin: 26px 0 18px; }
.sd span { font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: var(--or); white-space: nowrap; }
.sl { flex: 1; height: 2px; background: linear-gradient(90deg, var(--or), transparent); border-radius: 1px; }

/* ─── Group selector ─── */
.gs { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
.gb {
  padding: 16px 12px; border: 3px solid #e8ddd0; border-radius: 16px;
  cursor: pointer; text-align: center; transition: var(--trans);
  font-weight: 800; font-size: .88rem; text-transform: uppercase;
  background: var(--blanc); user-select: none;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.gb:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,.1); }
.gb.rouge { border-color: #dc3545; color: #dc3545; }
.gb.jaune { border-color: #d4a017; color: #8a6600; }
.gb.vert  { border-color: #28a745; color: #28a745; }
.gb.bleu  { border-color: #2563eb; color: #2563eb; }
.gb.rouge.sel { background: #dc3545; color: #fff; box-shadow: 0 8px 20px rgba(220,53,69,.3); }
.gb.jaune.sel { background: #d4a017; color: #fff; box-shadow: 0 8px 20px rgba(212,160,23,.3); }
.gb.vert.sel  { background: #28a745; color: #fff; box-shadow: 0 8px 20px rgba(40,167,69,.3); }
.gb.bleu.sel  { background: #2563eb; color: #fff; box-shadow: 0 8px 20px rgba(37,99,235,.3); }

/* ─── Profile pills ─── */
.rg { display: flex; flex-wrap: wrap; gap: 10px; }
.rp {
  padding: 10px 18px; border: 2px solid #e8ddd0; border-radius: 30px;
  cursor: pointer; transition: var(--trans);
  font-size: .86rem; font-weight: 600; color: var(--brun);
  user-select: none;
  display: flex; align-items: center; gap: 8px;
}
.rp:hover { border-color: var(--or); background: rgba(249, 178, 51, .12); transform: translateY(-2px); }
.rp.sel { background: var(--or); border-color: var(--or); color: var(--blanc); box-shadow: 0 4px 14px rgba(132,89,54,.25); }

/* ─── Pole cards ─── */
.pc { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
@media(max-width:700px) { .pc { grid-template-columns: repeat(2, 1fr); } }
@media(max-width:580px) { .pc, .gs { grid-template-columns: 1fr; } }
.pcard {
  border: 2px solid #e8ddd0; border-radius: var(--radius);
  padding: 14px 10px; text-align: center; cursor: pointer;
  transition: var(--trans); position: relative;
  background: rgba(255,255,255,.95);
  animation: fadeInScale 0.5s ease-out backwards;
}
.pcard:nth-child(1) { animation-delay: 0.1s; }
.pcard:nth-child(2) { animation-delay: 0.2s; }
.pcard:nth-child(3) { animation-delay: 0.3s; }
.pcard:nth-child(4) { animation-delay: 0.4s; }
.pcard:hover { border-color: var(--or); transform: translateY(-3px); box-shadow: 0 12px 28px rgba(132, 89, 54, .14); }
.pcard.sel { border-color: var(--rouge); background: rgba(177, 34, 42, .07); box-shadow: 0 8px 22px rgba(177, 34, 42, .16); }
.pi { display: flex; align-items: center; justify-content: center; margin-bottom: 10px; color: var(--or); }
.pcard.sel .pi { color: var(--rouge); }
.pn { font-size: .82rem; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; color: var(--brun); }
.pcard.sel .pn { color: var(--rouge); }
.pck { position: absolute; top: 10px; right: 12px; opacity: 0; color: var(--rouge); transition: var(--trans); }
.pcard.sel .pck { opacity: 1; }

/* ─── Newsletter toggle ─── */
.nl {
  display: flex; align-items: center; gap: 14px;
  padding: 15px 18px;
  background: linear-gradient(135deg, rgba(42, 110, 60, .08), rgba(76, 175, 80, .12));
  border-radius: 16px; border: 2px solid rgba(42, 110, 60, .18);
  cursor: pointer; transition: var(--trans);
}
.nl:hover { border-color: #4caf50; transform: translateY(-1px); }
.sw { width: 46px; height: 24px; background: #ccc; border-radius: 12px; position: relative; transition: background .25s; flex-shrink: 0; }
.sw::after { content: ''; position: absolute; width: 18px; height: 18px; background: #fff; border-radius: 50%; top: 3px; left: 3px; transition: transform .25s; box-shadow: 0 2px 4px rgba(0,0,0,.2); }
.nl.on .sw { background: #4caf50; }
.nl.on .sw::after { transform: translateX(22px); }
.nl-lbl { font-size: .86rem; color: #2e6b3a; font-weight: 600; display: flex; align-items: center; gap: 8px; }

/* ─── Stars ─── */
.stars { display: flex; gap: 4px; }
.star-btn {
  background: none; border: none; padding: 4px; cursor: pointer;
  color: #ddd; transition: color .2s, transform .15s;
  line-height: 1;
}
.star-btn:hover { transform: scale(1.2); }
.star-btn.active { color: var(--gold); }
.star-btn.active .app-icon { filter: drop-shadow(0 0 4px rgba(249,178,51,.5)); }
.star-hint { font-size: .78rem; color: #888; margin-top: 5px; font-style: italic; }

/* ─── ID display ─── */
.id-disp {
  background: var(--creme); border: 2px solid #e8ddd0;
  border-radius: 14px; padding: 12px 15px;
  font-family: 'Courier New', monospace; font-size: 1rem; font-weight: 700;
  color: var(--brun); letter-spacing: 2px;
  min-height: 44px; display: flex; align-items: center; transition: var(--trans);
}
.id-disp.filled { border-color: var(--or); background: rgba(249, 178, 51, .12); color: var(--rouge); }

/* ─── Submit buttons ─── */
.bsub {
  width: 100%; padding: 18px;
  color: var(--blanc); border: none; border-radius: 16px;
  font-size: .95rem; font-weight: 900; letter-spacing: 2px; text-transform: uppercase;
  cursor: pointer; transition: var(--trans); margin-top: 8px;
  box-shadow: 0 14px 28px rgba(89, 55, 22, .22);
  display: flex; align-items: center; justify-content: center; gap: 10px;
  position: relative; overflow: hidden;
}
.bsub:hover { transform: translateY(-2px); filter: brightness(1.06); box-shadow: 0 18px 36px rgba(89,55,22,.28); }
.bsub:active { transform: translateY(0); }
.bsub:disabled { opacity: .7; cursor: not-allowed; pointer-events: none; }
.bsub-a { background: linear-gradient(135deg, var(--brun), var(--or)); }
.bsub-s { background: linear-gradient(135deg, var(--rouge), var(--terre)); }
.bsub-v { background: linear-gradient(135deg, #1a3a2a, #2d6a4a); }

/* ─── Error / success ─── */
.emsg { display: none; }
.emsg.on {
  display: flex; align-items: center; gap: 10px;
  background: #ffeaea; border: 2px solid var(--rouge); border-radius: 14px;
  padding: 14px 18px; color: var(--rouge); font-size: .86rem; font-weight: 600;
  margin-top: 16px; animation: shake 0.4s ease;
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-6px); }
  40%, 80% { transform: translateX(6px); }
}
.omsg { display: none; }
.omsg.on {
  display: block;
  background: linear-gradient(135deg, #e8f5e9, #f1f8e9);
  border: 2px solid #4caf50; border-radius: var(--radius);
  padding: 28px; text-align: center; margin-top: 18px;
  animation: popBounce .5s cubic-bezier(.34, 1.56, .64, 1);
}
@keyframes popBounce { from { transform: scale(.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.oico { display: flex; align-items: center; justify-content: center; margin-bottom: 12px; color: #2e7d32; }
.omsg h3 { color: #2e7d32; font-size: 1rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
.omsg p { color: #555; font-size: .84rem; }
.breset {
  margin-top: 14px; padding: 10px 24px;
  background: var(--brun); color: var(--blanc);
  border: none; border-radius: 12px;
  font-size: .84rem; font-weight: 700; cursor: pointer; transition: var(--trans);
  display: inline-flex; align-items: center; gap: 8px;
}
.breset:hover { background: var(--rouge); transform: translateY(-1px); }

/* ─── Schedule tables ─── */
h3 { color: var(--brun); margin-bottom: 16px; font-size: 1.05rem; }
.schedule-table { overflow-x: auto; border-radius: 18px; border: 1px solid rgba(132, 89, 54, .12); }
.schedule-table table { width: 100%; border-collapse: collapse; min-width: 640px; }
.schedule-table th, .schedule-table td { text-align: left; padding: 14px 16px; border-bottom: 1px solid rgba(132, 89, 54, .1); }
.schedule-table thead th { background: rgba(132, 89, 54, .06); color: var(--brun); font-weight: 800; }
.schedule-table tbody tr { transition: background 0.2s ease; animation: fadeInUp 0.5s ease-out backwards; }
.schedule-table tbody tr:hover { background: rgba(249, 178, 51, .08); }
.schedule-table tbody tr:nth-child(1) { animation-delay: 0.05s; }
.schedule-table tbody tr:nth-child(2) { animation-delay: 0.10s; }
.schedule-table tbody tr:nth-child(3) { animation-delay: 0.15s; }
.schedule-table tbody tr:nth-child(4) { animation-delay: 0.20s; }
.schedule-table tbody tr:nth-child(5) { animation-delay: 0.25s; }
.schedule-table tbody tr:nth-child(n+6) { animation-delay: 0.30s; }

/* ─── Home page ─── */
.home-intro { margin-top: 24px; }
.home-intro .form-card { max-width: 100%; }
.home-intro .pcard { text-decoration: none; color: inherit; }

/* ─── Keyframes ─── */
@keyframes fadeInUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeInDown { from { opacity: 0; transform: translateY(-16px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeInScale { from { opacity: 0; transform: scale(0.94); } to { opacity: 1; transform: scale(1); } }
@keyframes slideInLeft { from { opacity: 0; transform: translateX(-32px); } to { opacity: 1; transform: translateX(0); } }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }

/* ─── Shimmer on btn-connect ─── */
.btn-connect::before {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.22), transparent);
  transform: translateX(-100%); opacity: 0;
  animation: shimmer 2.2s infinite;
}
.btn-connect:hover::before { opacity: 1; }
@keyframes shimmer { 0% { background-position: -1000px 0; transform: translateX(-100%); } 100% { transform: translateX(100%); } }

/* ─── Stand MVG ─── */
.stand-mvg-section {
  position: relative;
  margin-top: 40px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 12px 36px rgba(89,55,22,.16);
  transition: transform .55s cubic-bezier(.22,1,.36,1), opacity .55s ease, box-shadow .55s ease;
}
.stand-mvg-section.will-reveal {
  opacity: 0;
  transform: scale(0.96) translateY(24px);
}
.stand-mvg-section.revealed {
  opacity: 1;
  transform: scale(1) translateY(0);
}
.stand-mvg-section:hover {
  box-shadow: 0 24px 56px rgba(89,55,22,.26);
}
.stand-mvg-img {
  width: 100%;
  height: auto;
  display: block;
  transition: transform .6s ease;
}
.stand-mvg-section:hover .stand-mvg-img {
  transform: scale(1.015);
}
.stand-mvg-caption {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  background: linear-gradient(to top, rgba(89,55,22,.85) 0%, transparent 100%);
  color: #fff;
  font-size: .78rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  padding: 28px 22px 14px;
}

/* ─── Partenaires ─── */
.partenaires-section.will-reveal { opacity: 0; transform: translateY(24px); }
.partenaires-section.revealed    { opacity: 1; transform: translateY(0); transition: opacity .6s ease, transform .6s cubic-bezier(.22,1,.36,1); }
.partenaires-section {
  margin-top: 32px;
  padding: 24px 0 20px;
  background: rgba(255,255,255,.88);
  border-radius: 20px;
  border: 1px solid rgba(132,89,54,.12);
  box-shadow: 0 8px 24px rgba(89,55,22,.08);
  overflow: hidden;
}
.partenaires-title {
  font-size: .72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: var(--brun);
  margin-bottom: 20px;
  opacity: .7;
  text-align: center;
}
.partenaires-track-wrapper {
  overflow: hidden;
  /* masques de fondu sur les bords */
  mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
  -webkit-mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
}
.partenaires-track {
  display: flex;
  width: max-content;
  animation: scroll-logos 28s linear infinite;
}
.partenaires-track:hover { animation-play-state: paused; }
@keyframes scroll-logos {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
.partenaires-loop {
  display: flex;
  align-items: center;
  gap: 48px;
  padding: 0 24px;
}
.partenaires-loop img {
  height: 72px;
  width: auto;
  object-fit: contain;
  filter: grayscale(20%);
  opacity: .8;
  transition: all .25s ease;
  flex-shrink: 0;
}
.partenaires-loop img:hover { filter: grayscale(0%); opacity: 1; transform: scale(1.06); }
.partenaire-slot {
  height: 72px;
  min-width: 140px;
  border: 2px dashed rgba(132,89,54,.2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: .72rem;
  font-weight: 600;
  color: rgba(132,89,54,.35);
  letter-spacing: .5px;
  flex-shrink: 0;
}

/* ─── Responsive ─── */
@media (max-width: 768px) {
  .nav-tabs { border-radius: 20px; }
  .nav-tab { min-width: unset; padding: 10px 14px; font-size: .72rem; }
  .stats-summary { grid-template-columns: 1fr 1fr; }
}

/* ─── Admin Fullscreen Login ─── */
.admin-login-fullscreen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100vw;
  background: radial-gradient(circle at top left, rgba(249, 178, 51, .08), transparent 28%),
              linear-gradient(180deg, #fef9f2 0%, #f7e8d8 60%, #e8ddd0 100%);
  padding: 24px;
  position: fixed;
  inset: 0;
  z-index: 9999;
  overflow-y: auto;
}
.admin-login-box {
  width: 100%;
  max-width: 500px;
  box-shadow: 0 20px 50px rgba(89, 55, 22, 0.25) !important;
}

/* ─── Footer ─── */
.main-footer {
  background:
    linear-gradient(135deg, rgba(46, 26, 11, 0.96) 0%, rgba(77, 43, 19, 0.94) 50%, rgba(20, 12, 6, 1) 100%),
    url('/images/motif-removebg-preview.png') center/auto 120% repeat;
  border-top: 2px solid var(--gold);
  padding: 40px 20px 20px;
  margin-top: 40px;
  color: var(--blanc);
}

.footer-container {
  max-width: 1120px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 40px;
  margin-bottom: 30px;
}

.footer-col {
  display: flex;
  flex-direction: column;
}

.footer-col h3 {
  font-size: 1.1rem;
  font-weight: 800;
  text-transform: uppercase;
  margin-bottom: 16px;
  color: var(--gold);
}

/* Logo Column */
.footer-logo {
  align-items: flex-start;
}
.footer-logo .header-branding {
  gap: 15px;
}
.footer-logo .logo-title-wrap h1 {
  margin: 0;
  color: #fff;
}

/* Links Column */
.footer-links {
  align-items: center;
}

.footer-links h3 {
  text-align: center;
}

.footer-links ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: center;
  align-items: center;
}

.footer-links a {
  text-decoration: none;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 600;
  font-size: 0.9rem;
  transition: var(--trans);
}

.footer-links a:hover,
.footer-links a.router-link-active {
  color: var(--gold);
  padding-left: 5px;
}

/* Social Column */
.footer-social {
  align-items: flex-end;
}

.social-icons {
  display: flex;
  gap: 15px;
}

.social-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--blanc);
  border-radius: 50%;
  transition: var(--trans);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.social-icon:hover {
  background: var(--gold);
  color: var(--brun);
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(249, 178, 51, 0.3);
}

/* Footer Bottom */
.footer-bottom {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  font-size: 0.8rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.6);
}

/* ─── Scroll Top Button ─── */
.scroll-top-btn {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 50px;
  height: 50px;
  background: var(--surface);
  border: none;
  border-radius: 50%;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 0;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.scroll-top-btn:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(249, 178, 51, 0.4);
}
.progress-circle {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}
.progress-bg {
  fill: none;
  stroke: rgba(132, 89, 54, 0.15);
  stroke-width: 6;
}
.progress-bar {
  fill: none;
  stroke: var(--gold);
  stroke-width: 6;
  stroke-dasharray: 283;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.1s linear;
}
.scroll-icon {
  color: var(--brun);
  position: relative;
  z-index: 2;
  transition: color 0.3s ease;
}
.scroll-top-btn:hover .scroll-icon {
  color: var(--gold);
}

/* Responsive Footer & Header */
@media (max-width: 768px) {
  /* Header Responsive */
  header {
    padding: 16px 20px;
  }
  header .header-inner {
    flex-direction: row; /* garder en ligne si possible, sinon colonne mais aligné à gauche */
    text-align: left;
    gap: 12px;
  }
  header .header-branding {
    flex-direction: row;
    align-items: center;
    gap: 12px;
    text-align: left;
  }
  header .logo-badge {
    width: 55px; height: 55px;
    border-width: 1.5px;
  }
  header .logo-badge img {
    width: 48px; height: 48px;
  }
  header .logo-pre {
    font-size: 1.15rem;
    letter-spacing: 1px;
  }
  header .logo-title-wrap h1 {
    font-size: 1.15rem;
    letter-spacing: 1px;
  }
  header .logo-title-wrap {
    justify-content: flex-start;
    gap: 6px;
  }
  header .logo-text span {
    font-size: 0.65rem;
    letter-spacing: 1px;
    margin-top: 2px;
    display: block;
    line-height: 1.3;
  }

  /* Footer Responsive */
  .footer-container {
    grid-template-columns: 1fr;
    text-align: left;
    gap: 30px;
  }
  .footer-logo img {
    align-self: flex-start;
  }
  .footer-col {
    align-items: flex-start !important;
  }
  .footer-links h3 {
    text-align: left;
  }
  .footer-links ul {
    align-items: flex-start;
    text-align: left;
  }
  .footer-logo .header-branding {
    flex-direction: row;
    text-align: left;
    justify-content: flex-start;
    align-items: center;
  }
  /* Ajustement de la taille du logo dans le footer pour mobile */
  .footer-logo .logo-badge {
    width: 65px; height: 65px;
    border-width: 1.5px;
  }
  .footer-logo .logo-badge img {
    width: 58px; height: 58px;
  }
  .footer-logo .logo-pre {
    font-size: 1.2rem;
    letter-spacing: 1px;
  }
  .footer-logo .logo-title-wrap h1 {
    font-size: 1.2rem;
    letter-spacing: 1px;
  }
  .footer-logo .logo-text span {
    font-size: 0.7rem;
    letter-spacing: 1px;
  }
}

/* ─── Profile Menu ─── */
.profile-menu-container {
  position: relative;
}
.profile-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  width: 260px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
  z-index: 1000;
  overflow: hidden;
  animation: dropdownIn 0.2s ease;
}
.profile-overlay {
  position: fixed;
  inset: 0;
  z-index: 999;
}
.profile-header {
  padding: 16px;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(0,0,0,0.05);
}
.profile-avatar {
  width: 42px;
  height: 42px;
  background: rgba(255, 127, 80, 0.15);
  color: var(--prim-orange);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.profile-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.profile-email {
  font-weight: 600;
  color: var(--text);
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.profile-role {
  font-size: 0.75rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 2px;
}
.profile-actions {
  padding: 8px 0;
}
.profile-action-btn {
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}
.profile-action-btn:hover {
  background: rgba(0,0,0,0.03);
  color: var(--prim-orange);
}
.profile-divider {
  height: 1px;
  background: rgba(0,0,0,0.05);
  margin: 6px 0;
}
.logout-btn {
  color: var(--rouge);
}
.logout-btn:hover {
  background: rgba(177, 34, 42, 0.05);
  color: var(--rouge);
}
@keyframes dropdownIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>

<style>
/* ─── Modals (Teleport) - Styles globaux pour la Prod ─── */
.modal-backdrop {
  position: fixed; inset: 0; z-index: 10000;
  background: rgba(26,16,8,.55);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
  animation: fadeIn .2s ease;
  backdrop-filter: blur(2px);
}
.modal-box {
  width: 100%; max-width: 500px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  animation: modalIn .3s cubic-bezier(.34,1.56,.64,1);
}
.modal-confirm { max-width: 480px; }
.form-error-msg {
  display: flex; align-items: center; gap: 8px;
  background: #ffeaea; border: 1.5px solid var(--rouge); border-radius: 12px;
  padding: 10px 14px; color: var(--rouge); font-size: .84rem; font-weight: 600;
  margin-top: 12px;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

/* ─── Pagination Globale ─── */
.pagination-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 32px;
  margin-bottom: 24px;
}
.page-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--creme);
  border: 1.5px solid rgba(132, 89, 54, 0.2);
  color: var(--brun);
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
}
.page-btn:hover:not(:disabled) {
  background: var(--or);
  border-color: var(--or);
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(249, 178, 51, 0.25);
}
.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: transparent;
  border-color: rgba(132, 89, 54, 0.1);
}
.page-info {
  display: inline-flex;
  align-items: center;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--brun);
  background: rgba(132, 89, 54, 0.08);
  padding: 8px 18px;
  border-radius: 999px;
  white-space: nowrap;
}
</style>
