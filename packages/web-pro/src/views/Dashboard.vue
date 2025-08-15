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
          @change="loadDashboard"
          style="width: 200px"
        >
          <el-option
            v-for="dashboard in dashboards"
            :key="dashboard.id"
            :label="dashboard.name"
            :value="dashboard.id"
          />
        </el-select>
        <el-button @click="refreshDashboard" :loading="loading" style="margin-left: 10px">
          刷新
        </el-button>
      </div>

      <!-- 仪表板内容 -->
      <div v-if="currentDashboard" class="dashboard-grid">
        <div
          v-for="widget in currentDashboard.widgets"
          :key="widget.id"
          :class="`widget widget-${widget.type}`"
          :style="getWidgetStyle(widget)"
        >
          <div class="widget-header">
            <h3>{{ widget.title }}</h3>
            <el-dropdown @command="handleWidgetAction">
              <el-button text>
                <el-icon><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="{ action: 'edit', widget }">
                    编辑
                  </el-dropdown-item>
                  <el-dropdown-item :command="{ action: 'duplicate', widget }">
                    复制
                  </el-dropdown-item>
                  <el-dropdown-item :command="{ action: 'delete', widget }" divided>
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
          <div class="widget-content">
            <component :is="getWidgetComponent(widget.type)" :config="widget.config" :data="widget.data" />
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <el-empty v-else description="请选择或创建一个仪表板" />
    </div>

    <!-- 创建仪表板对话框 -->
    <el-dialog v-model="showCreateDashboardDialog" title="创建仪表板" width="500px">
      <el-form :model="newDashboard" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="newDashboard.name" placeholder="请输入仪表板名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="newDashboard.description"
            type="textarea"
            placeholder="请输入仪表板描述"
            :rows="3"
          />
        </el-form-item>
        <el-form-item label="模板">
          <el-select v-model="newDashboard.template" placeholder="选择模板">
            <el-option label="空白仪表板" value="blank" />
            <el-option label="API性能监控" value="api-performance" />
            <el-option label="用户行为分析" value="user-behavior" />
            <el-option label="系统资源监控" value="system-resources" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDashboardDialog = false">取消</el-button>
        <el-button type="primary" @click="createDashboard">创建</el-button>
      </template>
    </el-dialog>

    <!-- 模板库对话框 -->
    <el-dialog v-model="showTemplateDialog" title="仪表板模板库" width="800px">
      <div class="template-grid">
        <div
          v-for="template in templates"
          :key="template.id"
          class="template-card"
          @click="useTemplate(template)"
        >
          <div class="template-preview">
            <img :src="template.preview" :alt="template.name" />
          </div>
          <div class="template-info">
            <h4>{{ template.name }}</h4>
            <p>{{ template.description }}</p>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { MoreFilled } from '@element-plus/icons-vue'
import type { Dashboard, Widget, DashboardTemplate } from '@/types'

// 响应式数据
const loading = ref(false)
const selectedDashboardId = ref<string>('')
const dashboards = ref<Dashboard[]>([])
const currentDashboard = computed(() => 
  dashboards.value.find(d => d.id === selectedDashboardId.value)
)

// 对话框状态
const showCreateDashboardDialog = ref(false)
const showTemplateDialog = ref(false)

// 新建仪表板表单
const newDashboard = ref({
  name: '',
  description: '',
  template: 'blank'
})

// 模板数据
const templates = ref<DashboardTemplate[]>([
  {
    id: 'api-performance',
    name: 'API性能监控',
    description: '监控API响应时间、错误率等关键指标',
    preview: '/images/templates/api-performance.png',
    category: 'monitoring',
    isOfficial: true,
    widgets: []
  },
  {
    id: 'user-behavior',
    name: '用户行为分析',
    description: '分析用户访问模式和行为轨迹',
    preview: '/images/templates/user-behavior.png',
    category: 'analytics',
    isOfficial: true,
    widgets: []
  }
])

// 方法
const loadDashboard = async () => {
  if (!selectedDashboardId.value) return
  
  loading.value = true
  try {
    // 模拟加载仪表板数据
    await new Promise(resolve => setTimeout(resolve, 1000))
    ElMessage.success('仪表板加载成功')
  } catch (error) {
    ElMessage.error('加载仪表板失败')
  } finally {
    loading.value = false
  }
}

const refreshDashboard = async () => {
  await loadDashboard()
}

const createDashboard = async () => {
  if (!newDashboard.value.name) {
    ElMessage.warning('请输入仪表板名称')
    return
  }
  
  try {
    const dashboard: Dashboard = {
      id: Date.now().toString(),
      name: newDashboard.value.name,
      description: newDashboard.value.description,
      widgets: [],
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    dashboards.value.push(dashboard)
    selectedDashboardId.value = dashboard.id
    showCreateDashboardDialog.value = false
    
    // 重置表单
    newDashboard.value = {
      name: '',
      description: '',
      template: 'blank'
    }
    
    ElMessage.success('仪表板创建成功')
  } catch (error) {
    ElMessage.error('创建仪表板失败')
  }
}

const exportDashboard = () => {
  if (!currentDashboard.value) {
    ElMessage.warning('请先选择一个仪表板')
    return
  }
  
  const data = JSON.stringify(currentDashboard.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `${currentDashboard.value.name}.json`
  a.click()
  
  URL.revokeObjectURL(url)
  ElMessage.success('仪表板导出成功')
}

const useTemplate = (template: DashboardTemplate) => {
  newDashboard.value.template = template.id
  showTemplateDialog.value = false
  showCreateDashboardDialog.value = true
}

const handleWidgetAction = ({ action }: { action: string; widget: Widget }) => {
  switch (action) {
    case 'edit':
      // 编辑组件逻辑
      break
    case 'duplicate':
      // 复制组件逻辑
      break
    case 'delete':
      // 删除组件逻辑
      break
  }
}

const getWidgetStyle = (widget: Widget) => {
  return {
    gridColumn: `span ${widget.width || 1}`,
    gridRow: `span ${widget.height || 1}`
  }
}

const getWidgetComponent = (_type: string) => {
  // 根据类型返回对应的组件
  return 'div'
}

// 生命周期
onMounted(() => {
  // 初始化数据
  dashboards.value = [
    {
      id: '1',
      name: '默认仪表板',
      description: '系统默认仪表板',
      widgets: [],
      isPublic: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
  selectedDashboardId.value = '1'
})
</script>

<style scoped>
.dashboard-page {
  padding: 20px;
}

.dashboard-content {
  margin-top: 20px;
}

.dashboard-selector {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.widget {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.widget-header {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.widget-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.widget-content {
  padding: 16px;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.template-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
}

.template-card:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.template-preview {
  height: 120px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.template-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: cover;
}

.template-info {
  padding: 12px;
}

.template-info h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 500;
}

.template-info p {
  margin: 0;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}
</style>