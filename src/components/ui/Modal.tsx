import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "./Button"
import type { ModalProps } from "@/types"

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  className,
}) => {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      document.body.style.overflow = 'hidden'
    } else {
      const timer = setTimeout(() => setIsVisible(false), 150)
      document.body.style.overflow = 'unset'
      return () => clearTimeout(timer)
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black transition-opacity duration-150",
          isOpen ? "opacity-50" : "opacity-0"
        )}
        onClick={handleBackdropClick}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div
          className={cn(
            "relative w-full bg-white rounded-lg shadow-xl transition-all duration-150",
            sizeClasses[size],
            isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0",
            className
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6 rounded-full"
            >
              <span className="sr-only">닫기</span>
              ✕
            </Button>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

// 모달 컨텍스트
interface ModalContextType {
  openModal: (content: React.ReactNode, options?: Partial<ModalProps>) => void
  closeModal: () => void
}

const ModalContext = React.createContext<ModalContextType | null>(null)

export const useModal = () => {
  const context = React.useContext(ModalContext)
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  return context
}

interface ModalProviderProps {
  children: React.ReactNode
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [modalState, setModalState] = React.useState<{
    isOpen: boolean
    content: React.ReactNode
    options: Partial<ModalProps>
  }>({
    isOpen: false,
    content: null,
    options: {},
  })

  const openModal = (content: React.ReactNode, options: Partial<ModalProps> = {}) => {
    setModalState({
      isOpen: true,
      content,
      options,
    })
  }

  const closeModal = () => {
    setModalState(prev => ({
      ...prev,
      isOpen: false,
    }))
  }

  return (
    <ModalContext.Provider value={{ openModal, closeModal }}>
      {children}
      <Modal
        isOpen={modalState.isOpen}
        onClose={closeModal}
        title={modalState.options.title || ''}
        size={modalState.options.size}
        className={modalState.options.className}
      >
        {modalState.content}
      </Modal>
    </ModalContext.Provider>
  )
}

export { Modal } 