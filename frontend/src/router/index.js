import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

import EvenementsView from '../views/EvenementsView.vue'
import InvitesView from '../views/InvitesView.vue'
import InvitationsView from '../views/InvitationsView.vue'
import CheckinView from '../views/CheckinView.vue'
import RsvpView from '../views/RsvpView.vue'
import InscriptionView from '../views/InscriptionView.vue'
import AproposView from '../views/AproposView.vue'
import ActualitesView from '../views/ActualitesView.vue'
import ActualiteDetailView from '../views/ActualiteDetailView.vue'
import ManageActualitesView from '../views/ManageActualitesView.vue'
import ManageAdminsView from '../views/ManageAdminsView.vue'
import AuditLogsView from '../views/AuditLogsView.vue'
import ManageNewslettersView from '../views/ManageNewslettersView.vue'
import ContactView from '../views/ContactView.vue'
import ProfileView from '../views/ProfileView.vue'
import RevuePresseView from '../views/RevuePresseView.vue'
import ManageRevuePresseView from '../views/ManageRevuePresseView.vue'
import ManageHeroSlidesView from '../views/ManageHeroSlidesView.vue'
import { useApiStore } from '../store/api.js'

const routes = [
  { path: '/rsvp/:token', name: 'Rsvp', component: RsvpView, meta: { public: true } },
  { path: '/inscription/:eventId', name: 'Inscription', component: InscriptionView, meta: { public: true } },
  { path: '/', name: 'Home', component: HomeView },
  { path: '/a-propos', name: 'Apropos', component: AproposView },
  { path: '/actualites', name: 'Actualites', component: ActualitesView },
  { path: '/contact', name: 'Contact', component: ContactView },
  { path: '/revue-presse', name: 'RevuePresse', component: RevuePresseView },
  { path: '/actualites/:id', name: 'ActualiteDetail', component: ActualiteDetailView },
  { path: '/galerie-3d', name: 'Galerie3D', component: () => import('../views/Galerie3DView.vue') },
  { path: '/livre-d-or', name: 'LivreDor', component: () => import('../views/LivreDorView.vue') },
  { path: '/carte', name: 'CarteInteractive', component: () => import('../views/CarteInteractiveView.vue') },

  { path: '/evenements', name: 'Evenements', component: EvenementsView },
  { path: '/invites', name: 'Invites', component: InvitesView, meta: { roles: ['super_admin', 'admin'] } },
  { path: '/invitations/:eventId', name: 'Invitations', component: InvitationsView, meta: { roles: ['super_admin', 'admin'] } },
  { path: '/checkin/:eventId', name: 'Checkin', component: CheckinView, meta: { roles: ['super_admin', 'admin', 'accueil'] } },
  { path: '/admin/actualites', name: 'ManageActualites', component: ManageActualitesView },
  { path: '/admin/utilisateurs', name: 'ManageAdmins', component: ManageAdminsView },
  { path: '/admin/audit', name: 'AuditLogs', component: AuditLogsView, meta: { roles: ['super_admin'] } },
  { path: '/admin/newsletters', name: 'ManageNewsletters', component: ManageNewslettersView },
  { path: '/admin/revue-presse', name: 'ManageRevuePresse', component: ManageRevuePresseView },
  { path: '/admin/hero-slides', name: 'ManageHeroSlides', component: ManageHeroSlidesView },
  { path: '/admin/livre-dor', name: 'ManageLivreDor', component: () => import('../views/ManageLivreDorView.vue') },
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
  const protectedRoutes = ['Invites', 'Invitations', 'Checkin', 'ManageActualites', 'ManageAdmins', 'AuditLogs', 'Profile', 'ManageNewsletters', 'ManageRevuePresse', 'ManageHeroSlides', 'ManageLivreDor']
  if (protectedRoutes.includes(to.name) && !apiStore.isConnected) {
    next({ name: 'Home' })
  } else {
    // If route is ManageAdmins, verify user is super_admin
    if (to.name === 'ManageAdmins' && !apiStore.isSuperAdmin) {
      next({ name: 'Home' })
    } else if (to.meta.roles && !to.meta.roles.includes(apiStore.userRole)) {
      next({ name: 'Home' })
    } else {
      next()
    }
  }
})

export default router
