'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useBulkUploadMaterials } from '@/hooks/useMaterials'
import { toast } from 'react-hot-toast'
import Papa from 'papaparse'

interface MaterialUploadProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface CSVMaterial {
  재료이름: string
  원가: string
}

interface ParsedMaterial {
  name: string
  cost: number
  supplier: string
  description: string
  unit: string
}

export function MaterialUpload({ isOpen, onClose, onSuccess }: MaterialUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<ParsedMaterial[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const bulkUpload = useBulkUploadMaterials()

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile)
      parseCSV(selectedFile)
    } else {
      toast.error('CSV 파일만 업로드 가능합니다.')
      event.target.value = ''
    }
  }

  const parseCSV = (file: File) => {
    setIsProcessing(true)
    
    Papa.parse(file, {
      header: true,
      encoding: 'UTF-8',
      complete: (results) => {
        try {
          const parsedData = results.data
            .filter((row: any) => row.재료이름 && row.원가) // 빈 행 제거
            .map((row: any) => {
              const csvRow = row as CSVMaterial
              
              // 가격에서 쉼표 제거하고 숫자로 변환
              const costStr = csvRow.원가.replace(/,/g, '').replace(/"/g, '')
              const cost = parseFloat(costStr) || 0

              return {
                name: csvRow.재료이름.trim(),
                cost,
                supplier: '',
                description: '',
                unit: 'ea',
              } as ParsedMaterial
            })

          setPreviewData(parsedData)
          setShowPreview(true)
          toast.success(`${parsedData.length}개의 재료를 파싱했습니다.`)
        } catch (error) {
          console.error('CSV 파싱 에러:', error)
          toast.error('CSV 파일 파싱 중 오류가 발생했습니다.')
        } finally {
          setIsProcessing(false)
        }
      },
      error: (error) => {
        console.error('CSV 파싱 에러:', error)
        toast.error('CSV 파일을 읽을 수 없습니다.')
        setIsProcessing(false)
      }
    })
  }

  const handleUpload = async () => {
    if (previewData.length === 0) {
      toast.error('업로드할 데이터가 없습니다.')
      return
    }

    try {
      await bulkUpload.mutateAsync(previewData)
      toast.success(`${previewData.length}개의 재료가 업로드되었습니다.`)
      handleClose()
      onSuccess?.()
    } catch (error) {
      console.error('업로드 실패:', error)
      toast.error('업로드 중 오류가 발생했습니다.')
    }
  }

  const handleClose = () => {
    setFile(null)
    setPreviewData([])
    setShowPreview(false)
    setIsProcessing(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg" title="재료 CSV 업로드">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          재료 CSV 업로드
        </h2>

        {!showPreview ? (
          <div className="space-y-6">
            {/* 파일 업로드 영역 */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="space-y-4">
                <div className="text-gray-500">
                  <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">CSV 파일을 업로드하세요</p>
                  <p className="text-sm text-gray-500">
                    재료이름, 원가 컬럼이 포함된 CSV 파일
                  </p>
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className="inline-flex items-center px-4 py-2 bg-brand-600 text-white rounded-md hover:bg-brand-700 cursor-pointer"
                  >
                    파일 선택
                  </label>
                </div>
              </div>
            </div>

            {/* 샘플 형식 안내 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">CSV 파일 형식 예시:</h3>
              <pre className="text-xs text-gray-600 overflow-x-auto">
{`재료이름,원가
보톡스 50유닛,55000
레스틸렌 1cc,99000
리쥬란 힐러 2cc,94450`}
              </pre>
            </div>

            {isProcessing && (
              <div className="text-center">
                <div className="inline-flex items-center px-4 py-2 text-sm text-gray-600">
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  파일을 처리하는 중...
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* 미리보기 헤더 */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">데이터 미리보기</h3>
                <p className="text-sm text-gray-500">
                  총 {previewData.length}개의 재료가 업로드됩니다.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPreview(false)
                  setFile(null)
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
              >
                다시 선택
              </Button>
            </div>

            {/* 데이터 테이블 */}
            <div className="max-h-96 overflow-y-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      재료명
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      원가
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      단위
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.slice(0, 50).map((material, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {material.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatCurrency(material.cost)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {material.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewData.length > 50 && (
                <div className="px-4 py-3 text-sm text-gray-500 text-center bg-gray-50">
                  처음 50개 항목만 표시됩니다. (전체 {previewData.length}개)
                </div>
              )}
            </div>
          </div>
        )}

        {/* 버튼 */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={bulkUpload.isPending}
          >
            취소
          </Button>
          {showPreview && (
            <Button
              onClick={handleUpload}
              disabled={bulkUpload.isPending || previewData.length === 0}
            >
              {bulkUpload.isPending ? '업로드 중...' : `${previewData.length}개 업로드`}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
} 