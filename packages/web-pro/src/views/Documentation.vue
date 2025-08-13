<template>
  <div class="documentation-page">
    <PageHeader title="API文档" subtitle="自动生成和发布API文档">
      <template #actions>
        <el-button @click="showCreateDialog = true" type="primary" size="small">
          新建文档
        </el-button>
        <el-button @click="importFromCollection" size="small">
          从集合导入
        </el-button>
        <el-button @click="showSettingsDialog = true" size="small">
          文档设置
        </el-button>
      </template>
    </PageHeader>
    
    <div class="documentation-content">
      <!-- 文档列表 -->
      <div class="docs-list">
        <div class="list-header">
          <h3>文档列表</h3>
          <div class="list-actions">
            <el-input
              v-model="searchText"
              placeholder="搜索文档"
              size="small"
              style="width: 200px"
              :prefix-icon="Search"
            />
            <el-select v-model="statusFilter" placeholder="状态" size="small" style="width: 120px">
              <el-option label="全部" value="" />
              <el-option label="已发布" value="published" />
              <el-option label="草稿" value="draft" />
            </el-select>
          </div>
        </div>
        
        <div class="docs-grid">
          <div
            v-for="doc in filteredDocs"
            :key="doc.id"
            class="doc-card"
            @click="selectDoc(doc)"
            :class="{ active: selectedDoc?.id === doc.id }"
          >
            <div class="doc-header">
              <div class="doc-info">
                <h4>{{ doc.name }}</h4>
                <p>{{ doc.description }}</p>
              </div>
              <div class="doc-status">
                <el-tag :type="doc.published ? 'success' : 'info'" size="small">
                  {{ doc.published ? '已发布' : '草稿' }}
                </el-tag>
              </div>
            </div>
            
            <div class="doc-meta">
              <span>版本: {{ doc.version }}</span>
              <span>更新: {{ formatDate(doc.updatedAt) }}</span>
            </div>
            
            <div class="doc-actions">
              <el-button size="small" text @click.stop="previewDoc(doc)">
                预览
              </el-button>
              <el-button size="small" text @click.stop="editDoc(doc)">
                编辑
              </el-button>
              <el-button 
                size="small" 
                text 
                type="primary"
                @click.stop="publishDoc(doc)"
                v-if="!doc.published"
              >
                发布
              </el-button>
              <el-dropdown @command="handleDocAction" trigger="click">
                <el-button size="small" text>
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :command="{ action: 'duplicate', doc }">
                      复制
                    </el-dropdown-item>
                    <el-dropdown-item :command="{ action: 'export', doc }">
                      导出
                    </el-dropdown-item>
                    <el-dropdown-item :command="{ action: 'share', doc }" divided>
                      分享
                    </el-dropdown-item>
                    <el-dropdown-item :command="{ action: 'delete', doc }" class="danger">
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 文档编辑器 -->
      <div class="doc-editor" v-if="selectedDoc">
        <div class="editor-header">
          <div class="editor-tabs">
            <el-tabs v-model="activeTab">
              <el-tab-pane label="基本信息" name="info" />
              <el-tab-pane label="API接口" name="apis" />
              <el-tab-pane label="主题样式" name="theme" />
              <el-tab-pane label="预览" name="preview" />
            </el-tabs>
          </div>
          <div class="editor-actions">
            <el-button @click="saveDoc" type="primary" size="small">
              保存
            </el-button>
            <el-button @click="publishDoc(selectedDoc)" size="small" v-if="!selectedDoc.published">
              发布
            </el-button>
          </div>
        </div>
        
        <div class="editor-content">
          <!-- 基本信息 -->
          <div v-show="activeTab === 'info'" class="info-panel">
            <el-form :model="selectedDoc" label-width="100px">
              <el-form-item label="文档名称">
                <el-input v-model="selectedDoc.name" placeholder="输入文档名称" />
              </el-form-item>
              
              <el-form-item label="描述">
                <el-input
                  v-model="selectedDoc.description"
                  type="textarea"
                  :rows="3"
                  placeholder="输入文档描述"
                />
              </el-form-item>
              
              <el-form-item label="版本">
                <el-input v-model="selectedDoc.version" placeholder="1.0.0" />
              </el-form-item>
              
              <el-form-item label="基础URL">
                <el-input v-model="selectedDoc.baseUrl" placeholder="https://api.example.com" />
              </el-form-item>
              
              <el-form-item label="Logo">
                <el-upload
                  class="logo-uploader"
                  :show-file-list="false"
                  :on-success="handleLogoSuccess"
                  action="/api/upload"
                >
                  <img v-if="selectedDoc.settings?.logo" :src="selectedDoc.settings.logo" class="logo" />
                  <el-icon v-else class="logo-uploader-icon"><Plus /></el-icon>
                </el-upload>
              </el-form-item>
              
              <el-form-item label="联系信息">
                <div class="contact-form">
                  <el-input v-model="selectedDoc.settings.contact.name" placeholder="联系人" />
                  <el-input v-model="selectedDoc.settings.contact.email" placeholder="邮箱" />
                  <el-input v-model="selectedDoc.settings.contact.url" placeholder="网站" />
                </div>
              </el-form-item>
              
              <el-form-item label="许可证">
                <div class="license-form">
                  <el-input v-model="selectedDoc.settings.license.name" placeholder="许可证名称" />
                  <el-input v-model="selectedDoc.settings.license.url" placeholder="许可证URL" />
                </div>
              </el-form-item>
            </el-form>
          </div>
          
          <!-- API接口 -->
          <div v-show="activeTab === 'apis'" class="apis-panel">
            <div class="apis-toolbar">
              <el-button @click="addApiGroup" size="small">
                添加分组
              </el-button>
              <el-button @click="importFromCollections" size="small">
                从集合导入
              </el-button>
              <el-button @click="sortApis" size="small">
                排序
              </el-button>
            </div>
            
            <div class="apis-tree">
              <ApiDocTree
                :data="selectedDoc.sections"
                @add-group="addApiGroup"
                @edit-group="editApiGroup"
                @delete-group="deleteApiGroup"
                @add-api="addApi"
                @edit-api="editApi"
                @delete-api="deleteApi"
              />
            </div>
          </div>
          
          <!-- 主题样式 -->
          <div v-show="activeTab === 'theme'" class="theme-panel">
            <div class="theme-selector">
              <h4>预设主题</h4>
              <div class="theme-options">
                <div
                  v-for="theme in themes"
                  :key="theme.name"
                  class="theme-option"
                  :class="{ active: selectedDoc.theme?.name === theme.name }"
                  @click="updateDocTheme(theme.name)"
                >
                  <div class="theme-preview" :style="theme.preview"></div>
                  <span>{{ theme.label }}</span>
                </div>
              </div>
            </div>
            
            <div class="custom-css" v-if="selectedDoc.theme?.name === 'custom'">
              <h4>自定义CSS</h4>
              <MonacoEditor
                v-model="selectedDoc.theme.customCSS"
                language="css"
                :height="300"
                :options="{ minimap: { enabled: false } }"
              />
            </div>
          </div>
          
          <!-- 预览 -->
          <div v-show="activeTab === 'preview'" class="preview-panel">
            <div class="preview-toolbar">
              <el-button @click="refreshPreview" size="small">
                刷新预览
              </el-button>
              <el-button @click="openInNewTab" size="small">
                新窗口打开
              </el-button>
            </div>
            
            <div class="preview-container">
              <iframe
                ref="previewFrame"
                :src="previewUrl"
                class="preview-iframe"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 创建文档对话框 -->
    <CreateDocDialog
      v-model="showCreateDialog"
      @create="handleCreateDoc"
    />
    
    <!-- 文档设置对话框 -->
    <DocSettingsDialog
      v-model="showSettingsDialog"
      :settings="docSettings"
      @save="handleSaveSettings"
    />
    
    <!-- API编辑对话框 -->
    <ApiEditDialog
      v-model="showApiDialog"
      :api="editingApi"
      @save="handleSaveApi"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, MoreFilled, Plus } from '@element-plus/icons-vue'
import PageHeader from '../components/common/PageHeader.vue'
import ApiDocTree from '../components/documentation/ApiDocTree.vue'
import ApiEditor from '../components/documentation/ApiEditor.vue'
import ThemeCustomizer from '../components/documentation/ThemeCustomizer.vue'
import DocPreview from '../components/documentation/DocPreview.vue'
import CodeEditor from '../components/documentation/CodeEditor.vue'
import { useDocumentationStore } from '../stores/documentation'
import type { ApiDocumentation } from '@/types'

const documentationStore = useDocumentationStore()

const searchText = ref('')
const statusFilter = ref('')
const selectedDoc = ref<ApiDocumentation | null>(null)
const activeTab = ref('info')
const showCreateDialog = ref(false)
const showSettingsDialog = ref(false)
const showApiDialog = ref(false)
const editingApi = ref(null)
const previewFrame = ref()

const docs = computed(() => documentationStore.documentations)
const docSettings = computed(() => documentationStore.settings)
const previewUrl = computed(() => 
  selectedDoc.value ? `/api/docs/${selectedDoc.value.id}/preview` : ''
)

const filteredDocs = computed(() => {
  let filtered = docs.value
  
  if (searchText.value) {
    filtered = filtered.filter(doc => 
      doc.name.toLowerCase().includes(searchText.value.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchText.value.toLowerCase())
    )
  }
  
  if (statusFilter.value) {
    filtered = filtered.filter(doc => 
      statusFilter.value === 'published' ? doc.published : !doc.published
    )
  }
  
  return filtered
})

const themes = [
  {
    name: 'default',
    label: '默认',
    preview: { background: 'linear-gradient(45deg, #409eff, #67c23a)' }
  },
  {
    name: 'dark',
    label: '暗色',
    preview: { background: 'linear-gradient(45deg, #2c3e50, #34495e)' }
  },
  {
    name: 'custom',
    label: '自定义',
    preview: { background: 'linear-gradient(45deg, #e6a23c, #f56c6c)' }
  }
]

onMounted(() => {
  documentationStore.fetchDocumentations()
})

const selectDoc = (doc: ApiDocumentation) => {
  selectedDoc.value = doc
  activeTab.value = 'info'
}

const editDoc = (doc: ApiDocumentation) => {
  selectedDoc.value = doc
  activeTab.value = 'info'
}

const previewDoc = (doc: ApiDocumentation) => {
  window.open(`/docs/${doc.id}`, '_blank')
}

const publishDoc = async (doc: ApiDocumentation) => {
  try {
    await documentationStore.publishDocumentation(doc.id)
    ElMessage.success('文档已发布')
  } catch (error) {
    ElMessage.error('发布失败')
  }
}

const saveDoc = async () => {
  if (!selectedDoc.value) return
  
  try {
    await documentationStore.updateDocumentation(selectedDoc.value.id, selectedDoc.value)
    ElMessage.success('文档已保存')
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const handleDocAction = async ({ action, doc }: { action: string, doc: ApiDocumentation }) => {
  switch (action) {
    case 'duplicate':
      await documentationStore.duplicateDocumentation(doc.id)
      ElMessage.success('文档已复制')
      break
      
    case 'export':
      await documentationStore.exportDocumentation(doc.id)
      ElMessage.success('文档已导出')
      break
      
    case 'share':
      const shareUrl = `${window.location.origin}/docs/${doc.id}`
      await navigator.clipboard.writeText(shareUrl)
      ElMessage.success('分享链接已复制')
      break
      
    case 'delete':
      try {
        await ElMessageBox.confirm('确定要删除这个文档吗？', '确认删除', {
          type: 'warning'
        })
        await documentationStore.deleteDocumentation(doc.id)
        ElMessage.success('文档已删除')
        if (selectedDoc.value?.id === doc.id) {
          selectedDoc.value = null
        }
      } catch {
        // 用户取消
      }
      break
  }
}

const handleCreateDoc = async (docData: any) => {
  try {
    const newDoc = await documentationStore.createDocumentation(docData)
    selectedDoc.value = newDoc
    ElMessage.success('文档已创建')
  } catch (error) {
    ElMessage.error('创建失败')
  }
}

const handleSaveSettings = async (settings: any) => {
  try {
    await documentationStore.updateSettings(settings)
    ElMessage.success('设置已保存')
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const handleLogoSuccess = (response: any) => {
  if (selectedDoc.value && selectedDoc.value.settings) {
    selectedDoc.value.settings.logo = response.url
  }
}

const updateDocTheme = (themeName: string) => {
  if (selectedDoc.value) {
    if (!selectedDoc.value.theme) {
      selectedDoc.value.theme = { name: themeName }
    } else {
      selectedDoc.value.theme.name = themeName
    }
  }
}

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString()
}

const addApiGroup = () => {
  // 添加API分组逻辑
}

const editApiGroup = (group: any) => {
  // 编辑API分组逻辑
}

const deleteApiGroup = (groupId: string) => {
  // 删除API分组逻辑
}

const addApi = () => {
  editingApi.value = null
  showApiDialog.value = true
}

const editApi = (api: any) => {
  editingApi.value = api
  showApiDialog.value = true
}

const deleteApi = (apiId: string) => {
  // 删除API逻辑
}

const handleSaveApi = (apiData: any) => {
  // 保存API逻辑
}

const importFromCollection = () => {
  // 从集合导入逻辑
}

const importFromCollections = () => {
  // 从多个集合导入逻辑
}

const sortApis = () => {
  // API排序逻辑
}

const refreshPreview = () => {
  if (previewFrame.value) {
    previewFrame.value.src = previewFrame.value.src
  }
}

const openInNewTab = () => {
  if (selectedDoc.value) {
    window.open(previewUrl.value, '_blank')
  }
}
</script>

<style lang="scss" scoped>
.documentation-page {
  padding: 24px;
  
  .documentation-content {
    display: flex;
    gap: 24px;
    height: calc(100vh - 200px);
    
    .docs-list {
      width: 350px;
      background: white;
      border-radius: 8px;
      padding: 16px;
      overflow: auto;
      
      .list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        
        h3 {
          margin: 0;
          color: #303133;
        }
        
        .list-actions {
          display: flex;
          gap: 8px;
        }
      }
      
      .docs-grid {
        display: flex;
        flex-direction: column;
        gap: 12px;
        
        .doc-card {
          border: 1px solid #e4e7ed;
          border-radius: 6px;
          padding: 12px;
          cursor: pointer;
          transition: all 0.2s;
          
          &:hover {
            border-color: #409eff;
            box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
          }
          
          &.active {
            border-color: #409eff;
            background-color: #f0f9ff;
          }
          
          .doc-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
            
            .doc-info {
              flex: 1;
              
              h4 {
                margin: 0 0 4px 0;
                color: #303133;
                font-size: 14px;
              }
              
              p {
                margin: 0;
                color: #606266;
                font-size: 12px;
                line-height: 1.4;
              }
            }
          }
          
          .doc-meta {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            color: #909399;
            margin-bottom: 8px;
          }
          
          .doc-actions {
            display: flex;
            justify-content: flex-end;
            gap: 4px;
          }
        }
      }
    }
    
    .doc-editor {
      flex: 1;
      background: white;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      
      .editor-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 24px 0;
        border-bottom: 1px solid #e4e7ed;
        
        .editor-tabs {
          flex: 1;
        }
        
        .editor-actions {
          display: flex;
          gap: 8px;
        }
      }
      
      .editor-content {
        flex: 1;
        padding: 24px;
        overflow: auto;
        
        .info-panel {
          .contact-form,
          .license-form {
            display: flex;
            gap: 8px;
            
            .el-input {
              flex: 1;
            }
          }
          
          .logo-uploader {
            .logo {
              width: 100px;
              height: 100px;
              object-fit: cover;
              border-radius: 4px;
            }
            
            .logo-uploader-icon {
              font-size: 28px;
              color: #8c939d;
              width: 100px;
              height: 100px;
              line-height: 100px;
              text-align: center;
              border: 1px dashed #d9d9d9;
              border-radius: 4px;
            }
          }
        }
        
        .apis-panel {
          .apis-toolbar {
            display: flex;
            gap: 8px;
            margin-bottom: 16px;
          }
          
          .apis-tree {
            border: 1px solid #e4e7ed;
            border-radius: 4px;
            min-height: 400px;
          }
        }
        
        .theme-panel {
          .theme-selector {
            margin-bottom: 24px;
            
            h4 {
              margin: 0 0 12px 0;
              color: #303133;
            }
            
            .theme-options {
              display: flex;
              gap: 16px;
              
              .theme-option {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                padding: 12px;
                border: 1px solid #e4e7ed;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s;
                
                &:hover {
                  border-color: #409eff;
                }
                
                &.active {
                  border-color: #409eff;
                  background-color: #f0f9ff;
                }
                
                .theme-preview {
                  width: 60px;
                  height: 40px;
                  border-radius: 4px;
                }
                
                span {
                  font-size: 12px;
                  color: #606266;
                }
              }
            }
          }
          
          .custom-css {
            h4 {
              margin: 0 0 12px 0;
              color: #303133;
            }
          }
        }
        
        .preview-panel {
          .preview-toolbar {
            display: flex;
            gap: 8px;
            margin-bottom: 16px;
          }
          
          .preview-container {
            border: 1px solid #e4e7ed;
            border-radius: 4px;
            height: 600px;
            
            .preview-iframe {
              width: 100%;
              height: 100%;
              border: none;
              border-radius: 4px;
            }
          }
        }
      }
    }
  }
}

.danger {
  color: #f56c6c !important;
}
</style>