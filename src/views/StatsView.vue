<template>
  <section class="dashboard">

    <!-- ══════════════════════════════════════════════
         BILAN GLOBAL JIM 2026
    ══════════════════════════════════════════════ -->
    <div class="form-card section-card" v-reveal="0">
      <div class="fh fh-a">
        <div class="fh-icon"><AppIcon name="trending-up" :size="26" /></div>
        <div class="fh-title">Bilan Global · JIM 2026</div>
        <div class="fh-sub">Journée Internationale des Musées · 16 – 18 Mai 2026 · Musée Virtuel de Guinée</div>
      </div>
      <div class="fb">

        <!-- Placeholder image bannière -->
        <div class="img-placeholder-banner" v-reveal="0">
          <div class="img-placeholder-inner">
            <AppIcon name="landmark" :size="32" />
            <span>Bannière photo événement — à remplacer</span>
          </div>
        </div>

        <!-- KPI cards -->
        <div class="kpi-grid" v-reveal="60">
          <div class="kpi-card kpi-or">
            <div class="kpi-icon"><AppIcon name="users" :size="22" /></div>
            <div class="kpi-value">{{ animCount(totalVisiteurs) }}</div>
            <div class="kpi-label">Visiteurs accueillis</div>
          </div>
          <div class="kpi-card kpi-brun">
            <div class="kpi-icon"><AppIcon name="file-text" :size="22" /></div>
            <div class="kpi-value">{{ animCount(totalRegistrations) }}</div>
            <div class="kpi-label">Inscriptions</div>
          </div>
          <div class="kpi-card kpi-vert">
            <div class="kpi-icon"><AppIcon name="box" :size="22" /></div>
            <div class="kpi-value">{{ animCount(totalContenus) }}</div>
            <div class="kpi-label">Contenus produits</div>
          </div>
          <div class="kpi-card kpi-rouge">
            <div class="kpi-icon"><AppIcon name="star" :size="22" /></div>
            <div class="kpi-value">{{ averageRating > 0 ? averageRating.toFixed(1) : '—' }}</div>
            <div class="kpi-label">Note moyenne / 5</div>
          </div>
          <div class="kpi-card kpi-or">
            <div class="kpi-icon"><AppIcon name="message-circle" :size="22" /></div>
            <div class="kpi-value">{{ animCount(airtable.avisRecords.length) }}</div>
            <div class="kpi-label">Avis reçus</div>
          </div>
          <div class="kpi-card kpi-brun">
            <div class="kpi-icon"><AppIcon name="mail" :size="22" /></div>
            <div class="kpi-value">{{ tauxNewsletter }}<small>%</small></div>
            <div class="kpi-label">Taux newsletter</div>
          </div>
        </div>

        <!-- Connexion warning -->
        <div class="connexion-banner" :class="{ ok: airtable.isConnected }" v-reveal="80">
          <AppIcon :name="airtable.isConnected ? 'check-circle' : 'alert-triangle'" :size="16" />
          <span v-if="airtable.isConnected">Connecté à Airtable — données en temps réel.</span>
          <span v-else>Connectez-vous à Airtable pour charger les données réelles.</span>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════
         PAR JOUR
    ══════════════════════════════════════════════ -->
    <div class="form-card section-card" v-reveal="0">
      <div class="fh fh-a">
        <div class="fh-icon"><AppIcon name="calendar" :size="26" /></div>
        <div class="fh-title">Suivi par Jour</div>
        <div class="fh-sub">Répartition des participant·e·s sur les 3 jours de l'événement</div>
      </div>
      <div class="fb">
        <!-- Sélecteur de jour -->
        <div class="day-tabs" v-reveal="40">
          <button
            v-for="jour in jours"
            :key="jour.id"
            class="day-tab"
            :class="{ active: selectedJour === jour.id }"
            @click="selectedJour = jour.id"
          >
            <span class="day-tab-num">{{ jour.label }}</span>
            <span class="day-tab-date">{{ jour.date }}</span>
            <span class="day-tab-count">{{ statsByJour[jour.label] || 0 }} part.</span>
          </button>
        </div>

        <!-- Détail du jour sélectionné -->
        <Transition name="slide-down">
          <div v-if="selectedJour" class="day-detail" v-reveal="60">

            <!-- Placeholder photo du jour -->
            <div class="img-placeholder-sm">
              <AppIcon name="camera" :size="20" />
              <span>Photo Jour {{ selectedJour.replace('jour','') }} — à remplacer</span>
            </div>

            <div class="day-stat-row">
              <div class="day-total">
                <span class="day-total-num">{{ statsByJour[joursMap[selectedJour]] || 0 }}</span>
                <span class="day-total-lbl">participant·e·s ce jour</span>
              </div>
            </div>

            <!-- Breakdown par lieu -->
            <div class="lieu-breakdown" v-if="Object.keys(jourLieuStats).length">
              <div class="breakdown-title">Répartition par lieu</div>
              <div
                class="lieu-row"
                v-for="(count, lieu) in jourLieuStats"
                :key="lieu"
              >
                <div class="lieu-row-label">
                  <AppIcon :name="lieuIcon(lieu)" :size="14" />
                  {{ lieu }}
                </div>
                <div class="lieu-row-bar-wrap">
                  <div class="lieu-row-bar" :style="{ width: lieuBarWidth(count, jourLieuStats) + '%' }"></div>
                </div>
                <div class="lieu-row-count">{{ count }}</div>
              </div>
            </div>
            <div class="empty-day" v-else>
              <AppIcon name="clock" :size="28" />
              <p>Aucun enregistrement pour ce jour.</p>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════
         ACTIVITÉS DES PÔLES
    ══════════════════════════════════════════════ -->
    <div class="form-card section-card" v-reveal="0">
      <div class="fh fh-s">
        <div class="fh-icon"><AppIcon name="bar-chart" :size="26" /></div>
        <div class="fh-title">Activités des Pôles</div>
        <div class="fh-sub">Résultats par pôle · Pôle Photo · Pôle 3D · Pôle Récit</div>
      </div>
      <div class="fb">
        <div class="poles-grid" v-reveal="40">
          <div
            class="pole-card"
            v-for="(stats, poleName) in poleStats"
            :key="poleName"
            :class="poleClass(poleName)"
          >
            <!-- Placeholder image pôle -->
            <div class="pole-img-placeholder">
              <AppIcon :name="poleIcon(poleName)" :size="24" />
            </div>
            <div class="pole-name">{{ poleName }}</div>
            <div class="pole-stats-list">
              <div class="pole-stat-item">
                <span class="pole-stat-lbl">Rotations</span>
                <span class="pole-stat-val">{{ stats.rotations }}</span>
              </div>
              <div class="pole-stat-item">
                <span class="pole-stat-lbl">Passé(e)s</span>
                <span class="pole-stat-val">{{ stats.passés }}</span>
              </div>
              <div class="pole-stat-item">
                <span class="pole-stat-lbl">Actif(ve)s</span>
                <span class="pole-stat-val">{{ stats.actifs }}</span>
              </div>
              <div class="pole-stat-item highlight">
                <span class="pole-stat-lbl">Contenus produits</span>
                <span class="pole-stat-val">{{ stats.contenus }}</span>
              </div>
            </div>
            <!-- Barre de progression contenus -->
            <div class="pole-bar-wrap">
              <div class="pole-bar" :style="{ width: poleBarWidth(stats.contenus) + '%' }"></div>
            </div>
          </div>
        </div>

        <!-- Comparaison contenus entre pôles -->
        <div class="poles-comparison" v-if="totalContenus > 0" v-reveal="80">
          <div class="breakdown-title">Contenus produits — comparaison</div>
          <div
            class="lieu-row"
            v-for="(stats, poleName) in poleStats"
            :key="poleName"
          >
            <div class="lieu-row-label">
              <AppIcon :name="poleIcon(poleName)" :size="14" />
              {{ poleName }}
            </div>
            <div class="lieu-row-bar-wrap">
              <div
                class="lieu-row-bar"
                :class="poleBarClass(poleName)"
                :style="{ width: poleBarWidth(stats.contenus) + '%' }"
              ></div>
            </div>
            <div class="lieu-row-count">{{ stats.contenus }}</div>
          </div>
        </div>

        <div class="empty-day" v-if="!airtable.suiviRecords.length" v-reveal="60">
          <AppIcon name="bar-chart" :size="32" />
          <p>Aucun suivi de pôle enregistré pour le moment.</p>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════
         AVIS VISITEURS
    ══════════════════════════════════════════════ -->
    <div class="form-card section-card" v-reveal="0">
      <div class="fh fh-v">
        <div class="fh-icon"><AppIcon name="star" :size="26" /></div>
        <div class="fh-title">Avis Visiteurs</div>
        <div class="fh-sub">Retours du formulaire externe · satisfaction · pôle préféré · newsletter</div>
      </div>
      <div class="fb">

        <div v-if="airtable.avisRecords.length">
          <!-- Note globale -->
          <div class="avis-global" v-reveal="40">
            <div class="avis-note-big">
              <span class="note-number">{{ averageRating.toFixed(1) }}</span>
              <span class="note-max">/5</span>
            </div>
            <div class="avis-stars-row">
              <span
                v-for="n in 5"
                :key="n"
                class="avis-star-display"
                :class="{ full: n <= Math.round(averageRating), half: false }"
              >
                <AppIcon name="star" :size="20" />
              </span>
            </div>
            <div class="avis-count-label">{{ airtable.avisRecords.length }} avis reçus</div>
          </div>

          <!-- Distribution des notes -->
          <div class="note-distribution" v-reveal="60">
            <div class="breakdown-title">Distribution des notes</div>
            <div
              class="note-dist-row"
              v-for="n in [5,4,3,2,1]"
              :key="n"
            >
              <div class="note-dist-label">
                <span v-for="s in n" :key="s" class="mini-star"><AppIcon name="star" :size="11" /></span>
              </div>
              <div class="note-dist-bar-wrap">
                <div
                  class="note-dist-bar"
                  :style="{ width: noteDistPercent(n) + '%' }"
                  :class="`note-bar-${n}`"
                ></div>
              </div>
              <div class="note-dist-count">{{ noteDistribution[n] || 0 }}</div>
            </div>
          </div>

          <!-- Pôle préféré -->
          <div class="pole-prefere-section" v-if="Object.keys(polePrefereStats).length" v-reveal="80">
            <div class="breakdown-title">Pôle préféré</div>
            <div class="lieu-row" v-for="(count, pole) in polePrefereStats" :key="pole">
              <div class="lieu-row-label">
                <AppIcon :name="poleIcon(pole)" :size="14" />
                {{ pole }}
              </div>
              <div class="lieu-row-bar-wrap">
                <div class="lieu-row-bar" :style="{ width: prefereBarWidth(count) + '%' }"></div>
              </div>
              <div class="lieu-row-count">{{ count }}</div>
            </div>
          </div>

          <!-- Derniers commentaires -->
          <div class="comments-section" v-reveal="100">
            <div class="breakdown-title">Derniers retours visiteurs</div>
            <div
              class="comment-card"
              v-for="(avis, i) in airtable.avisRecords.slice(0, 8)"
              :key="avis.id || i"
              :style="{ animationDelay: `${i * 50}ms` }"
            >
              <div class="comment-header">
                <div class="comment-stars">
                  <span
                    v-for="n in 5"
                    :key="n"
                    class="comment-star"
                    :class="{ lit: n <= avis.Note }"
                  ><AppIcon name="star" :size="12" /></span>
                </div>
                <div class="comment-meta">
                  <span class="comment-pole" v-if="avis.PolePrefere">{{ avis.PolePrefere }}</span>
                  <span class="comment-date">{{ avis.Date || '' }}</span>
                </div>
              </div>
              <div class="comment-text" v-if="avis.Commentaire">{{ avis.Commentaire }}</div>
              <div class="comment-empty" v-else>— Aucun commentaire</div>
            </div>
            <p class="more-hint" v-if="airtable.avisRecords.length > 8">
              + {{ airtable.avisRecords.length - 8 }} autres avis dans Airtable
            </p>
          </div>
        </div>

        <!-- État vide -->
        <div class="empty-day" v-else v-reveal="0">
          <AppIcon name="star" :size="36" />
          <p>Aucun avis reçu pour le moment. Le formulaire externe alimentera cette section via Airtable.</p>
        </div>
      </div>
    </div>

  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useAirtableStore } from '../store/airtable'
import AppIcon from '../components/AppIcon.vue'

const airtable = useAirtableStore()

// ─── Jour sélectionné ───────────────────────────────────────
const selectedJour = ref('')
const jours = [
  { id: 'jour1', label: 'Jour 1', date: '16 Mai 2026' },
  { id: 'jour2', label: 'Jour 2', date: '17 Mai 2026' },
  { id: 'jour3', label: 'Jour 3', date: '18 Mai 2026' },
]
const joursMap = { jour1: 'Jour 1', jour2: 'Jour 2', jour3: 'Jour 3' }

// ─── Getters du store ────────────────────────────────────────
const totalVisiteurs     = computed(() => airtable.totalVisiteurs)
const totalRegistrations = computed(() => airtable.totalRegistrations)
const totalContenus      = computed(() => airtable.totalContenus)
const averageRating      = computed(() => airtable.averageRating)
const tauxNewsletter     = computed(() => airtable.tauxNewsletter)
const statsByJour        = computed(() => airtable.statsByJour)
const statsByJourLieu    = computed(() => airtable.statsByJourLieu)
const poleStats          = computed(() => airtable.poleStats)
const noteDistribution   = computed(() => airtable.noteDistribution)
const polePrefereStats   = computed(() => airtable.polePrefereStats)

// ─── Stats du jour sélectionné ──────────────────────────────
const jourLieuStats = computed(() => {
  if (!selectedJour.value) return {}
  return statsByJourLieu.value[joursMap[selectedJour.value]] || {}
})

// ─── Compteur animé ─────────────────────────────────────────
const animValues = ref({})
function animCount(target) {
  return animValues.value[target] ?? target
}
function runCountUp(target) {
  if (animValues.value[target] === target) return
  const start = 0
  const duration = 800
  const startTime = performance.now()
  function update(now) {
    const progress = Math.min((now - startTime) / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    animValues.value[target] = Math.round(start + target * eased)
    if (progress < 1) requestAnimationFrame(update)
  }
  requestAnimationFrame(update)
}
watch([totalVisiteurs, totalRegistrations, totalContenus], ([v, r, c]) => {
  runCountUp(v); runCountUp(r); runCountUp(c)
}, { immediate: true })

// ─── Helpers ─────────────────────────────────────────────────
function lieuIcon(lieu) {
  if (lieu.includes('conférence')) return 'users'
  if (lieu.includes('CCFG'))       return 'landmark'
  if (lieu.includes('spectacle'))  return 'film'
  return 'users'
}

function lieuBarWidth(count, map) {
  const max = Math.max(...Object.values(map), 1)
  return Math.round((count / max) * 100)
}

function poleIcon(poleName) {
  if (poleName.includes('Photo'))  return 'camera'
  if (poleName.includes('3D'))     return 'box'
  if (poleName.includes('Récit'))  return 'message-circle'
  return 'camera'
}

function poleClass(poleName) {
  if (poleName.includes('Photo'))  return 'pole-photo'
  if (poleName.includes('3D'))     return 'pole-3d'
  if (poleName.includes('Récit'))  return 'pole-recit'
  return ''
}

function poleBarClass(poleName) {
  if (poleName.includes('Photo'))  return 'bar-photo'
  if (poleName.includes('3D'))     return 'bar-3d'
  if (poleName.includes('Récit'))  return 'bar-recit'
  return ''
}

function poleBarWidth(contenus) {
  const max = Math.max(...Object.values(poleStats.value).map(s => s.contenus), 1)
  return Math.round((contenus / max) * 100)
}

function noteDistPercent(note) {
  const total = airtable.avisRecords.length || 1
  return Math.round(((noteDistribution.value[note] || 0) / total) * 100)
}

function prefereBarWidth(count) {
  const max = Math.max(...Object.values(polePrefereStats.value), 1)
  return Math.round((count / max) * 100)
}

// ─── Chargement Airtable ────────────────────────────────────
watch(
  () => airtable.isConnected,
  async (connected) => {
    if (connected) {
      await airtable.loadAll()
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.dashboard { display: flex; flex-direction: column; gap: 2rem; }
.section-card { margin: 0; }

/* ─── Placeholder images ─── */
.img-placeholder-banner {
  background: linear-gradient(135deg, rgba(132,89,54,.08), rgba(249,178,51,.1));
  border: 2px dashed rgba(132,89,54,.25);
  border-radius: 14px;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  color: rgba(132,89,54,.5);
  transition: border-color 0.3s;
}
.img-placeholder-banner:hover { border-color: var(--or); }
.img-placeholder-inner { display: flex; flex-direction: column; align-items: center; gap: 8px; font-size: .82rem; font-weight: 600; }

.img-placeholder-sm {
  background: rgba(132,89,54,.06);
  border: 2px dashed rgba(132,89,54,.2);
  border-radius: 10px;
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: rgba(132,89,54,.4);
  font-size: .78rem;
  font-weight: 600;
  margin-bottom: 1.2rem;
}

/* ─── KPI Grid ─── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
}
.kpi-card {
  border-radius: 16px;
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  animation: fadeInScale 0.5s ease-out backwards;
}
.kpi-card:nth-child(1) { animation-delay: 0.05s; }
.kpi-card:nth-child(2) { animation-delay: 0.10s; }
.kpi-card:nth-child(3) { animation-delay: 0.15s; }
.kpi-card:nth-child(4) { animation-delay: 0.20s; }
.kpi-card:nth-child(5) { animation-delay: 0.25s; }
.kpi-card:nth-child(6) { animation-delay: 0.30s; }
.kpi-card:hover { transform: translateY(-4px); box-shadow: 0 14px 32px rgba(0,0,0,.1); }
.kpi-or    { background: linear-gradient(135deg, rgba(249,178,51,.15), rgba(249,178,51,.05)); border: 1px solid rgba(249,178,51,.35); }
.kpi-brun  { background: linear-gradient(135deg, rgba(132,89,54,.12), rgba(132,89,54,.04)); border: 1px solid rgba(132,89,54,.25); }
.kpi-vert  { background: linear-gradient(135deg, rgba(42,110,60,.1), rgba(42,110,60,.03));  border: 1px solid rgba(42,110,60,.25); }
.kpi-rouge { background: linear-gradient(135deg, rgba(177,34,42,.1), rgba(177,34,42,.03));  border: 1px solid rgba(177,34,42,.22); }
.kpi-icon { color: var(--or); margin-bottom: 4px; }
.kpi-or .kpi-icon    { color: #b07700; }
.kpi-brun .kpi-icon  { color: var(--brun); }
.kpi-vert .kpi-icon  { color: #2e7d32; }
.kpi-rouge .kpi-icon { color: var(--rouge); }
.kpi-value { font-size: 1.9rem; font-weight: 900; color: var(--noir); line-height: 1; }
.kpi-value small { font-size: 1rem; opacity: .6; }
.kpi-label { font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; color: #888; }

/* ─── Connexion banner ─── */
.connexion-banner {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px; border-radius: 10px;
  font-size: .82rem; font-weight: 600;
  background: rgba(249,178,51,.08); border: 1px solid rgba(249,178,51,.3);
  color: #7a5500;
}
.connexion-banner.ok { background: rgba(42,110,60,.08); border-color: rgba(42,110,60,.25); color: #2e7d32; }

/* ─── Day tabs ─── */
.day-tabs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 1rem; }
.day-tab {
  background: rgba(255,255,255,.9); border: 2px solid #e8ddd0;
  border-radius: 14px; padding: 14px 12px;
  cursor: pointer; transition: all 0.28s ease;
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  font-family: inherit;
}
.day-tab:hover { border-color: var(--or); transform: translateY(-2px); }
.day-tab.active { border-color: var(--or); background: linear-gradient(135deg, rgba(132,89,54,.08), rgba(249,178,51,.1)); }
.day-tab-num { font-size: .82rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: var(--brun); }
.day-tab.active .day-tab-num { color: var(--or); }
.day-tab-date { font-size: .72rem; color: #999; font-weight: 600; }
.day-tab-count { font-size: .78rem; font-weight: 700; color: var(--rouge); background: rgba(177,34,42,.08); padding: 2px 8px; border-radius: 20px; margin-top: 2px; }

/* ─── Day detail ─── */
.day-stat-row { display: flex; align-items: baseline; gap: 10px; margin-bottom: 1.2rem; }
.day-total-num { font-size: 2.4rem; font-weight: 900; color: var(--rouge); }
.day-total-lbl { font-size: .85rem; color: #888; font-weight: 600; }

/* ─── Breakdown bars (shared) ─── */
.breakdown-title { font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: var(--brun); margin-bottom: .8rem; opacity: .7; }
.lieu-breakdown, .poles-comparison, .pole-prefere-section { margin-bottom: 1.5rem; }
.lieu-row { display: flex; align-items: center; gap: 12px; margin-bottom: .6rem; }
.lieu-row-label { font-size: .82rem; font-weight: 600; color: var(--brun); width: 200px; flex-shrink: 0; display: flex; align-items: center; gap: 6px; }
.lieu-row-bar-wrap { flex: 1; height: 10px; background: rgba(132,89,54,.08); border-radius: 5px; overflow: hidden; }
.lieu-row-bar { height: 100%; background: linear-gradient(90deg, var(--brun), var(--or)); border-radius: 5px; transition: width 0.9s cubic-bezier(.22,1,.36,1); }
.bar-photo  { background: linear-gradient(90deg, #845936, #F9B233); }
.bar-3d     { background: linear-gradient(90deg, #1a3a2a, #2d6a4a); }
.bar-recit  { background: linear-gradient(90deg, #B1222A, #8C3B2A); }
.lieu-row-count { font-size: .82rem; font-weight: 700; color: var(--or); width: 30px; text-align: right; flex-shrink: 0; }

/* ─── Pole cards ─── */
.poles-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
.pole-card {
  border-radius: 16px; padding: 1.2rem;
  display: flex; flex-direction: column; gap: .6rem;
  border: 2px solid #e8ddd0;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  animation: fadeInScale 0.5s ease-out backwards;
}
.pole-card:nth-child(1) { animation-delay: 0.1s; }
.pole-card:nth-child(2) { animation-delay: 0.2s; }
.pole-card:nth-child(3) { animation-delay: 0.3s; }
.pole-card:hover { transform: translateY(-4px); box-shadow: 0 14px 32px rgba(0,0,0,.1); }
.pole-photo { border-color: rgba(249,178,51,.4); background: linear-gradient(135deg, rgba(249,178,51,.06), rgba(249,178,51,.02)); }
.pole-3d    { border-color: rgba(42,110,60,.3);   background: linear-gradient(135deg, rgba(42,110,60,.06),   rgba(42,110,60,.02)); }
.pole-recit { border-color: rgba(177,34,42,.3);   background: linear-gradient(135deg, rgba(177,34,42,.06),   rgba(177,34,42,.02)); }

.pole-img-placeholder {
  height: 70px; border-radius: 10px;
  background: rgba(132,89,54,.07);
  border: 1px dashed rgba(132,89,54,.2);
  display: flex; align-items: center; justify-content: center;
  color: rgba(132,89,54,.4);
  margin-bottom: 4px;
}
.pole-photo .pole-img-placeholder { color: rgba(132,89,54,.5); }
.pole-3d    .pole-img-placeholder { color: rgba(42,110,60,.5); }
.pole-recit .pole-img-placeholder { color: rgba(177,34,42,.5); }

.pole-name { font-size: .82rem; font-weight: 900; text-transform: uppercase; letter-spacing: .5px; color: var(--brun); }
.pole-stats-list { display: flex; flex-direction: column; gap: 4px; }
.pole-stat-item { display: flex; justify-content: space-between; font-size: .78rem; }
.pole-stat-lbl { color: #888; }
.pole-stat-val { font-weight: 700; color: var(--brun); }
.pole-stat-item.highlight .pole-stat-val { color: var(--rouge); font-size: .92rem; }
.pole-bar-wrap { height: 6px; background: rgba(132,89,54,.1); border-radius: 3px; overflow: hidden; margin-top: 4px; }
.pole-photo .pole-bar { background: linear-gradient(90deg, #845936, #F9B233); }
.pole-3d    .pole-bar { background: linear-gradient(90deg, #1a3a2a, #2d6a4a); }
.pole-recit .pole-bar { background: linear-gradient(90deg, #B1222A, #8C3B2A); }
.pole-bar { height: 100%; border-radius: 3px; transition: width 0.9s cubic-bezier(.22,1,.36,1); }

/* ─── Avis global ─── */
.avis-global { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 1.5rem; background: rgba(132,89,54,.04); border-radius: 16px; margin-bottom: 1.5rem; }
.avis-note-big { display: flex; align-items: baseline; gap: 4px; }
.note-number { font-size: 3.5rem; font-weight: 900; color: var(--or); line-height: 1; }
.note-max { font-size: 1.2rem; color: #bbb; font-weight: 700; }
.avis-stars-row { display: flex; gap: 4px; }
.avis-star-display { color: #ddd; transition: color 0.15s; }
.avis-star-display.full { color: var(--gold); }
.avis-count-label { font-size: .78rem; color: #999; font-weight: 600; }

/* ─── Distribution notes ─── */
.note-distribution { margin-bottom: 1.5rem; }
.note-dist-row { display: flex; align-items: center; gap: 10px; margin-bottom: .5rem; }
.note-dist-label { display: flex; gap: 2px; width: 80px; flex-shrink: 0; }
.mini-star { color: var(--gold); }
.note-dist-bar-wrap { flex: 1; height: 10px; background: rgba(132,89,54,.08); border-radius: 5px; overflow: hidden; }
.note-dist-bar { height: 100%; border-radius: 5px; transition: width 0.9s cubic-bezier(.22,1,.36,1); }
.note-bar-5 { background: #2e7d32; }
.note-bar-4 { background: #4caf50; }
.note-bar-3 { background: #F9B233; }
.note-bar-2 { background: #ff9800; }
.note-bar-1 { background: var(--rouge); }
.note-dist-count { width: 28px; text-align: right; font-size: .8rem; font-weight: 700; color: var(--brun); flex-shrink: 0; }

/* ─── Comments ─── */
.comments-section { margin-top: 1.5rem; }
.comment-card {
  padding: 1rem 1.2rem; background: rgba(255,255,255,.9);
  border-radius: 12px; border: 1px solid #e8ddd0;
  margin-bottom: .6rem;
  animation: fadeInUp 0.4s ease-out backwards;
  transition: transform 0.2s ease;
}
.comment-card:hover { transform: translateX(4px); }
.comment-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: .4rem; }
.comment-stars { display: flex; gap: 2px; }
.comment-star { color: #ddd; }
.comment-star.lit { color: var(--gold); }
.comment-meta { display: flex; gap: 8px; align-items: center; }
.comment-pole { font-size: .72rem; font-weight: 700; background: rgba(132,89,54,.1); color: var(--brun); padding: 2px 8px; border-radius: 20px; }
.comment-date { font-size: .72rem; color: #bbb; }
.comment-text { font-size: .88rem; color: var(--noir); line-height: 1.5; }
.comment-empty { font-size: .82rem; color: #bbb; font-style: italic; }
.more-hint { font-size: .78rem; color: #bbb; font-style: italic; margin-top: .5rem; }

/* ─── Empty states ─── */
.empty-day {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 3rem 2rem; color: #ccc; text-align: center;
}
.empty-day p { color: #aaa; max-width: 340px; line-height: 1.6; font-size: .88rem; }

/* ─── Transitions ─── */
.slide-down-enter-active { animation: slideDown 0.35s cubic-bezier(.22,1,.36,1); }
.slide-down-leave-active { animation: slideDown 0.2s ease-in reverse; }
@keyframes slideDown { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeInScale { from { opacity: 0; transform: scale(.94); } to { opacity: 1; transform: scale(1); } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

/* ─── Responsive ─── */
@media (max-width: 768px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .poles-grid { grid-template-columns: 1fr; }
  .day-tabs { grid-template-columns: 1fr; gap: 8px; }
  .lieu-row-label { width: 140px; }
}
@media (max-width: 480px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
