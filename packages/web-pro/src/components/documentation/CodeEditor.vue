<template>
  <div class="code-editor">
    <div class="editor-header" v-if="showHeader">
      <div class="language-selector">
        <el-select v-model="currentLanguage" size="small" @change="handleLanguageChange">
          <el-option
            v-for="lang in supportedLanguages"
            :key="lang.value"
            :label="lang.label"
            :value="lang.value"
          />
        </el-select>
      </div>
      
      <div class="editor-actions">
        <el-button @click="copyCode" size="small" text>
          <el-icon><DocumentCopy /></el-icon>
          复制
        </el-button>
        <el-button @click="formatCode" size="small" text v-if="canFormat">
          <el-icon><MagicStick /></el-icon>
          格式化
        </el-button>
        <el-button @click="toggleFullscreen" size="small" text>
          <el-icon><FullScreen /></el-icon>
          全屏
        </el-button>
      </div>
    </div>
    
    <div 
      ref="editorContainer" 
      class="editor-container"
      :style="{ height: editorHeight }"
    >
      <textarea
        ref="textarea"
        v-model="code"
        class="code-textarea"
        :placeholder="placeholder"
        @input="handleInput"
        @keydown="handleKeydown"
        @scroll="handleScroll"
      />
      
      <!-- 行号 -->
      <div class="line-numbers" v-if="showLineNumbers">
        <div
          v-for="n in lineCount"
          :key="n"
          class="line-number"
        >
          {{ n }}
        </div>
      </div>
      
      <!-- 语法高亮层 -->
      <div class="syntax-highlight" v-html="highlightedCode"></div>
    </div>
    
    <!-- 全屏模态框 -->
    <el-dialog
      v-model="fullscreenVisible"
      title="代码编辑器"
      width="90%"
      :show-close="true"
      @close="fullscreenVisible = false"
    >
      <div class="fullscreen-editor">
        <CodeEditor
          v-model="code"
          :language="currentLanguage"
          :height="'60vh'"
          :show-header="false"
          @change="handleChange"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  DocumentCopy,
  MagicStick,
  FullScreen
} from '@element-plus/icons-vue'

interface Props {
  modelValue: string
  language?: string
  height?: string
  placeholder?: string
  showHeader?: boolean
  showLineNumbers?: boolean
  readonly?: boolean
}

interface Emits {
  'update:modelValue': [value: string]
  change: [value: string]
}

const props = withDefaults(defineProps<Props>(), {
  language: 'javascript',
  height: '300px',
  placeholder: '请输入代码...',
  showHeader: true,
  showLineNumbers: true,
  readonly: false
})

const emit = defineEmits<Emits>()

const textarea = ref<HTMLTextAreaElement>()
const editorContainer = ref<HTMLDivElement>()
const fullscreenVisible = ref(false)
const currentLanguage = ref(props.language)

const supportedLanguages = [
  { label: 'JavaScript', value: 'javascript' },
  { label: 'JSON', value: 'json' },
  { label: 'HTML', value: 'html' },
  { label: 'CSS', value: 'css' },
  { label: 'Python', value: 'python' },
  { label: 'Java', value: 'java' },
  { label: 'C#', value: 'csharp' },
  { label: 'PHP', value: 'php' },
  { label: 'Go', value: 'go' },
  { label: 'Rust', value: 'rust' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'XML', value: 'xml' },
  { label: 'YAML', value: 'yaml' },
  { label: 'Shell', value: 'shell' },
  { label: 'SQL', value: 'sql' }
]

const code = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value)
    emit('change', value)
  }
})

const editorHeight = computed(() => {
  if (props.showHeader) {
    const height = parseInt(props.height.replace('px', ''))
    return `${height - 40}px`
  }
  return props.height
})

const lineCount = computed(() => {
  return code.value.split('\n').length
})

const canFormat = computed(() => {
  return ['javascript', 'json', 'html', 'css', 'typescript'].includes(currentLanguage.value)
})

const highlightedCode = computed(() => {
  // 简单的语法高亮实现
  let highlighted = code.value
  
  if (currentLanguage.value === 'json') {
    // JSON语法高亮
    highlighted = highlighted
      .replace(/"([^"]+)":/g, '<span class="json-key">"$1":</span>')
      .replace(/: "([^"]*)"/g, ': <span class="json-string">"$1"</span>')
      .replace(/: (\d+)/g, ': <span class="json-number">$1</span>')
      .replace(/: (true|false|null)/g, ': <span class="json-boolean">$1</span>')
  } else if (currentLanguage.value === 'javascript' || currentLanguage.value === 'typescript') {
    // JavaScript/TypeScript语法高亮
    highlighted = highlighted
      .replace(/\b(const|let|var|function|class|if|else|for|while|return|import|export|from|default)\b/g, '<span class="js-keyword">$1</span>')
      .replace(/\/\*[\s\S]*?\*\//g, '<span class="js-comment">$&</span>')
      .replace(/\/\/.*$/gm, '<span class="js-comment">$&</span>')
      .replace(/"([^"]*)"/g, '<span class="js-string">"$1"</span>')
      .replace(/'([^']*)'/g, '<span class="js-string">\"$1\"</span>')
  }
  
  return highlighted.replace(/\n/g, '<br>')
})

watch(
  () => props.language,
  (newLang) => {
    currentLanguage.value = newLang
  }
)

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  code.value = target.value
}

const handleChange = (value: string) => {
  code.value = value
}

const handleLanguageChange = (language: string) => {
  currentLanguage.value = language
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Tab') {
    event.preventDefault()
    const target = event.target as HTMLTextAreaElement
    const start = target.selectionStart
    const end = target.selectionEnd
    
    // 插入制表符
    const newValue = code.value.substring(0, start) + '  ' + code.value.substring(end)
    code.value = newValue
    
    nextTick(() => {
      target.selectionStart = target.selectionEnd = start + 2
    })
  }
}

const handleScroll = () => {
  // 同步滚动行号和语法高亮
  if (textarea.value && editorContainer.value) {
    const lineNumbers = editorContainer.value.querySelector('.line-numbers')
    const syntaxHighlight = editorContainer.value.querySelector('.syntax-highlight')
    
    if (lineNumbers) {
      lineNumbers.scrollTop = textarea.value.scrollTop
    }
    if (syntaxHighlight) {
      syntaxHighlight.scrollTop = textarea.value.scrollTop
    }
  }
}

const copyCode = async () => {
  try {
    await navigator.clipboard.writeText(code.value)
    ElMessage.success('代码已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

const formatCode = () => {
  try {
    if (currentLanguage.value === 'json') {
      const parsed = JSON.parse(code.value)
      code.value = JSON.stringify(parsed, null, 2)
      ElMessage.success('格式化成功')
    } else if (currentLanguage.value === 'javascript' || currentLanguage.value === 'typescript') {
      // 简单的JavaScript格式化
      let formatted = code.value
        .replace(/;/g, ';\n')
        .replace(/{/g, '{\n')
        .replace(/}/g, '\n}')
        .replace(/,/g, ',\n')
      
      // 简单的缩进处理
      const lines = formatted.split('\n')
      let indent = 0
      const indentedLines = lines.map(line => {
        const trimmed = line.trim()
        if (trimmed.includes('}')) indent--
        const indentedLine = '  '.repeat(Math.max(0, indent)) + trimmed
        if (trimmed.includes('{')) indent++
        return indentedLine
      })
      
      code.value = indentedLines.join('\n')
      ElMessage.success('格式化成功')
    }
  } catch (error) {
    ElMessage.error('格式化失败：代码格式不正确')
  }
}

const toggleFullscreen = () => {
  fullscreenVisible.value = true
}

onMounted(() => {
  // 初始化编辑器
  if (textarea.value) {
    textarea.value.focus()
  }
})
</script>

<style lang="scss" scoped>
.code-editor {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
}

.editor-header {
  padding: 8px 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.language-selector {
  width: 120px;
}

.editor-actions {
  display: flex;
  gap: 4px;
}

.editor-container {
  position: relative;
  overflow: hidden;
}

.code-textarea {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  resize: none;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  padding: 12px 12px 12px 60px;
  background: transparent;
  color: transparent;
  caret-color: #333;
  position: relative;
  z-index: 2;
}

.line-numbers {
  position: absolute;
  top: 0;
  left: 0;
  width: 50px;
  height: 100%;
  background: #f8f9fa;
  border-right: 1px solid #e4e7ed;
  padding: 12px 8px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  color: #999;
  text-align: right;
  overflow: hidden;
  z-index: 1;
}

.line-number {
  height: 21px;
}

.syntax-highlight {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  padding: 12px 12px 12px 60px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.5;
  color: #333;
  pointer-events: none;
  overflow: hidden;
  white-space: pre-wrap;
  word-wrap: break-word;
  z-index: 1;
}

.fullscreen-editor {
  height: 60vh;
}

// 语法高亮样式
:deep(.json-key) {
  color: #0066cc;
  font-weight: bold;
}

:deep(.json-string) {
  color: #009900;
}

:deep(.json-number) {
  color: #cc6600;
}

:deep(.json-boolean) {
  color: #cc0066;
  font-weight: bold;
}

:deep(.js-keyword) {
  color: #0066cc;
  font-weight: bold;
}

:deep(.js-comment) {
  color: #999;
  font-style: italic;
}

:deep(.js-string) {
  color: #009900;
}
</style>