'use client'

import React, { useState, useEffect } from 'react'
import { useCreateProcedure, useUpdateProcedure, useCategories } from '@/hooks/useProcedures'
import { useMaterials } from '@/hooks/useMaterials'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'
import { X, Plus } from 'lucide-react'
import type { Procedure, ProcedureFormData } from '@/types'

interface ProcedureFormProps {
  procedure?: Procedure
  onSuccess?: () => void
  onCancel?: () => void
}

interface ProcedureMaterialInput {
  material_id: string
  quantity: number
}

export function ProcedureForm({ procedure, onSuccess, onCancel }: ProcedureFormProps) {
  const [formData, setFormData] = useState<ProcedureFormData>({
    name: '',
    category_id: '',
    customer_price: 0,
    description: '',
    materials: []
  })
  
  const [materialInputs, setMaterialInputs] = useState<ProcedureMaterialInput[]>([
    { material_id: '', quantity: 1 }
  ])

  const { data: categories = [] } = useCategories()
  const { data: materials = [] } = useMaterials({})
  const createProcedure = useCreateProcedure()
  const updateProcedure = useUpdateProcedure()

  const isEditing = !!procedure
  const isLoading = createProcedure.isPending || updateProcedure.isPending

  // 편집 모드일 때 초기 데이터 설정
  useEffect(() => {
    if (procedure) {
      setFormData({
        name: procedure.name,
        category_id: procedure.category_id,
        customer_price: procedure.customer_price,
        description: procedure.description || '',
        materials: procedure.procedure_materials?.map(pm => ({
          material_id: pm.material?.id || '',
          quantity: pm.quantity
        })) || []
      })

      // 시술에 연결된 재료들로 materialInputs 설정
      if (procedure.procedure_materials && procedure.procedure_materials.length > 0) {
        setMaterialInputs(
          procedure.procedure_materials.map(pm => ({
            material_id: pm.material?.id || '',
            quantity: pm.quantity
          }))
        )
      }
    }
  }, [procedure])

  const handleInputChange = (field: keyof ProcedureFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleMaterialChange = (index: number, field: keyof ProcedureMaterialInput, value: any) => {
    const newMaterials = [...materialInputs]
    newMaterials[index] = {
      ...newMaterials[index],
      [field]: value
    }
    setMaterialInputs(newMaterials)
  }

  const addMaterialInput = () => {
    setMaterialInputs(prev => [...prev, { material_id: '', quantity: 1 }])
  }

  const removeMaterialInput = (index: number) => {
    if (materialInputs.length > 1) {
      setMaterialInputs(prev => prev.filter((_, i) => i !== index))
    }
  }

  const calculateEstimatedCost = () => {
    return materialInputs.reduce((total, input) => {
      const material = materials.find(m => m.id === input.material_id)
      return total + (material?.cost || 0) * input.quantity
    }, 0)
  }

  const calculateEstimatedMargin = () => {
    const cost = calculateEstimatedCost()
    return formData.customer_price - cost
  }

  const calculateEstimatedMarginPercentage = () => {
    if (formData.customer_price === 0) return 0
    return (calculateEstimatedMargin() / formData.customer_price) * 100
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 유효성 검사
    if (!formData.name.trim()) {
      alert('시술명을 입력해주세요.')
      return
    }

    if (!formData.category_id) {
      alert('카테고리를 선택해주세요.')
      return
    }

    if (formData.customer_price <= 0) {
      alert('올바른 고객가격을 입력해주세요.')
      return
    }

    // 유효한 재료만 필터링
    const validMaterials = materialInputs.filter(
      input => input.material_id && input.quantity > 0
    )

    const submitData: ProcedureFormData = {
      ...formData,
      materials: validMaterials
    }

    try {
      if (isEditing) {
        await updateProcedure.mutateAsync({
          id: procedure.id,
          data: submitData
        })
      } else {
        await createProcedure.mutateAsync(submitData)
      }
      onSuccess?.()
    } catch (error) {
      console.error('시술 저장 실패:', error)
    }
  }

  const marginPercentage = calculateEstimatedMarginPercentage()
  const getMarginColor = () => {
    if (marginPercentage >= 70) return 'text-green-600'
    if (marginPercentage >= 50) return 'text-yellow-600'
    if (marginPercentage >= 30) return 'text-orange-600'
    return 'text-red-600'
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 기본 정보 */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">기본 정보</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                시술명 *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="시술명을 입력하세요"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                카테고리 *
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => handleInputChange('category_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                required
              >
                <option value="">카테고리를 선택하세요</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                고객가격 *
              </label>
              <Input
                type="number"
                value={formData.customer_price || ''}
                onChange={(e) => handleInputChange('customer_price', parseFloat(e.target.value) || 0)}
                placeholder="0"
                min="0"
                step="1000"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설명
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="시술에 대한 설명을 입력하세요"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
          </div>
        </Card>

        {/* 마진 계산 미리보기 */}
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">마진 계산 미리보기</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">고객가격:</span>
              <span className="font-mono font-medium">
                {formatCurrency(formData.customer_price)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">예상 재료비:</span>
              <span className="font-mono text-gray-600">
                {formatCurrency(calculateEstimatedCost())}
              </span>
            </div>
            
            <hr />
            
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">예상 마진:</span>
              <span className={`font-mono font-bold ${getMarginColor()}`}>
                {formatCurrency(calculateEstimatedMargin())}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-700">예상 마진율:</span>
              <span className={`font-mono font-bold ${getMarginColor()}`}>
                {marginPercentage.toFixed(1)}%
              </span>
            </div>

            {marginPercentage < 30 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-xs text-red-600">
                  ⚠️ 마진율이 30% 미만입니다. 가격 조정을 검토해보세요.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 사용 재료 */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">사용 재료</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addMaterialInput}
            className="flex items-center space-x-1"
          >
            <Plus className="h-4 w-4" />
            <span>재료 추가</span>
          </Button>
        </div>

        <div className="space-y-3">
          {materialInputs.map((input, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="flex-1">
                <select
                  value={input.material_id}
                  onChange={(e) => handleMaterialChange(index, 'material_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                >
                  <option value="">재료를 선택하세요</option>
                  {materials.map(material => (
                    <option key={material.id} value={material.id}>
                      {material.name} ({formatCurrency(material.cost)})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="w-24">
                <Input
                  type="number"
                  value={input.quantity}
                  onChange={(e) => handleMaterialChange(index, 'quantity', parseFloat(e.target.value) || 1)}
                  placeholder="수량"
                  min="0.1"
                  step="0.1"
                />
              </div>

              {materialInputs.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeMaterialInput(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}

          {materialInputs.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              재료를 추가하여 정확한 마진을 계산하세요.
            </p>
          )}
        </div>
      </Card>

      {/* 액션 버튼 */}
      <div className="flex justify-end space-x-3">
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
          className="min-w-[100px]"
        >
          {isLoading ? '저장 중...' : isEditing ? '수정' : '등록'}
        </Button>
      </div>
    </form>
  )
} 