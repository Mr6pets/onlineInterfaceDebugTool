<template>
  <div class="response-time-chart">
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
import { LineChart } from 'echarts/charts'
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
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent
])

interface ResponseTimeData {
  timestamp: string
  avgTime: number
  p95Time: number
  p99Time: number
}

interface Props {
  data: ResponseTimeData[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const chartRef = ref()

const chartOption = computed(() => {
  const timestamps = props.data.map(item => item.timestamp)
  const avgTimes = props.data.map(item => item.avgTime)
  const p95Times = props.data.map(item => item.p95Time)
  const p99Times = props.data.map(item => item.p99Time)

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      },
      formatter: (params: any) => {
        let result = `<div style="margin-bottom: 8px; font-weight: 600;">${params[0].axisValue}</div>`
        params.forEach((param: any) => {
          result += `<div style="display: flex; align-items: center; margin-bottom: 4px;">
            <span style="display: inline-block; width: 10px; height: 10px; background-color: ${param.color}; border-radius: 50%; margin-right: 8px;"></span>
            <span style="margin-right: 8px;">${param.seriesName}:</span>
            <span style="font-weight: 600;">${param.value}ms</span>
          </div>`
        })
        return result
      }
    },
    legend: {
      data: ['平均响应时间', 'P95响应时间', 'P99响应时间'],
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
      boundaryGap: false,
      data: timestamps,
      axisLabel: {
        formatter: (value: string) => {
          const date = new Date(value)
          return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
        }
      }
    },
    yAxis: {
      type: 'value',
      name: '响应时间 (ms)',
      axisLabel: {
        formatter: '{value} ms'
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
        name: '平均响应时间',
        type: 'line',
        data: avgTimes,
        smooth: true,
        lineStyle: {
          color: '#409eff',
          width: 2
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
            ]
          }
        }
      },
      {
        name: 'P95响应时间',
        type: 'line',
        data: p95Times,
        smooth: true,
        lineStyle: {
          color: '#e6a23c',
          width: 2
        }
      },
      {
        name: 'P99响应时间',
        type: 'line',
        data: p99Times,
        smooth: true,
        lineStyle: {
          color: '#f56c6c',
          width: 2
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
.response-time-chart {
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