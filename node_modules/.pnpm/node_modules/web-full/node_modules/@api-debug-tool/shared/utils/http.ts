// 共享HTTP工具类
import type { RequestConfig, ResponseData } from '../types';

export class HttpClient {
  private baseURL: string = '';
  private defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  setBaseURL(url: string) {
    this.baseURL = url;
  }

  setDefaultHeaders(headers: Record<string, string>) {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }

  async request(config: RequestConfig): Promise<ResponseData> {
    const startTime = Date.now();
    const url = this.baseURL + config.url;
    
    const requestInit: RequestInit = {
      method: config.method,
      headers: {
        ...this.defaultHeaders,
        ...config.headers
      }
    };

    if (config.data && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
      requestInit.body = typeof config.data === 'string' 
        ? config.data 
        : JSON.stringify(config.data);
    }

    try {
      const response = await fetch(url, requestInit);
      const duration = Date.now() - startTime;
      const responseText = await response.text();
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      return {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData,
        duration,
        size: new Blob([responseText]).size
      };
    } catch (error) {
      throw new Error(`Request failed: ${error}`);
    }
  }
}

export const httpClient = new HttpClient();