<template>
  <div class="workspace-settings">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <el-icon><Setting /></el-icon>
            工作空间设置
          </h1>
          <p class="page-description">管理当前工作空间的配置和偏好设置</p>
        </div>
        <div class="header-actions">
          <el-button @click="handleSaveAll" type="primary" :loading="saving">
            <el-icon><Check /></el-icon>
            保存所有设置
          </el-button>
        </div>
      </div>
    </div>

    <!-- 设置内容 -->
    <div class="settings-container">
      <div class="settings-sidebar">
        <el-menu
          v-model="activeSection"
          mode="vertical"
          class="settings-menu"
          @select="handleSectionChange"
        >
          <el-menu-item index="general">
            <el-icon><InfoFilled /></el-icon>
            <span>基本信息</span>
          </el-menu-item>
          <el-menu-item index="members">
            <el-icon><User /></el-icon>
            <span>成员管理</span>
          </el-menu-item>
          <el-menu-item index="permissions">
            <el-icon><Lock /></el-icon>
            <span>权限设置</span>
          </el-menu-item>
          <el-menu-item index="integrations">
            <el-icon><Connection /></el-icon>
            <span>集成配置</span>
          </el-menu-item>
          <el-menu-item index="notifications">
            <el-icon><Bell /></el-icon>
            <span>通知设置</span>
          </el-menu-item>
          <el-menu-item index="backup">
            <el-icon><Download /></el-icon>
            <span>备份与恢复</span>
          </el-menu-item>
          <el-menu-item index="advanced">
            <el-icon><Tools /></el-icon>
            <span>高级设置</span>
          </el-menu-item>
          <el-menu-item index="danger">
            <el-icon><Warning /></el-icon>
            <span>危险操作</span>
          </el-menu-item>
        </el-menu>
      </div>

      <div class="settings-content">
        <!-- 基本信息 -->
        <div v-show="activeSection === 'general'" class="settings-section">
          <div class="section-header">
            <h2>基本信息</h2>
            <p>管理工作空间的基本信息和显示设置</p>
          </div>

          <el-form
            ref="generalFormRef"
            :model="generalForm"
            :rules="generalFormRules"
            label-width="120px"
            class="settings-form"
          >
            <el-form-item label="工作空间名称" prop="name">
              <el-input
                v-model="generalForm.name"
                placeholder="请输入工作空间名称"
                maxlength="50"
                show-word-limit
              />
            </el-form-item>
            <el-form-item label="描述" prop="description">
              <el-input
                v-model="generalForm.description"
                type="textarea"
                placeholder="请输入工作空间描述"
                :rows="3"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
            <el-form-item label="可见性" prop="isPublic">
              <el-radio-group v-model="generalForm.isPublic">
                <el-radio :label="false">私有</el-radio>
                <el-radio :label="true">公开</el-radio>
              </el-radio-group>
              <div class="form-help-text">
                私有工作空间只有受邀成员可以访问，公开工作空间所有人都可以查看
              </div>
            </el-form-item>
            <el-form-item label="时区" prop="timezone">
              <el-select v-model="generalForm.timezone" placeholder="选择时区" filterable>
                <el-option
                  v-for="timezone in timezones"
                  :key="timezone.value"
                  :label="timezone.label"
                  :value="timezone.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="语言" prop="language">
              <el-select v-model="generalForm.language" placeholder="选择语言">
                <el-option label="简体中文" value="zh-CN" />
                <el-option label="English" value="en-US" />
                <el-option label="日本語" value="ja-JP" />
              </el-select>
            </el-form-item>
          </el-form>
        </div>

        <!-- 成员管理 -->
        <div v-show="activeSection === 'members'" class="settings-section">
          <div class="section-header">
            <h2>成员管理</h2>
            <p>管理工作空间成员和邀请设置</p>
          </div>

          <div class="members-actions">
            <el-button type="primary" @click="showInviteDialog = true">
              <el-icon><Plus /></el-icon>
              邀请成员
            </el-button>
            <el-button @click="showBulkInviteDialog = true">
              <el-icon><Upload /></el-icon>
              批量邀请
            </el-button>
          </div>

          <el-table :data="members" style="width: 100%; margin-top: 16px;">
            <el-table-column prop="user.avatar" label="头像" width="60">
              <template #default="{ row }">
                <el-avatar :size="32" :src="row.user.avatar">
                  {{ row.user.name.charAt(0) }}
                </el-avatar>
              </template>
            </el-table-column>
            <el-table-column prop="user.name" label="姓名" />
            <el-table-column prop="user.email" label="邮箱" />
            <el-table-column prop="role" label="角色">
              <template #default="{ row }">
                <el-select
                  v-model="row.role"
                  size="small"
                  @change="handleRoleChange(row)"
                  :disabled="!canChangeRole(row)"
                >
                  <el-option label="所有者" value="owner" :disabled="row.role === 'owner'" />
                  <el-option label="管理员" value="admin" />
                  <el-option label="成员" value="member" />
                  <el-option label="访客" value="viewer" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态">
              <template #default="{ row }">
                <el-tag :type="getStatusTagType(row.status)">
                  {{ getStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="joinedAt" label="加入时间">
              <template #default="{ row }">
                {{ formatTime(row.joinedAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button
                  type="danger"
                  text
                  size="small"
                  @click="handleRemoveMember(row)"
                  :disabled="!canRemoveMember(row)"
                >
                  移除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 权限设置 -->
        <div v-show="activeSection === 'permissions'" class="settings-section">
          <div class="section-header">
            <h2>权限设置</h2>
            <p>配置工作空间的默认权限和访问控制</p>
          </div>

          <el-form
            ref="permissionsFormRef"
            :model="permissionsForm"
            label-width="150px"
            class="settings-form"
          >
            <el-form-item label="新成员默认角色">
              <el-select v-model="permissionsForm.defaultRole">
                <el-option label="成员" value="member" />
                <el-option label="访客" value="viewer" />
              </el-select>
            </el-form-item>
            <el-form-item label="允许成员邀请他人">
              <el-switch v-model="permissionsForm.allowMemberInvite" />
            </el-form-item>
            <el-form-item label="允许成员创建集合">
              <el-switch v-model="permissionsForm.allowMemberCreateCollection" />
            </el-form-item>
            <el-form-item label="允许成员删除集合">
              <el-switch v-model="permissionsForm.allowMemberDeleteCollection" />
            </el-form-item>
            <el-form-item label="允许公开分享">
              <el-switch v-model="permissionsForm.allowPublicShare" />
            </el-form-item>
            <el-form-item label="允许导出数据">
              <el-switch v-model="permissionsForm.allowDataExport" />
            </el-form-item>
            <el-form-item label="需要管理员审批邀请">
              <el-switch v-model="permissionsForm.requireInviteApproval" />
            </el-form-item>
          </el-form>
        </div>

        <!-- 集成配置 -->
        <div v-show="activeSection === 'integrations'" class="settings-section">
          <div class="section-header">
            <h2>集成配置</h2>
            <p>配置第三方服务集成和API连接</p>
          </div>

          <div class="integrations-list">
            <div class="integration-item">
              <div class="integration-info">
                <div class="integration-icon">
                  <el-icon><Connection /></el-icon>
                </div>
                <div class="integration-details">
                  <h4>Webhook</h4>
                  <p>配置Webhook URL接收事件通知</p>
                </div>
              </div>
              <div class="integration-actions">
                <el-button @click="configureWebhook">配置</el-button>
              </div>
            </div>

            <div class="integration-item">
              <div class="integration-info">
                <div class="integration-icon">
                  <el-icon><Message /></el-icon>
                </div>
                <div class="integration-details">
                  <h4>Slack</h4>
                  <p>将通知发送到Slack频道</p>
                </div>
              </div>
              <div class="integration-actions">
                <el-button @click="configureSlack">配置</el-button>
              </div>
            </div>

            <div class="integration-item">
              <div class="integration-info">
                <div class="integration-icon">
                  <el-icon><Document /></el-icon>
                </div>
                <div class="integration-details">
                  <h4>Jira</h4>
                  <p>与Jira项目集成，同步问题和任务</p>
                </div>
              </div>
              <div class="integration-actions">
                <el-button @click="configureJira">配置</el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 通知设置 -->
        <div v-show="activeSection === 'notifications'" class="settings-section">
          <div class="section-header">
            <h2>通知设置</h2>
            <p>配置工作空间的通知偏好和提醒设置</p>
          </div>

          <el-form
            ref="notificationsFormRef"
            :model="notificationsForm"
            label-width="180px"
            class="settings-form"
          >
            <el-form-item label="邮件通知">
              <el-switch v-model="notificationsForm.emailNotifications" />
            </el-form-item>
            <el-form-item label="新成员加入通知">
              <el-switch v-model="notificationsForm.newMemberNotification" />
            </el-form-item>
            <el-form-item label="集合更新通知">
              <el-switch v-model="notificationsForm.collectionUpdateNotification" />
            </el-form-item>
            <el-form-item label="测试失败通知">
              <el-switch v-model="notificationsForm.testFailureNotification" />
            </el-form-item>
            <el-form-item label="每日摘要报告">
              <el-switch v-model="notificationsForm.dailySummary" />
            </el-form-item>
            <el-form-item label="每周活动报告">
              <el-switch v-model="notificationsForm.weeklyReport" />
            </el-form-item>
          </el-form>
        </div>

        <!-- 备份与恢复 -->
        <div v-show="activeSection === 'backup'" class="settings-section">
          <div class="section-header">
            <h2>备份与恢复</h2>
            <p>管理工作空间数据的备份和恢复</p>
          </div>

          <div class="backup-section">
            <h4>自动备份</h4>
            <el-form label-width="120px">
              <el-form-item label="启用自动备份">
                <el-switch v-model="backupSettings.autoBackup" />
              </el-form-item>
              <el-form-item label="备份频率" v-if="backupSettings.autoBackup">
                <el-select v-model="backupSettings.frequency">
                  <el-option label="每日" value="daily" />
                  <el-option label="每周" value="weekly" />
                  <el-option label="每月" value="monthly" />
                </el-select>
              </el-form-item>
              <el-form-item label="保留备份数量" v-if="backupSettings.autoBackup">
                <el-input-number v-model="backupSettings.retentionCount" :min="1" :max="30" />
              </el-form-item>
            </el-form>
          </div>

          <div class="backup-actions">
            <h4>手动操作</h4>
            <div class="action-buttons">
              <el-button type="primary" @click="handleCreateBackup" :loading="creatingBackup">
                <el-icon><Download /></el-icon>
                创建备份
              </el-button>
              <el-button @click="handleRestoreBackup">
                <el-icon><Upload /></el-icon>
                恢复备份
              </el-button>
              <el-button @click="handleExportData">
                <el-icon><DocumentCopy /></el-icon>
                导出数据
              </el-button>
            </div>
          </div>

          <div class="backup-history">
            <h4>备份历史</h4>
            <el-table :data="backupHistory" style="width: 100%">
              <el-table-column prop="name" label="备份名称" />
              <el-table-column prop="size" label="大小" />
              <el-table-column prop="createdAt" label="创建时间">
                <template #default="{ row }">
                  {{ formatTime(row.createdAt) }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="150">
                <template #default="{ row }">
                  <el-button type="primary" text size="small" @click="handleDownloadBackup(row)">
                    下载
                  </el-button>
                  <el-button type="danger" text size="small" @click="handleDeleteBackup(row)">
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <!-- 高级设置 -->
        <div v-show="activeSection === 'advanced'" class="settings-section">
          <div class="section-header">
            <h2>高级设置</h2>
            <p>配置高级功能和开发者选项</p>
          </div>

          <el-form
            ref="advancedFormRef"
            :model="advancedForm"
            label-width="150px"
            class="settings-form"
          >
            <el-form-item label="API访问">
              <el-switch v-model="advancedForm.enableApiAccess" />
              <div class="form-help-text">启用后可以通过API访问工作空间数据</div>
            </el-form-item>
            <el-form-item label="API密钥" v-if="advancedForm.enableApiAccess">
              <el-input
                v-model="advancedForm.apiKey"
                readonly
                placeholder="点击生成API密钥"
              >
                <template #append>
                  <el-button @click="generateApiKey">生成</el-button>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item label="调试模式">
              <el-switch v-model="advancedForm.debugMode" />
              <div class="form-help-text">启用后会显示详细的调试信息</div>
            </el-form-item>
            <el-form-item label="请求超时时间">
              <el-input-number
                v-model="advancedForm.requestTimeout"
                :min="1000"
                :max="60000"
                :step="1000"
              />
              <span style="margin-left: 8px;">毫秒</span>
            </el-form-item>
            <el-form-item label="最大并发请求数">
              <el-input-number
                v-model="advancedForm.maxConcurrentRequests"
                :min="1"
                :max="20"
              />
            </el-form-item>
          </el-form>
        </div>

        <!-- 危险操作 -->
        <div v-show="activeSection === 'danger'" class="settings-section">
          <div class="section-header">
            <h2>危险操作</h2>
            <p>以下操作不可逆，请谨慎操作</p>
          </div>

          <el-alert
            title="警告"
            type="warning"
            description="以下操作将永久删除数据，无法恢复，请确保已备份重要数据"
            show-icon
            :closable="false"
          />

          <div class="danger-actions">
            <div class="danger-item">
              <div class="danger-info">
                <h4>清空所有数据</h4>
                <p>删除工作空间中的所有集合、请求和历史记录</p>
              </div>
              <el-button type="danger" @click="handleClearAllData">
                清空数据
              </el-button>
            </div>

            <div class="danger-item">
              <div class="danger-info">
                <h4>转移工作空间所有权</h4>
                <p>将工作空间的所有权转移给其他成员</p>
              </div>
              <el-button type="warning" @click="handleTransferOwnership">
                转移所有权
              </el-button>
            </div>

            <div class="danger-item">
              <div class="danger-info">
                <h4>删除工作空间</h4>
                <p>永久删除整个工作空间及其所有数据</p>
              </div>
              <el-button type="danger" @click="handleDeleteWorkspace">
                删除工作空间
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 邀请成员对话框 -->
    <el-dialog
      v-model="showInviteDialog"
      title="邀请成员"
      width="500px"
    >
      <el-form
        ref="inviteFormRef"
        :model="inviteForm"
        :rules="inviteFormRules"
        label-width="80px"
      >
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="inviteForm.email"
            placeholder="请输入邮箱地址"
            type="email"
          />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="inviteForm.role" placeholder="选择角色">
            <el-option label="管理员" value="admin" />
            <el-option label="成员" value="member" />
            <el-option label="访客" value="viewer" />
          </el-select>
        </el-form-item>
        <el-form-item label="消息" prop="message">
          <el-input
            v-model="inviteForm.message"
            type="textarea"
            placeholder="邀请消息（可选）"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showInviteDialog = false">取消</el-button>
          <el-button type="primary" @click="handleInviteMember" :loading="inviting">
            发送邀请
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  Setting,
  Check,
  InfoFilled,
  User,
  Lock,
  Connection,
  Bell,
  Download,
  Tools,
  Warning,
  Plus,
  Upload,
  Message,
  Document,
  DocumentCopy
} from '@element-plus/icons-vue'
import { useWorkspaceStore } from '@/stores/workspace'
import type { TeamRole } from '@shared/types'
// 临时本地类型定义
interface TeamMember {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  joinedAt: Date
  lastActive?: Date
}

type UserRole = 'admin' | 'member' | 'viewer'
import dayjs from 'dayjs'

const workspaceStore = useWorkspaceStore()

// 响应式数据
const activeSection = ref('general')
const saving = ref(false)
const inviting = ref(false)
const creatingBackup = ref(false)
const showInviteDialog = ref(false)
const showBulkInviteDialog = ref(false)

// 表单引用
const generalFormRef = ref<FormInstance>()
const permissionsFormRef = ref<FormInstance>()
const notificationsFormRef = ref<FormInstance>()
const advancedFormRef = ref<FormInstance>()
const inviteFormRef = ref<FormInstance>()

// 基本信息表单
const generalForm = ref({
  name: '',
  description: '',
  isPublic: false,
  timezone: 'Asia/Shanghai',
  language: 'zh-CN'
})

// 权限设置表单
const permissionsForm = ref({
  defaultRole: 'member' as UserRole,
  allowMemberInvite: true,
  allowMemberCreateCollection: true,
  allowMemberDeleteCollection: false,
  allowPublicShare: true,
  allowDataExport: true,
  requireInviteApproval: false
})

// 通知设置表单
const notificationsForm = ref({
  emailNotifications: true,
  newMemberNotification: true,
  collectionUpdateNotification: true,
  testFailureNotification: true,
  dailySummary: false,
  weeklyReport: true
})

// 高级设置表单
const advancedForm = ref({
  enableApiAccess: false,
  apiKey: '',
  debugMode: false,
  requestTimeout: 30000,
  maxConcurrentRequests: 5
})

// 邀请表单
const inviteForm = ref({
  email: '',
  role: 'member' as UserRole,
  message: ''
})

// 备份设置
const backupSettings = ref({
  autoBackup: false,
  frequency: 'weekly',
  retentionCount: 7
})

// 时区选项
const timezones = ref([
  { label: '北京时间 (UTC+8)', value: 'Asia/Shanghai' },
  { label: '东京时间 (UTC+9)', value: 'Asia/Tokyo' },
  { label: '纽约时间 (UTC-5)', value: 'America/New_York' },
  { label: '伦敦时间 (UTC+0)', value: 'Europe/London' },
  { label: '洛杉矶时间 (UTC-8)', value: 'America/Los_Angeles' }
])

// 备份历史（模拟数据）
const backupHistory = ref([
  {
    id: '1',
    name: '自动备份-20240115',
    size: '2.5 MB',
    createdAt: new Date('2024-01-15 02:00:00')
  },
  {
    id: '2',
    name: '手动备份-20240110',
    size: '2.3 MB',
    createdAt: new Date('2024-01-10 14:30:00')
  }
])

// 表单验证规则
const generalFormRules: FormRules = {
  name: [
    { required: true, message: '请输入工作空间名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ]
}

const inviteFormRules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

// 计算属性
const currentWorkspace = computed(() => workspaceStore.currentWorkspace)
const members = computed(() => workspaceStore.teamMembers)

// 方法
const formatTime = (date: Date | string | undefined) => {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

const getStatusLabel = (status: string) => {
  const labels = {
    active: '活跃',
    pending: '待确认',
    inactive: '非活跃'
  }
  return labels[status as keyof typeof labels] || status
}

const getStatusTagType = (status: string) => {
  const types = {
    active: 'success',
    pending: 'warning',
    inactive: 'info'
  }
  return types[status as keyof typeof types] || 'info'
}

const canChangeRole = (member: TeamMember) => {
  // 只有所有者和管理员可以修改角色，且不能修改所有者角色
  return member.role !== ('owner' as TeamRole)
}

const canRemoveMember = (member: TeamMember) => {
  // 不能移除所有者
  return member.role !== ('owner' as TeamRole)
}

const handleSectionChange = (section: string) => {
  activeSection.value = section
}

const handleSaveAll = async () => {
  saving.value = true
  try {
    // 这里应该保存所有设置
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('设置保存成功')
  } catch (error) {
    ElMessage.error('保存设置失败')
  } finally {
    saving.value = false
  }
}

const handleRoleChange = async (_member: TeamMember) => {
  try {
    // 这里应该调用API更新成员角色
    ElMessage.success(`已更新成员的角色`)
  } catch (error) {
    ElMessage.error('更新角色失败')
  }
}

const handleRemoveMember = async (_member: TeamMember) => {
  try {
    await ElMessageBox.confirm(
      `确定要移除该成员吗？`,
      '确认移除',
      {
        confirmButtonText: '移除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 这里应该调用API移除成员
    ElMessage.success('成员移除成功')
  } catch (error) {
    // 用户取消移除
  }
}

const handleInviteMember = async () => {
  if (!inviteFormRef.value) return
  
  try {
    await inviteFormRef.value.validate()
    inviting.value = true
    
    // 这里应该调用API发送邀请
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    showInviteDialog.value = false
    resetInviteForm()
    ElMessage.success('邀请发送成功')
  } catch (error) {
    console.error('Failed to invite member:', error)
  } finally {
    inviting.value = false
  }
}

const configureWebhook = () => {
  ElMessage.info('Webhook配置功能开发中')
}

const configureSlack = () => {
  ElMessage.info('Slack集成功能开发中')
}

const configureJira = () => {
  ElMessage.info('Jira集成功能开发中')
}

const handleCreateBackup = async () => {
  creatingBackup.value = true
  try {
    // 这里应该调用API创建备份
    await new Promise(resolve => setTimeout(resolve, 2000))
    ElMessage.success('备份创建成功')
  } catch (error) {
    ElMessage.error('创建备份失败')
  } finally {
    creatingBackup.value = false
  }
}

const handleRestoreBackup = () => {
  ElMessage.info('恢复备份功能开发中')
}

const handleExportData = () => {
  ElMessage.info('导出数据功能开发中')
}

const handleDownloadBackup = (backup: any) => {
  ElMessage.info(`下载备份: ${backup.name}`)
}

const handleDeleteBackup = async (backup: any) => {
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
    
    ElMessage.success('备份删除成功')
  } catch (error) {
    // 用户取消删除
  }
}

const generateApiKey = () => {
  advancedForm.value.apiKey = 'sk-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  ElMessage.success('API密钥生成成功')
}

const handleClearAllData = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清空所有数据吗？此操作不可逆！',
      '确认清空',
      {
        confirmButtonText: '清空',
        cancelButtonText: '取消',
        type: 'error',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    ElMessage.success('数据清空成功')
  } catch (error) {
    // 用户取消操作
  }
}

const handleTransferOwnership = () => {
  ElMessage.info('转移所有权功能开发中')
}

const handleDeleteWorkspace = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要删除整个工作空间吗？此操作不可逆！',
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'error',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    ElMessage.success('工作空间删除成功')
  } catch (error) {
    // 用户取消操作
  }
}

const resetInviteForm = () => {
  inviteForm.value = {
    email: '',
    role: 'member',
    message: ''
  }
  inviteFormRef.value?.resetFields()
}

// 生命周期
onMounted(() => {
  // 初始化表单数据
  if (currentWorkspace.value) {
    generalForm.value = {
      name: currentWorkspace.value.name,
      description: currentWorkspace.value.description || '',
      isPublic: currentWorkspace.value.isPublic || false,
      timezone: 'Asia/Shanghai',
      language: 'zh-CN'
    }
  }
})
</script>

<style scoped>
.workspace-settings {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  background: white;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-left {
  flex: 1;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 8px;
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

.settings-container {
  display: flex;
  gap: 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.settings-sidebar {
  width: 240px;
  background: #f8fafc;
  border-right: 1px solid #e5e7eb;
}

.settings-menu {
  border: none;
  background: transparent;
}

.settings-menu .el-menu-item {
  height: 48px;
  line-height: 48px;
  margin: 4px 8px;
  border-radius: 6px;
}

.settings-content {
  flex: 1;
  padding: 32px;
  max-width: calc(100% - 240px);
}

.settings-section {
  max-width: 800px;
}

.section-header {
  margin-bottom: 32px;
}

.section-header h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.section-header p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.settings-form {
  max-width: 600px;
}

.form-help-text {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.members-actions {
  margin-bottom: 16px;
}

.integrations-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.integration-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
}

.integration-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.integration-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #3b82f6;
  color: white;
  border-radius: 8px;
}

.integration-details h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.integration-details p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.backup-section {
  margin-bottom: 32px;
}

.backup-section h4,
.backup-actions h4,
.backup-history h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 32px;
}

.danger-actions {
  margin-top: 24px;
}

.danger-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fef2f2;
  margin-bottom: 16px;
}

.danger-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #dc2626;
}

.danger-info p {
  margin: 0;
  color: #7f1d1d;
  font-size: 14px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 1024px) {
  .settings-container {
    flex-direction: column;
  }
  
  .settings-sidebar {
    width: 100%;
  }
  
  .settings-menu {
    display: flex;
    overflow-x: auto;
  }
  
  .settings-menu .el-menu-item {
    white-space: nowrap;
    margin: 4px;
  }
  
  .settings-content {
    max-width: 100%;
    padding: 24px;
  }
}

@media (max-width: 768px) {
  .workspace-settings {
    padding: 16px;
  }
  
  .page-header {
    padding: 16px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
  }
  
  .settings-content {
    padding: 16px;
  }
  
  .integration-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .danger-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}
</style>