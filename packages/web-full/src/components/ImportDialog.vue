<template>
  <el-dialog
    v-model="visible"
    title="导入数据"
    width="600px"
    @close="handleClose"
  >
    <div class="import-container">
      <el-tabs v-model="activeTab" class="import-tabs">
        <!-- 文件导入 -->
        <el-tab-pane label="文件导入" name="file">
          <div class="import-section">
            <el-upload
              ref="uploadRef"
              class="upload-demo"
              drag
              :auto-upload="false"
              :on-change="handleFileChange"
              :accept="'.json,.har,.postman_collection.json'"
              :limit="1"
            >
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">
                将文件拖到此处，或<em>点击上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  支持 JSON、HAR、Postman Collection 格式文件
                </div>
              </template>
            </el-upload>
            
            <div v-if="fileContent" class="file-preview">
              <h4>文件预览</h4>
              <el-scrollbar height="200px">
                <pre class="preview-content">{{ filePreview }}</pre>
              </el-scrollbar>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- URL导入 -->
        <el-tab-pane label="URL导入" name="url">
          <div class="import-section">
            <el-form :model="urlForm" label-width="80px">
              <el-form-item label="URL地址">
                <el-input
                  v-model="urlForm.url"
                  placeholder="https://api.example.com/collection.json"
                  clearable
                />
              </el-form-item>
              
              <el-form-item label="请求头">
                <div class="headers-container">
                  <div
                    v-for="(header, index) in urlForm.headers"
                    :key="index"
                    class="header-row"
                  >
                    <el-input
                      v-model="header.key"
                      placeholder="Header名称"
                      style="margin-right: 8px;"
                    />
                    <el-input
                      v-model="header.value"
                      placeholder="Header值"
                      style="margin-right: 8px;"
                    />
                    <el-button
                      type="danger"
                      size="small"
                      @click="removeHeader(index)"
                    >
                      删除
                    </el-button>
                  </div>
                  <el-button
                    type="primary"
                    size="small"
                    @click="addHeader"
                  >
                    添加Header
                  </el-button>
                </div>
              </el-form-item>
              
              <el-form-item>
                <el-button
                  type="primary"
                  @click="fetchFromUrl"
                  :loading="urlLoading"
                >
                  获取数据
                </el-button>
              </el-form-item>
            </el-form>
            
            <div v-if="urlContent" class="url-preview">
              <h4>获取的数据预览</h4>
              <el-scrollbar height="200px">
                <pre class="preview-content">{{ urlPreview }}</pre>
              </el-scrollbar>
            </div>
          </div>
        </el-tab-pane>
        
        <!-- 文本导入 -->
        <el-tab-pane label="文本导入" name="text">
          <div class="import-section">
            <el-form label-width="80px">
              <el-form-item label="数据格式">
                <el-radio-group v-model="textFormat">
                  <el-radio label="json">JSON</el-radio>
                  <el-radio label="yaml">YAML</el-radio>
                  <el-radio label="xml">XML</el-radio>
                </el-radio-group>
              </el-form-item>
              
              <el-form-item label="数据内容">
                <el-input
                  v-model="textContent"
                  type="textarea"
                  :rows="10"
                  placeholder="请粘贴要导入的数据内容"
                />
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>
      
      <!-- 导入选项 -->
      <div class="import-options">
        <h4>导入选项</h4>
        <el-checkbox v-model="importOptions.mergeCollections">
          合并到现有集合
        </el-checkbox>
        <el-checkbox v-model="importOptions.overwriteExisting">
          覆盖同名项目
        </el-checkbox>
        <el-checkbox v-model="importOptions.importEnvironments">
          导入环境变量
        </el-checkbox>
      </div>
    </div>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          type="primary"
          @click="handleImport"
          :loading="importing"
          :disabled="!hasValidData"
        >
          导入
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage, type UploadFile } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'import', data: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const uploadRef = ref()
const activeTab = ref('file')
const importing = ref(false)
const urlLoading = ref(false)
const textFormat = ref('json')
const textContent = ref('')
const fileContent = ref('')
const urlContent = ref('')

const urlForm = ref({
  url: '',
  headers: [{ key: '', value: '' }]
})

const importOptions = ref({
  mergeCollections: false,
  overwriteExisting: false,
  importEnvironments: true
})

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const filePreview = computed(() => {
  if (!fileContent.value) return ''
  try {
    const parsed = JSON.parse(fileContent.value)
    return JSON.stringify(parsed, null, 2).slice(0, 1000) + '...'
  } catch {
    return fileContent.value.slice(0, 1000) + '...'
  }
})

const urlPreview = computed(() => {
  if (!urlContent.value) return ''
  try {
    const parsed = JSON.parse(urlContent.value)
    return JSON.stringify(parsed, null, 2).slice(0, 1000) + '...'
  } catch {
    return urlContent.value.slice(0, 1000) + '...'
  }
})

const hasValidData = computed(() => {
  return !!(fileContent.value || urlContent.value || textContent.value)
})

watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    resetForm()
  }
})

const resetForm = () => {
  activeTab.value = 'file'
  fileContent.value = ''
  urlContent.value = ''
  textContent.value = ''
  textFormat.value = 'json'
  urlForm.value = {
    url: '',
    headers: [{ key: '', value: '' }]
  }
  importOptions.value = {
    mergeCollections: false,
    overwriteExisting: false,
    importEnvironments: true
  }
  uploadRef.value?.clearFiles()
}

const handleFileChange = (file: UploadFile) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    fileContent.value = e.target?.result as string
  }
  reader.readAsText(file.raw!)
}

const addHeader = () => {
  urlForm.value.headers.push({ key: '', value: '' })
}

const removeHeader = (index: number) => {
  if (urlForm.value.headers.length > 1) {
    urlForm.value.headers.splice(index, 1)
  }
}

const fetchFromUrl = async () => {
  if (!urlForm.value.url) {
    ElMessage.warning('请输入URL地址')
    return
  }
  
  urlLoading.value = true
  try {
    const headers: Record<string, string> = {}
    urlForm.value.headers.forEach(header => {
      if (header.key && header.value) {
        headers[header.key] = header.value
      }
    })
    
    const response = await fetch(urlForm.value.url, { headers })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    urlContent.value = await response.text()
    ElMessage.success('数据获取成功')
  } catch (error) {
    ElMessage.error(`获取数据失败: ${error}`)
  } finally {
    urlLoading.value = false
  }
}

const parseImportData = (content: string, format: string = 'json') => {
  try {
    switch (format) {
      case 'json':
        return JSON.parse(content)
      case 'yaml':
        // 简单的YAML解析，实际项目中应使用专门的YAML库
        ElMessage.warning('YAML格式暂不支持，请转换为JSON格式')
        return null
      case 'xml':
        ElMessage.warning('XML格式暂不支持，请转换为JSON格式')
        return null
      default:
        return JSON.parse(content)
    }
  } catch (error) {
    ElMessage.error('数据格式解析失败，请检查数据格式')
    return null
  }
}

const handleImport = async () => {
  let content = ''
  let format = 'json'
  
  if (activeTab.value === 'file' && fileContent.value) {
    content = fileContent.value
  } else if (activeTab.value === 'url' && urlContent.value) {
    content = urlContent.value
  } else if (activeTab.value === 'text' && textContent.value) {
    content = textContent.value
    format = textFormat.value
  } else {
    ElMessage.warning('请选择要导入的数据')
    return
  }
  
  importing.value = true
  try {
    const parsedData = parseImportData(content, format)
    if (!parsedData) {
      return
    }
    
    const importData = {
      data: parsedData,
      options: importOptions.value
    }
    
    emit('import', importData)
    visible.value = false
    ElMessage.success('导入成功')
  } catch (error) {
    ElMessage.error(`导入失败: ${error}`)
  } finally {
    importing.value = false
  }
}

const handleClose = () => {
  visible.value = false
  resetForm()
}
</script>

<style lang="scss" scoped>
.import-container {
  .import-tabs {
    margin-bottom: 20px;
  }
  
  .import-section {
    min-height: 300px;
    
    .upload-demo {
      margin-bottom: 20px;
    }
    
    .file-preview,
    .url-preview {
      margin-top: 20px;
      
      h4 {
        margin: 0 0 10px 0;
        font-size: 14px;
        color: #303133;
      }
      
      .preview-content {
        background: #f5f7fa;
        padding: 12px;
        border-radius: 4px;
        font-size: 12px;
        line-height: 1.4;
        color: #606266;
        white-space: pre-wrap;
        word-break: break-all;
      }
    }
    
    .headers-container {
      .header-row {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
      }
    }
  }
  
  .import-options {
    border-top: 1px solid #e4e7ed;
    padding-top: 20px;
    
    h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: #303133;
    }
    
    .el-checkbox {
      display: block;
      margin-bottom: 8px;
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>