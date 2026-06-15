import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

import EvenementsView from '../views/EvenementsView.vue'
import InvitesView from '../views/InvitesView.vue'
import InvitationsView from '../views/InvitationsView.vue'
import CheckinView from '../views/CheckinView.vue'
import RsvpView from '../views/RsvpView.vue'
import AproposView from '../views/AproposView.vue'
import ActualitesView from '../views/ActualitesView.vue'
import ActualiteDetailView from '../views/ActualiteDetailView.vue'
import ManageActualitesView from '../views/ManageActualitesView.vue'
import ManageAdminsView from '../views/ManageAdminsView.vue'
import ContactView from '../views/ContactView.vue'
import ProfileView from '../views/ProfileView.vue'
import { useApiStore } from '../store/api.js'

const routes = [
  { path: '/rsvp/:token', name: 'Rsvp', component: RsvpView, meta: { public: true } },
  { path: '/', name: 'Home', component: HomeView },
  { path: '/a-propos', name: 'Apropos', component: AproposView },
  { path: '/actualites', name: 'Actualites', component: ActualitesView },
  { path: '/contact', name: 'Contact', component: ContactView },
  { path: '/actualites/:id', name: 'ActualiteDetail', component: ActualiteDetailView },

  { path: '/evenements', name: 'Evenements', component: EvenementsView },
  { path: '/invites', name: 'Invites', component: InvitesView },
  { path: '/invitations/:eventId', name: 'Invitations', component: InvitationsView },
  { path: '/checkin/:eventId', name: 'Checkin', component: CheckinView },
  { path: '/admin/actualites', name: 'ManageActualites', component: ManageActualitesView },
  { path: '/admin/utilisateurs', name: 'ManageAdmins', component: ManageAdminsView },
  { path: '/profil', name: 'Profile', component: ProfileView }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

router.beforeEach((to, from, next) => {
  const apiStore = useApiStore()
  const protectedRoutes = ['Invites', 'Invitations', 'Checkin', 'ManageActualites', 'ManageAdmins', 'Profile']
  if (protectedRoutes.includes(to.name) && !apiStore.isConnected) {
    next({ name: 'Home' })
  } else {
    // If route is ManageAdmins, verify user is super_admin
    if (to.name === 'ManageAdmins' && !apiStore.isSuperAdmin) {
      next({ name: 'Home' })
    } else {
      next()
    }
  }
})

export default router
