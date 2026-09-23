import { cn } from '@/lib/cn'
import type { ReactNode } from 'react'
import { useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'

export interface AccordionItemConfig {
  id: string
  title: string
  content: ReactNode
  disabled?: boolean
}

interface AccordionProps {
  items: AccordionItemConfig[]
  allowMultiple?: boolean
  defaultOpenIds?: string[]
  className?: string
}

export function Accordion({ items, allowMultiple = false, defaultOpenIds = [], className }: AccordionProps) {
  const baseId = useId()
  const [openIds, setOpenIds] = useState<string[]>(defaultOpenIds)

  function toggle(id: string) {
    setOpenIds((current) => {
      if (current.includes(id)) return current.filter((itemId) => itemId !== id)
      return allowMultiple ? [...current, id] : [id]
    })
  }

  return (
    <div className={cn('border-line bg-surface divide-line divide-y overflow-hidden rounded-xl border', className)}>
      {items.map((item) => {
        const isOpen = openIds.includes(item.id)

        return (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => toggle(item.id)}
              disabled={item.disabled}
              aria-expanded={isOpen}
              aria-controls={`${baseId}-panel-${item.id}`}
              className="hover:bg-primary-soft flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50">
              <span className="text-ink text-[14px] font-medium">{item.title}</span>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="text-ink-subtle shrink-0">
                <ChevronDown className="size-4" strokeWidth={1.75} />
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen ? (
                <motion.div
                  key="content"
                  id={`${baseId}-panel-${item.id}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="overflow-hidden">
                  <div className="text-ink-muted px-4 pb-4 text-[14px]">{item.content}</div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
