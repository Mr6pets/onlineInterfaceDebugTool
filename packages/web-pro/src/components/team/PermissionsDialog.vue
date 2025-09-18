<template>
  <el-dialog
    v-model="visible"
    :title="`权限管理 - ${member?.name}`"
    width="800px"
    :close-on-click-modal="false"
    @close="resetForm"
  >
    <div class="permissions-dialog">
      <div class="member-info">
        <el-avatar :src="member?.avatar" :size="50">
          {{ member?.name?.charAt(0) }}
        </el-avatar>
        <div class="member-details">
          <h3>{{ member?.name }}</h3>
          <p>{{ member?.email }}</p>
          <el-tag :type="getRoleType(member?.role)">{{ getRoleLabel(member?.role) }}</el-tag>
        </div>
      </div>
      
      <el-divider />
      
      <el-tabs v-model="activeTab" class="permissions-tabs">
        <!-- 基础权限 -->
        <el-tab-pane label="基础权限" name="basic">
          <div class="permissions-section">
            <h4>团队权限</h4>
            <div class="permission-group">
              <div class="permission-item" v-for="permission in basicPermissions" :key="permission.key">
                <div class="permission-info">
                  <div class="permission-title">
                    <el-icon><component :is="permission.icon" /></el-icon>
                    {{ permission.label }}
                  </div>
                  <div class="permission-desc">{{ permission.description }}</div>
                </div>
                <div class="permission-control">
                  <el-switch
                    v-model="permissions[permission.key]"
                    :disabled="isPermissionDisabled(permission.key)"
                    @change="onPermissionChange(permission.key, $event)"
                  />
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 项目权限 -->
        <el-tab-pane label="项目权限" name="projects">
          <div class="permissions-section">
            <div class="section-header">
              <h4>项目访问权限</h4>
              <el-button @click="showProjectSelector = true" size="small">
                添加项目
              </el-button>
            </div>
            
            <div class="project-permissions">
              <div class="project-item" v-for="project in projectPermissions" :key="project.id">
                <div class="project-info">
                  <div class="project-name">{{ project.name }}</div>
                  <div class="project-desc">{{ project.description }}</div>
                </div>
                <div class="project-controls">
                  <el-select v-model="project.permission" size="small" style="width: 120px">
                    <el-option label="只读" value="read" />
                    <el-option label="编辑" value="write" />
                    <el-option label="管理" value="admin" />
                  </el-select>
                  <el-button @click="removeProjectPermission(project.id)" size="small" type="danger" plain>
                    移除
                  </el-button>
                </div>
              </div>
              
              <el-empty v-if="projectPermissions.length === 0" description="暂无项目权限" />
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 资源权限 -->
        <el-tab-pane label="资源权限" name="resources">
          <div class="permissions-section">
            <h4>资源访问控制</h4>
            <div class="resource-permissions">
              <div class="resource-category" v-for="category in resourceCategories" :key="category.key">
                <div class="category-header">
                  <h5>{{ category.label }}</h5>
                  <el-switch
                    v-model="category.enabled"
                    @change="toggleCategoryPermissions(category.key, $event)"
                  />
                </div>
                <div class="category-items" v-if="category.enabled">
                  <div class="resource-item" v-for="resource in category.resources" :key="resource.key">
                    <div class="resource-info">
                      <span class="resource-name">{{ resource.label }}</span>
                      <span class="resource-desc">{{ resource.description }}</span>
                    </div>
                    <el-checkbox-group v-model="resourcePermissions[resource.key]">
                      <el-checkbox label="read">查看</el-checkbox>
                      <el-checkbox label="write">编辑</el-checkbox>
                      <el-checkbox label="delete">删除</el-checkbox>
                    </el-checkbox-group>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 时间限制 -->
        <el-tab-pane label="时间限制" name="time">
          <div class="permissions-section">
            <h4>访问时间控制</h4>
            
            <el-form :model="timeRestrictions" label-width="120px">
              <el-form-item label="启用时间限制">
                <el-switch v-model="timeRestrictions.enabled" />
              </el-form-item>
              
              <template v-if="timeRestrictions.enabled">
                <el-form-item label="访问时间段">
                  <div class="time-ranges">
                    <div class="time-range" v-for="(range, index) in timeRestrictions.ranges" :key="index">
                      <el-select v-model="range.days" multiple placeholder="选择日期" style="width: 200px">
                        <el-option label="周一" value="1" />
                        <el-option label="周二" value="2" />
                        <el-option label="周三" value="3" />
                        <el-option label="周四" value="4" />
                        <el-option label="周五" value="5" />
                        <el-option label="周六" value="6" />
                        <el-option label="周日" value="0" />
                      </el-select>
                      <el-time-picker
                        v-model="range.startTime"
                        placeholder="开始时间"
                        format="HH:mm"
                        value-format="HH:mm"
                      />
                      <span>至</span>
                      <el-time-picker
                        v-model="range.endTime"
                        placeholder="结束时间"
                        format="HH:mm"
                        value-format="HH:mm"
                      />
                      <el-button @click="removeTimeRange(index)" size="small" type="danger" plain>
                        删除
                      </el-button>
                    </div>
                    <el-button @click="addTimeRange" size="small" type="primary" plain>
                      添加时间段
                    </el-button>
                  </div>
                </el-form-item>
                
                <el-form-item label="IP地址限制">
                  <el-input
                    v-model="timeRestrictions.allowedIPs"
                    type="textarea"
                    :rows="3"
                    placeholder="限制访问的IP地址，每行一个&#10;支持CIDR格式，如：192.168.1.0/24"
                  />
                </el-form-item>
                
                <el-form-item label="有效期">
                  <el-date-picker
                    v-model="timeRestrictions.expiryDate"
                    type="datetime"
                    placeholder="选择过期时间"
                    format="YYYY-MM-DD HH:mm:ss"
                    value-format="YYYY-MM-DD HH:mm:ss"
                  />
                </el-form-item>
              </template>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>
      
      <!-- 权限预览 -->
      <div class="permissions-preview">
        <h4>权限预览</h4>
        <div class="preview-content">
          <el-tag v-for="perm in enabledPermissions" :key="perm" size="small" class="permission-tag">
            {{ getPermissionLabel(perm) }}
          </el-tag>
          <span v-if="enabledPermissions.length === 0" class="no-permissions">
            暂无权限
          </span>
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button @click="resetToDefault" type="warning">重置为默认</el-button>
        <el-button type="primary" @click="savePermissions" :loading="saving">
          保存权限
        </el-button>
      </div>
    </template>
    
    <!-- 项目选择器 -->
    <el-dialog v-model="showProjectSelector" title="选择项目" width="500px">
      <div class="project-selector">
        <el-input v-model="projectSearchText" placeholder="搜索项目" prefix-icon="Search" />
        <div class="project-list">
          <div 
            class="project-option" 
            v-for="project in filteredProjects" 
            :key="project.id"
            @click="addProjectPermission(project)"
          >
            <div class="project-info">
              <div class="project-name">{{ project.name }}</div>
              <div class="project-desc">{{ project.description }}</div>
            </div>
            <el-icon><Plus /></el-icon>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showProjectSelector = false">关闭</el-button>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  User, 
  Document, 
  Setting, 
  DataAnalysis,
  Plus
} from '@element-plus/icons-vue'
import type { TeamMember } from '@/types'

interface Props {
  modelValue: boolean
  member: TeamMember | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'save': [memberId: string, permissions: any]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const activeTab = ref('basic')
const saving = ref(false)
const showProjectSelector = ref(false)
const projectSearchText = ref('')

// 基础权限
const basicPermissions = [
  {
    key: 'team.read',
    label: '查看团队信息',
    description: '可以查看团队基本信息和成员列表',
    icon: User
  },
  {
    key: 'team.invite',
    label: '邀请成员',
    description: '可以邀请新成员加入团队',
    icon: User
  },
  {
    key: 'team.manage',
    label: '管理团队',
    description: '可以修改团队设置和管理成员',
    icon: Setting
  },
  {
    key: 'project.create',
    label: '创建项目',
    description: '可以创建新的项目',
    icon: Document
  },
  {
    key: 'project.delete',
    label: '删除项目',
    description: '可以删除项目（危险操作）',
    icon: Document
  },
  {
    key: 'billing.view',
    label: '查看账单',
    description: '可以查看团队的账单信息',
    icon: DataAnalysis
  },
  {
    key: 'billing.manage',
    label: '管理账单',
    description: '可以管理付费计划和账单设置',
    icon: DataAnalysis
  }
]

// 权限状态
const permissions = ref<Record<string, boolean>>({})

// 项目权限
const projectPermissions = ref([
  {
    id: '1',
    name: '项目A',
    description: '主要业务项目',
    permission: 'write'
  },
  {
    id: '2',
    name: '项目B',
    description: '测试项目',
    permission: 'read'
  }
])

// 资源权限
const resourceCategories = ref([
  {
    key: 'apis',
    label: 'API接口',
    enabled: true,
    resources: [
      { key: 'apis.collections', label: '接口集合', description: '管理接口集合' },
      { key: 'apis.environments', label: '环境配置', description: '管理环境变量' },
      { key: 'apis.mocks', label: 'Mock服务', description: '管理Mock数据' }
    ]
  },
  {
    key: 'docs',
    label: '文档管理',
    enabled: false,
    resources: [
      { key: 'docs.api', label: 'API文档', description: '管理API文档' },
      { key: 'docs.guides', label: '使用指南', description: '管理使用指南' }
    ]
  },
  {
    key: 'monitoring',
    label: '监控数据',
    enabled: false,
    resources: [
      { key: 'monitoring.metrics', label: '性能指标', description: '查看性能数据' },
      { key: 'monitoring.logs', label: '日志记录', description: '查看系统日志' }
    ]
  }
])

const resourcePermissions = ref<Record<string, string[]>>({})

// 时间限制
const timeRestrictions = ref({
  enabled: false,
  ranges: [
    {
      days: ['1', '2', '3', '4', '5'],
      startTime: '09:00',
      endTime: '18:00'
    }
  ],
  allowedIPs: '',
  expiryDate: ''
})

// 可用项目列表
const availableProjects = ref([
  { id: '3', name: '项目C', description: '新项目' },
  { id: '4', name: '项目D', description: '实验项目' }
])

// 过滤后的项目
const filteredProjects = computed(() => {
  const assigned = projectPermissions.value.map(p => p.id)
  return availableProjects.value
    .filter(p => !assigned.includes(p.id))
    .filter(p => p.name.toLowerCase().includes(projectSearchText.value.toLowerCase()))
})

// 已启用的权限
const enabledPermissions = computed(() => {
  const enabled = []
  
  // 基础权限
  for (const [key, value] of Object.entries(permissions.value)) {
    if (value) enabled.push(key)
  }
  
  // 项目权限
  for (const project of projectPermissions.value) {
    enabled.push(`project.${project.id}.${project.permission}`)
  }
  
  // 资源权限
  for (const [key, perms] of Object.entries(resourcePermissions.value)) {
    for (const perm of perms) {
      enabled.push(`${key}.${perm}`)
    }
  }
  
  return enabled
})

// 获取角色类型
const getRoleType = (role: string | undefined) => {
  if (!role) return 'info'
  const types: Record<string, string> = {
    owner: 'danger',
    admin: 'warning',
    editor: 'primary',
    viewer: 'info'
  }
  return types[role] || 'info'
}

// 获取角色标签
const getRoleLabel = (role: string | undefined) => {
  if (!role) return '未知角色'
  const labels: Record<string, string> = {
    owner: '所有者',
    admin: '管理员',
    editor: '编辑者',
    viewer: '查看者'
  }
  return labels[role] || role
}

// 获取权限标签
const getPermissionLabel = (permission: string) => {
  // 简化的权限标签映射
  const parts = permission.split('.')
  if (parts.length >= 2) {
    return `${parts[0]}.${parts[parts.length - 1]}`
  }
  return permission
}

// 判断权限是否禁用
const isPermissionDisabled = (key: string) => {
  // 根据角色禁用某些权限
  if (props.member?.role === 'viewer') {
    return ['team.manage', 'project.delete', 'billing.manage'].includes(key)
  }
  return false
}

// 权限变更处理
const onPermissionChange = (key: string, value: boolean) => {
  // 处理权限依赖关系
  if (key === 'team.manage' && value) {
    permissions.value['team.read'] = true
  }
}

// 切换分类权限
const toggleCategoryPermissions = (categoryKey: string, enabled: boolean) => {
  const category = resourceCategories.value.find(c => c.key === categoryKey)
  if (category) {
    category.enabled = enabled
    if (!enabled) {
      // 清除该分类下的所有权限
      category.resources.forEach(resource => {
        resourcePermissions.value[resource.key] = []
      })
    }
  }
}

// 添加项目权限
const addProjectPermission = (project: any) => {
  projectPermissions.value.push({
    ...project,
    permission: 'read'
  })
  showProjectSelector.value = false
  ElMessage.success(`已添加项目 ${project.name} 的权限`)
}

// 移除项目权限
const removeProjectPermission = (projectId: string) => {
  const index = projectPermissions.value.findIndex(p => p.id === projectId)
  if (index > -1) {
    const project = projectPermissions.value[index]
    projectPermissions.value.splice(index, 1)
    ElMessage.success(`已移除项目 ${project.name} 的权限`)
  }
}

// 添加时间段
const addTimeRange = () => {
  timeRestrictions.value.ranges.push({
    days: [],
    startTime: '09:00',
    endTime: '18:00'
  })
}

// 移除时间段
const removeTimeRange = (index: number) => {
  timeRestrictions.value.ranges.splice(index, 1)
}

// 重置为默认权限
const resetToDefault = () => {
  const defaultPermissions: Record<string, boolean> = {
    'team.read': true,
    'team.invite': false,
    'team.manage': false,
    'project.create': true,
    'project.delete': false,
    'billing.view': false,
    'billing.manage': false
  }
  
  // 根据角色设置默认权限
  if (props.member?.role === 'admin') {
    defaultPermissions['team.invite'] = true
    defaultPermissions['team.manage'] = true
    defaultPermissions['billing.view'] = true
  } else if (props.member?.role === 'owner') {
    Object.keys(defaultPermissions).forEach(key => {
      defaultPermissions[key] = true
    })
  }
  
  permissions.value = { ...defaultPermissions }
  ElMessage.success('已重置为默认权限')
}

// 保存权限
const savePermissions = () => {
  if (!props.member) return
  
  saving.value = true
  
  const permissionData = {
    basic: permissions.value,
    projects: projectPermissions.value,
    resources: resourcePermissions.value,
    timeRestrictions: timeRestrictions.value
  }
  
  setTimeout(() => {
    emit('save', props.member!.id, permissionData)
    saving.value = false
    visible.value = false
    ElMessage.success('权限保存成功')
  }, 1000)
}

// 重置表单
const resetForm = () => {
  projectSearchText.value = ''
  activeTab.value = 'basic'
}

// 初始化权限数据
watch(() => props.member, (member) => {
  if (member) {
    // 初始化基础权限
    const defaultPermissions: Record<string, boolean> = {}
    basicPermissions.forEach(perm => {
      defaultPermissions[perm.key] = member.permissions?.includes(perm.key) || false
    })
    permissions.value = defaultPermissions
    
    // 初始化资源权限
    resourceCategories.value.forEach(category => {
      category.resources.forEach(resource => {
        resourcePermissions.value[resource.key] = ['read'] // 默认只读权限
      })
    })
  }
}, { immediate: true })
</script>

<style lang="scss" scoped>
.permissions-dialog {
  .member-info {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;
    
    .member-details {
      h3 {
        margin: 0 0 4px 0;
        font-size: 16px;
      }
      
      p {
        margin: 0 0 8px 0;
        color: #606266;
        font-size: 14px;
      }
    }
  }
  
  .permissions-tabs {
    margin-top: 16px;
  }
}

.permissions-section {
  h4 {
    margin: 0 0 16px 0;
    font-size: 14px;
    font-weight: 500;
    color: #303133;
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
}

.permission-group {
  .permission-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f0f0f0;
    
    &:last-child {
      border-bottom: none;
    }
    
    .permission-info {
      flex: 1;
      
      .permission-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
        margin-bottom: 4px;
        
        .el-icon {
          color: #409eff;
        }
      }
      
      .permission-desc {
        font-size: 12px;
        color: #909399;
      }
    }
  }
}

.project-permissions {
  .project-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border: 1px solid #e4e7ed;
    border-radius: 6px;
    margin-bottom: 8px;
    
    .project-info {
      flex: 1;
      
      .project-name {
        font-weight: 500;
        margin-bottom: 4px;
      }
      
      .project-desc {
        font-size: 12px;
        color: #909399;
      }
    }
    
    .project-controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }
  }
}

.resource-permissions {
  .resource-category {
    margin-bottom: 24px;
    
    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      
      h5 {
        margin: 0;
        font-size: 14px;
        font-weight: 500;
      }
    }
    
    .category-items {
      padding-left: 16px;
      
      .resource-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #f0f0f0;
        
        &:last-child {
          border-bottom: none;
        }
        
        .resource-info {
          flex: 1;
          
          .resource-name {
            font-weight: 500;
            margin-right: 8px;
          }
          
          .resource-desc {
            font-size: 12px;
            color: #909399;
          }
        }
      }
    }
  }
}

.time-ranges {
  .time-range {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }
}

.permissions-preview {
  margin-top: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  
  h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
  }
  
  .preview-content {
    .permission-tag {
      margin: 2px 4px 2px 0;
    }
    
    .no-permissions {
      color: #909399;
      font-style: italic;
    }
  }
}

.project-selector {
  .project-list {
    max-height: 300px;
    overflow-y: auto;
    margin-top: 12px;
    
    .project-option {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      border: 1px solid #e4e7ed;
      border-radius: 6px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: all 0.3s;
      
      &:hover {
        border-color: #409eff;
        background: #f0f9ff;
      }
      
      .project-info {
        flex: 1;
        
        .project-name {
          font-weight: 500;
          margin-bottom: 4px;
        }
        
        .project-desc {
          font-size: 12px;
          color: #909399;
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