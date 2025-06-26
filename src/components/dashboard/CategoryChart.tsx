'use client'

import React from 'react'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import type { CategoryStats } from '@/types'

interface CategoryChartProps {
  categories: CategoryStats[]
  isLoading?: boolean
}

export function CategoryChart({ categories, isLoading = false }: CategoryChartProps) {

  const getMarginColor = (margin: number) => {
    if (margin >= 70) return 'bg-green-500'
    if (margin >= 50) return 'bg-yellow-500'
    if (margin >= 30) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getMarginTextColor = (margin: number) => {
    if (margin >= 70) return 'text-green-600'
    if (margin >= 50) return 'text-yellow-600'
    if (margin >= 30) return 'text-orange-600'
    return 'text-red-600'
  }

  const maxProcedureCount = Math.max(...categories.map(c => c.procedure_count), 1)
  const maxRevenue = Math.max(...categories.map(c => c.total_revenue), 1)

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 시술 개수 차트 */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">카테고리별 시술 개수</h3>
        <div className="space-y-4">
          {categories.map((category, index) => {
            const percentage = (category.procedure_count / maxProcedureCount) * 100
            return (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    {category.category_name}
                  </span>
                  <span className="text-sm text-gray-600">
                    {category.procedure_count}개
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-brand-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* 매출 차트 */}
      <Card className="p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">카테고리별 예상 매출</h3>
        <div className="space-y-4">
          {categories.map((category, index) => {
            const percentage = (category.total_revenue / maxRevenue) * 100
            return (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">
                    {category.category_name}
                  </span>
                  <span className="text-sm text-gray-600 font-mono">
                    {formatCurrency(category.total_revenue)}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* 마진율 분석 */}
      <Card className="p-6 lg:col-span-2">
        <h3 className="text-lg font-medium text-gray-900 mb-6">카테고리별 마진율 분석</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category, index) => (
            <div 
              key={index}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900 text-sm">
                  {category.category_name}
                </h4>
                <div className={`w-3 h-3 rounded-full ${getMarginColor(category.average_margin)}`} />
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">시술 수:</span>
                  <span className="font-medium">{category.procedure_count}개</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">평균 마진율:</span>
                  <span className={`font-bold ${getMarginTextColor(category.average_margin)}`}>
                    {category.average_margin.toFixed(1)}%
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">예상 매출:</span>
                  <span className="font-mono text-xs">
                    {formatCurrency(category.total_revenue)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">평균 가격:</span>
                  <span className="font-mono text-xs">
                    {formatCurrency(category.procedure_count > 0 ? category.total_revenue / category.procedure_count : 0)}
                  </span>
                </div>
              </div>

              {/* 마진율 진행바 */}
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>마진율</span>
                  <span>{category.average_margin.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${getMarginColor(category.average_margin)}`}
                    style={{ width: `${Math.min(category.average_margin, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
} 