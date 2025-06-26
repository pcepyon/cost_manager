// 데이터베이스 테이블 인터페이스

export interface Material {
  id: string;
  name: string;
  cost: number;
  supplier?: string;
  description?: string;
  unit: string;
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
  updated_at: string;
}

export interface Procedure {
  id: string;
  name: string;
  category_id: string;
  customer_price: number;
  material_cost: number;
  margin: number;
  margin_percentage: number;
  description?: string;
  created_at: string;
  updated_at: string;
  // 관계형 데이터
  category?: Category;
  procedure_materials?: ProcedureMaterial[];
}

export interface ProcedureMaterial {
  id: string;
  procedure_id: string;
  material_id: string;
  quantity: number;
  cost_per_unit: number;
  created_at: string;
  updated_at: string;
  // 관계형 데이터
  material?: Material;
}

// API 응답 타입
export interface ApiResponse<T> {
  data: T | null;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  limit: number;
  total_pages: number;
}

// 폼 데이터 타입
export interface MaterialFormData {
  name: string;
  cost: number;
  supplier?: string;
  description?: string;
  unit: string;
}

export interface ProcedureFormData {
  name: string;
  category_id: string;
  customer_price: number;
  description?: string;
  materials: {
    material_id: string;
    quantity: number;
  }[];
}

export interface CategoryFormData {
  name: string;
  description?: string;
  color: string;
  display_order: number;
}

// CSV 임포트 타입
export interface MaterialCSVRow {
  재료이름: string;
  원가: string;
}

export interface ProcedureCSVRow {
  분류: string;
  시술명: string;
  고객가: string;
  재료1?: string;
  재료2?: string;
  재료3?: string;
  재료4?: string;
  재료5?: string;
}

// 대시보드 통계 타입
export interface DashboardStats {
  total_materials: number;
  total_procedures: number;
  total_categories: number;
  average_margin: number;
  highest_margin: number;
  lowest_margin: number;
  total_revenue: number;
  total_cost: number;
}

export interface MarginDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface CategoryStats {
  category_name: string;
  procedure_count: number;
  average_margin: number;
  total_revenue: number;
}

// 필터 및 정렬 타입
export interface MaterialFilter {
  search?: string;
  supplier?: string;
  unit?: string;
  cost_min?: number;
  cost_max?: number;
  cost_range?: {
    min?: number;
    max?: number;
  };
  sort_by?: 'name' | 'cost' | 'supplier' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

export interface ProcedureFilter {
  search?: string;
  category_id?: string;
  margin_min?: number;
  margin_max?: number;
  price_min?: number;
  price_max?: number;
  sort_by?: 'name' | 'customer_price' | 'margin' | 'margin_percentage' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

// 에러 타입
export interface AppError {
  message: string;
  code?: string;
  details?: any;
}

// 상태 관리 타입
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// 차트 데이터 타입
export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface LineChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

// 유틸리티 타입
export type CreateMaterialData = Omit<Material, 'id' | 'created_at' | 'updated_at'>;
export type UpdateMaterialData = Partial<CreateMaterialData>;

export type CreateProcedureData = Omit<Procedure, 'id' | 'created_at' | 'updated_at' | 'material_cost' | 'margin' | 'margin_percentage' | 'category' | 'procedure_materials'>;
export type UpdateProcedureData = Partial<CreateProcedureData>;

export type CreateCategoryData = Omit<Category, 'id' | 'created_at' | 'updated_at'>;
export type UpdateCategoryData = Partial<CreateCategoryData>;

// 테이블 컴포넌트 타입
export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
  className?: string;
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  onSort?: (key: string, order: 'asc' | 'desc') => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  emptyMessage?: string;
  className?: string;
}

// 모달 타입
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

// 폼 검증 타입
export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationRules {
  [key: string]: ValidationRule;
}

export interface ValidationErrors {
  [key: string]: string;
}

// 페이지네이션 타입
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  showPrevNext?: boolean;
  maxVisiblePages?: number;
}

// 업로드 타입
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface FileUploadProps {
  accept?: string;
  maxSize?: number;
  onUpload: (file: File) => Promise<void>;
  onProgress?: (progress: UploadProgress) => void;
  loading?: boolean;
  error?: string;
}

// 검색 타입
export interface SearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

// 수익성 분석 타입
export interface ProfitabilityAnalysis {
  procedure: Procedure;
  total_material_cost: number;
  profit: number;
  profit_percentage: number;
  break_even_price: number;
  recommended_price?: number;
  risk_level: 'low' | 'medium' | 'high';
  suggestions: string[];
} 