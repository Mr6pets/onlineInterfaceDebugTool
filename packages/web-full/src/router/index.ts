import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/workspace'
  },
  {
    path: '/workspace',
    name: 'Workspace',
    component: () => import('../views/Workspace.vue')
  },
  {
    path: '/collections',
    name: 'Collections',
    component: () => import('../views/Collections.vue')
  },
  {
    path: '/environments',
    name: 'Environments',
    component: () => import('../views/Environments.vue')
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('../views/History.vue')
  }
]

export default routes