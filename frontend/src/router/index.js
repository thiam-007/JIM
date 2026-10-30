import { createRouter, createWebHistory } from 'vue-router'
import { useApiStore } from '../store/api.js'

const routes = [
  { path: '/rsvp/:token', name: 'Rsvp', component: () => import('../views/RsvpView.vue'), meta: { public: true } },
  { path: '/inscription/:eventId', redirect: to => ({ name: 'InvitationRequest', params: { eventId: to.params.eventId } }) },
  { path: '/demande-invitation/:eventId', name: 'InvitationRequest', component: () => import('../views/InvitationRequestView.vue'), meta: { public: true } },
  { path: '/', name: 'Home', component: () => import('../views/HomeView.vue') },
  { path: '/a-propos', name: 'Apropos', component: () => import('../views/AproposView.vue') },
  { path: '/actualites', name: 'Actualites', component: () => import('../views/ActualitesView.vue') },
  { path: '/contact', name: 'Contact', component: () => import('../views/ContactView.vue') },
  { path: '/revue-presse', name: 'RevuePresse', component: () => import('../views/RevuePresseView.vue') },
  { path: '/actualites/:id', name: 'ActualiteDetail', component: () => import('../views/ActualiteDetailView.vue') },
  { path: '/galerie-3d', name: 'Galerie3D', component: () => import('../views/Galerie3DView.vue') },
  { path: '/livre-d-or', name: 'LivreDor', component: () => import('../views/LivreDorView.vue') },
  { path: '/carte', name: 'CarteInteractive', component: () => import('../views/CarteInteractiveView.vue') },

  { path: '/evenements', name: 'Evenements', component: () => import('../views/EvenementsView.vue') },
  { path: '/invites', name: 'Invites', component: () => import('../views/InvitesView.vue'), meta: { roles: ['super_admin', 'admin'] } },
  { path: '/invitations/:eventId', name: 'Invitations', component: () => import('../views/InvitationsView.vue'), meta: { roles: ['super_admin', 'admin'] } },
  { path: '/invitations/:eventId/demandes', name: 'InvitationRequests', component: () => import('../views/InvitationRequestsView.vue'), meta: { roles: ['super_admin', 'admin'] } },
  { path: '/checkin/:eventId', name: 'Checkin', component: () => import('../views/CheckinView.vue'), meta: { roles: ['super_admin', 'admin', 'accueil'] } },
  { path: '/admin/actualites', name: 'ManageActualites', component: () => import('../views/ManageActualitesView.vue') },
  { path: '/admin/utilisateurs', name: 'ManageAdmins', component: () => import('../views/ManageAdminsView.vue') },
  { path: '/admin/audit', name: 'AuditLogs', component: () => import('../views/AuditLogsView.vue'), meta: { roles: ['super_admin'] } },
  { path: '/admin/newsletters', name: 'ManageNewsletters', component: () => import('../views/ManageNewslettersView.vue') },
  { path: '/admin/revue-presse', name: 'ManageRevuePresse', component: () => import('../views/ManageRevuePresseView.vue') },
  { path: '/admin/hero-slides', name: 'ManageHeroSlides', component: () => import('../views/ManageHeroSlidesView.vue') },
  { path: '/admin/livre-dor', name: 'ManageLivreDor', component: () => import('../views/ManageLivreDorView.vue') },
  { path: '/profil', name: 'Profile', component: () => import('../views/ProfileView.vue') }
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
  const protectedRoutes = ['Invites', 'Invitations', 'InvitationRequests', 'Checkin', 'ManageActualites', 'ManageAdmins', 'AuditLogs', 'Profile', 'ManageNewsletters', 'ManageRevuePresse', 'ManageHeroSlides', 'ManageLivreDor']
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
