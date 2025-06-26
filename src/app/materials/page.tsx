"use client"

import React, { useState } from 'react'
import { MaterialList } from '@/components/materials/MaterialList'
import { MaterialForm } from '@/components/materials/MaterialForm'
import { MaterialUpload } from '@/components/materials/MaterialUpload'
import { Modal } from '@/components/ui/Modal'
import type { Material } from '@/types'

export default function MaterialsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<Material | undefined>()

  const handleAdd = () => {
    setEditingMaterial(undefined)
    setIsModalOpen(true)
  }

  const handleEdit = (material: Material) => {
    setEditingMaterial(material)
    setIsModalOpen(true)
  }

  const handleSuccess = () => {
    setIsModalOpen(false)
    setEditingMaterial(undefined)
  }

  const handleCancel = () => {
    setIsModalOpen(false)
    setEditingMaterial(undefined)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <MaterialList 
          onAdd={handleAdd} 
          onEdit={handleEdit} 
          onUpload={() => setIsUploadOpen(true)}
        />
        
        <Modal
          isOpen={isModalOpen}
          onClose={handleCancel}
          title={editingMaterial ? '재료 수정' : '재료 추가'}
          size="lg"
        >
          <MaterialForm
            material={editingMaterial}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </Modal>

        <MaterialUpload
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          onSuccess={() => setIsUploadOpen(false)}
        />
      </div>
    </div>
  )
} 