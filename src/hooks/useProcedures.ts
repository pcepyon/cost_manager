'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import type { 
  Procedure, 
  ProcedureFilter, 
  CreateProcedureData, 
  UpdateProcedureData,
  ProcedureFormData,
  CategoryStats 
} from '@/types'

// 쿼리 키 상수
const QUERY_KEYS = {
  PROCEDURES: 'procedures',
  PROCEDURE: 'procedure',
  CATEGORIES: 'categories',
  PROCEDURE_STATS: 'procedureStats',
} as const

// 시술 목록 조회
export function useProcedures(filters: ProcedureFilter = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.PROCEDURES, filters],
    queryFn: async () => {
      let query = supabase
        .from('procedures')
        .select(`
          *,
          category:categories(*),
          procedure_materials(
            id,
            quantity,
            cost_per_unit,
            material:materials(*)
          )
        `)

      // 검색 필터
      if (filters.search) {
        query = query.ilike('name', `%${filters.search}%`)
      }

      // 카테고리 필터
      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id)
      }

      // 마진 범위 필터
      if (filters.margin_min !== undefined) {
        query = query.gte('margin', filters.margin_min)
      }
      if (filters.margin_max !== undefined) {
        query = query.lte('margin', filters.margin_max)
      }

      // 가격 범위 필터
      if (filters.price_min !== undefined) {
        query = query.gte('customer_price', filters.price_min)
      }
      if (filters.price_max !== undefined) {
        query = query.lte('customer_price', filters.price_max)
      }

      // 정렬
      const sortBy = filters.sort_by || 'created_at'
      const sortOrder = filters.sort_order || 'desc'
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })

      const { data, error } = await query

      if (error) {
        console.error('시술 목록 조회 실패:', error)
        throw new Error('시술 목록을 불러올 수 없습니다.')
      }

      return data as Procedure[]
    },
    staleTime: 5 * 60 * 1000, // 5분
  })
}

// 개별 시술 조회
export function useProcedure(id: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.PROCEDURE, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('procedures')
        .select(`
          *,
          category:categories(*),
          procedure_materials(
            id,
            quantity,
            cost_per_unit,
            material:materials(*)
          )
        `)
        .eq('id', id)
        .single()

      if (error) {
        console.error('시술 조회 실패:', error)
        throw new Error('시술 정보를 불러올 수 없습니다.')
      }

      return data as Procedure
    },
    enabled: !!id,
  })
}

// 카테고리 목록 조회
export function useCategories() {
  return useQuery({
    queryKey: [QUERY_KEYS.CATEGORIES],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) {
        console.error('카테고리 조회 실패:', error)
        throw new Error('카테고리를 불러올 수 없습니다.')
      }

      return data
    },
    staleTime: 10 * 60 * 1000, // 10분
  })
}

// 시술 생성
export function useCreateProcedure() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: ProcedureFormData) => {
      // 1. 시술 정보 생성
      const { data: procedure, error: procedureError } = await supabase
        .from('procedures')
        .insert({
          name: data.name,
          category_id: data.category_id,
          customer_price: data.customer_price,
          description: data.description,
          material_cost: 0, // 초기값, 나중에 계산
          margin: 0, // 초기값, 나중에 계산
          margin_percentage: 0, // 초기값, 나중에 계산
        })
        .select()
        .single()

      if (procedureError) {
        console.error('시술 생성 실패:', procedureError)
        throw new Error('시술 생성에 실패했습니다.')
      }

      // 2. 시술-재료 연결 정보 생성
      if (data.materials && data.materials.length > 0) {
        const procedureMaterials = data.materials.map(material => ({
          procedure_id: procedure.id,
          material_id: material.material_id,
          quantity: material.quantity,
          cost_per_unit: 0, // 재료의 실제 원가로 나중에 업데이트
        }))

        const { error: materialsError } = await supabase
          .from('procedure_materials')
          .insert(procedureMaterials)

        if (materialsError) {
          console.error('시술-재료 연결 실패:', materialsError)
          // 시술 삭제 (롤백)
          await supabase.from('procedures').delete().eq('id', procedure.id)
          throw new Error('시술-재료 연결에 실패했습니다.')
        }

        // 3. 재료 원가 및 마진 계산
        await calculateProcedureCosts(procedure.id)
      }

      return procedure
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROCEDURES] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROCEDURE_STATS] })
      toast.success('시술이 성공적으로 생성되었습니다.')
    },
    onError: (error) => {
      console.error('시술 생성 에러:', error)
      toast.error(error.message || '시술 생성 중 오류가 발생했습니다.')
    },
  })
}

// 시술 수정
export function useUpdateProcedure() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProcedureFormData }) => {
      // 1. 시술 정보 업데이트
      const { data: procedure, error: procedureError } = await supabase
        .from('procedures')
        .update({
          name: data.name,
          category_id: data.category_id,
          customer_price: data.customer_price,
          description: data.description,
        })
        .eq('id', id)
        .select()
        .single()

      if (procedureError) {
        console.error('시술 수정 실패:', procedureError)
        throw new Error('시술 수정에 실패했습니다.')
      }

      // 2. 기존 시술-재료 연결 삭제
      await supabase.from('procedure_materials').delete().eq('procedure_id', id)

      // 3. 새로운 시술-재료 연결 생성
      if (data.materials && data.materials.length > 0) {
        const procedureMaterials = data.materials.map(material => ({
          procedure_id: id,
          material_id: material.material_id,
          quantity: material.quantity,
          cost_per_unit: 0,
        }))

        const { error: materialsError } = await supabase
          .from('procedure_materials')
          .insert(procedureMaterials)

        if (materialsError) {
          console.error('시술-재료 연결 실패:', materialsError)
          throw new Error('시술-재료 연결에 실패했습니다.')
        }
      }

      // 4. 재료 원가 및 마진 재계산
      await calculateProcedureCosts(id)

      return procedure
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROCEDURES] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROCEDURE] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROCEDURE_STATS] })
      toast.success('시술이 성공적으로 수정되었습니다.')
    },
    onError: (error) => {
      console.error('시술 수정 에러:', error)
      toast.error(error.message || '시술 수정 중 오류가 발생했습니다.')
    },
  })
}

// 시술 삭제
export function useDeleteProcedure() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // 연결된 시술-재료 데이터도 함께 삭제 (CASCADE)
      const { error } = await supabase
        .from('procedures')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('시술 삭제 실패:', error)
        throw new Error('시술 삭제에 실패했습니다.')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROCEDURES] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROCEDURE_STATS] })
      toast.success('시술이 삭제되었습니다.')
    },
    onError: (error) => {
      console.error('시술 삭제 에러:', error)
      toast.error(error.message || '시술 삭제 중 오류가 발생했습니다.')
    },
  })
}

// CSV 일괄 업로드
export function useBulkUploadProcedures() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (procedures: CreateProcedureData[]) => {
      const results = []

      for (const procedureData of procedures) {
        try {
          // 시술 생성
          const { data: procedure, error } = await supabase
            .from('procedures')
            .insert({
              name: procedureData.name,
              category_id: procedureData.category_id,
              customer_price: procedureData.customer_price,
              description: procedureData.description,
              material_cost: 0,
              margin: 0,
              margin_percentage: 0,
            })
            .select()
            .single()

          if (error) {
            console.error(`시술 생성 실패 (${procedureData.name}):`, error)
            continue
          }

          results.push(procedure)
        } catch (error) {
          console.error(`시술 업로드 에러 (${procedureData.name}):`, error)
        }
      }

      return results
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROCEDURES] })
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PROCEDURE_STATS] })
      toast.success(`${results.length}개의 시술이 업로드되었습니다.`)
    },
    onError: (error) => {
      console.error('시술 일괄 업로드 에러:', error)
      toast.error('시술 업로드 중 오류가 발생했습니다.')
    },
  })
}

// 시술 통계 조회
export function useProcedureStats() {
  return useQuery({
    queryKey: [QUERY_KEYS.PROCEDURE_STATS],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('procedures')
        .select(`
          id,
          customer_price,
          material_cost,
          margin,
          margin_percentage,
          category:categories(name)
        `)

      if (error) {
        console.error('시술 통계 조회 실패:', error)
        throw new Error('시술 통계를 불러올 수 없습니다.')
      }

      const procedures = data as Procedure[]
      
      return {
        total_procedures: procedures.length,
        average_price: procedures.length > 0 
          ? procedures.reduce((sum, p) => sum + p.customer_price, 0) / procedures.length 
          : 0,
        average_margin: procedures.length > 0 
          ? procedures.reduce((sum, p) => sum + p.margin, 0) / procedures.length 
          : 0,
        average_margin_percentage: procedures.length > 0 
          ? procedures.reduce((sum, p) => sum + p.margin_percentage, 0) / procedures.length 
          : 0,
        highest_price: procedures.length > 0 
          ? Math.max(...procedures.map(p => p.customer_price)) 
          : 0,
        lowest_price: procedures.length > 0 
          ? Math.min(...procedures.map(p => p.customer_price)) 
          : 0,
        category_stats: getCategoryStats(procedures),
      }
    },
    staleTime: 5 * 60 * 1000, // 5분
  })
}

// 헬퍼 함수들

// 시술의 재료 원가 및 마진 계산
async function calculateProcedureCosts(procedureId: string) {
  try {
    // 1. 시술과 연결된 재료들의 총 원가 계산
    const { data: procedureMaterials, error: materialsError } = await supabase
      .from('procedure_materials')
      .select(`
        quantity,
        material:materials(cost)
      `)
      .eq('procedure_id', procedureId)

    if (materialsError) {
      console.error('재료 조회 실패:', materialsError)
      return
    }

    // 2. 각 재료의 cost_per_unit 업데이트 및 총 원가 계산
    let totalMaterialCost = 0
    
    for (const pm of procedureMaterials) {
      const materialCost = pm.material?.cost || 0
      totalMaterialCost += materialCost * pm.quantity

      // cost_per_unit 업데이트
      await supabase
        .from('procedure_materials')
        .update({ cost_per_unit: materialCost })
        .eq('procedure_id', procedureId)
        .eq('material_id', pm.material?.id)
    }

    // 3. 시술의 customer_price 조회
    const { data: procedure, error: procedureError } = await supabase
      .from('procedures')
      .select('customer_price')
      .eq('id', procedureId)
      .single()

    if (procedureError) {
      console.error('시술 조회 실패:', procedureError)
      return
    }

    // 4. 마진 계산
    const margin = procedure.customer_price - totalMaterialCost
    const marginPercentage = procedure.customer_price > 0 
      ? (margin / procedure.customer_price) * 100 
      : 0

    // 5. 시술 정보 업데이트
    await supabase
      .from('procedures')
      .update({
        material_cost: totalMaterialCost,
        margin: margin,
        margin_percentage: marginPercentage,
      })
      .eq('id', procedureId)

  } catch (error) {
    console.error('원가 계산 실패:', error)
  }
}

// 카테고리별 통계 계산
function getCategoryStats(procedures: Procedure[]): CategoryStats[] {
  const categoryMap = new Map<string, {
    name: string
    procedures: Procedure[]
  }>()

  procedures.forEach(procedure => {
    const categoryName = procedure.category?.name || '미분류'
    
    if (!categoryMap.has(categoryName)) {
      categoryMap.set(categoryName, {
        name: categoryName,
        procedures: []
      })
    }
    
    categoryMap.get(categoryName)!.procedures.push(procedure)
  })

  return Array.from(categoryMap.values()).map(({ name, procedures }) => ({
    category_name: name,
    procedure_count: procedures.length,
    average_margin: procedures.length > 0 
      ? procedures.reduce((sum, p) => sum + p.margin, 0) / procedures.length 
      : 0,
    total_revenue: procedures.reduce((sum, p) => sum + p.customer_price, 0),
  }))
} 