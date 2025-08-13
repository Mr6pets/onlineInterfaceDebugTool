<template>
  <el-dialog
    v-model="visible"
    title="团队设置"
    width="700px"
    :close-on-click-modal="false"
    @close="resetForm"
  >
    <div class="team-settings-dialog">
      <el-tabs v-model="activeTab" class="settings-tabs">
        <!-- 基本信息 -->
        <el-tab-pane label="基本信息" name="basic">
          <el-form :model="basicForm" :rules="basicRules" ref="basicFormRef" label-width="100px">
            <el-form-item label="团队名称" prop="name">
              <el-input v-model="basicForm.name" placeholder="请输入团队名称" />
            </el-form-item>
            
            <el-form-item label="团队描述" prop="description">
              <el-input
                v-model="basicForm.description"
                type="textarea"
                :rows="3"
                placeholder="请输入团队描述"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
            
            <el-form-item label="团队头像">
              <div class="avatar-upload">
                <el-upload
                  class="avatar-uploader"
                  :show-file-list="false"
                  :before-upload="beforeAvatarUpload"
                  :on-success="handleAvatarSuccess"
                  action="#"
                >
                  <el-avatar v-if="basicForm.avatar" :src="basicForm.avatar" :size="80" />
                  <div v-else class="avatar-placeholder">
                    <el-icon><Plus /></el-icon>
                    <div>上传头像</div>
                  </div>
                </el-upload>
                <div class="avatar-actions">
                  <el-button @click="removeAvatar" size="small" v-if="basicForm.avatar">
                    移除头像
                  </el-button>
                </div>
              </div>
            </el-form-item>
            
            <el-form-item label="团队网站">
              <el-input v-model="basicForm.website" placeholder="https://example.com" />
            </el-form-item>
            
            <el-form-item label="联系邮箱">
              <el-input v-model="basicForm.contactEmail" placeholder="contact@example.com" />
            </el-form-item>
            
            <el-form-item label="时区设置">
              <el-select v-model="basicForm.timezone" placeholder="选择时区" style="width: 100%">
                <el-option label="北京时间 (UTC+8)" value="Asia/Shanghai" />
                <el-option label="东京时间 (UTC+9)" value="Asia/Tokyo" />
                <el-option label="纽约时间 (UTC-5)" value="America/New_York" />
                <el-option label="伦敦时间 (UTC+0)" value="Europe/London" />
                <el-option label="洛杉矶时间 (UTC-8)" value="America/Los_Angeles" />
              </el-select>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <!-- 访问控制 -->
        <el-tab-pane label="访问控制" name="access">
          <el-form :model="accessForm" label-width="120px">
            <el-form-item label="团队可见性">
              <el-radio-group v-model="accessForm.visibility">
                <el-radio label="private">
                  <div class="radio-option">
                    <div class="option-title">私有团队</div>
                    <div class="option-desc">只有受邀成员可以查看和加入</div>
                  </div>
                </el-radio>
                <el-radio label="internal">
                  <div class="radio-option">
                    <div class="option-title">内部团队</div>
                    <div class="option-desc">组织内所有成员可以查看和申请加入</div>
                  </div>
                </el-radio>
                <el-radio label="public">
                  <div class="radio-option">
                    <div class="option-title">公开团队</div>
                    <div class="option-desc">任何人都可以查看，但需要申请加入</div>
                  </div>
                </el-radio>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item label="加入审批">
              <el-switch
                v-model="accessForm.requireApproval"
                active-text="需要管理员审批"
                inactive-text="自动加入"
              />
            </el-form-item>
            
            <el-form-item label="邀请权限">
              <el-checkbox-group v-model="accessForm.invitePermissions">
                <el-checkbox label="owner">所有者</el-checkbox>
                <el-checkbox label="admin">管理员</el-checkbox>
                <el-checkbox label="editor">编辑者</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            
            <el-form-item label="域名限制">
              <el-input
                v-model="accessForm.allowedDomains"
                type="textarea"
                :rows="3"
                placeholder="限制特定域名的邮箱加入，每行一个域名&#10;例如：&#10;company.com&#10;example.org"
              />
              <div class="form-tip">
                留空表示不限制域名
              </div>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <!-- 通知设置 -->
        <el-tab-pane label="通知设置" name="notifications">
          <el-form :model="notificationForm" label-width="120px">
            <el-form-item label="邮件通知">
              <div class="notification-options">
                <el-checkbox v-model="notificationForm.email.memberJoined">
                  新成员加入
                </el-checkbox>
                <el-checkbox v-model="notificationForm.email.memberLeft">
                  成员离开
                </el-checkbox>
                <el-checkbox v-model="notificationForm.email.roleChanged">
                  角色变更
                </el-checkbox>
                <el-checkbox v-model="notificationForm.email.projectCreated">
                  项目创建
                </el-checkbox>
                <el-checkbox v-model="notificationForm.email.weeklyReport">
                  周报
                </el-checkbox>
              </div>
            </el-form-item>
            
            <el-form-item label="应用内通知">
              <div class="notification-options">
                <el-checkbox v-model="notificationForm.inApp.mentions">
                  @提及
                </el-checkbox>
                <el-checkbox v-model="notificationForm.inApp.comments">
                  评论回复
                </el-checkbox>
                <el-checkbox v-model="notificationForm.inApp.assignments">
                  任务分配
                </el-checkbox>
                <el-checkbox v-model="notificationForm.inApp.deadlines">
                  截止日期提醒
                </el-checkbox>
              </div>
            </el-form-item>
            
            <el-form-item label="通知频率">
              <el-select v-model="notificationForm.frequency" style="width: 200px">
                <el-option label="实时" value="realtime" />
                <el-option label="每小时汇总" value="hourly" />
                <el-option label="每日汇总" value="daily" />
                <el-option label="每周汇总" value="weekly" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="免打扰时间">
              <el-time-picker
                v-model="notificationForm.quietHours"
                is-range
                range-separator="至"
                start-placeholder="开始时间"
                end-placeholder="结束时间"
                format="HH:mm"
                value-format="HH:mm"
              />
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <!-- 集成设置 -->
        <el-tab-pane label="集成设置" name="integrations">
          <div class="integrations-section">
            <div class="integration-item" v-for="integration in integrations" :key="integration.id">
              <div class="integration-info">
                <div class="integration-icon">
                  <el-avatar :src="integration.icon" :size="40">
                    {{ integration.name.charAt(0) }}
                  </el-avatar>
                </div>
                <div class="integration-details">
                  <h4>{{ integration.name }}</h4>
                  <p>{{ integration.description }}</p>
                </div>
              </div>
              <div class="integration-actions">
                <el-switch
                  v-model="integration.enabled"
                  @change="toggleIntegration(integration)"
                />
                <el-button 
                  v-if="integration.enabled" 
                  @click="configureIntegration(integration)"
                  size="small"
                >
                  配置
                </el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 危险操作 -->
        <el-tab-pane label="危险操作" name="danger">
          <div class="danger-section">
            <el-alert
              title="危险操作"
              type="warning"
              description="以下操作不可逆，请谨慎操作"
              show-icon
              :closable="false"
            />
            
            <div class="danger-actions">
              <div class="danger-item">
                <div class="danger-info">
                  <h4>转移团队所有权</h4>
                  <p>将团队所有权转移给其他管理员</p>
                </div>
                <el-button @click="showTransferDialog = true" type="warning">
                  转移所有权
                </el-button>
              </div>
              
              <div class="danger-item">
                <div class="danger-info">
                  <h4>删除团队</h4>
                  <p>永久删除团队及其所有数据，此操作不可恢复</p>
                </div>
                <el-button @click="showDeleteDialog = true" type="danger">
                  删除团队
                </el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" @click="saveSettings" :loading="saving">
          保存设置
        </el-button>
      </div>
    </template>
    
    <!-- 转移所有权对话框 -->
    <el-dialog v-model="showTransferDialog" title="转移团队所有权" width="400px">
      <p>请选择新的团队所有者：</p>
      <el-select v-model="transferTarget" placeholder="选择成员" style="width: 100%">
        <el-option
          v-for="admin in teamAdmins"
          :key="admin.id"
          :label="admin.name"
          :value="admin.id"
        />
      </el-select>
      <template #footer>
        <el-button @click="showTransferDialog = false">取消</el-button>
        <el-button type="warning" @click="transferOwnership">
          确认转移
        </el-button>
      </template>
    </el-dialog>
    
    <!-- 删除团队对话框 -->
    <el-dialog v-model="showDeleteDialog" title="删除团队" width="400px">
      <el-alert
        title="此操作不可逆"
        type="error"
        description="删除团队将永久删除所有数据，包括项目、成员、历史记录等"
        show-icon
        :closable="false"
      />
      <p style="margin: 16px 0;">请输入团队名称以确认删除：</p>
      <el-input v-model="deleteConfirmText" placeholder="输入团队名称" />
      <template #footer>
        <el-button @click="showDeleteDialog = false">取消</el-button>
        <el-button 
          type="danger" 
          @click="deleteTeam"
          :disabled="deleteConfirmText !== team?.name"
        >
          确认删除
        </el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import type { Team, TeamMember } from '@/types'

interface Props {
  modelValue: boolean
  team: Team | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'save': [settings: any]
  'transfer': [targetId: string]
  'delete': []
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const activeTab = ref('basic')
const saving = ref(false)
const showTransferDialog = ref(false)
const showDeleteDialog = ref(false)
const transferTarget = ref('')
const deleteConfirmText = ref('')

// 表单引用
const basicFormRef = ref()

// 基本信息表单
const basicForm = ref({
  name: '',
  description: '',
  avatar: '',
  website: '',
  contactEmail: '',
  timezone: 'Asia/Shanghai'
})

// 访问控制表单
const accessForm = ref({
  visibility: 'private',
  requireApproval: true,
  invitePermissions: ['owner', 'admin'],
  allowedDomains: ''
})

// 通知设置表单
const notificationForm = ref({
  email: {
    memberJoined: true,
    memberLeft: true,
    roleChanged: true,
    projectCreated: false,
    weeklyReport: true
  },
  inApp: {
    mentions: true,
    comments: true,
    assignments: true,
    deadlines: true
  },
  frequency: 'realtime',
  quietHours: ['22:00', '08:00']
})

// 集成设置
const integrations = ref([
  {
    id: 'slack',
    name: 'Slack',
    description: '将通知发送到 Slack 频道',
    icon: '',
    enabled: false
  },
  {
    id: 'github',
    name: 'GitHub',
    description: '同步 GitHub 仓库和问题',
    icon: '',
    enabled: false
  },
  {
    id: 'jira',
    name: 'Jira',
    description: '集成 Jira 项目管理',
    icon: '',
    enabled: false
  }
])

// 表单验证规则
const basicRules = {
  name: [
    { required: true, message: '请输入团队名称', trigger: 'blur' },
    { min: 2, max: 50, message: '团队名称长度在 2 到 50 个字符', trigger: 'blur' }
  ]
}

// 团队管理员列表
const teamAdmins = computed(() => {
  // 这里应该从团队成员中筛选管理员
  return [
    { id: '1', name: '管理员1' },
    { id: '2', name: '管理员2' }
  ]
})

// 初始化表单数据
watch(() => props.team, (team) => {
  if (team) {
    basicForm.value = {
      name: team.name || '',
      description: team.description || '',
      avatar: team.avatar || '',
      website: team.website || '',
      contactEmail: team.contactEmail || '',
      timezone: team.timezone || 'Asia/Shanghai'
    }
    
    // 初始化其他表单数据
    if (team.settings) {
      Object.assign(accessForm.value, team.settings.access || {})
      Object.assign(notificationForm.value, team.settings.notifications || {})
    }
  }
}, { immediate: true })

// 头像上传前验证
const beforeAvatarUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB')
    return false
  }
  return true
}

// 头像上传成功
const handleAvatarSuccess = (response: any) => {
  basicForm.value.avatar = response.url
  ElMessage.success('头像上传成功')
}

// 移除头像
const removeAvatar = () => {
  basicForm.value.avatar = ''
}

// 切换集成
const toggleIntegration = (integration: any) => {
  ElMessage.success(`${integration.name} ${integration.enabled ? '已启用' : '已禁用'}`)
}

// 配置集成
const configureIntegration = (integration: any) => {
  ElMessage.info(`配置 ${integration.name} 集成`)
}

// 转移所有权
const transferOwnership = async () => {
  if (!transferTarget.value) {
    ElMessage.warning('请选择新的团队所有者')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      '确定要转移团队所有权吗？转移后您将失去团队的最高管理权限。',
      '确认转移',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    emit('transfer', transferTarget.value)
    showTransferDialog.value = false
    ElMessage.success('所有权转移成功')
  } catch {
    // 用户取消
  }
}

// 删除团队
const deleteTeam = async () => {
  try {
    await ElMessageBox.confirm(
      '此操作将永久删除团队及其所有数据，确定要继续吗？',
      '确认删除',
      {
        confirmButtonText: '确认删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    )
    
    emit('delete')
    showDeleteDialog.value = false
    visible.value = false
    ElMessage.success('团队删除成功')
  } catch {
    // 用户取消
  }
}

// 保存设置
const saveSettings = async () => {
  const valid = await basicFormRef.value?.validate()
  if (!valid) {
    activeTab.value = 'basic'
    return
  }
  
  saving.value = true
  try {
    const settings = {
      basic: basicForm.value,
      access: accessForm.value,
      notifications: notificationForm.value,
      integrations: integrations.value
    }
    
    emit('save', settings)
    ElMessage.success('设置保存成功')
    visible.value = false
  } catch (error) {
    ElMessage.error('设置保存失败')
  } finally {
    saving.value = false
  }
}

// 重置表单
const resetForm = () => {
  deleteConfirmText.value = ''
  transferTarget.value = ''
  activeTab.value = 'basic'
}
</script>

<style lang="scss" scoped>
.team-settings-dialog {
  .settings-tabs {
    margin-top: 16px;
  }
}

.avatar-upload {
  display: flex;
  align-items: center;
  gap: 16px;
  
  .avatar-uploader {
    .avatar-placeholder {
      width: 80px;
      height: 80px;
      border: 2px dashed #d9d9d9;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: border-color 0.3s;
      
      &:hover {
        border-color: #409eff;
      }
      
      .el-icon {
        font-size: 24px;
        color: #8c939d;
        margin-bottom: 4px;
      }
      
      div {
        font-size: 12px;
        color: #8c939d;
      }
    }
  }
}

.radio-option {
  .option-title {
    font-weight: 500;
    margin-bottom: 4px;
  }
  
  .option-desc {
    font-size: 12px;
    color: #909399;
    line-height: 1.4;
  }
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.notification-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.integrations-section {
  .integration-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    margin-bottom: 12px;
    
    .integration-info {
      display: flex;
      align-items: center;
      gap: 12px;
      
      .integration-details {
        h4 {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 500;
        }
        
        p {
          margin: 0;
          font-size: 12px;
          color: #606266;
        }
      }
    }
    
    .integration-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
}

.danger-section {
  .danger-actions {
    margin-top: 20px;
    
    .danger-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border: 1px solid #f56c6c;
      border-radius: 8px;
      margin-bottom: 12px;
      background: #fef0f0;
      
      .danger-info {
        h4 {
          margin: 0 0 4px 0;
          color: #f56c6c;
          font-size: 14px;
          font-weight: 500;
        }
        
        p {
          margin: 0;
          font-size: 12px;
          color: #606266;
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>