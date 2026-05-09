<template>
  <div class="login-shell">

    <!-- ─── Panneau gauche : compte à rebours ─── -->
    <div class="login-side">
      <div class="side-title">Musée Virtuel de Guinée</div>
      <div class="side-sub">Journée Internationale des Musées</div>
      <div class="side-dates">16 – 18 Mai 2026</div>

      <div class="side-countdown">
        <template v-if="!eventStarted">
          <div class="side-cd-label">
            <AppIcon name="clock" :size="14" /> Début de l'événement dans
          </div>
          <div class="side-cd-units">
            <div class="side-cd-unit">
              <span class="scu-num">{{ countdown.days }}</span>
              <span class="scu-label">Jours</span>
            </div>
            <div class="side-cd-sep">:</div>
            <div class="side-cd-unit">
              <span class="scu-num">{{ countdown.hours }}</span>
              <span class="scu-label">Heures</span>
            </div>
            <div class="side-cd-sep">:</div>
            <div class="side-cd-unit">
              <span class="scu-num">{{ countdown.minutes }}</span>
              <span class="scu-label">Min</span>
            </div>
            <div class="side-cd-sep">:</div>
            <div class="side-cd-unit">
              <span class="scu-num">{{ countdown.seconds }}</span>
              <span class="scu-label">Sec</span>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="side-event-live">
            <AppIcon name="zap" :size="18" />
            JIM 2026 est en cours !
          </div>
        </template>
      </div>

      <div class="side-badge">JIM 2026</div>
      <div class="side-quote">« Les musées unissent un monde divisé »</div>
    </div>

    <!-- ─── Panneau droit : formulaire ─── -->
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
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'

const router   = useRouter()
const password = ref('')
const showPwd  = ref(false)
const error    = ref(false)
const inputRef = ref(null)

const EVENT_DATE = new Date('2026-05-16T08:30:00')
const EVENT_END  = new Date('2026-05-18T23:59:59')
const countdown    = reactive({ days: '00', hours: '00', minutes: '00', seconds: '00' })
const eventStarted = ref(false)
let timer = null

function pad(n) { return String(n).padStart(2, '0') }

function tick() {
  const now = new Date()
  if (now >= EVENT_DATE && now <= EVENT_END) { eventStarted.value = true; return }
  if (now > EVENT_END) { eventStarted.value = true; return }
  const diff = EVENT_DATE - now
  countdown.days    = pad(Math.floor(diff / 86400000))
  countdown.hours   = pad(Math.floor((diff % 86400000) / 3600000))
  countdown.minutes = pad(Math.floor((diff % 3600000)  / 60000))
  countdown.seconds = pad(Math.floor((diff % 60000)    / 1000))
}

onMounted(() => {
  inputRef.value?.focus()
  tick()
  timer = setInterval(tick, 1000)
})
onUnmounted(() => clearInterval(timer))

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
  align-items: stretch;
  background: radial-gradient(circle at top left, rgba(249,178,51,.15), transparent 30%),
              linear-gradient(180deg, #fef9f2 0%, #f7e8d8 60%, #f0dcc6 100%);
}

/* ═══════════════════════════════
   Panneau gauche — Compte à rebours
   ═══════════════════════════════ */
.login-side {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 380px;
  min-width: 320px;
  flex-shrink: 0;
  background: linear-gradient(160deg, #5c3519 0%, #8f5b2c 55%, #c07c3a 100%);
  padding: 48px 32px;
  text-align: center;
  position: relative;
  overflow: hidden;
}
.login-side::before {
  content: '';
  position: absolute; inset: 0;
  background: repeating-linear-gradient(60deg, rgba(255,255,255,.04) 0, rgba(255,255,255,.04) 1px, transparent 1px, transparent 18px);
  pointer-events: none;
}

@keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }

.side-title {
  font-size: 1rem; font-weight: 900; color: #fff;
  text-transform: uppercase; letter-spacing: 1.2px;
  margin-bottom: 6px; position: relative; z-index: 1;
}
.side-sub {
  font-size: .7rem; color: rgba(255,255,255,.75);
  letter-spacing: 1px; position: relative; z-index: 1;
}
.side-dates {
  font-size: .8rem; font-weight: 800; color: #f9b233;
  letter-spacing: 1px; margin-top: 4px;
  position: relative; z-index: 1;
}

/* ── Compte à rebours côté gauche ── */
.side-countdown {
  margin: 32px 0 28px;
  position: relative; z-index: 1;
  width: 100%;
}
.side-cd-label {
  font-size: .65rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 2px;
  color: rgba(255,255,255,.7);
  display: flex; align-items: center; justify-content: center; gap: 6px;
  margin-bottom: 16px;
}
.side-cd-units {
  display: flex; align-items: center; justify-content: center;
  gap: 6px; flex-wrap: wrap;
}
.side-cd-unit {
  display: flex; flex-direction: column; align-items: center;
  padding: 4px 10px; min-width: 52px;
}
.scu-num {
  font-size: 1.7rem; font-weight: 900; color: #fff;
  line-height: 1; font-variant-numeric: tabular-nums;
}
.scu-label {
  font-size: .58rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 1.4px;
  color: rgba(255,255,255,.6); margin-top: 4px;
}
.side-cd-sep {
  font-size: 1.5rem; font-weight: 900;
  color: rgba(255,255,255,.45); margin-bottom: 14px;
}
.side-event-live {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  font-size: .9rem; font-weight: 800; color: #f9b233;
  text-transform: uppercase; letter-spacing: 1.4px;
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .6; } }

.side-badge {
  display: inline-block;
  background: rgba(255,255,255,.18);
  color: #fff;
  padding: 5px 18px;
  border-radius: 999px;
  font-size: .68rem; font-weight: 700; letter-spacing: 2px;
  border: 1px solid rgba(255,255,255,.28);
  margin-bottom: 16px;
  position: relative; z-index: 1;
}
.side-quote {
  font-size: .75rem; font-style: italic;
  color: rgba(255,255,255,.65);
  line-height: 1.5;
  position: relative; z-index: 1;
}

/* ═══════════════════════════════
   Panneau droit — Formulaire
   ═══════════════════════════════ */
.login-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 480px;
  margin: auto 40px;
  background: rgba(255,255,255,.97);
  border-radius: 28px;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(89,55,22,.18);
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
  position: absolute; inset: 0;
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

/* ═══════════════════════════════
   Responsive — écrans < 800px
   ═══════════════════════════════ */
@media (max-width: 800px) {
  .login-shell {
    flex-direction: column;
    align-items: center;
    padding: 0;
  }
  .login-side {
    width: 100%;
    min-width: unset;
    padding: 32px 24px;
    border-radius: 0;
  }
  .side-cd-units { gap: 4px; }
  .side-cd-unit { min-width: 52px; padding: 8px 10px; }
  .scu-num { font-size: 1.4rem; }
  .login-card {
    width: calc(100% - 32px);
    max-width: 100%;
    margin: 0 16px 32px;
    border-radius: 24px;
  }
}
</style>
