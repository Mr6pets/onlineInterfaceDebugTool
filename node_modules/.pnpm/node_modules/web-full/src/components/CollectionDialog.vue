<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑集合' : '新建集合'"
    width="500px"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="80px"
    >
      <el-form-item label="集合名称" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入集合名称"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>
      
      <el-form-item label="描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入集合描述（可选）"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>
      
      <el-form-item label="标签" prop="tags">
        <el-tag
          v-for="tag in form.tags"
          :key="tag"
          closable
          @close="removeTag(tag)"
          style="margin-right: 8px; margin-bottom: 8px;"
        >
          {{ tag }}
        </el-tag>
        <el-input
          v-if="inputVisible"
          ref="inputRef"
          v-model="inputValue"
          size="small"
          style="width: 100px;"
          @keyup.enter="handleInputConfirm"
          @blur="handleInputConfirm"
        />
        <el-button
          v-else
          size="small"
          @click="showInput"
        >
          + 添加标签
        </el-button>
      </el-form-item>
      
      <el-form-item label="基础URL" prop="baseUrl">
        <el-input
          v-model="form.baseUrl"
          placeholder="https://api.example.com（可选）"
        />
      </el-form-item>
    </el-form>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import type { ApiCollection } from '@api-debug-tool/shared/types'

interface Props {
  modelValue: boolean
  collection?: ApiCollection | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', collection: ApiCollection): void
}

const props = withDefaults(defineProps<Props>(), {
  collection: null
})

const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const inputRef = ref()
const loading = ref(false)
const inputVisible = ref(false)
const inputValue = ref('')

const form = ref({
  id: '',
  name: '',
  description: '',
  tags: [] as string[],
  baseUrl: '',
  requests: [],
  folders: [],
  createdAt: '',
  updatedAt: ''
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入集合名称', trigger: 'blur' },
    { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
  ]
}

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const isEdit = computed(() => !!props.collection)

watch(() => props.collection, (newCollection) => {
  if (newCollection) {
    form.value = {
      ...newCollection,
      tags: [...(newCollection.tags || [])]
    }
  } else {
    resetForm()
  }
}, { immediate: true })

watch(() => props.modelValue, (newValue) => {
  if (newValue && !props.collection) {
    resetForm()
  }
})

const resetForm = () => {
  form.value = {
    id: '',
    name: '',
    description: '',
    tags: [],
    baseUrl: '',
    requests: [],
    folders: [],
    createdAt: '',
    updatedAt: ''
  }
  formRef.value?.clearValidate()
}

const removeTag = (tag: string) => {
  const index = form.value.tags.indexOf(tag)
  if (index > -1) {
    form.value.tags.splice(index, 1)
  }
}

const showInput = () => {
  inputVisible.value = true
  nextTick(() => {
    inputRef.value?.focus()
  })
}

const handleInputConfirm = () => {
  if (inputValue.value && !form.value.tags.includes(inputValue.value)) {
    form.value.tags.push(inputValue.value)
  }
  inputVisible.value = false
  inputValue.value = ''
}

const handleClose = () => {
  visible.value = false
  resetForm()
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    const now = new Date().toISOString()
    const collection: ApiCollection = {
      ...form.value,
      id: form.value.id || `collection_${Date.now()}`,
      createdAt: form.value.createdAt || now,
      updatedAt: now
    }
    
    emit('save', collection)
    visible.value = false
    ElMessage.success(isEdit.value ? '集合更新成功' : '集合创建成功')
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

:deep(.el-tag) {
  margin-right: 8px;
  margin-bottom: 8px;
}
</style>