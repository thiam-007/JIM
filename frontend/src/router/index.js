import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

import EvenementsView from '../views/EvenementsView.vue'
import InvitesView from '../views/InvitesView.vue'
import InvitationsView from '../views/InvitationsView.vue'
import CheckinView from '../views/CheckinView.vue'
import RsvpView from '../views/RsvpView.vue'

const routes = [
  { path: '/rsvp/:token', name: 'Rsvp', component: RsvpView, meta: { public: true } },
  { path: '/', name: 'Home', component: HomeView },

  { path: '/evenements', name: 'Evenements', component: EvenementsView },
  { path: '/invites', name: 'Invites', component: InvitesView },
  { path: '/invitations/:eventId', name: 'Invitations', component: InvitationsView },
  { path: '/checkin/:eventId', name: 'Checkin', component: CheckinView }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
