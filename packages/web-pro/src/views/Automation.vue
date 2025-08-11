<template>
  <div class="automation-page">
    <PageHeader title="自动化测试" subtitle="创建和管理自动化测试套件">
      <template #actions>
        <el-button @click="showCreateSuiteDialog = true" type="primary" size="small">
          新建测试套件
        </el-button>
        <el-button @click="runAllSuites" size="small" :loading="runningAll">
          运行所有套件
        </el-button>
        <el-button @click="showScheduleDialog = true" size="small">
          定时任务
        </el-button>
      </template>
    </PageHeader>
    
    <div class="automation-content">
      <!-- 测试套件列表 -->
      <div class="suites-section">
        <div class="section-header">
          <h3>测试套件</h3>
          <div class="section-actions">
            <el-input
              v-model="suiteSearch"
              placeholder="搜索测试套件"
              size="small"
              style="width: 200px"
              :prefix-icon="Search"
            />
            <el-select v-model="statusFilter" placeholder="状态筛选" size="small" style="width: 120px">
              <el-option label="全部" value="" />
              <el-option label="启用" value="enabled" />
              <el-option label="禁用" value="disabled" />
              <el-option label="运行中" value="running" />
            </el-select>
          </div>
        </div>
        
        <div class="suites-grid">
          <div
            v-for="suite in filteredSuites"
            :key="suite.id"
            class="suite-card"
            @click="selectSuite(suite)"
          >
            <div class="suite-header">
              <div class="suite-info">
                <h4>{{ suite.name }}</h4>
                <p>{{ suite.description }}</p>
              </div>
              
              <div class="suite-status">
                <el-tag :type="getSuiteStatusType(suite)" size="small">
                  {{ getSuiteStatusText(suite) }}
                </el-tag>
              </div>
            </div>
            
            <div class="suite-stats">
              <div class="stat-item">
                <span class="label">测试数量</span>
                <span class="value">{{ suite.tests.length }}</span>
              </div>
              <div class="stat-item">
                <span class="label">成功率</span>
                <span class="value">{{ getSuccessRate(suite) }}%</span>
              </div>
              <div class="stat-item">
                <span class="label">最后运行</span>
                <span class="value">{{ formatLastRun(suite.lastRun) }}</span>
              </div>
            </div>
            
            <div class="suite-actions">
              <el-button
                @click.stop="runSuite(suite)"
                size="small"
                type="primary"
                :loading="runningSuites.includes(suite.id)"
              >
                运行
              </el-button>
              <el-button @click.stop="editSuite(suite)" size="small">
                编辑
              </el-button>
              <el-dropdown @command="handleSuiteAction">
                <el-button size="small" text>
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :command="{ action: 'duplicate', suite }">
                      复制
                    </el-dropdown-item>
                    <el-dropdown-item :command="{ action: 'export', suite }">
                      导出
                    </el-dropdown-item>
                    <el-dropdown-item :command="{ action: 'schedule', suite }">
                      设置定时
                    </el-dropdown-item>
                    <el-dropdown-item :command="{ action: 'delete', suite }" divided class="danger">
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 测试结果 -->
      <div class="results-section" v-if="selectedSuite">
        <div class="section-header">
          <h3>{{ selectedSuite.name }} - 测试结果</h3>
          <div class="section-actions">
            <el-button @click="viewDetailedResults" size="small">
              详细报告
            </el-button>
            <el-button @click="exportResults" size="small">
              导出结果
            </el-button>
          </div>
        </div>
        
        <TestResultsTable
          :results="testResults"
          :loading="loadingResults"
          @view-details="viewTestDetails"
        />
      </div>
      
      <!-- 运行历史 -->
      <div class="history-section">
        <div class="section-header">
          <h3>运行历史</h3>
          <el-button @click="clearHistory" size="small">
            清空历史
          </el-button>
        </div>
        
        <RunHistoryChart :data="historyData" />
      </div>
    </div>
    
    <!-- 创建测试套件对话框 -->
    <CreateSuiteDialog
      v-model="showCreateSuiteDialog"
      @create="handleCreateSuite"
    />
    
    <!-- 编辑测试套件对话框 -->
    <EditSuiteDialog
      v-model="showEditSuiteDialog"
      :suite="editingSuite"
      @save="handleSaveSuite"
    />
    
    <!-- 定时任务对话框 -->
    <ScheduleDialog
      v-model="showScheduleDialog"
      :schedules="schedules"
      @save="handleSaveSchedule"
    />
    
    <!-- 测试详情对话框 -->
    <TestDetailsDialog
      v-model="showTestDetailsDialog"
      :test="selectedTest"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, MoreFilled } from '@element-plus/icons-vue'
import PageHeader from '../components/common/PageHeader.vue'
import TestResultsTable from '../components/automation/TestResultsTable.vue'
import RunHistoryChart from '../components/automation/RunHistoryChart.vue'
import CreateSuiteDialog from '../components/automation/CreateSuiteDialog.vue'
import EditSuiteDialog from '../components/automation/EditSuiteDialog.vue'
import ScheduleDialog from '../components/automation/ScheduleDialog.vue'
import TestDetailsDialog from '../components/automation/TestDetailsDialog.vue'
import { useAutomationStore } from '../stores/automation'
import { formatRelativeTime } from '@api-debug-tool/shared/utils/formatter'
import type { AutomationSuite, AutomationTest } from '@api-debug-tool/shared/types'

const automationStore = useAutomationStore()

const suiteSearch = ref('')
const statusFilter = ref('')
const selectedSuite = ref<AutomationSuite | null>(null)
const selectedTest = ref<AutomationTest | null>(null)
const runningAll = ref(false)
const runningSuites = ref<string[]>([])
const loadingResults = ref(false)
const showCreateSuiteDialog = ref(false)
const showEditSuiteDialog = ref(false)
const showScheduleDialog = ref(false)
const showTestDetailsDialog = ref(false)
const editingSuite = ref<AutomationSuite | null>(null)

const suites = computed(() => automationStore.suites)
const testResults = computed(() => automationStore.testResults)
const historyData = computed(() => automationStore.historyData)
const schedules = computed(() => automationStore.schedules)

const filteredSuites = computed(() => {
  let filtered = suites.value
  
  if (suiteSearch.value) {
    filtered = filtered.filter(suite => 
      suite.name.toLowerCase().includes(suiteSearch.value.toLowerCase()) ||
      suite.description?.toLowerCase().includes(suiteSearch.value.toLowerCase())
    )
  }
  
  if (statusFilter.value) {
    filtered = filtered.filter(suite => {
      switch (statusFilter.value) {
        case 'enabled':
          return suite.enabled
        case 'disabled':
          return !suite.enabled
        case 'running':
          return runningSuites.value.includes(suite.id)
        default:
          return true
      }
    })
  }
  
  return filtered
})

onMounted(() => {
  automationStore.loadSuites()
  automationStore.loadHistory()
})

const selectSuite = async (suite: AutomationSuite) => {
  selectedSuite.value = suite
  loadingResults.value = true
  try {
    await automationStore.loadTestResults(suite.id)
  } catch (error) {
    ElMessage.error('加载测试结果失败')
  } finally {
    loadingResults.value = false
  }
}

const getSuiteStatusType = (suite: AutomationSuite) => {
  if (runningSuites.value.includes(suite.id)) return 'warning'
  return suite.enabled ? 'success' : 'info'
}

const getSuiteStatusText = (suite: AutomationSuite) => {
  if (runningSuites.value.includes(suite.id)) return '运行中'
  return suite.enabled ? '启用' : '禁用'
}

const getSuccessRate = (suite: AutomationSuite) => {
  // 计算成功率逻辑
  return 95
}

const formatLastRun = (lastRun?: Date) => {
  return lastRun ? formatRelativeTime(lastRun) : '从未运行'
}

const runSuite = async (suite: AutomationSuite) => {
  runningSuites.value.push(suite.id)
  try {
    await automationStore.runSuite(suite.id)
    ElMessage.success(`测试套件 "${suite.name}" 运行完成`)
    if (selectedSuite.value?.id === suite.id) {
      await automationStore.loadTestResults(suite.id)
    }
  } catch (error) {
    ElMessage.error('测试运行失败')
  } finally {
    const index = runningSuites.value.indexOf(suite.id)
    if (index > -1) {
      runningSuites.value.splice(index, 1)
    }
  }
}

const runAllSuites = async () => {
  runningAll.value = true
  try {
    await automationStore.runAllSuites()
    ElMessage.success('所有测试套件运行完成')
  } catch (error) {
    ElMessage.error('批量运行失败')
  } finally {
    runningAll.value = false
  }
}

const editSuite = (suite: AutomationSuite) => {
  editingSuite.value = suite
  showEditSuiteDialog.value = true
}

const handleSuiteAction = async ({ action, suite }: { action: string, suite: AutomationSuite }) => {
  switch (action) {
    case 'duplicate':
      try {
        await automationStore.duplicateSuite(suite.id)
        ElMessage.success('测试套件已复制')
      } catch (error) {
        ElMessage.error('复制失败')
      }
      break
      
    case 'export':
      try {
        await automationStore.exportSuite(suite.id)
        ElMessage.success('导出成功')
      } catch (error) {
        ElMessage.error('导出失败')
      }
      break
      
    case 'schedule':
      // 设置定时任务
      showScheduleDialog.value = true
      break
      
    case 'delete':
      try {
        await ElMessageBox.confirm(
          `确定要删除测试套件 "${suite.name}" 吗？`,
          '确认删除',
          { type: 'warning' }
        )
        await automationStore.deleteSuite(suite.id)
        if (selectedSuite.value?.id === suite.id) {
          selectedSuite.value = null
        }
        ElMessage.success('测试套件已删除')
      } catch {
        // 用户取消
      }
      break
  }
}

const handleCreateSuite = async (suiteData: Partial<AutomationSuite>) => {
  try {
    await automationStore.createSuite(suiteData)
    ElMessage.success('测试套件已创建')
  } catch (error) {
    ElMessage.error('创建失败')
  }
}

const handleSaveSuite = async (suite: AutomationSuite) => {
  try {
    await automationStore.updateSuite(suite)
    ElMessage.success('测试套件已保存')
    editingSuite.value = null
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const handleSaveSchedule = async (schedule: any) => {
  try {
    await automationStore.saveSchedule(schedule)
    ElMessage.success('定时任务已保存')
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const viewTestDetails = (test: AutomationTest) => {
  selectedTest.value = test
  showTestDetailsDialog.value = true
}

const viewDetailedResults = () => {
  // 查看详细报告
  ElMessage.info('详细报告功能开发中')
}

const exportResults = () => {
  // 导出测试结果
  ElMessage.info('导出功能开发中')
}

const clearHistory = async () => {
  try {
    await ElMessageBox.confirm('确定要清空运行历史吗？', '确认清空', {
      type: 'warning'
    })
    await automationStore.clearHistory()
    ElMessage.success('历史记录已清空')
  } catch {
    // 用户取消
  }
}
</script>

<style lang="scss" scoped>
.automation-page {
  padding: 24px;
  
  .automation-content {
    .suites-section,
    .results-section,
    .history-section {
      background: white;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 24px;
      
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        
        h3 {
          margin: 0;
          color: #303133;
        }
        
        .section-actions {
          display: flex;
          gap: 8px;
        }
      }
    }
    
    .suites-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 16px;
      
      .suite-card {
        border: 1px solid #e4e7ed;
        border-radius: 8px;
        padding: 16px;
        cursor: pointer;
        transition: all 0.2s;
        
        &:hover {
          border-color: #409eff;
          box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
        }
        
        .suite-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
          
          .suite-info {
            flex: 1;
            
            h4 {
              margin: 0 0 4px 0;
              color: #303133;
            }
            
            p {
              margin: 0;
              color: #606266;
              font-size: 12px;
            }
          }
        }
        
        .suite-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-bottom: 16px;
          
          .stat-item {
            text-align: center;
            
            .label {
              display: block;
              font-size: 11px;
              color: #909399;
              margin-bottom: 2px;
            }
            
            .value {
              display: block;
              font-size: 14px;
              font-weight: 500;
              color: #303133;
            }
          }
        }
        
        .suite-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }
      }
    }
  }
}

.danger {
  color: #f56c6c !important;
}
</style>