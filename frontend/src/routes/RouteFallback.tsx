import { Spinner } from '@/components/ui/Spinner'

/** Shown while a lazily-loaded page or the session handshake is in flight. */
export function RouteFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
      <Spinner size="lg" label="Loading" />
    </div>
  )
}
