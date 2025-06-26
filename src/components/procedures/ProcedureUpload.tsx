'use client'

import React, { useState, useRef } from 'react'
import { useBulkUploadProcedures, useCategories } from '@/hooks/useProcedures'
import { useMaterials } from '@/hooks/useMaterials'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Upload, Download, FileText, AlertCircle, CheckCircle, X } from 'lucide-react'
import type { CreateProcedureData } from '@/types'

interface ProcedureUploadProps {
  onSuccess?: () => void
  onCancel?: () => void
}

interface ParsedProcedure extends Omit<CreateProcedureData, 'materials'> {
  rowIndex: number
  errors: string[]
  warnings: string[]
  materials: {
    material_id: string
    quantity: number
  }[]
}

export function ProcedureUpload({ onSuccess, onCancel }: ProcedureUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedProcedure[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: categories = [] } = useCategories()
  const { data: materials = [] } = useMaterials({})
  const bulkUpload = useBulkUploadProcedures()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      parseCSVFile(selectedFile)
    }
  }

  const parseCSVFile = async (file: File) => {
    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        setParseErrors(['CSV 파일에 데이터가 없습니다.'])
        return
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      const requiredHeaders = ['분류', '시술명', '고객가']
      const missingHeaders = requiredHeaders.filter(header => !headers.includes(header))
      
      if (missingHeaders.length > 0) {
        setParseErrors([`필수 헤더가 누락되었습니다: ${missingHeaders.join(', ')}`])
        return
      }

      const parsed: ParsedProcedure[] = []
      const errors: string[] = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
        const row: Record<string, string> = {}
        
        headers.forEach((header, index) => {
          row[header] = values[index] || ''
        })

        const procedure: ParsedProcedure = {
          name: '',
          category_id: '',
          customer_price: 0,
          description: '',
          materials: [],
          rowIndex: i,
          errors: [],
          warnings: []
        }

        // 시술명 검증
        if (!row['시술명']) {
          procedure.errors.push('시술명이 필요합니다')
        } else {
          procedure.name = row['시술명']
        }

        // 카테고리 검증 및 매핑
        const categoryName = row['분류']
        if (!categoryName) {
          procedure.errors.push('카테고리가 필요합니다')
        } else {
          const category = categories.find(c => c.name === categoryName)
          if (category) {
            procedure.category_id = category.id
          } else {
            procedure.errors.push(`알 수 없는 카테고리: ${categoryName}`)
          }
        }

        // 고객가격 검증
        const priceStr = row['고객가']?.replace(/[,₩]/g, '')
        const price = parseFloat(priceStr)
        if (!priceStr || isNaN(price) || price <= 0) {
          procedure.errors.push('올바른 고객가격이 필요합니다')
        } else {
          procedure.customer_price = price
        }

        // 재료 처리 (재료1~재료5)
        const procedureMaterials: string[] = []
        for (let j = 1; j <= 5; j++) {
          const materialName = row[`재료${j}`]
          if (materialName) {
            procedureMaterials.push(materialName.trim())
            
            // 재료가 존재하는지 확인
            const material = materials.find(m => 
              m.name.toLowerCase().includes(materialName.toLowerCase()) ||
              materialName.toLowerCase().includes(m.name.toLowerCase())
            )
            if (!material) {
              procedure.warnings.push(`재료를 찾을 수 없음: ${materialName}`)
            }
          }
        }

        // 설명 생성
        procedure.description = procedureMaterials.length > 0 
          ? `사용 재료: ${procedureMaterials.join(', ')}`
          : '재료 정보 없음'

        // 마진 계산 경고
        if (procedureMaterials.length === 0) {
          procedure.warnings.push('재료 정보가 없어 마진 계산이 불가합니다')
        }

        parsed.push(procedure)
      }

      setParsedData(parsed)
      setParseErrors([])
      
    } catch (error) {
      console.error('CSV 파싱 에러:', error)
      setParseErrors(['CSV 파일을 읽는 중 오류가 발생했습니다.'])
    }
  }

  const handleUpload = async () => {
    const validProcedures = parsedData.filter(p => p.errors.length === 0)
    
    if (validProcedures.length === 0) {
      alert('업로드할 수 있는 유효한 데이터가 없습니다.')
      return
    }

    if (window.confirm(`${validProcedures.length}개의 시술을 업로드하시겠습니까?`)) {
      setIsUploading(true)
      try {
        await bulkUpload.mutateAsync(validProcedures)
        onSuccess?.()
      } catch (error) {
        console.error('업로드 실패:', error)
      } finally {
        setIsUploading(false)
      }
    }
  }

  const downloadTemplate = () => {
    const headers = ['분류', '시술명', '고객가', '재료1', '재료2', '재료3', '재료4', '재료5']
    const sampleData = [
      ['보톡스', '이마 보톡스 50유닛', '150000', '보톡스 50유닛', '', '', '', ''],
      ['필러', '레스틸렌 1cc', '400000', '레스틸렌 1cc', '', '', '', ''],
      ['7월이벤트', '7월e) 비타민 수액', '50000', '비타민 앰플', '생리식염수', '', '', '']
    ]

    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = '시술_업로드_템플릿.csv'
    link.click()
  }

  const getRowStatus = (procedure: ParsedProcedure) => {
    if (procedure.errors.length > 0) return 'error'
    if (procedure.warnings.length > 0) return 'warning'
    return 'success'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'error':
        return <X className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return null
    }
  }

  const validCount = parsedData.filter(p => p.errors.length === 0).length
  const errorCount = parsedData.filter(p => p.errors.length > 0).length
  const warningCount = parsedData.filter(p => p.warnings.length > 0 && p.errors.length === 0).length

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">시술 CSV 업로드</h2>
          <p className="text-sm text-gray-600">CSV 파일을 통해 시술 데이터를 일괄 업로드합니다.</p>
        </div>
        <Button
          variant="outline"
          onClick={downloadTemplate}
          className="flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>템플릿 다운로드</span>
        </Button>
      </div>

      {/* 파일 업로드 */}
      <Card className="p-6">
        <div className="text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {!file ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <Button onClick={() => fileInputRef.current?.click()}>
                  CSV 파일 선택
                </Button>
                <p className="mt-2 text-sm text-gray-500">
                  또는 파일을 여기로 드래그하세요
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="h-6 w-6 text-blue-500" />
                <div className="text-left">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFile(null)
                  setParsedData([])
                  setParseErrors([])
                }}
              >
                다시 선택
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* 파싱 에러 */}
      {parseErrors.length > 0 && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center space-x-2 text-red-800 mb-2">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">파일 파싱 실패</span>
          </div>
          <ul className="text-sm text-red-700 space-y-1">
            {parseErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </Card>
      )}

      {/* 파싱 결과 요약 */}
      {parsedData.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{validCount}</div>
            <div className="text-sm text-gray-600">업로드 가능</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
            <div className="text-sm text-gray-600">경고</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{errorCount}</div>
            <div className="text-sm text-gray-600">오류</div>
          </Card>
        </div>
      )}

      {/* 파싱 결과 테이블 */}
      {parsedData.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">파싱 결과</h3>
          <div className="max-h-96 overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    상태
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    행
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    시술명
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    카테고리
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    가격
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    메시지
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {parsedData.map((procedure, index) => {
                  const status = getRowStatus(procedure)
                  return (
                    <tr key={index} className={status === 'error' ? 'bg-red-50' : status === 'warning' ? 'bg-yellow-50' : ''}>
                      <td className="px-3 py-2">
                        {getStatusIcon(status)}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {procedure.rowIndex}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {procedure.name || '-'}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {categories.find(c => c.id === procedure.category_id)?.name || '-'}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {procedure.customer_price.toLocaleString()}원
                      </td>
                      <td className="px-3 py-2 text-sm">
                        {procedure.errors.length > 0 && (
                          <div className="text-red-600 text-xs">
                            {procedure.errors.join(', ')}
                          </div>
                        )}
                        {procedure.warnings.length > 0 && (
                          <div className="text-yellow-600 text-xs">
                            {procedure.warnings.join(', ')}
                          </div>
                        )}
                        {procedure.errors.length === 0 && procedure.warnings.length === 0 && (
                          <span className="text-green-600 text-xs">정상</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 액션 버튼 */}
      <div className="flex justify-end space-x-3">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isUploading}
        >
          취소
        </Button>
        
        {validCount > 0 && (
          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className="min-w-[120px]"
          >
            {isUploading ? '업로드 중...' : `${validCount}개 업로드`}
          </Button>
        )}
      </div>
    </div>
  )
} 