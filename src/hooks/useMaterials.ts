"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from 'react-hot-toast'
import type { 
  Material, 
  MaterialFormData, 
  MaterialFilter,
  CreateMaterialData,
  UpdateMaterialData
} from '@/types'

const queryKeys = {
  materials: ['materials'] as const,
  list: (filters?: MaterialFilter) => ['materials', 'list', filters] as const,
  detail: (id: string) => ['materials', 'detail', id] as const,
}

// 재료 목록 조회
export function useMaterials(filters?: MaterialFilter) {
  return useQuery({
    queryKey: queryKeys.list(filters),
    queryFn: async (): Promise<Material[]> => {
      let query = supabase
        .from('materials')
        .select('*')

      // 검색 필터 적용
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,supplier.ilike.%${filters.search}%`)
      }

      // 공급업체 필터
      if (filters?.supplier) {
        query = query.eq('supplier', filters.supplier)
      }

      // 가격 범위 필터
      if (filters?.cost_min !== undefined) {
        query = query.gte('cost', filters.cost_min)
      }
      if (filters?.cost_max !== undefined) {
        query = query.lte('cost', filters.cost_max)
      }

      // 정렬 적용
      if (filters?.sort_by) {
        const ascending = filters.sort_order === 'asc'
        query = query.order(filters.sort_by, { ascending })
      } else {
        query = query.order('created_at', { ascending: false })
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching materials:', error)
        throw new Error(error.message)
      }

      return data || []
    },
    staleTime: 5 * 60 * 1000, // 5분
  })
}

// 특정 재료 조회
export function useMaterial(id: string) {
  return useQuery({
    queryKey: queryKeys.detail(id),
    queryFn: async (): Promise<Material | null> => {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // 데이터 없음
        }
        throw new Error(error.message)
      }

      return data
    },
    enabled: !!id,
  })
}

// 재료 생성
export function useCreateMaterial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateMaterialData): Promise<Material> => {
      const { data: result, error } = await supabase
        .from('materials')
        .insert([data])
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return result
    },
    onSuccess: (data) => {
      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.materials })
      toast.success(`재료 "${data.name}"이(가) 성공적으로 생성되었습니다.`)
    },
    onError: (error: Error) => {
      console.error('Error creating material:', error)
      toast.error(`재료 생성 실패: ${error.message}`)
    },
  })
}

// 재료 수정
export function useUpdateMaterial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMaterialData }): Promise<Material> => {
      const { data: result, error } = await supabase
        .from('materials')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      return result
    },
    onSuccess: (data) => {
      // 캐시 업데이트
      queryClient.invalidateQueries({ queryKey: queryKeys.materials })
      queryClient.invalidateQueries({ queryKey: queryKeys.detail(data.id) })
      toast.success(`재료 "${data.name}"이(가) 성공적으로 수정되었습니다.`)
    },
    onError: (error: Error) => {
      console.error('Error updating material:', error)
      toast.error(`재료 수정 실패: ${error.message}`)
    },
  })
}

// 재료 삭제
export function useDeleteMaterial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id)

      if (error) {
        throw new Error(error.message)
      }
    },
    onSuccess: (_, id) => {
      // 캐시에서 제거
      queryClient.invalidateQueries({ queryKey: queryKeys.materials })
      queryClient.removeQueries({ queryKey: queryKeys.detail(id) })
      toast.success('재료가 성공적으로 삭제되었습니다.')
    },
    onError: (error: Error) => {
      console.error('Error deleting material:', error)
      toast.error(`재료 삭제 실패: ${error.message}`)
    },
  })
}

// 재료 일괄 업로드
export function useBulkUploadMaterials() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (materials: CreateMaterialData[]): Promise<Material[]> => {
      // 기존 재료 이름 체크
      const materialNames = materials.map(m => m.name)
      const { data: existingMaterials } = await supabase
        .from('materials')
        .select('name')
        .in('name', materialNames)

      const existingNames = new Set(existingMaterials?.map(m => m.name) || [])
      
      // 중복되지 않는 재료만 필터링
      const newMaterials = materials.filter(m => !existingNames.has(m.name))
      
      if (newMaterials.length === 0) {
        throw new Error('모든 재료가 이미 존재합니다.')
      }

      // 배치 삽입
      const { data, error } = await supabase
        .from('materials')
        .insert(newMaterials)
        .select()

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.materials })
      toast.success(`${data.length}개의 재료가 성공적으로 업로드되었습니다.`)
    },
    onError: (error: Error) => {
      console.error('Error bulk uploading materials:', error)
      toast.error(`일괄 업로드 실패: ${error.message}`)
    },
  })
}

// 공급업체 목록 조회
export function useSuppliers() {
  return useQuery({
    queryKey: ['materials', 'suppliers'],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('materials')
        .select('supplier')
        .not('supplier', 'is', null)
        .neq('supplier', '')

      if (error) {
        throw new Error(error.message)
      }

      // 중복 제거하고 정렬
      const suppliers = Array.from(new Set(
        data?.map(item => item.supplier).filter(Boolean) || []
      )).sort()

      return suppliers
    },
    staleTime: 10 * 60 * 1000, // 10분
  })
}

// 재료 통계
export function useMaterialStats() {
  return useQuery({
    queryKey: ['materials', 'stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials')
        .select('cost, supplier')

      if (error) {
        throw new Error(error.message)
      }

      const totalCount = data?.length || 0
      const costs = data?.map(m => m.cost) || []
      const suppliers = Array.from(new Set(
        data?.map(m => m.supplier).filter(Boolean) || []
      ))

      return {
        totalCount,
        supplierCount: suppliers.length,
        avgCost: costs.length > 0 ? costs.reduce((a, b) => a + b, 0) / costs.length : 0,
        minCost: costs.length > 0 ? Math.min(...costs) : 0,
        maxCost: costs.length > 0 ? Math.max(...costs) : 0,
      }
    },
    staleTime: 5 * 60 * 1000,
  })
} 