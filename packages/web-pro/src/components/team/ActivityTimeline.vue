<template>
  <div class="activity-timeline">
    <div class="timeline-header">
      <div class="filters">
        <el-select v-model="activityFilter" placeholder="活动类型" size="small" style="width: 120px">
          <el-option label="全部" value="" />
          <el-option label="成员" value="member" />
          <el-option label="权限" value="permission" />
          <el-option label="项目" value="project" />
          <el-option label="设置" value="setting" />
        </el-select>
        
        <el-select v-model="timeFilter" placeholder="时间范围" size="small" style="width: 120px">
          <el-option label="今天" value="today" />
          <el-option label="本周" value="week" />
          <el-option label="本月" value="month" />
          <el-option label="全部" value="all" />
        </el-select>
        
        <el-input
          v-model="searchText"
          placeholder="搜索活动"
          size="small"
          style="width: 200px"
          :prefix-icon="Search"
          clearable
        />
      </div>
      
      <div class="actions">
        <el-button @click="exportActivities" size="small">
          导出日志
        </el-button>
        <el-button @click="refreshActivities" :loading="loading" size="small">
          刷新
        </el-button>
      </div>
    </div>
    
    <div class="timeline-content" v-loading="loading">
      <el-empty v-if="filteredActivities.length === 0" description="暂无活动记录" />
      
      <div v-else class="timeline-list">
        <div 
          v-for="(group, date) in groupedActivities" 
          :key="date"
          class="timeline-group"
        >
          <div class="date-header">
            <span class="date-text">{{ formatDate(date) }}</span>
            <div class="date-line"></div>
          </div>
          
          <div class="activities-list">
            <div 
              v-for="activity in group" 
              :key="activity.id"
              class="activity-item"
              :class="`activity-${activity.type}`"
            >
              <div class="activity-icon">
                <el-icon :class="getActivityIconClass(activity.type)">
                  <component :is="getActivityIcon(activity.type)" />
                </el-icon>
              </div>
              
              <div class="activity-content">
                <div class="activity-header">
                  <span class="activity-title">{{ activity.title }}</span>
                  <span class="activity-time">{{ formatTime(activity.timestamp) }}</span>
                </div>
                
                <div class="activity-description">
                  {{ activity.description }}
                </div>
                
                <div class="activity-meta">
                  <div class="actor-info">
                    <el-avatar :src="activity.userAvatar" :size="20">
                      {{ activity.userName?.charAt(0) || 'U' }}
                    </el-avatar>
                    <span class="actor-name">{{ activity.userName || '未知用户' }}</span>
                  </div>
                  
                  <div class="activity-tags" v-if="activity.metadata?.tags">
                    <el-tag 
                      v-for="tag in activity.metadata.tags" 
                      :key="tag"
                      size="small"
                      type="info"
                    >
                      {{ tag }}
                    </el-tag>
                  </div>
                </div>
                
                <div v-if="activity.metadata" class="activity-details">
                  <el-collapse>
                    <el-collapse-item title="查看详情" name="details">
                      <pre>{{ JSON.stringify(activity.metadata, null, 2) }}</pre>
                    </el-collapse-item>
                  </el-collapse>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="timeline-footer" v-if="hasMore">
      <el-button @click="loadMore" :loading="loadingMore" type="text">
        加载更多
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Search, 
  User, 
  Setting, 
  Document, 
  Key, 
  Plus, 
  Delete,
  Edit,
  Share
} from '@element-plus/icons-vue'
import type { TeamActivity } from '@/types'
import { formatDate, formatTime } from '@/utils/formatter'

interface Props {
  activities: TeamActivity[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const emit = defineEmits<{
  'load-more': []
  'refresh': []
  'export': [activities: TeamActivity[]]
}>()

const activityFilter = ref('')
const timeFilter = ref('all')
const searchText = ref('')
const loadingMore = ref(false)
const hasMore = ref(true)

// 过滤活动
const filteredActivities = computed(() => {
  let filtered = props.activities
  
  // 按类型过滤
  if (activityFilter.value) {
    filtered = filtered.filter(activity => activity.type === activityFilter.value)
  }
  
  // 按时间过滤
  if (timeFilter.value !== 'all') {
    const now = new Date()
    const filterDate = new Date()
    
    switch (timeFilter.value) {
      case 'today':
        filterDate.setHours(0, 0, 0, 0)
        break
      case 'week':
        filterDate.setDate(now.getDate() - 7)
        break
      case 'month':
        filterDate.setMonth(now.getMonth() - 1)
        break
    }
    
    filtered = filtered.filter(activity => 
      new Date(activity.timestamp) >= filterDate
    )
  }
  
  // 按搜索文本过滤
  if (searchText.value) {
    const search = searchText.value.toLowerCase()
    filtered = filtered.filter(activity => 
      activity.title.toLowerCase().includes(search) ||
      activity.description.toLowerCase().includes(search) ||
      (activity.userName || '').toLowerCase().includes(search)
    )
  }
  
  return filtered.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
})

// 按日期分组活动
const groupedActivities = computed(() => {
  const groups: Record<string, TeamActivity[]> = {}
  
  filteredActivities.value.forEach(activity => {
    const date = new Date(activity.timestamp).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(activity)
  })
  
  return groups
})

// 获取活动图标
const getActivityIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    member: User,
    permission: Key,
    project: Document,
    setting: Setting,
    create: Plus,
    update: Edit,
    delete: Delete,
    share: Share
  }
  return iconMap[type] || Document
}

// 获取活动图标样式类
const getActivityIconClass = (type: string) => {
  const classMap: Record<string, string> = {
    member: 'icon-member',
    permission: 'icon-permission',
    project: 'icon-project',
    setting: 'icon-setting',
    create: 'icon-create',
    update: 'icon-update',
    delete: 'icon-delete',
    share: 'icon-share'
  }
  return classMap[type] || 'icon-default'
}

// 加载更多
const loadMore = async () => {
  loadingMore.value = true
  try {
    emit('load-more')
  } finally {
    loadingMore.value = false
  }
}

// 刷新活动
const refreshActivities = () => {
  emit('refresh')
}

// 导出活动
const exportActivities = () => {
  emit('export', filteredActivities.value)
  ElMessage.success('活动日志导出成功')
}

onMounted(() => {
  // 初始化时可以加载数据
})
</script>

<style lang="scss" scoped>
.activity-timeline {
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.timeline-header {
  padding: 16px;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fafafa;
}

.filters {
  display: flex;
  gap: 12px;
  align-items: center;
}

.actions {
  display: flex;
  gap: 8px;
}

.timeline-content {
  max-height: 600px;
  overflow-y: auto;
}

.timeline-group {
  margin-bottom: 24px;
}

.date-header {
  display: flex;
  align-items: center;
  margin: 16px 0 12px 0;
  padding: 0 16px;
}

.date-text {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  background: white;
  padding-right: 12px;
}

.date-line {
  flex: 1;
  height: 1px;
  background: #e4e7ed;
}

.activities-list {
  padding: 0 16px;
}

.activity-item {
  display: flex;
  margin-bottom: 16px;
  position: relative;
  
  &:not(:last-child)::after {
    content: '';
    position: absolute;
    left: 15px;
    top: 40px;
    bottom: -16px;
    width: 2px;
    background: #e4e7ed;
  }
}

.activity-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  
  .el-icon {
    font-size: 16px;
  }
  
  &.icon-member {
    background: #e1f3d8;
    color: #67c23a;
  }
  
  &.icon-permission {
    background: #fdf6ec;
    color: #e6a23c;
  }
  
  &.icon-project {
    background: #ecf5ff;
    color: #409eff;
  }
  
  &.icon-setting {
    background: #f4f4f5;
    color: #909399;
  }
  
  &.icon-create {
    background: #e1f3d8;
    color: #67c23a;
  }
  
  &.icon-update {
    background: #ecf5ff;
    color: #409eff;
  }
  
  &.icon-delete {
    background: #fef0f0;
    color: #f56c6c;
  }
  
  &.icon-share {
    background: #f4f4f5;
    color: #909399;
  }
  
  &.icon-default {
    background: #f4f4f5;
    color: #909399;
  }
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.activity-title {
  font-weight: 500;
  color: #303133;
  font-size: 14px;
}

.activity-time {
  font-size: 12px;
  color: #909399;
}

.activity-description {
  color: #606266;
  font-size: 13px;
  line-height: 1.4;
  margin-bottom: 8px;
}

.activity-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.actor-info {
  display: flex;
  align-items: center;
  gap: 6px;
}

.actor-name {
  font-size: 12px;
  color: #606266;
}

.activity-tags {
  display: flex;
  gap: 4px;
}

.activity-details {
  margin-top: 8px;
  
  pre {
    background: #f5f7fa;
    padding: 8px;
    border-radius: 4px;
    font-size: 12px;
    color: #606266;
    max-height: 200px;
    overflow-y: auto;
  }
}

.timeline-footer {
  padding: 16px;
  text-align: center;
  border-top: 1px solid #e4e7ed;
}

@media (max-width: 768px) {
  .timeline-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .filters {
    flex-wrap: wrap;
  }
  
  .activity-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>