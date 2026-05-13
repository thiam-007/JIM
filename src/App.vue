<template>
  <div class="app-shell">
    <header>
      <div class="logo-badge">
        <img src="/images/logo.jpeg" alt="MVG" />
      </div>
      <div class="logo-text">
        <h1>Musée Virtuel de Guinée</h1>
        <span>Journée Internationale des Musées · 16 – 18 Mai 2026</span>
      </div>
      <div class="jim-badge">JIM 2026</div>
    </header>

    <nav class="nav-tabs">
      <div class="nav-group">
        <span class="nav-group-label">Agents</span>
        <div class="nav-group-tabs">
          <RouterLink class="nav-tab" :class="{ active: route.name === 'Home' }" to="/">
            <AppIcon name="home" :size="16" /> Accueil
          </RouterLink>
          <RouterLink class="nav-tab" :class="{ active: route.name === 'Programme' }" to="/programme">
            <AppIcon name="calendar" :size="16" /> Programme
          </RouterLink>
          <RouterLink class="nav-tab" :class="{ active: route.name === 'Inscriptions' }" to="/inscriptions">
            <AppIcon name="file-text" :size="16" /> Inscriptions
          </RouterLink>
          <RouterLink class="nav-tab" :class="{ active: route.name === 'Accueil' }" to="/accueil">
            <AppIcon name="landmark" :size="16" /> Accueil Visiteurs
          </RouterLink>
          <RouterLink class="nav-tab" :class="{ active: route.name === 'Suivi' }" to="/suivi">
            <AppIcon name="bar-chart" :size="16" /> Suivi par Pôle
          </RouterLink>
        </div>
      </div>
      <div class="nav-divider"></div>
      <div class="nav-group">
        <span class="nav-group-label">Coordinateurs</span>
        <div class="nav-group-tabs">
          <RouterLink class="nav-tab nav-tab-coord" :class="{ active: route.name === 'Dashboard' }" to="/dashboard">
            <AppIcon name="layout" :size="16" /> Dashboard
          </RouterLink>
        </div>
      </div>
    </nav>

    <!-- Bannière masquée si le token vient de l'environnement (Vercel) -->
    <template v-if="!envToken">
      <div v-if="connected" class="api-banner connected">
        <span class="api-icon"><AppIcon name="check-circle" :size="22" /></span>
        <div style="flex:1;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
          <strong>Connexion Airtable active — enregistrement prêt.</strong>
          <button class="btn-disconnect" @click="disconnectAT">
            <AppIcon name="log-out" :size="14" /> Déconnecter
          </button>
        </div>
      </div>
      <div v-else class="api-banner config">
        <span class="api-icon"><AppIcon name="key" :size="22" /></span>
        <div style="flex:1">
          <strong>Connexion Airtable — entrez votre Personal Access Token pour activer l'enregistrement</strong>
          <div class="api-token-row">
            <input
              type="password"
              class="api-token-input"
              v-model="tokenInput"
              placeholder="patXXXXXXXXXXXXXX..."
            />
            <button class="btn-connect" v-ripple @click="connectAT">
              <AppIcon name="link" :size="15" /> Connecter
            </button>
          </div>
          <div v-if="connectError" style="margin-top:8px;padding:10px 14px;background:#ffeaea;border:1.5px solid #B1222A;border-radius:12px;color:#B1222A;font-size:.78rem;font-weight:600;display:flex;align-items:flex-start;gap:8px;">
            <AppIcon name="alert-triangle" :size="14" style="flex-shrink:0;margin-top:1px" />
            <span>{{ connectError }}</span>
          </div>
        </div>
      </div>
    </template>

    <main>
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>

    <!-- ─── Stand MVG ─── -->
    <div class="stand-mvg-section" v-reveal="0">
      <img src="/images/stand-mvg.jpeg" alt="Le Musée Virtuel de Guinée au 72H du livre" class="stand-mvg-img" />
      <div class="stand-mvg-caption">Le Musée Virtuel de Guinée · 72H du Livre</div>
    </div>

    <!-- ─── Partenaires ─── -->
    <div class="partenaires-section" v-reveal="0">
      <div class="partenaires-title">Nos Partenaires</div>
      <div class="partenaires-track-wrapper">
        <div class="partenaires-track">
          <div class="partenaires-loop">
            <img src="/images/partenaires/expertise-france.png" alt="Expertise France" />
            <img src="/images/partenaires/ambassade-france-guinee.png" alt="Ambassade de France en Guinée" />
            <img src="/images/partenaires/meae.png" alt="Ministère de l'Europe et des Affaires Étrangères" />
            <img src="/images/partenaires/ccfg.png" alt="Centre Culturel Franco-Guinéen" />
            <img src="/images/partenaires/musee-national-guinee.jpg" alt="Musée National de Guinée" />
            <img src="/images/partenaires/mcta.jpg" alt="MCTA" />
          </div>
          <!-- Duplicata pour boucle infinie -->
          <div class="partenaires-loop" aria-hidden="true">
            <img src="/images/partenaires/expertise-france.png" alt="Expertise France" />
            <img src="/images/partenaires/ambassade-france-guinee.png" alt="Ambassade de France en Guinée" />
            <img src="/images/partenaires/meae.png" alt="Ministère de l'Europe et des Affaires Étrangères" />
            <img src="/images/partenaires/ccfg.png" alt="Centre Culturel Franco-Guinéen" />
            <img src="/images/partenaires/musee-national-guinee.jpg" alt="Musée National de Guinée" />
            <img src="/images/partenaires/mcta.jpg" alt="MCTA" />
          </div>
        </div>
      </div>
    </div>

    <footer>Musée Virtuel de Guinée · JIM 2026 · <em>Les musées unissent un monde divisé</em></footer>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, RouterLink, RouterView } from 'vue-router'
import { useAirtableStore } from './store/airtable'
import AppIcon from './components/AppIcon.vue'

const route = useRoute()
const airtable = useAirtableStore()
const tokenInput = ref(airtable.token)

onMounted(async () => {
  if (airtable.isConnected) {
    await Promise.allSettled([
      airtable.loadEventRegistrations(),
      airtable.loadAvis(),
      airtable.loadSuivi()
    ])
  }
})

const connected = computed(() => airtable.isConnected)
const envToken  = computed(() => airtable.isEnvToken)
const connectError = ref('')

async function connectAT() {
  if (!tokenInput.value.trim()) return
  connectError.value = ''
  airtable.connect(tokenInput.value)
  try {
    await airtable.loadEventRegistrations()
  } catch (error) {
    connectError.value = error.message
    airtable.connect('')
  }
}

function disconnectAT() {
  airtable.connect('')
  tokenInput.value = ''
}
</script>

<style>
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
  font-family: 'Segoe UI', Tahoma, Geneva, sans-serif;
  background: radial-gradient(circle at top left, rgba(249, 178, 51, .12), transparent 24%),
              linear-gradient(180deg, #fef9f2 0%, #f7e8d8 60%, #f0dcc6 100%);
  color: var(--noir);
}
button, input, textarea, select { font: inherit; }
.app-shell { max-width: 1180px; margin: 0 auto; padding: 0 16px 28px; }

/* ─── Header ─── */
header {
  background:
    linear-gradient(135deg, rgba(92,53,25,.82) 0%, rgba(143,91,44,.78) 40%, rgba(247,191,57,.72) 100%),
    url('/images/motif-removebg-preview.png') center/auto 100% repeat-x;
  color: var(--blanc);
  padding: 22px 24px;
  display: flex;
  align-items: center;
  gap: 18px;
  box-shadow: 0 10px 38px rgba(89, 55, 22, .18);
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid rgba(255,255,255,.16);
  animation: fadeInDown 0.5s ease-out;
  overflow: hidden;
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
  width: 60px; height: 60px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  animation: float 3s ease-in-out infinite;
}
.logo-badge img {
  width: 56px; height: 56px;
  object-fit: cover;
  border-radius: 50%;
  display: block;
  filter: drop-shadow(0 2px 8px rgba(0,0,0,.25));
  animation: logoGlow 3.5s ease-in-out infinite;
}
@keyframes logoGlow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(249,178,51,0); }
  50%       { box-shadow: 0 0 0 7px rgba(249,178,51,.3); }
}
.logo-text { flex: 1; }
.logo-text h1 { font-size: 1.3rem; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; line-height: 1.15; margin: 0; }
.logo-text span { font-size: .76rem; color: rgba(255,255,255,.9); letter-spacing: 1.8px; text-transform: uppercase; display: block; margin-top: 5px; }
.jim-badge {
  background: rgba(255,255,255,.18); color: var(--blanc);
  padding: 8px 16px; border-radius: 999px;
  font-size: .72rem; font-weight: 700; letter-spacing: 1.6px; text-transform: uppercase;
  border: 1px solid rgba(255,255,255,.35); white-space: nowrap;
}

/* ─── Nav ─── */
.nav-tabs {
  background: rgba(255,255,255,.92);
  display: flex; flex-wrap: wrap; align-items: center;
  gap: 10px; padding: 10px 14px;
  margin: 20px 0 0;
  border-radius: 999px;
  box-shadow: 0 10px 28px rgba(89, 55, 22, .08);
  animation: fadeInScale 0.6s ease-out 0.2s backwards;
}
.nav-group { display: flex; align-items: center; gap: 6px; }
.nav-group-label {
  font-size: .6rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px;
  color: #bbb; white-space: nowrap; padding: 0 4px;
}
.nav-group-tabs { display: flex; flex-wrap: wrap; gap: 6px; }
.nav-divider { width: 1px; height: 32px; background: rgba(132,89,54,.18); margin: 0 4px; flex-shrink: 0; }
.nav-tab-coord.active {
  background: linear-gradient(135deg, var(--rouge), var(--terre)) !important;
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
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(132, 89, 54, .08);
}
.nav-tab.active {
  color: var(--blanc);
  background: linear-gradient(135deg, var(--brun), var(--or));
  border-color: transparent;
  box-shadow: 0 12px 28px rgba(132, 89, 54, .2);
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
input[type=text], input[type=email], input[type=tel], input[type=time], input[type=number], select, textarea {
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
.gs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
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
.gb.rouge.sel { background: #dc3545; color: #fff; box-shadow: 0 8px 20px rgba(220,53,69,.3); }
.gb.jaune.sel { background: #d4a017; color: #fff; box-shadow: 0 8px 20px rgba(212,160,23,.3); }
.gb.vert.sel  { background: #28a745; color: #fff; box-shadow: 0 8px 20px rgba(40,167,69,.3); }

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
.pc { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
@media(max-width:580px) { .pc, .gs { grid-template-columns: 1fr; } }
.pcard {
  border: 2px solid #e8ddd0; border-radius: var(--radius);
  padding: 20px 16px; text-align: center; cursor: pointer;
  transition: var(--trans); position: relative;
  background: rgba(255,255,255,.95);
  animation: fadeInScale 0.5s ease-out backwards;
}
.pcard:nth-child(1) { animation-delay: 0.1s; }
.pcard:nth-child(2) { animation-delay: 0.2s; }
.pcard:nth-child(3) { animation-delay: 0.3s; }
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
</style>
