<template>
  <div class="error-analysis-chart">
    <div v-if="loading" class="chart-loading">
      <el-skeleton animated>
        <template #template>
          <el-skeleton-item variant="rect" style="width: 100%; height: 300px" />
        </template>
      </el-skeleton>
    </div>
    <div v-else-if="!data || data.length === 0" class="chart-empty">
      <el-empty description="暂无错误数据" />
    </div>
    <v-chart v-else ref="chartRef" :option="chartOption" style="height: 300px" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components'
import VChart from 'vue-echarts'

use([
  CanvasRenderer,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent
])

interface ErrorData {
  type: string
  count: number
  percentage: number
}

interface Props {
  data: ErrorData[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const chartRef = ref()

const errorColors = [
  '#f56c6c',
  '#e6a23c',
  '#909399',
  '#409eff',
  '#67c23a',
  '#c23531',
  '#2f4554',
  '#61a0a8',
  '#d48265',
  '#91c7ae'
]

const chartOption = computed(() => {
  const pieData = props.data.map((item, index) => ({
    name: item.type,
    value: item.count,
    percentage: item.percentage,
    itemStyle: {
      color: errorColors[index % errorColors.length]
    }
  }))

  return {
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        return `
          <div style="margin-bottom: 8px; font-weight: 600;">${params.name}</div>
          <div style="display: flex; align-items: center; margin-bottom: 4px;">
            <span style="display: inline-block; width: 10px; height: 10px; background-color: ${params.color}; border-radius: 50%; margin-right: 8px;"></span>
            <span style="margin-right: 8px;">错误数量:</span>
            <span style="font-weight: 600;">${params.value}</span>
          </div>
          <div style="margin-top: 4px; color: #666; font-size: 12px;">
            占比: ${params.data.percentage}%
          </div>
        `
      }
    },
    legend: {
      type: 'scroll',
      orient: 'vertical',
      right: 10,
      top: 20,
      bottom: 20,
      data: props.data.map(item => item.type),
      formatter: (name: string) => {
        const item = props.data.find(d => d.type === name)
        return `${name} (${item?.count || 0})`
      }
    },
    series: [
      {
        name: '错误分析',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['40%', '50%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
            formatter: (params: any) => {
              return `${params.name}\n${params.data.percentage}%`
            }
          }
        },
        labelLine: {
          show: false
        },
        data: pieData
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
.error-analysis-chart {
  width: 100%;
  height: 300px;
}

.chart-loading,
.chart-empty {
  width: 100%;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>