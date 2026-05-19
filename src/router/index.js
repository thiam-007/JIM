import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ProgrammeView from '../views/ProgrammeView.vue'
import StatsView from '../views/StatsView.vue'
import AccueilView from '../views/AccueilView.vue'
import SuiviView from '../views/SuiviView.vue'
import InscriptionsView from '../views/InscriptionsView.vue'
import LoginView from '../views/LoginView.vue'
import RotationsView from '../views/RotationsView.vue'
import EvenementsView from '../views/EvenementsView.vue'
import InvitesView from '../views/InvitesView.vue'
import InvitationsView from '../views/InvitationsView.vue'
import CheckinView from '../views/CheckinView.vue'
import RsvpView from '../views/RsvpView.vue'

const routes = [
  { path: '/login', name: 'Login', component: LoginView, meta: { public: true } },
  { path: '/rsvp/:token', name: 'Rsvp', component: RsvpView, meta: { public: true } },
  { path: '/', name: 'Home', component: HomeView },
  { path: '/programme', name: 'Programme', component: ProgrammeView },
  { path: '/inscriptions', name: 'Inscriptions', component: InscriptionsView },
  { path: '/stats', name: 'Stats', component: StatsView },
  { path: '/accueil', name: 'Accueil', component: AccueilView },
  { path: '/suivi', name: 'Suivi', component: SuiviView },
  { path: '/rotations', name: 'Rotations', component: RotationsView },
  { path: '/evenements', name: 'Evenements', component: EvenementsView },
  { path: '/invites', name: 'Invites', component: InvitesView },
  { path: '/invitations/:eventId', name: 'Invitations', component: InvitationsView },
  { path: '/checkin/:eventId', name: 'Checkin', component: CheckinView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to) => {
  const isAuth = sessionStorage.getItem('jim_auth') === '1'
  if (!to.meta.public && !isAuth) {
    return { name: 'Login' }
  }
})

export default router
