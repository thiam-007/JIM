<template>
  <section class="rotations-page">
    <div class="form-card">
      <div class="fh fh-v">
        <div class="fh-icon"><AppIcon name="refresh-cw" :size="26" /></div>
        <div class="fh-title">État des pôles en temps réel</div>
        <div class="fh-sub">
          Mis à jour automatiquement · dernière sync
          <span class="sync-time" v-if="lastSync">
            {{ lastSync.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }}
          </span>
          <span v-else>—</span>
        </div>
      </div>

      <div class="fb">

        <!-- Grille des pôles -->
        <div class="poles-grid-rot" v-reveal="0">
          <div class="pole-slot" v-for="pole in poles" :key="pole.key">
            <div class="ps-header" :style="{ background: pole.color }">
              <AppIcon :name="pole.icon" :size="22" />
              <span>{{ pole.label }}</span>
            </div>
            <div class="ps-body">
              <template v-if="airtable.rotationStatus[pole.key]">
                <div class="ps-status occupied">
                  <span class="ps-occ-dot" :class="airtable.rotationStatus[pole.key].groupe.toLowerCase()"></span>
                  <div class="ps-occ-info">
                    <span class="ps-occ-label">En cours</span>
                    <span class="ps-occ-id">{{ airtable.rotationStatus[pole.key].groupeId }}</span>
                    <span class="ps-occ-groupe">Groupe {{ airtable.rotationStatus[pole.key].groupe }}</span>
                    <span class="ps-occ-pax" v-if="getPax(airtable.rotationStatus[pole.key].groupeId)">
                      {{ getPax(airtable.rotationStatus[pole.key].groupeId) }} pers.
                    </span>
                  </div>
                </div>
              </template>
              <template v-else>
                <div class="ps-status libre">
                  <AppIcon name="check-circle" :size="20" />
                  <span>Libre</span>
                </div>
              </template>

              <!-- Derniers groupes passés -->
              <div class="ps-history" v-if="historyForPole(pole.key).length">
                <div class="ps-hist-label">Derniers passages</div>
                <div class="ps-hist-list">
                  <div class="ps-hist-item" v-for="(h, i) in historyForPole(pole.key)" :key="i">
                    <span class="ph-badge" :class="h.groupe.toLowerCase()">{{ h.groupeId }}</span>
                    <span class="ph-time">{{ formatTime(h.createdTime) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Légende -->
        <div class="groups-legend" v-reveal="60">
          <div class="gl-item">
            <span class="gl-dot" style="background:#28a745"></span>Pôle libre
          </div>
          <div class="gl-item rouge"><span class="gl-dot"></span>Groupe Rouge</div>
          <div class="gl-item jaune"><span class="gl-dot"></span>Groupe Jaune</div>
          <div class="gl-item vert"><span class="gl-dot"></span>Groupe Vert</div>
        </div>

        <!-- Timeline des passages du jour -->
        <template v-if="airtable.rotationHistory.length">
          <div class="sd" v-reveal="80">
            <div class="sl"></div><span>Historique des passages du jour</span>
            <div class="sl" style="background:linear-gradient(90deg,transparent,var(--or))"></div>
          </div>
          <div class="rotation-timeline" v-reveal="100">
            <div class="rt-item" v-for="(r, i) in visibleHistory" :key="i">
              <div class="rt-time">{{ formatTime(r.createdTime) }}</div>
              <div class="rt-dot" :class="r.groupe.toLowerCase()"></div>
              <div class="rt-info">
                <span class="rt-pole">{{ r.pole }}</span>
                <span class="rt-arrow">·</span>
                <span class="rt-id">{{ r.groupeId }}</span>
                <span class="rt-arrow">·</span>
                <span class="rt-group" :class="r.groupe.toLowerCase()">Groupe {{ r.groupe }}</span>
              </div>
            </div>
            <button v-if="airtable.rotationHistory.length > PAGE_SIZE" class="rt-toggle" @click="showAll = !showAll">
              {{ showAll ? 'Réduire' : `Voir les ${airtable.rotationHistory.length - PAGE_SIZE} précédents` }}
            </button>
          </div>
        </template>
        <div class="empty-rot" v-else v-reveal="80">
          <AppIcon name="clock" :size="32" />
          <p>Aucun groupe n'a encore terminé un pôle aujourd'hui</p>
        </div>

      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAirtableStore } from '../store/airtable'
import AppIcon from '../components/AppIcon.vue'

const airtable = useAirtableStore()
const PAGE_SIZE = 8
const showAll = ref(false)
const lastSync = ref(null)
let pollTimer = null

const poles = [
  { key: 'photo', label: 'Pôle Photo',  icon: 'camera',         color: 'linear-gradient(135deg,#b1222a,#8c3b2a)' },
  { key: '3d',    label: 'Pôle 3D',     icon: 'box',            color: 'linear-gradient(135deg,#593716,#845936)' },
  { key: 'recit', label: 'Pôle Récit',  icon: 'message-circle', color: 'linear-gradient(135deg,#1a3a2a,#2d6a4a)' },
]

function historyForPole(poleKey) {
  return airtable.rotationHistory.filter(r => r.poleKey === poleKey).slice(0, 3)
}

function getPax(groupeId) {
  const found = airtable.accueilRecords.find(r => r.groupeId === groupeId)
  return found?.personnes || null
}

function formatTime(isoString) {
  if (!isoString) return ''
  return new Date(isoString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

const visibleHistory = computed(() =>
  showAll.value
    ? airtable.rotationHistory
    : airtable.rotationHistory.slice(0, PAGE_SIZE)
)

async function refresh() {
  await Promise.all([airtable.loadRotationStatus(), airtable.loadAccueil()])
  lastSync.value = new Date()
}

onMounted(async () => {
  await refresh()
  pollTimer = setInterval(refresh, 30_000)
})

onUnmounted(() => clearInterval(pollTimer))
</script>

<style scoped>
.rotations-page { display: flex; flex-direction: column; gap: 24px; }

.sync-time {
  font-weight: 700; color: var(--brun);
  font-variant-numeric: tabular-nums;
}

/* Grille pôles */
.poles-grid-rot { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 8px; }
@media (max-width: 680px) { .poles-grid-rot { grid-template-columns: 1fr; } }

.pole-slot { border-radius: 18px; overflow: hidden; border: 1px solid rgba(132,89,54,.14); background: #fff; box-shadow: 0 4px 16px rgba(89,55,22,.08); }
.ps-header { display: flex; align-items: center; gap: 10px; padding: 14px 18px; color: #fff; font-weight: 800; font-size: .88rem; text-transform: uppercase; letter-spacing: .8px; }
.ps-body { padding: 16px; display: flex; flex-direction: column; gap: 14px; }

/* Statut libre */
.ps-status {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 16px; border-radius: 14px;
  font-weight: 700; font-size: .9rem;
}
.ps-status.libre {
  background: rgba(40,167,69,.08);
  border: 2px solid rgba(40,167,69,.35);
  color: #28a745;
}

/* Statut occupé */
.ps-status.occupied {
  background: rgba(132,89,54,.06);
  border: 2px solid rgba(132,89,54,.2);
  align-items: flex-start;
}
.ps-occ-dot {
  width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0; margin-top: 3px;
}
.ps-occ-dot.rouge { background: #dc3545; box-shadow: 0 0 0 3px rgba(220,53,69,.2); }
.ps-occ-dot.jaune { background: #d4a017; box-shadow: 0 0 0 3px rgba(212,160,23,.2); }
.ps-occ-dot.vert  { background: #28a745; box-shadow: 0 0 0 3px rgba(40,167,69,.2); }
.ps-occ-info { display: flex; flex-direction: column; gap: 2px; }
.ps-occ-label {
  font-size: .62rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: 1.5px; color: #aaa;
}
.ps-occ-id {
  font-size: 1.1rem; font-weight: 900; color: var(--brun);
  font-family: monospace; letter-spacing: 1px;
}
.ps-occ-groupe { font-size: .78rem; font-weight: 700; color: #666; }
.ps-occ-pax { font-size: .72rem; color: #aaa; }

/* Historique par pôle */
.ps-hist-label { font-size: .65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #ccc; margin-bottom: 6px; }
.ps-hist-list { display: flex; flex-direction: column; gap: 5px; }
.ps-hist-item { display: flex; align-items: center; gap: 8px; }
.ph-badge { font-size: .7rem; font-weight: 800; padding: 3px 9px; border-radius: 999px; font-family: monospace; }
.ph-badge.rouge { background: rgba(220,53,69,.12); color: #dc3545; }
.ph-badge.jaune { background: rgba(212,160,23,.12); color: #8a6600; }
.ph-badge.vert  { background: rgba(40,167,69,.12);  color: #28a745; }
.ph-time { font-size: .7rem; color: #bbb; }

/* Légende */
.groups-legend { display: flex; gap: 16px; flex-wrap: wrap; }
.gl-item { display: flex; align-items: center; gap: 8px; font-size: .82rem; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; }
.gl-dot { width: 12px; height: 12px; border-radius: 50%; }
.rouge .gl-dot { background: #dc3545; }
.jaune .gl-dot { background: #d4a017; }
.vert  .gl-dot { background: #28a745; }

/* Timeline globale */
.rotation-timeline { display: flex; flex-direction: column; gap: 10px; }
.rt-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: rgba(255,255,255,.95); border: 1px solid #e8ddd0; border-radius: 12px; }
.rt-time { font-size: .72rem; font-weight: 700; color: #aaa; min-width: 42px; font-variant-numeric: tabular-nums; }
.rt-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.rt-dot.rouge { background: #dc3545; }
.rt-dot.jaune { background: #d4a017; }
.rt-dot.vert  { background: #28a745; }
.rt-info { display: flex; align-items: center; gap: 6px; font-size: .84rem; flex-wrap: wrap; }
.rt-pole { font-weight: 700; color: var(--brun); }
.rt-id { font-weight: 800; font-family: monospace; color: var(--brun); }
.rt-arrow { color: #ddd; }
.rt-group { font-weight: 700; }
.rt-group.rouge { color: #dc3545; }
.rt-group.jaune { color: #8a6600; }
.rt-group.vert  { color: #28a745; }

.empty-rot { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 32px; color: #ccc; text-align: center; }
.empty-rot p { margin: 0; font-size: .88rem; }

.rt-toggle {
  align-self: center; margin-top: 4px;
  background: none; border: 1px solid #e8ddd0; border-radius: 999px;
  padding: 6px 18px; font-size: .75rem; font-weight: 700; color: var(--brun);
  cursor: pointer; transition: all .2s ease;
}
.rt-toggle:hover { background: rgba(132,89,54,.08); border-color: var(--brun); }
</style>
