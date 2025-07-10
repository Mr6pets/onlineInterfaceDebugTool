import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'

import App from './App.vue'

// 路由配置
const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('./views/Dashboard.vue')
  },
  {
    path: '/performance',
    name: 'Performance', 
    component: () => import('./views/Performance.vue')
  },
  {
    path: '/team',
    name: 'Team',
    component: () => import('./views/Team.vue')
  },
  {
    path: '/documentation',
    name: 'Documentation',
    component: () => import('./views/Documentation.vue')
  },
  {
    path: '/automation',
    name: 'Automation',
    component: () => import('./views/Automation.vue')
  },
  {
    path: '/mock-server',
    name: 'MockServer',
    component: () => import('./views/MockServer.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const app = createApp(App)
const pinia = createPinia()

// 注册Element Plus图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(pinia)
app.use(router)
app.use(ElementPlus)

app.mount('#app')