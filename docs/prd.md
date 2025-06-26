# 📋 미용 시술 원가관리 시스템 MVP - PRD (Product Requirements Document)

## 🎯 프로젝트 개요

### **제품명**: 미용 시술 원가관리 시스템 (Beauty Procedure Cost Management System)
### **버전**: MVP 1.0
### **개발 방식**: Supabase + React 기반 단순 원가관리 시스템

---

## 📊 비즈니스 요구사항

### **핵심 문제점**
- 기존 엑셀 기반 원가 관리의 한계
- 수동 마진 계산으로 인한 오류 발생
- 데이터 분석 및 시각화 부족

### **목표**
- 웹 기반 원가관리 시스템 구축
- 자동 마진 계산 및 수익성 분석 기능 제공
- 안전한 클라우드 데이터 저장

### **성공 지표**
- 데이터 입력 시간 50% 단축
- 마진 계산 자동화 100% 달성
- 웹 기반 접근성 확보

---

## 🛠️ 기술 스택

### **Frontend**
- **React 18+**: 컴포넌트 기반 UI 프레임워크
- **TypeScript**: 타입 안전성 보장
- **Tailwind CSS**: 유틸리티 기반 스타일링
- **React Query (TanStack Query)**: 서버 상태 관리
- **Lucide React**: 아이콘 라이브러리

### **Backend & Database**
- **Supabase**: BaaS (Backend as a Service)
  - **PostgreSQL**: 메인 데이터베이스
  - **Auto-generated REST API**: 자동 API 생성
  - **Supabase Storage**: 파일 업로드

### **배포 & 호스팅**
- **Vercel**: Frontend 배포 및 호스팅
- **Supabase Cloud**: Database 호스팅

---

## 📋 기능 요구사항

### **1. 재료 관리 시스템**

#### **1.1 재료 CRUD**
- **재료 목록 조회**: 페이지네이션 적용
- **재료 추가**: 이름, 원가, 공급업체, 설명
- **재료 수정**: 기존 데이터 업데이트
- **재료 삭제**: 완전 삭제

#### **1.2 대량 업로드**
- **CSV 파일 업로드**: 템플릿 기반
- **데이터 검증**: 중복 체크, 형식 검증
- **업로드 진행률 표시**
- **오류 리포트**: 실패한 행 상세 정보

#### **1.3 재료 검색 및 필터링**
- **텍스트 검색**: 재료명, 공급업체
- **가격 범위 필터**
- **정렬**: 이름, 가격, 등록일순

### **2. 시술 관리 시스템**

#### **2.1 시술 CRUD**
- **시술 목록 조회**: 페이지네이션 적용
- **시술 추가**: 분류, 이름, 고객가, 구성 재료
- **시술 수정**: 실시간 마진 계산
- **시술 삭제**: 완전 삭제

#### **2.2 마진 계산 엔진**
```javascript
// 자동 계산 로직
const calculateMargin = (customerPrice, materials) => {
  const totalCost = materials.reduce((sum, material) => {
    return sum + (material.cost * material.quantity);
  }, 0);
  
  const margin = customerPrice - totalCost;
  const marginRate = (margin / customerPrice) * 100;
  
  return { totalCost, margin, marginRate };
};
```

#### **2.3 시술 구성 관리**
- **재료 선택기**: 드롭다운 + 자동완성
- **수량 설정**: 재료별 사용량
- **실시간 미리보기**: 원가/마진 즉시 계산

### **3. 대시보드**

#### **3.1 핵심 지표**
- **총 시술 수**: 전체 등록된 시술
- **총 재료 수**: 전체 등록된 재료
- **평균 마진율**: 모든 시술의 평균
- **최고/최저 마진율**: 수익성 분석

#### **3.2 통계 차트**
- **마진율 분포**: 파이 차트
- **카테고리별 시술 수**: 바 차트
- **가격 구간별 분포**: 히스토그램

#### **3.3 주요 인사이트**
- **최고 수익성 시술**: TOP 5
- **개선 필요 시술**: 낮은 마진율
- **고비용 재료**: 원가 최적화 대상

### **4. 데이터 관리**

#### **4.1 데이터 내보내기**
- **CSV 다운로드**: 재료/시술 목록
- **엑셀 내보내기**: 분석용 데이터
- **PDF 보고서**: 요약 리포트

#### **4.2 템플릿 관리**
- **CSV 템플릿 다운로드**: 업로드용 템플릿
- **샘플 데이터**: 예시 데이터 제공

---

## 🗄️ 데이터베이스 스키마

### **테이블 구조**

```sql
-- 재료 테이블
CREATE TABLE materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  cost DECIMAL(10,2) NOT NULL CHECK (cost >= 0),
  supplier TEXT,
  description TEXT,
  unit TEXT DEFAULT 'ea',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 시술 분류 테이블
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 시술 테이블
CREATE TABLE procedures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id),
  customer_price DECIMAL(10,2) NOT NULL CHECK (customer_price >= 0),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 시술-재료 연결 테이블
CREATE TABLE procedure_materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  procedure_id UUID REFERENCES procedures(id) ON DELETE CASCADE,
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  quantity DECIMAL(8,3) DEFAULT 1.0 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(procedure_id, material_id)
);

-- 기본 카테고리 삽입
INSERT INTO categories (name, description, color) VALUES
('7월이벤트', '7월 특별 이벤트 시술', '#FF6B6B'),
('고정', '정규 시술 메뉴', '#4ECDC4'),
('필러', '필러 관련 시술', '#45B7D1'),
('보톡스', '보톡스 관련 시술', '#96CEB4'),
('레이저', '레이저 관련 시술', '#FFEAA7');
```

---

## 🔌 API 명세서

### **Supabase 자동 생성 REST API**

#### **재료 관리 API**
```typescript
// GET /rest/v1/materials
interface GetMaterialsResponse {
  id: string;
  name: string;
  cost: number;
  supplier?: string;
  description?: string;
  unit: string;
  created_at: string;
  updated_at: string;
}

// POST /rest/v1/materials
interface CreateMaterialRequest {
  name: string;
  cost: number;
  supplier?: string;
  description?: string;
  unit?: string;
}

// PATCH /rest/v1/materials?id=eq.{id}
interface UpdateMaterialRequest {
  name?: string;
  cost?: number;
  supplier?: string;
  description?: string;
  unit?: string;
}

// DELETE /rest/v1/materials?id=eq.{id}
```

#### **시술 관리 API**
```typescript
// GET /rest/v1/procedures?select=*,categories(*),procedure_materials(materials(*))
interface GetProceduresResponse {
  id: string;
  name: string;
  customer_price: number;
  description?: string;
  categories: {
    id: string;
    name: string;
    color: string;
  };
  procedure_materials: Array<{
    quantity: number;
    materials: {
      id: string;
      name: string;
      cost: number;
      unit: string;
    };
  }>;
  created_at: string;
  updated_at: string;
}

// POST /rest/v1/procedures
interface CreateProcedureRequest {
  name: string;
  category_id: string;
  customer_price: number;
  description?: string;
}

// POST /rest/v1/procedure_materials (배치 처리)
interface CreateProcedureMaterialsRequest {
  procedure_id: string;
  materials: Array<{
    material_id: string;
    quantity: number;
  }>;
}
```

#### **카테고리 API**
```typescript
// GET /rest/v1/categories
interface GetCategoriesResponse {
  id: string;
  name: string;
  description?: string;
  color: string;
  created_at: string;
}
```

---

## 🎨 UI/UX 요구사항

### **디자인 시스템**

#### **컬러 팔레트**
```css
:root {
  /* Primary Colors */
  --color-primary: #3B82F6;      /* Blue 500 */
  --color-primary-dark: #1E40AF; /* Blue 800 */
  --color-primary-light: #DBEAFE; /* Blue 100 */
  
  /* Status Colors */
  --color-success: #10B981;      /* Emerald 500 */
  --color-warning: #F59E0B;      /* Amber 500 */
  --color-error: #EF4444;        /* Red 500 */
  --color-info: #06B6D4;         /* Cyan 500 */
  
  /* Neutral Colors */
  --color-gray-50: #F9FAFB;
  --color-gray-100: #F3F4F6;
  --color-gray-500: #6B7280;
  --color-gray-900: #111827;
  
  /* Gradients */
  --gradient-bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --gradient-card: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}
```

#### **타이포그래피**
```css
/* Font Stack */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Typography Scale */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
```

### **레이아웃 구조**

```
┌─────────────────────────────────────────┐
│ Header (Logo, Navigation)               │
├─────────────────────────────────────────┤
│ Main Content Area                       │
│ ┌─────────────────────────────────────┐ │
│ │ Content Panel                       │ │
│ │ ┌─────────────┐ ┌─────────────────┐ │ │
│ │ │ Filters/    │ │ Data Table/     │ │ │
│ │ │ Actions     │ │ Charts          │ │ │
│ │ └─────────────┘ └─────────────────┘ │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### **컴포넌트 라이브러리**

#### **기본 컴포넌트**
- **Button**: Primary, Secondary, Danger 변형
- **Input**: Text, Number, Select, Textarea
- **Table**: 정렬, 페이지네이션 포함
- **Modal**: 추가/수정 폼용
- **Card**: 대시보드 위젯용
- **Toast**: 알림 메시지용

#### **반응형 브레이크포인트**
```css
/* Tailwind CSS 기본 브레이크포인트 */
sm: '640px',   /* 태블릿 세로 */
md: '768px',   /* 태블릿 가로 */
lg: '1024px',  /* 데스크톱 */
xl: '1280px',  /* 큰 데스크톱 */
2xl: '1536px'  /* 매우 큰 화면 */
```

---

## 🔒 보안 요구사항 (최소한)

### **기본 보안**
- **HTTPS**: 모든 통신 암호화 (Vercel 자동 제공)
- **환경변수**: API 키 안전한 저장
- **CORS**: 특정 도메인만 허용

### **데이터 보안**
- **입력값 검증**: 클라이언트 사이드 기본 검증
- **SQL Injection 방지**: Supabase ORM 사용
- **XSS 방지**: React 기본 이스케이핑

### **API 보안**
```typescript
// 환경변수 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 기본 API 제한
// Rate limiting은 Supabase 기본 제공 사용
```

---

## ⚡ 성능 요구사항

### **응답 시간**
- **페이지 로드**: 3초 이내
- **API 응답**: 1초 이내
- **파일 업로드**: 5MB 이내 30초

### **최적화**
- **React Query 캐싱**: 5분 캐시
- **이미지 최적화**: Next.js Image 컴포넌트
- **번들 최적화**: Code Splitting

### **가용성**
- **Uptime**: 99% 이상 (Vercel + Supabase 기본 제공)
- **자동 백업**: Supabase 자동 백업

---

## 📱 기능별 우선순위

### **Phase 1: Core MVP (3주)**
1. ✅ **재료 CRUD** (Week 1)
   - 재료 목록 조회/추가/수정/삭제
   - 기본 검색 기능

2. ✅ **시술 CRUD** (Week 2)
   - 시술 목록 조회/추가/수정/삭제
   - 재료 연결 및 마진 계산

3. ✅ **기본 대시보드** (Week 3)
   - 핵심 지표 표시
   - 기본 차트 (파이, 바 차트)

### **Phase 2: Enhanced Features (2주)**
4. ✅ **파일 업로드** (Week 4)
   - CSV 업로드/다운로드
   - 템플릿 제공

5. ✅ **고급 기능** (Week 5)
   - 고급 검색/필터
   - 데이터 내보내기
   - UI/UX 개선

---

## 🧪 테스트 요구사항

### **기본 테스트**
```typescript
// 단위 테스트 (Jest + React Testing Library)
describe('MaterialForm', () => {
  it('should validate required fields', () => {
    // 필수 필드 검증 테스트
  });
  
  it('should calculate costs correctly', () => {
    // 마진 계산 로직 테스트
  });
});
```

### **E2E 테스트**
```typescript
// Playwright 기본 테스트
test('should add new material', async ({ page }) => {
  await page.goto('/materials');
  await page.click('[data-testid="add-material"]');
  await page.fill('[name="name"]', 'Test Material');
  await page.fill('[name="cost"]', '10000');
  await page.click('[type="submit"]');
  await expect(page.locator('text=Test Material')).toBeVisible();
});
```

---

## 🚀 배포 및 운영

### **환경 설정**
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### **Vercel 배포**
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "npm ci"
}
```

### **배포 파이프라인**
1. **개발**: `npm run dev` (localhost:3000)
2. **빌드 테스트**: `npm run build && npm run start`
3. **배포**: Git push → Vercel 자동 배포

### **모니터링 (기본)**
- **Vercel Analytics**: 기본 성능 모니터링
- **Supabase Dashboard**: 데이터베이스 상태 확인
- **Browser Console**: 클라이언트 오류 확인

---

## 📋 개발 체크리스트

### **프로젝트 설정**
- [ ] Next.js 프로젝트 생성
- [ ] Supabase 프로젝트 생성 및 연결
- [ ] 환경변수 설정
- [ ] Database 스키마 적용
- [ ] Vercel 프로젝트 연결

### **개발 완료 확인**
- [ ] 재료 CRUD 기능 완성
- [ ] 시술 CRUD 기능 완성
- [ ] 마진 계산 로직 정확성 확인
- [ ] 대시보드 차트 정상 동작
- [ ] CSV 업로드/다운로드 기능
- [ ] 반응형 디자인 적용
- [ ] 기본 에러 처리 완료

### **배포 전 확인**
- [ ] 프로덕션 빌드 성공
- [ ] 환경변수 프로덕션 설정
- [ ] 기본 성능 테스트 완료
- [ ] 크로스 브라우저 테스트 (Chrome, Firefox, Safari)

---

## 📞 개발 리소스

**예상 개발 기간**: 5주 (1.25개월)

**필요한 기술 스택 숙련도**:
- React/Next.js (중급)
- TypeScript (초급-중급)
- Tailwind CSS (초급)
- Supabase (초급)

**개발 우선순위**: 
1. 핵심 CRUD 기능 우선
2. 사용자 편의성 기능
3. 고급 분석 기능

---

이 간소화된 PRD는 인증이나 실시간 기능 없이 순수한 데이터 관리 도구로 설계되어 개발 복잡성을 크게 줄였습니다. 핵심 비즈니스 로직에 집중할 수 있도록 구성했습니다.