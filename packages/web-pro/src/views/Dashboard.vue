<template>
  <div class="dashboard-page">
    <PageHeader title="数据仪表板" subtitle="API性能和使用情况可视化分析">
      <template #actions>
        <el-button @click="showCreateDashboardDialog = true" type="primary" size="small">
          新建仪表板
        </el-button>
        <el-button @click="showTemplateDialog = true" size="small">
          模板库
        </el-button>
        <el-button @click="exportDashboard" size="small">
          导出
        </el-button>
      </template>
    </PageHeader>
    
    <div class="dashboard-content">
      <!-- 仪表板选择器 -->
      <div class="dashboard-selector">
        <el-select
          v-model="selectedDashboardId"
          placeholder="选择仪表板"