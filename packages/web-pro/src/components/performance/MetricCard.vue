<template>
  <div class="metric-card" :style="{ borderLeftColor: color }">
    <div class="metric-header">
      <h4 class="metric-title">{{ title }}</h4>
      <div v-if="trend" class="metric-trend" :class="trendClass">
        <el-icon>
          <ArrowUp v-if="trend.direction === 'up'" />
          <ArrowDown v-else />
        </el-icon>
        <span>{{ trend.value }}%</span>
      </div>
    </div>
    <div class="metric-content">
      <div class="metric-value">
        <span class="value">{{ formattedValue }}</span>
        <span v-if="unit" class="unit">{{ unit }}</span>
      </div>
      <div v-if="description" class="metric-description">
        {{ description }}
      </div>
    </div>
    <div v-if="showChart" class="metric-chart">
      <div class="mini-chart" :style="{ backgroundColor: `${color}20` }">
        <!-- 简单的迷你图表占位 -->
        <div class="chart-line" :style="{ backgroundColor: color }"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import type { Trend } from '../../types'

interface Props {
  title: string
  value: number | string
  unit?: string
  color?: string
  trend?: Trend
  description?: string
  showChart?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  color: '#409eff',
  showChart: false
})

const formattedValue = computed(() => {
  if (typeof props.value === 'number') {
    if (props.value >= 1000000) {
      return (props.value / 1000000).toFixed(1) + 'M'
    } else if (props.value >= 1000) {
      return (props.value / 1000).toFixed(1) + 'K'
    } else {
      return props.value.toLocaleString()
    }
  }
  return props.value
})

const trendClass = computed(() => {
  if (!props.trend) return ''
  return props.trend.direction === 'up' ? 'trend-up' : 'trend-down'
})
</script>

<style scoped>
.metric-card {
  background: white;
  border-radius: 8px;
  border-left: 4px solid;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  transition: all 0.3s ease;
}

.metric-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.metric-title {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  line-height: 1.4;
}

.metric-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 4px;
}

.trend-up {
  color: #67c23a;
  background-color: #f0f9ff;
}

.trend-down {
  color: #f56c6c;
  background-color: #fef0f0;
}

.metric-content {
  margin-bottom: 12px;
}

.metric-value {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 8px;
}

.value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
}

.unit {
  font-size: 14px;
  color: #909399;
  font-weight: 400;
}

.metric-description {
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.metric-chart {
  height: 40px;
  margin-top: 12px;
}

.mini-chart {
  height: 100%;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.chart-line {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 60%;
  border-radius: 2px 2px 0 0;
  opacity: 0.8;
}
</style>