/**
 * Utility functions for date and time operations
 */

/**
 * Get current date and time in Vietnamese format
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted date and time string
 */
export function getCurrentDateTime(options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Ho_Chi_Minh'
  }

  const formatOptions = { ...defaultOptions, ...options }
  return new Date().toLocaleString('vi-VN', formatOptions)
}

/**
 * Get current date only in Vietnamese format
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted date string
 */
export function getCurrentDate(options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh'
  }

  const formatOptions = { ...defaultOptions, ...options }
  return new Date().toLocaleDateString('vi-VN', formatOptions)
}

/**
 * Get current time only in Vietnamese format
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted time string
 */
export function getCurrentTime(options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Ho_Chi_Minh'
  }

  const formatOptions = { ...defaultOptions, ...options }
  return new Date().toLocaleTimeString('vi-VN', formatOptions)
}

/**
 * Format a date to Vietnamese format
 * @param date - Date object or date string
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Ho_Chi_Minh'
  }

  const formatOptions = { ...defaultOptions, ...options }
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('vi-VN', formatOptions)
}

/**
 * Format a date and time to Vietnamese format
 * @param date - Date object or date string
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted date and time string
 */
export function formatDateTime(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Ho_Chi_Minh'
  }

  const formatOptions = { ...defaultOptions, ...options }
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleString('vi-VN', formatOptions)
}

/**
 * Get relative time (e.g., "2 giờ trước", "3 ngày trước")
 * @param date - Date object or date string
 * @returns Relative time string in Vietnamese
 */
export function getRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'Vừa xong'
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} phút trước`
  }

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) {
    return `${diffInHours} giờ trước`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return `${diffInDays} ngày trước`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths < 12) {
    return `${diffInMonths} tháng trước`
  }

  const diffInYears = Math.floor(diffInMonths / 12)
  return `${diffInYears} năm trước`
}

/**
 * Get timestamp in milliseconds
 * @returns Current timestamp
 */
export function getTimestamp(): number {
  return Date.now()
}

/**
 * Get timestamp in seconds
 * @returns Current timestamp in seconds
 */
export function getTimestampSeconds(): number {
  return Math.floor(Date.now() / 1000)
}

/**
 * Check if a date is today
 * @param date - Date object or date string
 * @returns True if the date is today
 */
export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const today = new Date()
  
  return dateObj.getDate() === today.getDate() &&
         dateObj.getMonth() === today.getMonth() &&
         dateObj.getFullYear() === today.getFullYear()
}

/**
 * Check if a date is yesterday
 * @param date - Date object or date string
 * @returns True if the date is yesterday
 */
export function isYesterday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  
  return dateObj.getDate() === yesterday.getDate() &&
         dateObj.getMonth() === yesterday.getMonth() &&
         dateObj.getFullYear() === yesterday.getFullYear()
}

/**
 * Get start and end of day for a given date
 * @param date - Date object or date string (optional, defaults to today)
 * @returns Object with start and end of day
 */
export function getDayRange(date?: Date | string): { start: Date; end: Date } {
  const dateObj = date ? (typeof date === 'string' ? new Date(date) : date) : new Date()
  
  const start = new Date(dateObj)
  start.setHours(0, 0, 0, 0)
  
  const end = new Date(dateObj)
  end.setHours(23, 59, 59, 999)
  
  return { start, end }
}
