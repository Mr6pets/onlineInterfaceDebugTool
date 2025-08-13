// 导出shared包中的类型
export * from '@api-debug-tool/shared/types'

// 自动化测试相关类型扩展
export interface RunHistoryData {
  date: string
  success: number
  failed: number
  total: number
}

export interface TestSuite {
  id: string
  name: string
  description?: string
  environment: string
  baseUrl: string
  status: 'active' | 'inactive' | 'draft'
  enabled: boolean
  tests?: TestCase[]
  config?: {
    timeout: number
    retryCount: number
    concurrency: number
    stopOnFailure: boolean
    generateReport: boolean
    enableScreenshot: boolean
    enableLogging: boolean
  }
  notifications?: {
    email: { enabled: boolean; recipients: string[] }
    webhook: { enabled: boolean; url: string }
    slack: { enabled: boolean }
  }
  lastRun?: number | null
  createdAt: number
  updatedAt: number
}

export interface TestCase {
  id: string
  name: string
  description?: string
  method: string
  url: string
  headers?: Record<string, string>
  body?: string
  assertions: Array<{
    id: string
    type: 'status' | 'header' | 'body' | 'response_time' | 'custom'
    field?: string
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'regex'
    expected: any
  }>
  enabled: boolean
  timeout?: number
  order: number
}

export interface TestResult {
  id: string
  suiteId: string
  testId: string
  testName: string
  status: 'passed' | 'failed' | 'skipped' | 'running'
  duration: number
  timestamp: number
  environment: string
  request?: {
    method: string
    url: string
    headers?: Record<string, string>
    body?: string
  }
  response?: {
    status: number
    time: number
    size?: number
    headers?: Record<string, string>
    body?: string
  }
  assertions?: Array<{
    id: string
    name: string
    passed: boolean
    expected: any
    actual: any
    message?: string
  }>
  error?: string
  stackTrace?: string
  logs?: Array<{
    level: 'info' | 'warn' | 'error' | 'debug'
    message: string
    timestamp: number
  }>
}

export interface Schedule {
  id: string
  name: string
  suiteId: string
  type: 'cron' | 'interval' | 'once'
  cronExpression?: string
  interval?: number
  intervalUnit?: 'minutes' | 'hours' | 'days'
  executeAt?: string
  timezone: string
  enabled: boolean
  retryOnFailure: boolean
  maxRetries: number
  notifications: string[]
  description?: string
  createdAt: number
  updatedAt: number
}

// Pro版本特有的类型扩展
export interface ProConfig {
  version: string
  features: string[]
  limits: {
    maxTeamMembers: number
    maxProjects: number
    maxApiCalls: number
  }
}

export interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'admin' | 'member' | 'viewer'
  permissions: string[]
  lastLogin?: number
  createdAt: number
}

export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: number
  read: boolean
  actions?: {
    label: string
    action: () => void
  }[]
}

// Dashboard相关类型定义
export interface Widget {
  id: string
  type: 'chart' | 'metric' | 'table' | 'text' | 'progress'
  title: string
  description?: string
  width: number
  height: number
  config: Record<string, any>
  data?: any
  position?: {
    x: number
    y: number
  }
  createdAt: Date
  updatedAt: Date
}

export interface Dashboard {
  id: string
  name: string
  description?: string
  widgets: Widget[]
  layout?: {
    columns: number
    rows: number
  }
  isPublic: boolean
  tags?: string[]
  createdAt: Date
  updatedAt: Date
  createdBy?: string
}

export interface DashboardTemplate {
  id: string
  name: string
  description: string
  preview: string
  category: string
  widgets: Omit<Widget, 'id' | 'createdAt' | 'updatedAt'>[]
  tags?: string[]
  isOfficial: boolean
  downloads?: number
  rating?: number
}

// Team相关类型定义
export interface TeamMember {
  id: string
  userId?: string
  teamId?: string
  name: string
  email: string
  avatar?: string
  role: string
  permissions: string[]
  joinedAt: string
  lastActiveAt?: string
  status: 'active' | 'inactive' | 'pending' | 'suspended'
  invitedBy?: string
  title?: string
  department?: string
  phone?: string
  location?: string
  tags?: string[]
  notes?: string
  updatedAt?: string
  suspendReason?: string
  suspendUntil?: string
  notifications?: {
    email?: string[]
    inApp?: string[]
  }
}

export interface Team {
  id: string
  name: string
  description?: string
  avatar?: string
  website?: string
  contactEmail?: string
  timezone?: string
  plan?: 'free' | 'pro' | 'enterprise'
  members?: TeamMember[]
  settings?: TeamSettings
  stats?: TeamStats
  createdAt: string
  updatedAt: string
  createdBy?: string
}

export interface TeamRole {
  id: string
  name: string
  description?: string
  permissions: Permission[]
  isDefault: boolean
  isCustom: boolean
}

export interface Permission {
  id?: string
  key: string
  name: string
  description: string
  category?: string
  resource?: string
  action?: string
  roles?: string[]
}

export interface Role {
  key: string
  name: string
  level: number
  description?: string
  permissions?: string[]
  isDefault?: boolean
  isCustom?: boolean
}

export interface TeamSettings {
  allowInvitations?: boolean
  requireApproval?: boolean
  defaultRole?: string
  maxMembers?: number
  features?: string[]
  integrations?: Record<string, any>
  access?: {
    visibility: 'private' | 'internal' | 'public'
    requireApproval: boolean
    invitePermissions: string[]
    allowedDomains: string
  }
  notifications?: {
    email: {
      memberJoined: boolean
      memberLeft: boolean
      roleChanged: boolean
      projectCreated: boolean
      weeklyReport: boolean
    }
    inApp: {
      mentions: boolean
      comments: boolean
      assignments: boolean
      deadlines: boolean
    }
    frequency: string
    quietHours: string[]
  }
}

export interface TeamStats {
  totalMembers: number
  activeMembers: number
  totalProjects: number
  totalApiCalls: number
  storageUsed: number
  storageLimit: number
}

// MockServer相关类型定义
export interface MockRoute {
  id: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'
  path: string
  description?: string
  enabled: boolean
  response: MockResponse
  delay?: number
  conditions?: MockCondition[]
  tags?: string[]
  hitCount?: number
  lastHit?: number
  createdAt: Date
  updatedAt: Date
  createdBy?: string
}

export interface MockResponse {
  statusCode: number
  headers?: { key: string; value: string }[]
  body: any
  bodyType: 'json' | 'text' | 'xml' | 'html' | 'file'
  dynamic?: boolean
  script?: string
}

export interface MockCondition {
  type: 'header' | 'query' | 'body' | 'ip' | 'custom'
  field: string
  operator: 'equals' | 'contains' | 'regex' | 'exists'
  value: string
  caseSensitive?: boolean
}

export interface MockServerSettings {
  port: number
  host: string
  cors: boolean
  logging: boolean
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  maxRequestSize: number
  timeout: number
  maxLogs: number
  ssl?: {
    enabled: boolean
    cert?: string
    key?: string
  }
  proxy?: {
    enabled: boolean
    target: string
    changeOrigin?: boolean
  }
}

// 扩展 PerformanceMetrics 类型，添加缺失的属性
export interface ExtendedPerformanceMetrics {
  id: string
  requestId: string
  url: string
  method: string
  startTime: number
  endTime: number
  duration: number
  dnsLookup: number
  tcpConnect: number
  tlsHandshake: number
  firstByte: number
  contentDownload: number
  totalSize: number
  transferSize: number
  resourceSize: number
  status: number
  size: number
  userAgent: string
  timestamp: string // 字符串格式的时间戳
}

// 性能监控相关类型 - 移除重复定义，使用下面的完整定义

export interface PerformanceSettings {
  sampleRate: number
  retentionDays: number
  autoRefresh: boolean
  refreshInterval: number
  responseTimeAlert: boolean
  responseTimeThreshold: number
  errorRateAlert: boolean
  errorRateThreshold: number
  defaultTimeRange: string
  chartTheme: 'light' | 'dark' | 'auto'
  visibleCharts: string[]
  exportFormat: string[]
  includeCharts: boolean
}

export interface MockRequest {
  id: string
  method: string
  path: string
  headers: Record<string, string>
  query: Record<string, string>
  body?: any
  ip: string
  userAgent: string
  timestamp: Date
  matchedRoute?: string
  responseTime: number
  statusCode: number
}

export interface MockStats {
  totalRequests: number
  activeRoutes: number
  averageResponseTime: number
  errorRate: number
  requestsPerMinute: number
  topRoutes: {
    path: string
    count: number
  }[]
}

// Performance相关类型定义
export interface PerformanceTest {
  id: string
  name: string
  description?: string
  type: 'load' | 'stress' | 'spike' | 'volume' | 'endurance'
  config: LoadTestConfig
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  results?: PerformanceResult
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface LoadTestConfig {
  target: string
  duration: number
  virtualUsers: number
  rampUpTime: number
  rampDownTime: number
  thinkTime: number
  scenarios: TestScenario[]
  assertions: PerformanceAssertion[]
  environment?: string
}

export interface TestScenario {
  id: string
  name: string
  weight: number
  requests: PerformanceRequest[]
  variables?: Record<string, any>
  loops?: number
}

export interface PerformanceRequest {
  id: string
  name: string
  method: string
  url: string
  headers?: Record<string, string>
  body?: any
  timeout: number
  followRedirects: boolean
  extractors?: DataExtractor[]
  assertions?: RequestAssertion[]
}

export interface DataExtractor {
  name: string
  type: 'json' | 'xpath' | 'regex' | 'header'
  expression: string
  scope: 'global' | 'scenario'
}

export interface RequestAssertion {
  type: 'status' | 'response_time' | 'body' | 'header'
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'less_than' | 'greater_than'
  value: any
  message?: string
}

export interface PerformanceAssertion {
  metric: 'avg_response_time' | 'max_response_time' | 'error_rate' | 'throughput'
  operator: 'less_than' | 'greater_than' | 'equals'
  value: number
  message?: string
}

export interface PerformanceResult {
  summary: PerformanceSummary
  metrics: PerformanceMetric[]
  errors: PerformanceError[]
  charts: PerformanceChart[]
  assertions: AssertionResult[]
}

export interface PerformanceSummary {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  errorRate: number
  avgResponseTime: number
  minResponseTime: number
  maxResponseTime: number
  p50ResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  throughput: number
  duration: number
}

export interface PerformanceMetric {
  timestamp: number
  responseTime: number
  throughput: number
  errorRate: number
  activeUsers: number
}

export interface PerformanceError {
  timestamp: number
  request: string
  error: string
  statusCode?: number
  count: number
}

export interface PerformanceChart {
  type: 'line' | 'bar' | 'area'
  title: string
  data: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      color: string
    }[]
  }
}

export interface AssertionResult {
  assertion: PerformanceAssertion | RequestAssertion
  passed: boolean
  actual: any
  expected: any
  message?: string
}

// Automation相关类型定义
export interface AutomationWorkflow {
  id: string
  name: string
  description?: string
  enabled: boolean
  trigger: WorkflowTrigger
  steps: WorkflowStep[]
  variables?: Record<string, any>
  schedule?: WorkflowSchedule
  tags?: string[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
  lastRun?: WorkflowExecution
}

export interface WorkflowTrigger {
  type: 'manual' | 'schedule' | 'webhook' | 'api_call' | 'file_change'
  config: Record<string, any>
  conditions?: TriggerCondition[]
}

export interface TriggerCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
  value: any
}

export interface WorkflowStep {
  id: string
  type: 'http_request' | 'data_transform' | 'condition' | 'loop' | 'delay' | 'notification' | 'script'
  name: string
  config: Record<string, any>
  enabled: boolean
  continueOnError: boolean
  timeout?: number
  retries?: number
  outputs?: string[]
}

export interface WorkflowSchedule {
  type: 'interval' | 'cron'
  expression: string
  timezone: string
  enabled: boolean
}

export interface WorkflowExecution {
  id: string
  workflowId: string
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  startTime: Date
  endTime?: Date
  duration?: number
  steps: StepExecution[]
  logs: ExecutionLog[]
  variables: Record<string, any>
  error?: string
}

export interface StepExecution {
  stepId: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  startTime: Date
  endTime?: Date
  duration?: number
  input?: any
  output?: any
  error?: string
  retryCount: number
}

export interface ExecutionLog {
  timestamp: Date
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  stepId?: string
  data?: any
}

export interface AutomationTemplate {
  id: string
  name: string
  description: string
  category: string
  icon: string
  workflow: Omit<AutomationWorkflow, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
  isOfficial: boolean
  downloads: number
  rating: number
}

// Documentation相关类型定义
export interface ApiDocumentation {
  id: string
  title: string
  description?: string
  version: string
  baseUrl: string
  sections: DocSection[]
  settings: DocSettings
  theme: DocTheme
  published: boolean
  publishedUrl?: string
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface DocSection {
  id: string
  type: 'overview' | 'authentication' | 'endpoints' | 'models' | 'examples' | 'changelog' | 'custom'
  title: string
  content: string
  order: number
  visible: boolean
  endpoints?: ApiEndpoint[]
  models?: DataModel[]
}

export interface ApiEndpoint {
  id: string
  method: string
  path: string
  summary: string
  description?: string
  tags?: string[]
  parameters: EndpointParameter[]
  requestBody?: RequestBodySchema
  responses: ResponseSchema[]
  examples?: EndpointExample[]
  deprecated?: boolean
}

export interface EndpointParameter {
  name: string
  in: 'query' | 'path' | 'header' | 'cookie'
  required: boolean
  type: string
  description?: string
  example?: any
  enum?: any[]
  default?: any
}

export interface RequestBodySchema {
  required: boolean
  contentType: string
  schema: JsonSchema
  examples?: Record<string, any>
}

export interface ResponseSchema {
  statusCode: number
  description: string
  contentType?: string
  schema?: JsonSchema
  examples?: Record<string, any>
}

export interface JsonSchema {
  type: string
  properties?: Record<string, JsonSchema>
  items?: JsonSchema
  required?: string[]
  description?: string
  example?: any
  enum?: any[]
  format?: string
}

export interface DataModel {
  name: string
  description?: string
  schema: JsonSchema
  examples?: Record<string, any>
}

export interface EndpointExample {
  name: string
  description?: string
  request: {
    parameters?: Record<string, any>
    body?: any
  }
  response: {
    statusCode: number
    body: any
  }
}

export interface DocSettings {
  logo?: string
  favicon?: string
  customCss?: string
  customJs?: string
  analytics?: {
    googleAnalytics?: string
    customScript?: string
  }
  seo?: {
    title?: string
    description?: string
    keywords?: string[]
  }
}

export interface DocTheme {
  primaryColor: string
  secondaryColor: string
  fontFamily: string
  layout: 'sidebar' | 'topbar'
  codeTheme: 'light' | 'dark'
  customCss?: string
}

export interface DocTemplate {
  id: string
  name: string
  description: string
  preview: string
  category: string
  theme: DocTheme
  sections: Omit<DocSection, 'id'>[]
  isOfficial: boolean
  downloads: number
  rating: number
}

// 移除重复的类型定义，这些类型已在文件开头定义

// 趋势数据类型
export interface Trend {
  value: number
  direction: 'up' | 'down'
}