'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useSuppliers } from '@/hooks/useMaterials'
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react'
import type { MaterialFilter as MaterialFilterType } from '@/types'

interface MaterialFilterProps {
  filters: MaterialFilterType
  onFiltersChange: (filters: MaterialFilterType) => void
  onReset: () => void
}

export function MaterialFilter({ filters, onFiltersChange, onReset }: MaterialFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { data: suppliers = [] } = useSuppliers()

  const handleFilterChange = (key: keyof MaterialFilterType, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    })
  }

  const handleCostRangeChange = (type: 'min' | 'max', value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value)
    onFiltersChange({
      ...filters,
      cost_range: {
        ...filters.cost_range,
        [type]: numValue,
      },
    })
  }

  const hasActiveFilters = () => {
    return filters.search ||
           filters.supplier ||
           filters.unit ||
           filters.cost_range?.min ||
           filters.cost_range?.max
  }

  const getFilterCount = () => {
    let count = 0
    if (filters.search) count++
    if (filters.supplier) count++
    if (filters.unit) count++
    if (filters.cost_range?.min || filters.cost_range?.max) count++
    return count
  }

  const units = ['ea', 'cc', 'ml', 'g', 'kg', 'L', 'box', 'set', 'pcs', 'unit', 'shot', 'pen']

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* 기본 검색 */}
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <Input
              placeholder="재료명, 공급업체, 설명으로 검색..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full"
            />
          </div>
          
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>고급 필터</span>
            {hasActiveFilters() && (
              <span className="bg-brand-500 text-white text-xs rounded-full px-2 py-1 ml-1">
                {getFilterCount()}
              </span>
            )}
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>

          {hasActiveFilters() && (
            <Button
              variant="outline"
              onClick={onReset}
              className="flex items-center space-x-1 text-gray-500 hover:text-red-600"
            >
              <X className="h-4 w-4" />
              <span>초기화</span>
            </Button>
          )}
        </div>

        {/* 고급 필터 */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            {/* 공급업체 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                공급업체
              </label>
              <select
                value={filters.supplier || ''}
                onChange={(e) => handleFilterChange('supplier', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              >
                <option value="">전체</option>
                {suppliers.map(supplier => (
                  <option key={supplier} value={supplier}>
                    {supplier}
                  </option>
                ))}
              </select>
            </div>

            {/* 단위 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                단위
              </label>
              <select
                value={filters.unit || ''}
                onChange={(e) => handleFilterChange('unit', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              >
                <option value="">전체</option>
                {units.map(unit => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>

            {/* 정렬 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                정렬
              </label>
              <select
                value={`${filters.sort_by}-${filters.sort_order}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-')
                  onFiltersChange({
                    ...filters,
                    sort_by: sortBy as any,
                    sort_order: sortOrder as 'asc' | 'desc',
                  })
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              >
                <option value="created_at-desc">최신 등록순</option>
                <option value="created_at-asc">오래된 순</option>
                <option value="name-asc">이름 오름차순</option>
                <option value="name-desc">이름 내림차순</option>
                <option value="cost-desc">가격 높은순</option>
                <option value="cost-asc">가격 낮은순</option>
                <option value="supplier-asc">공급업체 순</option>
              </select>
            </div>

            {/* 원가 범위 */}
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                원가 범위 (₩)
              </label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  placeholder="최소"
                  value={filters.cost_range?.min || ''}
                  onChange={(e) => handleCostRangeChange('min', e.target.value)}
                  className="flex-1"
                />
                <span className="text-gray-500">~</span>
                <Input
                  type="number"
                  placeholder="최대"
                  value={filters.cost_range?.max || ''}
                  onChange={(e) => handleCostRangeChange('max', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        )}

        {/* 활성 필터 표시 */}
        {hasActiveFilters() && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <span className="text-sm text-gray-500">활성 필터:</span>
            
            {filters.search && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-100 text-brand-800">
                검색: "{filters.search}"
                <button
                  onClick={() => handleFilterChange('search', '')}
                  className="ml-1.5 inline-flex items-center justify-center h-3 w-3 rounded-full text-brand-600 hover:bg-brand-200"
                >
                  <X className="h-2 w-2" />
                </button>
              </span>
            )}

            {filters.supplier && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                공급업체: {filters.supplier}
                <button
                  onClick={() => handleFilterChange('supplier', undefined)}
                  className="ml-1.5 inline-flex items-center justify-center h-3 w-3 rounded-full text-blue-600 hover:bg-blue-200"
                >
                  <X className="h-2 w-2" />
                </button>
              </span>
            )}

            {filters.unit && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                단위: {filters.unit}
                <button
                  onClick={() => handleFilterChange('unit', undefined)}
                  className="ml-1.5 inline-flex items-center justify-center h-3 w-3 rounded-full text-green-600 hover:bg-green-200"
                >
                  <X className="h-2 w-2" />
                </button>
              </span>
            )}

            {(filters.cost_range?.min || filters.cost_range?.max) && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                원가: {filters.cost_range?.min ? `₩${filters.cost_range.min.toLocaleString()}` : '₩0'} ~ {filters.cost_range?.max ? `₩${filters.cost_range.max.toLocaleString()}` : '∞'}
                <button
                  onClick={() => handleFilterChange('cost_range', {})}
                  className="ml-1.5 inline-flex items-center justify-center h-3 w-3 rounded-full text-purple-600 hover:bg-purple-200"
                >
                  <X className="h-2 w-2" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </Card>
  )
} 