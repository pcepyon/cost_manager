# 미용 시술 원가관리 시스템 MVP - 개발 기술 문서

## 📁 프로젝트 구조

```
beauty-cost-management/
├── src/
│   ├── components/
│   │   ├── materials/           # 재료 관리 컴포넌트
│   │   │   ├── MaterialList.tsx
│   │   │   ├── MaterialForm.tsx
│   │   │   └── MaterialUpload.tsx
│   │   ├── procedures/          # 시술 관리 컴포넌트
│   │   │   ├── ProcedureList.tsx
│   │   │   ├── ProcedureForm.tsx
│   │   │   └── MarginCalculator.tsx
│   │   ├── dashboard/           # 대시보드 컴포넌트
│   │   │   ├── StatsCards.tsx
│   │   │   ├── MarginChart.tsx
│   │   │   └── CategoryChart.tsx
│   │   └── shared/              # 공통 컴포넌트
│   │       ├── DataTable.tsx
│   │       ├── Modal.tsx
│   │       └── Toast.tsx
│   ├── lib/
│   │   ├── supabase.ts         # Supabase 클라이언트
│   │   ├── utils.ts            # 유틸리티 함수
│   │   └── constants.ts        # 상수 정의
│   ├── hooks/                   # 커스텀 훅
│   │   ├── useSupabase.ts
│   │   ├── useMaterials.ts
│   │   └── useProcedures.ts
│   ├── types/                   # TypeScript 타입 정의
│   │   └── index.ts
│   └── app/                     # Next.js App Router
│       ├── layout.tsx
│       ├── page.tsx
│       ├── materials/
│       ├── procedures/
│       └── dashboard/
├── public/
│   └── templates/              # CSV 템플릿 파일
├── .env.local                  # 환경변수
└── package.json
```

## 🗄️ 데이터베이스 스키마 (수정된 버전)

```sql
-- 1. 재료 테이블
CREATE TABLE materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cost DECIMAL(10,2) NOT NULL CHECK (cost >= 0),
  supplier TEXT,
  description TEXT,
  unit TEXT DEFAULT 'ea',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 재료명과 공급업체 조합으로 중복 방지
CREATE UNIQUE INDEX idx_materials_name_supplier 
ON materials(name, supplier) 
WHERE supplier IS NOT NULL;

-- 재료명만으로 검색 최적화
CREATE INDEX idx_materials_name ON materials(name);

-- 2. 카테고리 테이블
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 시술 테이블
CREATE TABLE procedures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  customer_price DECIMAL(10,2) NOT NULL CHECK (customer_price >= 0),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 카테고리별 시술명 유니크 제약
CREATE UNIQUE INDEX idx_procedures_category_name 
ON procedures(category_id, name) 
WHERE is_active = true;

-- 4. 시술-재료 연결 테이블
CREATE TABLE procedure_materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  procedure_id UUID REFERENCES procedures(id) ON DELETE CASCADE,
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  quantity DECIMAL(8,3) DEFAULT 1.0 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(procedure_id, material_id)
);

-- 5. RLS (Row Level Security) 설정
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE procedure_materials ENABLE ROW LEVEL SECURITY;

-- 모든 사용자 읽기/쓰기 허용 (MVP용)
CREATE POLICY "Enable all access" ON materials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access" ON procedures FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access" ON procedure_materials FOR ALL USING (true) WITH CHECK (true);

-- 6. 기본 카테고리 삽입 (실제 데이터 기반)
INSERT INTO categories (name, description, color, display_order) VALUES
('7월이벤트', '7월 특별 이벤트 시술', '#FF6B6B', 1),
('고정', '정규 시술 메뉴', '#4ECDC4', 2),
('필러', '필러 관련 시술', '#45B7D1', 3),
('보톡스', '보톡스 관련 시술', '#96CEB4', 4),
('리프팅', '리프팅 관련 시술', '#FFEAA7', 5),
('위고비', '위고비 관련 시술', '#DDA0DD', 6);

-- 7. 트리거 함수 - updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_materials_updated_at BEFORE UPDATE ON materials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_procedures_updated_at BEFORE UPDATE ON procedures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 📝 TypeScript 타입 정의

```typescript
// src/types/index.ts

export interface Material {
  id: string;
  name: string;
  cost: number;
  supplier?: string;
  description?: string;
  unit: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  display_order: number;
  created_at: string;
}

export interface Procedure {
  id: string;
  name: string;
  category_id: string;
  customer_price: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  category?: Category;
  procedure_materials?: ProcedureMaterial[];
}

export interface ProcedureMaterial {
  id: string;
  procedure_id: string;
  material_id: string;
  quantity: number;
  created_at: string;
  // Relations
  material?: Material;
}

export interface MarginCalculation {
  totalCost: number;
  margin: number;
  marginRate: number;
}

export interface DashboardStats {
  totalProcedures: number;
  totalMaterials: number;
  averageMarginRate: number;
  highestMarginRate: number;
  lowestMarginRate: number;
}
```

## 🔧 환경 설정

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## 🛠️ 핵심 유틸리티 함수

```typescript
// src/lib/utils.ts

// 금액 파싱 함수 (CSV 데이터용)
export function parseAmount(value: string): number {
  if (!value) return 0;
  // 쉼표 제거하고 숫자로 변환
  return parseFloat(value.replace(/,/g, ''));
}

// 금액 포맷팅 함수
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW'
  }).format(value);
}

// 마진 계산 함수
export function calculateMargin(
  customerPrice: number, 
  materials: Array<{cost: number; quantity: number}>
): MarginCalculation {
  const totalCost = materials.reduce((sum, material) => {
    return sum + (material.cost * material.quantity);
  }, 0);
  
  const margin = customerPrice - totalCost;
  const marginRate = customerPrice > 0 ? (margin / customerPrice) * 100 : 0;
  
  return {
    totalCost,
    margin,
    marginRate: Math.round(marginRate * 100) / 100 // 소수점 2자리
  };
}

// CSV 파싱 헬퍼
export async function parseCSV(file: File): Promise<any[]> {
  const Papa = (await import('papaparse')).default;
  
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: false,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data),
      error: (error) => reject(error)
    });
  });
}

// 배치 처리 헬퍼
export async function batchProcess<T>(
  items: T[],
  processor: (batch: T[]) => Promise<void>,
  batchSize: number = 50
): Promise<void> {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await processor(batch);
  }
}
```

## 📊 데이터 마이그레이션 가이드

```typescript
// src/lib/migration.ts

import { supabase } from './supabase';
import { parseAmount, batchProcess } from './utils';

interface CSVMaterial {
  '재료이름': string;
  '원가': string;
}

interface CSVProcedure {
  '분류': string;
  '시술명': string;
  '고객가': string;
  '재료1': string;
  '재료2': string;
  '재료3': string;
  '재료4': string;
  '재료5': string;
}

export class DataMigration {
  private categoryMap = new Map<string, string>();
  private materialMap = new Map<string, string>();

  async migrate(materials: CSVMaterial[], procedures: CSVProcedure[]) {
    try {
      // 1. 카테고리 맵 생성
      await this.createCategoryMap();
      
      // 2. 재료 임포트
      await this.importMaterials(materials);
      
      // 3. 시술 임포트
      await this.importProcedures(procedures);
      
      console.log('Migration completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  private async createCategoryMap() {
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name');
    
    categories?.forEach(cat => {
      this.categoryMap.set(cat.name, cat.id);
    });
  }

  private async importMaterials(materials: CSVMaterial[]) {
    const uniqueMaterials = materials.filter((material, index, self) =>
      index === self.findIndex(m => m['재료이름'] === material['재료이름'])
    );

    await batchProcess(uniqueMaterials, async (batch) => {
      const materialsToInsert = batch.map(material => ({
        name: material['재료이름'].trim(),
        cost: parseAmount(material['원가'])
      }));

      const { data, error } = await supabase
        .from('materials')
        .upsert(materialsToInsert, { onConflict: 'name' })
        .select();

      if (error) throw error;

      // 재료 맵 업데이트
      data?.forEach(mat => {
        this.materialMap.set(mat.name, mat.id);
      });
    });
  }

  private async importProcedures(procedures: CSVProcedure[]) {
    for (const procedure of procedures) {
      try {
        // 시술 생성
        const { data: proc, error: procError } = await supabase
          .from('procedures')
          .insert({
            name: procedure['시술명'].trim(),
            category_id: this.categoryMap.get(procedure['분류']),
            customer_price: parseAmount(procedure['고객가'])
          })
          .select()
          .single();

        if (procError) {
          console.error(`Failed to insert procedure: ${procedure['시술명']}`, procError);
          continue;
        }

        // 시술-재료 연결
        const procedureMaterials = [];
        for (let i = 1; i <= 5; i++) {
          const materialName = procedure[`재료${i}` as keyof CSVProcedure]?.trim();
          if (materialName && this.materialMap.has(materialName)) {
            procedureMaterials.push({
              procedure_id: proc.id,
              material_id: this.materialMap.get(materialName),
              quantity: 1.0
            });
          }
        }

        if (procedureMaterials.length > 0) {
          const { error: linkError } = await supabase
            .from('procedure_materials')
            .insert(procedureMaterials);

          if (linkError) {
            console.error(`Failed to link materials for: ${procedure['시술명']}`, linkError);
          }
        }
      } catch (error) {
        console.error(`Error processing procedure: ${procedure['시술명']}`, error);
      }
    }
  }
}
```

## 🎯 주요 컴포넌트 구현 가이드

### 1. 재료 관리 컴포넌트

```typescript
// src/hooks/useMaterials.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Material } from '@/types';

export function useMaterials() {
  const queryClient = useQueryClient();

  const { data: materials, isLoading } = useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as Material[];
    }
  });

  const createMaterial = useMutation({
    mutationFn: async (material: Omit<Material, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('materials')
        .insert(material)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    }
  });

  const updateMaterial = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Material> & { id: string }) => {
      const { data, error } = await supabase
        .from('materials')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    }
  });

  const deleteMaterial = useMutation({
    mutationFn: async (id: string) => {
      // Soft delete
      const { error } = await supabase
        .from('materials')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    }
  });

  return {
    materials: materials || [],
    isLoading,
    createMaterial,
    updateMaterial,
    deleteMaterial
  };
}
```

### 2. 시술 관리 컴포넌트

```typescript
// src/hooks/useProcedures.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Procedure } from '@/types';

export function useProcedures() {
  const queryClient = useQueryClient();

  const { data: procedures, isLoading } = useQuery({
    queryKey: ['procedures'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('procedures')
        .select(`
          *,
          category:categories(*),
          procedure_materials(
            *,
            material:materials(*)
          )
        `)
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as Procedure[];
    }
  });

  const createProcedure = useMutation({
    mutationFn: async ({
      procedure,
      materials
    }: {
      procedure: Omit<Procedure, 'id' | 'created_at' | 'updated_at'>;
      materials: Array<{ material_id: string; quantity: number }>;
    }) => {
      // 트랜잭션 처리
      const { data: proc, error: procError } = await supabase
        .from('procedures')
        .insert(procedure)
        .select()
        .single();
      
      if (procError) throw procError;

      if (materials.length > 0) {
        const procedureMaterials = materials.map(m => ({
          procedure_id: proc.id,
          ...m
        }));

        const { error: linkError } = await supabase
          .from('procedure_materials')
          .insert(procedureMaterials);
        
        if (linkError) throw linkError;
      }

      return proc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procedures'] });
    }
  });

  return {
    procedures: procedures || [],
    isLoading,
    createProcedure
  };
}
```

### 3. CSV 업로드 컴포넌트

```typescript
// src/components/materials/MaterialUpload.tsx
import { useState } from 'react';
import { Upload } from 'lucide-react';
import { parseCSV } from '@/lib/utils';
import { DataMigration } from '@/lib/migration';

export function MaterialUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setProgress(0);

    try {
      // CSV 파싱
      const data = await parseCSV(file);
      setProgress(30);

      // 데이터 검증
      const validData = data.filter(row => 
        row['재료이름'] && row['원가']
      );
      setProgress(50);

      // 데이터 마이그레이션
      const migration = new DataMigration();
      await migration.importMaterials(validData);
      setProgress(100);

      // 성공 메시지
      toast.success(`${validData.length}개의 재료가 업로드되었습니다.`);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="hidden"
        id="csv-upload"
        disabled={isUploading}
      />
      <label
        htmlFor="csv-upload"
        className="flex flex-col items-center cursor-pointer"
      >
        <Upload className="w-12 h-12 text-gray-400 mb-4" />
        <span className="text-sm text-gray-600">
          CSV 파일을 드래그하거나 클릭하여 업로드
        </span>
      </label>
      
      {isUploading && (
        <div className="mt-4">
          <div className="bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2 text-center">
            업로드 중... {progress}%
          </p>
        </div>
      )}
    </div>
  );
}
```

## 🚀 개발 순서 및 체크리스트

### Phase 1: 프로젝트 설정 (Day 1)
- [ ] Next.js 프로젝트 생성
  ```bash
  npx create-next-app@latest beauty-cost-management --typescript --tailwind --app
  ```
- [ ] 필요한 패키지 설치
  ```bash
  npm install @supabase/supabase-js @tanstack/react-query lucide-react papaparse recharts
  npm install -D @types/papaparse
  ```
- [ ] Supabase 프로젝트 생성 및 연결
- [ ] 환경변수 설정
- [ ] 데이터베이스 스키마 적용

### Phase 2: 재료 관리 (Day 2-3)
- [ ] 재료 타입 정의
- [ ] useMaterials 훅 구현
- [ ] MaterialList 컴포넌트
- [ ] MaterialForm 컴포넌트
- [ ] MaterialUpload 컴포넌트
- [ ] 재료 CRUD 테스트

### Phase 3: 시술 관리 (Day 4-5)
- [ ] 시술 타입 정의
- [ ] useProcedures 훅 구현
- [ ] ProcedureList 컴포넌트
- [ ] ProcedureForm 컴포넌트
- [ ] MarginCalculator 컴포넌트
- [ ] 시술-재료 연결 기능

### Phase 4: 대시보드 (Day 6-7)
- [ ] 대시보드 통계 API
- [ ] StatsCards 컴포넌트
- [ ] MarginChart 컴포넌트
- [ ] CategoryChart 컴포넌트
- [ ] 데이터 내보내기 기능

### Phase 5: 마무리 (Day 8)
- [ ] UI/UX 개선
- [ ] 에러 처리 강화
- [ ] 성능 최적화
- [ ] 배포 준비
- [ ] 사용자 가이드 작성

## 🐛 일반적인 문제 해결

### 1. Supabase 연결 오류
```typescript
// CORS 오류 시
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
});
```

### 2. CSV 인코딩 문제
```typescript
// UTF-8 BOM 처리
if (content.charCodeAt(0) === 0xFEFF) {
  content = content.slice(1);
}
```

### 3. 대량 데이터 처리
```typescript
// 배치 처리로 타임아웃 방지
const BATCH_SIZE = 50;
for (let i = 0; i < data.length; i += BATCH_SIZE) {
  await processChunk(data.slice(i, i + BATCH_SIZE));
  // 진행률 업데이트
  setProgress(Math.round((i / data.length) * 100));
}
```

### 4. 금액 정밀도 문제
```typescript
// Decimal 타입 처리
const amount = new Decimal(value).toFixed(2);
```

## 📚 추가 참고사항

1. **성능 최적화**
   - React Query의 staleTime과 cacheTime 적절히 설정
   - 큰 목록은 가상화(react-window) 고려
   - 이미지는 Next.js Image 컴포넌트 사용

2. **보안 고려사항**
   - 환경변수는 절대 커밋하지 않기
   - SQL Injection 방지를 위해 Supabase 쿼리 빌더 사용
   - XSS 방지를 위해 사용자 입력값 sanitize

3. **사용자 경험**
   - 로딩 상태와 에러 상태 명확히 표시
   - 낙관적 업데이트로 반응성 향상
   - 토스트 메시지로 작업 결과 알림