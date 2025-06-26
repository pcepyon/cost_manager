import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null

function getSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance
  }

  // 브라우저와 서버 환경 모두에서 작동하도록 개선
  const supabaseUrl = typeof window !== 'undefined' 
    ? window.process?.env?.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    : process.env.NEXT_PUBLIC_SUPABASE_URL
    
  const supabaseAnonKey = typeof window !== 'undefined'
    ? window.process?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // 하드코딩된 값으로 폴백 (임시)
  const fallbackUrl = 'https://fohwspwyyujsthmxxifn.supabase.co'
  const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvaHdzcHd5eXVqc3RobXh4aWZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5MjA5MzAsImV4cCI6MjA2NjQ5NjkzMH0.PwRua7CV6On7Jo44GAqbmuRJuN-wcXKrKw1jKa-b5s4'

  const finalUrl = supabaseUrl || fallbackUrl
  const finalKey = supabaseAnonKey || fallbackKey

  console.log('환경변수 확인:', {
    url: supabaseUrl ? '환경변수에서 로드' : '하드코딩 폴백',
    key: supabaseAnonKey ? '환경변수에서 로드' : '하드코딩 폴백',
    finalUrl: finalUrl.substring(0, 30) + '...'
  })

  try {
    supabaseInstance = createClient(finalUrl, finalKey)
    console.log('Supabase 클라이언트 초기화 성공')
    return supabaseInstance
  } catch (error) {
    console.error('Supabase 클라이언트 초기화 실패:', error)
    throw error
  }
}

export const supabase = getSupabaseClient()

// 타입 안전성을 위한 데이터베이스 타입 체크 함수들
export const isSupabaseError = (error: any): error is { message: string; code?: string } => {
  return error && typeof error.message === 'string'
}

export const handleSupabaseError = (error: any): string => {
  if (isSupabaseError(error)) {
    return error.message
  }
  return '알 수 없는 오류가 발생했습니다.'
} 