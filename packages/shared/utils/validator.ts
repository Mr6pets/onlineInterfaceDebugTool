// 数据验证工具
export class Validator {
  static isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  static isValidJson(str: string): boolean {
    try {
      JSON.parse(str)
      return true
    } catch {
      return false
    }
  }

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  static isValidHttpMethod(method: string): boolean {
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
    return validMethods.includes(method.toUpperCase())
  }

  static validateRequestConfig(config: any): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!config.url) {
      errors.push('URL不能为空')
    } else if (!this.isValidUrl(config.url) && !config.url.startsWith('/')) {
      errors.push('URL格式不正确')
    }

    if (!config.method) {
      errors.push('请求方法不能为空')
    } else if (!this.isValidHttpMethod(config.method)) {
      errors.push('请求方法不正确')
    }

    if (config.data && typeof config.data === 'string' && !this.isValidJson(config.data)) {
      errors.push('请求体JSON格式不正确')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
}