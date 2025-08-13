<template>
  <div class="run-history-chart">
    <div class="chart-header">
      <h3>运行历史趋势</h3>
      <div class="chart-controls">
        <el-select v-model="timeRange" @change="handleTimeRangeChange" style="width: 120px">
          <el-option label="7天" value="7d" />
          <el-option label="30天" value="30d" />
          <el-option label="90天" value="90d" />
        </el-select>
        <el-select v-model="chartType" @change="handleChartTypeChange" style="width: 100px; margin-left: 10px">
          <el-option label="折线图" value="line" />
          <el-option label="柱状图" value="bar" />
        </el-select>
      </div>
    </div>
    
    <div class="chart-container" ref="chartContainer">
      <div v-if="loading" class="chart-loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载中...</span>
      </div>
      <div v-else-if="!hasData" class="chart-empty">
        <el-empty description="暂无数据" />
      </div>
      <div v-else ref="chartRef" class="chart" style="width: 100%; height: 300px;"></div>
    </div>
    
    <div class="chart-legend">
      <div class="legend-item">
        <span class="legend-color success"></span>
        <span>成功</span>
      </div>
      <div class="legend-item">
        <span class="legend-color failed"></span>
        <span>失败</span>
      </div>
      <div class="legend-item">
        <span class="legend-color total"></span>
        <span>总数</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import type { ECharts } from 'echarts'
import type { RunHistoryData } from '@/types'

interface Props {
  data: RunHistoryData[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  'time-range-change': [range: string]
  'chart-type-change': [type: string]
}>()

const chartRef = ref<HTMLElement>()
const chartContainer = ref<HTMLElement>()
const timeRange = ref('7d')
const chartType = ref('line')

let chart: ECharts | null = null

const hasData = computed(() => props.data && props.data.length > 0)

const initChart = () => {
  if (!chartRef.value || !hasData.value) return
  
  chart = echarts.init(chartRef.value)
  updateChart()
}

const updateChart = () => {
  if (!chart || !hasData.value) return
  
  const dates = props.data.map(item => item.date)
  const successData = props.data.map(item => item.success)
  const failedData = props.data.map(item => item.failed)
  const totalData = props.data.map(item => item.total)
  
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      },
      formatter: (params: any) => {
        let result = `${params[0].axisValue}<br/>`
        params.forEach((param: any) => {
          result += `${param.marker}${param.seriesName}: ${param.value}<br/>`
        })
        return result
      }
    },
    legend: {
      show: false
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: chartType.value === 'bar',
      data: dates,
      axisLabel: {
        formatter: (value: string) => {
          const date = new Date(value)
          return `${date.getMonth() + 1}/${date.getDate()}`
        }
      }
    },
    yAxis: {
      type: 'value',
      minInterval: 1
    },
    series: [
      {
        name: '成功',
        type: chartType.value,
        data: successData,
        itemStyle: {
          color: '#67c23a'
        },
        smooth: chartType.value === 'line'
      },
      {
        name: '失败',
        type: chartType.value,
        data: failedData,
        itemStyle: {
          color: '#f56c6c'
        },
        smooth: chartType.value === 'line'
      },
      {
        name: '总数',
        type: chartType.value,
        data: totalData,
        itemStyle: {
          color: '#409eff'
        },
        smooth: chartType.value === 'line'
      }
    ]
  }
  
  chart.setOption(option)
}

const handleResize = () => {
  if (chart) {
    chart.resize()
  }
}

const handleTimeRangeChange = (range: string) => {
  emit('time-range-change', range)
}

const handleChartTypeChange = (type: string) => {
  nextTick(() => {
    updateChart()
  })
  emit('chart-type-change', type)
}

watch(
  () => props.data,
  () => {
    nextTick(() => {
      if (hasData.value && !chart) {
        initChart()
      } else if (chart) {
        updateChart()
      }
    })
  },
  { deep: true }
)

watch(
  () => props.loading,
  (loading) => {
    if (!loading && hasData.value) {
      nextTick(() => {
        initChart()
      })
    }
  }
)

onMounted(() => {
  window.addEventListener('resize', handleResize)
  if (hasData.value) {
    nextTick(() => {
      initChart()
    })
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (chart) {
    chart.dispose()
    chart = null
  }
})
</script>

<style scoped>
.run-history-chart {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-header h3 {
  margin: 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.chart-controls {
  display: flex;
  align-items: center;
}

.chart-container {
  position: relative;
  min-height: 300px;
}

.chart-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #909399;
}

.chart-loading .el-icon {
  font-size: 24px;
  margin-bottom: 10px;
}

.chart-empty {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #606266;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-color.success {
  background-color: #67c23a;
}

.legend-color.failed {
  background-color: #f56c6c;
}

.legend-color.total {
  background-color: #409eff;
}
</style>