<template>
  <el-dialog
    v-model="visible"
    title="编辑测试套件"
    width="600px"
    :before-close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      @submit.prevent
    >
      <el-form-item label="套件名称" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入测试套件名称"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>
      
      <el-form-item label="描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入测试套件描述"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>
      
      <el-form-item label="环境" prop="environment">
        <el-select v-model="form.environment" placeholder="请选择测试环境" style="width: 100%">
          <el-option label="开发环境" value="development" />
          <el-option label="测试环境" value="testing" />
          <el-option label="预发布环境" value="staging" />
          <el-option label="生产环境" value="production" />
        </el-select>
      </el-form-item>
      
      <el-form-item label="基础URL" prop="baseUrl">
        <el-input
          v-model="form.baseUrl"
          placeholder="请输入API基础URL，如：https://api.example.com"
        />
      </el-form-item>
      
      <el-form-item label="状态">
        <el-radio-group v-model="form.status">
          <el-radio label="active">激活</el-radio>
          <el-radio label="inactive">停用</el-radio>
          <el-radio label="archived">归档</el-radio>
        </el-radio-group>
      </el-form-item>
      
      <el-form-item label="标签">
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
          v-if="tagInputVisible"
          ref="tagInputRef"
          v-model="tagInputValue"
          size="small"
          style="width: 100px;"
          @keyup.enter="addTag"
          @blur="addTag"
        />
        <el-button
          v-else
          size="small"
          @click="showTagInput"
        >
          + 添加标签
        </el-button>
      </el-form-item>
      
      <el-form-item label="超时设置">
        <el-input-number
          v-model="form.timeout"
          :min="1000"
          :max="300000"
          :step="1000"
          controls-position="right"
          style="width: 200px;"
        />
        <span style="margin-left: 8px; color: #909399;">毫秒</span>
      </el-form-item>
      
      <el-form-item label="重试次数">
        <el-input-number
          v-model="form.retryCount"
          :min="0"
          :max="5"
          controls-position="right"
          style="width: 200px;"
        />
      </el-form-item>
      
      <el-form-item label="并发数">
        <el-input-number
          v-model="form.concurrency"
          :min="1"
          :max="10"
          controls-position="right"
          style="width: 200px;"
        />
      </el-form-item>
      
      <el-form-item label="配置选项">
        <el-checkbox-group v-model="form.options">
          <el-checkbox label="stopOnFailure">失败时停止</el-checkbox>
          <el-checkbox label="generateReport">生成报告</el-checkbox>
          <el-checkbox label="enableScreenshot">启用截图</el-checkbox>
          <el-checkbox label="enableLogging">启用日志</el-checkbox>
        </el-checkbox-group>
      </el-form-item>
      
      <el-form-item label="通知设置">
        <el-checkbox-group v-model="form.notifications">
          <el-checkbox label="email">邮件通知</el-checkbox>
          <el-checkbox label="webhook">Webhook通知</el-checkbox>
          <el-checkbox label="slack">Slack通知</el-checkbox>
        </el-checkbox-group>
      </el-form-item>
      
      <el-form-item v-if="form.notifications.includes('email')" label="邮件地址">
        <el-input
          v-model="form.emailRecipients"
          placeholder="请输入邮件地址，多个地址用逗号分隔"
        />
      </el-form-item>
      
      <el-form-item v-if="form.notifications.includes('webhook')" label="Webhook URL">
        <el-input
          v-model="form.webhookUrl"
          placeholder="请输入Webhook URL"
        />
      </el-form-item>
      
      <el-form-item label="创建信息" v-if="suite">
        <div class="suite-info">
          <p><strong>创建时间:</strong> {{ formatTime(suite.createdAt) }}</p>
          <p><strong>更新时间:</strong> {{ formatTime(suite.updatedAt) }}</p>
          <p><strong>创建者:</strong> {{ suite.createdBy || '未知' }}</p>
          <p><strong>测试数量:</strong> {{ suite.tests?.length || 0 }}</p>
        </div>
      </el-form-item>
    </el-form>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          保存修改
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, nextTick, computed } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import type { TestSuite } from '@/types'

interface Props {
  modelValue: boolean
  suite?: TestSuite | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'save': [suite: TestSuite]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const formRef = ref<FormInstance>()
const tagInputRef = ref<HTMLInputElement>()
const loading = ref(false)
const tagInputVisible = ref(false)
const tagInputValue = ref('')

const form = reactive({
  name: '',
  description: '',
  environment: 'testing',
  baseUrl: '',
  status: 'active',
  tags: [] as string[],
  timeout: 30000,
  retryCount: 1,
  concurrency: 1,
  options: [] as string[],
  notifications: [] as string[],
  emailRecipients: '',
  webhookUrl: ''
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入套件名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { max: 200, message: '描述不能超过 200 个字符', trigger: 'blur' }
  ],
  environment: [
    { required: true, message: '请选择测试环境', trigger: 'change' }
  ],
  baseUrl: [
    { required: true, message: '请输入基础URL', trigger: 'blur' },
    {
      pattern: /^https?:\/\/.+/,
      message: '请输入有效的URL格式',
      trigger: 'blur'
    }
  ]
}

const initForm = (suite: TestSuite) => {
  Object.assign(form, {
    name: suite.name || '',
    description: suite.description || '',
    environment: suite.environment || 'testing',
    baseUrl: suite.baseUrl || '',
    status: suite.status || 'active',
    tags: [],
    timeout: suite.config?.timeout || 30000,
    retryCount: suite.config?.retryCount || 1,
    concurrency: suite.config?.concurrency || 1,
    options: [
      ...(suite.config?.stopOnFailure ? ['stopOnFailure'] : []),
      ...(suite.config?.generateReport ? ['generateReport'] : []),
      ...(suite.config?.enableScreenshot ? ['enableScreenshot'] : []),
      ...(suite.config?.enableLogging ? ['enableLogging'] : [])
    ],
    notifications: [
      ...(suite.notifications?.email?.enabled ? ['email'] : []),
      ...(suite.notifications?.webhook?.enabled ? ['webhook'] : []),
      ...(suite.notifications?.slack?.enabled ? ['slack'] : [])
    ],
    emailRecipients: suite.notifications?.email?.recipients?.join(', ') || '',
    webhookUrl: suite.notifications?.webhook?.url || ''
  })
}

const resetForm = () => {
  Object.assign(form, {
    name: '',
    description: '',
    environment: 'testing',
    baseUrl: '',
    status: 'active',
    tags: [],
    timeout: 30000,
    retryCount: 1,
    concurrency: 1,
    options: [],
    notifications: [],
    emailRecipients: '',
    webhookUrl: ''
  })
  formRef.value?.clearValidate()
}

const showTagInput = () => {
  tagInputVisible.value = true
  nextTick(() => {
    tagInputRef.value?.focus()
  })
}

const addTag = () => {
  const tag = tagInputValue.value.trim()
  if (tag && !form.tags.includes(tag)) {
    form.tags.push(tag)
  }
  tagInputValue.value = ''
  tagInputVisible.value = false
}

const removeTag = (tag: string) => {
  const index = form.tags.indexOf(tag)
  if (index > -1) {
    form.tags.splice(index, 1)
  }
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

const handleSubmit = async () => {
  if (!formRef.value || !props.suite) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    const suiteData: Partial<TestSuite> = {
      id: props.suite.id,
      name: form.name,
      description: form.description,
      environment: form.environment,
      baseUrl: form.baseUrl,
      status: form.status as 'active' | 'inactive' | 'draft',
      config: {
        timeout: form.timeout,
        retryCount: form.retryCount,
        concurrency: form.concurrency,
        stopOnFailure: form.options.includes('stopOnFailure'),
        generateReport: form.options.includes('generateReport'),
        enableScreenshot: form.options.includes('enableScreenshot'),
        enableLogging: form.options.includes('enableLogging')
      },
      notifications: {
        email: form.notifications.includes('email') ? {
          enabled: true,
          recipients: form.emailRecipients.split(',').map(email => email.trim()).filter(Boolean)
        } : { enabled: false, recipients: [] },
        webhook: form.notifications.includes('webhook') ? {
          enabled: true,
          url: form.webhookUrl
        } : { enabled: false, url: '' },
        slack: form.notifications.includes('slack') ? {
          enabled: true
        } : { enabled: false }
      },
      updatedAt: Date.now()
    }
    
    emit('save', { ...props.suite, ...suiteData } as TestSuite)
    ElMessage.success('测试套件更新成功')
    handleClose()
  } catch (error) {
    console.error('表单验证失败:', error)
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  resetForm()
  visible.value = false
}

watch(
  () => props.suite,
  (suite) => {
    if (suite && visible.value) {
      initForm(suite)
    }
  },
  { immediate: true }
)

watch(
  () => visible.value,
  (show) => {
    if (show && props.suite) {
      initForm(props.suite)
    } else if (!show) {
      resetForm()
    }
  }
)
</script>

<style scoped>
.dialog-footer {
  text-align: right;
}

.suite-info {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  font-size: 13px;
  color: #606266;
}

.suite-info p {
  margin: 4px 0;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-checkbox-group) {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

:deep(.el-checkbox) {
  margin-right: 0;
}

:deep(.el-radio-group) {
  display: flex;
  gap: 16px;
}
</style>