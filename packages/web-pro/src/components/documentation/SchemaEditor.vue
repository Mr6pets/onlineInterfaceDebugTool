<template>
  <div class="schema-editor">
    <div class="editor-toolbar">
      <el-button-group size="small">
        <el-button @click="viewMode = 'tree'" :type="viewMode === 'tree' ? 'primary' : ''">
          <el-icon><List /></el-icon>
          树形视图
        </el-button>
        <el-button @click="viewMode = 'code'" :type="viewMode === 'code' ? 'primary' : ''">
          <el-icon><Document /></el-icon>
          代码视图
        </el-button>
      </el-button-group>
      
      <div class="toolbar-actions">
        <el-button @click="addProperty" size="small" v-if="viewMode === 'tree'">
          <el-icon><Plus /></el-icon>
          添加属性
        </el-button>
        <el-button @click="formatSchema" size="small" v-if="viewMode === 'code'">
          <el-icon><MagicStick /></el-icon>
          格式化
        </el-button>
        <el-button @click="validateSchema" size="small">
          <el-icon><CircleCheck /></el-icon>
          验证
        </el-button>
      </div>
    </div>
    
    <!-- 树形视图 -->
    <div v-if="viewMode === 'tree'" class="tree-view">
      <div class="schema-properties">
        <div class="root-type">
          <el-select v-model="schema.type" placeholder="选择类型" size="small">
            <el-option label="object" value="object" />
            <el-option label="array" value="array" />
            <el-option label="string" value="string" />
            <el-option label="number" value="number" />
            <el-option label="integer" value="integer" />
            <el-option label="boolean" value="boolean" />
          </el-select>
        </div>
        
        <div v-if="schema.type === 'object'" class="object-properties">
          <div
            v-for="(property, key) in schema.properties"
            :key="key"
            class="property-item"
          >
            <div class="property-header">
              <el-input
                :model-value="key"
                placeholder="属性名"
                size="small"
                class="property-name"
                @input="updatePropertyName(key, $event)"
              />
              <el-select
                v-model="property.type"
                placeholder="类型"
                size="small"
                class="property-type"
              >
                <el-option label="string" value="string" />
                <el-option label="number" value="number" />
                <el-option label="integer" value="integer" />
                <el-option label="boolean" value="boolean" />
                <el-option label="array" value="array" />
                <el-option label="object" value="object" />
              </el-select>
              <el-checkbox :model-value="isRequired(key)" @change="toggleRequired(key, $event)" size="small">
                必填
              </el-checkbox>
              <el-button
                @click="deleteProperty(key)"
                size="small"
                text
                type="danger"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            
            <div class="property-details">
              <el-input
                v-model="property.description"
                placeholder="属性描述"
                size="small"
                class="property-description"
              />
              
              <div class="property-constraints">
                <el-input
                  v-if="property.type === 'string'"
                  v-model="property.example"
                  placeholder="示例值"
                  size="small"
                />
                <el-input-number
                  v-if="property.type === 'number' || property.type === 'integer'"
                  v-model="property.example"
                  placeholder="示例值"
                  size="small"
                />
                <el-checkbox
                  v-if="property.type === 'boolean'"
                  v-model="property.example"
                  size="small"
                >
                  示例值
                </el-checkbox>
              </div>
            </div>
            
            <!-- 嵌套对象 -->
            <div v-if="property.type === 'object'" class="nested-object">
              <SchemaEditor v-model="property.properties" :level="level + 1" />
            </div>
            
            <!-- 数组项 -->
            <div v-if="property.type === 'array'" class="array-items">
              <div class="array-item-type">
                <span>数组项类型:</span>
                <el-select v-model="property.items.type" size="small">
                  <el-option label="string" value="string" />
                  <el-option label="number" value="number" />
                  <el-option label="integer" value="integer" />
                  <el-option label="boolean" value="boolean" />
                  <el-option label="object" value="object" />
                </el-select>
              </div>
              
              <div v-if="property.items?.type === 'object'" class="array-object-schema">
                <SchemaEditor v-model="property.items.properties" :level="level + 1" />
              </div>
            </div>
          </div>
        </div>
        
        <div v-if="schema.type === 'array'" class="array-schema">
          <div class="array-item-type">
            <span>数组项类型:</span>
            <el-select v-model="schema.items.type" size="small">
              <el-option label="string" value="string" />
              <el-option label="number" value="number" />
              <el-option label="integer" value="integer" />
              <el-option label="boolean" value="boolean" />
              <el-option label="object" value="object" />
            </el-select>
          </div>
          
          <div v-if="schema.items?.type === 'object'" class="array-object-schema">
            <SchemaEditor v-model="schema.items.properties" :level="level + 1" />
          </div>
        </div>
      </div>
    </div>
    
    <!-- 代码视图 -->
    <div v-if="viewMode === 'code'" class="code-view">
      <CodeEditor
        v-model="schemaCode"
        language="json"
        :height="editorHeight"
        @change="updateSchemaFromCode"
      />
    </div>
    
    <!-- 验证结果 -->
    <div v-if="validationResult" class="validation-result">
      <el-alert
        :title="validationResult.valid ? '验证通过' : '验证失败'"
        :type="validationResult.valid ? 'success' : 'error'"
        :description="validationResult.message"
        show-icon
        :closable="false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  List,
  Document,
  Plus,
  Delete,
  MagicStick,
  CircleCheck
} from '@element-plus/icons-vue'
import CodeEditor from './CodeEditor.vue'
import type { JsonSchema } from '@/types'

interface Props {
  modelValue: JsonSchema
  level?: number
  height?: string
}

interface Emits {
  'update:modelValue': [value: JsonSchema]
}

const props = withDefaults(defineProps<Props>(), {
  level: 0,
  height: '300px'
})

const emit = defineEmits<Emits>()

const viewMode = ref<'tree' | 'code'>('tree')
const validationResult = ref<{ valid: boolean; message: string } | null>(null)

const schema = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const schemaCode = computed({
  get: () => JSON.stringify(schema.value, null, 2),
  set: (value) => {
    try {
      const parsed = JSON.parse(value)
      schema.value = parsed
    } catch (error) {
      // 忽略解析错误，保持原有值
    }
  }
})

const editorHeight = computed(() => {
  const baseHeight = parseInt(props.height.replace('px', ''))
  return `${Math.max(200, baseHeight - 80)}px`
})

// 初始化schema结构
watch(
  () => schema.value,
  (newSchema) => {
    if (!newSchema || !newSchema.type) {
      schema.value = {
        type: 'object',
        properties: {},
        required: []
      }
    } else if (newSchema.type === 'array' && !newSchema.items) {
      schema.value = {
        ...newSchema,
        items: {
          type: 'string'
        }
      }
    } else if (newSchema.type === 'object' && !newSchema.properties) {
      schema.value = {
        ...newSchema,
        properties: {},
        required: newSchema.required || []
      }
    }
  },
  { immediate: true }
)

const addProperty = () => {
  if (schema.value.type === 'object') {
    const propertyName = `property_${Date.now()}`
    if (!schema.value.properties) {
      schema.value.properties = {}
    }
    schema.value.properties = {
      ...schema.value.properties,
      [propertyName]: {
        type: 'string',
        description: '',
        example: ''
      }
    }
  }
}

const deleteProperty = (key: string) => {
  if (schema.value.properties) {
    const newProperties = { ...schema.value.properties }
    delete newProperties[key]
    schema.value = {
      ...schema.value,
      properties: newProperties
    }
  }
}

const isRequired = (key: string) => {
  return schema.value.required?.includes(key) || false
}

const toggleRequired = (key: string, required: boolean) => {
  if (!schema.value.required) {
    schema.value.required = []
  }
  
  if (required) {
    if (!schema.value.required.includes(key)) {
      schema.value.required.push(key)
    }
  } else {
    schema.value.required = schema.value.required.filter(k => k !== key)
  }
}

const updatePropertyName = (oldKey: string, newName: string) => {
  if (schema.value.properties && oldKey !== newName && newName.trim()) {
    const property = schema.value.properties[oldKey]
    const newProperties = { ...schema.value.properties }
    delete newProperties[oldKey]
    newProperties[newName] = property
    
    // 更新required数组中的键名
    if (schema.value.required) {
      const requiredIndex = schema.value.required.indexOf(oldKey)
      if (requiredIndex !== -1) {
        schema.value.required[requiredIndex] = newName
      }
    }
    
    schema.value = {
      ...schema.value,
      properties: newProperties
    }
  }
}

const formatSchema = () => {
  try {
    const parsed = JSON.parse(schemaCode.value)
    schemaCode.value = JSON.stringify(parsed, null, 2)
    ElMessage.success('格式化成功')
  } catch (error) {
    ElMessage.error('JSON格式错误，无法格式化')
  }
}

const validateSchema = () => {
  try {
    // 简单的JSON Schema验证
    const parsed = JSON.parse(schemaCode.value)
    
    if (!parsed.type) {
      validationResult.value = {
        valid: false,
        message: '缺少type字段'
      }
      return
    }
    
    if (parsed.type === 'object' && !parsed.properties) {
      validationResult.value = {
        valid: false,
        message: 'object类型需要properties字段'
      }
      return
    }
    
    if (parsed.type === 'array' && !parsed.items) {
      validationResult.value = {
        valid: false,
        message: 'array类型需要items字段'
      }
      return
    }
    
    validationResult.value = {
      valid: true,
      message: 'Schema结构正确'
    }
    
    setTimeout(() => {
      validationResult.value = null
    }, 3000)
  } catch (error) {
    validationResult.value = {
      valid: false,
      message: 'JSON格式错误'
    }
  }
}

const updateSchemaFromCode = (code: string) => {
  try {
    const parsed = JSON.parse(code)
    emit('update:modelValue', parsed)
  } catch (error) {
    // 忽略解析错误
  }
}
</script>

<style lang="scss" scoped>
.schema-editor {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  overflow: hidden;
}

.editor-toolbar {
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
}

.tree-view {
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.root-type {
  margin-bottom: 16px;
}

.property-item {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  margin-bottom: 12px;
  padding: 12px;
  background: #fafafa;
}

.property-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.property-name {
  flex: 1;
}

.property-type {
  width: 120px;
}

.property-details {
  display: flex;
  gap: 8px;
  align-items: center;
}

.property-description {
  flex: 1;
}

.property-constraints {
  width: 150px;
}

.nested-object,
.array-items,
.array-schema {
  margin-top: 12px;
  padding: 12px;
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
}

.array-item-type {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  
  span {
    font-size: 14px;
    color: #606266;
  }
}

.array-object-schema {
  margin-top: 12px;
}

.code-view {
  height: 100%;
}

.validation-result {
  padding: 12px 16px;
  border-top: 1px solid #e4e7ed;
}
</style>