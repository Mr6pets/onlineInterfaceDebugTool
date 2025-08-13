<template>
  <div class="batch-testing">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1>批量测试</h1>
          <p>创建和管理API批量测试套件，支持并发执行、结果分析和报告生成</p>
        </div>
        <div class="header-actions">
          <el-button @click="showCreateDialog = true" type="primary">
            <el-icon><Plus /></el-icon>
            创建测试套件
          </el-button>
          <el-button @click="importTestSuite">
            <el-icon><Upload /></el-icon>
            导入测试
          </el-button>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-container">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon primary">
            <el-icon><DocumentCopy /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ totalSuites }}</div>
            <div class="stat-label">测试套件</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon success">
            <el-icon><CircleCheckFilled /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ passedTests }}</div>
            <div class="stat-label">通过测试</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon error">
            <el-icon><CircleCloseFilled /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ failedTests }}</div>
            <div class="stat-label">失败测试</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon info">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ averageExecutionTime }}s</div>
            <div class="stat-label">平均执行时间</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 过滤和搜索 -->
    <div class="filters-container">
      <div class="filters-content">
        <div class="search-section">
          <el-input
            v-model="searchQuery"
            placeholder="搜索测试套件名称或描述"
            prefix-icon="Search"
            style="width: 300px;"
            clearable
          />
        </div>
        
        <div class="filter-section">
          <el-select
            v-model="selectedStatus"
            placeholder="执行状态"
            style="width: 120px;"
            clearable
          >
            <el-option label="未执行" value="pending" />
            <el-option label="执行中" value="running" />
            <el-option label="已完成" value="completed" />
            <el-option label="已失败" value="failed" />
          </el-select>
          
          <el-select
            v-model="selectedEnvironment"
            placeholder="环境"
            style="width: 150px;"
            clearable
          >
            <el-option
              v-for="env in environments"
              :key="env.id"
              :label="env.name"
              :value="env.id"
            />
          </el-select>
          
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            style="width: 350px;"
            clearable
          />
        </div>
        
        <div class="view-options">
          <el-button-group>
            <el-button
              :type="viewMode === 'grid' ? 'primary' : 'default'"
              @click="viewMode = 'grid'"
              size="small"
            >
              <el-icon><Grid /></el-icon>
            </el-button>
            <el-button
              :type="viewMode === 'list' ? 'primary' : 'default'"
              @click="viewMode = 'list'"
              size="small"
            >
              <el-icon><List /></el-icon>
            </el-button>
          </el-button-group>
        </div>
      </div>
    </div>

    <!-- 测试套件列表 -->
    <div class="suites-container">
      <!-- 网格视图 -->
      <div v-if="viewMode === 'grid'" class="suites-grid">
        <div
          v-for="suite in filteredSuites"
          :key="suite.id"
          class="suite-card"
          @click="viewSuiteDetails(suite)"
        >
          <div class="card-header">
            <div class="suite-info">
              <h3 class="suite-name">{{ suite.name }}</h3>
              <p class="suite-description">{{ suite.description }}</p>
            </div>
            <div class="suite-status">
              <el-tag
                :type="getStatusTagType(suite.status)"
                size="small"
              >
                {{ getStatusText(suite.status) }}
              </el-tag>
            </div>
          </div>
          
          <div class="card-stats">
            <div class="stat-item">
              <span class="stat-label">测试数量</span>
              <span class="stat-value">{{ suite.testCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">通过率</span>
              <span class="stat-value">{{ suite.passRate }}%</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">执行时间</span>
              <span class="stat-value">{{ suite.executionTime }}s</span>
            </div>
          </div>
          
          <div class="card-progress" v-if="suite.status === 'running'">
            <el-progress
              :percentage="suite.progress"
              :show-text="false"
              :stroke-width="4"
            />
            <span class="progress-text">{{ suite.progress }}%</span>
          </div>
          
          <div class="card-footer">
            <div class="suite-meta">
              <span class="environment">{{ getEnvironmentName(suite.environmentId) }}</span>
              <span class="last-run">{{ formatTime(suite.lastRunAt) }}</span>
            </div>
            <div class="suite-actions" @click.stop>
              <el-button
                type="text"
                size="small"
                @click="runSuite(suite)"
                :loading="suite.status === 'running'"
                :disabled="suite.status === 'running'"
              >
                <el-icon><VideoPlay /></el-icon>
              </el-button>
              <el-dropdown @command="(command: string) => handleSuiteAction(command, suite)" trigger="click">
                <el-button type="text" size="small">
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit">编辑</el-dropdown-item>
                    <el-dropdown-item command="duplicate">复制</el-dropdown-item>
                    <el-dropdown-item command="export">导出</el-dropdown-item>
                    <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 列表视图 -->
      <div v-else class="suites-list">
        <div class="list-header">
          <div class="bulk-actions" v-if="selectedSuites.length > 0">
            <span class="selected-count">已选择 {{ selectedSuites.length }} 项</span>
            <el-button @click="bulkRunSuites" size="small">
              <el-icon><VideoPlay /></el-icon>
              批量执行
            </el-button>
            <el-button @click="bulkDeleteSuites" type="danger" size="small">
              <el-icon><Delete /></el-icon>
              批量删除
            </el-button>
          </div>
          
          <div class="sort-options">
            <el-select v-model="sortBy" size="small" style="width: 150px;">
              <el-option label="创建时间" value="created_desc" />
              <el-option label="最后执行" value="last_run" />
              <el-option label="通过率" value="pass_rate" />
              <el-option label="名称" value="name" />
            </el-select>
          </div>
        </div>
        
        <div class="list-items">
          <div
            v-for="suite in filteredSuites"
            :key="suite.id"
            class="suite-item"
            :class="{ selected: selectedSuites.includes(suite.id) }"
          >
            <div class="item-checkbox">
              <el-checkbox
                :model-value="selectedSuites.includes(suite.id)"
                @change="toggleSuiteSelection(suite.id)"
              />
            </div>
            
            <div class="item-info" @click="viewSuiteDetails(suite)">
              <div class="suite-name">{{ suite.name }}</div>
              <div class="suite-description">{{ suite.description }}</div>
            </div>
            
            <div class="item-stats">
              <div class="stat-item">
                <span class="stat-label">测试</span>
                <span class="stat-value">{{ suite.testCount }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">通过率</span>
                <span class="stat-value">{{ suite.passRate }}%</span>
              </div>
            </div>
            
            <div class="item-status">
              <el-tag
                :type="getStatusTagType(suite.status)"
                size="small"
              >
                {{ getStatusText(suite.status) }}
              </el-tag>
            </div>
            
            <div class="item-environment">
              <span>{{ getEnvironmentName(suite.environmentId) }}</span>
            </div>
            
            <div class="item-time">
              <span>{{ formatTime(suite.lastRunAt) }}</span>
            </div>
            
            <div class="item-actions">
              <el-button
                type="text"
                size="small"
                @click="runSuite(suite)"
                :loading="suite.status === 'running'"
                :disabled="suite.status === 'running'"
                title="执行测试"
              >
                <el-icon><VideoPlay /></el-icon>
              </el-button>
              <el-button
                type="text"
                size="small"
                @click="viewSuiteDetails(suite)"
                title="查看详情"
              >
                <el-icon><View /></el-icon>
              </el-button>
              <el-dropdown @command="(command: string) => handleSuiteAction(command, suite)" trigger="click">
                <el-button type="text" size="small">
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit">编辑</el-dropdown-item>
                    <el-dropdown-item command="duplicate">复制</el-dropdown-item>
                    <el-dropdown-item command="export">导出</el-dropdown-item>
                    <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[12, 24, 48, 96]"
        :total="totalItems"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 创建测试套件对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="创建测试套件"
      width="600px"
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
        <el-form-item label="执行环境" prop="environmentId">
          <el-select v-model="createForm.environmentId" placeholder="选择执行环境">
            <el-option
              v-for="env in environments"
              :key="env.id"
              :label="env.name"
              :value="env.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="并发数" prop="concurrency">
          <el-input-number
            v-model="createForm.concurrency"
            :min="1"
            :max="10"
            placeholder="并发执行数量"
          />
        </el-form-item>
        <el-form-item label="超时时间" prop="timeout">
          <el-input-number
            v-model="createForm.timeout"
            :min="1000"
            :max="60000"
            :step="1000"
            placeholder="超时时间（毫秒）"
          />
        </el-form-item>
        <el-form-item label="失败策略">
          <el-radio-group v-model="createForm.failureStrategy">
            <el-radio value="continue">继续执行</el-radio>
            <el-radio value="stop">立即停止</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showCreateDialog = false">取消</el-button>
          <el-button type="primary" @click="handleCreateSuite" :loading="creating">
            创建
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 测试套件详情对话框 -->
    <el-dialog
      v-model="showDetailsDialog"
      :title="selectedSuite?.name"
      width="90%"
      top="5vh"
    >
      <div v-if="selectedSuite" class="suite-details">
        <!-- 套件信息 -->
        <div class="details-header">
          <div class="suite-summary">
            <div class="summary-item">
              <label>状态:</label>
              <el-tag :type="getStatusTagType(selectedSuite.status)" size="small">
                {{ getStatusText(selectedSuite.status) }}
              </el-tag>
            </div>
            <div class="summary-item">
              <label>环境:</label>
              <span>{{ getEnvironmentName(selectedSuite.environmentId) }}</span>
            </div>
            <div class="summary-item">
              <label>测试数量:</label>
              <span>{{ selectedSuite.testCount }}</span>
            </div>
            <div class="summary-item">
              <label>通过率:</label>
              <span>{{ selectedSuite.passRate }}%</span>
            </div>
            <div class="summary-item">
              <label>执行时间:</label>
              <span>{{ selectedSuite.executionTime }}s</span>
            </div>
            <div class="summary-item">
              <label>最后执行:</label>
              <span>{{ formatTime(selectedSuite.lastRunAt) }}</span>
            </div>
          </div>
          
          <div class="suite-actions">
            <el-button
              type="primary"
              @click="runSuite(selectedSuite)"
              :loading="selectedSuite.status === 'running'"
              :disabled="selectedSuite.status === 'running'"
            >
              <el-icon><VideoPlay /></el-icon>
              执行测试
            </el-button>
            <el-button @click="editSuite(selectedSuite)">
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button @click="exportSuite(selectedSuite)">
              <el-icon><Download /></el-icon>
              导出
            </el-button>
          </div>
        </div>
        
        <!-- 执行进度 -->
        <div v-if="selectedSuite.status === 'running'" class="execution-progress">
          <div class="progress-header">
            <h3>执行进度</h3>
            <span class="progress-text">{{ selectedSuite.progress }}%</span>
          </div>
          <el-progress
            :percentage="selectedSuite.progress"
            :stroke-width="8"
            status="success"
          />
          <div class="progress-stats">
            <span>已完成: {{ Math.floor(selectedSuite.testCount * selectedSuite.progress / 100) }}</span>
            <span>剩余: {{ selectedSuite.testCount - Math.floor(selectedSuite.testCount * selectedSuite.progress / 100) }}</span>
          </div>
        </div>
        
        <!-- 详细信息标签页 -->
        <el-tabs v-model="detailsActiveTab">
          <el-tab-pane label="测试用例" name="test-cases">
            <div class="test-cases">
              <div class="cases-toolbar">
                <el-button @click="addTestCase" size="small">
                  <el-icon><Plus /></el-icon>
                  添加测试用例
                </el-button>
                <el-button @click="importFromCollection" size="small">
                  <el-icon><FolderOpened /></el-icon>
                  从集合导入
                </el-button>
              </div>
              
              <div class="cases-list">
                <div
                  v-for="(testCase, index) in selectedSuite.testCases"
                  :key="testCase.id"
                  class="test-case-item"
                >
                  <div class="case-header">
                    <div class="case-info">
                      <el-tag
                        :type="getMethodTagType(testCase.method)"
                        size="small"
                        class="method-tag"
                      >
                        {{ testCase.method }}
                      </el-tag>
                      <span class="case-name">{{ testCase.name }}</span>
                      <span class="case-url">{{ testCase.url }}</span>
                    </div>
                    <div class="case-status">
                      <el-tag
                        v-if="testCase.status"
                        :type="getTestStatusTagType(testCase.status)"
                        size="small"
                      >
                        {{ getTestStatusText(testCase.status) }}
                      </el-tag>
                      <span v-if="testCase.responseTime" class="response-time">
                        {{ testCase.responseTime }}ms
                      </span>
                    </div>
                  </div>
                  
                  <div class="case-assertions" v-if="testCase.assertions?.length">
                    <div class="assertions-title">断言:</div>
                    <div class="assertions-list">
                      <div
                        v-for="assertion in testCase.assertions"
                        :key="assertion.id"
                        class="assertion-item"
                        :class="{ failed: assertion.status === 'failed' }"
                      >
                        <el-icon v-if="assertion.status === 'passed'" class="assertion-icon success">
                          <CircleCheckFilled />
                        </el-icon>
                        <el-icon v-else-if="assertion.status === 'failed'" class="assertion-icon error">
                          <CircleCloseFilled />
                        </el-icon>
                        <span class="assertion-text">{{ assertion.description }}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div class="case-actions">
                    <el-button type="text" size="small" @click="editTestCase(testCase)">
                      编辑
                    </el-button>
                    <el-button type="text" size="small" @click="runSingleTest(testCase)">
                      单独执行
                    </el-button>
                    <el-button type="text" size="small" @click="removeTestCase(index)">
                      删除
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="执行历史" name="execution-history">
            <div class="execution-history">
              <div
                v-for="execution in selectedSuite.executionHistory"
                :key="execution.id"
                class="execution-item"
              >
                <div class="execution-header">
                  <div class="execution-info">
                    <el-tag
                      :type="getStatusTagType(execution.status)"
                      size="small"
                    >
                      {{ getStatusText(execution.status) }}
                    </el-tag>
                    <span class="execution-time">{{ formatTime(execution.startTime) }}</span>
                    <span class="execution-duration">耗时: {{ execution.duration }}s</span>
                  </div>
                  <div class="execution-stats">
                    <span class="passed">通过: {{ execution.passedCount }}</span>
                    <span class="failed">失败: {{ execution.failedCount }}</span>
                    <span class="total">总计: {{ execution.totalCount }}</span>
                  </div>
                </div>
                
                <div class="execution-actions">
                  <el-button type="text" size="small" @click="viewExecutionReport(execution)">
                    查看报告
                  </el-button>
                  <el-button type="text" size="small" @click="downloadReport(execution)">
                    下载报告
                  </el-button>
                </div>
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="配置" name="configuration">
            <div class="suite-configuration">
              <el-form :model="selectedSuite" label-width="120px">
                <el-form-item label="并发数">
                  <el-input-number
                    v-model="selectedSuite.concurrency"
                    :min="1"
                    :max="10"
                  />
                </el-form-item>
                <el-form-item label="超时时间">
                  <el-input-number
                    v-model="selectedSuite.timeout"
                    :min="1000"
                    :max="60000"
                    :step="1000"
                  />
                  <span class="form-help">毫秒</span>
                </el-form-item>
                <el-form-item label="失败策略">
                  <el-radio-group v-model="selectedSuite.failureStrategy">
                    <el-radio value="continue">继续执行</el-radio>
                    <el-radio value="stop">立即停止</el-radio>
                  </el-radio-group>
                </el-form-item>
                <el-form-item label="重试次数">
                  <el-input-number
                    v-model="selectedSuite.retryCount"
                    :min="0"
                    :max="5"
                  />
                </el-form-item>
                <el-form-item label="延迟时间">
                  <el-input-number
                    v-model="selectedSuite.delay"
                    :min="0"
                    :max="5000"
                    :step="100"
                  />
                  <span class="form-help">毫秒，请求间延迟</span>
                </el-form-item>
              </el-form>
              
              <div class="config-actions">
                <el-button type="primary" @click="saveSuiteConfig">
                  保存配置
                </el-button>
                <el-button @click="resetSuiteConfig">
                  重置
                </el-button>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showDetailsDialog = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import {
  Plus,
  Upload,
  DocumentCopy,
  CircleCheckFilled,
  CircleCloseFilled,
  Clock,
  Grid,
  List,
  VideoPlay,
  MoreFilled,
  Delete,
  View,
  Edit,
  Download,
  FolderOpened
} from '@element-plus/icons-vue'
import type { Environment } from '@shared/types'
// 类型定义
interface TestAssertion {
  id: string
  description: string
  status: 'passed' | 'failed'
}

interface TestCase {
  id: string
  name: string
  method: string
  url: string
  status: 'passed' | 'failed' | 'pending'
  responseTime: number
  assertions: TestAssertion[]
}

interface ExecutionHistory {
  id: string
  status: 'completed' | 'running' | 'failed'
  startTime: Date
  duration: number
  passedCount: number
  failedCount: number
  totalCount: number
}

interface TestSuite {
  id: string
  name: string
  description: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  environmentId: string
  testCount: number
  passRate: number
  executionTime: number
  progress: number
  lastRunAt: Date
  concurrency: number
  timeout: number
  failureStrategy: 'continue' | 'stop'
  retryCount: number
  delay: number
  testCases: TestCase[]
  executionHistory: ExecutionHistory[]
}



interface CreateForm {
  name: string
  description: string
  environmentId: string
  concurrency: number
  timeout: number
  failureStrategy: 'continue' | 'stop'
}

// 响应式数据
const searchQuery = ref('')
const selectedStatus = ref('')
const selectedEnvironment = ref('')
const dateRange = ref<[Date, Date] | null>(null)
const viewMode = ref('grid')
const sortBy = ref('created_desc')
const currentPage = ref(1)
const pageSize = ref(12)
const selectedSuites = ref<string[]>([])
const showCreateDialog = ref(false)
const showDetailsDialog = ref(false)
const selectedSuite = ref<TestSuite | null>(null)
const detailsActiveTab = ref('test-cases')
const creating = ref(false)

// 表单引用
const createFormRef = ref<FormInstance>()

// 创建表单
const createForm = ref<CreateForm>({
  name: '',
  description: '',
  environmentId: '',
  concurrency: 1,
  timeout: 30000,
  failureStrategy: 'continue'
})

// 模拟数据
const testSuites = ref<TestSuite[]>([
  {
    id: '1',
    name: '用户管理API测试',
    description: '测试用户相关的所有API接口',
    status: 'completed',
    environmentId: 'dev',
    testCount: 15,
    passRate: 87,
    executionTime: 45,
    progress: 100,
    lastRunAt: new Date(Date.now() - 1000 * 60 * 30),
    concurrency: 2,
    timeout: 30000,
    failureStrategy: 'continue',
    retryCount: 1,
    delay: 100,
    testCases: [
      {
        id: '1',
        name: '获取用户列表',
        method: 'GET',
        url: '/api/users',
        status: 'passed',
        responseTime: 156,
        assertions: [
          { id: '1', description: '状态码为200', status: 'passed' },
          { id: '2', description: '返回数据为数组', status: 'passed' }
        ]
      },
      {
        id: '2',
        name: '创建用户',
        method: 'POST',
        url: '/api/users',
        status: 'failed',
        responseTime: 234,
        assertions: [
          { id: '1', description: '状态码为201', status: 'failed' },
          { id: '2', description: '返回用户ID', status: 'passed' }
        ]
      }
    ],
    executionHistory: [
      {
        id: '1',
        status: 'completed',
        startTime: new Date(Date.now() - 1000 * 60 * 30),
        duration: 45,
        passedCount: 13,
        failedCount: 2,
        totalCount: 15
      }
    ]
  },
  {
    id: '2',
    name: '订单系统测试',
    description: '测试订单创建、查询、更新等功能',
    status: 'running',
    environmentId: 'test',
    testCount: 8,
    passRate: 0,
    executionTime: 0,
    progress: 65,
    lastRunAt: new Date(),
    concurrency: 1,
    timeout: 30000,
    failureStrategy: 'stop',
    retryCount: 0,
    delay: 0,
    testCases: [],
    executionHistory: []
  },
  {
    id: '3',
    name: '支付接口测试',
    description: '测试支付相关接口的稳定性和安全性',
    status: 'pending',
    environmentId: 'prod',
    testCount: 12,
    passRate: 95,
    executionTime: 78,
    progress: 0,
    lastRunAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    concurrency: 1,
    timeout: 60000,
    failureStrategy: 'continue',
    retryCount: 2,
    delay: 500,
    testCases: [],
    executionHistory: []
  }
])

const environments = ref<Environment[]>([
  {
    id: 'dev',
    name: '开发环境',
    variables: {},
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'test',
    name: '测试环境',
    variables: {},
    isActive: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'prod',
    name: '生产环境',
    variables: {},
    isActive: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
])

// 表单验证规则
const createFormRules = {
  name: [
    { required: true, message: '请输入测试套件名称', trigger: 'blur' }
  ],
  environmentId: [
    { required: true, message: '请选择执行环境', trigger: 'change' }
  ]
}

// 计算属性
const filteredSuites = computed(() => {
  let filtered = testSuites.value
  
  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(suite => 
      suite.name.toLowerCase().includes(query) ||
      suite.description.toLowerCase().includes(query)
    )
  }
  
  // 状态过滤
  if (selectedStatus.value) {
    filtered = filtered.filter(suite => suite.status === selectedStatus.value)
  }
  
  // 环境过滤
  if (selectedEnvironment.value) {
    filtered = filtered.filter(suite => suite.environmentId === selectedEnvironment.value)
  }
  
  // 时间范围过滤
  if (dateRange.value) {
    const [start, end] = dateRange.value
    filtered = filtered.filter(suite => 
      suite.lastRunAt >= start && suite.lastRunAt <= end
    )
  }
  
  // 排序
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'created_desc':
        return b.lastRunAt.getTime() - a.lastRunAt.getTime()
      case 'last_run':
        return b.lastRunAt.getTime() - a.lastRunAt.getTime()
      case 'pass_rate':
        return b.passRate - a.passRate
      case 'name':
        return a.name.localeCompare(b.name)
      default:
        return 0
    }
  })
  
  return filtered
})

const totalItems = computed(() => filteredSuites.value.length)

const totalSuites = computed(() => testSuites.value.length)

const passedTests = computed(() => {
  return testSuites.value.reduce((sum, suite) => {
    return sum + Math.floor(suite.testCount * suite.passRate / 100)
  }, 0)
})

const failedTests = computed(() => {
  return testSuites.value.reduce((sum, suite) => {
    return sum + (suite.testCount - Math.floor(suite.testCount * suite.passRate / 100))
  }, 0)
})

const averageExecutionTime = computed(() => {
  const completedSuites = testSuites.value.filter(suite => suite.status === 'completed')
  if (completedSuites.length === 0) return 0
  
  const total = completedSuites.reduce((sum, suite) => sum + suite.executionTime, 0)
  return Math.round(total / completedSuites.length)
})

// 方法
const getStatusTagType = (status: string) => {
  const types: Record<string, string> = {
    pending: 'info',
    running: 'warning',
    completed: 'success',
    failed: 'danger'
  }
  return types[status] || 'info'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: '未执行',
    running: '执行中',
    completed: '已完成',
    failed: '已失败'
  }
  return texts[status] || status
}

const getMethodTagType = (method: string) => {
  const types: Record<string, string> = {
    GET: 'success',
    POST: 'primary',
    PUT: 'warning',
    PATCH: 'info',
    DELETE: 'danger'
  }
  return types[method] || 'info'
}

const getTestStatusTagType = (status: string) => {
  const types: Record<string, string> = {
    passed: 'success',
    failed: 'danger',
    skipped: 'info'
  }
  return types[status] || 'info'
}

const getTestStatusText = (status: string) => {
  const texts: Record<string, string> = {
    passed: '通过',
    failed: '失败',
    skipped: '跳过'
  }
  return texts[status] || status
}

const formatTime = (date: Date) => {
  return date.toLocaleString('zh-CN')
}

const getEnvironmentName = (environmentId: string) => {
  const env = environments.value.find(e => e.id === environmentId)
  return env?.name || '未知环境'
}

const toggleSuiteSelection = (suiteId: string) => {
  const index = selectedSuites.value.indexOf(suiteId)
  if (index > -1) {
    selectedSuites.value.splice(index, 1)
  } else {
    selectedSuites.value.push(suiteId)
  }
}

const viewSuiteDetails = (suite: TestSuite) => {
  selectedSuite.value = suite
  showDetailsDialog.value = true
}

const runSuite = async (suite: TestSuite) => {
  if (suite.status === 'running') return
  
  suite.status = 'running' as const
  suite.progress = 0
  
  // 模拟执行过程
  const interval = setInterval(() => {
    suite.progress += Math.random() * 20
    if (suite.progress >= 100) {
      suite.progress = 100
      suite.status = 'completed' as const
      suite.lastRunAt = new Date()
      suite.executionTime = Math.floor(Math.random() * 60) + 30
      clearInterval(interval)
      ElMessage.success(`测试套件 "${suite.name}" 执行完成`)
    }
  }, 1000)
  
  ElMessage.info(`开始执行测试套件 "${suite.name}"`)
}

const handleSuiteAction = async (command: string, suite: TestSuite) => {
  switch (command) {
    case 'edit':
      await editSuite(suite)
      break
    case 'duplicate':
      await duplicateSuite(suite)
      break
    case 'export':
      await exportSuite(suite)
      break
    case 'delete':
      await deleteSuite(suite)
      break
  }
}

const editSuite = async (_suite: TestSuite) => {
  ElMessage.info('编辑功能开发中')
}

const duplicateSuite = async (suite: TestSuite) => {
  const newSuite: TestSuite = {
    ...suite,
    id: Date.now().toString(),
    name: `${suite.name} (副本)`,
    status: 'pending' as const,
    progress: 0,
    lastRunAt: new Date()
  }
  
  testSuites.value.unshift(newSuite)
  ElMessage.success('测试套件已复制')
}

const exportSuite = async (suite: TestSuite) => {
  const data = {
    name: suite.name,
    description: suite.description,
    testCases: suite.testCases,
    configuration: {
      concurrency: suite.concurrency,
      timeout: suite.timeout,
      failureStrategy: suite.failureStrategy,
      retryCount: suite.retryCount,
      delay: suite.delay
    }
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${suite.name}.json`
  a.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success('测试套件已导出')
}

const deleteSuite = async (suite: TestSuite) => {
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
    
    const index = testSuites.value.findIndex(s => s.id === suite.id)
    if (index > -1) {
      testSuites.value.splice(index, 1)
    }
    
    ElMessage.success('测试套件已删除')
  } catch (error) {
    // 用户取消删除
  }
}

const bulkRunSuites = async () => {
  for (const suiteId of selectedSuites.value) {
    const suite = testSuites.value.find(s => s.id === suiteId)
    if (suite && suite.status !== 'running') {
      await runSuite(suite)
    }
  }
  selectedSuites.value = []
}

const bulkDeleteSuites = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedSuites.value.length} 个测试套件吗？`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    selectedSuites.value.forEach(suiteId => {
      const index = testSuites.value.findIndex(s => s.id === suiteId)
      if (index > -1) {
        testSuites.value.splice(index, 1)
      }
    })
    
    selectedSuites.value = []
    ElMessage.success('批量删除成功')
  } catch (error) {
    // 用户取消删除
  }
}

const importTestSuite = () => {
  ElMessage.info('导入功能开发中')
}

const handleCreateSuite = async () => {
  if (!createFormRef.value) return
  
  try {
    await createFormRef.value.validate()
    creating.value = true
    
    // 模拟创建测试套件
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const newSuite: TestSuite = {
      id: Date.now().toString(),
      ...createForm.value,
      status: 'pending' as const,
      testCount: 0,
      passRate: 0,
      executionTime: 0,
      progress: 0,
      lastRunAt: new Date(),
      retryCount: 0,
      delay: 0,
      testCases: [],
      executionHistory: []
    }
    
    testSuites.value.unshift(newSuite)
    showCreateDialog.value = false
    resetCreateForm()
    ElMessage.success('测试套件创建成功')
  } catch (error) {
    console.error('Failed to create test suite:', error)
  } finally {
    creating.value = false
  }
}

const resetCreateForm = () => {
  createForm.value = {
    name: '',
    description: '',
    environmentId: '',
    concurrency: 1,
    timeout: 30000,
    failureStrategy: 'continue'
  }
  createFormRef.value?.resetFields()
}

const addTestCase = () => {
  ElMessage.info('添加测试用例功能开发中')
}

const importFromCollection = () => {
  ElMessage.info('从集合导入功能开发中')
}

const editTestCase = (_testCase: TestCase) => {
  ElMessage.info('编辑测试用例功能开发中')
}

const runSingleTest = (_testCase: TestCase) => {
  ElMessage.info('单独执行测试功能开发中')
}

const removeTestCase = (index: number) => {
  if (selectedSuite.value) {
    selectedSuite.value.testCases.splice(index, 1)
    selectedSuite.value.testCount = selectedSuite.value.testCases.length
  }
}

const viewExecutionReport = (_execution: ExecutionHistory) => {
  ElMessage.info('查看执行报告功能开发中')
}

const downloadReport = (_execution: ExecutionHistory) => {
  ElMessage.info('下载报告功能开发中')
}

const saveSuiteConfig = () => {
  ElMessage.success('配置已保存')
}

const resetSuiteConfig = () => {
  ElMessage.info('配置已重置')
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
}

const handleCurrentChange = (page: number) => {
  currentPage.value = page
}

// 生命周期
onMounted(() => {
  // 初始化数据
})
</script>

<style scoped>
.batch-testing {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.page-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-left h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.header-left p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.stats-container {
  padding: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid #e5e7eb;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-icon.success {
  background: #dcfce7;
  color: #16a34a;
}

.stat-icon.error {
  background: #fef2f2;
  color: #dc2626;
}

.stat-icon.info {
  background: #eff6ff;
  color: #2563eb;
}

.stat-icon.primary {
  background: #f0f9ff;
  color: #0ea5e9;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
}

.filters-container {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 24px;
}

.filters-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.filter-section {
  display: flex;
  gap: 12px;
  align-items: center;
}

.suites-container {
  flex: 1;
  overflow: hidden;
  padding: 24px;
}

.suites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
  max-height: calc(100vh - 400px);
  overflow-y: auto;
}

.suite-card {
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.suite-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.suite-info {
  flex: 1;
  min-width: 0;
}

.suite-name {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.suite-description {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stat-item {
  text-align: center;
}

.stat-item .stat-label {
  display: block;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.stat-item .stat-value {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.card-progress {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-text {
  font-size: 12px;
  color: #6b7280;
  min-width: 35px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.suite-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #6b7280;
}

.suite-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.suite-card:hover .suite-actions {
  opacity: 1;
}

.suites-list {
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.list-header {
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.bulk-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.selected-count {
  font-size: 14px;
  color: #1e40af;
  font-weight: 500;
}

.list-items {
  max-height: calc(100vh - 400px);
  overflow-y: auto;
}

.suite-item {
  display: grid;
  grid-template-columns: 40px 1fr 200px 100px 120px 120px 120px;
  gap: 16px;
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
  align-items: center;
  transition: background-color 0.2s;
}

.suite-item:hover {
  background: #f9fafb;
}

.suite-item.selected {
  background: #eff6ff;
}

.suite-item:last-child {
  border-bottom: none;
}

.item-info {
  min-width: 0;
  cursor: pointer;
}

.suite-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.suite-description {
  font-size: 12px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-stats {
  display: flex;
  gap: 16px;
}

.item-stats .stat-item {
  text-align: center;
}

.item-stats .stat-label {
  display: block;
  font-size: 10px;
  color: #6b7280;
  margin-bottom: 2px;
}

.item-stats .stat-value {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #1f2937;
}

.item-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.suite-item:hover .item-actions {
  opacity: 1;
}

.pagination-container {
  background: white;
  border-top: 1px solid #e5e7eb;
  padding: 16px 24px;
  display: flex;
  justify-content: center;
}

.suite-details {
  max-height: 70vh;
  overflow-y: auto;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.suite-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
  flex: 1;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-item label {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.suite-actions {
  display: flex;
  gap: 8px;
  margin-left: 24px;
}

.execution-progress {
  margin-bottom: 24px;
  padding: 16px;
  background: #f0f9ff;
  border-radius: 6px;
  border: 1px solid #bfdbfe;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.progress-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.progress-stats {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #6b7280;
}

.test-cases {
  max-height: 400px;
  overflow-y: auto;
}

.cases-toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.test-case-item {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 12px;
  background: #f9fafb;
}

.case-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.case-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.method-tag {
  font-size: 10px;
  padding: 2px 6px;
  min-width: 50px;
  text-align: center;
}

.case-name {
  font-weight: 600;
  color: #1f2937;
  margin-right: 12px;
}

.case-url {
  color: #6b7280;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.case-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.response-time {
  font-size: 12px;
  color: #6b7280;
}

.case-assertions {
  margin-bottom: 12px;
}

.assertions-title {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
  font-weight: 500;
}

.assertions-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.assertion-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  background: white;
}

.assertion-item.failed {
  background: #fef2f2;
}

.assertion-icon {
  font-size: 14px;
}

.assertion-icon.success {
  color: #16a34a;
}

.assertion-icon.error {
  color: #dc2626;
}

.case-actions {
  display: flex;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.test-case-item:hover .case-actions {
  opacity: 1;
}

.execution-history {
  max-height: 400px;
  overflow-y: auto;
}

.execution-item {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 12px;
  background: #f9fafb;
}

.execution-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.execution-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.execution-time {
  font-size: 12px;
  color: #6b7280;
}

.execution-duration {
  font-size: 12px;
  color: #6b7280;
}

.execution-stats {
  display: flex;
  gap: 16px;
  font-size: 12px;
}

.execution-stats .passed {
  color: #16a34a;
}

.execution-stats .failed {
  color: #dc2626;
}

.execution-stats .total {
  color: #6b7280;
}

.execution-actions {
  display: flex;
  gap: 8px;
}

.suite-configuration {
  max-height: 400px;
  overflow-y: auto;
}

.form-help {
  font-size: 12px;
  color: #6b7280;
  margin-left: 8px;
}

.config-actions {
  margin-top: 24px;
  display: flex;
  gap: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 1024px) {
  .filters-content {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .filter-section {
    flex-wrap: wrap;
  }
  
  .suites-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
  
  .suite-item {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .details-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .suite-actions {
    margin-left: 0;
  }
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 16px;
  }
  
  .header-actions {
    flex-wrap: wrap;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .suites-grid {
    grid-template-columns: 1fr;
  }
  
  .suite-summary {
    grid-template-columns: 1fr;
  }
  
  .case-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>