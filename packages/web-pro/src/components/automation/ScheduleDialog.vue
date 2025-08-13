<template>
  <el-dialog
    v-model="visible"
    title="定时任务设置"
    width="500px"
    :before-close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      @submit.prevent
    >
      <el-form-item label="任务名称" prop="name">
        <el-input
          v-model="form.name"
          placeholder="请输入任务名称"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>
      
      <el-form-item label="测试套件" prop="suiteId">
        <el-select v-model="form.suiteId" placeholder="请选择测试套件" style="width: 100%">
          <el-option
            v-for="suite in suites"
            :key="suite.id"
            :label="suite.name"
            :value="suite.id"
          />
        </el-select>
      </el-form-item>
      
      <el-form-item label="执行类型" prop="type">
        <el-radio-group v-model="form.type">
          <el-radio label="cron">Cron表达式</el-radio>
          <el-radio label="interval">间隔执行</el-radio>
          <el-radio label="once">单次执行</el-radio>
        </el-radio-group>
      </el-form-item>
      
      <!-- Cron表达式配置 -->
      <template v-if="form.type === 'cron'">
        <el-form-item label="Cron表达式" prop="cronExpression">
          <el-input
            v-model="form.cronExpression"
            placeholder="如：0 0 2 * * * (每天凌晨2点)"
          />
          <div class="cron-help">
            <el-text size="small" type="info">
              格式：秒 分 时 日 月 周，例如：0 0 2 * * * 表示每天凌晨2点执行
            </el-text>
          </div>
        </el-form-item>
        
        <el-form-item label="快速设置">
          <el-select v-model="cronPreset" @change="applyCronPreset" placeholder="选择预设" style="width: 100%">
            <el-option label="每小时" value="0 0 * * * *" />
            <el-option label="每天凌晨2点" value="0 0 2 * * *" />
            <el-option label="每周一凌晨2点" value="0 0 2 * * 1" />
            <el-option label="每月1号凌晨2点" value="0 0 2 1 * *" />
            <el-option label="工作日凌晨2点" value="0 0 2 * * 1-5" />
            <el-option label="周末凌晨2点" value="0 0 2 * * 0,6" />
          </el-select>
        </el-form-item>
      </template>
      
      <!-- 间隔执行配置 -->
      <template v-if="form.type === 'interval'">
        <el-form-item label="执行间隔" prop="interval">
          <el-input-number
            v-model="form.interval"
            :min="1"
            :max="1440"
            controls-position="right"
            style="width: 150px;"
          />
          <el-select v-model="form.intervalUnit" style="width: 100px; margin-left: 10px;">
            <el-option label="分钟" value="minutes" />
            <el-option label="小时" value="hours" />
            <el-option label="天" value="days" />
          </el-select>
        </el-form-item>
      </template>
      
      <!-- 单次执行配置 -->
      <template v-if="form.type === 'once'">
        <el-form-item label="执行时间" prop="executeAt">
          <el-date-picker
            v-model="form.executeAt"
            type="datetime"
            placeholder="选择执行时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
            :disabled-date="disabledDate"
          />
        </el-form-item>
      </template>
      
      <el-form-item label="时区">
        <el-select v-model="form.timezone" placeholder="选择时区" style="width: 100%">
          <el-option label="Asia/Shanghai (UTC+8)" value="Asia/Shanghai" />
          <el-option label="UTC (UTC+0)" value="UTC" />
          <el-option label="America/New_York (UTC-5)" value="America/New_York" />
          <el-option label="Europe/London (UTC+0)" value="Europe/London" />
        </el-select>
      </el-form-item>
      
      <el-form-item label="状态">
        <el-switch
          v-model="form.enabled"
          active-text="启用"
          inactive-text="禁用"
        />
      </el-form-item>
      
      <el-form-item label="失败重试">
        <el-switch
          v-model="form.retryOnFailure"
          active-text="启用"
          inactive-text="禁用"
        />
      </el-form-item>
      
      <el-form-item v-if="form.retryOnFailure" label="重试次数">
        <el-input-number
          v-model="form.maxRetries"
          :min="1"
          :max="5"
          controls-position="right"
          style="width: 150px;"
        />
      </el-form-item>
      
      <el-form-item label="通知设置">
        <el-checkbox-group v-model="form.notifications">
          <el-checkbox label="onSuccess">成功时通知</el-checkbox>
          <el-checkbox label="onFailure">失败时通知</el-checkbox>
          <el-checkbox label="onStart">开始时通知</el-checkbox>
        </el-checkbox-group>
      </el-form-item>
      
      <el-form-item label="描述">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="2"
          placeholder="请输入任务描述"
          maxlength="200"
          show-word-limit
        />
      </el-form-item>
      
      <!-- 下次执行时间预览 -->
      <el-form-item v-if="nextExecutionTime" label="下次执行">
        <el-text type="info">{{ nextExecutionTime }}</el-text>
      </el-form-item>
    </el-form>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          {{ schedule ? '更新任务' : '创建任务' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import type { TestSuite, Schedule } from '@/types'

interface Props {
  modelValue: boolean
  suites: TestSuite[]
  schedule?: Schedule | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'save': [schedule: Partial<Schedule>]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const formRef = ref<FormInstance>()
const loading = ref(false)
const cronPreset = ref('')

const form = reactive({
  name: '',
  suiteId: '',
  type: 'cron',
  cronExpression: '',
  interval: 1,
  intervalUnit: 'hours',
  executeAt: '',
  timezone: 'Asia/Shanghai',
  enabled: true,
  retryOnFailure: false,
  maxRetries: 1,
  notifications: [] as string[],
  description: ''
})

const rules: FormRules = {
  name: [
    { required: true, message: '请输入任务名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  suiteId: [
    { required: true, message: '请选择测试套件', trigger: 'change' }
  ],
  type: [
    { required: true, message: '请选择执行类型', trigger: 'change' }
  ],
  cronExpression: [
    {
      validator: (rule, value, callback) => {
        if (form.type === 'cron' && !value) {
          callback(new Error('请输入Cron表达式'))
        } else if (form.type === 'cron' && value) {
          // 简单的Cron表达式验证
          const cronRegex = /^\s*(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s*$/
          if (!cronRegex.test(value)) {
            callback(new Error('Cron表达式格式不正确'))
          }
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  interval: [
    {
      validator: (rule, value, callback) => {
        if (form.type === 'interval' && (!value || value < 1)) {
          callback(new Error('请输入有效的执行间隔'))
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  executeAt: [
    {
      validator: (rule, value, callback) => {
        if (form.type === 'once' && !value) {
          callback(new Error('请选择执行时间'))
        } else if (form.type === 'once' && value) {
          const executeTime = new Date(value).getTime()
          const now = Date.now()
          if (executeTime <= now) {
            callback(new Error('执行时间必须晚于当前时间'))
          }
        }
        callback()
      },
      trigger: 'change'
    }
  ]
}

const nextExecutionTime = computed(() => {
  if (form.type === 'once' && form.executeAt) {
    return new Date(form.executeAt).toLocaleString('zh-CN')
  }
  if (form.type === 'interval' && form.interval) {
    const now = new Date()
    let nextTime: Date
    
    switch (form.intervalUnit) {
      case 'minutes':
        nextTime = new Date(now.getTime() + form.interval * 60 * 1000)
        break
      case 'hours':
        nextTime = new Date(now.getTime() + form.interval * 60 * 60 * 1000)
        break
      case 'days':
        nextTime = new Date(now.getTime() + form.interval * 24 * 60 * 60 * 1000)
        break
      default:
        return ''
    }
    
    return nextTime.toLocaleString('zh-CN')
  }
  if (form.type === 'cron' && form.cronExpression) {
    // 这里可以集成cron解析库来计算下次执行时间
    return '根据Cron表达式计算'
  }
  return ''
})

const disabledDate = (time: Date) => {
  return time.getTime() < Date.now() - 24 * 60 * 60 * 1000
}

const applyCronPreset = (preset: string) => {
  if (preset) {
    form.cronExpression = preset
    cronPreset.value = ''
  }
}

const initForm = (schedule: Schedule) => {
  Object.assign(form, {
    name: schedule.name || '',
    suiteId: schedule.suiteId || '',
    type: schedule.type || 'cron',
    cronExpression: schedule.cronExpression || '',
    interval: schedule.interval || 1,
    intervalUnit: schedule.intervalUnit || 'hours',
    executeAt: schedule.executeAt ? new Date(schedule.executeAt).toISOString().slice(0, 19) : '',
    timezone: schedule.timezone || 'Asia/Shanghai',
    enabled: schedule.enabled !== false,
    retryOnFailure: schedule.retryOnFailure || false,
    maxRetries: schedule.maxRetries || 1,
    notifications: schedule.notifications || [],
    description: schedule.description || ''
  })
}

const resetForm = () => {
  Object.assign(form, {
    name: '',
    suiteId: '',
    type: 'cron',
    cronExpression: '',
    interval: 1,
    intervalUnit: 'hours',
    executeAt: '',
    timezone: 'Asia/Shanghai',
    enabled: true,
    retryOnFailure: false,
    maxRetries: 1,
    notifications: [],
    description: ''
  })
  cronPreset.value = ''
  formRef.value?.clearValidate()
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    const scheduleData: Partial<Schedule> = {
      ...(props.schedule?.id && { id: props.schedule.id }),
      name: form.name,
      suiteId: form.suiteId,
      type: form.type as 'cron' | 'interval' | 'once',
      cronExpression: form.type === 'cron' ? form.cronExpression : undefined,
      interval: form.type === 'interval' ? form.interval : undefined,
      intervalUnit: form.type === 'interval' ? form.intervalUnit as 'minutes' | 'hours' | 'days' : undefined,
      executeAt: form.type === 'once' ? new Date(form.executeAt).getTime() : undefined,
      timezone: form.timezone,
      enabled: form.enabled,
      retryOnFailure: form.retryOnFailure,
      maxRetries: form.retryOnFailure ? form.maxRetries : undefined,
      notifications: form.notifications,
      description: form.description,
      updatedAt: Date.now()
    }
    
    emit('save', scheduleData)
    ElMessage.success(props.schedule ? '定时任务更新成功' : '定时任务创建成功')
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
  () => props.schedule,
  (schedule) => {
    if (schedule && visible.value) {
      initForm(schedule)
    }
  },
  { immediate: true }
)

watch(
  () => visible.value,
  (show) => {
    if (show && props.schedule) {
      initForm(props.schedule)
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

.cron-help {
  margin-top: 4px;
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
  flex-direction: column;
  gap: 8px;
}
</style>