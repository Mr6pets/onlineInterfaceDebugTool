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
import { ref, computed, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import type { ApiCollection, CollectionFolder, CollectionRequest } from '@shared/types'

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
const loading = ref(false)

const form = ref({
  id: '',
  name: '',
  description: '' as string | undefined,
  folders: [] as CollectionFolder[],
  requests: [] as CollectionRequest[],
  variables: {} as Record<string, string>,
  createdAt: new Date(),
  updatedAt: new Date()
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
      description: newCollection.description || ''
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
    folders: [],
    requests: [],
    variables: {},
    createdAt: new Date(),
    updatedAt: new Date()
  }
  formRef.value?.clearValidate()
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
    
    const now = new Date()
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