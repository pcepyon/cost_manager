'use client'

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { CategoryStats, DashboardStats } from '@/types'

// 쿼리 키 상수
const QUERY_KEYS = {
  DASHBOARD_STATS: 'dashboardStats',
  CATEGORY_STATS: 'categoryStats',
} as const

// 대시보드 전체 통계
export function useDashboardStats() {
  return useQuery({
    queryKey: [QUERY_KEYS.DASHBOARD_STATS],
    queryFn: async (): Promise<DashboardStats> => {
      try {
        // 병렬로 모든 데이터 조회
        const [materialsResult, proceduresResult, categoriesResult] = await Promise.all([
          supabase.from('materials').select('id, cost'),
          supabase.from('procedures').select('id, customer_price, margin, margin_percentage'),
          supabase.from('categories').select('id')
        ])

        if (materialsResult.error) {
          console.error('재료 데이터 조회 실패:', materialsResult.error)
          throw new Error(`재료 데이터를 불러올 수 없습니다: ${materialsResult.error.message}`)
        }
        if (proceduresResult.error) {
          console.error('시술 데이터 조회 실패:', proceduresResult.error)
          throw new Error(`시술 데이터를 불러올 수 없습니다: ${proceduresResult.error.message}`)
        }
        if (categoriesResult.error) {
          console.error('카테고리 데이터 조회 실패:', categoriesResult.error)
          throw new Error(`카테고리 데이터를 불러올 수 없습니다: ${categoriesResult.error.message}`)
        }

      const materials = materialsResult.data || []
      const procedures = proceduresResult.data || []
      const categories = categoriesResult.data || []

      // 통계 계산
      const totalMaterials = materials.length
      const totalProcedures = procedures.length
      const totalCategories = categories.length
      
      const totalRevenue = procedures.reduce((sum: number, p: any) => sum + p.customer_price, 0)
      const averageMargin = procedures.length > 0 
        ? procedures.reduce((sum: number, p: any) => sum + p.margin_percentage, 0) / procedures.length 
        : 0
      
      const marginPercentages = procedures.map((p: any) => p.margin_percentage)
      const highestMargin = marginPercentages.length > 0 ? Math.max(...marginPercentages) : 0
      const lowestMargin = marginPercentages.length > 0 ? Math.min(...marginPercentages) : 0
      const totalCost = procedures.reduce((sum: number, p: any) => sum + (p.customer_price - p.margin), 0)

              return {
          total_materials: totalMaterials,
          total_procedures: totalProcedures,
          total_categories: totalCategories,
          average_margin: averageMargin,
          highest_margin: highestMargin,
          lowest_margin: lowestMargin,
          total_revenue: totalRevenue,
          total_cost: totalCost
        }
      } catch (error) {
        console.error('대시보드 통계 조회 중 오류 발생:', error)
        throw error
      }
    },
    staleTime: 5 * 60 * 1000, // 5분
  })
}

// 카테고리별 통계
export function useCategoryStats() {
  return useQuery({
    queryKey: [QUERY_KEYS.CATEGORY_STATS],
    queryFn: async (): Promise<CategoryStats[]> => {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          id,
          name,
          procedures (
            id,
            customer_price,
            margin,
            margin_percentage
          )
        `)
        .order('display_order')

      if (error) throw error

      return (data || []).map((category: any) => {
        const procedures = category.procedures || []
        const procedureCount = procedures.length
        const totalRevenue = procedures.reduce((sum: number, p: any) => sum + p.customer_price, 0)
        const averageMargin = procedureCount > 0 
          ? procedures.reduce((sum: number, p: any) => sum + p.margin_percentage, 0) / procedureCount 
          : 0

        return {
          category_name: category.name,
          procedure_count: procedureCount,
          average_margin: averageMargin,
          total_revenue: totalRevenue
        }
      })
    },
    staleTime: 5 * 60 * 1000, // 5분
  })
}

// 마진 분포 분석
export function useMarginDistribution() {
  return useQuery({
    queryKey: ['marginDistribution'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('procedures')
        .select('margin_percentage')

      if (error) throw error

      const procedures = data || []
      const total = procedures.length

      if (total === 0) {
        return []
      }

      // 마진율 구간별 분류
      const ranges = [
        { range: '70% 이상', min: 70, max: 100 },
        { range: '50-70%', min: 50, max: 70 },
        { range: '30-50%', min: 30, max: 50 },
        { range: '30% 미만', min: 0, max: 30 }
      ]

      return ranges.map(range => {
        const count = procedures.filter((p: any) => 
          p.margin_percentage >= range.min && 
          (range.max === 100 ? p.margin_percentage <= range.max : p.margin_percentage < range.max)
        ).length

        return {
          range: range.range,
          count,
          percentage: (count / total) * 100
        }
      })
    },
    staleTime: 5 * 60 * 1000, // 5분
  })
}

// 수익성이 낮은 시술 조회 (마진율 30% 미만)
export function useLowMarginProcedures() {
  return useQuery({
    queryKey: ['lowMarginProcedures'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('procedures')
        .select(`
          id,
          name,
          customer_price,
          margin,
          margin_percentage,
          category:categories(name)
        `)
        .lt('margin_percentage', 30)
        .order('margin_percentage', { ascending: true })
        .limit(10)

      if (error) throw error

      return data || []
    },
    staleTime: 5 * 60 * 1000, // 5분
  })
}

// 인기 시술 (가격 기준 상위)
export function useTopProcedures() {
  return useQuery({
    queryKey: ['topProcedures'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('procedures')
        .select(`
          id,
          name,
          customer_price,
          margin,
          margin_percentage,
          category:categories(name)
        `)
        .order('customer_price', { ascending: false })
        .limit(10)

      if (error) throw error

      return data || []
    },
    staleTime: 5 * 60 * 1000, // 5분
  })
} 