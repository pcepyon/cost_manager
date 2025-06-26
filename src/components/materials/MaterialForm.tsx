"use client"

import React, { useState, useEffect } from 'react'
import { useCreateMaterial, useUpdateMaterial, useSuppliers } from '@/hooks/useMaterials'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { parseAmount } from '@/lib/utils'
import type { Material, MaterialFormData } from '@/types'

interface MaterialFormProps {
  material?: Material
  onSuccess?: () => void
  onCancel?: () => void
}

export function MaterialForm({ material, onSuccess, onCancel }: MaterialFormProps) {
  const [formData, setFormData] = useState<MaterialFormData>({
    name: '',
    cost: 0,
    supplier: '',
    description: '',
    unit: 'ea',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const createMaterial = useCreateMaterial()
  const updateMaterial = useUpdateMaterial()
  const { data: suppliers = [] } = useSuppliers()

  const isEditing = !!material
  const isLoading = createMaterial.isPending || updateMaterial.isPending

  // 수정 모드일 때 폼 데이터 초기화
  useEffect(() => {
    if (material) {
      setFormData({
        name: material.name,
        cost: material.cost,
        supplier: material.supplier || '',
        description: material.description || '',
        unit: material.unit,
      })
    }
  }, [material])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = '재료명을 입력해주세요.'
    }

    if (isNaN(formData.cost) || formData.cost <= 0) {
      newErrors.cost = '원가는 0보다 큰 숫자여야 합니다.'
    }

    if (!formData.unit.trim()) {
      newErrors.unit = '단위를 입력해주세요.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      if (isEditing) {
        await updateMaterial.mutateAsync({
          id: material!.id,
          data: formData,
        })
      } else {
        await createMaterial.mutateAsync(formData)
      }
      onSuccess?.()
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const handleInputChange = (field: keyof MaterialFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // 에러 제거
    if (errors[field]) {
      const newErrors = { ...errors }
      delete newErrors[field]
      setErrors(newErrors)
    }
  }

  const handleCostChange = (value: string) => {
    const numericValue = parseFloat(value) || 0
    handleInputChange('cost', numericValue)
  }

  const units = ['ea', 'ml', 'g', 'kg', 'L', 'box', 'set', 'pcs']

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 재료명 */}
        <div className="md:col-span-2">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            재료명 *
          </label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="재료명을 입력하세요"
            error={errors.name}
            required
          />
        </div>

        {/* 원가 */}
        <div>
          <label htmlFor="cost" className="block text-sm font-medium text-gray-700 mb-2">
            원가 (₩) *
          </label>
                     <Input
             id="cost"
             type="number"
             step="0.01"
             min="0"
             value={formData.cost.toString()}
             onChange={(e) => handleCostChange(e.target.value)}
             placeholder="0"
             error={errors.cost}
             required
           />
        </div>

        {/* 단위 */}
        <div>
          <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-2">
            단위 *
          </label>
          <select
            id="unit"
            value={formData.unit}
            onChange={(e) => handleInputChange('unit', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            required
          >
            {units.map(unit => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
          {errors.unit && (
            <p className="mt-1 text-sm text-red-600">{errors.unit}</p>
          )}
        </div>

        {/* 공급업체 */}
        <div className="md:col-span-2">
          <label htmlFor="supplier" className="block text-sm font-medium text-gray-700 mb-2">
            공급업체
          </label>
          <div className="relative">
            <Input
              id="supplier"
              value={formData.supplier}
              onChange={(e) => handleInputChange('supplier', e.target.value)}
              placeholder="공급업체를 입력하세요"
              list="suppliers"
            />
            <datalist id="suppliers">
              {suppliers.map(supplier => (
                <option key={supplier} value={supplier} />
              ))}
            </datalist>
          </div>
        </div>

        {/* 설명 */}
        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            설명
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="재료에 대한 추가 설명을 입력하세요"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>
      </div>

      {/* 버튼 */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          취소
        </Button>
                 <Button
           type="submit"
           disabled={isLoading}
         >
           {isLoading ? '처리 중...' : (isEditing ? '수정' : '생성')}
         </Button>
      </div>
    </form>
  )
} 