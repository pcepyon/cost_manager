import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5분
      gcTime: 10 * 60 * 1000, // 10분 (이전 cacheTime)
    },
    mutations: {
      retry: 1,
    },
  },
})

// React Query 키 상수들
export const queryKeys = {
  materials: {
    all: ['materials'] as const,
    list: (filters?: any) => ['materials', 'list', filters] as const,
    detail: (id: string) => ['materials', 'detail', id] as const,
  },
  procedures: {
    all: ['procedures'] as const,
    list: (filters?: any) => ['procedures', 'list', filters] as const,
    detail: (id: string) => ['procedures', 'detail', id] as const,
  },
  categories: {
    all: ['categories'] as const,
    list: () => ['categories', 'list'] as const,
    detail: (id: string) => ['categories', 'detail', id] as const,
  },
  dashboard: {
    stats: () => ['dashboard', 'stats'] as const,
    marginDistribution: () => ['dashboard', 'margin-distribution'] as const,
    categoryStats: () => ['dashboard', 'category-stats'] as const,
  },
} as const 