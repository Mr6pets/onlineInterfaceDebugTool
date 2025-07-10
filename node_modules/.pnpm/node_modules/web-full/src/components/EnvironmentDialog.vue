<template>
  <el-dialog
    v-model="visible"
    title="环境管理"
    width="800px"
    :before-close="handleClose"
  >
    <div class="environment-manager">
      <div class="environment-list">
        <div class="list-header">
          <h4>环境列表</h4>
          <el-button @click="addEnvironment" size="small" type="primary">
            新建环境
          </el-button>
        </div>
        
        <div class="list-content">
          <div
            v-for="env in environments"
            :key="env.id"
            class="environment-item"
            :class="{ active: selectedEnvironment?.id === env.id }"
            @click="selectEnvironment(env)"
          >
            <div class="env-info">
              <span class="env-name">{{ env.name }}</span>
              <el-tag v-if="env.isActive" size="small" type="success">当前</el-tag>
            </div>
            <div class="env-actions">
              <el-button
                size="small"
                text
                @click.stop="duplicateEnvironment(env)"
                :icon="CopyDocument"
              />
              <el-button
                size="small"
                text
                type="danger"
                @click.stop="deleteEnvironment(env.id)"
                :icon="Delete"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div class="environment-editor" v-if="selectedEnvironment">
        <div class="editor-header">
          <h4>环境配置</h4>
          <div class="editor-actions">
            <el-button @click="saveEnvironment" type="primary" size="small">
              保存
            </el-button>
            <el-button @click="resetEnvironment" size="small">
              重置
            </el-button>
          </div>
        </div>
        
        <el-form :model="selectedEnvironment" label-width="80px">
          <el-form-item label="名称">
            <el-input v-model="selectedEnvironment.name" placeholder="环境名称" />
          </el-form-item>
          
          <el-form-item label="基础URL">
            <el-input v-model="selectedEnvironment.baseUrl" placeholder="https://api.example.com" />
          </el-form-item>
          
          <el-form-item label="状态">
            <el-switch
              v-model="selectedEnvironment.isActive"
              active-text="激活"
              inactive-text="未激活"
            />
          </el-form-item>
        </el-form>
        
        <div class="variables-section">
          <div class="section-header">
            <h5>环境变量</h5>
            <el-button @click="addVariable" size="small">
              添加变量
            </el-button>
          </div>
          
          <div class="variables-table">
            <div class="table-header">
              <div class="col-key">变量名</div>
              <div class="col-value">值</div>
              <div class="col-actions">操作</div>
            </div>
            
            <div
              v-for="(value, key) in selectedEnvironment.variables"
              :key="key"
              class="table-row"
            >
              <div class="col-key">
                <el-input
                  :model-value="key"
                  @input="updateVariableKey(key, $event)"
                  placeholder="变量名"
                  size="small"
                />
              </div>
              <div class="col-value">
                <el-input
                  v-model="selectedEnvironment.variables[key]"
                  placeholder="变量值"
                  size="small"
                />
              </div>
              <div class="col-actions">
                <el-button
                  size="small"
                  text
                  type="danger"
                  @click="deleteVariable(key)"
                  :icon="Delete"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CopyDocument, Delete } from '@element-plus/icons-vue'
import type { Environment } from '@api-debug-tool/shared/types'

const props = defineProps<{
  modelValue: boolean
  environments: Environment[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'save': [environment: Environment]
  'delete': [environmentId: string]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const selectedEnvironment = ref<Environment | null>(null)
const originalEnvironment = ref<Environment | null>(null)

watch(() => props.environments, (newEnvs) => {
  if (newEnvs.length > 0 && !selectedEnvironment.value) {
    selectEnvironment(newEnvs[0])
  }
}, { immediate: true })

const selectEnvironment = (env: Environment) => {
  selectedEnvironment.value = JSON.parse(JSON.stringify(env))
  originalEnvironment.value = JSON.parse(JSON.stringify(env))
}

const addEnvironment = () => {
  const newEnv: Environment = {
    id: Date.now().toString(),
    name: '新环境',
    variables: {},
    isActive: false,
    baseUrl: '',
    createdAt: new Date(),
    updatedAt: new Date()
  }
  selectedEnvironment.value = newEnv
  originalEnvironment.value = null
}

const duplicateEnvironment = (env: Environment) => {
  const duplicated: Environment = {
    ...JSON.parse(JSON.stringify(env)),
    id: Date.now().toString(),
    name: `${env.name} 副本`,
    isActive: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  selectedEnvironment.value = duplicated
  originalEnvironment.value = null
}

const deleteEnvironment = async (envId: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这个环境吗？', '确认删除', {
      type: 'warning'
    })
    emit('delete', envId)
    
    if (selectedEnvironment.value?.id === envId) {
      const remaining = props.environments.filter(env => env.id !== envId)
      selectedEnvironment.value = remaining.length > 0 ? remaining[0] : null
    }
  } catch {
    // 用户取消
  }
}

const saveEnvironment = () => {
  if (!selectedEnvironment.value) return
  
  selectedEnvironment.value.updatedAt = new Date()
  emit('save', selectedEnvironment.value)
  originalEnvironment.value = JSON.parse(JSON.stringify(selectedEnvironment.value))
}

const resetEnvironment = () => {
  if (originalEnvironment.value) {
    selectedEnvironment.value = JSON.parse(JSON.stringify(originalEnvironment.value))
  }
}

const addVariable = () => {
  if (!selectedEnvironment.value) return
  
  const key = `variable_${Date.now()}`
  selectedEnvironment.value.variables[key] = ''
}

const updateVariableKey = (oldKey: string, newKey: string) => {
  if (!selectedEnvironment.value || oldKey === newKey) return
  
  const value = selectedEnvironment.value.variables[oldKey]
  delete selectedEnvironment.value.variables[oldKey]
  selectedEnvironment.value.variables[newKey] = value
}

const deleteVariable = (key: string) => {
  if (!selectedEnvironment.value) return
  delete selectedEnvironment.value.variables[key]
}

const handleClose = () => {
  visible.value = false
}
</script>

<style lang="scss" scoped>
.environment-manager {
  display: flex;
  height: 500px;
  
  .environment-list {
    width: 250px;
    border-right: 1px solid #e4e7ed;
    
    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      border-bottom: 1px solid #e4e7ed;
      
      h4 {
        margin: 0;
        font-size: 14px;
      }
    }
    
    .list-content {
      overflow: auto;
      height: calc(100% - 60px);
      
      .environment-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 12px;
        cursor: pointer;
        border-bottom: 1px solid #f5f7fa;
        
        &:hover {
          background-color: #f5f7fa;
        }
        
        &.active {
          background-color: #e6f7ff;
          border-color: #91d5ff;
        }
        
        .env-info {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 8px;
          
          .env-name {
            font-size: 13px;
          }
        }
        
        .env-actions {
          display: flex;
          gap: 4px;
        }
      }
    }
  }
  
  .environment-editor {
    flex: 1;
    padding: 12px;
    overflow: auto;
    
    .editor-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      
      h4 {
        margin: 0;
        font-size: 14px;
      }
      
      .editor-actions {
        display: flex;
        gap: 8px;
      }
    }
    
    .variables-section {
      margin-top: 24px;
      
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        
        h5 {
          margin: 0;
          font-size: 13px;
        }
      }
      
      .variables-table {
        .table-header {
          display: flex;
          background-color: #f5f7fa;
          padding: 8px;
          font-size: 12px;
          font-weight: 500;
          color: #606266;
          
          .col-key {
            flex: 1;
          }
          
          .col-value {
            flex: 1;
            margin-left: 8px;
          }
          
          .col-actions {
            width: 60px;
            text-align: center;
          }
        }
        
        .table-row {
          display: flex;
          align-items: center;
          padding: 4px 8px;
          border-bottom: 1px solid #f0f2f5;
          
          .col-key {
            flex: 1;
          }
          
          .col-value {
            flex: 1;
            margin-left: 8px;
          }
          
          .col-actions {
            width: 60px;
            text-align: center;
          }
        }
      }
    }
  }
}
</style>