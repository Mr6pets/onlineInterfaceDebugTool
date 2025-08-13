<template>
  <div class="waterfall-chart">
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
import { CustomChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'

use([
  CanvasRenderer,
  CustomChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

interface WaterfallData {
  name: string
  start: number
  duration: number
  type: 'dns' | 'connect' | 'request' | 'response' | 'processing'
}

interface Props {
  data: WaterfallData[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const chartRef = ref()

const typeColors = {
  dns: '#409eff',
  connect: '#67c23a',
  request: '#e6a23c',
  response: '#f56c6c',
  processing: '#909399'
}

const typeNames = {
  dns: 'DNS解析',
  connect: '连接建立',
  request: '请求发送',
  response: '响应接收',
  processing: '数据处理'
}

const chartOption = computed(() => {
  const categories = [...new Set(props.data.map(item => item.name))]
  const maxTime = Math.max(...props.data.map(item => item.start + item.duration))
  
  const seriesData = props.data.map((item, index) => {
    const categoryIndex = categories.indexOf(item.name)
    return {
      name: item.name,
      value: [categoryIndex, item.start, item.start + item.duration, item.duration],
      itemStyle: {
        color: typeColors[item.type]
      },
      type: item.type
    }
  })

  return {
    tooltip: {
      formatter: (params: any) => {
        const data = params.data
        const typeName = typeNames[data.type as keyof typeof typeNames]
        return `
          <div style="margin-bottom: 8px; font-weight: 600;">${data.name}</div>
          <div style="display: flex; align-items: center; margin-bottom: 4px;">
            <span style="display: inline-block; width: 10px; height: 10px; background-color: ${params.color}; border-radius: 2px; margin-right: 8px;"></span>
            <span style="margin-right: 8px;">${typeName}:</span>
            <span style="font-weight: 600;">${data.value[3]}ms</span>
          </div>
          <div style="margin-top: 8px; color: #666; font-size: 12px;">
            开始时间: ${data.value[1]}ms<br/>
            结束时间: ${data.value[2]}ms
          </div>
        `
      }
    },
    legend: {
      data: Object.values(typeNames),
      top: 10
    },
    grid: {
      left: '15%',
      right: '4%',
      bottom: '10%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: '时间 (ms)',
      max: maxTime,
      axisLabel: {
        formatter: '{value} ms'
      }
    },
    yAxis: {
      type: 'category',
      data: categories,
      axisLabel: {
        formatter: (value: string) => {
          return value.length > 20 ? value.substring(0, 20) + '...' : value
        }
      }
    },
    series: [
      {
        type: 'custom',
        renderItem: (params: any, api: any) => {
          const categoryIndex = api.value(0)
          const start = api.coord([api.value(1), categoryIndex])
          const end = api.coord([api.value(2), categoryIndex])
          const height = api.size([0, 1])[1] * 0.6
          
          return {
            type: 'rect',
            shape: {
              x: start[0],
              y: start[1] - height / 2,
              width: end[0] - start[0],
              height: height
            },
            style: {
              fill: api.visual('color'),
              stroke: api.visual('color'),
              strokeWidth: 1
            }
          }
        },
        data: seriesData
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
.waterfall-chart {
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