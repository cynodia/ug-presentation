import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: () => import('../views/LoginView.vue'), meta: { public: true } },
  { path: '/projects/:projectId/backlog', component: () => import('../views/BacklogView.vue') },
  { path: '/projects/:projectId/kanban', component: () => import('../views/KanbanView.vue') },
  { path: '/projects/:projectId/config', component: () => import('../views/ProjectConfigView.vue') },
  { path: '/admin', component: () => import('../views/SuperAdminView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()
  if (!auth.user && !to.meta.public) {
    try {
      await auth.fetchMe()
      if (!auth.user) return next('/login')
    } catch {
      return next('/login')
    }
  }
  next()
})

export default router
