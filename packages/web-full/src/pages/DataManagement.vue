<template>
  <div class="data-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1>数据管理</h1>
          <p>管理工作空间数据，包括导入导出、备份恢复、数据同步等功能</p>
        </div>
        <div class="header-actions">
          <el-button @click="showBackupDialog = true">
            <el-icon><Download /></el-icon>
            创建备份
          </el-button>
          <el-button @click="showImportDialog = true" type="primary">
            <el-icon><Upload /></el-icon>
            导入数据
          </el-button>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-container">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon primary">
            <el-icon><FolderOpened /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ totalCollections }}</div>
            <div class="stat-label">API集合</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon success">
            <el-icon><Setting /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ totalEnvironments }}</div>
            <div class="stat-label">环境配置</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon info">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ totalHistory }}</div>
            <div class="stat-label">历史记录</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon warning">
            <el-icon><DocumentCopy /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ formatSize(totalDataSize) }}</div>
            <div class="stat-label">数据大小</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主要功能区域 -->
    <div class="main-content">
      <el-tabs v-model="activeTab" class="data-tabs">
        <!-- 导入导出 -->
        <el-tab-pane label="导入导出" name="import-export">
          <div class="tab-content">
            <div class="section-grid">
              <!-- 导出数据 -->
              <div class="section-card">
                <div class="card-header">
                  <h3>导出数据</h3>
                  <p>将工作空间数据导出为不同格式</p>
                </div>
                
                <div class="export-options">
                  <div class="option-group">
                    <h4>选择数据类型</h4>
                    <el-checkbox-group v-model="exportOptions.dataTypes">
                      <el-checkbox value="collections">API集合</el-checkbox>
                      <el-checkbox value="environments">环境配置</el-checkbox>
                      <el-checkbox value="history">历史记录</el-checkbox>
                      <el-checkbox value="settings">工作空间设置</el-checkbox>
                    </el-checkbox-group>
                  </div>
                  
                  <div class="option-group">
                    <h4>导出格式</h4>
                    <el-radio-group v-model="exportOptions.format">
                      <el-radio value="json">JSON</el-radio>
                      <el-radio value="postman">Postman</el-radio>
                      <el-radio value="openapi">OpenAPI</el-radio>
                      <el-radio value="insomnia">Insomnia</el-radio>
                    </el-radio-group>
                  </div>
                  
                  <div class="option-group">
                    <h4>导出选项</h4>
                    <el-checkbox v-model="exportOptions.includeSecrets">包含敏感数据</el-checkbox>
                    <el-checkbox v-model="exportOptions.compress">压缩文件</el-checkbox>
                  </div>
                </div>
                
                <div class="card-actions">
                  <el-button type="primary" @click="exportData" :loading="exporting">
                    <el-icon><Download /></el-icon>
                    导出数据
                  </el-button>
                </div>
              </div>
              
              <!-- 导入数据 -->
              <div class="section-card">
                <div class="card-header">
                  <h3>导入数据</h3>
                  <p>从文件或其他工具导入数据</p>
                </div>
                
                <div class="import-area">
                  <el-upload
                    ref="uploadRef"
                    class="upload-dragger"
                    drag
                    :auto-upload="false"
                    :on-change="handleFileChange"
                    :show-file-list="false"
                    accept=".json,.har,.postman_collection,.yaml,.yml"
                  >
                    <el-icon class="upload-icon"><UploadFilled /></el-icon>
                    <div class="upload-text">
                      <p>将文件拖拽到此处，或<em>点击上传</em></p>
                      <p class="upload-hint">支持 JSON、HAR、Postman、OpenAPI 格式</p>
                    </div>
                  </el-upload>
                  
                  <div v-if="importFile" class="file-info">
                    <div class="file-details">
                      <el-icon><Document /></el-icon>
                      <span class="file-name">{{ importFile.name }}</span>
                      <span class="file-size">{{ formatSize(importFile.size) }}</span>
                    </div>
                    <el-button type="text" @click="removeFile">
                      <el-icon><Close /></el-icon>
                    </el-button>
                  </div>
                  
                  <div v-if="importFile" class="import-options">
                    <h4>导入选项</h4>
                    <el-radio-group v-model="importOptions.mode">
                      <el-radio value="merge">合并数据</el-radio>
                      <el-radio value="replace">替换数据</el-radio>
                    </el-radio-group>
                    
                    <el-checkbox v-model="importOptions.skipDuplicates">跳过重复项</el-checkbox>
                    <el-checkbox v-model="importOptions.preserveIds">保留原始ID</el-checkbox>
                  </div>
                </div>
                
                <div class="card-actions">
                  <el-button 
                    type="primary" 
                    @click="importData" 
                    :loading="importing"
                    :disabled="!importFile"
                  >
                    <el-icon><Upload /></el-icon>
                    导入数据
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 备份恢复 -->
        <el-tab-pane label="备份恢复" name="backup-restore">
          <div class="tab-content">
            <div class="section-grid">
              <!-- 创建备份 -->
              <div class="section-card">
                <div class="card-header">
                  <h3>创建备份</h3>
                  <p>创建工作空间的完整备份</p>
                </div>
                
                <div class="backup-options">
                  <el-form :model="backupForm" label-width="100px">
                    <el-form-item label="备份名称">
                      <el-input v-model="backupForm.name" placeholder="输入备份名称" />
                    </el-form-item>
                    <el-form-item label="备份描述">
                      <el-input 
                        v-model="backupForm.description" 
                        type="textarea" 
                        :rows="3"
                        placeholder="输入备份描述（可选）"
                      />
                    </el-form-item>
                    <el-form-item label="备份类型">
                      <el-radio-group v-model="backupForm.type">
                        <el-radio value="full">完整备份</el-radio>
                        <el-radio value="incremental">增量备份</el-radio>
                      </el-radio-group>
                    </el-form-item>
                    <el-form-item label="压缩选项">
                      <el-checkbox v-model="backupForm.compress">压缩备份文件</el-checkbox>
                      <el-checkbox v-model="backupForm.encrypt">加密备份文件</el-checkbox>
                    </el-form-item>
                  </el-form>
                </div>
                
                <div class="card-actions">
                  <el-button type="primary" @click="createBackup" :loading="creatingBackup">
                    <el-icon><Download /></el-icon>
                    创建备份
                  </el-button>
                </div>
              </div>
              
              <!-- 备份列表 -->
              <div class="section-card">
                <div class="card-header">
                  <h3>备份历史</h3>
                  <p>查看和管理历史备份</p>
                </div>
                
                <div class="backup-list">
                  <div 
                    v-for="backup in backups" 
                    :key="backup.id" 
                    class="backup-item"
                  >
                    <div class="backup-info">
                      <div class="backup-name">{{ backup.name }}</div>
                      <div class="backup-meta">
                        <span class="backup-type">{{ getBackupTypeText(backup.type) }}</span>
                        <span class="backup-size">{{ formatSize(backup.size) }}</span>
                        <span class="backup-date">{{ formatTime(backup.createdAt) }}</span>
                      </div>
                      <div v-if="backup.description" class="backup-description">
                        {{ backup.description }}
                      </div>
                    </div>
                    
                    <div class="backup-actions">
                      <el-button type="text" size="small" @click="downloadBackup(backup)">
                        <el-icon><Download /></el-icon>
                        下载
                      </el-button>
                      <el-button type="text" size="small" @click="restoreBackup(backup)">
                        <el-icon><RefreshRight /></el-icon>
                        恢复
                      </el-button>
                      <el-button type="text" size="small" @click="deleteBackup(backup)">
                        <el-icon><Delete /></el-icon>
                        删除
                      </el-button>
                    </div>
                  </div>
                  
                  <div v-if="backups.length === 0" class="empty-state">
                    <el-icon><FolderOpened /></el-icon>
                    <p>暂无备份记录</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 数据同步 -->
        <el-tab-pane label="数据同步" name="sync">
          <div class="tab-content">
            <div class="section-grid">
              <!-- 同步设置 -->
              <div class="section-card">
                <div class="card-header">
                  <h3>同步设置</h3>
                  <p>配置数据同步选项</p>
                </div>
                
                <div class="sync-settings">
                  <el-form :model="syncSettings" label-width="120px">
                    <el-form-item label="自动同步">
                      <el-switch v-model="syncSettings.autoSync" />
                      <span class="form-help">启用后将自动同步数据变更</span>
                    </el-form-item>
                    <el-form-item label="同步间隔">
                      <el-select v-model="syncSettings.interval" :disabled="!syncSettings.autoSync">
                        <el-option label="5分钟" value="5" />
                        <el-option label="15分钟" value="15" />
                        <el-option label="30分钟" value="30" />
                        <el-option label="1小时" value="60" />
                      </el-select>
                    </el-form-item>
                    <el-form-item label="冲突解决">
                      <el-radio-group v-model="syncSettings.conflictResolution">
                        <el-radio value="local">本地优先</el-radio>
                        <el-radio value="remote">远程优先</el-radio>
                        <el-radio value="manual">手动解决</el-radio>
                      </el-radio-group>
                    </el-form-item>
                    <el-form-item label="同步范围">
                      <el-checkbox-group v-model="syncSettings.scope">
                        <el-checkbox value="collections">API集合</el-checkbox>
                        <el-checkbox value="environments">环境配置</el-checkbox>
                        <el-checkbox value="settings">工作空间设置</el-checkbox>
                      </el-checkbox-group>
                    </el-form-item>
                  </el-form>
                </div>
                
                <div class="card-actions">
                  <el-button type="primary" @click="saveSyncSettings">
                    保存设置
                  </el-button>
                  <el-button @click="resetSyncSettings">
                    重置
                  </el-button>
                </div>
              </div>
              
              <!-- 同步状态 -->
              <div class="section-card">
                <div class="card-header">
                  <h3>同步状态</h3>
                  <p>查看当前同步状态和历史</p>
                </div>
                
                <div class="sync-status">
                  <div class="status-overview">
                    <div class="status-item">
                      <div class="status-icon" :class="syncStatus.status">
                        <el-icon v-if="syncStatus.status === 'synced'"><CircleCheckFilled /></el-icon>
                        <el-icon v-else-if="syncStatus.status === 'syncing'"><Loading /></el-icon>
                        <el-icon v-else-if="syncStatus.status === 'error'"><CircleCloseFilled /></el-icon>
                        <el-icon v-else><Clock /></el-icon>
                      </div>
                      <div class="status-content">
                        <div class="status-text">{{ getSyncStatusText(syncStatus.status) }}</div>
                        <div class="status-time">{{ formatTime(syncStatus.lastSync) }}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="sync-actions">
                    <el-button 
                      type="primary" 
                      @click="manualSync" 
                      :loading="syncing"
                      :disabled="syncStatus.status === 'syncing'"
                    >
                      <el-icon><Refresh /></el-icon>
                      立即同步
                    </el-button>
                    <el-button @click="viewSyncHistory">
                      <el-icon><Clock /></el-icon>
                      同步历史
                    </el-button>
                  </div>
                  
                  <div class="sync-history">
                    <h4>最近同步记录</h4>
                    <div class="history-list">
                      <div 
                        v-for="record in syncHistory.slice(0, 5)" 
                        :key="record.id" 
                        class="history-item"
                      >
                        <div class="history-icon" :class="record.status">
                          <el-icon v-if="record.status === 'success'"><CircleCheckFilled /></el-icon>
                          <el-icon v-else><CircleCloseFilled /></el-icon>
                        </div>
                        <div class="history-content">
                          <div class="history-text">{{ record.message }}</div>
                          <div class="history-time">{{ formatTime(record.timestamp) }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 数据清理 -->
        <el-tab-pane label="数据清理" name="cleanup">
          <div class="tab-content">
            <div class="section-grid">
              <!-- 清理选项 -->
              <div class="section-card">
                <div class="card-header">
                  <h3>数据清理</h3>
                  <p>清理不需要的数据以释放存储空间</p>
                </div>
                
                <div class="cleanup-options">
                  <div class="cleanup-item">
                    <div class="item-info">
                      <h4>历史记录</h4>
                      <p>清理超过指定时间的API请求历史记录</p>
                    </div>
                    <div class="item-controls">
                      <el-select v-model="cleanupOptions.historyDays" style="width: 120px;">
                        <el-option label="7天" value="7" />
                        <el-option label="30天" value="30" />
                        <el-option label="90天" value="90" />
                        <el-option label="全部" value="all" />
                      </el-select>
                      <el-button @click="cleanupHistory" :loading="cleaningHistory">
                        清理
                      </el-button>
                    </div>
                  </div>
                  
                  <div class="cleanup-item">
                    <div class="item-info">
                      <h4>临时文件</h4>
                      <p>清理缓存和临时文件</p>
                    </div>
                    <div class="item-controls">
                      <span class="size-info">{{ formatSize(tempFileSize) }}</span>
                      <el-button @click="cleanupTempFiles" :loading="cleaningTempFiles">
                        清理
                      </el-button>
                    </div>
                  </div>
                  
                  <div class="cleanup-item">
                    <div class="item-info">
                      <h4>未使用的环境变量</h4>
                      <p>清理未被任何请求使用的环境变量</p>
                    </div>
                    <div class="item-controls">
                      <span class="count-info">{{ unusedVariablesCount }} 个</span>
                      <el-button @click="cleanupUnusedVariables" :loading="cleaningVariables">
                        清理
                      </el-button>
                    </div>
                  </div>
                  
                  <div class="cleanup-item">
                    <div class="item-info">
                      <h4>空集合和文件夹</h4>
                      <p>清理没有包含任何请求的空集合和文件夹</p>
                    </div>
                    <div class="item-controls">
                      <span class="count-info">{{ emptyCollectionsCount }} 个</span>
                      <el-button @click="cleanupEmptyCollections" :loading="cleaningCollections">
                        清理
                      </el-button>
                    </div>
                  </div>
                </div>
                
                <div class="card-actions">
                  <el-button type="danger" @click="cleanupAll" :loading="cleaningAll">
                    <el-icon><Delete /></el-icon>
                    一键清理
                  </el-button>
                </div>
              </div>
              
              <!-- 存储分析 -->
              <div class="section-card">
                <div class="card-header">
                  <h3>存储分析</h3>
                  <p>查看数据存储使用情况</p>
                </div>
                
                <div class="storage-analysis">
                  <div class="storage-chart">
                    <!-- 这里可以集成图表库显示存储分布 -->
                    <div class="chart-placeholder">
                      <el-icon><PieChart /></el-icon>
                      <p>存储分布图表</p>
                    </div>
                  </div>
                  
                  <div class="storage-breakdown">
                    <div class="breakdown-item">
                      <div class="item-label">API集合</div>
                      <div class="item-value">{{ formatSize(storageBreakdown.collections) }}</div>
                      <div class="item-percentage">{{ getPercentage(storageBreakdown.collections) }}%</div>
                    </div>
                    <div class="breakdown-item">
                      <div class="item-label">环境配置</div>
                      <div class="item-value">{{ formatSize(storageBreakdown.environments) }}</div>
                      <div class="item-percentage">{{ getPercentage(storageBreakdown.environments) }}%</div>
                    </div>
                    <div class="breakdown-item">
                      <div class="item-label">历史记录</div>
                      <div class="item-value">{{ formatSize(storageBreakdown.history) }}</div>
                      <div class="item-percentage">{{ getPercentage(storageBreakdown.history) }}%</div>
                    </div>
                    <div class="breakdown-item">
                      <div class="item-label">临时文件</div>
                      <div class="item-value">{{ formatSize(storageBreakdown.temp) }}</div>
                      <div class="item-percentage">{{ getPercentage(storageBreakdown.temp) }}%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 导入对话框 -->
    <el-dialog
      v-model="showImportDialog"
      title="导入数据"
      width="600px"
    >
      <div class="import-dialog-content">
        <el-upload
          ref="dialogUploadRef"
          class="upload-dragger"
          drag
          :auto-upload="false"
          :on-change="handleDialogFileChange"
          :show-file-list="false"
          accept=".json,.har,.postman_collection,.yaml,.yml"
        >
          <el-icon class="upload-icon"><UploadFilled /></el-icon>
          <div class="upload-text">
            <p>将文件拖拽到此处，或<em>点击上传</em></p>
            <p class="upload-hint">支持 JSON、HAR、Postman、OpenAPI 格式</p>
          </div>
        </el-upload>
        
        <div v-if="dialogImportFile" class="file-preview">
          <div class="file-info">
            <el-icon><Document /></el-icon>
            <span class="file-name">{{ dialogImportFile.name }}</span>
            <span class="file-size">{{ formatSize(dialogImportFile.size) }}</span>
          </div>
          
          <div class="import-options">
            <h4>导入选项</h4>
            <el-form :model="dialogImportOptions" label-width="100px">
              <el-form-item label="导入模式">
                <el-radio-group v-model="dialogImportOptions.mode">
                  <el-radio value="merge">合并数据</el-radio>
                  <el-radio value="replace">替换数据</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="处理选项">
                <el-checkbox v-model="dialogImportOptions.skipDuplicates">跳过重复项</el-checkbox>
                <el-checkbox v-model="dialogImportOptions.preserveIds">保留原始ID</el-checkbox>
                <el-checkbox v-model="dialogImportOptions.createBackup">导入前创建备份</el-checkbox>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showImportDialog = false">取消</el-button>
          <el-button 
            type="primary" 
            @click="confirmImport" 
            :loading="importing"
            :disabled="!dialogImportFile"
          >
            导入
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 备份对话框 -->
    <el-dialog
      v-model="showBackupDialog"
      title="创建备份"
      width="500px"
    >
      <el-form :model="dialogBackupForm" label-width="100px">
        <el-form-item label="备份名称" required>
          <el-input v-model="dialogBackupForm.name" placeholder="输入备份名称" />
        </el-form-item>
        <el-form-item label="备份描述">
          <el-input 
            v-model="dialogBackupForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="输入备份描述（可选）"
          />
        </el-form-item>
        <el-form-item label="备份类型">
          <el-radio-group v-model="dialogBackupForm.type">
            <el-radio value="full">完整备份</el-radio>
            <el-radio value="incremental">增量备份</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="选项">
          <el-checkbox v-model="dialogBackupForm.compress">压缩备份文件</el-checkbox>
          <el-checkbox v-model="dialogBackupForm.encrypt">加密备份文件</el-checkbox>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showBackupDialog = false">取消</el-button>
          <el-button type="primary" @click="confirmCreateBackup" :loading="creatingBackup">
            创建备份
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type UploadInstance, type UploadFile } from 'element-plus'
import {
  Download,
  Upload,
  FolderOpened,
  Setting,
  Clock,
  DocumentCopy,
  UploadFilled,
  Document,
  Close,
  RefreshRight,
  Delete,
  CircleCheckFilled,
  CircleCloseFilled,
  Loading,
  Refresh,
  PieChart
} from '@element-plus/icons-vue'

// 响应式数据
const activeTab = ref('import-export')
const showImportDialog = ref(false)
const showBackupDialog = ref(false)
const importing = ref(false)
const exporting = ref(false)
const creatingBackup = ref(false)
const syncing = ref(false)
const cleaningHistory = ref(false)
const cleaningTempFiles = ref(false)
const cleaningVariables = ref(false)
const cleaningCollections = ref(false)
const cleaningAll = ref(false)

// 文件上传
const uploadRef = ref<UploadInstance>()
const dialogUploadRef = ref<UploadInstance>()
const importFile = ref<UploadFile | null>(null)
const dialogImportFile = ref<UploadFile | null>(null)

// 导出选项
const exportOptions = ref({
  dataTypes: ['collections', 'environments'],
  format: 'json',
  includeSecrets: false,
  compress: true
})

// 导入选项
const importOptions = ref({
  mode: 'merge',
  skipDuplicates: true,
  preserveIds: false
})

const dialogImportOptions = ref({
  mode: 'merge',
  skipDuplicates: true,
  preserveIds: false,
  createBackup: true
})

// 备份表单
const backupForm = ref({
  name: '',
  description: '',
  type: 'full',
  compress: true,
  encrypt: false
})

const dialogBackupForm = ref({
  name: `备份_${new Date().toLocaleDateString()}`,
  description: '',
  type: 'full',
  compress: true,
  encrypt: false
})

// 同步设置
const syncSettings = ref({
  autoSync: false,
  interval: '30',
  conflictResolution: 'manual',
  scope: ['collections', 'environments']
})

// 清理选项
const cleanupOptions = ref({
  historyDays: '30'
})

// 模拟数据
const totalCollections = ref(15)
const totalEnvironments = ref(4)
const totalHistory = ref(1250)
const totalDataSize = ref(52428800) // 50MB

const backups = ref([
  {
    id: '1',
    name: '完整备份_2024-01-15',
    description: '项目上线前的完整备份',
    type: 'full',
    size: 15728640, // 15MB
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)
  },
  {
    id: '2',
    name: '增量备份_2024-01-14',
    description: '',
    type: 'incremental',
    size: 2097152, // 2MB
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3)
  }
])

const syncStatus = ref({
  status: 'synced', // synced, syncing, error, pending
  lastSync: new Date(Date.now() - 1000 * 60 * 15)
})

const syncHistory = ref([
  {
    id: '1',
    status: 'success',
    message: '同步完成，更新了 3 个集合',
    timestamp: new Date(Date.now() - 1000 * 60 * 15)
  },
  {
    id: '2',
    status: 'success',
    message: '同步完成，更新了 1 个环境配置',
    timestamp: new Date(Date.now() - 1000 * 60 * 60)
  },
  {
    id: '3',
    status: 'error',
    message: '同步失败，网络连接超时',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2)
  }
])

const tempFileSize = ref(10485760) // 10MB
const unusedVariablesCount = ref(8)
const emptyCollectionsCount = ref(3)

const storageBreakdown = ref({
  collections: 31457280, // 30MB
  environments: 1048576, // 1MB
  history: 15728640, // 15MB
  temp: 5242880 // 5MB
})

// 计算属性
const totalStorageSize = computed(() => {
  return Object.values(storageBreakdown.value).reduce((sum, size) => sum + size, 0)
})

// 方法
const formatSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatTime = (date: Date) => {
  return date.toLocaleString('zh-CN')
}

const getBackupTypeText = (type: string) => {
  return type === 'full' ? '完整备份' : '增量备份'
}

const getSyncStatusText = (status: string) => {
  const texts: Record<string, string> = {
    synced: '已同步',
    syncing: '同步中',
    error: '同步失败',
    pending: '等待同步'
  }
  return texts[status] || status
}

const getPercentage = (size: number) => {
  return Math.round((size / totalStorageSize.value) * 100)
}

const handleFileChange = (file: UploadFile) => {
  importFile.value = file
}

const handleDialogFileChange = (file: UploadFile) => {
  dialogImportFile.value = file
}

const removeFile = () => {
  importFile.value = null
  uploadRef.value?.clearFiles()
}

const exportData = async () => {
  if (exportOptions.value.dataTypes.length === 0) {
    ElMessage.warning('请选择要导出的数据类型')
    return
  }
  
  exporting.value = true
  
  try {
    // 模拟导出过程
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 创建模拟数据
    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      data: {
        collections: exportOptions.value.dataTypes.includes('collections') ? [] : undefined,
        environments: exportOptions.value.dataTypes.includes('environments') ? [] : undefined,
        history: exportOptions.value.dataTypes.includes('history') ? [] : undefined,
        settings: exportOptions.value.dataTypes.includes('settings') ? {} : undefined
      }
    }
    
    // 下载文件
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `workspace_export_${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    
    ElMessage.success('数据导出成功')
  } catch (error) {
    ElMessage.error('导出失败')
  } finally {
    exporting.value = false
  }
}

const importData = async () => {
  if (!importFile.value) {
    ElMessage.warning('请选择要导入的文件')
    return
  }
  
  importing.value = true
  
  try {
    // 模拟导入过程
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    ElMessage.success('数据导入成功')
    importFile.value = null
    uploadRef.value?.clearFiles()
  } catch (error) {
    ElMessage.error('导入失败')
  } finally {
    importing.value = false
  }
}

const confirmImport = async () => {
  if (!dialogImportFile.value) {
    ElMessage.warning('请选择要导入的文件')
    return
  }
  
  importing.value = true
  
  try {
    // 模拟导入过程
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    ElMessage.success('数据导入成功')
    showImportDialog.value = false
    dialogImportFile.value = null
    dialogUploadRef.value?.clearFiles()
  } catch (error) {
    ElMessage.error('导入失败')
  } finally {
    importing.value = false
  }
}

const createBackup = async () => {
  if (!backupForm.value.name.trim()) {
    ElMessage.warning('请输入备份名称')
    return
  }
  
  creatingBackup.value = true
  
  try {
    // 模拟创建备份
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const newBackup = {
      id: Date.now().toString(),
      ...backupForm.value,
      size: Math.floor(Math.random() * 20971520) + 5242880, // 5-25MB
      createdAt: new Date()
    }
    
    backups.value.unshift(newBackup)
    
    // 重置表单
    backupForm.value = {
      name: '',
      description: '',
      type: 'full',
      compress: true,
      encrypt: false
    }
    
    ElMessage.success('备份创建成功')
  } catch (error) {
    ElMessage.error('创建备份失败')
  } finally {
    creatingBackup.value = false
  }
}

const confirmCreateBackup = async () => {
  if (!dialogBackupForm.value.name.trim()) {
    ElMessage.warning('请输入备份名称')
    return
  }
  
  creatingBackup.value = true
  
  try {
    // 模拟创建备份
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const newBackup = {
      id: Date.now().toString(),
      ...dialogBackupForm.value,
      size: Math.floor(Math.random() * 20971520) + 5242880, // 5-25MB
      createdAt: new Date()
    }
    
    backups.value.unshift(newBackup)
    showBackupDialog.value = false
    
    ElMessage.success('备份创建成功')
  } catch (error) {
    ElMessage.error('创建备份失败')
  } finally {
    creatingBackup.value = false
  }
}

const downloadBackup = (backup: any) => {
  // 模拟下载备份文件
  const blob = new Blob(['backup data'], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${backup.name}.backup`
  a.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success('备份下载开始')
}

const restoreBackup = async (backup: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要恢复备份 "${backup.name}" 吗？这将覆盖当前数据。`,
      '确认恢复',
      {
        confirmButtonText: '恢复',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 模拟恢复过程
    ElMessage.info('正在恢复备份...')
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    ElMessage.success('备份恢复成功')
  } catch (error) {
    // 用户取消恢复
  }
}

const deleteBackup = async (backup: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除备份 "${backup.name}" 吗？`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const index = backups.value.findIndex(b => b.id === backup.id)
    if (index > -1) {
      backups.value.splice(index, 1)
    }
    
    ElMessage.success('备份已删除')
  } catch (error) {
    // 用户取消删除
  }
}

const saveSyncSettings = () => {
  ElMessage.success('同步设置已保存')
}

const resetSyncSettings = () => {
  syncSettings.value = {
    autoSync: false,
    interval: '30',
    conflictResolution: 'manual',
    scope: ['collections', 'environments']
  }
  ElMessage.info('同步设置已重置')
}

const manualSync = async () => {
  syncing.value = true
  syncStatus.value.status = 'syncing'
  
  try {
    // 模拟同步过程
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    syncStatus.value.status = 'synced'
    syncStatus.value.lastSync = new Date()
    
    // 添加同步记录
    syncHistory.value.unshift({
      id: Date.now().toString(),
      status: 'success',
      message: '手动同步完成',
      timestamp: new Date()
    })
    
    ElMessage.success('同步完成')
  } catch (error) {
    syncStatus.value.status = 'error'
    ElMessage.error('同步失败')
  } finally {
    syncing.value = false
  }
}

const viewSyncHistory = () => {
  ElMessage.info('查看同步历史功能开发中')
}

const cleanupHistory = async () => {
  cleaningHistory.value = true
  
  try {
    // 模拟清理过程
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const days = cleanupOptions.value.historyDays
    const message = days === 'all' ? '所有历史记录已清理' : `超过${days}天的历史记录已清理`
    
    ElMessage.success(message)
  } catch (error) {
    ElMessage.error('清理失败')
  } finally {
    cleaningHistory.value = false
  }
}

const cleanupTempFiles = async () => {
  cleaningTempFiles.value = true
  
  try {
    // 模拟清理过程
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    tempFileSize.value = 0
    storageBreakdown.value.temp = 0
    
    ElMessage.success('临时文件已清理')
  } catch (error) {
    ElMessage.error('清理失败')
  } finally {
    cleaningTempFiles.value = false
  }
}

const cleanupUnusedVariables = async () => {
  cleaningVariables.value = true
  
  try {
    // 模拟清理过程
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const count = unusedVariablesCount.value
    unusedVariablesCount.value = 0
    
    ElMessage.success(`已清理 ${count} 个未使用的环境变量`)
  } catch (error) {
    ElMessage.error('清理失败')
  } finally {
    cleaningVariables.value = false
  }
}

const cleanupEmptyCollections = async () => {
  cleaningCollections.value = true
  
  try {
    // 模拟清理过程
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const count = emptyCollectionsCount.value
    emptyCollectionsCount.value = 0
    
    ElMessage.success(`已清理 ${count} 个空集合和文件夹`)
  } catch (error) {
    ElMessage.error('清理失败')
  } finally {
    cleaningCollections.value = false
  }
}

const cleanupAll = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要执行一键清理吗？这将清理所有可清理的数据。',
      '确认清理',
      {
        confirmButtonText: '清理',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    cleaningAll.value = true
    
    // 模拟清理过程
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    // 重置所有计数
    tempFileSize.value = 0
    unusedVariablesCount.value = 0
    emptyCollectionsCount.value = 0
    storageBreakdown.value.temp = 0
    
    ElMessage.success('一键清理完成')
  } catch (error) {
    // 用户取消清理
  } finally {
    cleaningAll.value = false
  }
}

// 生命周期
onMounted(() => {
  // 初始化数据
})
</script>

<style scoped>
.data-management {
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

.stat-icon.info {
  background: #eff6ff;
  color: #2563eb;
}

.stat-icon.primary {
  background: #f0f9ff;
  color: #0ea5e9;
}

.stat-icon.warning {
  background: #fef3c7;
  color: #f59e0b;
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

.main-content {
  flex: 1;
  overflow: hidden;
  padding: 0 24px 24px;
}

.data-tabs {
  height: 100%;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.tab-content {
  padding: 24px;
  height: calc(100vh - 300px);
  overflow-y: auto;
}

.section-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
}

.section-card {
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  padding: 20px;
}

.card-header {
  margin-bottom: 20px;
}

.card-header h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.card-header p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.card-actions {
  margin-top: 20px;
  display: flex;
  gap: 12px;
}

.export-options,
.backup-options,
.sync-settings {
  margin-bottom: 20px;
}

.option-group {
  margin-bottom: 16px;
}

.option-group h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.import-area {
  margin-bottom: 20px;
}

.upload-dragger {
  width: 100%;
}

.upload-icon {
  font-size: 48px;
  color: #c0c4cc;
  margin-bottom: 16px;
}

.upload-text {
  color: #606266;
}

.upload-text p {
  margin: 0 0 8px 0;
}

.upload-hint {
  font-size: 12px;
  color: #909399;
}

.file-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  margin-top: 16px;
}

.file-details {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-name {
  font-weight: 500;
  color: #1f2937;
}

.file-size {
  font-size: 12px;
  color: #6b7280;
}

.import-options {
  margin-top: 16px;
  padding: 16px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.import-options h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.backup-list {
  max-height: 400px;
  overflow-y: auto;
}

.backup-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  margin-bottom: 12px;
}

.backup-info {
  flex: 1;
  min-width: 0;
}

.backup-name {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.backup-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.backup-description {
  font-size: 12px;
  color: #6b7280;
}

.backup-actions {
  display: flex;
  gap: 8px;
  margin-left: 16px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.empty-state .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.sync-status {
  margin-bottom: 20px;
}

.status-overview {
  margin-bottom: 20px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.status-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.status-icon.synced {
  background: #dcfce7;
  color: #16a34a;
}

.status-icon.syncing {
  background: #fef3c7;
  color: #f59e0b;
}

.status-icon.error {
  background: #fef2f2;
  color: #dc2626;
}

.status-icon.pending {
  background: #eff6ff;
  color: #2563eb;
}

.status-content {
  flex: 1;
}

.status-text {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.status-time {
  font-size: 12px;
  color: #6b7280;
}

.sync-actions {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.sync-history h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.history-list {
  max-height: 200px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
}

.history-item:last-child {
  border-bottom: none;
}

.history-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.history-icon.success {
  background: #dcfce7;
  color: #16a34a;
}

.history-icon.error {
  background: #fef2f2;
  color: #dc2626;
}

.history-content {
  flex: 1;
  min-width: 0;
}

.history-text {
  font-size: 12px;
  color: #1f2937;
  margin-bottom: 2px;
}

.history-time {
  font-size: 10px;
  color: #6b7280;
}

.form-help {
  font-size: 12px;
  color: #6b7280;
  margin-left: 8px;
}

.cleanup-options {
  margin-bottom: 20px;
}

.cleanup-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  margin-bottom: 12px;
}

.item-info {
  flex: 1;
}

.item-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.item-info p {
  margin: 0;
  font-size: 12px;
  color: #6b7280;
}

.item-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.size-info,
.count-info {
  font-size: 12px;
  color: #6b7280;
  min-width: 60px;
  text-align: right;
}

.storage-analysis {
  margin-bottom: 20px;
}

.storage-chart {
  margin-bottom: 20px;
}

.chart-placeholder {
  height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  color: #6b7280;
}

.chart-placeholder .el-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.storage-breakdown {
  background: white;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  padding: 16px;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
}

.breakdown-item:last-child {
  border-bottom: none;
}

.item-label {
  font-size: 14px;
  color: #1f2937;
}

.item-value {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.item-percentage {
  font-size: 12px;
  color: #6b7280;
  min-width: 40px;
  text-align: right;
}

.import-dialog-content {
  padding: 0;
}

.file-preview {
  margin-top: 16px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    padding: 16px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
  }
  
  .header-actions {
    align-self: stretch;
  }
  
  .stats-container {
    padding: 16px;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .main-content {
    padding: 0 16px 16px;
  }
  
  .tab-content {
    padding: 16px;
    height: auto;
  }
  
  .section-grid {
    grid-template-columns: 1fr;
  }
  
  .backup-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .backup-actions {
    margin-left: 0;
    align-self: stretch;
    justify-content: flex-end;
  }
  
  .cleanup-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .item-controls {
    align-self: stretch;
    justify-content: space-between;
  }
}

@media (max-width: 480px) {
  .header-actions {
    flex-direction: column;
  }
  
  .backup-meta {
    flex-direction: column;
    gap: 4px;
  }
  
  .backup-actions {
    flex-direction: column;
  }
  
  .sync-actions {
    flex-direction: column;
  }
  
  .item-controls {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>