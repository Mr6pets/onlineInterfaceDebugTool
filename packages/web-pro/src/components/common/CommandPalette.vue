<template>
  <el-dialog 
    v-model="visible"
    title="命令面板"
    width="600px"
    :show-close="false"
    class="command-palette-dialog"
  >
    <div class="command-palette">
      <el-input 
        v-model="searchText"
        placeholder="输入命令或搜索..."
        size="large"
        ref="searchInput"
        @keydown="handleKeydown"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      
      <div class="command-list">
        <div 
          v-for="(command, index) in filteredCommands" 
          :key="command.id"
          :class="['command-item', { active: index === selectedIndex }]"
          @click="executeCommand(command)"
        >
          <div class="command-icon">
            <el-icon><component :is="command.icon" /></el-icon>
          </div>
          <div class="command-content">
            <div class="command-title">{{ command.title }}</div>
            <div class="command-description">{{ command.description }}</div>
          </div>
          <div class="command-shortcut" v-if="command.shortcut">
            {{ command.shortcut }}
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'

interface Command {
  id: string
  title: string
  description: string
  icon: string
  action: () => void
  shortcut?: string
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
const selectedIndex = ref(0)
const searchInput = ref()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const commands: Command[] = [
  {
    id: 'dashboard',
    title: '仪表板',
    description: '查看系统概览和统计信息',
    icon: 'Odometer',
    action: () => router.push('/dashboard')
  },
  {
    id: 'performance',
    title: '性能监控',
    description: '查看API性能指标和报告',
    icon: 'TrendCharts',
    action: () => router.push('/performance')
  },
  {
    id: 'team',
    title: '团队协作',
    description: '管理团队成员和权限',
    icon: 'UserFilled',
    action: () => router.push('/team')
  },
  {
    id: 'documentation',
    title: 'API文档',
    description: '生成和管理API文档',
    icon: 'Document',
    action: () => router.push('/documentation')
  },
  {
    id: 'automation',
    title: '自动化测试',
    description: '创建和运行自动化测试套件',
    icon: 'MagicStick',
    action: () => router.push('/automation')
  },
  {
    id: 'mock-server',
    title: 'Mock服务器',
    description: '配置和管理Mock API',
    icon: 'Service',
    action: () => router.push('/mock-server')
  }
]

const filteredCommands = computed(() => {
  if (!searchText.value) return commands
  
  return commands.filter(command => 
    command.title.toLowerCase().includes(searchText.value.toLowerCase()) ||
    command.description.toLowerCase().includes(searchText.value.toLowerCase())
  )
})

const handleKeydown = (e: KeyboardEvent) => {
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, filteredCommands.value.length - 1)
      break
    case 'ArrowUp':
      e.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
      break
    case 'Enter':
      e.preventDefault()
      if (filteredCommands.value[selectedIndex.value]) {
        executeCommand(filteredCommands.value[selectedIndex.value])
      }
      break
    case 'Escape':
      visible.value = false
      break
  }
}

const executeCommand = (command: Command) => {
  command.action()
  visible.value = false
  searchText.value = ''
  selectedIndex.value = 0
}

watch(visible, async (newValue) => {
  if (newValue) {
    await nextTick()
    searchInput.value?.focus()
  } else {
    searchText.value = ''
    selectedIndex.value = 0
  }
})

watch(searchText, () => {
  selectedIndex.value = 0
})
</script>

<style scoped>
.command-palette {
  padding: 0;
}

.command-list {
  max-height: 400px;
  overflow-y: auto;
  margin-top: 15px;
}

.command-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  cursor: pointer;
  border-radius: 6px;
  margin-bottom: 2px;
  transition: background-color 0.2s;
}

.command-item:hover,
.command-item.active {
  background-color: #f5f7fa;
}

.command-icon {
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

.command-content {
  flex: 1;
}

.command-title {
  font-weight: 500;
  color: #303133;
  margin-bottom: 2px;
}

.command-description {
  font-size: 12px;
  color: #909399;
}

.command-shortcut {
  font-size: 12px;
  color: #909399;
  background-color: #f0f0f0;
  padding: 2px 6px;
  border-radius: 3px;
}
</style>