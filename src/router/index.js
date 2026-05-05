import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ProgrammeView from '../views/ProgrammeView.vue'
import StatsView from '../views/StatsView.vue'
import AccueilView from '../views/AccueilView.vue'
import SuiviView from '../views/SuiviView.vue'
import AvisView from '../views/AvisView.vue'

const routes = [
  { path: '/', name: 'Home', component: HomeView },
  { path: '/programme', name: 'Programme', component: ProgrammeView },
  { path: '/stats', name: 'Stats', component: StatsView },
  { path: '/accueil', name: 'Accueil', component: AccueilView },
  { path: '/suivi', name: 'Suivi', component: SuiviView },
  { path: '/avis', name: 'Avis', component: AvisView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
