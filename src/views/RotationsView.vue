<template>
  <section class="rotations-page">
    <div class="form-card">
      <div class="fh fh-v">
        <div class="fh-icon"><AppIcon name="refresh-cw" :size="26" /></div>
        <div class="fh-title">Planning des rotations</div>
        <div class="fh-sub">Visualisez en temps réel quel groupe est dans quel pôle</div>
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
              <div class="ps-current">
                <div class="ps-label">Groupe actuel</div>
                <div class="ps-group" :class="currentGroup(pole.key)?.color || 'libre'">
                  <template v-if="currentGroup(pole.key)">
                    <span class="ps-group-id">{{ currentGroup(pole.key).id }}</span>
                    <span class="ps-group-color">{{ currentGroup(pole.key).color }}</span>
                  </template>
                  <span v-else class="ps-empty">— Libre —</span>
                </div>
                <button v-if="currentGroup(pole.key)" class="ps-liberer" @click="libererPole(pole.key)">
                  <AppIcon name="x" :size="12" /> Libérer
                </button>
              </div>
              <div class="ps-history" v-if="rot.history[pole.key]?.length">
                <div class="ps-label">Dernières rotations</div>
                <div class="ps-hist-list">
                  <div
                    class="ps-hist-item"
                    v-for="(h, i) in rot.history[pole.key].slice(-3).reverse()"
                    :key="i"
                  >
                    <span class="ph-badge" :class="h.groupColor">{{ h.groupId || 'Libre' }}</span>
                    <span class="ph-time">{{ h.time }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Section rotation manuelle -->
        <div class="sd" v-reveal="80">
          <div class="sl"></div><span>Enregistrer une rotation</span>
          <div class="sl" style="background:linear-gradient(90deg,transparent,var(--or))"></div>
        </div>

        <div class="rotation-form" v-reveal="100">
          <div class="fr">
            <div class="fg">
              <label>Pôle <span class="req">*</span></label>
              <select v-model="newRotation.pole">
                <option value="">— Sélectionner —</option>
                <option v-for="p in poles" :key="p.key" :value="p.key">{{ p.label }}</option>
              </select>
            </div>
            <div class="fg">
              <label>Groupe entrant <span class="req">*</span></label>
              <select v-if="accueilGroups.length" v-model="newRotation.groupId">
                <option value="">— Sélectionner —</option>
                <option
                  v-for="g in accueilGroups"
                  :key="g.groupeId"
                  :value="g.groupeId"
                >{{ g.groupeId }} · {{ g.groupe }} ({{ g.personnes }} pers.)</option>
                <option value="libre">— Libérer le pôle —</option>
              </select>
              <div v-else class="gp-state gp-empty" style="margin-top:6px">
                <AppIcon name="inbox" :size="16" /> Aucun groupe enregistré à l'accueil
              </div>
            </div>
          </div>
          <button class="bsub bsub-v" @click="registerRotation" :disabled="!newRotation.pole || !newRotation.groupId">
            <AppIcon name="refresh-cw" :size="18" />
            Enregistrer la rotation
          </button>
        </div>

        <!-- Timeline des rotations -->
        <div class="sd" v-reveal="120" v-if="rot.allRotations.length">
          <div class="sl"></div><span>Historique du jour</span>
          <div class="sl" style="background:linear-gradient(90deg,transparent,var(--or))"></div>
        </div>

        <div class="rotation-timeline" v-if="rot.allRotations.length" v-reveal="140">
          <div class="rt-item" v-for="(r, i) in rot.visibleRotations" :key="i">
            <div class="rt-time">{{ r.time }}</div>
            <div class="rt-dot" :class="r.groupColor"></div>
            <div class="rt-info">
              <span class="rt-pole">{{ poleLabel(r.pole) }}</span>
              <span class="rt-arrow">→</span>
              <span class="rt-group" :class="r.groupColor">
                {{ r.groupId || 'Libre' }}
              </span>
            </div>
          </div>
          <button v-if="rot.allRotations.length > rot.PAGE_SIZE" class="rt-toggle" @click="rot.showAll = !rot.showAll">
            {{ rot.showAll ? 'Réduire' : `Voir les ${rot.allRotations.length - rot.PAGE_SIZE} précédentes` }}
          </button>
        </div>

        <div class="empty-rot" v-else v-reveal="140">
          <AppIcon name="refresh-cw" :size="32" />
          <p>Aucune rotation enregistrée pour l'instant</p>
        </div>

      </div>
    </div>
  </section>
</template>

<script setup>
import { reactive, computed, onMounted } from 'vue'
import AppIcon from '../components/AppIcon.vue'
import { useRotationsStore } from '../store/rotations'
import { useAirtableStore } from '../store/airtable'

const rot = useRotationsStore()
const airtable = useAirtableStore()

const poles = [
  { key: 'photo', label: 'Pôle Photo',  icon: 'camera',         color: 'linear-gradient(135deg,#b1222a,#8c3b2a)' },
  { key: '3d',    label: 'Pôle 3D',     icon: 'box',            color: 'linear-gradient(135deg,#593716,#845936)' },
  { key: 'recit', label: 'Pôle Récit',  icon: 'message-circle', color: 'linear-gradient(135deg,#1a3a2a,#2d6a4a)' },
]

// Groupes disponibles depuis l'accueil (toutes dates)
const accueilGroups = computed(() => airtable.accueilRecords)

function currentGroup(poleKey) { return rot.current[poleKey] }

function libererPole(poleKey) {
  rot.applyRotation(poleKey, null, null)
}

function poleLabel(k) {
  return poles.find(p => p.key === k)?.label || k
}

const newRotation = reactive({ pole: '', groupId: '' })

function registerRotation() {
  if (!newRotation.pole || !newRotation.groupId) return
  if (newRotation.groupId === 'libre') {
    rot.applyRotation(newRotation.pole, null, null)
  } else {
    const group = accueilGroups.value.find(g => g.groupeId === newRotation.groupId)
    rot.applyRotation(newRotation.pole, newRotation.groupId, group?.groupe?.toLowerCase() || '')
  }
  newRotation.pole    = ''
  newRotation.groupId = ''
}

onMounted(async () => {
  if (airtable.isConnected) await airtable.loadAccueil()
})
</script>

<style scoped>
.rotations-page { display: flex; flex-direction: column; gap: 24px; }

/* Grille pôles */
.poles-grid-rot { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 8px; }
@media (max-width: 680px) { .poles-grid-rot { grid-template-columns: 1fr; } }

.pole-slot { border-radius: 18px; overflow: hidden; border: 1px solid rgba(132,89,54,.14); background: #fff; box-shadow: 0 4px 16px rgba(89,55,22,.08); }
.ps-header { display: flex; align-items: center; gap: 10px; padding: 14px 18px; color: #fff; font-weight: 800; font-size: .88rem; text-transform: uppercase; letter-spacing: .8px; }
.ps-body { padding: 16px; }
.ps-label { font-size: .68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #aaa; margin-bottom: 8px; }
.ps-current { margin-bottom: 14px; }

.ps-group {
  padding: 12px 16px; border-radius: 12px;
  text-align: center; transition: all .25s ease;
  border: 2px solid transparent;
}
.ps-group.rouge { background: rgba(220,53,69,.12); border-color: #dc3545; }
.ps-group.jaune { background: rgba(212,160,23,.12); border-color: #d4a017; }
.ps-group.vert  { background: rgba(40,167,69,.12);  border-color: #28a745; }
.ps-group.libre { background: rgba(132,89,54,.06); border-color: #e8ddd0; }
.ps-group-id { display: block; font-size: 1rem; font-weight: 900; font-family: monospace; letter-spacing: 1px; color: var(--brun); }
.ps-group.rouge .ps-group-id { color: #dc3545; }
.ps-group.jaune .ps-group-id { color: #8a6600; }
.ps-group.vert  .ps-group-id { color: #28a745; }
.ps-group-color { display: block; font-size: .68rem; font-weight: 700; text-transform: uppercase; letter-spacing: .8px; opacity: .7; margin-top: 2px; }
.ps-empty { font-size: .88rem; font-weight: 600; font-style: italic; color: #bbb; }
.ps-liberer {
  display: flex; align-items: center; justify-content: center; gap: 5px;
  width: 100%; margin-top: 8px; padding: 6px;
  background: none; border: 1px dashed rgba(132,89,54,.2);
  border-radius: 8px; font-size: .72rem; font-weight: 700;
  color: #aaa; cursor: pointer; transition: all .2s;
}
.ps-liberer:hover { border-color: var(--rouge); color: var(--rouge); }

.ps-hist-list { display: flex; flex-direction: column; gap: 5px; }
.ps-hist-item { display: flex; align-items: center; gap: 8px; }
.ph-badge { font-size: .7rem; font-weight: 700; padding: 2px 8px; border-radius: 999px; }
.ph-badge.rouge { background: rgba(220,53,69,.12); color: #dc3545; }
.ph-badge.jaune { background: rgba(212,160,23,.12); color: #8a6600; }
.ph-badge.vert  { background: rgba(40,167,69,.12);  color: #28a745; }
.ph-badge.libre { background: rgba(132,89,54,.08); color: #aaa; }
.ph-time { font-size: .7rem; color: #bbb; }

/* Formulaire rotation */
.rotation-form { margin-bottom: 8px; }

/* Timeline */
.rotation-timeline { display: flex; flex-direction: column; gap: 10px; }
.rt-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: rgba(255,255,255,.95); border: 1px solid #e8ddd0; border-radius: 12px; }
.rt-time { font-size: .72rem; font-weight: 700; color: #aaa; min-width: 42px; }
.rt-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.rt-dot.rouge { background: #dc3545; }
.rt-dot.jaune { background: #d4a017; }
.rt-dot.vert  { background: #28a745; }
.rt-dot.libre { background: #ccc; }
.rt-info { display: flex; align-items: center; gap: 6px; font-size: .84rem; }
.rt-pole { font-weight: 700; color: var(--brun); }
.rt-arrow { color: #ccc; }
.rt-group { font-weight: 700; }
.rt-group.rouge { color: #dc3545; }
.rt-group.jaune { color: #8a6600; }
.rt-group.vert  { color: #28a745; }
.rt-group.libre { color: #aaa; }

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
