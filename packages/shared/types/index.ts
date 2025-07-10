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
}

export interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  duration: number;
  size: number;
}

export interface ApiCollection {
  id: string;
  name: string;
  description?: string;
  requests: RequestConfig[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Environment {
  id: string;
  name: string;
  variables: Record<string, string>;
  isActive: boolean;
}

export interface HistoryRecord {
  id: string;
  request: RequestConfig;
  response?: ResponseData;
  timestamp: Date;
  success: boolean;
}