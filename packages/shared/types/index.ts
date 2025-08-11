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

// Pro版本新增类型

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

// 团队协作
export interface Team {
  id: string;
  name: string;
  description?: string;
  members: TeamMember[];
  workspaces: string[]; // workspace IDs
  settings: TeamSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  permissions: Permission[];
  joinedAt: Date;
  lastActiveAt?: Date;
}

export interface Permission {
  resource: 'workspace' | 'collection' | 'environment' | 'test';
  actions: ('read' | 'write' | 'delete' | 'share')[];
}

export interface TeamSettings {
  allowGuestAccess: boolean;
  requireApproval: boolean;
  defaultRole: TeamMember['role'];
  maxMembers: number;
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