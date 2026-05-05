import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ProgrammeView from '../views/ProgrammeView.vue'
import StatsView from '../views/StatsView.vue'
import AccueilView from '../views/AccueilView.vue'
import SuiviView from '../views/SuiviView.vue'

const routes = [
  { path: '/', name: 'Home', component: HomeView },
  { path: '/programme', name: 'Programme', component: ProgrammeView },
  { path: '/stats', name: 'Stats', component: StatsView },
  { path: '/accueil', name: 'Accueil', component: AccueilView },
  { path: '/suivi', name: 'Suivi', component: SuiviView }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
