'use client'

import React from 'react'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { CategoryChart } from '@/components/dashboard/CategoryChart'
import { useDashboardStats, useCategoryStats } from '@/hooks/useDashboard'

export default function HomePage() {
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats()
  const { data: categoryStats = [], isLoading: categoryLoading } = useCategoryStats()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            원가 관리 대시보드
          </h1>
          <p className="text-gray-600">
            미용 시술 원가 및 마진 분석 현황을 확인하세요
          </p>
        </div>

        {/* 통계 카드들 */}
        <DashboardStats
          totalMaterials={dashboardStats?.total_materials}
          totalProcedures={dashboardStats?.total_procedures}
          totalCategories={dashboardStats?.total_categories}
          averageMargin={dashboardStats?.average_margin}
          totalRevenue={dashboardStats?.total_revenue}
          highestMargin={dashboardStats?.highest_margin}
          lowestMargin={dashboardStats?.lowest_margin}
          isLoading={statsLoading}
        />

        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            카테고리 분석
          </h2>
          <CategoryChart 
            categories={categoryStats}
            isLoading={categoryLoading}
          />
        </div>

        {/* 빠른 액세스 버튼들 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-2">재료 관리</h3>
            <p className="text-gray-600 text-sm mb-4">
              재료 등록, 수정 및 가격 관리
            </p>
            <a 
              href="/materials"
              className="inline-flex items-center text-brand-600 hover:text-brand-700 font-medium"
            >
              재료 관리하기 →
            </a>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-2">시술 관리</h3>
            <p className="text-gray-600 text-sm mb-4">
              시술 등록, 마진 계산 및 분석
            </p>
            <a 
              href="/procedures"
              className="inline-flex items-center text-brand-600 hover:text-brand-700 font-medium"
            >
              시술 관리하기 →
            </a>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-2">분석 리포트</h3>
            <p className="text-gray-600 text-sm mb-4">
              수익성 분석 및 상세 리포트
            </p>
            <span className="inline-flex items-center text-gray-400 font-medium">
              개발 예정 (v0.7.0)
            </span>
          </div>
        </div>

        {/* 시스템 상태 */}
        {!statsLoading && dashboardStats && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>시스템 상태:</strong> 정상 운영 중 • 
                  마지막 업데이트: {new Date().toLocaleDateString('ko-KR')} • 
                  데이터베이스 연결: 양호
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
