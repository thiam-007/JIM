import { ref, reactive, computed } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'jim_rotations_v1'
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

const GROUP_KEY_MAP = {
  'Rouge': 'rouge',
  'Jaune': 'jaune',
  'Vert':  'vert',
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

  const current      = reactive(saved?.current     ?? { photo: '', '3d': '', recit: '' })
  const history      = reactive(saved?.history     ?? { photo: [], '3d': [], recit: [] })
  const allRotations = ref(saved?.allRotations     ?? [])
  const showAll      = ref(false)

  const visibleRotations = computed(() => {
    const reversed = allRotations.value.slice().reverse()
    return showAll.value ? reversed : reversed.slice(0, PAGE_SIZE)
  })

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      date: todayKey(),
      current: { ...current },
      history: {
        photo: [...history.photo],
        '3d':  [...history['3d']],
        recit: [...history.recit],
      },
      allRotations: allRotations.value,
    }))
  }

  function applyRotation(poleKey, group) {
    current[poleKey] = group
    const entry = { pole: poleKey, group, time: nowTime() }
    history[poleKey].push(entry)
    allRotations.value.push(entry)
    saveState()
  }

  function recordFromSuivi(poleLabel, groupLabel) {
    const poleKey  = POLE_KEY_MAP[poleLabel]
    const groupKey = GROUP_KEY_MAP[groupLabel]
    if (poleKey && groupKey) {
      applyRotation(poleKey, groupKey)
    }
  }

  return {
    current, history, allRotations, showAll,
    visibleRotations,
    applyRotation, recordFromSuivi,
    PAGE_SIZE,
  }
})
