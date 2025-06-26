'use client'

import React from 'react'
import { formatCurrency } from '@/lib/utils'

interface DashboardStatsProps {
  totalMaterials?: number
  totalProcedures?: number
  totalCategories?: number
  averageMargin?: number
  totalRevenue?: number
  highestMargin?: number
  lowestMargin?: number
  isLoading?: boolean
}

export function DashboardStats({
  totalMaterials = 0,
  totalProcedures = 0,
  totalCategories = 0,
  averageMargin = 0,
  totalRevenue = 0,
  highestMargin = 0,
  lowestMargin = 0,
  isLoading = false
}: DashboardStatsProps) {

  const getMarginColor = (margin: number) => {
    if (margin >= 70) return 'text-green-600'
    if (margin >= 50) return 'text-yellow-600'
    if (margin >= 30) return 'text-orange-600'
    return 'text-red-600'
  }

  const stats = [
    {
      title: '총 재료 수',
      value: totalMaterials,
      icon: '📦',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200',
      format: (value: number) => value.toLocaleString()
    },
    {
      title: '총 시술 수',
      value: totalProcedures,
      icon: '⚙️',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-200',
      format: (value: number) => value.toLocaleString()
    },
    {
      title: '카테고리 수',
      value: totalCategories,
      icon: '📊',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      borderColor: 'border-indigo-200',
      format: (value: number) => value.toLocaleString()
    },
    {
      title: '평균 매출',
      value: totalRevenue / totalProcedures,
      icon: '💰',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200',
      format: (value: number) => formatCurrency(isNaN(value) ? 0 : value)
    }
  ]

  const marginStats = [
    {
      title: '평균 마진율',
      value: averageMargin,
      icon: '📈',
      color: getMarginColor(averageMargin),
      suffix: '%'
    },
    {
      title: '최고 마진율',
      value: highestMargin,
      icon: '🚀',
      color: getMarginColor(highestMargin),
      suffix: '%'
    },
    {
      title: '최저 마진율',
      value: lowestMargin,
      icon: '📉',
      color: getMarginColor(lowestMargin),
      suffix: '%'
    }
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-8 mb-8">
      {/* 기본 통계 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div 
            key={index} 
            className={`bg-white rounded-lg shadow-lg border-2 ${stat.borderColor} p-6 hover:shadow-xl transition-all duration-300 hover:scale-105`}
          >
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  {stat.title}
                </p>
                <p className={`text-3xl font-bold ${stat.iconColor}`}>
                  {stat.format(stat.value)}
                </p>
              </div>
              <div className={`w-16 h-16 ${stat.bgColor} rounded-full flex items-center justify-center text-3xl shadow-lg`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 마진 분석 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {marginStats.map((stat, index) => (
          <div 
            key={index} 
            className="bg-white rounded-lg shadow-lg border-2 border-gray-200 p-6 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  {stat.title}
                </p>
                <div className="flex items-center space-x-3">
                  <p className={`text-3xl font-bold ${stat.color}`}>
                    {stat.value.toFixed(1)}{stat.suffix}
                  </p>
                  <span className="text-2xl">
                    {stat.icon}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 요약 정보 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-lg border-2 border-blue-200 p-8">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <span className="text-2xl mr-3">📋</span>
          시스템 요약
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-base">
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow">
              <span className="text-gray-700 font-medium">총 수익 예상:</span>
              <span className="font-bold text-green-600 text-lg">{formatCurrency(totalRevenue)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow">
              <span className="text-gray-700 font-medium">평균 시술 가격:</span>
              <span className="font-bold text-blue-600 text-lg">
                {formatCurrency(totalProcedures > 0 ? totalRevenue / totalProcedures : 0)}
              </span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow">
              <span className="text-gray-700 font-medium">마진율 범위:</span>
              <span className="font-bold text-purple-600 text-lg">
                {lowestMargin.toFixed(1)}% - {highestMargin.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded-lg shadow">
              <span className="text-gray-700 font-medium">수익성 평가:</span>
              <span className={`font-bold text-lg ${getMarginColor(averageMargin)}`}>
                {averageMargin >= 70 ? '💪 매우 양호' : 
                 averageMargin >= 50 ? '👍 양호' : 
                 averageMargin >= 30 ? '😐 보통' : '⚠️ 개선 필요'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 