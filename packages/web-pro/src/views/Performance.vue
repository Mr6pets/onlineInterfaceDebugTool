<template>
  <div class="performance-page">
    <PageHeader title="性能监控" subtitle="实时监控API性能指标">
      <template #actions>
        <el-date-picker
          v-model="timeRange"
          type="datetimerange"
          range-separator="至"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          size="small"
          @change="loadMetrics"
        />
        <el-button @click="exportReport" size="small">
          导出报告
        </el-button>
        <el-button @click="showSettings = true" size="small">
          设置
        </el-button>
      </template>
    </PageHeader>
    
    <div class="performance-content">
      <!-- 概览卡片 -->
      <div class="overview-cards">
        <MetricCard
          title="平均响应时间"
          :value="summary.avgDuration"
          unit="ms"
          :trend="responseTrend"
          color="#409eff"
        />
        <MetricCard
          title="成功率"
          :value="summary.successRate"
          unit="%"
          :trend="successTrend"
          color="#67c23a"
        />
        <MetricCard
          title="总请求数"
          :value="summary.totalRequests"
          :trend="requestTrend"
          color="#e6a23c"
        />
        <MetricCard
          title="错误率"
          :value="summary.errorRate"
          unit="%"
          :trend="errorTrend"
          color="#f56c6c"
        />
      </div>
      
      <!-- 图表区域 -->
      <div class="charts-section">
        <div class="chart-row">
          <div class="chart-container">
            <h4>响应时间趋势</h4>
            <ResponseTimeChart :data="responseTimeData" :loading="loading" />
          </div>
          <div class="chart-container">
            <h4>请求量分布</h4>
            <RequestVolumeChart :data="requestVolumeData" :loading="loading" />
          </div>
        </div>
        
        <div class="chart-row">
          <div class="chart-container">
            <h4>性能瀑布图</h4>
            <WaterfallChart :data="waterfallData" :loading="loading" />
          </div>
          <div class="chart-container">
            <h4>错误分析</h4>
            <ErrorAnalysisChart :data="errorData" :loading="loading" />
          </div>
        </div>
      </div>
      
      <!-- 详细数据表格 -->
      <div class="data-table-section">
        <h4>详细数据</h4>
        <PerformanceTable
          :data="metricsData"
          :loading="loading"
          @row-click="showRequestDetail"
        />
      </div>
    </div>
    
    <!-- 请求详情对话框 -->
    <RequestDetailDialog
      v-model="showDetailDialog"
      :request="selectedRequest"
    />
    
    <!-- 设置对话框 -->
    <PerformanceSettingsDialog
      v-model="showSettings"
      :settings="performanceSettings"
      @save="saveSettings"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '../components/common/PageHeader.vue'
import MetricCard from '../components/performance/MetricCard.vue'
import ResponseTimeChart from '../components/performance/ResponseTimeChart.vue'
import RequestVolumeChart from '../components/performance/RequestVolumeChart.vue'
import WaterfallChart from '../components/performance/WaterfallChart.vue'
import ErrorAnalysisChart from '../components/performance/ErrorAnalysisChart.vue'
import PerformanceTable from '../components/performance/PerformanceTable.vue'
import RequestDetailDialog from '../components/performance/RequestDetailDialog.vue'
import PerformanceSettingsDialog from '../components/performance/PerformanceSettingsDialog.vue'
import { usePerformanceStore } from '../stores/performance'
import type { PerformanceMetrics } from '@api-debug-tool/shared/types'

const performanceStore = usePerformanceStore()

const timeRange = ref<[Date, Date]>([new Date(Date.now() - 24 * 60 * 60 * 1000), new Date()])
const loading = ref(false)
const showDetailDialog = ref(false)
const showSettings = ref(false)
const selectedRequest = ref<PerformanceMetrics | null>(null)

const summary = computed(() => performanceStore.summary)
const metricsData = computed(() => performanceStore.metrics)
const responseTimeData = computed(() => performanceStore.responseTimeData)
const requestVolumeData = computed(() => performanceStore.requestVolumeData)
const waterfallData = computed(() => performanceStore.waterfallData)
const errorData = computed(() => performanceStore.errorData)
const performanceSettings = computed(() => performanceStore.settings)

// 趋势计算
const responseTrend = computed(() => {
  // 计算响应时间趋势
  return { value: 5.2, direction: 'up' }
})

const successTrend = computed(() => {
  return { value: 2.1, direction: 'up' }
})

const requestTrend = computed(() => {
  return { value: 12.5, direction: 'up' }
})

const errorTrend = computed(() => {
  return { value: 1.3, direction: 'down' }
})

onMounted(() => {
  loadMetrics()
  // 定时刷新数据
  setInterval(loadMetrics, 30000)
})

const loadMetrics = async () => {
  loading.value = true
  try {
    await performanceStore.loadMetrics({
      startTime: timeRange.value[0],
      endTime: timeRange.value[1]
    })
  } catch (error) {
    ElMessage.error('加载性能数据失败')
  } finally {
    loading.value = false
  }
}

const showRequestDetail = (request: PerformanceMetrics) => {
  selectedRequest.value = request
  showDetailDialog.value = true
}

const exportReport = async () => {
  try {
    await performanceStore.exportReport({
      timeRange: timeRange.value,
      format: 'pdf'
    })
    ElMessage.success('报告导出成功')
  } catch (error) {
    ElMessage.error('报告导出失败')
  }
}

const saveSettings = (settings: any) => {
  performanceStore.updateSettings(settings)
  ElMessage.success('设置已保存')
}
</script>

<style lang="scss" scoped>
.performance-page {
  padding: 24px;
  
  .performance-content {
    .overview-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .charts-section {
      margin-bottom: 24px;
      
      .chart-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin-bottom: 16px;
        
        .chart-container {
          background: white;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          
          h4 {
            margin: 0 0 16px 0;
            font-size: 14px;
            color: #303133;
          }
        }
      }
    }
    
    .data-table-section {
      background: white;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      
      h4 {
        margin: 0 0 16px 0;
        font-size: 14px;
        color: #303133;
      }
    }
  }
}
</style>