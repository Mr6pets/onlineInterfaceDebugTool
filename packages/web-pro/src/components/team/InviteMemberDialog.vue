<template>
  <el-dialog
    v-model="visible"
    title="邀请团队成员"
    width="600px"
    :close-on-click-modal="false"
    @close="resetForm"
  >
    <div class="invite-dialog">
      <el-tabs v-model="activeTab" class="invite-tabs">
        <!-- 邮箱邀请 -->
        <el-tab-pane label="邮箱邀请" name="email">
          <el-form :model="emailForm" :rules="emailRules" ref="emailFormRef" label-width="80px">
            <el-form-item label="邮箱地址" prop="emails">
              <el-input
                v-model="emailInput"
                type="textarea"
                :rows="4"
                placeholder="请输入邮箱地址，多个邮箱用换行或逗号分隔&#10;例如：&#10;user1@example.com&#10;user2@example.com"
                @input="parseEmails"
              />
              <div class="email-tags" v-if="emailForm.emails.length > 0">
                <el-tag
                  v-for="(email, index) in emailForm.emails"
                  :key="index"
                  closable
                  @close="removeEmail(index)"
                  :type="isValidEmail(email) ? 'success' : 'danger'"
                >
                  {{ email }}
                </el-tag>
              </div>
            </el-form-item>
            
            <el-form-item label="默认角色" prop="role">
              <el-select v-model="emailForm.role" style="width: 100%">
                <el-option label="查看者" value="viewer" />
                <el-option label="编辑者" value="editor" />
                <el-option label="管理员" value="admin" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="邀请消息">
              <el-input
                v-model="emailForm.message"
                type="textarea"
                :rows="3"
                placeholder="可选：添加个人邀请消息"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
            
            <el-form-item label="邀请设置">
              <el-checkbox v-model="emailForm.sendWelcomeEmail">
                发送欢迎邮件
              </el-checkbox>
              <el-checkbox v-model="emailForm.requireApproval">
                需要管理员审批
              </el-checkbox>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <!-- 邀请链接 -->
        <el-tab-pane label="邀请链接" name="link">
          <div class="invite-link-section">
            <el-form :model="linkForm" label-width="80px">
              <el-form-item label="链接角色">
                <el-select v-model="linkForm.role" style="width: 100%">
                  <el-option label="查看者" value="viewer" />
                  <el-option label="编辑者" value="editor" />
                  <el-option label="管理员" value="admin" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="有效期">
                <el-select v-model="linkForm.expiry" style="width: 100%">
                  <el-option label="1小时" value="1h" />
                  <el-option label="24小时" value="24h" />
                  <el-option label="7天" value="7d" />
                  <el-option label="30天" value="30d" />
                  <el-option label="永不过期" value="never" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="使用次数">
                <el-input-number
                  v-model="linkForm.maxUses"
                  :min="1"
                  :max="100"
                  placeholder="最大使用次数"
                  style="width: 100%"
                />
              </el-form-item>
            </el-form>
            
            <div class="generated-link" v-if="inviteLink">
              <el-alert
                title="邀请链接已生成"
                type="success"
                :closable="false"
                show-icon
              />
              <div class="link-container">
                <el-input
                  v-model="inviteLink"
                  readonly
                  class="link-input"
                >
                  <template #append>
                    <el-button @click="copyLink" :icon="DocumentCopy">
                      复制
                    </el-button>
                  </template>
                </el-input>
              </div>
              <div class="link-info">
                <p><strong>角色：</strong>{{ getRoleLabel(linkForm.role) }}</p>
                <p><strong>有效期：</strong>{{ getExpiryLabel(linkForm.expiry) }}</p>
                <p><strong>剩余使用次数：</strong>{{ linkForm.maxUses }}</p>
              </div>
            </div>
            
            <div class="link-actions">
              <el-button @click="generateLink" type="primary" :loading="generating">
                {{ inviteLink ? '重新生成' : '生成邀请链接' }}
              </el-button>
              <el-button v-if="inviteLink" @click="shareLink">
                分享链接
              </el-button>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 批量导入 -->
        <el-tab-pane label="批量导入" name="import">
          <div class="import-section">
            <el-upload
              ref="uploadRef"
              :auto-upload="false"
              :show-file-list="false"
              accept=".csv,.xlsx"
              @change="handleFileChange"
              drag
            >
              <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
              <div class="el-upload__text">
                将文件拖到此处，或<em>点击上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  支持 CSV 和 Excel 文件，文件大小不超过 2MB
                </div>
              </template>
            </el-upload>
            
            <div class="import-template">
              <h4>模板格式</h4>
              <p>请确保文件包含以下列：</p>
              <ul>
                <li><strong>email</strong> - 邮箱地址（必填）</li>
                <li><strong>name</strong> - 姓名（可选）</li>
                <li><strong>role</strong> - 角色（viewer/editor/admin，默认为viewer）</li>
              </ul>
              <el-button @click="downloadTemplate" type="text">
                下载模板文件
              </el-button>
            </div>
            
            <div v-if="importData.length > 0" class="import-preview">
              <h4>导入预览（{{ importData.length }} 条记录）</h4>
              <el-table :data="importData.slice(0, 5)" size="small">
                <el-table-column prop="email" label="邮箱" />
                <el-table-column prop="name" label="姓名" />
                <el-table-column prop="role" label="角色" />
                <el-table-column label="状态">
                  <template #default="{ row }">
                    <el-tag :type="isValidEmail(row.email) ? 'success' : 'danger'" size="small">
                      {{ isValidEmail(row.email) ? '有效' : '无效' }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
              <p v-if="importData.length > 5" class="preview-note">
                仅显示前5条记录，共{{ importData.length }}条
              </p>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="sendInvites" 
          :loading="sending"
          :disabled="!canSendInvites"
        >
          {{ getInviteButtonText() }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { DocumentCopy, UploadFilled } from '@element-plus/icons-vue'
import type { Team } from '@/types'

interface Props {
  modelValue: boolean
  team: Team | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'invite': [data: any]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const activeTab = ref('email')
const sending = ref(false)
const generating = ref(false)
const emailInput = ref('')
const inviteLink = ref('')
const importData = ref<any[]>([])

// 表单引用
const emailFormRef = ref()
const uploadRef = ref()

// 邮箱邀请表单
const emailForm = ref({
  emails: [] as string[],
  role: 'viewer',
  message: '',
  sendWelcomeEmail: true,
  requireApproval: false
})

// 链接邀请表单
const linkForm = ref({
  role: 'viewer',
  expiry: '7d',
  maxUses: 10
})

// 表单验证规则
const emailRules = {
  emails: [
    { required: true, message: '请输入至少一个邮箱地址', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择默认角色', trigger: 'change' }
  ]
}

// 解析邮箱输入
const parseEmails = () => {
  const emails = emailInput.value
    .split(/[\n,;]/) // 支持换行、逗号、分号分隔
    .map(email => email.trim())
    .filter(email => email.length > 0)
  
  emailForm.value.emails = [...new Set(emails)] // 去重
}

// 移除邮箱
const removeEmail = (index: number) => {
  emailForm.value.emails.splice(index, 1)
  updateEmailInput()
}

// 更新邮箱输入框
const updateEmailInput = () => {
  emailInput.value = emailForm.value.emails.join('\n')
}

// 验证邮箱格式
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 检查是否可以发送邀请
const canSendInvites = computed(() => {
  switch (activeTab.value) {
    case 'email':
      return emailForm.value.emails.length > 0 && 
             emailForm.value.emails.every(email => isValidEmail(email))
    case 'import':
      return importData.value.length > 0 && 
             importData.value.every(item => isValidEmail(item.email))
    default:
      return false
  }
})

// 获取邀请按钮文本
const getInviteButtonText = (): string => {
  switch (activeTab.value) {
    case 'email':
      return `发送邀请 (${emailForm.value.emails.length})`
    case 'import':
      return `批量邀请 (${importData.value.length})`
    default:
      return '发送邀请'
  }
}

// 获取角色标签
const getRoleLabel = (role: string): string => {
  const roleMap: Record<string, string> = {
    viewer: '查看者',
    editor: '编辑者',
    admin: '管理员'
  }
  return roleMap[role] || role
}

// 获取过期时间标签
const getExpiryLabel = (expiry: string): string => {
  const expiryMap: Record<string, string> = {
    '1h': '1小时',
    '24h': '24小时',
    '7d': '7天',
    '30d': '30天',
    'never': '永不过期'
  }
  return expiryMap[expiry] || expiry
}

// 生成邀请链接
const generateLink = async () => {
  generating.value = true
  try {
    // 模拟生成邀请链接
    await new Promise(resolve => setTimeout(resolve, 1000))
    inviteLink.value = `https://app.example.com/invite/${Math.random().toString(36).substr(2, 9)}`
    ElMessage.success('邀请链接生成成功')
  } catch (error) {
    ElMessage.error('生成邀请链接失败')
  } finally {
    generating.value = false
  }
}

// 复制链接
const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(inviteLink.value)
    ElMessage.success('链接已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

// 分享链接
const shareLink = () => {
  if (navigator.share) {
    navigator.share({
      title: '团队邀请',
      text: `邀请您加入 ${props.team?.name} 团队`,
      url: inviteLink.value
    })
  } else {
    copyLink()
  }
}

// 处理文件上传
const handleFileChange = (file: any) => {
  const reader = new FileReader()
  reader.onload = () => {
    try {
      // 这里应该解析CSV/Excel文件
      // 简化示例，实际需要使用相应的解析库
      const mockData = [
        { email: 'user1@example.com', name: '用户1', role: 'viewer' },
        { email: 'user2@example.com', name: '用户2', role: 'editor' }
      ]
      importData.value = mockData
      ElMessage.success('文件解析成功')
    } catch (error) {
      ElMessage.error('文件解析失败')
    }
  }
  reader.readAsText(file.raw)
}

// 下载模板文件
const downloadTemplate = () => {
  const csvContent = 'email,name,role\nuser@example.com,用户名,viewer'
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'invite_template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// 发送邀请
const sendInvites = async () => {
  if (activeTab.value === 'email') {
    const valid = await emailFormRef.value?.validate()
    if (!valid) return
  }
  
  sending.value = true
  try {
    let inviteData
    
    switch (activeTab.value) {
      case 'email':
        inviteData = {
          type: 'email',
          emails: emailForm.value.emails,
          role: emailForm.value.role,
          message: emailForm.value.message,
          sendWelcomeEmail: emailForm.value.sendWelcomeEmail,
          requireApproval: emailForm.value.requireApproval
        }
        break
      case 'import':
        inviteData = {
          type: 'import',
          members: importData.value
        }
        break
    }
    
    emit('invite', inviteData)
    ElMessage.success('邀请发送成功')
    visible.value = false
  } catch (error) {
    ElMessage.error('邀请发送失败')
  } finally {
    sending.value = false
  }
}

// 重置表单
const resetForm = () => {
  emailInput.value = ''
  emailForm.value = {
    emails: [],
    role: 'viewer',
    message: '',
    sendWelcomeEmail: true,
    requireApproval: false
  }
  linkForm.value = {
    role: 'viewer',
    expiry: '7d',
    maxUses: 10
  }
  inviteLink.value = ''
  importData.value = []
  activeTab.value = 'email'
}
</script>

<style lang="scss" scoped>
.invite-dialog {
  .invite-tabs {
    margin-top: 16px;
  }
}

.email-tags {
  margin-top: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.invite-link-section {
  .generated-link {
    margin: 20px 0;
    padding: 16px;
    background: #f5f7fa;
    border-radius: 8px;
    
    .link-container {
      margin: 12px 0;
    }
    
    .link-info {
      margin-top: 12px;
      
      p {
        margin: 4px 0;
        font-size: 14px;
        color: #606266;
      }
    }
  }
  
  .link-actions {
    margin-top: 16px;
    display: flex;
    gap: 8px;
  }
}

.import-section {
  .import-template {
    margin: 20px 0;
    padding: 16px;
    background: #f5f7fa;
    border-radius: 8px;
    
    h4 {
      margin: 0 0 8px 0;
      color: #303133;
    }
    
    p {
      margin: 8px 0;
      color: #606266;
    }
    
    ul {
      margin: 8px 0;
      padding-left: 20px;
      
      li {
        margin: 4px 0;
        color: #606266;
      }
    }
  }
  
  .import-preview {
    margin-top: 20px;
    
    h4 {
      margin: 0 0 12px 0;
      color: #303133;
    }
    
    .preview-note {
      margin-top: 8px;
      font-size: 12px;
      color: #909399;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>