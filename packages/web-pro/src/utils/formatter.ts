/**
 * 日期时间格式化工具函数
 */

/**
 * 格式化日期
 * @param date 日期字符串或Date对象
 * @param format 格式类型
 * @returns 格式化后的日期字符串
 */
export function formatDate(date: string | Date | number, format: 'full' | 'date' | 'time' | 'datetime' = 'date'): string {
  if (!date) return '-'
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  
  switch (format) {
    case 'full':
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
    case 'date':
      return `${year}-${month}-${day}`
    case 'time':
      return `${hours}:${minutes}:${seconds}`
    case 'datetime':
      return `${year}-${month}-${day} ${hours}:${minutes}`
    default:
      return `${year}-${month}-${day}`
  }
}

/**
 * 格式化时间
 * @param time 时间字符串或Date对象或时间戳
 * @param includeSeconds 是否包含秒
 * @returns 格式化后的时间字符串
 */
export function formatTime(time: string | Date | number, includeSeconds: boolean = true): string {
  if (!time) return '-'
  
  const d = new Date(time)
  if (isNaN(d.getTime())) return '-'
  
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  
  return includeSeconds ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}`
}

/**
 * 格式化相对时间
 * @param date 日期字符串或Date对象
 * @returns 相对时间字符串
 */
export function formatRelativeTime(date: string | Date | number): string {
  if (!date) return '-'
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'
  
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  
  // 转换为秒
  const seconds = Math.floor(diff / 1000)
  
  if (seconds < 60) {
    return '刚刚'
  }
  
  // 转换为分钟
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `${minutes}分钟前`
  }
  
  // 转换为小时
  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return `${hours}小时前`
  }
  
  // 转换为天
  const days = Math.floor(hours / 24)
  if (days < 7) {
    return `${days}天前`
  }
  
  // 转换为周
  const weeks = Math.floor(days / 7)
  if (weeks < 4) {
    return `${weeks}周前`
  }
  
  // 转换为月
  const months = Math.floor(days / 30)
  if (months < 12) {
    return `${months}个月前`
  }
  
  // 转换为年
  const years = Math.floor(days / 365)
  return `${years}年前`
}