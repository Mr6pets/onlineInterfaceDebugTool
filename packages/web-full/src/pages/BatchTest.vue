<template>
  <div class="batch-test-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <TestTube class="title-icon" />
          批量测试
        </h1>
        <p class="page-description">创建和管理API测试套件，执行自动化测试</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="showCreateSuiteDialog = true">
          <Plus class="btn-icon" />
          新建测试套件
        </el-button>
        <el-button @click="importTestSuite">
          <Upload class="btn-icon" />
          导入测试
        </el-button>
      </div>
    </div>

    <!-- 测试套件列表 -->
    <div class="test-suites-section">
      <div class="section-header">
        <h2>测试套件</h2>
        <div class="section-actions">
          <el-input
            v-model="searchQuery"
            placeholder="搜索测试套件..."
            class="search-input"
            clearable
          >
            <template #prefix>
              <Search class="search-icon" />
            </template>
          </el-input>
          <el-select v-model="statusFilter" placeholder="状态筛选" clearable>
            <el-option label="全部" value="" />
            <el-option label="运行中" value="running" />
            <el-option label="已完成" value="completed" />
            <el-option label="失败" value="failed" />
          </el-select>
        </div>
      </div>

      <div class="test-suites-grid">
        <div
          v-for="suite in filteredTestSuites"
          :key="suite.id"
          class="test-suite-card"
          @click="openTestSuite(suite)"
        >
          <div class="card-header">
            <div class="suite-info">
              <h3 class="suite-name">{{ suite.name }}</h3>
              <p class="suite-description">{{ suite.description || '暂无描述' }}</p>
            </div>
            <div class="suite-status">
              <el-tag
                :type="getStatusTagType(suite.status)"
                size="small"
              >
                {{ getStatusLabel(suite.status) }}
              </el-tag>
            </div>
          </div>

          <div class="card-content">
            <div class="suite-stats">
              <div class="stat-item">
                <span class="stat-label">请求数量</span>
                <span class="stat-value">{{ suite.requests?.length || 0 }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">成功率</span>
                <span class="stat-value">{{ getSuccessRate(suite) }}%</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">最后运行</span>
                <span class="stat-value">{{ formatTime(suite.lastRunAt) }}</span>
              </div>
            </div>
          </div>

          <div class="card-actions">
            <el-button
              size="small"
              type="primary"
              :loading="runningTests.includes(suite.id)"
              @click.stop="runTestSuite(suite.id)"
            >
              <Play v-if="!runningTests.includes(suite.id)" class="btn-icon" />
              <Loading v-else class="btn-icon" />
              {{ runningTests.includes(suite.id) ? '运行中' : '运行测试' }}
            </el-button>
            <el-dropdown @command="handleSuiteAction">
              <el-button size="small">
                <MoreHorizontal class="btn-icon" />
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="{ action: 'edit', suite }">
                    <Edit class="menu-icon" />
                    编辑
                  </el-dropdown-item>
                  <el-dropdown-item :command="{ action: 'duplicate', suite }">
                    <Copy class="menu-icon" />
                    复制
                  </el-dropdown-item>
                  <el-dropdown-item :command="{ action: 'export', suite }">
                    <Download class="menu-icon" />
                    导出
                  </el-dropdown-item>
                  <el-dropdown-item
                    :command="{ action: 'delete', suite }"
                    divided
                  >
                    <Trash2 class="menu-icon" />
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="filteredTestSuites.length === 0" class="empty-state">
          <TestTube class="empty-icon" />
          <h3>暂无测试套件</h3>
          <p>创建您的第一个测试套件开始自动化测试</p>
          <el-button type="primary" @click="showCreateSuiteDialog = true">
            创建测试套件
          </el-button>
        </div>
      </div>
    </div>

    <!-- 最近测试结果 -->
    <div class="recent-results-section">
      <div class="section-header">
        <h2>最近测试结果</h2>
        <el-button text @click="viewAllResults">
          查看全部
          <ChevronRight class="btn-icon" />
        </el-button>
      </div>

      <div class="results-table">
        <el-table :data="recentTestResults" style="width: 100%">
          <el-table-column prop="suiteName" label="测试套件" width="200" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)" size="small">
                {{ getStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="duration" label="耗时" width="100">
            <template #default="{ row }">
              {{ formatDuration(row.duration) }}
            </template>
          </el-table-column>
          <el-table-column prop="passedCount" label="通过" width="80" />
          <el-table-column prop="failedCount" label="失败" width="80" />
          <el-table-column prop="startTime" label="开始时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.startTime) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button size="small" text @click="viewTestResult(row)">
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 创建测试套件对话框 -->
    <el-dialog
      v-model="showCreateSuiteDialog"
      title="创建测试套件"
      width="600px"
      @close="resetCreateForm"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createFormRules"
        label-width="100px"
      >
        <el-form-item label="套件名称" prop="name">
          <el-input
            v-model="createForm.name"
            placeholder="请输入测试套件名称"
          />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入测试套件描述"
          />
        </el-form-item>
        <el-form-item label="选择集合" prop="collectionId">
          <el-select
            v-model="createForm.collectionId"
            placeholder="选择要测试的API集合"
            style="width: 100%"
          >
            <el-option
              v-for="collection in collections"
              :key="collection.id"
              :label="collection.name"
              :value="collection.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="测试环境" prop="environmentId">
          <el-select
            v-model="createForm.environmentId"
            placeholder="选择测试环境"
            style="width: 100%"
          >
            <el-option
              v-for="env in environments"
              :key="env.id"
              :label="env.name"
              :value="env.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateSuiteDialog = false">取消</el-button>
        <el-button type="primary" @click="createTestSuite">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Operation as TestTube,
  Plus,
  Upload,
  Search,
  VideoPlay as Play,
  Loading,
  MoreFilled as MoreHorizontal,
  Edit,
  CopyDocument as Copy,
  Download,
  Delete as Trash2,
  ArrowRight as ChevronRight
} from '@element-plus/icons-vue'
import { useWorkspaceStore } from '@/stores/workspace'
import { useCollectionStore } from '@/stores/collection'
import { useEnvironmentStore } from '@/stores/environment'

const router = useRouter()
const workspaceStore = useWorkspaceStore()
const collectionStore = useCollectionStore()
const environmentStore = useEnvironmentStore()

// 响应式数据
const searchQuery = ref('')
const statusFilter = ref('')
const showCreateSuiteDialog = ref(false)
const createFormRef = ref()
const runningTests = ref<string[]>([])

// 测试套件数据
const testSuites = ref([
  {
    id: '1',
    name: '用户API测试套件',
    description: '测试用户相关的所有API接口',
    status: 'completed',
    requests: [{ id: '1' }, { id: '2' }, { id: '3' }],
    lastRunAt: new Date('2024-01-15T10:30:00'),
    successRate: 95
  },
  {
    id: '2',
    name: '订单流程测试',
    description: '测试完整的订单创建和处理流程',
    status: 'running',
    requests: [{ id: '4' }, { id: '5' }],
    lastRunAt: new Date('2024-01-15T11:00:00'),
    successRate: 100
  }
])

// 测试结果数据
const recentTestResults = ref([
  {
    id: '1',
    suiteName: '用户API测试套件',
    status: 'passed',
    duration: 2500,
    passedCount: 8,
    failedCount: 0,
    startTime: new Date('2024-01-15T10:30:00')
  },
  {
    id: '2',
    suiteName: '订单流程测试',
    status: 'failed',
    duration: 1800,
    passedCount: 3,
    failedCount: 2,
    startTime: new Date('2024-01-15T09:15:00')
  }
])

// 创建表单
const createForm = ref({
  name: '',
  description: '',
  collectionId: '',
  environmentId: ''
})

const createFormRules = {
  name: [{ required: true, message: '请输入测试套件名称', trigger: 'blur' }],
  collectionId: [{ required: true, message: '请选择API集合', trigger: 'change' }],
  environmentId: [{ required: true, message: '请选择测试环境', trigger: 'change' }]
}

// 计算属性
const collections = computed(() => collectionStore.collections)
const environments = computed(() => environmentStore.environments)

const filteredTestSuites = computed(() => {
  let filtered = testSuites.value

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(suite =>
      suite.name.toLowerCase().includes(query) ||
      suite.description?.toLowerCase().includes(query)
    )
  }

  if (statusFilter.value) {
    filtered = filtered.filter(suite => suite.status === statusFilter.value)
  }

  return filtered
})

// 方法
const getStatusTagType = (status: string) => {
  const statusMap: Record<string, string> = {
    running: 'warning',
    completed: 'success',
    passed: 'success',
    failed: 'danger',
    cancelled: 'info'
  }
  return statusMap[status] || 'info'
}

const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    running: '运行中',
    completed: '已完成',
    passed: '通过',
    failed: '失败',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}

const getSuccessRate = (suite: any) => {
  return suite.successRate || 0
}

const formatTime = (date: Date | string) => {
  if (!date) return '未运行'
  const d = new Date(date)
  return d.toLocaleString('zh-CN')
}

const formatDuration = (ms: number) => {
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

const openTestSuite = (suite: any) => {
  router.push(`/batch-test/${suite.id}`)
}

const runTestSuite = async (suiteId: string) => {
  runningTests.value.push(suiteId)
  try {
    // 模拟测试执行
    await new Promise(resolve => setTimeout(resolve, 3000))
    ElMessage.success('测试执行完成')
  } catch (error) {
    ElMessage.error('测试执行失败')
  } finally {
    runningTests.value = runningTests.value.filter(id => id !== suiteId)
  }
}

const handleSuiteAction = async ({ action, suite }: { action: string; suite: any }) => {
  switch (action) {
    case 'edit':
      router.push(`/batch-test/${suite.id}/edit`)
      break
    case 'duplicate':
      // 复制测试套件逻辑
      ElMessage.success('测试套件已复制')
      break
    case 'export':
      // 导出测试套件逻辑
      ElMessage.success('测试套件已导出')
      break
    case 'delete':
      try {
        await ElMessageBox.confirm(
          `确定要删除测试套件 "${suite.name}" 吗？`,
          '确认删除',
          {
            confirmButtonText: '删除',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        // 删除逻辑
        ElMessage.success('测试套件已删除')
      } catch {
        // 用户取消删除
      }
      break
  }
}

const createTestSuite = async () => {
  if (!createFormRef.value) return
  
  try {
    await createFormRef.value.validate()
    // 创建测试套件逻辑
    ElMessage.success('测试套件创建成功')
    showCreateSuiteDialog.value = false
    resetCreateForm()
  } catch (error) {
    console.error('表单验证失败:', error)
  }
}

const resetCreateForm = () => {
  createForm.value = {
    name: '',
    description: '',
    collectionId: '',
    environmentId: ''
  }
  createFormRef.value?.clearValidate()
}

const importTestSuite = () => {
  // 导入测试套件逻辑
  ElMessage.info('导入功能开发中')
}

const viewAllResults = () => {
  router.push('/batch-test/results')
}

const viewTestResult = (result: any) => {
  router.push(`/batch-test/results/${result.id}`)
}

// 生命周期
onMounted(async () => {
  await Promise.all([
    collectionStore.loadCollections(),
    environmentStore.loadEnvironments()
  ])
})
</script>

<style scoped>
.batch-test-page {
  padding: 24px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  padding: 24px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #f0f0f0;
}

.header-left {
  flex: 1;
  min-width: 0;
}

.page-title {
  display: flex;
  align-items: center;
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.2;
}

.title-icon {
  width: 24px;
  height: 24px;
  margin-right: 12px;
  color: #1890ff;
  flex-shrink: 0;
}

.page-description {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.5;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.btn-icon {
  width: 16px;
  height: 16px;
  margin-right: 8px;
  flex-shrink: 0;
  vertical-align: middle;
}

.test-suites-section,
.recent-results-section {
  margin-bottom: 32px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.section-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-input {
  width: 240px;
}

.search-icon {
  width: 16px;
  height: 16px;
  color: #9ca3af;
  flex-shrink: 0;
}

.test-suites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.test-suite-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  min-height: 200px;
}

.test-suite-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-4px);
  border-color: #e0e0e0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.suite-info {
  flex: 1;
}

.suite-name {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.suite-description {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.4;
}

.suite-stats {
  display: flex;
  gap: 24px;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #9ca3af;
  font-weight: 500;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.card-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  align-items: center;
  margin-top: auto;
}

.menu-icon {
  width: 14px;
  height: 14px;
  margin-right: 8px;
  flex-shrink: 0;
  vertical-align: middle;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  width: 64px;
  height: 64px;
  color: #d1d5db;
  margin: 0 auto 16px;
  display: block;
}

.empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #1f2937;
}

.empty-state p {
  margin: 0 0 24px 0;
  color: #6b7280;
}

.results-table {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:deep(.el-table) {
  border: none;
}

:deep(.el-table th) {
  background-color: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

:deep(.el-table td) {
  border-bottom: 1px solid #f3f4f6;
}

:deep(.el-table tr:last-child td) {
  border-bottom: none;
}
/* 按钮样式优化 */
:deep(.el-button) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
}

:deep(.el-button .btn-icon) {
  margin-right: 6px;
  flex-shrink: 0;
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, #1890ff 0%, #096dd9 100%);
  border-color: #1890ff;
  box-shadow: 0 2px 4px rgba(24, 144, 255, 0.2);
}

:deep(.el-button--primary:hover) {
  background: linear-gradient(135deg, #40a9ff 0%, #1890ff 100%);
  box-shadow: 0 4px 8px rgba(24, 144, 255, 0.3);
  transform: translateY(-1px);
}

:deep(.el-button--small) {
  padding: 6px 12px;
  font-size: 13px;
}

/* 下拉菜单样式优化 */
:deep(.el-dropdown-menu) {
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border: 1px solid #f0f0f0;
}

:deep(.el-dropdown-menu__item) {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  transition: all 0.2s ease;
}

:deep(.el-dropdown-menu__item:hover) {
  background-color: #f8fafc;
}

/* 标签样式优化 */
:deep(.el-tag) {
  border-radius: 6px;
  font-weight: 500;
  border: none;
}

:deep(.el-tag--success) {
  background-color: #f0f9ff;
  color: #0369a1;
}

:deep(.el-tag--warning) {
  background-color: #fffbeb;
  color: #d97706;
}

:deep(.el-tag--danger) {
  background-color: #fef2f2;
  color: #dc2626;
}

/* 输入框样式优化 */
:deep(.el-input__wrapper) {
  border-radius: 8px;
  transition: all 0.2s ease;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #d1d5db;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

/* 选择器样式优化 */
:deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
}

/* 表格样式优化 */
:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th.el-table__cell) {
  background-color: #f8fafc;
  font-weight: 600;
  color: #374151;
}

:deep(.el-table .el-table__row:hover > td) {
  background-color: #f8fafc;
}
</style>