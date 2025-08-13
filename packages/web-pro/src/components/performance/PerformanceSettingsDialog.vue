<template>
  <el-dialog
    v-model="visible"
    title="性能监控设置"
    width="600px"
    :before-close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="120px"
      label-position="left"
    >
      <!-- 数据收集设置 -->
      <el-divider content-position="left">
        <span class="divider-title">数据收集设置</span>
      </el-divider>
      
      <el-form-item label="采样率" prop="sampleRate">
        <el-slider
          v-model="formData.sampleRate"
          :min="1"
          :max="100"
          :step="1"
          show-input
          :format-tooltip="formatSampleRate"
        />
        <div class="form-help">设置性能数据的采样率，100%表示收集所有请求</div>
      </el-form-item>

      <el-form-item label="数据保留期" prop="retentionDays">
        <el-select v-model="formData.retentionDays" placeholder="选择数据保留期">
          <el-option label="7天" :value="7" />
          <el-option label="30天" :value="30" />
          <el-option label="90天" :value="90" />
          <el-option label="180天" :value="180" />
          <el-option label="365天" :value="365" />
        </el-select>
        <div class="form-help">超过保留期的数据将被自动清理</div>
      </el-form-item>

      <el-form-item label="自动刷新" prop="autoRefresh">
        <el-switch
          v-model="formData.autoRefresh"
          active-text="开启"
          inactive-text="关闭"
        />
        <div class="form-help">自动刷新性能监控数据</div>
      </el-form-item>

      <el-form-item v-if="formData.autoRefresh" label="刷新间隔" prop="refreshInterval">
        <el-select v-model="formData.refreshInterval" placeholder="选择刷新间隔">
          <el-option label="5秒" :value="5" />
          <el-option label="10秒" :value="10" />
          <el-option label="30秒" :value="30" />
          <el-option label="1分钟" :value="60" />
          <el-option label="5分钟" :value="300" />
        </el-select>
      </el-form-item>

      <!-- 告警设置 -->
      <el-divider content-position="left">
        <span class="divider-title">告警设置</span>
      </el-divider>

      <el-form-item label="响应时间告警" prop="responseTimeAlert">
        <el-switch
          v-model="formData.responseTimeAlert"
          active-text="开启"
          inactive-text="关闭"
        />
      </el-form-item>

      <el-form-item v-if="formData.responseTimeAlert" label="告警阈值" prop="responseTimeThreshold">
        <el-input-number
          v-model="formData.responseTimeThreshold"
          :min="100"
          :max="10000"
          :step="100"
          controls-position="right"
        />
        <span class="unit">毫秒</span>
        <div class="form-help">当响应时间超过此阈值时触发告警</div>
      </el-form-item>

      <el-form-item label="错误率告警" prop="errorRateAlert">
        <el-switch
          v-model="formData.errorRateAlert"
          active-text="开启"
          inactive-text="关闭"
        />
      </el-form-item>

      <el-form-item v-if="formData.errorRateAlert" label="错误率阈值" prop="errorRateThreshold">
        <el-input-number
          v-model="formData.errorRateThreshold"
          :min="1"
          :max="100"
          :step="1"
          controls-position="right"
        />
        <span class="unit">%</span>
        <div class="form-help">当错误率超过此阈值时触发告警</div>
      </el-form-item>

      <!-- 显示设置 -->
      <el-divider content-position="left">
        <span class="divider-title">显示设置</span>
      </el-divider>

      <el-form-item label="默认时间范围" prop="defaultTimeRange">
        <el-select v-model="formData.defaultTimeRange" placeholder="选择默认时间范围">
          <el-option label="最近1小时" value="1h" />
          <el-option label="最近6小时" value="6h" />
          <el-option label="最近24小时" value="24h" />
          <el-option label="最近7天" value="7d" />
          <el-option label="最近30天" value="30d" />
        </el-select>
      </el-form-item>

      <el-form-item label="图表主题" prop="chartTheme">
        <el-radio-group v-model="formData.chartTheme">
          <el-radio label="light">浅色</el-radio>
          <el-radio label="dark">深色</el-radio>
          <el-radio label="auto">跟随系统</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="显示图表" prop="visibleCharts">
        <el-checkbox-group v-model="formData.visibleCharts">
          <el-checkbox label="responseTime">响应时间趋势</el-checkbox>
          <el-checkbox label="requestVolume">请求量分布</el-checkbox>
          <el-checkbox label="waterfall">瀑布图</el-checkbox>
          <el-checkbox label="errorAnalysis">错误分析</el-checkbox>
        </el-checkbox-group>
        <div class="form-help">选择要在性能监控页面显示的图表</div>
      </el-form-item>

      <!-- 导出设置 -->
      <el-divider content-position="left">
        <span class="divider-title">导出设置</span>
      </el-divider>

      <el-form-item label="导出格式" prop="exportFormat">
        <el-checkbox-group v-model="formData.exportFormat">
          <el-checkbox label="json">JSON</el-checkbox>
          <el-checkbox label="csv">CSV</el-checkbox>
          <el-checkbox label="excel">Excel</el-checkbox>
          <el-checkbox label="pdf">PDF</el-checkbox>
        </el-checkbox-group>
      </el-form-item>

      <el-form-item label="包含图表" prop="includeCharts">
        <el-switch
          v-model="formData.includeCharts"
          active-text="是"
          inactive-text="否"
        />
        <div class="form-help">导出报告时是否包含图表图像</div>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button @click="resetToDefault">恢复默认</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
          保存设置
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'

interface PerformanceSettings {
  // 数据收集设置
  sampleRate: number
  retentionDays: number
  autoRefresh: boolean
  refreshInterval: number
  
  // 告警设置
  responseTimeAlert: boolean
  responseTimeThreshold: number
  errorRateAlert: boolean
  errorRateThreshold: number
  
  // 显示设置
  defaultTimeRange: string
  chartTheme: 'light' | 'dark' | 'auto'
  visibleCharts: string[]
  
  // 导出设置
  exportFormat: string[]
  includeCharts: boolean
}

interface Props {
  modelValue: boolean
  settings?: PerformanceSettings
}

const props = withDefaults(defineProps<Props>(), {
  settings: () => ({
    sampleRate: 100,
    retentionDays: 30,
    autoRefresh: true,
    refreshInterval: 30,
    responseTimeAlert: true,
    responseTimeThreshold: 2000,
    errorRateAlert: true,
    errorRateThreshold: 5,
    defaultTimeRange: '24h',
    chartTheme: 'auto',
    visibleCharts: ['responseTime', 'requestVolume', 'waterfall', 'errorAnalysis'],
    exportFormat: ['json', 'csv'],
    includeCharts: true
  })
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'save': [settings: PerformanceSettings]
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const formRef = ref<FormInstance>()
const saving = ref(false)
const formData = ref<PerformanceSettings>({ ...props.settings })

// 表单验证规则
const rules: FormRules = {
  sampleRate: [
    { required: true, message: '请设置采样率', trigger: 'blur' },
    { type: 'number', min: 1, max: 100, message: '采样率必须在1-100之间', trigger: 'blur' }
  ],
  retentionDays: [
    { required: true, message: '请选择数据保留期', trigger: 'change' }
  ],
  refreshInterval: [
    { required: true, message: '请选择刷新间隔', trigger: 'change' }
  ],
  responseTimeThreshold: [
    { required: true, message: '请设置响应时间阈值', trigger: 'blur' },
    { type: 'number', min: 100, max: 10000, message: '阈值必须在100-10000毫秒之间', trigger: 'blur' }
  ],
  errorRateThreshold: [
    { required: true, message: '请设置错误率阈值', trigger: 'blur' },
    { type: 'number', min: 1, max: 100, message: '阈值必须在1-100%之间', trigger: 'blur' }
  ],
  defaultTimeRange: [
    { required: true, message: '请选择默认时间范围', trigger: 'change' }
  ],
  chartTheme: [
    { required: true, message: '请选择图表主题', trigger: 'change' }
  ],
  visibleCharts: [
    { type: 'array', min: 1, message: '至少选择一个图表', trigger: 'change' }
  ],
  exportFormat: [
    { type: 'array', min: 1, message: '至少选择一种导出格式', trigger: 'change' }
  ]
}

// 监听设置变化
watch(() => props.settings, (newSettings) => {
  if (newSettings) {
    formData.value = { ...newSettings }
  }
}, { deep: true })

// 方法
const formatSampleRate = (value: number) => {
  return `${value}%`
}

const handleSave = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    saving.value = true
    
    // 模拟保存延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    emit('save', { ...formData.value })
    ElMessage.success('设置保存成功')
    visible.value = false
  } catch (error) {
    ElMessage.error('请检查表单输入')
  } finally {
    saving.value = false
  }
}

const resetToDefault = () => {
  formData.value = {
    sampleRate: 100,
    retentionDays: 30,
    autoRefresh: true,
    refreshInterval: 30,
    responseTimeAlert: true,
    responseTimeThreshold: 2000,
    errorRateAlert: true,
    errorRateThreshold: 5,
    defaultTimeRange: '24h',
    chartTheme: 'auto',
    visibleCharts: ['responseTime', 'requestVolume', 'waterfall', 'errorAnalysis'],
    exportFormat: ['json', 'csv'],
    includeCharts: true
  }
  ElMessage.info('已恢复默认设置')
}

const handleClose = () => {
  visible.value = false
}
</script>

<style scoped>
.divider-title {
  font-weight: 600;
  color: #303133;
  font-size: 14px;
}

.form-help {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

.unit {
  margin-left: 8px;
  color: #909399;
  font-size: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-divider__text) {
  background-color: #fff;
}

:deep(.el-checkbox-group) {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

:deep(.el-checkbox) {
  margin-right: 0;
}

:deep(.el-slider) {
  margin-right: 16px;
}

:deep(.el-input-number) {
  width: 150px;
}
</style>