import { useState } from 'react'
import { cn } from '@/lib/cn'
import { useStaffPermissions } from '@/features/permissions/api'
import { PermissionEditor } from '@/features/permissions/components/PermissionEditor'
import { StaffList } from '@/features/permissions/components/StaffList'

export function PermissionsPage() {
  const staff = useStaffPermissions()
  const [pickedId, setPickedId] = useState<string | null>(null)
  // The desktop layout opens on the first teacher, the way the design reads; a phone shows the list
  // first, so a teacher is only opened by an explicit tap.
  const [wide] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches)

  const rows = staff.data ?? []
  const fallbackId = wide ? (rows[0]?.userId ?? null) : null
  const selectedId = rows.some((row) => row.userId === pickedId) ? pickedId : fallbackId

  return (
    <div className="border-line bg-surface flex h-[calc(100dvh-7rem)] overflow-hidden rounded-xl border shadow-(--shadow-card) lg:h-[calc(100dvh-8.5rem)]">
      <StaffList
        rows={rows}
        activeId={selectedId}
        onSelect={setPickedId}
        loading={staff.isPending}
        className={cn('border-line w-full border-r lg:w-80 xl:w-90', selectedId ? 'hidden lg:flex' : 'flex')}
      />

      {/* Keyed on the teacher so a half-made edit never carries across to the next one. */}
      <PermissionEditor
        key={selectedId ?? 'none'}
        userId={selectedId}
        onBack={() => setPickedId(null)}
        className={selectedId ? 'block' : 'hidden lg:block'}
      />
    </div>
  )
}
