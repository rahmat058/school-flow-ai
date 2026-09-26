import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, ChevronDown, Search } from 'lucide-react'
import { cn } from '@/lib/cn'
import { COUNTRIES, COUNTRY_BY_CODE, DEFAULT_COUNTRY, PRIMARY_DIAL_CODES } from '@/lib/countries'
import type { Country } from '@/lib/countries'
import type { ChangeEvent, KeyboardEvent } from 'react'

function Flag({ code, className }: { code: string; className?: string }) {
  return (
    <img
      src={`/flags/${code.toLowerCase()}.svg`}
      alt=""
      aria-hidden
      className={cn('ring-line h-4 w-6 shrink-0 rounded-xs object-cover ring-1', className)}
    />
  )
}

/** The country a stored E.164 value belongs to. Where the calling code is shared (the `+1` group),
 * the caller's fallback wins if it is one of them, else the code's principal country. */
function countryOf(value: string | undefined, fallback: Country): Country {
  if (!value?.startsWith('+')) return fallback

  const digits = value.slice(1)
  let best: Country | null = null
  for (const country of COUNTRIES) {
    if (!digits.startsWith(country.dialCode)) continue
    if (!best || country.dialCode.length > best.dialCode.length) best = country
  }
  if (!best) return fallback

  const match: Country = best
  const sameDialCode = COUNTRIES.filter((country) => country.dialCode === match.dialCode)
  if (sameDialCode.some((country) => country.code === fallback.code)) return fallback

  return COUNTRY_BY_CODE[PRIMARY_DIAL_CODES[match.dialCode]] ?? match
}

/** The national part shown in the input — the E.164 value minus its calling code. */
function nationalDigits(value: string | undefined, country: Country): string {
  if (!value?.startsWith('+')) return ''

  const rest = value.slice(1)
  return rest.startsWith(country.dialCode) ? rest.slice(country.dialCode.length) : rest
}

/** The E.164 value for what was typed, dropping the trunk prefix a user dials at home. */
function toE164(country: Country, digits: string): string {
  const significant =
    country.nationalPrefix && digits.startsWith(country.nationalPrefix)
      ? digits.slice(country.nationalPrefix.length)
      : digits

  return significant ? `+${country.dialCode}${significant}` : ''
}

export interface PhoneInputProps {
  label?: string
  hint?: string
  error?: string
  /** The number in E.164 (`+8801712345678`); `''` while the field is empty. */
  value?: string
  onChange: (value: string) => void
  onBlur?: () => void
  name?: string
  id?: string
  placeholder?: string
  /** Two-letter code the field opens on. */
  defaultCountry?: string
  disabled?: boolean
  className?: string
}

/**
 * International phone field, hand-rolled on the design system — no phone library. A country prefix
 * (flag + calling code, a searchable dropdown) sits before the number, which is national-only, so
 * the calling code is never typed twice; the value a form receives is E.164. Changing the country
 * clears the number, since digits entered for one country mean nothing in another. The country data
 * lives in `lib/countries.ts` and the flags are the SVGs in `public/flags/`, so nothing is fetched.
 *
 * Bind it through react-hook-form's `Controller`; pair it with `phoneRules` / `optionalPhoneRules`
 * from `lib/validation.ts`.
 */
export function PhoneInput({
  label,
  hint,
  error,
  value,
  onChange,
  onBlur,
  name,
  id,
  placeholder,
  defaultCountry = DEFAULT_COUNTRY,
  disabled,
  className,
}: PhoneInputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const listId = `${inputId}-country-list`
  const messageId = `${inputId}-message`
  const hasMessage = Boolean(error || hint)

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [country, setCountry] = useState<Country>(() => {
    const fallback = COUNTRY_BY_CODE[defaultCountry] ?? COUNTRY_BY_CODE[DEFAULT_COUNTRY] ?? COUNTRIES[0]
    return countryOf(value, fallback)
  })
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const options = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return COUNTRIES

    const digits = term.replace(/\D/g, '')
    return COUNTRIES.filter(
      (option) =>
        option.name.toLowerCase().includes(term) ||
        (digits.length > 0 && (option.dialCode.startsWith(digits) || `+${option.dialCode}`.startsWith(term))),
    )
  }, [query])

  const digits = nationalDigits(value, country)

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  useEffect(() => {
    if (!open || activeIndex < 0) return
    document.getElementById(`${listId}-option-${activeIndex}`)?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, listId, open])

  function openList() {
    const selectedIndex = COUNTRIES.indexOf(country)
    setQuery('')
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
    setOpen(true)
  }

  function selectCountry(next: Country) {
    setOpen(false)
    if (next.code === country.code) return

    // A number entered for one country means nothing in another, so switching clears the field.
    setCountry(next)
    onChange('')
    inputRef.current?.focus()
  }

  function moveActive(step: number) {
    if (options.length === 0) return
    setActiveIndex((current) => (current + step + options.length) % options.length)
  }

  function handleButtonKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openList()
    }
  }

  function handlePanelKeyDown(event: KeyboardEvent<HTMLElement>) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        moveActive(1)
        break
      case 'ArrowUp':
        event.preventDefault()
        moveActive(-1)
        break
      case 'Home':
        event.preventDefault()
        setActiveIndex(0)
        break
      case 'End':
        event.preventDefault()
        setActiveIndex(options.length - 1)
        break
      case 'Enter': {
        event.preventDefault()
        const option = options[activeIndex]
        if (option) selectCountry(option)
        break
      }
      case 'Escape':
        event.preventDefault()
        setOpen(false)
        break
      case 'Tab':
        setOpen(false)
        break
      default:
        break
    }
  }

  function handleNumberChange(event: ChangeEvent<HTMLInputElement>) {
    const limit = country.maxLength + (country.nationalPrefix?.length ?? 0)
    const typed = event.target.value.replace(/\D/g, '').slice(0, limit)
    onChange(toE164(country, typed))
  }

  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={inputId} className="text-ink mb-1.5 block text-[13px] font-medium">
          {label}
        </label>
      ) : null}

      <div ref={containerRef} className="relative">
        <div
          className={cn(
            'border-line bg-surface focus-within:border-primary focus-within:ring-primary/12 flex h-10.5 w-full items-center gap-1.5 rounded-md border pr-3.5 pl-2 transition-colors focus-within:ring-[3px]',
            disabled && 'bg-canvas cursor-not-allowed',
            error && 'border-error focus-within:border-error focus-within:ring-error/12',
            className,
          )}>
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={listId}
            aria-label="Country"
            disabled={disabled}
            onClick={() => (open ? setOpen(false) : openList())}
            onKeyDown={handleButtonKeyDown}
            className={cn(
              'group flex shrink-0 items-center gap-1.5 self-stretch rounded-md px-1.5 transition-colors',
              disabled ? 'cursor-not-allowed' : 'hover:bg-primary-soft',
              open && 'bg-primary-soft',
            )}>
            <Flag code={country.code} />
            <span
              className={cn(
                'text-ink group-hover:text-primary text-[14px] font-medium tabular-nums transition-colors',
                open && 'text-primary',
              )}>
              +{country.dialCode}
            </span>
            <ChevronDown
              className={cn(
                'text-ink-subtle group-hover:text-primary size-3.5 shrink-0 transition-transform',
                open && 'text-primary rotate-180',
              )}
              strokeWidth={2}
              aria-hidden
            />
          </button>

          <span className="bg-line h-4 w-px shrink-0" aria-hidden />

          <input
            ref={inputRef}
            id={inputId}
            name={name}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={digits}
            onChange={handleNumberChange}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-describedby={hasMessage ? messageId : undefined}
            className="text-ink placeholder:text-ink-subtle min-w-0 flex-1 border-0 bg-transparent text-[14px] tabular-nums outline-none focus-visible:shadow-none disabled:cursor-not-allowed"
          />
        </div>

        <AnimatePresence>
          {open ? (
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="border-line bg-surface absolute z-50 mt-1 w-full origin-top overflow-hidden rounded-lg border shadow-(--shadow-hover)">
              <div className="border-line relative border-b">
                <Search
                  className="text-ink-subtle pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2"
                  strokeWidth={1.75}
                  aria-hidden
                />
                <input
                  autoFocus
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setActiveIndex(0)
                  }}
                  onKeyDown={handlePanelKeyDown}
                  placeholder="Search country"
                  aria-label="Search country"
                  aria-controls={listId}
                  className="text-ink placeholder:text-ink-subtle h-9.5 w-full bg-transparent pr-3 pl-9 text-[13px] outline-none focus-visible:shadow-none"
                />
              </div>

              <ul id={listId} role="listbox" aria-label="Country" className="max-h-60 overflow-y-auto p-1">
                {options.map((option, index) => {
                  const isSelected = option.code === country.code

                  return (
                    <li
                      key={option.code}
                      id={`${listId}-option-${index}`}
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectCountry(option)}
                      className={cn(
                        'flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-[13.5px] transition-colors',
                        index === activeIndex && 'bg-primary-soft text-primary',
                        isSelected && 'font-medium',
                      )}>
                      <Flag code={option.code} />
                      <span className="flex-1 truncate">{option.name}</span>
                      <span className="text-ink-subtle tabular-nums">+{option.dialCode}</span>
                      {isSelected ? <Check className="text-primary size-4 shrink-0" strokeWidth={2} /> : null}
                    </li>
                  )
                })}
                {options.length === 0 ? (
                  <li className="text-ink-subtle px-2.5 py-2 text-[13px]">No country found</li>
                ) : null}
              </ul>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {error ? (
        <p id={messageId} className="text-error mt-1.5 text-[12px]">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="text-ink-subtle mt-1.5 text-[12px]">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
