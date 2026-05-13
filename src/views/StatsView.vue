<template>
  <section class="stats-page">

    <!-- ─── Cartes générales ─── -->
    <div class="kpi-grid">
      <div class="kpi-card kpi-main" v-reveal="0">
        <div class="kpi-icon" style="background:rgba(177,34,42,.1);color:var(--rouge)">
          <AppIcon name="users" :size="22" />
        </div>
        <div class="kpi-body">
          <span class="kpi-val">{{ animatedGlobal }}</span>
          <span class="kpi-lbl">Total participants (global)</span>
          <span class="kpi-sub">Inscriptions + participants pôles</span>
        </div>
      </div>
      <div class="kpi-card" v-reveal="60">
        <div class="kpi-icon" style="background:rgba(132,89,54,.1);color:var(--brun)">
          <AppIcon name="file-text" :size="22" />
        </div>
        <div class="kpi-body">
          <span class="kpi-val">{{ totalRegistrations }}</span>
          <span class="kpi-lbl">Inscrits conférences</span>
        </div>
      </div>
      <div class="kpi-card" v-reveal="120">
        <div class="kpi-icon" style="background:rgba(249,178,51,.12);color:var(--or)">
          <AppIcon name="bar-chart-2" :size="22" />
        </div>
        <div class="kpi-body">
          <span class="kpi-val">{{ totalVisiteursPoles }}</span>
          <span class="kpi-lbl">Visiteurs pôles</span>
        </div>
      </div>
      <div class="kpi-card" v-reveal="180">
        <div class="kpi-icon" style="background:rgba(76,175,80,.1);color:#2e7d32">
          <AppIcon name="star" :size="22" />
        </div>
        <div class="kpi-body">
          <span class="kpi-val">{{ totalAvis }}</span>
          <span class="kpi-lbl">Avis collectés</span>
        </div>
      </div>
    </div>

    <!-- ─── Sessions & ateliers ─── -->
    <div class="stat-block" v-reveal="0">
      <div class="stat-block-header">
        <AppIcon name="file-text" :size="18" />
        <h2>Sessions &amp; ateliers</h2>
        <span class="badge">{{ totalRegistrations }} participants</span>
      </div>
      <div v-if="summaryEntries.length">
        <div
          class="bar-row"
          v-for="(entry, i) in summaryEntries"
          :key="entry.session"
          :style="{ animationDelay: `${i * 50}ms` }"
        >
          <div class="bar-label">{{ entry.session }}</div>
          <div class="bar-track">
            <div class="bar-fill" :style="{ width: `${entry.width}%` }"></div>
          </div>
          <div class="bar-count">{{ entry.count }}</div>
        </div>
      </div>
      <div class="empty-inline" v-else>
        <AppIcon name="inbox" :size="28" /> Aucune inscription enregistrée
      </div>
    </div>

    <!-- ─── Activités des pôles ─── -->
    <div class="stat-block" v-reveal="0">
      <div class="stat-block-header">
        <AppIcon name="layers" :size="18" />
        <h2>Activités des pôles</h2>
      </div>
      <div class="poles-grid" v-if="Object.keys(poleStats).length">
        <div class="pole-card" v-for="(stats, pole) in poleStats" :key="pole">
          <div class="pole-name">
            <AppIcon :name="poleIcon(pole)" :size="18" />
            {{ pole }}
          </div>
          <div class="pole-kpis">
            <div class="pole-kpi">
              <span class="pk-val">{{ stats.passés }}</span>
              <span class="pk-lbl">Passés</span>
            </div>
            <div class="pole-kpi">
              <span class="pk-val">{{ stats.actifs }}</span>
              <span class="pk-lbl">Actifs</span>
            </div>
            <div class="pole-kpi">
              <span class="pk-val">{{ stats.contenus }}</span>
              <span class="pk-lbl">Contenus</span>
            </div>
          </div>
          <div class="pole-sessions">{{ stats.sessions }} rotation{{ stats.sessions > 1 ? 's' : '' }}</div>
        </div>
      </div>
      <div class="empty-inline" v-else>
        <AppIcon name="inbox" :size="28" /> Aucune activité pôle enregistrée
      </div>
    </div>

    <!-- ─── Contrôle de cohérence Accueil ↔ Pôles ─── -->
    <div class="stat-block" v-reveal="0">
      <div class="stat-block-header">
        <AppIcon name="check-circle" :size="18" />
        <h2>Vérification des passages</h2>
        <span class="badge" :class="reconciliationOk ? 'badge-ok' : 'badge-warn'">
          {{ reconciliationOk ? 'Cohérent' : 'Écart détecté' }}
        </span>
      </div>

      <div class="rec-accueil">
        <AppIcon name="users" :size="16" />
        <span>Total enregistré à l'accueil :</span>
        <strong>{{ totalAccueil > 0 ? `${totalAccueil} personne${totalAccueil > 1 ? 's' : ''}` : 'Non renseigné' }}</strong>
      </div>

      <div class="rec-grid">
        <div
          class="rec-pole"
          v-for="item in reconciliation"
          :key="item.label"
          :class="item.ok ? 'rec-ok' : 'rec-warn'"
        >
          <div class="rec-pole-header">
            <AppIcon :name="item.icon" :size="16" />
            <span>{{ item.label }}</span>
            <AppIcon :name="item.ok ? 'check-circle' : 'alert-triangle'" :size="16" class="rec-status-ico" />
          </div>
          <div class="rec-numbers">
            <div class="rec-num">
              <span class="rec-num-val">{{ item.passés }}</span>
              <span class="rec-num-lbl">passé{{ item.passés > 1 ? 's' : '' }}</span>
            </div>
            <div class="rec-sep">/</div>
            <div class="rec-num">
              <span class="rec-num-val">{{ totalAccueil > 0 ? totalAccueil : '–' }}</span>
              <span class="rec-num-lbl">attendu{{ totalAccueil > 1 ? 's' : '' }}</span>
            </div>
          </div>
          <div class="rec-ecart" v-if="!item.ok">
            {{ item.ecart > 0 ? `+${item.ecart} en excès` : `${Math.abs(item.ecart)} manquant${Math.abs(item.ecart) > 1 ? 's' : ''}` }}
          </div>
        </div>
      </div>

      <div class="rec-note" v-if="totalAccueil === 0">
        <AppIcon name="alert-triangle" :size="14" />
        Aucun groupe enregistré à l'accueil aujourd'hui.
      </div>
    </div>

    <!-- ─── Export Excel ─── -->
    <div class="stat-block export-block" v-reveal="0">
      <div class="stat-block-header">
        <AppIcon name="download" :size="18" />
        <h2>Exporter en Excel</h2>
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

    <!-- ─── Rapport post-événement ─── -->
    <div class="stat-block rapport-block" v-reveal="0" id="rapport-print">
      <div class="stat-block-header">
        <AppIcon name="file-text" :size="18" />
        <h2>Rapport post-événement</h2>
        <button class="print-btn" @click="printRapport">
          <AppIcon name="printer" :size="15" /> Imprimer / PDF
        </button>
      </div>

      <div class="rapport-header">
        <div class="rapport-logo-row">
          <img src="/images/logo.jpeg" alt="MVG" class="rapport-logo" />
          <div>
            <div class="rapport-title">Journée Internationale des Musées 2026</div>
            <div class="rapport-subtitle">Musée Virtuel de Guinée · 16 – 18 Mai 2026</div>
            <div class="rapport-date">Rapport généré le {{ reportDate }}</div>
          </div>
        </div>
      </div>

      <div class="rapport-section">
        <div class="rs-title">Résumé général</div>
        <div class="rapport-kpis">
          <div class="rk">
            <span class="rk-val">{{ totalGlobal }}</span>
            <span class="rk-lbl">Total participants</span>
          </div>
          <div class="rk">
            <span class="rk-val">{{ totalRegistrations }}</span>
            <span class="rk-lbl">Inscrits conférences/ateliers</span>
          </div>
          <div class="rk">
            <span class="rk-val">{{ totalVisiteursPoles }}</span>
            <span class="rk-lbl">Visiteurs pôles</span>
          </div>
          <div class="rk">
            <span class="rk-val">{{ totalSuiviPassés }}</span>
            <span class="rk-lbl">Rotations aux pôles</span>
          </div>
          <div class="rk">
            <span class="rk-val">{{ totalAvis }}</span>
            <span class="rk-lbl">Avis collectés</span>
          </div>
          <div class="rk">
            <span class="rk-val">{{ averageRating.toFixed(1) }}/5</span>
            <span class="rk-lbl">Note moyenne</span>
          </div>
          <div class="rk">
            <span class="rk-val">{{ satisfactionPct }}%</span>
            <span class="rk-lbl">Taux satisfaction (≥4★)</span>
          </div>
        </div>
      </div>

      <div class="rapport-section" v-if="summaryEntries.length">
        <div class="rs-title">Top sessions</div>
        <table class="rapport-table">
          <thead><tr><th>Session</th><th>Participants</th></tr></thead>
          <tbody>
            <tr v-for="e in summaryEntries.slice(0, 5)" :key="e.session">
              <td>{{ e.session }}</td>
              <td><strong>{{ e.count }}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="rapport-section" v-if="Object.keys(poleStats).length">
        <div class="rs-title">Activité des pôles</div>
        <table class="rapport-table">
          <thead><tr><th>Pôle</th><th>Passages</th><th>Actifs</th><th>Contenus produits</th><th>Rotations</th></tr></thead>
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
        <ul class="rapport-comments">
          <li v-for="(c, i) in topComments" :key="i">"{{ c }}"</li>
        </ul>
      </div>

      <div class="rapport-footer">
        Musée Virtuel de Guinée · JIM 2026 · <em>Les musées unissent un monde divisé</em>
      </div>
    </div>

    <!-- ─── Note des visiteurs (style Play Store) ─── -->
    <div class="stat-block" v-reveal="0">
      <div class="stat-block-header">
        <AppIcon name="star" :size="18" />
        <h2>Satisfaction visiteurs</h2>
        <span class="badge">{{ totalAvis }} avis</span>
      </div>
      <div class="rating-widget" v-if="totalAvis > 0">
        <div class="rating-big">
          <span class="rating-number">{{ averageRating.toFixed(1) }}</span>
          <div class="rating-stars-big">
            <span v-for="n in 5" :key="n" class="rs" :class="starClass(n, averageRating)">
              <AppIcon name="star" :size="28" />
            </span>
          </div>
          <span class="rating-total">{{ totalAvis }} avis</span>
        </div>
        <div class="rating-bars">
          <div class="rbar-row" v-for="row in ratingDistribution" :key="row.star">
            <span class="rbar-lbl">{{ row.star }}</span>
            <AppIcon name="star" :size="12" style="color:var(--gold);flex-shrink:0" />
            <div class="rbar-track">
              <div class="rbar-fill" :style="{ width: `${row.pct}%` }"></div>
            </div>
            <span class="rbar-count">{{ row.count }}</span>
          </div>
        </div>
      </div>
      <div class="empty-inline" v-else>
        <AppIcon name="inbox" :size="28" /> Aucun avis collecté
      </div>
    </div>

  </section>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { useAirtableStore } from '../store/airtable'
import AppIcon from '../components/AppIcon.vue'
import * as XLSX from 'xlsx'

const airtable = useAirtableStore()

// ─── KPI généraux ───
const totalRegistrations = computed(() => airtable.totalRegistrations)
const sessionCount = computed(() => Object.keys(airtable.sessionCounts).length)
const totalAvis = computed(() => airtable.avisRecords.length)
const averageRating = computed(() => {
  const ratings = airtable.avisRecords.map(r => parseFloat(r['Note de satisfaction'] || 0)).filter(r => r > 0)
  return ratings.length ? ratings.reduce((s, r) => s + r, 0) / ratings.length : 0
})
const totalSuiviPassés = computed(() =>
  airtable.suiviRecords.reduce((s, r) => s + (r['Participants passés'] || 0), 0)
)

// totalAccueil (toutes dates) → référence si l'accueil a été renseigné
const totalAccueil = computed(() =>
  airtable.accueilRecords.reduce((s, r) => s + (r.personnes || 0), 0)
)

// Visiteurs pôles uniques :
// - Si l'accueil est renseigné → on l'utilise (source fiable)
// - Sinon → max des passés par pôle dans le suivi (même groupe, toutes rotations confondues)
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

// Total global = inscriptions (ateliers/conférences) + visiteurs pôles uniques
const totalGlobal = computed(() => totalRegistrations.value + totalVisiteursPoles.value)

// ─── Compteurs animés ───
const animatedTotal = ref(0)
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

watch(totalRegistrations, (v) => animateCounter(animatedTotal, v), { immediate: true })
watch(totalGlobal, (v) => animateCounter(animatedGlobal, v), { immediate: true })

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
    poles[pole].passés  += r['Participants passés'] || 0
    poles[pole].actifs  += r['Participants actifs'] || 0
    poles[pole].contenus += r['Contenus produits'] || 0
    poles[pole].sessions += 1
  }
  return poles
})

function poleIcon(pole) {
  if (pole.includes('Photo'))   return 'camera'
  if (pole.includes('3D'))      return 'box'
  if (pole.includes('Récit'))   return 'message-circle'
  if (pole.includes('Musique')) return 'music'
  return 'layers'
}

// ─── Distribution des notes (Play Store) ───
const ratingDistribution = computed(() => {
  const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  for (const r of airtable.avisRecords) {
    const n = Math.round(r['Note de satisfaction'] || 0)
    if (n >= 1 && n <= 5) dist[n]++
  }
  const total = airtable.avisRecords.length || 1
  return [5, 4, 3, 2, 1].map(star => ({
    star,
    count: dist[star],
    pct: Math.round(dist[star] / total * 100)
  }))
})

function starClass(n, avg) {
  if (n <= Math.floor(avg)) return 'full'
  if (n === Math.ceil(avg) && avg % 1 >= 0.3) return 'half'
  return ''
}

// ─── Rapport ───
const reportDate = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

const satisfactionPct = computed(() => {
  if (!airtable.avisRecords.length) return 0
  const good = airtable.avisRecords.filter(r => (r['Note de satisfaction'] || 0) >= 4).length
  return Math.round(good / airtable.avisRecords.length * 100)
})

const topComments = computed(() =>
  airtable.avisRecords
    .map(r => r['Commentaire'] || r['Commentaires'] || '')
    .filter(c => c.trim().length > 10)
    .slice(0, 5)
)

function printRapport() {
  window.print()
}

// ─── Export Excel ───
function downloadXLSX(rows, colDefs, sheetName, filename) {
  if (!rows.length) {
    alert('Aucune donnée à exporter.')
    return
  }
  const data = [
    colDefs.map(c => c.label),
    ...rows.map(r => colDefs.map(c => {
      const v = r[c.key] ?? ''
      return c.num ? (Number(v) || 0) : String(v)
    }))
  ]
  const ws = XLSX.utils.aoa_to_sheet(data)

  ws['!cols'] = colDefs.map(c => {
    const max = Math.max(
      c.label.length,
      ...rows.map(r => String(r[c.key] ?? '').length)
    )
    return { wch: Math.min(max + 2, 50) }
  })

  const range = XLSX.utils.decode_range(ws['!ref'])
  for (let C = range.s.c; C <= range.e.c; C++) {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })]
    if (cell) cell.s = { font: { bold: true } }
  }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, filename)
}

const COLS_INSCRIPTIONS = [
  { key: 'Session',                   label: 'Session',                   num: false },
  { key: 'Nombre de participants',    label: 'Nombre de participants',    num: true  },
  { key: 'Prénom',                    label: 'Prénom',                    num: false },
  { key: 'Nom',                       label: 'Nom',                       num: false },
  { key: 'Email',                     label: 'Email',                     num: false },
  { key: 'Téléphone',                 label: 'Téléphone',                 num: false },
  { key: 'Profil',                    label: 'Profil',                    num: false },
  { key: 'Accepte contact',           label: 'Accepte contact',           num: false },
  { key: 'Date',                      label: 'Date',                      num: false },
]

const COLS_SUIVI = [
  { key: 'Date',                   label: 'Date',                    num: false },
  { key: 'Pôle concerné',         label: 'Pôle',                    num: false },
  { key: 'Groupe ID',             label: 'Groupe ID',               num: false },
  { key: 'Groupe attribué',      label: 'Couleur groupe',          num: false },
  { key: 'Participants passés',  label: 'Participants passés',    num: true  },
  { key: 'Participants actifs',   label: 'Participants actifs',    num: true  },
  { key: 'Contenus produits',     label: 'Contenus produits',      num: true  },
  { key: 'Observations',          label: 'Observations',           num: false },
]

const COLS_ACCUEIL = [
  { key: 'groupeId',  label: 'Groupe ID',           num: false },
  { key: 'groupe',    label: 'Couleur',              num: false },
  { key: 'personnes', label: 'Nombre de personnes', num: true  },
  { key: 'heure',     label: "Heure d'arrivée",     num: false },
  { key: 'date',      label: 'Date',                 num: false },
]

const COLS_AVIS = [
  { key: 'Date',                 label: 'Date',            num: false },
  { key: 'Note de satisfaction', label: 'Note (/5)',        num: true  },
  { key: 'Commentaire',         label: 'Commentaire',      num: false },
  { key: 'Commentaires',        label: 'Commentaires bis', num: false },
]

async function exportXLSX(type) {
  const date = new Date().toISOString().split('T')[0]
  if (type === 'inscriptions') {
    const raw = await airtable.fetchRecords('e').catch(() => [])
    const rows = raw.map(r => r.fields || {})
    downloadXLSX(rows, COLS_INSCRIPTIONS, 'Inscriptions', `inscriptions-jim2026-${date}.xlsx`)
  } else if (type === 'suivi') {
    downloadXLSX(airtable.suiviRecords, COLS_SUIVI, 'Suivi pôles', `suivi-poles-jim2026-${date}.xlsx`)
  } else if (type === 'accueil') {
    downloadXLSX(airtable.accueilRecords, COLS_ACCUEIL, 'Accueil visiteurs', `accueil-jim2026-${date}.xlsx`)
  } else if (type === 'avis') {
    downloadXLSX(airtable.avisRecords, COLS_AVIS, 'Avis visiteurs', `avis-jim2026-${date}.xlsx`)
  }
}

const POLES_DEF = [
  { label: 'Pôle Photo',   icon: 'camera',         key: 'Pôle Photo'   },
  { label: 'Pôle 3D',     icon: 'box',             key: 'Pôle 3D'      },
  { label: 'Pôle Récit',  icon: 'message-circle',  key: 'Pôle Récit'   },
  { label: 'Pôle Musique',icon: 'music',            key: 'Pôle Musique' },
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
/* ─── KPI cards ─── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}
@media (min-width: 640px) { .kpi-grid { grid-template-columns: repeat(4, 1fr); } }

.kpi-card {
  background: rgba(255,255,255,.92);
  border: 1px solid rgba(132,89,54,.12);
  border-radius: 18px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 4px 14px rgba(132,89,54,.06);
  transition: transform .22s ease, box-shadow .22s ease;
}
.kpi-card:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(132,89,54,.1); }
.kpi-main { border-color: rgba(177,34,42,.2); background: rgba(177,34,42,.04); }

.kpi-icon {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.kpi-body { display: flex; flex-direction: column; }
.kpi-val { font-size: 1.6rem; font-weight: 900; color: var(--brun); line-height: 1; }
.kpi-lbl { font-size: .7rem; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; color: #999; margin-top: 3px; }
.kpi-sub { font-size: .65rem; color: #bbb; margin-top: 1px; }

/* ─── Stat blocks ─── */
.stat-block {
  background: rgba(255,255,255,.92);
  border: 1px solid rgba(132,89,54,.12);
  border-radius: 20px;
  padding: 22px 24px;
  margin-bottom: 16px;
  box-shadow: 0 4px 14px rgba(132,89,54,.06);
}

.stat-block-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
  color: var(--brun);
}
.stat-block-header h2 {
  font-size: .95rem;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0;
  flex: 1;
}
.badge {
  background: rgba(132,89,54,.1);
  color: var(--brun);
  font-size: .7rem;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 999px;
}

/* ─── Barres sessions ─── */
.bar-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  animation: fadeUp .4s ease-out backwards;
}
.bar-label {
  font-size: .82rem;
  font-weight: 600;
  color: var(--brun);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bar-track {
  width: 120px;
  height: 8px;
  background: rgba(132,89,54,.1);
  border-radius: 4px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--brun), var(--or));
  border-radius: 4px;
  transition: width .8s cubic-bezier(.22,1,.36,1);
}
.bar-count {
  font-size: .82rem;
  font-weight: 900;
  color: var(--or);
  min-width: 28px;
  text-align: right;
}

/* ─── Pôles ─── */
.poles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px;
}
.pole-card {
  background: rgba(132,89,54,.04);
  border: 1px solid rgba(132,89,54,.14);
  border-radius: 16px;
  padding: 16px;
}
.pole-name {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: .82rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: var(--brun);
  margin-bottom: 12px;
}
.pole-kpis {
  display: flex;
  gap: 10px;
  margin-bottom: 8px;
}
.pole-kpi { display: flex; flex-direction: column; align-items: center; flex: 1; }
.pk-val { font-size: 1.3rem; font-weight: 900; color: var(--rouge); line-height: 1; }
.pk-lbl { font-size: .65rem; text-transform: uppercase; color: #999; margin-top: 2px; }
.pole-sessions { font-size: .72rem; color: #bbb; text-align: right; }

/* ─── Rating Play Store ─── */
.rating-widget {
  display: flex;
  gap: 28px;
  align-items: center;
  flex-wrap: wrap;
}
.rating-big {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 90px;
}
.rating-number {
  font-size: 3rem;
  font-weight: 900;
  color: var(--brun);
  line-height: 1;
}
.rating-stars-big {
  display: flex;
  gap: 3px;
}
.rs { color: #e0d4c4; transition: color .15s; }
.rs.full { color: var(--gold); }
.rs.half { color: var(--gold); opacity: .55; }
.rating-total { font-size: .75rem; color: #999; }

.rating-bars { flex: 1; min-width: 160px; }
.rbar-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}
.rbar-lbl { font-size: .78rem; font-weight: 700; color: var(--brun); width: 12px; text-align: right; }
.rbar-track {
  flex: 1;
  height: 8px;
  background: rgba(132,89,54,.1);
  border-radius: 4px;
  overflow: hidden;
}
.rbar-fill {
  height: 100%;
  background: var(--gold);
  border-radius: 4px;
  transition: width .8s cubic-bezier(.22,1,.36,1);
}
.rbar-count { font-size: .72rem; color: #999; width: 20px; text-align: right; }

/* ─── Empty ─── */
.empty-inline {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #bbb;
  font-size: .88rem;
  padding: 12px 0;
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ─── Rapport ─── */
.rapport-block { border: 2px solid rgba(132,89,54,.18); }
.print-btn {
  margin-left: auto;
  display: flex; align-items: center; gap: 6px;
  background: linear-gradient(135deg, var(--brun), var(--or));
  color: #fff; border: none; border-radius: 999px;
  padding: 8px 16px; font-size: .78rem; font-weight: 700;
  cursor: pointer; transition: all .25s ease;
}
.print-btn:hover { transform: translateY(-1px); filter: brightness(1.06); }

.rapport-header {
  background: linear-gradient(135deg, #5c3519, #8f5b2c);
  border-radius: 14px; padding: 20px 22px; margin-bottom: 20px;
}
.rapport-logo-row { display: flex; align-items: center; gap: 16px; }
.rapport-logo { width: 52px; height: 52px; border-radius: 50%; object-fit: cover; border: 2px solid rgba(255,255,255,.3); }
.rapport-title { font-size: 1rem; font-weight: 900; color: #fff; text-transform: uppercase; letter-spacing: 1px; }
.rapport-subtitle { font-size: .78rem; color: rgba(255,255,255,.8); margin-top: 3px; }
.rapport-date { font-size: .7rem; color: rgba(255,255,255,.55); margin-top: 4px; }

.rapport-section { margin-bottom: 22px; }
.rs-title {
  font-size: .72rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 1.5px; color: var(--or); margin-bottom: 12px;
  padding-bottom: 6px; border-bottom: 1px solid #e8ddd0;
}
.rapport-kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.rk {
  background: rgba(132,89,54,.06); border: 1px solid rgba(132,89,54,.12);
  border-radius: 12px; padding: 14px 16px;
  display: flex; flex-direction: column; gap: 4px;
}
.rk-val { font-size: 1.5rem; font-weight: 900; color: var(--rouge); }
.rk-lbl { font-size: .7rem; font-weight: 600; text-transform: uppercase; letter-spacing: .5px; color: var(--brun); opacity: .7; }

.rapport-table { width: 100%; border-collapse: collapse; font-size: .84rem; }
.rapport-table th, .rapport-table td { padding: 10px 12px; border-bottom: 1px solid #e8ddd0; text-align: left; }
.rapport-table thead th { background: rgba(132,89,54,.06); font-weight: 700; color: var(--brun); font-size: .75rem; text-transform: uppercase; letter-spacing: .5px; }
.rapport-table tbody tr:hover { background: rgba(249,178,51,.06); }

.rapport-comments { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.rapport-comments li {
  padding: 10px 14px; background: rgba(132,89,54,.04);
  border-left: 3px solid var(--or); border-radius: 0 10px 10px 0;
  font-size: .84rem; color: #555; font-style: italic;
}

.rapport-footer {
  text-align: center; padding-top: 16px; margin-top: 16px;
  border-top: 1px solid #e8ddd0;
  font-size: .7rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 1.2px; color: var(--brun); opacity: .5;
}
.rapport-footer em { color: var(--rouge); font-style: normal; }

@media print {
  body * { visibility: hidden !important; }
  #rapport-print, #rapport-print * { visibility: visible !important; }
  #rapport-print { position: fixed; top: 0; left: 0; width: 100%; }
  .print-btn { display: none !important; }
}

/* ─── Export ─── */
.export-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}
.export-btn {
  display: flex; align-items: center; gap: 14px;
  padding: 16px 18px;
  background: rgba(255,255,255,.95);
  border: 2px solid #e8ddd0; border-radius: 16px;
  cursor: pointer; transition: all .25s ease;
  text-align: left; color: var(--brun);
}
.export-btn:hover {
  border-color: var(--or);
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(132,89,54,.12);
}
.eb-title { font-size: .88rem; font-weight: 700; }
.eb-sub   { font-size: .74rem; color: #999; margin-top: 2px; }
.eb-dl    { margin-left: auto; color: var(--or); flex-shrink: 0; }

/* ─── Contrôle de cohérence ─── */
.badge-ok   { background: rgba(40,167,69,.12); color: #28a745; }
.badge-warn { background: rgba(220,53,69,.1);  color: #dc3545; }

.rec-accueil {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 18px;
  background: rgba(132,89,54,.05);
  border: 1.5px solid #e8ddd0;
  border-radius: 14px;
  margin-bottom: 16px;
  font-size: .9rem; color: var(--brun);
}
.rec-accueil strong { margin-left: auto; font-size: 1.1rem; font-weight: 900; }

.rec-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
@media (max-width: 680px) { .rec-grid { grid-template-columns: 1fr; } }

.rec-pole {
  padding: 16px;
  border-radius: 16px;
  border: 2px solid;
  transition: box-shadow .2s;
}
.rec-ok   { border-color: #28a745; background: rgba(40,167,69,.05); }
.rec-warn { border-color: #dc3545; background: rgba(220,53,69,.05); }

.rec-pole-header {
  display: flex; align-items: center; gap: 8px;
  font-size: .82rem; font-weight: 800;
  text-transform: uppercase; letter-spacing: .6px;
  margin-bottom: 14px;
  color: var(--brun);
}
.rec-status-ico { margin-left: auto; }
.rec-ok   .rec-status-ico { color: #28a745; }
.rec-warn .rec-status-ico { color: #dc3545; }

.rec-numbers {
  display: flex; align-items: center; justify-content: center;
  gap: 10px;
}
.rec-num { display: flex; flex-direction: column; align-items: center; }
.rec-num-val { font-size: 1.6rem; font-weight: 900; line-height: 1; }
.rec-num-lbl { font-size: .66rem; color: #aaa; margin-top: 2px; text-transform: uppercase; letter-spacing: .5px; }
.rec-ok  .rec-num-val { color: #28a745; }
.rec-warn .rec-num-val { color: #dc3545; }
.rec-sep { font-size: 1.4rem; color: #ccc; font-weight: 300; }

.rec-ecart {
  margin-top: 12px;
  text-align: center;
  font-size: .75rem; font-weight: 700;
  color: #dc3545;
  background: rgba(220,53,69,.08);
  border-radius: 999px;
  padding: 4px 10px;
}

.rec-note {
  display: flex; align-items: center; gap: 8px;
  margin-top: 12px;
  font-size: .8rem; color: #aaa;
}
</style>
