<template>
  <div class="permissions-matrix">
    <div class="matrix-header">
      <div class="role-header">角色/权限</div>
      <div 
        v-for="permission in permissions" 
        :key="permission.key"
        class="permission-header"
        :title="permission.description"
      >
        {{ permission.name }}
      </div>
    </div>
    
    <div class="matrix-body">
      <div 
        v-for="role in roles" 
        :key="role.key"
        class="matrix-row"
      >
        <div class="role-cell">
          <el-tag :type="getRoleType(role.key)" size="small">
            {{ role.name }}
          </el-tag>
        </div>
        <div 
          v-for="permission in permissions" 
          :key="permission.key"
          class="permission-cell"
        >
          <el-checkbox 
            :model-value="hasPermission(role.key, permission.key)"
            @change="togglePermission(role.key, permission.key, $event)"
            :disabled="isReadonly || isInheritedPermission(role.key, permission.key)"
          />
          <el-icon 
            v-if="isInheritedPermission(role.key, permission.key)"
            class="inherited-icon"
            :title="'从 ' + getInheritedFrom(role.key, permission.key) + ' 继承'"
          >
            <Link />
          </el-icon>
        </div>
      </div>
    </div>
    
    <div class="matrix-footer">
      <div class="legend">
        <div class="legend-item">
          <el-icon><Check /></el-icon>
          <span>拥有权限</span>
        </div>
        <div class="legend-item">
          <el-icon><Link /></el-icon>
          <span>继承权限</span>
        </div>
        <div class="legend-item">
          <el-icon><Close /></el-icon>
          <span>无权限</span>
        </div>
      </div>
      
      <div class="actions" v-if="!isReadonly">
        <el-button @click="resetToDefault" size="small">
          重置为默认
        </el-button>
        <el-button @click="savePermissions" type="primary" size="small">
          保存更改
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Check, Close, Link } from '@element-plus/icons-vue'
import type { Permission, Role } from '@/types/index'

interface Props {
  permissions: Permission[]
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false
})

const emit = defineEmits<{
  'update:permissions': [permissions: Permission[]]
  'save': [permissions: Permission[]]
}>()

const isReadonly = computed(() => props.readonly)

// 角色定义
const roles = ref<Role[]>([
  { key: 'owner', name: '所有者', level: 4 },
  { key: 'admin', name: '管理员', level: 3 },
  { key: 'editor', name: '编辑者', level: 2 },
  { key: 'viewer', name: '查看者', level: 1 }
])

// 权限矩阵状态
const permissionMatrix = ref<Record<string, Record<string, boolean>>>({})

// 初始化权限矩阵
const initializeMatrix = () => {
  const matrix: Record<string, Record<string, boolean>> = {}
  
  roles.value.forEach(role => {
    matrix[role.key] = {}
    props.permissions.forEach(permission => {
      matrix[role.key][permission.key] = hasDefaultPermission(role.key, permission.key)
    })
  })
  
  permissionMatrix.value = matrix
}

// 检查角色是否有某个权限
const hasPermission = (roleKey: string, permissionKey: string): boolean => {
  return permissionMatrix.value[roleKey]?.[permissionKey] || false
}

// 检查是否为继承权限
const isInheritedPermission = (roleKey: string, permissionKey: string): boolean => {
  const role = roles.value.find(r => r.key === roleKey)
  if (!role) return false
  
  // 检查更高级别的角色是否有此权限
  const higherRoles = roles.value.filter(r => r.level > role.level)
  return higherRoles.some(higherRole => 
    permissionMatrix.value[higherRole.key]?.[permissionKey]
  )
}

// 获取权限继承来源
const getInheritedFrom = (roleKey: string, permissionKey: string): string => {
  const role = roles.value.find(r => r.key === roleKey)
  if (!role) return ''
  
  const higherRoles = roles.value
    .filter(r => r.level > role.level)
    .sort((a, b) => a.level - b.level)
  
  for (const higherRole of higherRoles) {
    if (permissionMatrix.value[higherRole.key]?.[permissionKey]) {
      return higherRole.name
    }
  }
  
  return ''
}

// 默认权限配置
const hasDefaultPermission = (roleKey: string, permissionKey: string): boolean => {
  const defaultPermissions: Record<string, string[]> = {
    owner: ['read', 'write', 'delete', 'admin', 'invite', 'manage_team', 'manage_billing'],
    admin: ['read', 'write', 'delete', 'invite', 'manage_team'],
    editor: ['read', 'write'],
    viewer: ['read']
  }
  
  return defaultPermissions[roleKey]?.includes(permissionKey) || false
}

// 切换权限
const togglePermission = (roleKey: string, permissionKey: string, value: boolean) => {
  if (!permissionMatrix.value[roleKey]) {
    permissionMatrix.value[roleKey] = {}
  }
  
  permissionMatrix.value[roleKey][permissionKey] = value
  
  // 如果启用了权限，确保低级别角色也有此权限
  if (value) {
    const role = roles.value.find(r => r.key === roleKey)
    if (role) {
      const lowerRoles = roles.value.filter(r => r.level < role.level)
      lowerRoles.forEach(lowerRole => {
        if (!permissionMatrix.value[lowerRole.key]) {
          permissionMatrix.value[lowerRole.key] = {}
        }
        permissionMatrix.value[lowerRole.key][permissionKey] = true
      })
    }
  }
  
  emit('update:permissions', generatePermissionsList())
}

// 生成权限列表
const generatePermissionsList = (): Permission[] => {
  return props.permissions.map(permission => ({
    ...permission,
    roles: roles.value
      .filter(role => hasPermission(role.key, permission.key))
      .map(role => role.key)
  }))
}

// 获取角色类型
const getRoleType = (roleKey: string) => {
  const typeMap: Record<string, string> = {
    owner: 'danger',
    admin: 'warning',
    editor: 'primary',
    viewer: 'info'
  }
  return typeMap[roleKey] || 'info'
}

// 重置为默认权限
const resetToDefault = () => {
  initializeMatrix()
  ElMessage.success('已重置为默认权限配置')
}

// 保存权限
const savePermissions = () => {
  const permissions = generatePermissionsList()
  emit('save', permissions)
  ElMessage.success('权限配置已保存')
}

// 初始化
initializeMatrix()
</script>

<style lang="scss" scoped>
.permissions-matrix {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e4e7ed;
}

.matrix-header {
  display: grid;
  grid-template-columns: 120px repeat(auto-fit, minmax(100px, 1fr));
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.role-header,
.permission-header {
  padding: 12px 8px;
  font-weight: 500;
  font-size: 14px;
  color: #606266;
  text-align: center;
  border-right: 1px solid #e4e7ed;
}

.role-header {
  text-align: left;
  background: #fafafa;
}

.matrix-body {
  .matrix-row {
    display: grid;
    grid-template-columns: 120px repeat(auto-fit, minmax(100px, 1fr));
    border-bottom: 1px solid #f0f0f0;
    
    &:hover {
      background: #fafbfc;
    }
  }
}

.role-cell {
  padding: 12px 8px;
  display: flex;
  align-items: center;
  background: #fafafa;
  border-right: 1px solid #e4e7ed;
}

.permission-cell {
  padding: 12px 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border-right: 1px solid #f0f0f0;
  position: relative;
}

.inherited-icon {
  color: #909399;
  font-size: 12px;
}

.matrix-footer {
  padding: 16px;
  background: #fafafa;
  border-top: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.legend {
  display: flex;
  gap: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #606266;
}

.actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 768px) {
  .matrix-header,
  .matrix-row {
    grid-template-columns: 100px repeat(auto-fit, minmax(80px, 1fr));
  }
  
  .role-header,
  .permission-header,
  .role-cell,
  .permission-cell {
    padding: 8px 4px;
    font-size: 12px;
  }
}
</style>