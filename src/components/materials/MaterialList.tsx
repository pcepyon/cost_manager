"use client"

import React, { useState } from 'react'
import { useMaterials, useDeleteMaterial } from '@/hooks/useMaterials'
import { MaterialFilter as MaterialFilterComponent } from './MaterialFilter'
import { DataTable } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Material, MaterialFilter as MaterialFilterType, TableColumn } from '@/types'

interface MaterialListProps {
  onEdit?: (material: Material) => void
  onAdd?: () => void
  onUpload?: () => void
}

export function MaterialList({ onEdit, onAdd, onUpload }: MaterialListProps) {
  const [filters, setFilters] = useState<MaterialFilterType>({
    search: '',
    sort_by: 'created_at',
    sort_order: 'desc',
  })

  const { data: materials = [], isLoading } = useMaterials(filters)
  const deleteMaterial = useDeleteMaterial()

  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search }))
  }

  const handleSort = (key: string, order: 'asc' | 'desc') => {
    setFilters(prev => ({
      ...prev,
      sort_by: key as any,
      sort_order: order,
    }))
  }

  const handleDelete = async (material: Material) => {
    if (window.confirm(`"${material.name}" 재료를 삭제하시겠습니까?`)) {
      deleteMaterial.mutate(material.id)
    }
  }

  const columns: TableColumn<Material>[] = [
    {
      key: 'name',
      label: '재료명',
      sortable: true,
      render: (value: string) => (
        <div className="font-medium text-gray-900">{value}</div>
      ),
    },
    {
      key: 'cost',
      label: '원가',
      sortable: true,
      render: (value: number) => (
        <div className="text-right font-mono">
          {formatCurrency(value)}
        </div>
      ),
      className: 'text-right',
    },
    {
      key: 'supplier',
      label: '공급업체',
      sortable: true,
      render: (value: string) => (
        <div className="text-gray-600">
          {value || '-'}
        </div>
      ),
    },
    {
      key: 'unit',
      label: '단위',
      render: (value: string) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {value}
        </span>
      ),
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
      render: (_, material: Material) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit?.(material)}
          >
            수정
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => handleDelete(material)}
            disabled={deleteMaterial.isPending}
          >
            삭제
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">재료 관리</h2>
          <p className="text-gray-600">시술에 사용되는 재료들을 관리합니다.</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={onUpload}>
            📊 CSV 업로드
          </Button>
          <Button onClick={onAdd}>
            + 재료 추가
          </Button>
        </div>
      </div>

      {/* 고급 필터 */}
      <MaterialFilterComponent
        filters={filters}
        onFiltersChange={setFilters}
        onReset={() => setFilters({
          search: '',
          sort_by: 'created_at',
          sort_order: 'desc',
        })}
      />

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm font-medium text-gray-500">총 재료</div>
          <div className="text-2xl font-bold text-gray-900">
            {materials.length}개
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm font-medium text-gray-500">평균 원가</div>
          <div className="text-2xl font-bold text-gray-900">
            {materials.length > 0 
              ? formatCurrency(materials.reduce((sum, m) => sum + m.cost, 0) / materials.length)
              : '₩0'
            }
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm font-medium text-gray-500">최고 원가</div>
          <div className="text-2xl font-bold text-gray-900">
            {materials.length > 0 
              ? formatCurrency(Math.max(...materials.map(m => m.cost)))
              : '₩0'
            }
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm font-medium text-gray-500">공급업체</div>
          <div className="text-2xl font-bold text-gray-900">
            {Array.from(new Set(materials.map(m => m.supplier).filter(Boolean))).length}개
          </div>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-lg border">
        <DataTable
          data={materials}
          columns={columns}
          loading={isLoading}
          onSort={handleSort}
          sortBy={filters.sort_by}
          sortOrder={filters.sort_order}
          emptyMessage="등록된 재료가 없습니다."
        />
      </div>
    </div>
  )
} 