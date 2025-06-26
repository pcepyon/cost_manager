import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 숫자 포맷팅 함수들
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount)
}

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('ko-KR').format(num)
}

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`
}

// 문자열 파싱 함수들
export const parseAmount = (value: string): number => {
  // "55,000" 또는 "55,000.00" → 55000
  const cleaned = value.replace(/[,\s]/g, '').replace(/\.00$/, '')
  return parseFloat(cleaned) || 0
}

export const parseCurrency = (value: string): number => {
  // "₩55,000" → 55000
  const cleaned = value.replace(/[₩,\s]/g, '').replace(/\.00$/, '')
  return parseFloat(cleaned) || 0
}

// 마진 계산 함수들
export const calculateMargin = (customerPrice: number, materialCost: number): number => {
  return customerPrice - materialCost
}

export const calculateMarginPercentage = (customerPrice: number, materialCost: number): number => {
  if (customerPrice === 0) return 0
  return ((customerPrice - materialCost) / customerPrice) * 100
}

export const calculateBreakEvenPrice = (materialCost: number, targetMarginPercent: number = 30): number => {
  return materialCost / (1 - targetMarginPercent / 100)
}

// 날짜 포맷팅 함수들
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('ko-KR')
}

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('ko-KR')
}

export const formatDateToISO = (date: Date): string => {
  return date.toISOString()
}

// 배열 및 객체 유틸리티
export const groupBy = <T, K extends keyof any>(
  array: T[],
  key: (item: T) => K
): Record<K, T[]> => {
  return array.reduce((result, item) => {
    const group = key(item)
    if (!result[group]) {
      result[group] = []
    }
    result[group].push(item)
    return result
  }, {} as Record<K, T[]>)
}

export const sortBy = <T>(
  array: T[],
  key: keyof T | ((item: T) => any),
  order: 'asc' | 'desc' = 'asc'
): T[] => {
  const sorted = [...array].sort((a, b) => {
    const aValue = typeof key === 'function' ? key(a) : a[key]
    const bValue = typeof key === 'function' ? key(b) : b[key]
    
    if (aValue < bValue) return order === 'asc' ? -1 : 1
    if (aValue > bValue) return order === 'asc' ? 1 : -1
    return 0
  })
  
  return sorted
}

// 필터링 유틸리티
export const filterBySearch = <T>(
  items: T[],
  searchTerm: string,
  keys: (keyof T)[]
): T[] => {
  if (!searchTerm.trim()) return items
  
  const lowerSearchTerm = searchTerm.toLowerCase()
  
  return items.filter(item =>
    keys.some(key => {
      const value = item[key]
      return value && 
        String(value).toLowerCase().includes(lowerSearchTerm)
    })
  )
}

// 페이지네이션 유틸리티
export const paginate = <T>(
  items: T[],
  page: number,
  limit: number
): {
  data: T[];
  totalPages: number;
  currentPage: number;
  totalItems: number;
} => {
  const offset = (page - 1) * limit
  const paginatedItems = items.slice(offset, offset + limit)
  
  return {
    data: paginatedItems,
    totalPages: Math.ceil(items.length / limit),
    currentPage: page,
    totalItems: items.length,
  }
}

// 파일 관련 유틸리티
export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type)
}

export const validateFileSize = (file: File, maxSizeInMB: number): boolean => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024
  return file.size <= maxSizeInBytes
}

export const getFileExtension = (filename: string): string => {
  return filename.slice(filename.lastIndexOf('.') + 1).toLowerCase()
}

// 색상 유틸리티
export const generateRandomColor = (): string => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

export const hexToRgba = (hex: string, alpha: number = 1): string => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

// 디바운스 함수
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

// 로컬 스토리지 유틸리티 (클라이언트 사이드에서만)
export const storage = {
  get: (key: string) => {
    if (typeof window === 'undefined') return null
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  },
  
  set: (key: string, value: any) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // 에러 무시 (저장 공간 부족 등)
    }
  },
  
  remove: (key: string) => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(key)
  }
}

// 수익성 분석 함수
export const analyzeProfitability = (
  customerPrice: number,
  materialCost: number
): {
  margin: number;
  marginPercentage: number;
  riskLevel: 'low' | 'medium' | 'high';
  suggestions: string[];
} => {
  const margin = calculateMargin(customerPrice, materialCost)
  const marginPercentage = calculateMarginPercentage(customerPrice, materialCost)
  
  let riskLevel: 'low' | 'medium' | 'high' = 'low'
  const suggestions: string[] = []
  
  if (marginPercentage < 20) {
    riskLevel = 'high'
    suggestions.push('마진율이 20% 미만입니다. 가격 인상을 검토하세요.')
    suggestions.push('재료비 절감 방안을 찾아보세요.')
  } else if (marginPercentage < 40) {
    riskLevel = 'medium'
    suggestions.push('마진율이 평균 이하입니다. 최적화를 고려하세요.')
  } else {
    suggestions.push('좋은 마진율을 유지하고 있습니다.')
  }
  
  if (materialCost === 0) {
    suggestions.push('재료비가 설정되지 않았습니다.')
  }
  
  return {
    margin,
    marginPercentage,
    riskLevel,
    suggestions
  }
}

// CSV 관련 유틸리티
export const downloadCSV = (data: any[], filename: string) => {
  if (typeof window === 'undefined') return
  
  const headers = Object.keys(data[0] || {})
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // 값에 쉼표가 있으면 따옴표로 감싸기
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
} 