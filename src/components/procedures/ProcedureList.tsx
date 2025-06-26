"use client"

import React, { useState } from 'react'
import { useProcedures, useDeleteProcedure, useProcedureStats } from '@/hooks/useProcedures'
import { DataTable } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ProcedureFilter } from './ProcedureFilter'
import type { Procedure, ProcedureFilter as ProcedureFilterType, TableColumn } from '@/types'

interface ProcedureListProps {
  onEdit?: (procedure: Procedure) => void
  onAdd?: () => void
  onUpload?: () => void
}

export function ProcedureList({ onEdit, onAdd, onUpload }: ProcedureListProps) {
  const [filters, setFilters] = useState<ProcedureFilterType>({
    search: '',
    sort_by: 'created_at',
    sort_order: 'desc',
  })

  const { data: procedures = [], isLoading } = useProcedures(filters)
  const { data: stats } = useProcedureStats()
  const deleteProcedure = useDeleteProcedure()

  const handleSort = (key: string, order: 'asc' | 'desc') => {
    setFilters(prev => ({
      ...prev,
      sort_by: key as any,
      sort_order: order,
    }))
  }

  const handleDelete = async (procedure: Procedure) => {
    if (window.confirm(`"${procedure.name}" 시술을 삭제하시겠습니까?`)) {
      deleteProcedure.mutate(procedure.id)
    }
  }

  const getMarginColor = (marginPercentage: number) => {
    if (marginPercentage >= 70) return 'text-green-600 bg-green-50'
    if (marginPercentage >= 50) return 'text-yellow-600 bg-yellow-50'
    if (marginPercentage >= 30) return 'text-orange-600 bg-orange-50'
    return 'text-red-600 bg-red-50'
  }

  const columns: TableColumn<Procedure>[] = [
    {
      key: 'name',
      label: '시술명',
      sortable: true,
      render: (value: string, procedure: Procedure) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">
            {procedure.category?.name || '미분류'}
          </div>
        </div>
      ),
    },
    {
      key: 'customer_price',
      label: '고객가격',
      sortable: true,
      render: (value: number) => (
        <div className="text-right font-mono font-medium">
          {formatCurrency(value)}
        </div>
      ),
      className: 'text-right',
    },
    {
      key: 'material_cost',
      label: '재료원가',
      sortable: true,
      render: (value: number) => (
        <div className="text-right font-mono text-gray-600">
          {formatCurrency(value)}
        </div>
      ),
      className: 'text-right',
    },
    {
      key: 'margin',
      label: '마진',
      sortable: true,
      render: (value: number) => (
        <div className="text-right font-mono font-medium text-green-600">
          {formatCurrency(value)}
        </div>
      ),
      className: 'text-right',
    },
    {
      key: 'margin_percentage',
      label: '마진율',
      sortable: true,
      render: (value: number) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMarginColor(value)}`}>
          {value.toFixed(1)}%
        </span>
      ),
    },
    {
      key: 'procedure_materials',
      label: '사용재료',
      render: (_, procedure: Procedure) => {
        const materialCount = procedure.procedure_materials?.length || 0
        return (
          <div className="text-sm text-gray-500">
            {materialCount > 0 ? `${materialCount}개 재료` : '재료 없음'}
          </div>
        )
      },
    },
    {
      key: 'created_at',
      label: '등록일',
      sortable: true,
      render: (value: string) => (
        <div className="text-sm text-gray-500">
          {formatDate(value)}
        </div>
      ),
    },
    {
      key: 'actions',
      label: '작업',
      render: (_, procedure: Procedure) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit?.(procedure)}
          >
            수정
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleDelete(procedure)}
            disabled={deleteProcedure.isPending}
          >
            삭제
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">시술 관리</h2>
          <p className="text-gray-600">시술별 원가 및 마진을 관리합니다.</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={onUpload}>
            📊 CSV 업로드
          </Button>
          <Button onClick={onAdd}>
            + 시술 추가
          </Button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-500">총 시술</div>
          <div className="text-2xl font-bold text-gray-900">
            {stats?.total_procedures || 0}개
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-500">평균 가격</div>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(stats?.average_price || 0)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-500">평균 마진</div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(stats?.average_margin || 0)}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-500">평균 마진율</div>
          <div className="text-2xl font-bold text-green-600">
            {(stats?.average_margin_percentage || 0).toFixed(1)}%
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm font-medium text-gray-500">가격 범위</div>
          <div className="text-xs text-gray-900">
            <div>최고: {formatCurrency(stats?.highest_price || 0)}</div>
            <div>최저: {formatCurrency(stats?.lowest_price || 0)}</div>
          </div>
        </Card>
      </div>

      {/* 필터 */}
      <ProcedureFilter
        filters={filters}
        onFiltersChange={setFilters}
        onReset={() => setFilters({
          search: '',
          sort_by: 'created_at',
          sort_order: 'desc',
        })}
      />

      {/* 카테고리별 통계 */}
      {stats?.category_stats && stats.category_stats.length > 0 && (
        <Card className="p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">카테고리별 통계</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stats.category_stats.map((categoryStat, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-700">
                  {categoryStat.category_name}
                </div>
                <div className="text-lg font-bold text-gray-900">
                  {categoryStat.procedure_count}개
                </div>
                <div className="text-xs text-green-600">
                  평균 마진: {formatCurrency(categoryStat.average_margin)}
                </div>
                <div className="text-xs text-blue-600">
                  총 매출: {formatCurrency(categoryStat.total_revenue)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 테이블 */}
      <Card>
        <DataTable
          data={procedures}
          columns={columns}
          loading={isLoading}
          onSort={handleSort}
          sortBy={filters.sort_by}
          sortOrder={filters.sort_order}
          emptyMessage="등록된 시술이 없습니다."
        />
      </Card>
    </div>
  )
} 