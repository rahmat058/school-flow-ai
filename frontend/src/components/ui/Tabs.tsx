import { cn } from '@/lib/cn'
import { motion } from 'motion/react'
import { createContext, useContext, useId, useRef } from 'react'
import { useControllableState } from '@/hooks/useControllableState'
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react'

interface TabsContextValue {
  value: string
  setValue: (value: string) => void
  baseId: string
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext(component: string) {
  const context = useContext(TabsContext)
  if (!context) throw new Error(`${component} must be rendered inside <Tabs>`)
  return context
}

interface TabsProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  children: ReactNode
  className?: string
}

export function Tabs({ value, defaultValue = '', onValueChange, children, className }: TabsProps) {
  const baseId = useId()
  const [currentValue, setValue] = useControllableState({ value, defaultValue, onChange: onValueChange })

  return (
    <TabsContext.Provider value={{ value: currentValue, setValue, baseId }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

interface TabListProps {
  children: ReactNode
  className?: string
}

export function TabList({ children, className }: TabListProps) {
  const { baseId } = useTabsContext('TabList')
  const listRef = useRef<HTMLDivElement>(null)

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    const tabs = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])') ?? [])
    if (tabs.length === 0) return

    const currentIndex = tabs.findIndex((tab) => tab === document.activeElement)
    let nextIndex = -1

    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length
    else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = tabs.length - 1

    if (nextIndex < 0) return

    event.preventDefault()
    tabs[nextIndex].focus()
    tabs[nextIndex].click()
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      id={`${baseId}-tablist`}
      onKeyDown={handleKeyDown}
      className={cn('border-line relative flex items-center gap-1 border-b', className)}>
      {children}
    </div>
  )
}

interface TabProps {
  value: string
  children: ReactNode
  disabled?: boolean
  className?: string
}

export function Tab({ value, children, disabled, className }: TabProps) {
  const { value: activeValue, setValue, baseId } = useTabsContext('Tab')
  const isActive = activeValue === value

  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-selected={isActive}
      aria-controls={`${baseId}-panel-${value}`}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      onClick={() => setValue(value)}
      className={cn(
        'relative px-3 py-2.5 text-[14px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        isActive ? 'text-primary' : 'text-ink-muted hover:text-primary',
        className,
      )}>
      {children}
      {isActive ? (
        <motion.span
          layoutId={`${baseId}-tab-indicator`}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          className="bg-primary absolute inset-x-0 -bottom-px h-[2px] rounded-full"
        />
      ) : null}
    </button>
  )
}

interface TabPanelProps {
  value: string
  children: ReactNode
  className?: string
}

export function TabPanel({ value, children, className }: TabPanelProps) {
  const { value: activeValue, baseId } = useTabsContext('TabPanel')

  if (activeValue !== value) return null

  return (
    <motion.div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      tabIndex={0}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn('pt-4 focus:outline-none', className)}>
      {children}
    </motion.div>
  )
}
