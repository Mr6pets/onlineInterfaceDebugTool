<template>
  <div class="parameter-table">
    <el-table :data="parameters" style="width: 100%" size="small">
      <el-table-column label="参数名" width="150">
        <template #default="{ row, $index }">
          <el-input
            v-model="row.name"
            placeholder="参数名"
            size="small"
            @input="updateParameter($index, 'name', $event)"
          />
        </template>
      </el-table-column>
      
      <el-table-column label="类型" width="120">
        <template #default="{ row, $index }">
          <el-select
            v-model="row.type"
            placeholder="类型"
            size="small"
            @change="updateParameter($index, 'type', $event)"
          >
            <el-option label="string" value="string" />
            <el-option label="number" value="number" />
            <el-option label="integer" value="integer" />
            <el-option label="boolean" value="boolean" />
            <el-option label="array" value="array" />
            <el-option label="object" value="object" />
            <el-option label="file" value="file" v-if="type === 'formData'" />
          </el-select>
        </template>
      </el-table-column>
      
      <el-table-column label="必填" width="80" v-if="type !== 'path'">
        <template #default="{ row, $index }">
          <el-checkbox
            v-model="row.required"
            @change="updateParameter($index, 'required', $event)"
          />
        </template>
      </el-table-column>
      
      <el-table-column label="描述" min-width="200">
        <template #default="{ row, $index }">
          <el-input
            v-model="row.description"
            placeholder="参数描述"
            size="small"
            @input="updateParameter($index, 'description', $event)"
          />
        </template>
      </el-table-column>
      
      <el-table-column label="示例" width="150">
        <template #default="{ row, $index }">
          <el-input
            v-model="row.example"
            placeholder="示例值"
            size="small"
            @input="updateParameter($index, 'example', $event)"
          />
        </template>
      </el-table-column>
      
      <el-table-column label="默认值" width="120" v-if="type === 'query'">
        <template #default="{ row, $index }">
          <el-input
            v-model="row.default"
            placeholder="默认值"
            size="small"
            @input="updateParameter($index, 'default', $event)"
          />
        </template>
      </el-table-column>
      
      <el-table-column label="操作" width="80" fixed="right">
        <template #default="{ $index }">
          <el-button
            @click="deleteParameter($index)"
            size="small"
            text
            type="danger"
          >
            <el-icon><Delete /></el-icon>
          </el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <div class="table-footer" v-if="parameters.length === 0">
      <el-empty description="暂无参数" :image-size="60" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Delete } from '@element-plus/icons-vue'
import type { ApiParameter } from '@/types'

interface Props {
  modelValue: ApiParameter[]
  type: 'path' | 'query' | 'header' | 'formData'
}

interface Emits {
  'update:modelValue': [value: ApiParameter[]]
  'delete': [type: string, index: number]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const parameters = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const updateParameter = (index: number, field: keyof ApiParameter, value: any) => {
  const newParameters = [...parameters.value]
  newParameters[index] = {
    ...newParameters[index],
    [field]: value
  }
  parameters.value = newParameters
}

const deleteParameter = (index: number) => {
  emit('delete', props.type, index)
}
</script>

<style lang="scss" scoped>
.parameter-table {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  overflow: hidden;
  
  :deep(.el-table) {
    border: none;
    
    .el-table__header {
      background: #f8f9fa;
    }
    
    .el-table__row {
      &:hover {
        background: #f5f7fa;
      }
    }
  }
}

.table-footer {
  padding: 20px;
  text-align: center;
  background: #fafafa;
}
</style>