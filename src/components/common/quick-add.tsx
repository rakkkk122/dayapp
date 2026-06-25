'use client'

import * as React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'

interface QuickAddProps {
  title: string
  description?: string
  triggerLabel?: string
  children: (close: () => void) => React.ReactNode
  open?: boolean
  onOpenChange?: (o: boolean) => void
}

export function QuickAdd({
  title,
  description,
  triggerLabel = 'Tambah',
  children,
  open,
  onOpenChange,
}: QuickAddProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setOpen = isControlled && onOpenChange ? onOpenChange : setInternalOpen

  return (
    <>
      <Button
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-1.5 rounded-full shadow-sm"
      >
        <Plus className="h-4 w-4" />
        {triggerLabel}
      </Button>
      <Sheet open={isOpen} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[90vh] overflow-y-auto no-scrollbar"
        >
          <SheetHeader>
            <SheetTitle className="text-left">{title}</SheetTitle>
            {description && (
              <SheetDescription className="text-left">{description}</SheetDescription>
            )}
          </SheetHeader>
          <div className="px-4 pb-6 pt-2">
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.18 }}
              >
                {children(() => setOpen(false))}
              </motion.div>
            </AnimatePresence>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

export function FloatingAddButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      aria-label="Tambah baru"
      className="fixed right-4 bottom-20 md:bottom-6 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center active:scale-90 transition-transform"
      whileTap={{ scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
    >
      <Plus className="h-6 w-6" />
    </motion.button>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export { X }
