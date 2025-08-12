<template>
  <div class="collection-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <el-icon><FolderOpened /></el-icon>
            API集合管理
          </h1>
          <p class="page-description">管理和组织您的API集合，支持导入导出和团队协作</p>
        </div>
        <div class="header-actions">
          <el-button @click="showCreateDialog = true" type="primary">
            <el-icon><Plus /></el-icon>
            新建集合
          </el-button>
          <el-dropdown @command="handleImportCommand">
            <el-button>
              <el-icon><Upload /></el-icon>
              导入
              <el-icon><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="postman">Postman</el-dropdown-item>
                <el-dropdown-item command="openapi">OpenAPI</el-dropdown-item>
                <el-dropdown-item command="insomnia">Insomnia</el-dropdown-item>
                <el-dropdown-item command="curl">cURL</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon><Folder /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ totalCollections }}</div>
          <div class="stat-label">总集合数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon requests">
          <el-icon><Document /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ totalRequests }}</div>
          <div class="stat-label">总请求数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon shared">
          <el-icon><Share /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ sharedCollections }}</div>
          <div class="stat-label">共享集合</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon recent">
          <el-icon><Clock /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ recentlyUpdated }}</div>
          <div class="stat-label">最近更新</div>
        </div>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="main-content">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="search-section">
          <el-input
            v-model="searchQuery"
            placeholder="搜索集合名称或描述"
            prefix-icon="Search"
            clearable
            style="width: 300px;"
          />
        </div>
        <div class="filter-section">
          <el-select
            v-model="sortBy"
            placeholder="排序方式"
            style="width: 150px;"
          >
            <el-option label="最近更新" value="updatedAt" />
            <el-option label="创建时间" value="createdAt" />
            <el-option label="名称" value="name" />
            <el-option label="请求数量" value="requestCount" />
          </el-select>
          <el-select
            v-model="filterBy"
            placeholder="筛选条件"
            clearable
            style="width: 150px;"
          >
            <el-option label="全部" value="" />
            <el-option label="我的集合" value="mine" />
            <el-option label="共享集合" value="shared" />
            <el-option label="最近使用" value="recent" />
          </el-select>
          <el-button-group>
            <el-button
              :type="viewMode === 'grid' ? 'primary' : 'default'"
              @click="viewMode = 'grid'"
            >
              <el-icon><Grid /></el-icon>
            </el-button>
            <el-button
              :type="viewMode === 'list' ? 'primary' : 'default'"
              @click="viewMode = 'list'"
            >
              <el-icon><List /></el-icon>
            </el-button>
          </el-button-group>
        </div>
      </div>

      <!-- 集合列表 - 网格视图 -->
      <div v-if="viewMode === 'grid'" class="collections-grid">
        <div
          v-for="collection in filteredCollections"
          :key="collection.id"
          class="collection-card"
          @click="openCollection(collection)"
        >
          <div class="card-header">
            <div class="collection-icon">
              <el-icon><Folder /></el-icon>
            </div>
            <el-dropdown @command="(command) => handleCollectionAction(command, collection)" trigger="click">
              <el-button type="text" class="action-btn">
                <el-icon><MoreFilled /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit">编辑</el-dropdown-item>
                  <el-dropdown-item command="duplicate">复制</el-dropdown-item>
                  <el-dropdown-item command="export">导出</el-dropdown-item>
                  <el-dropdown-item command="share">分享</el-dropdown-item>
                  <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
          <div class="card-content">
            <h3 class="collection-name">{{ collection.name }}</h3>
            <p class="collection-description">{{ collection.description || '暂无描述' }}</p>
            <div class="collection-stats">
              <span class="stat-item">
                <el-icon><Document /></el-icon>
                {{ collection.requestCount || 0 }} 个请求
              </span>
              <span class="stat-item">
                <el-icon><User /></el-icon>
                {{ collection.collaborators?.length || 0 }} 个协作者
              </span>
            </div>
          </div>
          <div class="card-footer">
            <div class="collection-tags">
              <el-tag
                v-for="tag in collection.tags?.slice(0, 2)"
                :key="tag"
                size="small"
                type="info"
              >
                {{ tag }}
              </el-tag>
              <span v-if="collection.tags && collection.tags.length > 2" class="more-tags">
                +{{ collection.tags.length - 2 }}
              </span>
            </div>
            <div class="collection-meta">
              <span class="update-time">{{ formatTime(collection.updatedAt) }}</span>
              <el-icon v-if="collection.isShared" class="shared-icon"><Share /></el-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- 集合列表 - 列表视图 -->
      <div v-else class="collections-table">
        <el-table
          :data="filteredCollections"
          style="width: 100%"
          v-loading="loading"
          @row-click="openCollection"
        >
          <el-table-column width="60">
            <template #default>
              <div class="table-icon">
                <el-icon><Folder /></el-icon>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="集合名称" min-width="200">
            <template #default="{ row }">
              <div class="collection-info">
                <div class="collection-name">{{ row.name }}</div>
                <div class="collection-description">{{ row.description || '暂无描述' }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="请求数" width="100">
            <template #default="{ row }">
              {{ row.requestCount || 0 }}
            </template>
          </el-table-column>
          <el-table-column label="协作者" width="100">
            <template #default="{ row }">
              {{ row.collaborators?.length || 0 }}
            </template>
          </el-table-column>
          <el-table-column label="标签" width="200">
            <template #default="{ row }">
              <div class="table-tags">
                <el-tag
                  v-for="tag in row.tags?.slice(0, 3)"
                  :key="tag"
                  size="small"
                  type="info"
                >
                  {{ tag }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-icon v-if="row.isShared" class="shared-icon"><Share /></el-icon>
              <el-icon v-if="row.isFavorite" class="favorite-icon"><StarFilled /></el-icon>
            </template>
          </el-table-column>
          <el-table-column label="更新时间" width="150">
            <template #default="{ row }">
              {{ formatTime(row.updatedAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-dropdown @command="(command) => handleCollectionAction(command, row)" trigger="click">
                <el-button type="primary" text size="small">
                  操作
                  <el-icon><ArrowDown /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit">编辑</el-dropdown-item>
                    <el-dropdown-item command="duplicate">复制</el-dropdown-item>
                    <el-dropdown-item command="export">导出</el-dropdown-item>
                    <el-dropdown-item command="share">分享</el-dropdown-item>
                    <el-dropdown-item command="delete" divided>删除</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="totalCollections"
            layout="total, sizes, prev, pager, next, jumper"
          />
        </div>
      </div>
    </div>

    <!-- 创建集合对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="创建新集合"
      width="500px"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createFormRules"
        label-width="80px"
      >
        <el-form-item label="集合名称" prop="name">
          <el-input
            v-model="createForm.name"
            placeholder="请输入集合名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="createForm.description"
            type="textarea"
            placeholder="请输入集合描述"
            :rows="3"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="标签" prop="tags">
          <el-select
            v-model="createForm.tags"
            multiple
            filterable
            allow-create
            placeholder="选择或创建标签"
            style="width: 100%"
          >
            <el-option
              v-for="tag in availableTags"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="可见性" prop="isPublic">
          <el-radio-group v-model="createForm.isPublic">
            <el-radio :label="false">私有</el-radio>
            <el-radio :label="true">公开</el-radio>
          </el-radio-group>
          <div class="form-help-text">
            私有集合只有团队成员可以访问，公开集合所有人都可以查看
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showCreateDialog = false">取消</el-button>
          <el-button type="primary" @click="handleCreateCollection" :loading="creating">
            创建集合
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 编辑集合对话框 -->
    <el-dialog
      v-model="showEditDialog"
      title="编辑集合"
      width="500px"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="createFormRules"
        label-width="80px"
      >
        <el-form-item label="集合名称" prop="name">
          <el-input
            v-model="editForm.name"
            placeholder="请输入集合名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="editForm.description"
            type="textarea"
            placeholder="请输入集合描述"
            :rows="3"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="标签" prop="tags">
          <el-select
            v-model="editForm.tags"
            multiple
            filterable
            allow-create
            placeholder="选择或创建标签"
            style="width: 100%"
          >
            <el-option
              v-for="tag in availableTags"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="可见性" prop="isPublic">
          <el-radio-group v-model="editForm.isPublic">
            <el-radio :label="false">私有</el-radio>
            <el-radio :label="true">公开</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showEditDialog = false">取消</el-button>
          <el-button type="primary" @click="handleUpdateCollection" :loading="updating">
            保存更改
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 分享集合对话框 -->
    <el-dialog
      v-model="showShareDialog"
      title="分享集合"
      width="600px"
    >
      <div v-if="selectedCollection" class="share-content">
        <div class="share-info">
          <h4>{{ selectedCollection.name }}</h4>
          <p>{{ selectedCollection.description }}</p>
        </div>

        <el-divider />

        <div class="share-options">
          <h4>分享设置</h4>
          <el-form label-width="120px">
            <el-form-item label="分享权限">
              <el-radio-group v-model="shareForm.permission">
                <el-radio label="view">只读</el-radio>
                <el-radio label="edit">可编辑</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="有效期">
              <el-select v-model="shareForm.expiry">
                <el-option label="永不过期" value="never" />
                <el-option label="7天" value="7d" />
                <el-option label="30天" value="30d" />
                <el-option label="90天" value="90d" />
              </el-select>
            </el-form-item>
            <el-form-item label="需要密码">
              <el-switch v-model="shareForm.requirePassword" />
            </el-form-item>
            <el-form-item label="密码" v-if="shareForm.requirePassword">
              <el-input
                v-model="shareForm.password"
                placeholder="设置访问密码"
                show-password
              />
            </el-form-item>
          </el-form>
        </div>

        <el-divider />

        <div class="share-link">
          <h4>分享链接</h4>
          <el-input
            v-model="shareLink"
            readonly
            placeholder="点击生成分享链接"
          >
            <template #append>
              <el-button @click="generateShareLink">生成链接</el-button>
            </template>
          </el-input>
          <div class="share-actions" v-if="shareLink">
            <el-button @click="copyShareLink" size="small">
              <el-icon><CopyDocument /></el-icon>
              复制链接
            </el-button>
            <el-button @click="shareViaEmail" size="small">
              <el-icon><Message /></el-icon>
              邮件分享
            </el-button>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showShareDialog = false">关闭</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 导入对话框 -->
    <el-dialog
      v-model="showImportDialog"
      :title="`导入 ${importType} 文件`"
      width="500px"
    >
      <div class="import-content">
        <el-upload
          class="upload-demo"
          drag
          :accept="getAcceptTypes()"
          :auto-upload="false"
          :on-change="handleImportFileChange"
          :file-list="importFileList"
        >
          <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
          <div class="el-upload__text">
            将{{ importType }}文件拖到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              支持{{ getAcceptTypes() }}格式，文件大小不超过10MB
            </div>
          </template>
        </el-upload>

        <div v-if="importFileList.length > 0" class="import-options">
          <el-divider />
          <h4>导入选项</h4>
          <el-form label-width="120px">
            <el-form-item label="导入方式">
              <el-radio-group v-model="importOptions.mode">
                <el-radio label="create">创建新集合</el-radio>
                <el-radio label="merge">合并到现有集合</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="目标集合" v-if="importOptions.mode === 'merge'">
              <el-select v-model="importOptions.targetCollection" placeholder="选择目标集合">
                <el-option
                  v-for="collection in collections"
                  :key="collection.id"
                  :label="collection.name"
                  :value="collection.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="冲突处理">
              <el-radio-group v-model="importOptions.conflictResolution">
                <el-radio label="skip">跳过</el-radio>
                <el-radio label="overwrite">覆盖</el-radio>
                <el-radio label="rename">重命名</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-form>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showImportDialog = false">取消</el-button>
          <el-button
            type="primary"
            @click="handleImportCollection"
            :loading="importing"
            :disabled="importFileList.length === 0"
          >
            开始导入
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules, type UploadFile } from 'element-plus'
import {
  FolderOpened,
  Plus,
  Upload,
  ArrowDown,
  Folder,
  Document,
  Share,
  Clock,
  Grid,
  List,
  MoreFilled,
  User,
  StarFilled,
  CopyDocument,
  Message,
  UploadFilled
} from '@element-plus/icons-vue'
import { useCollectionStore } from '@/stores/collection'
// 类型定义
interface Collaborator {
  id: string
  name: string
  email: string
}

interface Collection {
  id: string
  name: string
  description?: string
  requests?: any[]
  tags?: string[]
  isPublic?: boolean
  isShared?: boolean
  isFavorite?: boolean
  requestCount?: number
  collaborators?: Collaborator[]
  createdAt: Date
  updatedAt: Date
  createdBy?: string
  workspaceId?: string
}

interface CreateForm {
  name: string
  description: string
  tags: string[]
  isPublic: boolean
}

interface EditForm {
  id: string
  name: string
  description: string
  tags: string[]
  isPublic: boolean
}

interface ShareForm {
  permission: string
  expiry: string
  requirePassword: boolean
  password: string
}

interface ImportOptions {
  mode: string
  targetCollection: string
  conflictResolution: string
}
import dayjs from 'dayjs'

const router = useRouter()
const collectionStore = useCollectionStore()

// 响应式数据
const loading = ref(false)
const creating = ref(false)
const updating = ref(false)
const importing = ref(false)
const searchQuery = ref('')
const sortBy = ref('updatedAt')
const filterBy = ref('')
const viewMode = ref<'grid' | 'list'>('grid')
const currentPage = ref(1)
const pageSize = ref(20)
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const showShareDialog = ref(false)
const showImportDialog = ref(false)
const selectedCollection = ref<Collection | null>(null)
const importType = ref('')
const importFileList = ref<UploadFile[]>([])

// 表单引用
const createFormRef = ref<FormInstance>()
const editFormRef = ref<FormInstance>()

// 创建表单
const createForm = ref<CreateForm>({
  name: '',
  description: '',
  tags: [],
  isPublic: false
})

// 编辑表单
const editForm = ref<EditForm>({
  id: '',
  name: '',
  description: '',
  tags: [],
  isPublic: false
})

// 分享表单
const shareForm = ref<ShareForm>({
  permission: 'view',
  expiry: 'never',
  requirePassword: false,
  password: ''
})

// 导入选项
const importOptions = ref<ImportOptions>({
  mode: 'create',
  targetCollection: '',
  conflictResolution: 'skip'
})

const shareLink = ref('')

// 可用标签
const availableTags = ref([
  'API测试',
  '开发环境',
  '生产环境',
  '第三方接口',
  '内部接口',
  '移动端',
  'Web端',
  '微服务'
])

// 模拟集合数据
const collections = ref<Collection[]>([
  {
    id: '1',
    name: '用户管理API',
    description: '用户注册、登录、个人信息管理相关接口',
    tags: ['用户管理', 'API测试'],
    isPublic: false,
    isShared: true,
    isFavorite: true,
    requestCount: 15,
    collaborators: [{ id: '1', name: '张三', email: 'zhangsan@example.com' }],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    createdBy: '1',
    workspaceId: '1'
  },
  {
    id: '2',
    name: '订单系统API',
    description: '电商订单创建、查询、支付相关接口',
    tags: ['订单管理', '电商'],
    isPublic: true,
    isShared: false,
    isFavorite: false,
    requestCount: 28,
    collaborators: [],
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-14'),
    createdBy: '1',
    workspaceId: '1'
  },
  {
    id: '3',
    name: '支付网关API',
    description: '第三方支付接口集成测试',
    tags: ['支付', '第三方接口'],
    isPublic: false,
    isShared: true,
    isFavorite: true,
    requestCount: 8,
    collaborators: [{ id: '2', name: '李四', email: 'lisi@example.com' }],
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-13'),
    createdBy: '2',
    workspaceId: '1'
  }
])

// 表单验证规则
const createFormRules: FormRules = {
  name: [
    { required: true, message: '请输入集合名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ]
}

// 计算属性
const totalCollections = computed(() => collections.value.length)
const totalRequests = computed(() => collections.value.reduce((sum, col) => sum + (col.requestCount || 0), 0))
const sharedCollections = computed(() => collections.value.filter(col => col.isShared).length)
const recentlyUpdated = computed(() => {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  return collections.value.filter(col => col.updatedAt && col.updatedAt > oneWeekAgo).length
})

const filteredCollections = computed(() => {
  let filtered = collections.value
  
  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(collection => 
      collection.name.toLowerCase().includes(query) ||
      (collection.description && collection.description.toLowerCase().includes(query))
    )
  }
  
  // 条件过滤
  if (filterBy.value) {
    switch (filterBy.value) {
      case 'mine':
        filtered = filtered.filter(col => col.createdBy === '1') // 假设当前用户ID为1
        break
      case 'shared':
        filtered = filtered.filter(col => col.isShared)
        break
      case 'recent':
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        filtered = filtered.filter(col => col.updatedAt && col.updatedAt > oneWeekAgo)
        break
    }
  }
  
  // 排序
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'createdAt':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'requestCount':
        return (b.requestCount || 0) - (a.requestCount || 0)
      case 'updatedAt':
      default:
        return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
    }
  })
  
  return filtered
})

// 方法
const formatTime = (date: Date | string | undefined) => {
  if (!date) return '-'
  return dayjs(date).format('YYYY-MM-DD HH:mm')
}

const openCollection = (collection: Collection) => {
  router.push(`/collections/${collection.id}`)
}

const handleCollectionAction = async (command: string, collection: Collection) => {
  selectedCollection.value = collection
  
  switch (command) {
    case 'edit':
      editForm.value = {
        id: collection.id,
        name: collection.name,
        description: collection.description || '',
        tags: collection.tags || [],
        isPublic: collection.isPublic || false
      }
      showEditDialog.value = true
      break
    case 'duplicate':
      await handleDuplicateCollection(collection)
      break
    case 'export':
      await handleExportCollection(collection)
      break
    case 'share':
      showShareDialog.value = true
      break
    case 'delete':
      await handleDeleteCollection(collection)
      break
  }
}

const handleCreateCollection = async () => {
  if (!createFormRef.value) return
  
  try {
    await createFormRef.value.validate()
    creating.value = true
    
    const newCollection = await collectionStore.createCollection({
      name: createForm.value.name,
      description: createForm.value.description,
      tags: createForm.value.tags,
      isPublic: createForm.value.isPublic
    })
    
    collections.value.unshift(newCollection)
    showCreateDialog.value = false
    resetCreateForm()
    ElMessage.success('集合创建成功')
  } catch (error) {
    console.error('Failed to create collection:', error)
  } finally {
    creating.value = false
  }
}

const handleUpdateCollection = async () => {
  if (!editFormRef.value) return
  
  try {
    await editFormRef.value.validate()
    updating.value = true
    
    await collectionStore.updateCollection(editForm.value.id, {
      name: editForm.value.name,
      description: editForm.value.description,
      tags: editForm.value.tags,
      isPublic: editForm.value.isPublic
    })
    
    // 更新本地数据
    const index = collections.value.findIndex(col => col.id === editForm.value.id)
    if (index > -1) {
      Object.assign(collections.value[index], editForm.value)
      collections.value[index].updatedAt = new Date()
    }
    
    showEditDialog.value = false
    ElMessage.success('集合更新成功')
  } catch (error) {
    console.error('Failed to update collection:', error)
  } finally {
    updating.value = false
  }
}

const handleDuplicateCollection = async (collection: Collection) => {
  try {
    const duplicated = await collectionStore.duplicateCollection(collection.id)
    collections.value.unshift(duplicated)
    ElMessage.success('集合复制成功')
  } catch (error) {
    ElMessage.error('复制集合失败')
  }
}

const handleExportCollection = async (collection: Collection) => {
  try {
    await collectionStore.exportCollection(collection.id, 'postman')
    ElMessage.success('集合导出成功')
  } catch (error) {
    ElMessage.error('导出集合失败')
  }
}

const handleDeleteCollection = async (collection: Collection) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除集合 "${collection.name}" 吗？此操作不可逆！`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await collectionStore.deleteCollection(collection.id)
    const index = collections.value.findIndex(col => col.id === collection.id)
    if (index > -1) {
      collections.value.splice(index, 1)
    }
    ElMessage.success('集合删除成功')
  } catch (error) {
    // 用户取消删除
  }
}

const handleImportCommand = (command: string) => {
  importType.value = command
  showImportDialog.value = true
}

const getAcceptTypes = () => {
  const types = {
    postman: '.json',
    openapi: '.json,.yaml,.yml',
    insomnia: '.json',
    curl: '.txt'
  }
  return types[importType.value as keyof typeof types] || '.json'
}

const handleImportFileChange = (file: UploadFile) => {
  importFileList.value = [file]
}

const handleImportCollection = async () => {
  if (importFileList.value.length === 0) {
    ElMessage.warning('请选择要导入的文件')
    return
  }
  
  importing.value = true
  try {
    const file = importFileList.value[0]
    await collectionStore.importCollection(file.raw!, importType.value, importOptions.value)
    
    showImportDialog.value = false
    resetImportForm()
    ElMessage.success('集合导入成功')
    
    // 重新加载集合列表
    await loadCollections()
  } catch (error) {
    ElMessage.error('导入集合失败')
  } finally {
    importing.value = false
  }
}

const generateShareLink = () => {
  if (!selectedCollection.value) return
  
  // 生成分享链接（模拟）
  const baseUrl = window.location.origin
  const shareId = Math.random().toString(36).substring(2, 15)
  shareLink.value = `${baseUrl}/shared/collections/${shareId}`
  
  ElMessage.success('分享链接生成成功')
}

const copyShareLink = async () => {
  try {
    await navigator.clipboard.writeText(shareLink.value)
    ElMessage.success('链接已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制链接失败')
  }
}

const shareViaEmail = () => {
  const subject = encodeURIComponent(`分享API集合: ${selectedCollection.value?.name}`)
  const body = encodeURIComponent(`我想与您分享一个API集合:\n\n${selectedCollection.value?.name}\n${selectedCollection.value?.description}\n\n访问链接: ${shareLink.value}`)
  window.open(`mailto:?subject=${subject}&body=${body}`)
}

const resetCreateForm = () => {
  createForm.value = {
    name: '',
    description: '',
    tags: [],
    isPublic: false
  }
  createFormRef.value?.resetFields()
}

const resetImportForm = () => {
  importFileList.value = []
  importOptions.value = {
    mode: 'create',
    targetCollection: '',
    conflictResolution: 'skip'
  }
}

const loadCollections = async () => {
  loading.value = true
  try {
    await collectionStore.loadCollections()
    // 这里应该从store获取数据，现在使用模拟数据
  } catch (error) {
    ElMessage.error('加载集合列表失败')
  } finally {
    loading.value = false
  }
}

// 生命周期
onMounted(() => {
  loadCollections()
})
</script>

<style scoped>
.collection-management {
  padding: 24px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  background: white;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header-left {
  flex: 1;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.page-description {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e5e7eb;
  color: #6b7280;
  font-size: 20px;
}

.stat-icon.requests {
  background: #dbeafe;
  color: #2563eb;
}

.stat-icon.shared {
  background: #dcfce7;
  color: #16a34a;
}

.stat-icon.recent {
  background: #fef3c7;
  color: #d97706;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
}

.main-content {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  gap: 16px;
}

.search-section {
  flex: 1;
}

.filter-section {
  display: flex;
  gap: 12px;
  align-items: center;
}

.collections-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.collection-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.collection-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.collection-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 18px;
}

.action-btn {
  padding: 4px;
  color: #6b7280;
}

.card-content {
  margin-bottom: 16px;
}

.collection-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.collection-description {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 12px 0;
  line-height: 1.5;
}

.collection-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #6b7280;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.collection-tags {
  display: flex;
  gap: 4px;
  align-items: center;
}

.more-tags {
  font-size: 12px;
  color: #6b7280;
}

.collection-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.update-time {
  font-size: 12px;
  color: #6b7280;
}

.shared-icon {
  color: #16a34a;
  font-size: 14px;
}

.favorite-icon {
  color: #f59e0b;
  font-size: 14px;
}

.collections-table {
  margin-top: 24px;
}

.table-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: #f3f4f6;
  color: #6b7280;
}

.collection-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.collection-info .collection-name {
  font-weight: 500;
  color: #1f2937;
  margin: 0;
}

.collection-info .collection-description {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.table-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.form-help-text {
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
}

.share-content {
  padding: 16px 0;
}

.share-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.share-info p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.share-options h4,
.share-link h4 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.share-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.import-content {
  margin-top: 16px;
}

.import-options h4 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

@media (max-width: 1024px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-section {
    justify-content: flex-start;
  }
  
  .collections-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (max-width: 768px) {
  .collection-management {
    padding: 16px;
  }
  
  .page-header {
    padding: 16px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
  }
  
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .main-content {
    padding: 16px;
  }
  
  .filter-section {
    flex-direction: column;
    gap: 8px;
  }
  
  .collections-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .stats-cards {
    grid-template-columns: 1fr;
  }
}
</style>