import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { useStudentOptions } from '@/features/fees/api'

interface StudentSearchInputProps {
  onSelect: (studentId: string) => void
  label?: string
  placeholder?: string
}

/** Type-ahead over the roster — the collect flow's way into one student's page. */
export function StudentSearchInput({
  onSelect,
  label,
  placeholder = 'Type at least 2 characters…',
}: StudentSearchInputProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const students = useStudentOptions()
  const term = query.trim().toLowerCase()

  const matches = useMemo(() => {
    if (term.length < 2) return []
    return (students.data ?? []).filter((option) => option.label.toLowerCase().includes(term)).slice(0, 6)
  }, [students.data, term])

  return (
    <div className="relative w-full">
      {label ? (
        <p className="text-ink-subtle mb-1.5 text-[11px] font-medium tracking-[0.04em] uppercase">{label}</p>
      ) : null}

      <Input
        icon={Search}
        type="search"
        placeholder={placeholder}
        aria-label="Search student"
        value={query}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
      />

      {open && matches.length > 0 ? (
        <ul className="border-line bg-surface absolute z-40 mt-1 w-full overflow-hidden rounded-lg border p-1 shadow-[var(--shadow-hover)]">
          {matches.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onSelect(option.value)
                  setQuery('')
                  setOpen(false)
                }}
                className="hover:bg-primary-soft hover:text-primary text-ink flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-[14px] transition-colors">
                <Search className="text-ink-subtle size-3.5 shrink-0" strokeWidth={1.75} />
                <span className="truncate">{option.label}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
