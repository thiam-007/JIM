<template>
  <div class="map-view-container">
    <div class="map-header">
      <div class="map-title-wrap">
        <h1 class="map-title">Origines des Œuvres</h1>
        <div class="map-title-divider"></div>
        <p class="map-subtitle">Découvrez la provenance géographique de nos trésors culturels à travers les différentes régions de la Guinée.</p>
      </div>
    </div>

    <div class="map-wrapper glass-panel">
      <div id="guinea-map" class="leaflet-map-container"></div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useRouter } from 'vue-router'

const router = useRouter()
let map = null

const regions = [
  {
    name: "Basse Guinée (Région Côtière)",
    coords: [10.3, -13.8],
    items: [
      { id: "nimba", name: "Le Grand Masque Nimba", category: "Masques", image: "/images/galerie-3d/cover/nimba.png" },
      { id: "nimbaporte", name: "Nimba Porté avec Costume", category: "Masques", image: "/images/galerie-3d/cover/nimba_portée.png" },
      { id: "atshiol", name: "Le Masque Atshiol", category: "Masques", image: "/images/galerie-3d/cover/asthiol.png" },
      { id: "simogui", name: "Le Masque Simogui", category: "Masques", image: "/images/galerie-3d/cover/simogui.png" },
      { id: "rg19948", name: "R.G. 1994.8.MNG (Statue)", category: "Statues", image: "/images/galerie-3d/cover/nimba_portée.png" } // placeholder image was used in db
    ]
  },
  {
    name: "Moyenne Guinée (Fouta Djallon)",
    coords: [11.2, -12.2],
    items: [
      { id: "fougoumba", name: "Case de Fougoumba", category: "Architecture", image: "/images/galerie-3d/cover/Case de Fougoumba.png" },
      { id: "dalaba", name: "Habitation de Dalaba", category: "Architecture", image: "/images/galerie-3d/cover/dalaba.png" },
      { id: "rg20040092", name: "Calebasse Traditionnelle", category: "Utilitaires", image: "/images/galerie-3d/cover/R.G. 2004.0092.MNG.png" },
      { id: "rg2004082", name: "Support Rituel", category: "Sacres", image: "/images/banner-mvg.jpeg" }
    ]
  },
  {
    name: "Haute Guinée (Savane)",
    coords: [10.5, -9.8],
    items: [
      { id: "kouranko", name: "Le Masque Kouranko", category: "Masques", image: "/images/galerie-3d/cover/masque_kouranko.png" },
      { id: "rg1991394", name: "Jarre Traditionnelle", category: "Utilitaires", image: "/images/galerie-3d/cover/R.G. 1991.394.MNG.png" }
    ]
  },
  {
    name: "Guinée Forestière",
    coords: [8.5, -9.0],
    items: [
      { id: "rg1991806", name: "Masque Anthropomorphe", category: "Masques", image: "/images/galerie-3d/cover/R.G. 1991.806.MNG.png" }
    ]
  }
]

onMounted(() => {
  // Coordonnées pour centrer sur la Guinée
  map = L.map('guinea-map', {
    center: [10.5, -11.5],
    zoom: 7,
    scrollWheelZoom: false
  })

  // Fond de carte premium (CartoDB Positron)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map)

  // Icône personnalisée
  const customIcon = L.divIcon({
    className: 'custom-map-marker',
    html: `<div class="marker-pin"></div><div class="marker-pulse"></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  })

  // Ajouter les marqueurs
  regions.forEach(region => {
    const marker = L.marker(region.coords, { icon: customIcon }).addTo(map)
    
    // Construire le contenu de la pop-up
    let itemsHtml = region.items.map(item => `
      <div class="map-popup-item" data-id="${item.id}">
        <img src="${item.image}" alt="${item.name}" />
        <div class="map-popup-info">
          <strong>${item.name}</strong>
          <span>${item.category}</span>
        </div>
      </div>
    `).join('')

    const popupContent = `
      <div class="map-popup">
        <h3>${region.name}</h3>
        <div class="map-popup-grid">
          ${itemsHtml}
        </div>
      </div>
    `

    marker.bindPopup(popupContent, {
      maxWidth: 320,
      className: 'custom-popup'
    })
  })

  // Déléguer le clic pour la navigation vers la galerie 3D
  document.getElementById('guinea-map').addEventListener('click', (e) => {
    const itemEl = e.target.closest('.map-popup-item')
    if (itemEl) {
      const itemId = itemEl.getAttribute('data-id')
      router.push({ path: '/galerie-3d', query: { item: itemId } })
    }
  })
})

onUnmounted(() => {
  if (map) {
    map.remove()
  }
})
</script>

<style>
/* Leaflet Global Overrides */
.custom-popup .leaflet-popup-content-wrapper {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.15);
  border: 1px solid rgba(132, 89, 54, 0.1);
  padding: 0;
  overflow: hidden;
}
.custom-popup .leaflet-popup-content {
  margin: 0;
  width: 280px !important;
}
.custom-popup .leaflet-popup-tip-container {
  display: none;
}

.map-popup h3 {
  margin: 0;
  padding: 12px 16px;
  background: var(--brun);
  color: white;
  font-size: 0.9rem;
  font-weight: 700;
  text-align: center;
  border-bottom: 2px solid var(--or);
}

.map-popup-grid {
  display: flex;
  flex-direction: column;
  max-height: 250px;
  overflow-y: auto;
  padding: 8px;
  gap: 8px;
}
.map-popup-grid::-webkit-scrollbar {
  width: 4px;
}
.map-popup-grid::-webkit-scrollbar-thumb {
  background: var(--brun);
  border-radius: 4px;
}

.map-popup-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 8px;
  background: rgba(132, 89, 54, 0.05);
  cursor: pointer;
  transition: all 0.2s;
}
.map-popup-item:hover {
  background: rgba(132, 89, 54, 0.12);
  transform: translateX(4px);
}
.map-popup-item img {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  object-fit: cover;
}
.map-popup-info {
  display: flex;
  flex-direction: column;
}
.map-popup-info strong {
  color: var(--brun);
  font-size: 0.85rem;
}
.map-popup-info span {
  color: #666;
  font-size: 0.75rem;
}

/* Custom Marker */
.custom-map-marker {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.marker-pin {
  width: 14px;
  height: 14px;
  background: var(--or);
  border: 2px solid white;
  border-radius: 50%;
  position: relative;
  z-index: 2;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
}
.marker-pulse {
  position: absolute;
  width: 30px;
  height: 30px;
  background: rgba(249, 178, 51, 0.4);
  border-radius: 50%;
  animation: pulse-ring 2s infinite cubic-bezier(0.215, 0.61, 0.355, 1);
  z-index: 1;
}

@keyframes pulse-ring {
  0% { transform: scale(0.5); opacity: 1; }
  100% { transform: scale(1.5); opacity: 0; }
}
</style>

<style scoped>
.map-view-container {
  padding: 120px 24px 60px;
  max-width: 1200px;
  margin: 0 auto;
  min-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
}

.map-header {
  text-align: center;
  margin-bottom: 40px;
}

.map-title {
  font-size: 2.4rem;
  font-weight: 900;
  color: var(--brun);
  margin-bottom: 16px;
}

.map-title-divider {
  width: 60px;
  height: 4px;
  background: var(--or);
  margin: 0 auto 20px;
  border-radius: 2px;
}

.map-subtitle {
  color: #666;
  font-size: 1.1rem;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.map-wrapper {
  flex: 1;
  min-height: 500px;
  border-radius: 24px;
  overflow: hidden;
  position: relative;
  border: 1px solid rgba(132, 89, 54, 0.15);
  box-shadow: 0 20px 40px rgba(0,0,0,0.08);
}

.glass-panel {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
}

.leaflet-map-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

@media (max-width: 768px) {
  .map-view-container {
    padding: 100px 16px 40px;
  }
  .map-title {
    font-size: 1.8rem;
  }
  .map-wrapper {
    min-height: 400px;
  }
}
</style>
