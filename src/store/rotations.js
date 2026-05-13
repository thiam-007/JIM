import { ref, reactive, computed } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'jim_rotations_v2'
const PAGE_SIZE = 5

function todayKey() {
  return new Date().toLocaleDateString('fr-FR')
}

function nowTime() {
  return new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

const POLE_KEY_MAP = {
  'Pôle Photo': 'photo',
  'Pôle 3D':    '3d',
  'Pôle Récit': 'recit',
}

export const useRotationsStore = defineStore('rotations', () => {
  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      const data = JSON.parse(raw)
      if (data.date !== todayKey()) return null
      return data
    } catch { return null }
  }

  const saved = loadState()

  // current[poleKey] = { id: 'GRP-001', color: 'rouge' } | null (libre)
  const current      = reactive(saved?.current  ?? { photo: null, '3d': null, recit: null })
  const history      = reactive(saved?.history  ?? { photo: [], '3d': [], recit: [] })
  const allRotations = ref(saved?.allRotations  ?? [])
  const showAll      = ref(false)

  const visibleRotations = computed(() => {
    const reversed = allRotations.value.slice().reverse()
    return showAll.value ? reversed : reversed.slice(0, PAGE_SIZE)
  })

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      date: todayKey(),
      current: { photo: current.photo, '3d': current['3d'], recit: current.recit },
      history: {
        photo: [...history.photo],
        '3d':  [...history['3d']],
        recit: [...history.recit],
      },
      allRotations: allRotations.value,
    }))
  }

  function applyRotation(poleKey, groupId, groupColor) {
    // Un groupe ne peut être que sur un seul pôle à la fois
    if (groupId) {
      for (const key of Object.keys(current)) {
        if (key !== poleKey && current[key]?.id === groupId) {
          current[key] = null
        }
      }
    }
    current[poleKey] = groupId ? { id: groupId, color: groupColor || '' } : null
    const entry = { pole: poleKey, groupId: groupId || '', groupColor: groupColor || '', time: nowTime() }
    history[poleKey].push(entry)
    allRotations.value.push(entry)
    saveState()
  }

  function recordFromSuivi(poleLabel, groupLabel, groupId) {
    const poleKey    = POLE_KEY_MAP[poleLabel]
    const groupColor = groupLabel?.toLowerCase() || ''
    if (poleKey) {
      applyRotation(poleKey, groupId || groupLabel, groupColor)
    }
  }

  return {
    current, history, allRotations, showAll,
    visibleRotations,
    applyRotation, recordFromSuivi,
    PAGE_SIZE,
  }
})
