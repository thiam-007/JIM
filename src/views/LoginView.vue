<template>
  <div class="login-shell">
    <div class="login-card">

      <div class="login-header">
        <div class="login-logo">
          <img src="/images/logo.jpeg" alt="MVG" />
        </div>
        <h1 class="login-title">Musée Virtuel de Guinée</h1>
        <p class="login-sub">Journée Internationale des Musées · 16 – 18 Mai 2026</p>
        <div class="login-badge">JIM 2026</div>
      </div>

      <div class="login-body">
        <div class="login-icon">
          <AppIcon name="lock" :size="28" />
        </div>
        <h2 class="login-heading">Accès sécurisé</h2>
        <p class="login-desc">Cette application contient des données personnelles. Veuillez entrer le mot de passe pour continuer.</p>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="login-field">
            <label>Mot de passe</label>
            <div class="pwd-row">
              <input
                :type="showPwd ? 'text' : 'password'"
                v-model="password"
                placeholder="Entrez le mot de passe…"
                ref="inputRef"
                autocomplete="current-password"
              />
              <button type="button" class="pwd-toggle" @click="showPwd = !showPwd">
                <AppIcon :name="showPwd ? 'eye-off' : 'eye'" :size="18" />
              </button>
            </div>
          </div>

          <div class="login-error" :class="{ on: error }">
            <AppIcon name="alert-triangle" :size="15" /> Mot de passe incorrect
          </div>

          <button type="submit" class="login-btn" :disabled="!password.trim()">
            <AppIcon name="log-in" :size="18" />
            Accéder à l'application
          </button>
        </form>
      </div>

      <div class="login-footer">
        Musée Virtuel de Guinée · JIM 2026 · <em>Les musées unissent un monde divisé</em>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'

const router   = useRouter()
const password = ref('')
const showPwd  = ref(false)
const error    = ref(false)
const inputRef = ref(null)

onMounted(() => inputRef.value?.focus())

function handleLogin() {
  const expected = import.meta.env.VITE_APP_PASSWORD
  if (password.value === expected) {
    sessionStorage.setItem('jim_auth', '1')
    router.push('/')
  } else {
    error.value = true
    password.value = ''
    setTimeout(() => { error.value = false }, 2500)
  }
}
</script>

<style scoped>
.login-shell {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background: radial-gradient(circle at top left, rgba(249,178,51,.15), transparent 30%),
              linear-gradient(180deg, #fef9f2 0%, #f7e8d8 60%, #f0dcc6 100%);
}

.login-card {
  width: 100%;
  max-width: 440px;
  background: rgba(255,255,255,.95);
  border-radius: 28px;
  box-shadow: 0 24px 64px rgba(89,55,22,.18);
  border: 1px solid rgba(255,255,255,.8);
  overflow: hidden;
  animation: cardIn .55s cubic-bezier(.22,1,.36,1);
}
@keyframes cardIn {
  from { opacity: 0; transform: translateY(28px) scale(.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* ─── Header ─── */
.login-header {
  background: linear-gradient(135deg, #5c3519 0%, #8f5b2c 40%, #f7bf39 100%);
  padding: 32px 28px 28px;
  text-align: center;
  position: relative;
  overflow: hidden;
}
.login-header::before {
  content: '';
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(60deg, rgba(255,255,255,.05) 0, rgba(255,255,255,.05) 1px, transparent 1px, transparent 18px);
}
.login-logo {
  width: 72px; height: 72px;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 auto 16px;
  border: 3px solid rgba(255,255,255,.35);
  box-shadow: 0 8px 24px rgba(0,0,0,.2);
  animation: float 3s ease-in-out infinite;
  position: relative; z-index: 1;
}
@keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
.login-logo img { width: 100%; height: 100%; object-fit: cover; display: block; }
.login-title {
  font-size: 1.1rem; font-weight: 900; color: #fff;
  text-transform: uppercase; letter-spacing: 1.2px;
  margin: 0 0 6px; position: relative; z-index: 1;
}
.login-sub {
  font-size: .72rem; color: rgba(255,255,255,.82);
  letter-spacing: 1px; margin: 0; position: relative; z-index: 1;
}
.login-badge {
  display: inline-block;
  margin-top: 14px;
  background: rgba(255,255,255,.18);
  color: #fff;
  padding: 5px 16px;
  border-radius: 999px;
  font-size: .7rem; font-weight: 700; letter-spacing: 1.8px;
  border: 1px solid rgba(255,255,255,.3);
  position: relative; z-index: 1;
}

/* ─── Body ─── */
.login-body {
  padding: 32px 32px 24px;
  text-align: center;
}
.login-icon {
  width: 56px; height: 56px;
  background: linear-gradient(135deg, rgba(132,89,54,.1), rgba(249,178,51,.15));
  border: 1px solid rgba(132,89,54,.18);
  border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  color: var(--brun);
  margin: 0 auto 16px;
}
.login-heading {
  font-size: 1.15rem; font-weight: 900; color: var(--brun);
  text-transform: uppercase; letter-spacing: 1px;
  margin: 0 0 10px;
}
.login-desc {
  font-size: .84rem; color: #777; line-height: 1.6;
  margin: 0 0 24px;
}

/* ─── Form ─── */
.login-form { text-align: left; }
.login-field { margin-bottom: 16px; }
.login-field label {
  display: block;
  font-size: .75rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: .8px;
  color: var(--brun); margin-bottom: 8px;
}
.pwd-row {
  display: flex;
  border: 2px solid #e8ddd0;
  border-radius: 14px;
  overflow: hidden;
  transition: border-color .25s, box-shadow .25s;
  background: var(--creme);
}
.pwd-row:focus-within {
  border-color: var(--or);
  box-shadow: 0 0 0 4px rgba(249,178,51,.1);
  background: #fff;
}
.pwd-row input {
  flex: 1;
  padding: 14px 16px;
  border: none; outline: none;
  background: transparent;
  font-size: .92rem; color: var(--noir);
}
.pwd-toggle {
  background: none; border: none;
  padding: 0 14px;
  color: #aaa; cursor: pointer;
  display: flex; align-items: center;
  transition: color .2s;
}
.pwd-toggle:hover { color: var(--brun); }

.login-error {
  display: none;
  align-items: center; gap: 8px;
  background: #ffeaea; border: 1.5px solid var(--rouge);
  border-radius: 12px; padding: 10px 14px;
  color: var(--rouge); font-size: .82rem; font-weight: 600;
  margin-bottom: 14px;
  animation: shake .4s ease;
}
.login-error.on { display: flex; }
@keyframes shake {
  0%,100% { transform: translateX(0); }
  25%,75%  { transform: translateX(-6px); }
  50%      { transform: translateX(6px); }
}

.login-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, var(--brun), var(--or));
  color: #fff; border: none; border-radius: 14px;
  font-size: .92rem; font-weight: 900;
  letter-spacing: 1.5px; text-transform: uppercase;
  cursor: pointer; transition: all .28s ease;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  box-shadow: 0 10px 28px rgba(89,55,22,.22);
}
.login-btn:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.06); }
.login-btn:disabled { opacity: .5; cursor: not-allowed; }

/* ─── Footer ─── */
.login-footer {
  text-align: center;
  padding: 16px;
  border-top: 1px solid rgba(132,89,54,.1);
  font-size: .7rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 1.2px;
  color: var(--brun); opacity: .6;
}
.login-footer em { color: var(--rouge); font-style: normal; }
</style>
