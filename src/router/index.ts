import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import PlanetsView from '@/views/PlanetsView.vue'
import { installRouteTransitions } from '@/utils/viewTransition'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'planets',
    component: PlanetsView,
    meta: { title: 'Planets' },
  },
  {
    path: '/planets/:id(\\d+)',
    name: 'planet',
    // Detail view is split into its own chunk; the list is the landing page.
    component: () => import('@/views/PlanetDetailView.vue'),
    props: true,
    meta: { title: 'Planet' },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/views/NotFoundView.vue'),
    meta: { title: 'Lost in space' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    // Paging/searching on the list only changes the query; keep the user where they are.
    if (to.name === from.name && to.path === from.path) return false
    return { top: 0 }
  },
})

installRouteTransitions(router)

router.afterEach((to) => {
  const title = typeof to.meta.title === 'string' ? to.meta.title : null
  document.title = title ? `${title} · Star Wars Atlas` : 'Star Wars Atlas'
})

export default router
