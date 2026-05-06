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
          <span class="kpi-sub">Conférences + pôles</span>
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
          <span class="kpi-val">{{ totalSuiviPassés }}</span>
          <span class="kpi-lbl">Passages aux pôles</span>
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

    <!-- ─── Export CSV ─── -->
    <div class="stat-block export-block" v-reveal="0">
      <div class="stat-block-header">
        <AppIcon name="download" :size="18" />
        <h2>Exporter les données</h2>
      </div>
      <div class="export-grid">
        <button class="export-btn" @click="exportCSV('inscriptions')">
          <AppIcon name="file-text" :size="18" />
          <div>
            <div class="eb-title">Inscriptions</div>
            <div class="eb-sub">{{ totalRegistrations }} enregistrements</div>
          </div>
          <AppIcon name="download" :size="16" class="eb-dl" />
        </button>
        <button class="export-btn" @click="exportCSV('suivi')">
          <AppIcon name="bar-chart" :size="18" />
          <div>
            <div class="eb-title">Suivi pôles</div>
            <div class="eb-sub">{{ airtable.suiviRecords.length }} enregistrements</div>
          </div>
          <AppIcon name="download" :size="16" class="eb-dl" />
        </button>
        <button class="export-btn" @click="exportCSV('avis')">
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
            <span class="rk-val">{{ totalRegistrations }}</span>
            <span class="rk-lbl">Inscrits conférences</span>
          </div>
          <div class="rk">
            <span class="rk-val">{{ totalSuiviPassés }}</span>
            <span class="rk-lbl">Passages aux pôles</span>
          </div>
          <div class="rk">
            <span class="rk-val">{{ totalGlobal }}</span>
            <span class="rk-lbl">Total participants</span>
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
const totalGlobal = computed(() => totalRegistrations.value + totalSuiviPassés.value)

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
  if (pole.includes('Photo')) return 'camera'
  if (pole.includes('3D'))    return 'box'
  if (pole.includes('Récit')) return 'message-circle'
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

// ─── Export CSV ───
function toCSV(rows) {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const escape  = v => `"${String(v ?? '').replace(/"/g, '""')}"`
  return [headers.map(escape).join(','), ...rows.map(r => headers.map(k => escape(r[k])).join(','))].join('\n')
}

function downloadCSV(content, filename) {
  const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function exportCSV(type) {
  const date = new Date().toISOString().split('T')[0]
  if (type === 'inscriptions') {
    const rows = airtable.eventRecords.map(r => r.fields || r)
    downloadCSV(toCSV(rows.length ? rows : airtable.eventRegistrations), `inscriptions-jim2026-${date}.csv`)
  } else if (type === 'suivi') {
    downloadCSV(toCSV(airtable.suiviRecords), `suivi-poles-jim2026-${date}.csv`)
  } else if (type === 'avis') {
    downloadCSV(toCSV(airtable.avisRecords), `avis-visiteurs-jim2026-${date}.csv`)
  }
}

async function loadAll() {
  if (airtable.isConnected) {
    await Promise.allSettled([
      airtable.loadEventRegistrations(),
      airtable.loadAvis(),
      airtable.loadSuivi()
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
</style>
