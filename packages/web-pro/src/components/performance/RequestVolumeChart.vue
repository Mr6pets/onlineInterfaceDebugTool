<template>
  <div class="request-volume-chart">
    <div v-if="loading" class="chart-loading">
      <el-skeleton animated>
        <template #template>
          <el-skeleton-item variant="rect" style="width: 100%; height: 300px" />
        </template>
      </el-skeleton>
    </div>
    <v-chart v-else ref="chartRef" :option="chartOption" style="height: 300px" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent
} from 'echarts/components'
import VChart from 'vue-echarts'

use([
  CanvasRenderer,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent
])

interface RequestVolumeData {
  timestamp: string
  successCount: number
  errorCount: number
  totalCount: number
}

interface Props {
  data: RequestVolumeData[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const chartRef = ref()

const chartOption = computed(() => {
  const timestamps = props.data.map(item => item.timestamp)
  const successCounts = props.data.map(item => item.successCount)
  const errorCounts = props.data.map(item => item.errorCount)

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params: any) => {
        let result = `<div style="margin-bottom: 8px; font-weight: 600;">${params[0].axisValue}</div>`
        let total = 0
        params.forEach((param: any) => {
          total += param.value
          result += `<div style="display: flex; align-items: center; margin-bottom: 4px;">
            <span style="display: inline-block; width: 10px; height: 10px; background-color: ${param.color}; border-radius: 2px; margin-right: 8px;"></span>
            <span style="margin-right: 8px;">${param.seriesName}:</span>
            <span style="font-weight: 600;">${param.value}</span>
          </div>`
        })
        result += `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee; font-weight: 600;">总计: ${total}</div>`
        return result
      }
    },
    legend: {
      data: ['成功请求', '失败请求'],
      top: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: timestamps,
      axisLabel: {
        formatter: (value: string) => {
          const date = new Date(value)
          return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
        },
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '请求数量',
      axisLabel: {
        formatter: (value: number) => {
          if (value >= 1000) {
            return (value / 1000).toFixed(1) + 'K'
          }
          return value.toString()
        }
      }
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100
      },
      {
        start: 0,
        end: 100,
        height: 30,
        bottom: 20
      }
    ],
    series: [
      {
        name: '成功请求',
        type: 'bar',
        stack: 'total',
        data: successCounts,
        itemStyle: {
          color: '#67c23a'
        },
        emphasis: {
          itemStyle: {
            color: '#5daf34'
          }
        }
      },
      {
        name: '失败请求',
        type: 'bar',
        stack: 'total',
        data: errorCounts,
        itemStyle: {
          color: '#f56c6c'
        },
        emphasis: {
          itemStyle: {
            color: '#f45656'
          }
        }
      }
    ]
  }
})

watch(() => props.data, () => {
  if (chartRef.value) {
    chartRef.value.resize()
  }
}, { deep: true })
</script>

<style scoped>
.request-volume-chart {
  width: 100%;
  height: 300px;
}

.chart-loading {
  width: 100%;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>