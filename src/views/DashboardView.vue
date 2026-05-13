<template>
  <section class="dashboard-page">

    <!-- ═══ SECTION TEMPS RÉEL ═══ -->
    <div class="dash-section-title" v-reveal="0">
      <div class="dst-left">
        <span class="dst-dot live"></span>
        <AppIcon name="activity" :size="18" />
        <span>Temps réel</span>
      </div>
      <span class="dst-date">{{ todayLabel }}</span>
    </div>

    <!-- KPIs rapides temps réel -->
    <div class="rt-kpi-row" v-reveal="0">
      <div class="rt-kpi">
        <AppIcon name="refresh-cw" :size="20" style="color:var(--or)" />
        <div>
          <span class="rt-kpi-val">{{ totalRotations }}</span>
          <span class="rt-kpi-lbl">Rotations du jour</span>
        </div>
      </div>
      <div class="rt-kpi">
        <AppIcon name="layers" :size="20" style="color:var(--brun)" />
        <div>
          <span class="rt-kpi-val">{{ activePoles }}</span>
          <span class="rt-kpi-lbl">Pôle{{ activePoles > 1 ? 's' : '' }} actif{{ activePoles > 1 ? 's' : '' }}</span>
        </div>
      </div>
      <div class="rt-kpi" :class="reconciliationOk ? 'rt-kpi-ok' : (totalAccueil > 0 ? 'rt-kpi-warn' : '')">
        <AppIcon :name="reconciliationOk ? 'check-circle' : 'alert-triangle'" :size="20" />
        <div>
          <span class="rt-kpi-val">{{ reconciliationOk ? 'OK' : (totalAccueil > 0 ? 'Écart' : '–') }}</span>
          <span class="rt-kpi-lbl">Cohérence passages</span>
        </div>
      </div>
    </div>

    <!-- Grille des pôles -->
    <div class="poles-grid-rt" v-reveal="40">
      <div class="pole-rt" v-for="pole in poles" :key="pole.key">
        <div class="prt-header" :style="{ background: pole.color }">
          <AppIcon :name="pole.icon" :size="20" />
          <span>{{ pole.label }}</span>
        </div>
        <div class="prt-body">
          <div class="prt-current-label">Groupe actuel</div>
          <div
            class="prt-group"
            :class="currentGroup(pole.key) || 'libre'"
            @click="cycleGroup(pole.key)"
            title="Cliquer pour changer"
          >
            {{ groupLabel(currentGroup(pole.key)) }}
          </div>
          <div class="prt-history" v-if="rot.history[pole.key]?.length">
            <div
              class="prt-hist-item"
              v-for="(h, i) in rot.history[pole.key].slice(-2).reverse()"
              :key="i"
            >
              <span class="prt-hist-badge" :class="h.group">{{ groupLabel(h.group) }}</span>
              <span class="prt-hist-time">{{ h.time }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Enregistrer une rotation -->
    <div class="dash-block" v-reveal="60">
      <div class="dash-block-header">
        <AppIcon name="refresh-cw" :size="16" />
        <h3>Enregistrer une rotation</h3>
      </div>
      <div class="rotation-form-inline">
        <div class="rfi-field">
          <label>Pôle</label>
          <select v-model="newRotation.pole">
            <option value="">— Sélectionner —</option>
            <option v-for="p in poles" :key="p.key" :value="p.key">{{ p.label }}</option>
          </select>
        </div>
        <div class="rfi-field">
          <label>Groupe entrant</label>
          <select v-model="newRotation.group">
            <option value="">— Sélectionner —</option>
            <option value="rouge">Groupe Rouge</option>
            <option value="jaune">Groupe Jaune</option>
            <option value="vert">Groupe Vert</option>
            <option value="libre">Libre (aucun groupe)</option>
          </select>
        </div>
        <button class="bsub bsub-v rfi-btn" @click="registerRotation" :disabled="!newRotation.pole || !newRotation.group">
          <AppIcon name="check" :size="16" /> Valider
        </button>
      </div>
    </div>

    <!-- Timeline rotations -->
    <div class="dash-block" v-if="rot.allRotations.length" v-reveal="80">
      <div class="dash-block-header">
        <AppIcon name="clock" :size="16" />
        <h3>Historique des rotations</h3>
        <span class="badge">{{ rot.allRotations.length }}</span>
      </div>
      <div class="rotation-timeline">
        <div class="rt-item" v-for="(r, i) in rot.visibleRotations" :key="i">
          <div class="rt-time">{{ r.time }}</div>
          <div class="rt-dot" :class="r.group"></div>
          <div class="rt-info">
            <span class="rt-pole">{{ poleLabel(r.pole) }}</span>
            <span class="rt-arrow">→</span>
            <span class="rt-group" :class="r.group">{{ groupLabel(r.group) }}</span>
          </div>
        </div>
        <button v-if="rot.allRotations.length > rot.PAGE_SIZE" class="rt-toggle" @click="rot.showAll = !rot.showAll">
          {{ rot.showAll ? 'Réduire' : `Voir les ${rot.allRotations.length - rot.PAGE_SIZE} précédentes` }}
        </button>
      </div>
    </div>

    <!-- Vérification passages -->
    <div class="dash-block" v-reveal="100">
      <div class="dash-block-header">
        <AppIcon name="check-circle" :size="16" />
        <h3>Vérification des passages</h3>
        <span class="badge" :class="reconciliationOk ? 'badge-ok' : (totalAccueil > 0 ? 'badge-warn' : '')">
          {{ reconciliationOk ? 'Cohérent' : (totalAccueil > 0 ? 'Écart détecté' : 'Accueil non renseigné') }}
        </span>
      </div>
      <div class="rec-accueil">
        <AppIcon name="users" :size="15" />
        <span>Total enregistré à l'accueil :</span>
        <strong>{{ totalAccueil > 0 ? `${totalAccueil} personne${totalAccueil > 1 ? 's' : ''}` : 'Non renseigné' }}</strong>
      </div>
      <div class="rec-grid" v-if="totalAccueil > 0">
        <div class="rec-pole" v-for="item in reconciliation" :key="item.label" :class="item.ok ? 'rec-ok' : 'rec-warn'">
          <div class="rec-pole-header">
            <AppIcon :name="item.icon" :size="14" />
            <span>{{ item.label }}</span>
            <AppIcon :name="item.ok ? 'check-circle' : 'alert-triangle'" :size="14" class="rec-status-ico" />
          </div>
          <div class="rec-numbers">
            <div class="rec-num">
              <span class="rec-num-val">{{ item.passés }}</span>
              <span class="rec-num-lbl">passé{{ item.passés > 1 ? 's' : '' }}</span>
            </div>
            <div class="rec-sep">/</div>
            <div class="rec-num">
              <span class="rec-num-val">{{ totalAccueil }}</span>
              <span class="rec-num-lbl">attendu{{ totalAccueil > 1 ? 's' : '' }}</span>
            </div>
          </div>
          <div class="rec-ecart" v-if="!item.ok">
            {{ item.ecart > 0 ? `+${item.ecart} en excès` : `${Math.abs(item.ecart)} manquant${Math.abs(item.ecart) > 1 ? 's' : ''}` }}
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ SÉPARATEUR BILAN ═══ -->
    <div class="dash-section-title bilan-title" v-reveal="0">
      <div class="dst-left">
        <AppIcon name="bar-chart-2" :size="18" />
        <span>Bilan & Statistiques</span>
      </div>
    </div>

    <!-- KPI cards bilan -->
    <div class="kpi-grid" v-reveal="0">
      <div class="kpi-card kpi-main">
        <div class="kpi-icon" style="background:rgba(177,34,42,.1);color:var(--rouge)">
          <AppIcon name="users" :size="22" />
        </div>
        <div class="kpi-body">
          <span class="kpi-val">{{ animatedGlobal }}</span>
          <span class="kpi-lbl">Total participants (global)</span>
          <span class="kpi-sub">Inscriptions + visiteurs pôles</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="background:rgba(132,89,54,.1);color:var(--brun)">
          <AppIcon name="file-text" :size="22" />
        </div>
        <div class="kpi-body">
          <span class="kpi-val">{{ totalRegistrations }}</span>
          <span class="kpi-lbl">Inscrits conférences</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="background:rgba(249,178,51,.12);color:var(--or)">
          <AppIcon name="bar-chart-2" :size="22" />
        </div>
        <div class="kpi-body">
          <span class="kpi-val">{{ totalVisiteursPoles }}</span>
          <span class="kpi-lbl">Visiteurs pôles</span>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="background:rgba(76,175,80,.1);color:#2e7d32">
          <AppIcon name="star" :size="22" />
        </div>
        <div class="kpi-body">
          <span class="kpi-val">{{ totalAvis }}</span>
          <span class="kpi-lbl">Avis collectés</span>
        </div>
      </div>
    </div>

    <!-- Sessions & ateliers -->
    <div class="dash-block" v-reveal="0">
      <div class="dash-block-header">
        <AppIcon name="file-text" :size="16" />
        <h3>Sessions &amp; ateliers</h3>
        <span class="badge">{{ totalRegistrations }} participants</span>
      </div>
      <div v-if="summaryEntries.length">
        <div class="bar-row" v-for="(entry, i) in summaryEntries" :key="entry.session" :style="{ animationDelay: `${i * 50}ms` }">
          <div class="bar-label">{{ entry.session }}</div>
          <div class="bar-track"><div class="bar-fill" :style="{ width: `${entry.width}%` }"></div></div>
          <div class="bar-count">{{ entry.count }}</div>
        </div>
      </div>
      <div class="empty-inline" v-else>
        <AppIcon name="inbox" :size="28" /> Aucune inscription enregistrée
      </div>
    </div>

    <!-- Activité des pôles -->
    <div class="dash-block" v-reveal="0">
      <div class="dash-block-header">
        <AppIcon name="layers" :size="16" />
        <h3>Activité des pôles</h3>
      </div>
      <div v-if="Object.keys(poleStats).length">
        <table class="pole-table">
          <thead>
            <tr>
              <th>Pôle</th>
              <th>Passages</th>
              <th>Actifs</th>
              <th>Contenus produits</th>
              <th>Rotations</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(stats, pole) in poleStats" :key="pole">
              <td>
                <span class="pole-name-cell">
                  <AppIcon :name="poleIcon(pole)" :size="15" /> {{ pole }}
                </span>
              </td>
              <td class="num-cell">{{ stats.passés }}</td>
              <td class="num-cell">{{ stats.actifs }}</td>
              <td class="num-cell">{{ stats.contenus }}</td>
              <td class="num-cell">{{ stats.sessions }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="empty-inline" v-else>
        <AppIcon name="inbox" :size="28" /> Aucune activité pôle enregistrée
      </div>
    </div>

    <!-- Satisfaction visiteurs -->
    <div class="dash-block" v-if="totalAvis > 0" v-reveal="0">
      <div class="dash-block-header">
        <AppIcon name="star" :size="16" />
        <h3>Satisfaction visiteurs</h3>
        <span class="badge">{{ totalAvis }} avis</span>
      </div>
      <div class="satisfaction-row">
        <div class="sat-score">
          <span class="sat-val">{{ averageRating.toFixed(1) }}</span>
          <div class="sat-stars">
            <AppIcon v-for="n in 5" :key="n" name="star" :size="20" :class="['sat-star', starClass(n, averageRating)]" />
          </div>
          <span class="sat-count">{{ totalAvis }} avis</span>
        </div>
        <div class="sat-bars">
          <div class="sat-bar-row" v-for="item in ratingDistribution" :key="item.star">
            <span class="sat-star-lbl">{{ item.star }}★</span>
            <div class="sat-bar-track">
              <div class="sat-bar-fill" :style="{ width: `${item.pct}%` }"></div>
            </div>
            <span class="sat-bar-count">{{ item.count }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Export Excel -->
    <div class="dash-block" v-reveal="0">
      <div class="dash-block-header">
        <AppIcon name="download" :size="16" />
        <h3>Exporter en Excel</h3>
        <span class="badge">.xlsx</span>
      </div>
      <div class="export-grid">
        <button class="export-btn" @click="exportXLSX('inscriptions')">
          <AppIcon name="file-text" :size="18" />
          <div>
            <div class="eb-title">Inscriptions</div>
            <div class="eb-sub">{{ totalRegistrations }} enregistrements</div>
          </div>
          <AppIcon name="download" :size="16" class="eb-dl" />
        </button>
        <button class="export-btn" @click="exportXLSX('accueil')">
          <AppIcon name="users" :size="18" />
          <div>
            <div class="eb-title">Accueil visiteurs</div>
            <div class="eb-sub">{{ airtable.accueilRecords.length }} groupes</div>
          </div>
          <AppIcon name="download" :size="16" class="eb-dl" />
        </button>
        <button class="export-btn" @click="exportXLSX('suivi')">
          <AppIcon name="bar-chart" :size="18" />
          <div>
            <div class="eb-title">Suivi pôles</div>
            <div class="eb-sub">{{ airtable.suiviRecords.length }} enregistrements</div>
          </div>
          <AppIcon name="download" :size="16" class="eb-dl" />
        </button>
        <button class="export-btn" @click="exportXLSX('avis')">
          <AppIcon name="star" :size="18" />
          <div>
            <div class="eb-title">Avis visiteurs</div>
            <div class="eb-sub">{{ totalAvis }} enregistrements</div>
          </div>
          <AppIcon name="download" :size="16" class="eb-dl" />
        </button>
      </div>
    </div>

    <!-- Rapport post-événement -->
    <div class="dash-block rapport-block" v-reveal="0">
      <div class="dash-block-header">
        <AppIcon name="printer" :size="16" />
        <h3>Rapport post-événement</h3>
        <button class="btn-print" @click="printRapport">
          <AppIcon name="printer" :size="14" /> Imprimer / PDF
        </button>
      </div>

      <div class="rapport-inner">
        <div class="rapport-hero">
          <div class="rh-logo"><AppIcon name="layers" :size="36" /></div>
          <div>
            <div class="rh-title">Journée Internationale des Musées 2026</div>
            <div class="rh-sub">Musée Virtuel de Guinée · 16 – 18 Mai 2026</div>
            <div class="rh-date">Rapport généré le {{ reportDate }}</div>
          </div>
        </div>

        <div class="rapport-section">
          <div class="rs-title">Résumé général</div>
          <div class="rapport-kpis">
            <div class="rk"><span class="rk-val">{{ totalGlobal }}</span><span class="rk-lbl">Total participants</span></div>
            <div class="rk"><span class="rk-val">{{ totalRegistrations }}</span><span class="rk-lbl">Inscrits conférences/ateliers</span></div>
            <div class="rk"><span class="rk-val">{{ totalVisiteursPoles }}</span><span class="rk-lbl">Visiteurs pôles</span></div>
            <div class="rk"><span class="rk-val">{{ totalSuiviPassés }}</span><span class="rk-lbl">Rotations aux pôles</span></div>
            <div class="rk"><span class="rk-val">{{ totalAvis }}</span><span class="rk-lbl">Avis collectés</span></div>
            <div class="rk"><span class="rk-val">{{ averageRating.toFixed(1) }}/5</span><span class="rk-lbl">Note moyenne</span></div>
            <div class="rk"><span class="rk-val">{{ satisfactionPct }}%</span><span class="rk-lbl">Taux satisfaction (≥4★)</span></div>
          </div>
        </div>

        <div class="rapport-section" v-if="Object.keys(poleStats).length">
          <div class="rs-title">Activité des pôles</div>
          <table class="rapport-table">
            <thead><tr><th>Pôle</th><th>Passages</th><th>Actifs</th><th>Contenus</th><th>Rotations</th></tr></thead>
            <tbody>
              <tr v-for="(stats, pole) in poleStats" :key="pole">
                <td>{{ pole }}</td>
                <td>{{ stats.passés }}</td>
                <td>{{ stats.actifs }}</td>
                <td>{{ stats.contenus }}</td>
                <td>{{ stats.sessions }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="rapport-section" v-if="topComments.length">
          <div class="rs-title">Commentaires visiteurs</div>
          <div class="rapport-comments">
            <div class="rc-item" v-for="(c, i) in topComments" :key="i">
              <AppIcon name="message-circle" :size="13" /> {{ c }}
            </div>
          </div>
        </div>
      </div>
    </div>

  </section>
</template>

<script setup>
import { computed, ref, watch, onMounted, reactive } from 'vue'
import { useAirtableStore } from '../store/airtable'
import { useRotationsStore } from '../store/rotations'
import AppIcon from '../components/AppIcon.vue'
import * as XLSX from 'xlsx'

const airtable = useAirtableStore()
const rot = useRotationsStore()

// ─── Rotations (temps réel) ───
const poles = [
  { key: 'photo', label: 'Pôle Photo',  icon: 'camera',         color: 'linear-gradient(135deg,#b1222a,#8c3b2a)' },
  { key: '3d',    label: 'Pôle 3D',     icon: 'box',            color: 'linear-gradient(135deg,#593716,#845936)' },
  { key: 'recit', label: 'Pôle Récit',  icon: 'message-circle', color: 'linear-gradient(135deg,#1a3a2a,#2d6a4a)' },
]

const groupOrder = ['rouge', 'jaune', 'vert', 'libre', '']

const todayLabel = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

const totalRotations = computed(() => rot.allRotations.length)
const activePoles = computed(() => poles.filter(p => rot.current[p.key] && rot.current[p.key] !== 'libre').length)

function currentGroup(poleKey) { return rot.current[poleKey] }
function cycleGroup(poleKey) {
  const idx = groupOrder.indexOf(rot.current[poleKey])
  rot.applyRotation(poleKey, groupOrder[(idx + 1) % groupOrder.length])
}
function groupLabel(g) {
  return { rouge: 'Groupe Rouge', jaune: 'Groupe Jaune', vert: 'Groupe Vert', libre: '— Libre —', '': '— Libre —' }[g] || g
}
function poleLabel(k) { return poles.find(p => p.key === k)?.label || k }

const newRotation = reactive({ pole: '', group: '' })
function registerRotation() {
  if (!newRotation.pole || !newRotation.group) return
  rot.applyRotation(newRotation.pole, newRotation.group)
  newRotation.pole = ''
  newRotation.group = ''
}

// ─── KPI généraux ───
const totalRegistrations = computed(() => airtable.totalRegistrations)
const totalAvis = computed(() => airtable.avisRecords.length)
const totalSuiviPassés = computed(() =>
  airtable.suiviRecords.reduce((s, r) => s + (r['Participants passés'] || 0), 0)
)
const totalAccueil = computed(() =>
  airtable.accueilRecords.reduce((s, r) => s + (r.personnes || 0), 0)
)
const totalVisiteursPoles = computed(() => {
  if (totalAccueil.value > 0) return totalAccueil.value
  const byPole = {}
  for (const r of airtable.suiviRecords) {
    const pole = r['Pôle concerné'] || 'Autre'
    byPole[pole] = (byPole[pole] || 0) + (r['Participants passés'] || 0)
  }
  const vals = Object.values(byPole)
  return vals.length ? Math.max(...vals) : 0
})
const totalGlobal = computed(() => totalRegistrations.value + totalVisiteursPoles.value)

const animatedGlobal = ref(0)
function animateCounter(refVal, newVal) {
  const start = refVal.value
  const t0 = performance.now()
  function tick(now) {
    const p = Math.min((now - t0) / 700, 1)
    refVal.value = Math.round(start + (newVal - start) * (1 - Math.pow(1 - p, 3)))
    if (p < 1) requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}
watch(totalGlobal, (v) => animateCounter(animatedGlobal, v), { immediate: true })

const averageRating = computed(() => {
  const ratings = airtable.avisRecords.map(r => parseFloat(r['Note de satisfaction'] || 0)).filter(r => r > 0)
  return ratings.length ? ratings.reduce((s, r) => s + r, 0) / ratings.length : 0
})
const satisfactionPct = computed(() => {
  if (!airtable.avisRecords.length) return 0
  const good = airtable.avisRecords.filter(r => (r['Note de satisfaction'] || 0) >= 4).length
  return Math.round(good / airtable.avisRecords.length * 100)
})
const ratingDistribution = computed(() => {
  const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  for (const r of airtable.avisRecords) {
    const n = Math.round(r['Note de satisfaction'] || 0)
    if (n >= 1 && n <= 5) dist[n]++
  }
  const total = airtable.avisRecords.length || 1
  return [5, 4, 3, 2, 1].map(star => ({ star, count: dist[star], pct: Math.round(dist[star] / total * 100) }))
})
function starClass(n, avg) {
  if (n <= Math.floor(avg)) return 'full'
  if (n === Math.ceil(avg) && avg % 1 >= 0.3) return 'half'
  return ''
}
const topComments = computed(() =>
  airtable.avisRecords.map(r => r['Commentaire'] || r['Commentaires'] || '').filter(c => c.trim().length > 10).slice(0, 5)
)

// ─── Sessions ───
const summaryEntries = computed(() => {
  const items = Object.entries(airtable.sessionCounts)
    .map(([session, count]) => ({ session, count }))
    .sort((a, b) => b.count - a.count)
  const max = items.reduce((m, i) => Math.max(m, i.count), 0) || 1
  return items.map(i => ({ ...i, width: (i.count / max) * 100 }))
})

// ─── Pôles ───
const poleStats = computed(() => {
  const poles = {}
  for (const r of airtable.suiviRecords) {
    const pole = r['Pôle concerné'] || 'Autre'
    if (!poles[pole]) poles[pole] = { passés: 0, actifs: 0, contenus: 0, sessions: 0 }
    poles[pole].passés   += r['Participants passés'] || 0
    poles[pole].actifs   += r['Participants actifs'] || 0
    poles[pole].contenus += r['Contenus produits'] || 0
    poles[pole].sessions += 1
  }
  return poles
})
function poleIcon(pole) {
  if (pole.includes('Photo')) return 'camera'
  if (pole.includes('3D'))    return 'box'
  if (pole.includes('Récit')) return 'message-circle'
  return 'layers'
}

// ─── Réconciliation ───
const POLES_DEF = [
  { label: 'Pôle Photo',  icon: 'camera',        key: 'Pôle Photo'  },
  { label: 'Pôle 3D',    icon: 'box',            key: 'Pôle 3D'     },
  { label: 'Pôle Récit', icon: 'message-circle', key: 'Pôle Récit'  },
]
const reconciliation = computed(() => {
  const attendus = totalAccueil.value
  return POLES_DEF.map(({ label, icon, key }) => {
    const passés = airtable.suiviRecords
      .filter(r => r['Pôle concerné'] === key)
      .reduce((s, r) => s + (r['Participants passés'] || 0), 0)
    const ecart = passés - attendus
    return { label, icon, passés, ecart, ok: attendus > 0 && ecart === 0 }
  })
})
const reconciliationOk = computed(() =>
  totalAccueil.value > 0 && reconciliation.value.every(r => r.ok)
)

// ─── Export Excel ───
const COLS_INSCRIPTIONS = [
  { key: 'Session', label: 'Session', num: false },
  { key: 'Nombre de participants', label: 'Nombre de participants', num: true },
  { key: 'Prénom', label: 'Prénom', num: false },
  { key: 'Nom', label: 'Nom', num: false },
  { key: 'Email', label: 'Email', num: false },
  { key: 'Téléphone', label: 'Téléphone', num: false },
  { key: 'Profil', label: 'Profil', num: false },
  { key: 'Accepte contact', label: 'Accepte contact', num: false },
  { key: 'Date', label: 'Date', num: false },
]
const COLS_SUIVI = [
  { key: 'Date', label: 'Date', num: false },
  { key: 'Pôle concerné', label: 'Pôle', num: false },
  { key: 'Groupe ID', label: 'Groupe ID', num: false },
  { key: 'Groupe attribué', label: 'Couleur groupe', num: false },
  { key: 'Participants passés', label: 'Participants passés', num: true },
  { key: 'Participants actifs', label: 'Participants actifs', num: true },
  { key: 'Contenus produits', label: 'Contenus produits', num: true },
  { key: 'Observations', label: 'Observations', num: false },
]
const COLS_ACCUEIL = [
  { key: 'groupeId', label: 'Groupe ID', num: false },
  { key: 'groupe', label: 'Couleur', num: false },
  { key: 'personnes', label: 'Nombre de personnes', num: true },
  { key: 'heure', label: "Heure d'arrivée", num: false },
  { key: 'date', label: 'Date', num: false },
]
const COLS_AVIS = [
  { key: 'Date', label: 'Date', num: false },
  { key: 'Note de satisfaction', label: 'Note (/5)', num: true },
  { key: 'Commentaire', label: 'Commentaire', num: false },
  { key: 'Commentaires', label: 'Commentaires bis', num: false },
]

function downloadXLSX(rows, colDefs, sheetName, filename) {
  if (!rows.length) { alert('Aucune donnée à exporter.'); return }
  const data = [colDefs.map(c => c.label), ...rows.map(r => colDefs.map(c => { const v = r[c.key] ?? ''; return c.num ? (Number(v) || 0) : String(v) }))]
  const ws = XLSX.utils.aoa_to_sheet(data)
  ws['!cols'] = colDefs.map(c => { const max = Math.max(c.label.length, ...rows.map(r => String(r[c.key] ?? '').length)); return { wch: Math.min(max + 2, 50) } })
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, filename)
}

async function exportXLSX(type) {
  const date = new Date().toISOString().split('T')[0]
  if (type === 'inscriptions') {
    const raw = await airtable.fetchRecords('e').catch(() => [])
    downloadXLSX(raw.map(r => r.fields || {}), COLS_INSCRIPTIONS, 'Inscriptions', `inscriptions-jim2026-${date}.xlsx`)
  } else if (type === 'suivi') {
    downloadXLSX(airtable.suiviRecords, COLS_SUIVI, 'Suivi pôles', `suivi-poles-jim2026-${date}.xlsx`)
  } else if (type === 'accueil') {
    downloadXLSX(airtable.accueilRecords, COLS_ACCUEIL, 'Accueil visiteurs', `accueil-jim2026-${date}.xlsx`)
  } else if (type === 'avis') {
    downloadXLSX(airtable.avisRecords, COLS_AVIS, 'Avis visiteurs', `avis-jim2026-${date}.xlsx`)
  }
}

const reportDate = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

function printRapport() { window.print() }

async function loadAll() {
  if (airtable.isConnected) {
    await Promise.allSettled([
      airtable.loadEventRegistrations(),
      airtable.loadAvis(),
      airtable.loadSuivi(),
      airtable.loadAccueil(),
    ])
  }
}

onMounted(loadAll)
watch(() => airtable.isConnected, (connected) => { if (connected) loadAll() })
</script>

<style scoped>
.dashboard-page { display: flex; flex-direction: column; gap: 20px; }

/* ─── Titres de section ─── */
.dash-section-title {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px;
  background: linear-gradient(135deg, var(--brun), var(--or));
  border-radius: 16px;
  color: #fff;
  font-size: .8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px;
  margin-top: 8px;
}
.dash-section-title.bilan-title { background: linear-gradient(135deg, var(--rouge), var(--terre)); margin-top: 16px; }
.dst-left { display: flex; align-items: center; gap: 10px; }
.dst-date { font-size: .72rem; opacity: .85; font-weight: 600; text-transform: none; letter-spacing: .5px; }
.dst-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.dst-dot.live { background: #4caf50; box-shadow: 0 0 0 3px rgba(76,175,80,.35); animation: pulse 1.5s infinite; }

/* ─── KPIs temps réel ─── */
.rt-kpi-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.rt-kpi {
  background: rgba(255,255,255,.9); border: 1px solid rgba(132,89,54,.14);
  border-radius: 16px; padding: 16px 18px;
  display: flex; align-items: center; gap: 14px;
  box-shadow: 0 4px 16px rgba(89,55,22,.06);
}
.rt-kpi-ok { border-color: rgba(76,175,80,.35); background: rgba(76,175,80,.06); }
.rt-kpi-ok svg { color: #2e7d32 !important; }
.rt-kpi-warn { border-color: rgba(255,152,0,.35); background: rgba(255,152,0,.06); }
.rt-kpi-warn svg { color: #e65100 !important; }
.rt-kpi-val { display: block; font-size: 1.5rem; font-weight: 900; color: var(--rouge); line-height: 1; }
.rt-kpi-lbl { display: block; font-size: .65rem; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; color: #999; margin-top: 3px; }

/* ─── Grille pôles temps réel ─── */
.poles-grid-rt { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.pole-rt { background: rgba(255,255,255,.92); border-radius: 18px; overflow: hidden; border: 1px solid rgba(132,89,54,.12); box-shadow: 0 4px 16px rgba(89,55,22,.07); }
.prt-header { padding: 14px 16px; display: flex; align-items: center; gap: 10px; color: #fff; font-size: .78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
.prt-body { padding: 16px; }
.prt-current-label { font-size: .65rem; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; color: #aaa; margin-bottom: 8px; }
.prt-group {
  padding: 12px; border-radius: 12px; text-align: center;
  font-size: .84rem; font-weight: 800; text-transform: uppercase; letter-spacing: .5px;
  cursor: pointer; transition: all .2s; margin-bottom: 12px;
  border: 2px solid #e8ddd0; color: #aaa;
}
.prt-group:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,.1); }
.prt-group.rouge { background: rgba(220,53,69,.12); border-color: #dc3545; color: #dc3545; }
.prt-group.jaune { background: rgba(212,160,23,.12); border-color: #d4a017; color: #8a6600; }
.prt-group.vert  { background: rgba(40,167,69,.12);  border-color: #28a745; color: #28a745; }
.prt-hist-item { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; }
.prt-hist-badge { font-size: .68rem; font-weight: 700; padding: 2px 8px; border-radius: 99px; }
.prt-hist-badge.rouge { background: rgba(220,53,69,.15); color: #dc3545; }
.prt-hist-badge.jaune { background: rgba(212,160,23,.15); color: #8a6600; }
.prt-hist-badge.vert  { background: rgba(40,167,69,.15);  color: #28a745; }
.prt-hist-time { font-size: .68rem; color: #aaa; }

/* ─── Bloc générique ─── */
.dash-block {
  background: rgba(255,255,255,.92); border-radius: 20px;
  border: 1px solid rgba(132,89,54,.1); padding: 22px 24px;
  box-shadow: 0 4px 20px rgba(89,55,22,.06);
}
.dash-block-header { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; }
.dash-block-header h3 { margin: 0; font-size: .85rem; font-weight: 800; text-transform: uppercase; letter-spacing: .8px; color: var(--brun); flex: 1; }
.badge { padding: 3px 10px; border-radius: 99px; font-size: .68rem; font-weight: 700; background: rgba(132,89,54,.1); color: var(--brun); }
.badge-ok   { background: rgba(76,175,80,.15);   color: #2e7d32; }
.badge-warn { background: rgba(255,152,0,.15);   color: #e65100; }

/* ─── Rotation form inline ─── */
.rotation-form-inline { display: flex; align-items: flex-end; gap: 14px; flex-wrap: wrap; }
.rfi-field { flex: 1 1 160px; }
.rfi-field label { display: block; font-size: .72rem; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; color: var(--brun); margin-bottom: 6px; }
.rfi-btn { flex: 0 0 auto; padding: 12px 24px; margin-top: 0; width: auto; }

/* ─── Timeline ─── */
.rotation-timeline { display: flex; flex-direction: column; gap: 8px; }
.rt-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: rgba(132,89,54,.04); border-radius: 12px; }
.rt-time { font-size: .72rem; color: #aaa; font-weight: 600; min-width: 40px; }
.rt-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.rt-dot.rouge { background: #dc3545; }
.rt-dot.jaune { background: #d4a017; }
.rt-dot.vert  { background: #28a745; }
.rt-dot.libre { background: #aaa; }
.rt-info { display: flex; align-items: center; gap: 6px; font-size: .82rem; flex-wrap: wrap; }
.rt-pole { font-weight: 700; color: var(--brun); }
.rt-arrow { color: #aaa; }
.rt-group { font-weight: 700; }
.rt-group.rouge { color: #dc3545; }
.rt-group.jaune { color: #8a6600; }
.rt-group.vert  { color: #28a745; }
.rt-toggle { margin-top: 8px; background: none; border: 1px solid rgba(132,89,54,.2); border-radius: 10px; padding: 8px 16px; font-size: .76rem; font-weight: 700; color: var(--brun); cursor: pointer; transition: all .2s; }
.rt-toggle:hover { background: rgba(132,89,54,.06); }

/* ─── Réconciliation ─── */
.rec-accueil { display: flex; align-items: center; gap: 8px; font-size: .84rem; color: var(--brun); margin-bottom: 16px; }
.rec-accueil strong { margin-left: auto; font-size: .95rem; color: var(--rouge); }
.rec-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
.rec-pole { border-radius: 14px; padding: 14px; border: 2px solid #e8ddd0; }
.rec-ok   { border-color: rgba(76,175,80,.35);  background: rgba(76,175,80,.05); }
.rec-warn { border-color: rgba(255,152,0,.35);  background: rgba(255,152,0,.05); }
.rec-pole-header { display: flex; align-items: center; gap: 6px; font-size: .74rem; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: var(--brun); margin-bottom: 10px; }
.rec-status-ico { margin-left: auto; }
.rec-ok .rec-status-ico { color: #2e7d32; }
.rec-warn .rec-status-ico { color: #e65100; }
.rec-numbers { display: flex; align-items: center; gap: 8px; }
.rec-num { text-align: center; }
.rec-num-val { display: block; font-size: 1.3rem; font-weight: 900; color: var(--rouge); }
.rec-num-lbl { display: block; font-size: .6rem; text-transform: uppercase; color: #aaa; }
.rec-sep { font-size: 1.2rem; color: #ddd; font-weight: 300; }
.rec-ecart { margin-top: 8px; font-size: .72rem; font-weight: 700; color: #e65100; text-align: center; }

/* ─── KPI cards bilan ─── */
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.kpi-card { background: rgba(255,255,255,.92); border-radius: 18px; padding: 18px 20px; display: flex; gap: 14px; align-items: flex-start; border: 1px solid rgba(132,89,54,.1); box-shadow: 0 4px 16px rgba(89,55,22,.06); }
.kpi-main { grid-column: span 2; }
.kpi-icon { width: 44px; height: 44px; border-radius: 12px; display: grid; place-items: center; flex-shrink: 0; }
.kpi-body { display: flex; flex-direction: column; gap: 2px; }
.kpi-val { font-size: 2rem; font-weight: 900; color: var(--rouge); line-height: 1; }
.kpi-lbl { font-size: .68rem; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; color: #999; }
.kpi-sub { font-size: .62rem; color: #bbb; }

/* ─── Bars sessions ─── */
.bar-row { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid rgba(132,89,54,.06); }
.bar-row:last-child { border-bottom: none; }
.bar-label { font-size: .78rem; font-weight: 600; color: var(--brun); min-width: 160px; }
.bar-track { flex: 1; height: 8px; background: rgba(132,89,54,.1); border-radius: 4px; overflow: hidden; }
.bar-fill { height: 100%; background: linear-gradient(90deg, var(--rouge), var(--or)); border-radius: 4px; }
.bar-count { font-size: .8rem; font-weight: 800; color: var(--rouge); min-width: 28px; text-align: right; }

/* ─── Tableau pôles ─── */
.pole-table { width: 100%; border-collapse: collapse; }
.pole-table th { text-align: left; padding: 10px 14px; background: rgba(132,89,54,.06); color: var(--brun); font-size: .72rem; font-weight: 800; text-transform: uppercase; letter-spacing: .8px; }
.pole-table td { padding: 12px 14px; border-bottom: 1px solid rgba(132,89,54,.08); font-size: .85rem; }
.pole-table tbody tr:hover { background: rgba(249,178,51,.06); }
.pole-name-cell { display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--brun); }
.num-cell { font-weight: 800; color: var(--rouge); text-align: center; }

/* ─── Satisfaction ─── */
.satisfaction-row { display: flex; gap: 28px; align-items: center; flex-wrap: wrap; }
.sat-score { display: flex; flex-direction: column; align-items: center; gap: 6px; min-width: 90px; }
.sat-val { font-size: 2.8rem; font-weight: 900; color: var(--rouge); line-height: 1; }
.sat-stars { display: flex; gap: 3px; }
.sat-star { color: #ddd; }
.sat-star.full { color: var(--gold); }
.sat-star.half { color: var(--gold); opacity: .6; }
.sat-count { font-size: .7rem; color: #aaa; }
.sat-bars { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.sat-bar-row { display: flex; align-items: center; gap: 10px; }
.sat-star-lbl { font-size: .72rem; font-weight: 700; color: var(--brun); min-width: 24px; }
.sat-bar-track { flex: 1; height: 8px; background: rgba(132,89,54,.1); border-radius: 4px; overflow: hidden; }
.sat-bar-fill { height: 100%; background: linear-gradient(90deg, var(--gold), var(--or)); border-radius: 4px; }
.sat-bar-count { font-size: .72rem; font-weight: 700; color: #aaa; min-width: 18px; text-align: right; }

/* ─── Export ─── */
.export-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.export-btn { display: flex; align-items: center; gap: 14px; padding: 16px 18px; background: rgba(255,255,255,.95); border: 1.5px solid rgba(132,89,54,.18); border-radius: 16px; cursor: pointer; transition: all .2s; text-align: left; }
.export-btn:hover { border-color: var(--or); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(132,89,54,.1); }
.eb-title { font-size: .84rem; font-weight: 800; color: var(--brun); }
.eb-sub { font-size: .72rem; color: #aaa; margin-top: 2px; }
.eb-dl { margin-left: auto; color: #aaa; }

/* ─── Rapport ─── */
.btn-print { margin-left: auto; padding: 8px 16px; background: var(--brun); color: #fff; border: none; border-radius: 10px; font-size: .76rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all .2s; }
.btn-print:hover { background: var(--rouge); }
.rapport-inner { background: #fff; border-radius: 14px; border: 1px solid rgba(132,89,54,.12); overflow: hidden; }
.rapport-hero { background: linear-gradient(135deg, var(--brun), var(--or)); padding: 24px 28px; display: flex; align-items: center; gap: 20px; }
.rh-logo { width: 52px; height: 52px; background: rgba(255,255,255,.18); border-radius: 14px; display: grid; place-items: center; color: #fff; flex-shrink: 0; }
.rh-title { font-size: 1rem; font-weight: 900; color: #fff; text-transform: uppercase; letter-spacing: 1px; }
.rh-sub { font-size: .76rem; color: rgba(255,255,255,.8); margin-top: 4px; }
.rh-date { font-size: .7rem; color: rgba(255,255,255,.65); margin-top: 2px; }
.rapport-section { padding: 20px 24px; border-top: 1px solid rgba(132,89,54,.1); }
.rs-title { font-size: .72rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: var(--brun); opacity: .6; margin-bottom: 14px; }
.rapport-kpis { display: flex; flex-wrap: wrap; gap: 16px; }
.rk { min-width: 100px; }
.rk-val { display: block; font-size: 1.5rem; font-weight: 900; color: var(--rouge); }
.rk-lbl { display: block; font-size: .64rem; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; color: var(--brun); opacity: .7; margin-top: 2px; }
.rapport-table { width: 100%; border-collapse: collapse; font-size: .82rem; }
.rapport-table th { text-align: left; padding: 8px 12px; background: rgba(132,89,54,.06); color: var(--brun); font-weight: 800; font-size: .7rem; text-transform: uppercase; }
.rapport-table td { padding: 10px 12px; border-bottom: 1px solid rgba(132,89,54,.08); }
.rapport-comments { display: flex; flex-direction: column; gap: 10px; }
.rc-item { display: flex; align-items: flex-start; gap: 8px; font-size: .84rem; color: #555; padding: 10px 14px; background: rgba(249,178,51,.06); border-radius: 10px; border-left: 3px solid var(--or); }

/* ─── Empty state ─── */
.empty-inline { display: flex; align-items: center; gap: 10px; color: #aaa; font-size: .84rem; padding: 14px 0; }

/* ─── Responsive ─── */
@media (max-width: 900px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .kpi-main { grid-column: span 2; }
  .poles-grid-rt { grid-template-columns: 1fr; }
  .rec-grid { grid-template-columns: 1fr; }
  .rt-kpi-row { grid-template-columns: 1fr; }
}
@media (max-width: 580px) {
  .kpi-grid { grid-template-columns: 1fr 1fr; }
  .export-grid { grid-template-columns: 1fr; }
  .rotation-form-inline { flex-direction: column; }
  .rfi-btn { width: 100%; }
}

@media print {
  .dash-section-title, .rt-kpi-row, .poles-grid-rt, .dash-block:not(.rapport-block) { display: none !important; }
  .rapport-block { box-shadow: none; border: none; }
  .btn-print { display: none; }
}
</style>
