<template>
  <div class="batch-test-detail-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <el-button text @click="goBack">
          <ArrowLeft class="btn-icon" />
          返回
        </el-button>
        <div class="title-section">
          <h1 class="page-title">{{ testSuite?.name || '测试套件详情' }}</h1>
          <p class="page-description">{{ testSuite?.description || '暂无描述' }}</p>
        </div>
      </div>
      <div class="header-actions">
        <el-button
          type="primary"
          :loading="isRunning"
          @click="runTestSuite"
        >
          <Play v-if="!isRunning" class="btn-icon" />
          <Loading v-else class="btn-icon" />
          {{ isRunning ? '运行中' : '运行测试' }}
        </el-button>
        <el-dropdown @command="handleAction">
          <el-button>
            <MoreHorizontal class="btn-icon" />
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="edit">
                <Edit class="menu-icon" />
                编辑套件
              </el-dropdown-item>
              <el-dropdown-item command="duplicate">
                <Copy class="menu-icon" />
                复制套件
              </el-dropdown-item>
              <el-dropdown-item command="export">
                <Download class="menu-icon" />
                导出套件
              </el-dropdown-item>
              <el-dropdown-item command="delete" divided>
                <Trash2 class="menu-icon" />
                删除套件
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 测试套件信息 -->
    <div class="suite-info-section">
      <div class="info-cards">
        <div class="info-card">
          <div class="card-icon">
            <FileText class="icon" />
          </div>
          <div class="card-content">
            <div class="card-value">{{ testSuite?.requests?.length || 0 }}</div>
            <div class="card-label">测试请求</div>
          </div>
        </div>
        <div class="info-card">
          <div class="card-icon success">
            <CheckCircle class="icon" />
          </div>
          <div class="card-content">
            <div class="card-value">{{ lastResult?.passedCount || 0 }}</div>
            <div class="card-label">通过数量</div>
          </div>
        </div>
        <div class="info-card">
          <div class="card-icon danger">
            <XCircle class="icon" />
          </div>
          <div class="card-content">
            <div class="card-value">{{ lastResult?.failedCount || 0 }}</div>
            <div class="card-label">失败数量</div>
          </div>
        </div>
        <div class="info-card">
          <div class="card-icon warning">
            <Clock class="icon" />
          </div>
          <div class="card-content">
            <div class="card-value">{{ formatDuration(lastResult?.duration) }}</div>
            <div class="card-label">执行时间</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <el-tabs v-model="activeTab" class="detail-tabs">
        <!-- 测试请求列表 -->
        <el-tab-pane label="测试请求" name="requests">
          <div class="requests-section">
            <div class="section-header">
              <h3>测试请求列表</h3>
              <div class="section-actions">
                <el-button @click="addRequest">
                  <Plus class="btn-icon" />
                  添加请求
                </el-button>
                <el-button @click="importRequests">
                  <Upload class="btn-icon" />
                  导入请求
                </el-button>
              </div>
            </div>

            <div class="requests-table">
              <el-table
                :data="testRequests"
                style="width: 100%"
                @selection-change="handleSelectionChange"
              >
                <el-table-column type="selection" width="55" />
                <el-table-column prop="name" label="请求名称" min-width="200">
                  <template #default="{ row }">
                    <div class="request-name">
                      <span class="method-tag" :class="row.method.toLowerCase()">
                        {{ row.method }}
                      </span>
                      <span class="name">{{ row.name }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column prop="url" label="请求URL" min-width="300" show-overflow-tooltip />
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag
                      :type="getRequestStatusType(row.status)"
                      size="small"
                    >
                      {{ getRequestStatusLabel(row.status) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="responseTime" label="响应时间" width="100">
                  <template #default="{ row }">
                    {{ row.responseTime ? `${row.responseTime}ms` : '-' }}
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="150">
                  <template #default="{ row }">
                    <el-button size="small" text @click="editRequest(row)">
                      编辑
                    </el-button>
                    <el-button size="small" text @click="runSingleRequest(row)">
                      运行
                    </el-button>
                    <el-button
                      size="small"
                      text
                      type="danger"
                      @click="removeRequest(row)"
                    >
                      删除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </el-tab-pane>

        <!-- 测试配置 -->
        <el-tab-pane label="测试配置" name="settings">
          <div class="settings-section">
            <el-form :model="testSettings" label-width="120px">
              <el-card class="settings-card">
                <template #header>
                  <h4>执行设置</h4>
                </template>
                <el-form-item label="并发数量">
                  <el-input-number
                    v-model="testSettings.concurrency"
                    :min="1"
                    :max="10"
                    style="width: 200px"
                  />
                  <span class="form-help">同时执行的请求数量</span>
                </el-form-item>
                <el-form-item label="请求间隔">
                  <el-input-number
                    v-model="testSettings.delay"
                    :min="0"
                    :max="10000"
                    style="width: 200px"
                  />
                  <span class="form-help">请求之间的延迟时间（毫秒）</span>
                </el-form-item>
                <el-form-item label="超时时间">
                  <el-input-number
                    v-model="testSettings.timeout"
                    :min="1000"
                    :max="60000"
                    style="width: 200px"
                  />
                  <span class="form-help">单个请求的超时时间（毫秒）</span>
                </el-form-item>
                <el-form-item label="失败重试">
                  <el-input-number
                    v-model="testSettings.retries"
                    :min="0"
                    :max="5"
                    style="width: 200px"
                  />
                  <span class="form-help">失败时的重试次数</span>
                </el-form-item>
              </el-card>

              <el-card class="settings-card">
                <template #header>
                  <h4>环境设置</h4>
                </template>
                <el-form-item label="测试环境">
                  <el-select
                    v-model="testSettings.environmentId"
                    placeholder="选择测试环境"
                    style="width: 300px"
                  >
                    <el-option
                      v-for="env in environments"
                      :key="env.id"
                      :label="env.name"
                      :value="env.id"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item label="全局变量">
                  <div class="variables-editor">
                    <div
                      v-for="(variable, index) in testSettings.variables"
                      :key="index"
                      class="variable-item"
                    >
                      <el-input
                        v-model="variable.key"
                        placeholder="变量名"
                        style="width: 150px"
                      />
                      <el-input
                        v-model="variable.value"
                        placeholder="变量值"
                        style="width: 200px"
                      />
                      <el-button
                        size="small"
                        text
                        type="danger"
                        @click="removeVariable(index)"
                      >
                        <Trash2 class="btn-icon" />
                      </el-button>
                    </div>
                    <el-button size="small" @click="addVariable">
                      <Plus class="btn-icon" />
                      添加变量
                    </el-button>
                  </div>
                </el-form-item>
              </el-card>

              <div class="settings-actions">
                <el-button type="primary" @click="saveSettings">
                  保存设置
                </el-button>
                <el-button @click="resetSettings">
                  重置设置
                </el-button>
              </div>
            </el-form>
          </div>
        </el-tab-pane>

        <!-- 测试结果 -->
        <el-tab-pane label="测试结果" name="results">
          <div class="results-section">
            <div class="section-header">
              <h3>历史测试结果</h3>
              <div class="section-actions">
                <el-button @click="exportResults">
                  <Download class="btn-icon" />
                  导出结果
                </el-button>
                <el-button @click="clearResults">
                  <Trash2 class="btn-icon" />
                  清空结果
                </el-button>
              </div>
            </div>

            <div class="results-list">
              <div
                v-for="result in testResults"
                :key="result.id"
                class="result-item"
                @click="viewResultDetail(result)"
              >
                <div class="result-header">
                  <div class="result-info">
                    <h4 class="result-title">
                      测试执行 #{{ result.id }}
                    </h4>
                    <p class="result-time">
                      {{ formatTime(result.startTime) }}
                    </p>
                  </div>
                  <div class="result-status">
                    <el-tag
                      :type="getStatusTagType(result.status)"
                      size="large"
                    >
                      {{ getStatusLabel(result.status) }}
                    </el-tag>
                  </div>
                </div>
                <div class="result-stats">
                  <div class="stat-item">
                    <span class="stat-label">总数</span>
                    <span class="stat-value">{{ result.totalCount }}</span>
                  </div>
                  <div class="stat-item success">
                    <span class="stat-label">通过</span>
                    <span class="stat-value">{{ result.passedCount }}</span>
                  </div>
                  <div class="stat-item danger">
                    <span class="stat-label">失败</span>
                    <span class="stat-value">{{ result.failedCount }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">耗时</span>
                    <span class="stat-value">{{ formatDuration(result.duration) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  Play,
  Loading,
  MoreHorizontal,
  Edit,
  Copy,
  Download,
  Trash2,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Upload
} from 'lucide-vue-next'
import { useEnvironmentStore } from '@/stores/environment'

const route = useRoute()
const router = useRouter()
const environmentStore = useEnvironmentStore()

// 响应式数据
const activeTab = ref('requests')
const isRunning = ref(false)
const selectedRequests = ref([])

// 测试套件数据
const testSuite = ref({
  id: route.params.id,
  name: '用户API测试套件',
  description: '测试用户相关的所有API接口',
  requests: []
})

// 测试请求数据
const testRequests = ref([
  {
    id: '1',
    name: '获取用户列表',
    method: 'GET',
    url: '/api/users',
    status: 'passed',
    responseTime: 245
  },
  {
    id: '2',
    name: '创建用户',
    method: 'POST',
    url: '/api/users',
    status: 'failed',
    responseTime: 1200
  },
  {
    id: '3',
    name: '更新用户信息',
    method: 'PUT',
    url: '/api/users/:id',
    status: 'passed',
    responseTime: 380
  }
])

// 测试设置
const testSettings = ref({
  concurrency: 1,
  delay: 100,
  timeout: 30000,
  retries: 1,
  environmentId: '',
  variables: [
    { key: 'baseUrl', value: 'https://api.example.com' },
    { key: 'apiKey', value: 'your-api-key' }
  ]
})

// 测试结果数据
const testResults = ref([
  {
    id: '1',
    status: 'passed',
    startTime: new Date('2024-01-15T10:30:00'),
    duration: 2500,
    totalCount: 8,
    passedCount: 8,
    failedCount: 0
  },
  {
    id: '2',
    status: 'failed',
    startTime: new Date('2024-01-15T09:15:00'),
    duration: 1800,
    totalCount: 8,
    passedCount: 6,
    failedCount: 2
  }
])

// 计算属性
const environments = computed(() => environmentStore.environments)
const lastResult = computed(() => testResults.value[0])

// 方法
const goBack = () => {
  router.push('/batch-test')
}

const runTestSuite = async () => {
  isRunning.value = true
  try {
    // 模拟测试执行
    await new Promise(resolve => setTimeout(resolve, 3000))
    ElMessage.success('测试执行完成')
  } catch (error) {
    ElMessage.error('测试执行失败')
  } finally {
    isRunning.value = false
  }
}

const handleAction = async (command: string) => {
  switch (command) {
    case 'edit':
      // 编辑套件逻辑
      break
    case 'duplicate':
      ElMessage.success('测试套件已复制')
      break
    case 'export':
      ElMessage.success('测试套件已导出')
      break
    case 'delete':
      try {
        await ElMessageBox.confirm(
          '确定要删除此测试套件吗？',
          '确认删除',
          {
            confirmButtonText: '删除',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )
        ElMessage.success('测试套件已删除')
        router.push('/batch-test')
      } catch {
        // 用户取消删除
      }
      break
  }
}

const formatDuration = (ms: number | undefined) => {
  if (!ms) return '-'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

const formatTime = (date: Date | string) => {
  const d = new Date(date)
  return d.toLocaleString('zh-CN')
}

const getRequestStatusType = (status: string) => {
  const statusMap: Record<string, string> = {
    passed: 'success',
    failed: 'danger',
    pending: 'warning',
    skipped: 'info'
  }
  return statusMap[status] || 'info'
}

const getRequestStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    passed: '通过',
    failed: '失败',
    pending: '等待',
    skipped: '跳过'
  }
  return statusMap[status] || status
}

const getStatusTagType = (status: string) => {
  const statusMap: Record<string, string> = {
    passed: 'success',
    failed: 'danger',
    running: 'warning',
    cancelled: 'info'
  }
  return statusMap[status] || 'info'
}

const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    passed: '通过',
    failed: '失败',
    running: '运行中',
    cancelled: '已取消'
  }
  return statusMap[status] || status
}

const handleSelectionChange = (selection: any[]) => {
  selectedRequests.value = selection
}

const addRequest = () => {
  // 添加请求逻辑
  ElMessage.info('添加请求功能开发中')
}

const importRequests = () => {
  // 导入请求逻辑
  ElMessage.info('导入请求功能开发中')
}

const editRequest = (request: any) => {
  // 编辑请求逻辑
  ElMessage.info('编辑请求功能开发中')
}

const runSingleRequest = async (request: any) => {
  // 运行单个请求逻辑
  ElMessage.success(`正在运行请求: ${request.name}`)
}

const removeRequest = async (request: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除请求 "${request.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    // 删除请求逻辑
    ElMessage.success('请求已删除')
  } catch {
    // 用户取消删除
  }
}

const addVariable = () => {
  testSettings.value.variables.push({ key: '', value: '' })
}

const removeVariable = (index: number) => {
  testSettings.value.variables.splice(index, 1)
}

const saveSettings = () => {
  // 保存设置逻辑
  ElMessage.success('设置已保存')
}

const resetSettings = () => {
  // 重置设置逻辑
  ElMessage.success('设置已重置')
}

const exportResults = () => {
  // 导出结果逻辑
  ElMessage.success('结果已导出')
}

const clearResults = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有测试结果吗？',
      '确认清空',
      {
        confirmButtonText: '清空',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    testResults.value = []
    ElMessage.success('测试结果已清空')
  } catch {
    // 用户取消清空
  }
}

const viewResultDetail = (result: any) => {
  router.push(`/batch-test/results/${result.id}`)
}

// 生命周期
onMounted(async () => {
  await environmentStore.loadEnvironments()
})
</script>

<style scoped>
.batch-test-detail-page {
  padding: 24px;
  background-color: #f5f5f5;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding: 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.title-section {
  flex: 1;
}

.page-title {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.page-description {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn-icon {
  width: 16px;
  height: 16px;
  margin-right: 6px;
}

.menu-icon {
  width: 14px;
  height: 14px;
  margin-right: 8px;
}

.suite-info-section {
  margin-bottom: 24px;
}

.info-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.info-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background-color: #f3f4f6;
  margin-right: 16px;
}

.card-icon.success {
  background-color: #dcfce7;
  color: #16a34a;
}

.card-icon.danger {
  background-color: #fef2f2;
  color: #dc2626;
}

.card-icon.warning {
  background-color: #fefce8;
  color: #ca8a04;
}

.icon {
  width: 24px;
  height: 24px;
}

.card-content {
  flex: 1;
}

.card-value {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1;
  margin-bottom: 4px;
}

.card-label {
  font-size: 14px;
  color: #6b7280;
}

.main-content {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.detail-tabs {
  padding: 0;
}

:deep(.el-tabs__header) {
  margin: 0;
  padding: 0 24px;
  background-color: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

:deep(.el-tabs__content) {
  padding: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.section-actions {
  display: flex;
  gap: 12px;
}

.requests-table {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.request-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.method-tag {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: white;
}

.method-tag.get {
  background-color: #10b981;
}

.method-tag.post {
  background-color: #3b82f6;
}

.method-tag.put {
  background-color: #f59e0b;
}

.method-tag.delete {
  background-color: #ef4444;
}

.settings-card {
  margin-bottom: 24px;
}

.settings-card h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.form-help {
  margin-left: 12px;
  font-size: 12px;
  color: #6b7280;
}

.variables-editor {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
  background-color: #f9fafb;
}

.variable-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.variable-item:last-child {
  margin-bottom: 0;
}

.settings-actions {
  display: flex;
  gap: 12px;
  padding-top: 24px;
  border-top: 1px solid #e5e7eb;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-item {
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.result-item:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.result-title {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.result-time {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
}

.result-stats {
  display: flex;
  gap: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-item.success .stat-value {
  color: #16a34a;
}

.stat-item.danger .stat-value {
  color: #dc2626;
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
</style>