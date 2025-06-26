'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useCategories } from '@/hooks/useProcedures'
import { ChevronDown, ChevronUp, Filter, X } from 'lucide-react'
import type { ProcedureFilter as ProcedureFilterType } from '@/types'

interface ProcedureFilterProps {
  filters: ProcedureFilterType
  onFiltersChange: (filters: ProcedureFilterType) => void
  onReset: () => void
}

export function ProcedureFilter({ filters, onFiltersChange, onReset }: ProcedureFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { data: categories = [] } = useCategories()

  const handleFilterChange = (key: keyof ProcedureFilterType, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    })
  }

  const handleRangeChange = (type: 'margin_min' | 'margin_max' | 'price_min' | 'price_max', value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value)
    onFiltersChange({
      ...filters,
      [type]: numValue,
    })
  }

  const hasActiveFilters = () => {
    return filters.search ||
           filters.category_id ||
           filters.margin_min ||
           filters.margin_max ||
           filters.price_min ||
           filters.price_max
  }

  const getFilterCount = () => {
    let count = 0
    if (filters.search) count++
    if (filters.category_id) count++
    if (filters.margin_min || filters.margin_max) count++
    if (filters.price_min || filters.price_max) count++
    return count
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* 기본 검색 */}
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <Input
              placeholder="시술명으로 검색..."
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            {/* 카테고리 필터 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                카테고리
              </label>
              <select
                value={filters.category_id || ''}
                onChange={(e) => handleFilterChange('category_id', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              >
                <option value="">전체 카테고리</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
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
                <option value="name-asc">시술명 오름차순</option>
                <option value="name-desc">시술명 내림차순</option>
                <option value="customer_price-desc">고객가격 높은순</option>
                <option value="customer_price-asc">고객가격 낮은순</option>
                <option value="margin-desc">마진 높은순</option>
                <option value="margin-asc">마진 낮은순</option>
                <option value="margin_percentage-desc">마진율 높은순</option>
                <option value="margin_percentage-asc">마진율 낮은순</option>
              </select>
            </div>

            {/* 빈 공간 */}
            <div></div>

            {/* 고객가격 범위 */}
            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                고객가격 범위 (₩)
              </label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  placeholder="최소 가격"
                  value={filters.price_min || ''}
                  onChange={(e) => handleRangeChange('price_min', e.target.value)}
                  className="flex-1"
                />
                <span className="text-gray-500">~</span>
                <Input
                  type="number"
                  placeholder="최대 가격"
                  value={filters.price_max || ''}
                  onChange={(e) => handleRangeChange('price_max', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            {/* 마진 범위 */}
            <div className="md:col-span-2 lg:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                마진 범위 (₩)
              </label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  placeholder="최소 마진"
                  value={filters.margin_min || ''}
                  onChange={(e) => handleRangeChange('margin_min', e.target.value)}
                  className="flex-1"
                />
                <span className="text-gray-500">~</span>
                <Input
                  type="number"
                  placeholder="최대 마진"
                  value={filters.margin_max || ''}
                  onChange={(e) => handleRangeChange('margin_max', e.target.value)}
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

            {filters.category_id && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                카테고리: {categories.find(c => c.id === filters.category_id)?.name}
                <button
                  onClick={() => handleFilterChange('category_id', undefined)}
                  className="ml-1.5 inline-flex items-center justify-center h-3 w-3 rounded-full text-blue-600 hover:bg-blue-200"
                >
                  <X className="h-2 w-2" />
                </button>
              </span>
            )}

            {(filters.price_min || filters.price_max) && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                가격: {filters.price_min ? `₩${filters.price_min.toLocaleString()}` : '₩0'} ~ {filters.price_max ? `₩${filters.price_max.toLocaleString()}` : '∞'}
                <button
                  onClick={() => {
                    onFiltersChange({
                      ...filters,
                      price_min: undefined,
                      price_max: undefined,
                    })
                  }}
                  className="ml-1.5 inline-flex items-center justify-center h-3 w-3 rounded-full text-green-600 hover:bg-green-200"
                >
                  <X className="h-2 w-2" />
                </button>
              </span>
            )}

            {(filters.margin_min || filters.margin_max) && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                마진: {filters.margin_min ? `₩${filters.margin_min.toLocaleString()}` : '₩0'} ~ {filters.margin_max ? `₩${filters.margin_max.toLocaleString()}` : '∞'}
                <button
                  onClick={() => {
                    onFiltersChange({
                      ...filters,
                      margin_min: undefined,
                      margin_max: undefined,
                    })
                  }}
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