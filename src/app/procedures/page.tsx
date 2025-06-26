"use client"

import React, { useState } from 'react'
import { ProcedureList } from '@/components/procedures/ProcedureList'
import { ProcedureForm } from '@/components/procedures/ProcedureForm'
import { ProcedureUpload } from '@/components/procedures/ProcedureUpload'
import { Modal } from '@/components/ui/Modal'
import type { Procedure } from '@/types'

export default function ProceduresPage() {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [editingProcedure, setEditingProcedure] = useState<Procedure | undefined>()

  const handleAdd = () => {
    setEditingProcedure(undefined)
    setIsFormModalOpen(true)
  }

  const handleEdit = (procedure: Procedure) => {
    setEditingProcedure(procedure)
    setIsFormModalOpen(true)
  }

  const handleUpload = () => {
    setIsUploadModalOpen(true)
  }

  const handleFormSuccess = () => {
    setIsFormModalOpen(false)
    setEditingProcedure(undefined)
  }

  const handleFormCancel = () => {
    setIsFormModalOpen(false)
    setEditingProcedure(undefined)
  }

  const handleUploadSuccess = () => {
    setIsUploadModalOpen(false)
  }

  const handleUploadCancel = () => {
    setIsUploadModalOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <ProcedureList 
          onAdd={handleAdd} 
          onEdit={handleEdit} 
          onUpload={handleUpload}
        />
        
        {/* 시술 폼 모달 */}
        <Modal
          isOpen={isFormModalOpen}
          onClose={handleFormCancel}
          size="xl"
          title={editingProcedure ? '시술 수정' : '시술 추가'}
        >
          <ProcedureForm
            procedure={editingProcedure}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </Modal>

        {/* 시술 업로드 모달 */}
        <Modal
          isOpen={isUploadModalOpen}
          onClose={handleUploadCancel}
          size="xl"
          title="시술 CSV 업로드"
        >
          <ProcedureUpload
            onSuccess={handleUploadSuccess}
            onCancel={handleUploadCancel}
          />
        </Modal>
      </div>
    </div>
  )
} 