<template>
  <div class="page-header">
    <div class="header-content">
      <div class="header-left">
        <h1 class="page-title">{{ title }}</h1>
        <p v-if="subtitle" class="page-subtitle">{{ subtitle }}</p>
      </div>
      <div class="header-right">
        <slot name="actions"></slot>
      </div>
    </div>
    <div v-if="$slots.tabs" class="header-tabs">
      <slot name="tabs"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  subtitle?: string
}

defineProps<Props>()
</script>

<style scoped>
.page-header {
  background: white;
  border-bottom: 1px solid #e4e7ed;
  margin-bottom: 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px;
}

.header-left {
  flex: 1;
}

.page-title {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  line-height: 1.2;
}

.page-subtitle {
  margin: 0;
  font-size: 14px;
  color: #909399;
  line-height: 1.4;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.header-tabs {
  padding: 0 24px;
  border-top: 1px solid #f0f2f5;
}

.header-tabs :deep(.el-tabs__header) {
  margin: 0;
}

.header-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}
</style>