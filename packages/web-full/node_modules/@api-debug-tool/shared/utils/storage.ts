// 本地存储工具
export class StorageManager {
  private prefix: string

  constructor(prefix: string = 'api-debug-tool') {
    this.prefix = prefix
  }

  private getKey(key: string): string {
    return `${this.prefix}:${key}`
  }

  set<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value)
      localStorage.setItem(this.getKey(key), serialized)
    } catch (error) {
      console.error('Storage set error:', error)
    }
  }

  get<T>(key: string, defaultValue?: T): T | undefined {
    try {
      const item = localStorage.getItem(this.getKey(key))
      if (item === null) return defaultValue
      return JSON.parse(item) as T
    } catch (error) {
      console.error('Storage get error:', error)
      return defaultValue
    }
  }

  remove(key: string): void {
    localStorage.removeItem(this.getKey(key))
  }

  clear(): void {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key)
      }
    })
  }

  // 获取所有相关键
  getAllKeys(): string[] {
    const keys = Object.keys(localStorage)
    return keys
      .filter(key => key.startsWith(this.prefix))
      .map(key => key.replace(`${this.prefix}:`, ''))
  }
}

export const storage = new StorageManager()