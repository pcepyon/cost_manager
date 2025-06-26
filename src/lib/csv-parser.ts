import Papa from 'papaparse'
import type { Material, Procedure, CreateMaterialData, CreateProcedureData } from '@/types'

// 시술 CSV 파싱
export function parseProceduresCSV(csvContent: string): Promise<CreateProcedureData[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
      complete: (results) => {
        try {
          const procedures: CreateProcedureData[] = []

          results.data.forEach((row: any, index: number) => {
            try {
              // 필드 검증
              if (!row['분류'] || !row['시술명'] || !row['고객가']) {
                console.warn(`행 ${index + 1}: 필수 필드 누락`, row)
                return
              }

              // 고객가 파싱 (콤마 제거)
              const customerPriceStr = String(row['고객가']).replace(/[,₩]/g, '')
              const customerPrice = parseFloat(customerPriceStr)

              if (isNaN(customerPrice) || customerPrice <= 0) {
                console.warn(`행 ${index + 1}: 잘못된 고객가격`, row['고객가'])
                return
              }

              // 재료들 추출 (재료1~재료5)
              const materials: string[] = []
              for (let i = 1; i <= 5; i++) {
                const materialName = row[`재료${i}`]
                if (materialName && materialName.trim()) {
                  materials.push(materialName.trim())
                }
              }

              // 시술 데이터 생성
              const procedure: CreateProcedureData = {
                name: String(row['시술명']).trim(),
                category_name: String(row['분류']).trim(),
                customer_price: customerPrice,
                description: `사용 재료: ${materials.join(', ')}`,
                materials: materials, // 나중에 재료 연결할 때 사용
              }

              procedures.push(procedure)
            } catch (error) {
              console.error(`행 ${index + 1} 파싱 실패:`, error, row)
            }
          })

          console.log(`총 ${procedures.length}개의 시술이 파싱되었습니다.`)
          resolve(procedures)
        } catch (error) {
          reject(new Error(`CSV 파싱 실패: ${error}`))
        }
      },
      error: (error) => {
        reject(new Error(`CSV 파일 읽기 실패: ${error}`))
      }
    })
  })
}

// 시술 CSV 다운로드
export function downloadProceduresCSV(procedures: Procedure[], filename = '시술목록.csv') {
  const headers = [
    '분류',
    '시술명',
    '고객가',
    '재료원가',
    '마진',
    '마진율(%)',
    '사용재료',
    '등록일'
  ]

  const csvData = procedures.map(procedure => [
    procedure.category?.name || '미분류',
    procedure.name,
    procedure.customer_price,
    procedure.material_cost,
    procedure.margin,
    procedure.margin_percentage.toFixed(2),
    procedure.procedure_materials?.map(pm => 
      `${pm.material?.name}(${pm.quantity})`
    ).join(', ') || '',
    formatDate(procedure.created_at)
  ])

  const csv = Papa.unparse({
    fields: headers,
    data: csvData
  })

  downloadCSV(csv, filename)
}

// 시술 템플릿 CSV 다운로드
export function downloadProcedureTemplateCSV() {
  const headers = [
    '분류',
    '시술명', 
    '고객가',
    '재료1',
    '재료2',
    '재료3',
    '재료4',
    '재료5'
  ]

  const sampleData = [
    [
      '보톡스',
      '이마 보톡스 50유닛',
      '150000',
      '보톡스 50유닛',
      '',
      '',
      '',
      ''
    ],
    [
      '필러',
      '레스틸렌 1cc',
      '400000',
      '레스틸렌 1cc',
      '',
      '',
      '',
      ''
    ]
  ]

  const csv = Papa.unparse({
    fields: headers,
    data: sampleData
  })

  downloadCSV(csv, '시술_업로드_템플릿.csv')
}

// 카테고리 매핑 함수 (카테고리명 → 카테고리 ID)
export function mapCategoryNameToId(categoryName: string, categories: any[]): string | undefined {
  // 정확한 매칭 먼저 시도
  let category = categories.find(c => c.name === categoryName)
  
  if (!category) {
    // 부분 매칭 시도
    category = categories.find(c => 
      categoryName.includes(c.name) || c.name.includes(categoryName)
    )
  }
  
  if (!category) {
    // 기본 카테고리 매핑
    const categoryMappings: Record<string, string> = {
      '7월이벤트': '7월이벤트',
      '고정': '고정',
      '보톡스': '보톡스',
      '필러': '필러',
      '리프팅': '리프팅',
      '위고비': '위고비',
    }
    
    const mappedName = categoryMappings[categoryName]
    if (mappedName) {
      category = categories.find(c => c.name === mappedName)
    }
  }
  
  return category?.id
} 