// 共享类型定义
export interface HttpMethod {
  GET: 'GET';
  POST: 'POST';
  PUT: 'PUT';
  DELETE: 'DELETE';
  PATCH: 'PATCH';
  HEAD: 'HEAD';
  OPTIONS: 'OPTIONS';
}

export interface RequestConfig {
  url: string;
  method: keyof HttpMethod;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
  timeout?: number;
  auth?: {
    type: 'bearer' | 'basic' | 'apikey';
    token?: string;
    username?: string;
    password?: string;
    key?: string;
    value?: string;
    addTo?: 'header' | 'query';
  };
  tests?: TestCase[];
}

export interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  duration: number;
  size: number;
  cookies?: Record<string, string>;
}

// 新增：测试用例
export interface TestCase {
  id: string;
  name: string;
  type: 'status' | 'header' | 'body' | 'response-time' | 'custom';
  condition: string;
  expected: any;
  actual?: any;
  passed?: boolean;
  message?: string;
}

// 新增：批量测试
export interface BatchTest {
  id: string;
  name: string;
  requests: RequestConfig[];
  parallel?: boolean;
  stopOnFailure?: boolean;
  environment?: string;
  results?: BatchTestResult[];
  createdAt: Date;
  updatedAt: Date;
}

export interface BatchTestResult {
  requestId: string;
  request: RequestConfig;
  response?: ResponseData;
  tests?: TestResult[];
  duration: number;
  success: boolean;
  error?: string;
}

export interface TestResult {
  testId: string;
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

// 更新：API集合
export interface ApiCollection {
  id: string;
  name: string;
  description?: string;
  folders: CollectionFolder[];
  requests: CollectionRequest[];
  variables?: Record<string, string>;
  auth?: RequestConfig['auth'];
  createdAt: Date;
  updatedAt: Date;
}

export interface CollectionFolder {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  requests: string[]; // request IDs
  folders: string[]; // folder IDs
}

export interface CollectionRequest {
  id: string;
  name: string;
  description?: string;
  folderId?: string;
  request: RequestConfig;
  examples?: RequestExample[];
}

export interface RequestExample {
  id: string;
  name: string;
  request: RequestConfig;
  response?: ResponseData;
}

// 更新：环境
export interface Environment {
  id: string;
  name: string;
  variables: Record<string, string>;
  isActive: boolean;
  baseUrl?: string;
  auth?: RequestConfig['auth'];
  createdAt: Date;
  updatedAt: Date;
}

// 新增：工作空间
export interface Workspace {
  id: string;
  name: string;
  description?: string;
  collections: string[]; // collection IDs
  environments: string[]; // environment IDs
  activeEnvironment?: string;
  settings: WorkspaceSettings;
  isPublic: boolean;
  ownerId: string;
  members: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceSettings {
  timeout: number;
  followRedirects: boolean;
  validateSSL: boolean;
  maxRedirects: number;
  requestDelay: number;
}

export interface HistoryRecord {
  id: string;
  request: RequestConfig;
  response?: ResponseData;
  timestamp: Date;
  success: boolean;
  workspaceId?: string;
  collectionId?: string;
}

// 新增：导入导出
export interface ImportData {
  type: 'postman' | 'insomnia' | 'openapi' | 'har';
  data: any;
  options?: {
    includeExamples?: boolean;
    includeTests?: boolean;
    includeAuth?: boolean;
  };
}

export interface ExportData {
  workspace?: Workspace;
  collections: ApiCollection[];
  environments: Environment[];
  version: string;
  exportedAt: Date;
}

// Full版本企业级类型定义

// 用户和权限管理
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  permissions: Permission[];
  workspaces: string[]; // workspace IDs
  preferences: UserPreferences;
  createdAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
}

export type UserRole = 'admin' | 'project_lead' | 'developer' | 'tester' | 'guest';

export interface Permission {
  resource: 'workspace' | 'collection' | 'environment' | 'test' | 'team' | 'settings';
  actions: PermissionAction[];
  scope?: 'own' | 'team' | 'all';
}

export type PermissionAction = 'read' | 'write' | 'delete' | 'share' | 'manage';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'zh-CN' | 'en-US';
  notifications: NotificationSettings;
  editor: EditorSettings;
}

export interface NotificationSettings {
  email: boolean;
  browser: boolean;
  testResults: boolean;
  teamUpdates: boolean;
}

export interface EditorSettings {
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  theme: string;
}

// 团队协作
export interface Team {
  id: string;
  name: string;
  description?: string;
  owner: string; // user ID
  members: TeamMember[];
  workspaces: string[]; // workspace IDs
  settings: TeamSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  userId: string;
  role: TeamRole;
  permissions: Permission[];
  joinedAt: Date;
  invitedBy: string; // user ID
  status: 'active' | 'invited' | 'suspended';
}

export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface TeamSettings {
  allowGuestAccess: boolean;
  requireApproval: boolean;
  defaultRole: TeamRole;
  maxMembers: number;
  visibility: 'private' | 'internal' | 'public';
}

// 分享和协作
export interface ShareLink {
  id: string;
  type: 'workspace' | 'collection' | 'request' | 'environment';
  resourceId: string;
  title: string;
  description?: string;
  permissions: SharePermission[];
  expiresAt?: Date;
  password?: string;
  allowComments: boolean;
  createdBy: string; // user ID
  createdAt: Date;
  accessCount: number;
  lastAccessedAt?: Date;
  isActive?: boolean;
}

export interface SharePermission {
  action: 'view' | 'edit' | 'comment';
  users?: string[]; // user IDs
  teams?: string[]; // team IDs
  public?: boolean;
}

export interface Comment {
  id: string;
  content: string;
  author: string; // user ID
  targetType: 'request' | 'collection' | 'workspace';
  targetId: string;
  parentId?: string; // for replies
  mentions: string[]; // user IDs
  attachments: CommentAttachment[];
  createdAt: Date;
  updatedAt?: Date;
  isResolved: boolean;
}

export interface CommentAttachment {
  id: string;
  name: string;
  type: 'image' | 'file';
  url: string;
  size: number;
}

// 高级测试功能
export interface TestSuite {
  id: string;
  name: string;
  description?: string;
  workspaceId: string;
  tests: TestCase[];
  environment?: string;
  schedule?: TestSchedule;
  notifications: NotificationConfig[];
  settings: TestSuiteSettings;
  createdBy: string; // user ID
  createdAt: Date;
  updatedAt: Date;
  lastRunAt?: Date;
  status: 'idle' | 'running' | 'completed' | 'failed';
}

export interface TestSuiteSettings {
  parallel: boolean;
  timeout: number;
  retries: number;
  stopOnFailure: boolean;
  generateReport: boolean;
  reportFormat: 'html' | 'json' | 'junit';
}

export interface TestSchedule {
  enabled: boolean;
  cron: string;
  timezone: string;
  nextRun?: Date;
  lastRun?: Date;
}

export interface TestResult {
  id: string;
  suiteId: string;
  testId: string;
  status: 'passed' | 'failed' | 'skipped' | 'error';
  duration: number;
  startTime: Date;
  endTime: Date;
  request?: RequestConfig;
  response?: ResponseData;
  assertions: AssertionResult[];
  error?: string;
  logs: TestLog[];
}

export interface AssertionResult {
  id: string;
  name: string;
  type: TestCase['type'];
  expected: any;
  actual: any;
  passed: boolean;
  message: string;
}

export interface TestLog {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
  data?: any;
}

// 数据管理和同步
export interface DataSync {
  id: string;
  type: 'backup' | 'restore' | 'sync';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number; // 0-100
  source: DataSource;
  target: DataSource;
  options: SyncOptions;
  createdBy: string; // user ID
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface DataSource {
  type: 'local' | 'cloud' | 'git' | 'database';
  config: any;
}

export interface SyncOptions {
  includeWorkspaces: boolean;
  includeCollections: boolean;
  includeEnvironments: boolean;
  includeTests: boolean;
  includeHistory: boolean;
  conflictResolution: 'overwrite' | 'merge' | 'skip';
}

// 性能监控
export interface PerformanceMetrics {
  id: string;
  requestId: string;
  url: string;
  method: string;
  startTime: number;
  endTime: number;
  duration: number;
  dnsLookup: number;
  tcpConnect: number;
  tlsHandshake: number;
  firstByte: number;
  contentDownload: number;
  totalSize: number;
  transferSize: number;
  resourceSize: number;
  timestamp: Date;
}

export interface PerformanceReport {
  id: string;
  name: string;
  description?: string;
  timeRange: {
    start: Date;
    end: Date;
  };
  metrics: PerformanceMetrics[];
  summary: {
    totalRequests: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    successRate: number;
    errorRate: number;
  };
  createdAt: Date;
}

export interface TeamSettings {
  allowGuestAccess: boolean;
  requireApproval: boolean;
  defaultRole: TeamRole;
  maxMembers: number;
  visibility: 'private' | 'internal' | 'public';
}

// API文档生成
export interface ApiDocumentation {
  id: string;
  name: string;
  description?: string;
  version: string;
  baseUrl: string;
  collections: string[]; // collection IDs
  theme: 'default' | 'dark' | 'custom';
  customCSS?: string;
  logo?: string;
  contact?: {
    name: string;
    email: string;
    url: string;
  };
  license?: {
    name: string;
    url: string;
  };
  servers: ApiServer[];
  security: SecurityScheme[];
  tags: ApiTag[];
  published: boolean;
  publishUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiServer {
  url: string;
  description?: string;
  variables?: Record<string, ServerVariable>;
}

export interface ServerVariable {
  default: string;
  description?: string;
  enum?: string[];
}

export interface SecurityScheme {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  name?: string;
  in?: 'query' | 'header' | 'cookie';
  scheme?: string;
  bearerFormat?: string;
  flows?: OAuthFlows;
  openIdConnectUrl?: string;
}

export interface OAuthFlows {
  implicit?: OAuthFlow;
  password?: OAuthFlow;
  clientCredentials?: OAuthFlow;
  authorizationCode?: OAuthFlow;
}

export interface OAuthFlow {
  authorizationUrl?: string;
  tokenUrl?: string;
  refreshUrl?: string;
  scopes: Record<string, string>;
}

export interface ApiTag {
  name: string;
  description?: string;
  externalDocs?: {
    description?: string;
    url: string;
  };
}

// 自动化测试
export interface AutomationSuite {
  id: string;
  name: string;
  description?: string;
  tests: AutomationTest[];
  schedule?: TestSchedule;
  notifications: NotificationConfig[];
  environment?: string;
  parallel: boolean;
  timeout: number;
  retries: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AutomationTest {
  id: string;
  name: string;
  description?: string;
  type: 'api' | 'workflow' | 'load' | 'security';
  config: TestConfig;
  assertions: TestAssertion[];
  setup?: TestStep[];
  teardown?: TestStep[];
  enabled: boolean;
}

export interface TestConfig {
  request?: RequestConfig;
  workflow?: WorkflowStep[];
  load?: LoadTestConfig;
  security?: SecurityTestConfig;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'request' | 'delay' | 'script' | 'condition';
  config: any;
  continueOnError: boolean;
}

export interface LoadTestConfig {
  users: number;
  duration: number; // seconds
  rampUp: number; // seconds
  requests: RequestConfig[];
  thresholds: {
    avgResponseTime: number;
    maxResponseTime: number;
    errorRate: number;
  };
}

export interface SecurityTestConfig {
  tests: ('sql_injection' | 'xss' | 'auth_bypass' | 'rate_limit')[];
  payloads: string[];
  headers: Record<string, string>;
}

export interface TestAssertion {
  id: string;
  type: 'status' | 'header' | 'body' | 'response_time' | 'custom';
  field?: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'regex';
  value: any;
  message?: string;
}

export interface TestStep {
  id: string;
  type: 'request' | 'script' | 'delay';
  config: any;
}

export interface TestSchedule {
  enabled: boolean;
  cron: string;
  timezone: string;
  nextRun?: Date;
}

export interface NotificationConfig {
  type: 'email' | 'webhook' | 'slack';
  config: any;
  events: ('success' | 'failure' | 'start' | 'complete')[];
  enabled: boolean;
}

// 数据可视化
export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  filters: DashboardFilter[];
  refreshInterval: number; // seconds
  shared: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'log';
  title: string;
  config: WidgetConfig;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface WidgetConfig {
  dataSource: string;
  chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  metrics: string[];
  groupBy?: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
  filters?: Record<string, any>;
  options?: any;
}

export interface DashboardLayout {
  columns: number;
  rowHeight: number;
  margin: [number, number];
  containerPadding: [number, number];
}

export interface DashboardFilter {
  id: string;
  name: string;
  type: 'select' | 'date' | 'text' | 'number';
  field: string;
  options?: any[];
  defaultValue?: any;
}

// Mock服务
export interface MockServer {
  id: string;
  name: string;
  description?: string;
  baseUrl: string;
  port: number;
  routes: MockRoute[];
  middleware: MockMiddleware[];
  settings: MockServerSettings;
  status: 'stopped' | 'starting' | 'running' | 'error';
  createdAt: Date;
  updatedAt: Date;
}

export interface MockRoute {
  id: string;
  path: string;
  method: string;
  response: MockResponse;
  delay?: number;
  enabled: boolean;
  conditions?: MockCondition[];
}

export interface MockResponse {
  status: number;
  headers: Record<string, string>;
  body: any;
  type: 'json' | 'text' | 'file' | 'template';
}

export interface MockCondition {
  type: 'header' | 'query' | 'body' | 'script';
  field?: string;
  operator: string;
  value: any;
}

export interface MockMiddleware {
  id: string;
  name: string;
  type: 'cors' | 'auth' | 'rate_limit' | 'custom';
  config: any;
  enabled: boolean;
}

export interface MockServerSettings {
  cors: {
    enabled: boolean;
    origins: string[];
    methods: string[];
    headers: string[];
  };
  logging: {
    enabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
  };
  ssl: {
    enabled: boolean;
    cert?: string;
    key?: string;
  };
}

// 系统设置和配置
export interface SystemSettings {
  id: string;
  general: GeneralSettings;
  security: SecuritySettings;
  integrations: IntegrationSettings;
  notifications: SystemNotificationSettings;
  backup: BackupSettings;
  updatedBy: string; // user ID
  updatedAt: Date;
}

export interface GeneralSettings {
  siteName: string;
  siteUrl: string;
  defaultLanguage: string;
  defaultTheme: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
}

export interface SecuritySettings {
  passwordPolicy: PasswordPolicy;
  sessionTimeout: number; // minutes
  maxLoginAttempts: number;
  lockoutDuration: number; // minutes
  twoFactorAuth: boolean;
  allowedDomains: string[];
  ipWhitelist: string[];
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  maxAge: number; // days
  preventReuse: number; // last N passwords
}

export interface IntegrationSettings {
  git: GitIntegration;
  ci: CIIntegration;
  monitoring: MonitoringIntegration;
  storage: StorageIntegration;
}

export interface GitIntegration {
  enabled: boolean;
  provider: 'github' | 'gitlab' | 'bitbucket';
  apiUrl?: string;
  token?: string;
  defaultBranch: string;
  autoSync: boolean;
}

export interface CIIntegration {
  enabled: boolean;
  provider: 'jenkins' | 'github-actions' | 'gitlab-ci' | 'azure-devops';
  webhookUrl?: string;
  apiKey?: string;
  triggerOnChange: boolean;
}

export interface MonitoringIntegration {
  enabled: boolean;
  provider: 'datadog' | 'newrelic' | 'prometheus';
  apiKey?: string;
  endpoint?: string;
  metrics: string[];
}

export interface StorageIntegration {
  enabled: boolean;
  provider: 'aws-s3' | 'azure-blob' | 'google-cloud';
  bucket: string;
  region?: string;
  accessKey?: string;
  secretKey?: string;
}

export interface SystemNotificationSettings {
  email: EmailNotificationSettings;
  slack: SlackNotificationSettings;
  webhook: WebhookNotificationSettings;
}

export interface EmailNotificationSettings {
  enabled: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  fromAddress: string;
  fromName: string;
}

export interface SlackNotificationSettings {
  enabled: boolean;
  webhookUrl: string;
  channel: string;
  username: string;
  iconEmoji: string;
}

export interface WebhookNotificationSettings {
  enabled: boolean;
  url: string;
  headers: Record<string, string>;
  events: string[];
}

export interface BackupSettings {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  retention: number; // days
  destination: DataSource;
  encryption: boolean;
  compression: boolean;
}

// 活动日志和审计
export interface ActivityLog {
  id: string;
  userId: string;
  action: ActivityAction;
  resource: ActivityResource;
  resourceId: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  error?: string;
}

export type ActivityAction = 
  | 'create' | 'read' | 'update' | 'delete'
  | 'login' | 'logout' | 'invite' | 'join'
  | 'share' | 'unshare' | 'export' | 'import'
  | 'test' | 'deploy' | 'backup' | 'restore';

export type ActivityResource = 
  | 'user' | 'team' | 'workspace' | 'collection'
  | 'request' | 'environment' | 'test' | 'settings'
  | 'share' | 'comment' | 'integration';

// 统计和分析
export interface Analytics {
  id: string;
  type: 'usage' | 'performance' | 'error' | 'user';
  period: AnalyticsPeriod;
  data: AnalyticsData;
  generatedAt: Date;
}

export interface AnalyticsPeriod {
  start: Date;
  end: Date;
  granularity: 'hour' | 'day' | 'week' | 'month';
}

export interface AnalyticsData {
  metrics: AnalyticsMetric[];
  dimensions: AnalyticsDimension[];
  filters?: AnalyticsFilter[];
}

export interface AnalyticsMetric {
  name: string;
  value: number;
  unit?: string;
  change?: number; // percentage change from previous period
  trend?: 'up' | 'down' | 'stable';
}

export interface AnalyticsDimension {
  name: string;
  values: AnalyticsDimensionValue[];
}

export interface AnalyticsDimensionValue {
  label: string;
  value: number;
  percentage: number;
}

export interface AnalyticsFilter {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'in' | 'between';
  value: any;
}

// 插件和扩展
export interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  category: PluginCategory;
  type: PluginType;
  config: PluginConfig;
  permissions: PluginPermission[];
  status: PluginStatus;
  installedAt: Date;
  updatedAt: Date;
  enabled: boolean;
}

export type PluginCategory = 'authentication' | 'testing' | 'reporting' | 'integration' | 'utility';
export type PluginType = 'builtin' | 'community' | 'custom';
export type PluginStatus = 'active' | 'inactive' | 'error' | 'updating';

export interface PluginConfig {
  settings: Record<string, any>;
  hooks: PluginHook[];
  commands: PluginCommand[];
}

export interface PluginHook {
  event: string;
  handler: string;
  priority: number;
}

export interface PluginCommand {
  name: string;
  description: string;
  handler: string;
  parameters: PluginParameter[];
}

export interface PluginParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  default?: any;
  description?: string;
}

export interface PluginPermission {
  resource: string;
  actions: string[];
  description: string;
}