<template>
  <div class="test-results-table">
    <el-table 
      :data="displayResults" 
      :loading="loading"
      @row-click="handleRowClick"
      style="width: 100%"
    >
      <el-table-column prop="testId" label="测试ID" width="120" />
      
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" size="small">
            {{ getStatusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column prop="duration" label="耗时" width="100">
        <template #default="{ row }">
          {{ row.duration }}ms
        </template>
      </el-table-column>
      
      <el-table-column prop="response.status" label="响应状态" width="100">
        <template #default="{ row }">
          <el-tag 
            :type="row.response?.status >= 200 && row.response?.status < 300 ? 'success' : 'danger'"
            size="small"
          >
            {{ row.response?.status || 'N/A' }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column prop="response.time" label="响应时间" width="100">
        <template #default="{ row }">
          {{ row.response?.time || 0 }}ms
        </template>
      </el-table-column>
      
      <el-table-column prop="assertions" label="断言" width="120">
        <template #default="{ row }">
          <span class="assertion-stats">
            <span class="passed">{{ getPassedAssertions(row) }}</span>
            /
            <span class="total">{{ row.assertions?.length || 0 }}</span>
          </span>
        </template>
      </el-table-column>
      
      <el-table-column prop="timestamp" label="执行时间" width="180">
        <template #default="{ row }">
          {{ formatTime(row.timestamp) }}
        </template>
      </el-table-column>
      
      <el-table-column prop="error" label="错误信息" min-width="200">
        <template #default="{ row }">
          <span v-if="row.error" class="error-message">
            {{ row.error }}
          </span>
          <span v-else class="no-error">无</span>
        </template>
      </el-table-column>
      
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button 
            size="small" 
            text 
            type="primary"
            @click.stop="viewDetails(row)"
          >
            详情
          </el-button>
          <el-button 
            size="small" 
            text 
            @click.stop="rerunTest(row)"
          >
            重跑
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 分页 -->
    <div class="pagination-wrapper" v-if="total > pageSize">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { TestResult } from '@/types'

interface Props {
  results: TestResult[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  'row-click': [result: TestResult]
  'view-details': [result: TestResult]
  'rerun-test': [result: TestResult]
}>()

const currentPage = ref(1)
const pageSize = ref(20)

const total = computed(() => props.results.length)

// 分页显示的测试结果数据
const displayResults = computed(() => {
  if (!props.results || props.results.length === 0) {
    return []
  }
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return props.results.slice(start, end)
})

const getStatusType = (status: string) => {
  switch (status) {
    case 'passed':
      return 'success'
    case 'failed':
      return 'danger'
    case 'skipped':
      return 'warning'
    case 'running':
      return 'primary'
    default:
      return 'info'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'passed':
      return '通过'
    case 'failed':
      return '失败'
    case 'skipped':
      return '跳过'
    case 'running':
      return '运行中'
    default:
      return '未知'
  }
}

const getPassedAssertions = (result: TestResult) => {
  if (!result.assertions) return 0
  return result.assertions.filter(assertion => assertion.passed).length
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

const handleRowClick = (row: TestResult) => {
  emit('row-click', row)
}

const viewDetails = (result: TestResult) => {
  emit('view-details', result)
}

const rerunTest = (result: TestResult) => {
  emit('rerun-test', result)
  ElMessage.info('重新运行测试...')
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}
</script>

<style scoped>
.test-results-table {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.assertion-stats {
  font-family: monospace;
}

.assertion-stats .passed {
  color: #67c23a;
  font-weight: bold;
}

.assertion-stats .total {
  color: #909399;
}

.error-message {
  color: #f56c6c;
  font-size: 12px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: inline-block;
}

.no-error {
  color: #909399;
  font-style: italic;
}

.pagination-wrapper {
  padding: 20px;
  display: flex;
  justify-content: center;
  border-top: 1px solid #ebeef5;
}

:deep(.el-table__row) {
  cursor: pointer;
}

:deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}
</style>