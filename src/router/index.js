import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ProgrammeView from '../views/ProgrammeView.vue'
import StatsView from '../views/StatsView.vue'
import AccueilView from '../views/AccueilView.vue'
import SuiviView from '../views/SuiviView.vue'
import InscriptionsView from '../views/InscriptionsView.vue'

const routes = [
  { path: '/', name: 'Home', component: HomeView },
  { path: '/programme', name: 'Programme', component: ProgrammeView },
  { path: '/inscriptions', name: 'Inscriptions', component: InscriptionsView },
  { path: '/stats', name: 'Stats', component: StatsView },
  { path: '/accueil', name: 'Accueil', component: AccueilView },
  { path: '/suivi', name: 'Suivi', component: SuiviView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
