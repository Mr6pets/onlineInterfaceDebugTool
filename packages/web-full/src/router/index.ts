import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/workspace'
  },
  // 工作空间管理
  {
    path: '/workspace',
    name: 'WorkspaceManagement',
    component: () => import('../pages/WorkspaceManagement.vue')
  },
  {
    path: '/workspace/settings/:id',
    name: 'WorkspaceSettings',
    component: () => import('../pages/WorkspaceSettings.vue')
  },
  {
    path: '/team',
    name: 'TeamManagement',
    component: () => import('../pages/TeamManagement.vue')
  },
  // API集合管理
  {
    path: '/collections',
    name: 'CollectionManagement',
    component: () => import('../pages/CollectionManagement.vue')
  },
  {
    path: '/debugger',
    name: 'ApiDebugger',
    component: () => import('../pages/ApiDebugger.vue')
  },
  {
    path: '/debugger/:collectionId/:requestId?',
    name: 'ApiDebuggerWithParams',
    component: () => import('../pages/ApiDebugger.vue')
  },
  // 环境管理
  {
    path: '/environments',
    name: 'EnvironmentManagement',
    component: () => import('../pages/EnvironmentManagement.vue')
  },
  // 历史记录
  {
    path: '/history',
    name: 'HistoryManagement',
    component: () => import('../pages/HistoryManagement.vue')
  },
  // 批量测试
  {
    path: '/batch-test',
    name: 'BatchTest',
    component: () => import('../pages/BatchTest.vue')
  },
  {
    path: '/batch-test/:id',
    name: 'BatchTestDetail',
    component: () => import('../pages/BatchTestDetail.vue')
  },
  {
    path: '/batch-test/:id/edit',
    name: 'BatchTestEdit',
    component: () => import('../pages/BatchTestDetail.vue')
  },
  {
    path: '/batch-test/results/:id',
    name: 'BatchTestResult',
    component: () => import('../pages/BatchTestDetail.vue')
  },
  // 数据管理
  {
    path: '/data',
    name: 'DataManagement',
    component: () => import('../pages/DataManagement.vue')
  },
  // 设置
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../pages/Settings.vue')
  },
  // 404 页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../pages/NotFound.vue')
  }
]

export default routes