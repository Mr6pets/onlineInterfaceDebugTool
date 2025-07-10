<template>
  <el-dialog 
    v-model="visible"
    title="全局搜索"
    width="700px"
    :show-close="false"
    class="global-search-dialog"
  >
    <div class="global-search">
      <el-input 
        v-model="searchText"
        placeholder="搜索API、文档、测试用例..."
        size="large"
        ref="searchInput"
        @input="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      
      <div class="search-results" v-if="searchText">
        <div class="result-section" v-for="section in searchResults" :key="section.type">
          <div class="section-title">{{ section.title }}</div>
          <div class="result-list">
            <div 
              v-for="item in section.items" 
              :key="item.id"
              class="result-item"
              @click="selectResult(item)"
            >
              <div class="result-icon">
                <el-icon><component :is="item.icon" /></el-icon>
              </div>
              <div class="result-content">
                <div class="result-title">{{ item.title }}</div>
                <div class="result-description">{{ item.description }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="search-empty" v-if="searchText && searchResults.length === 0">
        <el-empty description="未找到相关结果" />
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'

interface SearchResult {
  id: string
  title: string
  description: string
  icon: string
  type: string
  action: () => void
}

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const router = useRouter()
const searchText = ref('')
const searchInput = ref()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 模拟搜索数据
const allResults: SearchResult[] = [
  {
    id: 'api-1',
    title: 'GET /api/users',
    description: '获取用户列表',
    icon: 'Connection',
    type: 'api',
    action: () => console.log('Navigate to API')
  },
  {
    id: 'doc-1',
    title: '用户管理API文档',
    description: '用户相关接口的详细文档',
    icon: 'Document',
    type: 'documentation',
    action: () => router.push('/documentation')
  },
  {
    id: 'test-1',
    title: '用户登录测试用例',
    description: '测试用户登录功能的自动化用例',
    icon: 'MagicStick',
    type: 'test',
    action: () => router.push('/automation')
  }
]

const searchResults = ref<{ type: string; title: string; items: SearchResult[] }[]>([])

const handleSearch = () => {
  if (!searchText.value.trim()) {
    searchResults.value = []
    return
  }
  
  const filtered = allResults.filter(item => 
    item.title.toLowerCase().includes(searchText.value.toLowerCase()) ||
    item.description.toLowerCase().includes(searchText.value.toLowerCase())
  )
  
  const grouped = filtered.reduce((acc, item) => {
    const existing = acc.find(group => group.type === item.type)
    if (existing) {
      existing.items.push(item)
    } else {
      acc.push({
        type: item.type,
        title: getTypeTitle(item.type),
        items: [item]
      })
    }
    return acc
  }, [] as { type: string; title: string; items: SearchResult[] }[])
  
  searchResults.value = grouped
}

const getTypeTitle = (type: string) => {
  const titles: Record<string, string> = {
    api: 'API接口',
    documentation: '文档',
    test: '测试用例'
  }
  return titles[type] || type
}

const selectResult = (item: SearchResult) => {
  item.action()
  visible.value = false
  searchText.value = ''
}

watch(visible, async (newValue) => {
  if (newValue) {
    await nextTick()
    searchInput.value?.focus()
  } else {
    searchText.value = ''
    searchResults.value = []
  }
})
</script>

<style scoped>
.global-search {
  padding: 0;
}

.search-results {
  max-height: 500px;
  overflow-y: auto;
  margin-top: 20px;
}

.result-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 10px;
  padding-left: 5px;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.result-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  cursor: pointer;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.result-item:hover {
  background-color: #f5f7fa;
}

.result-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #409eff;
  color: white;
  border-radius: 6px;
  margin-right: 12px;
}

.result-content {
  flex: 1;
}

.result-title {
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.result-description {
  font-size: 12px;
  color: #909399;
}

.search-empty {
  margin-top: 40px;
}
</style>