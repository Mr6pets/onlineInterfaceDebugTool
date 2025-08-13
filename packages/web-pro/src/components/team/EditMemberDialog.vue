<template>
  <el-dialog
    v-model="visible"
    :title="`编辑成员 - ${member?.name}`"
    width="600px"
    :close-on-click-modal="false"
    @close="resetForm"
  >
    <div class="edit-member-dialog">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <!-- 基本信息 -->
        <div class="form-section">
          <h4>基本信息</h4>
          
          <el-form-item label="头像">
            <div class="avatar-section">
              <el-avatar :src="form.avatar" :size="60">
                {{ form.name?.charAt(0) }}
              </el-avatar>
              <div class="avatar-actions">
                <el-upload
                  class="avatar-uploader"
                  :show-file-list="false"
                  :before-upload="beforeAvatarUpload"
                  :on-success="handleAvatarSuccess"
                  action="#"
                >
                  <el-button size="small">更换头像</el-button>
                </el-upload>
                <el-button @click="removeAvatar" size="small" v-if="form.avatar">
                  移除头像
                </el-button>
              </div>
            </div>
          </el-form-item>
          
          <el-form-item label="姓名" prop="name">
            <el-input v-model="form.name" placeholder="请输入姓名" />
          </el-form-item>
          
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="form.email" placeholder="请输入邮箱" disabled />
            <div class="form-tip">邮箱地址不可修改</div>
          </el-form-item>
          
          <el-form-item label="职位">
            <el-input v-model="form.title" placeholder="请输入职位" />
          </el-form-item>
          
          <el-form-item label="部门">
            <el-select v-model="form.department" placeholder="选择部门" style="width: 100%">
              <el-option label="技术部" value="tech" />
              <el-option label="产品部" value="product" />
              <el-option label="设计部" value="design" />
              <el-option label="运营部" value="operations" />
              <el-option label="市场部" value="marketing" />
              <el-option label="人事部" value="hr" />
            </el-select>
          </el-form-item>
          
          <el-form-item label="电话">
            <el-input v-model="form.phone" placeholder="请输入电话号码" />
          </el-form-item>
          
          <el-form-item label="地址">
            <el-input v-model="form.location" placeholder="请输入工作地址" />
          </el-form-item>
        </div>
        
        <!-- 角色权限 -->
        <div class="form-section">
          <h4>角色权限</h4>
          
          <el-form-item label="团队角色" prop="role">
            <el-radio-group v-model="form.role" @change="onRoleChange">
              <el-radio label="owner" :disabled="!canChangeToOwner">
                <div class="role-option">
                  <div class="role-title">所有者</div>
                  <div class="role-desc">拥有团队的完全控制权</div>
                </div>
              </el-radio>
              <el-radio label="admin" :disabled="!canChangeToAdmin">
                <div class="role-option">
                  <div class="role-title">管理员</div>
                  <div class="role-desc">可以管理团队设置和成员</div>
                </div>
              </el-radio>
              <el-radio label="editor">
                <div class="role-option">
                  <div class="role-title">编辑者</div>
                  <div class="role-desc">可以创建和编辑项目</div>
                </div>
              </el-radio>
              <el-radio label="viewer">
                <div class="role-option">
                  <div class="role-title">查看者</div>
                  <div class="role-desc">只能查看项目内容</div>
                </div>
              </el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="自定义权限">
            <el-button @click="showPermissionsDialog = true" type="primary" plain>
              配置详细权限
            </el-button>
            <div class="permissions-preview">
              <el-tag v-for="perm in selectedPermissions" :key="perm" size="small">
                {{ getPermissionLabel(perm) }}
              </el-tag>
            </div>
          </el-form-item>
        </div>
        
        <!-- 账户状态 -->
        <div class="form-section">
          <h4>账户状态</h4>
          
          <el-form-item label="账户状态">
            <el-radio-group v-model="form.status">
              <el-radio label="active">
                <div class="status-option">
                  <div class="status-title">激活</div>
                  <div class="status-desc">成员可以正常访问团队</div>
                </div>
              </el-radio>
              <el-radio label="suspended">
                <div class="status-option">
                  <div class="status-title">暂停</div>
                  <div class="status-desc">暂时禁止访问，但保留数据</div>
                </div>
              </el-radio>
              <el-radio label="inactive">
                <div class="status-option">
                  <div class="status-title">停用</div>
                  <div class="status-desc">完全禁止访问</div>
                </div>
              </el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="暂停原因" v-if="form.status === 'suspended'">
            <el-input
              v-model="form.suspendReason"
              type="textarea"
              :rows="3"
              placeholder="请输入暂停原因"
            />
          </el-form-item>
          
          <el-form-item label="暂停期限" v-if="form.status === 'suspended'">
            <el-date-picker
              v-model="form.suspendUntil"
              type="datetime"
              placeholder="选择恢复时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
            />
          </el-form-item>
        </div>
        
        <!-- 通知设置 -->
        <div class="form-section">
          <h4>通知设置</h4>
          
          <el-form-item label="邮件通知">
            <el-checkbox-group v-model="form.notifications.email">
              <el-checkbox label="role_changed">角色变更通知</el-checkbox>
              <el-checkbox label="project_assigned">项目分配通知</el-checkbox>
              <el-checkbox label="team_updates">团队更新通知</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          
          <el-form-item label="应用内通知">
            <el-checkbox-group v-model="form.notifications.inApp">
              <el-checkbox label="mentions">@提及通知</el-checkbox>
              <el-checkbox label="comments">评论回复通知</el-checkbox>
              <el-checkbox label="deadlines">截止日期提醒</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
        </div>
        
        <!-- 备注信息 -->
        <div class="form-section">
          <h4>备注信息</h4>
          
          <el-form-item label="内部备注">
            <el-input
              v-model="form.notes"
              type="textarea"
              :rows="3"
              placeholder="添加关于此成员的内部备注（成员不可见）"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
          
          <el-form-item label="标签">
            <div class="tags-input">
              <el-tag
                v-for="tag in form.tags"
                :key="tag"
                closable
                @close="removeTag(tag)"
                class="tag-item"
              >
                {{ tag }}
              </el-tag>
              <el-input
                v-if="showTagInput"
                ref="tagInputRef"
                v-model="newTag"
                size="small"
                @keyup.enter="addTag"
                @blur="addTag"
                class="tag-input"
              />
              <el-button v-else @click="showNewTagInput" size="small" type="primary" plain>
                + 添加标签
              </el-button>
            </div>
          </el-form-item>
        </div>
      </el-form>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button @click="resetForm" type="warning">重置</el-button>
        <el-button type="primary" @click="saveMember" :loading="saving">
          保存修改
        </el-button>
      </div>
    </template>
    
    <!-- 权限配置对话框 -->
    <PermissionsDialog
      v-model="showPermissionsDialog"
      :member="member"
      @save="onPermissionsSave"
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Upload, Delete, Setting } from '@element-plus/icons-vue'
import PermissionsDialog from './PermissionsDialog.vue'
import type { TeamMember } from '@/types'

interface Props {
  modelValue: boolean
  member: TeamMember | null
  currentUserRole: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'save': [member: TeamMember]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const saving = ref(false)
const showPermissionsDialog = ref(false)
const showTagInput = ref(false)
const newTag = ref('')
const selectedPermissions = ref<string[]>([])

// 表单引用
const formRef = ref()
const tagInputRef = ref()

// 表单数据
const form = ref({
  id: '',
  name: '',
  email: '',
  avatar: '',
  title: '',
  department: '',
  phone: '',
  location: '',
  role: 'viewer',
  status: 'active',
  suspendReason: '',
  suspendUntil: '',
  notifications: {
    email: ['role_changed'],
    inApp: ['mentions', 'comments']
  },
  notes: '',
  tags: [] as string[]
})

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 50, message: '姓名长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
}

// 权限检查
const canChangeToOwner = computed(() => {
  return props.currentUserRole === 'owner'
})

const canChangeToAdmin = computed(() => {
  return ['owner', 'admin'].includes(props.currentUserRole)
})

// 初始化表单数据
watch(() => props.member, (member) => {
  if (member) {
    form.value = {
      id: member.id,
      name: member.name || '',
      email: member.email || '',
      avatar: member.avatar || '',
      title: member.title || '',
      department: member.department || '',
      phone: member.phone || '',
      location: member.location || '',
      role: member.role || 'viewer',
      status: member.status || 'active',
      suspendReason: member.suspendReason || '',
      suspendUntil: member.suspendUntil || '',
      notifications: {
        email: member.notifications?.email || ['role_changed'],
        inApp: member.notifications?.inApp || ['mentions', 'comments']
      },
      notes: member.notes || '',
      tags: member.tags || []
    }
    selectedPermissions.value = member.permissions || []
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
  form.value.avatar = response.url
  ElMessage.success('头像上传成功')
}

// 移除头像
const removeAvatar = () => {
  form.value.avatar = ''
}

// 角色变更处理
const onRoleChange = (role: string) => {
  // 根据角色自动设置权限
  const rolePermissions: Record<string, string[]> = {
    owner: ['team.read', 'team.invite', 'team.manage', 'project.create', 'project.delete', 'billing.view', 'billing.manage'],
    admin: ['team.read', 'team.invite', 'team.manage', 'project.create', 'billing.view'],
    editor: ['team.read', 'project.create'],
    viewer: ['team.read']
  }
  
  selectedPermissions.value = rolePermissions[role] || []
}

// 权限保存处理
const onPermissionsSave = (memberId: string, permissions: any) => {
  selectedPermissions.value = Object.keys(permissions.basic).filter(key => permissions.basic[key])
  ElMessage.success('权限配置已更新')
}

// 获取权限标签
const getPermissionLabel = (permission: string) => {
  const labels: Record<string, string> = {
    'team.read': '查看团队',
    'team.invite': '邀请成员',
    'team.manage': '管理团队',
    'project.create': '创建项目',
    'project.delete': '删除项目',
    'billing.view': '查看账单',
    'billing.manage': '管理账单'
  }
  return labels[permission] || permission
}

// 显示新标签输入框
const showNewTagInput = () => {
  showTagInput.value = true
  nextTick(() => {
    tagInputRef.value?.focus()
  })
}

// 添加标签
const addTag = () => {
  const tag = newTag.value.trim()
  if (tag && !form.value.tags.includes(tag)) {
    form.value.tags.push(tag)
  }
  newTag.value = ''
  showTagInput.value = false
}

// 移除标签
const removeTag = (tag: string) => {
  const index = form.value.tags.indexOf(tag)
  if (index > -1) {
    form.value.tags.splice(index, 1)
  }
}

// 保存成员信息
const saveMember = async () => {
  const valid = await formRef.value?.validate()
  if (!valid) return
  
  saving.value = true
  try {
    const memberData: TeamMember = {
      ...form.value,
      permissions: selectedPermissions.value,
      updatedAt: new Date().toISOString()
    }
    
    emit('save', memberData)
    ElMessage.success('成员信息保存成功')
    visible.value = false
  } catch (error) {
    ElMessage.error('保存失败，请重试')
  } finally {
    saving.value = false
  }
}

// 重置表单
const resetForm = () => {
  if (props.member) {
    // 重置为原始数据
    watch(() => props.member, (member) => {
      if (member) {
        Object.assign(form.value, {
          id: member.id,
          name: member.name || '',
          email: member.email || '',
          avatar: member.avatar || '',
          title: member.title || '',
          department: member.department || '',
          phone: member.phone || '',
          location: member.location || '',
          role: member.role || 'viewer',
          status: member.status || 'active',
          suspendReason: member.suspendReason || '',
          suspendUntil: member.suspendUntil || '',
          notifications: {
            email: member.notifications?.email || ['role_changed'],
            inApp: member.notifications?.inApp || ['mentions', 'comments']
          },
          notes: member.notes || '',
          tags: [...(member.tags || [])]
        })
        selectedPermissions.value = [...(member.permissions || [])]
      }
    }, { immediate: true })
    
    ElMessage.success('已重置为原始数据')
  }
}
</script>

<style lang="scss" scoped>
.edit-member-dialog {
  .form-section {
    margin-bottom: 32px;
    
    h4 {
      margin: 0 0 16px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid #e4e7ed;
      font-size: 14px;
      font-weight: 500;
      color: #303133;
    }
  }
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 16px;
  
  .avatar-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.role-option, .status-option {
  .role-title, .status-title {
    font-weight: 500;
    margin-bottom: 4px;
  }
  
  .role-desc, .status-desc {
    font-size: 12px;
    color: #909399;
    line-height: 1.4;
  }
}

.permissions-preview {
  margin-top: 8px;
  
  .el-tag {
    margin: 2px 4px 2px 0;
  }
}

.tags-input {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  
  .tag-item {
    margin: 2px;
  }
  
  .tag-input {
    width: 100px;
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

// 响应式设计
@media (max-width: 768px) {
  .avatar-section {
    flex-direction: column;
    align-items: flex-start;
    
    .avatar-actions {
      flex-direction: row;
    }
  }
  
  .tags-input {
    .tag-input {
      width: 80px;
    }
  }
}
</style>