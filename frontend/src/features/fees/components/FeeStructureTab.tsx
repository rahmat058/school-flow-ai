import { useState } from 'react'
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Modal'
import { DataTable } from '@/components/ui/DataTable'
import type { DataTableColumn } from '@/components/ui/DataTable'
import { Dropdown } from '@/components/ui/Dropdown'
import { Skeleton } from '@/components/ui/Skeleton'
import { cn } from '@/lib/cn'
import { formatDate, formatPaise, humanizeEnum } from '@/lib/format'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/apiClient'
import { useClassOptions } from '@/features/classes/api'
import { useDeleteFeeHead, useFeeStructures } from '@/features/fees/api'
import { FeeHeadSheet } from '@/features/fees/components/FeeHeadSheet'
import type { FeeHeadRow } from '@/types/fees'

export function FeeStructureTab() {
  const { toast } = useToast()
  const classOptions = useClassOptions()
  const [selectedClassId, setSelectedClassId] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<FeeHeadRow | null>(null)
  const [pendingDelete, setPendingDelete] = useState<FeeHeadRow | null>(null)

  const classList = classOptions.data ?? []
  const classId = selectedClassId || classList[0]?.id || ''
  const structures = useFeeStructures(classId)
  const structure = structures.data?.[0]
  const deleteFeeHead = useDeleteFeeHead()

  function openCreate() {
    setEditing(null)
    setSheetOpen(true)
  }

  function openEdit(head: FeeHeadRow) {
    setEditing(head)
    setSheetOpen(true)
  }

  async function confirmDelete() {
    if (!pendingDelete) return

    try {
      await deleteFeeHead.mutateAsync(pendingDelete.id)
      toast({ tone: 'success', title: `${pendingDelete.name} removed` })
      setPendingDelete(null)
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Could not remove the fee head',
        description: error instanceof ApiError ? error.message : 'Please try again.',
      })
    }
  }

  const columns: Array<DataTableColumn<FeeHeadRow>> = [
    {
      id: 'title',
      header: 'Title',
      sortValue: (row) => row.name,
      cell: (row) => <span className="text-ink text-[14px] font-medium">{row.name}</span>,
    },
    {
      id: 'amount',
      header: 'Amount',
      align: 'right',
      sortValue: (row) => row.amountPaise,
      cell: (row) => <span className="tabular-nums">{formatPaise(row.amountPaise)}</span>,
    },
    {
      id: 'frequency',
      header: 'Frequency',
      sortValue: (row) => row.frequency,
      cell: (row) => (
        <span className="bg-canvas text-ink-muted rounded-full px-2.5 py-1 text-[11px] font-medium">
          {humanizeEnum(row.frequency)}
        </span>
      ),
    },
    {
      id: 'due',
      header: 'Due date',
      sortValue: (row) => row.dueDate,
      cell: (row) => <span className="text-ink-muted whitespace-nowrap">{formatDate(row.dueDate)}</span>,
    },
    {
      id: 'year',
      header: 'Academic year',
      sortValue: (row) => row.academicYear,
      cell: (row) => <span className="text-ink-muted">{row.academicYear}</span>,
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <div className="flex justify-end">
          <Dropdown
            triggerLabel={`Actions for ${row.name}`}
            trigger={<MoreHorizontal className="size-4" strokeWidth={1.75} />}
            items={[
              { id: 'edit', label: 'Edit', icon: Pencil, onSelect: () => openEdit(row) },
              {
                id: 'delete',
                label: 'Delete',
                icon: Trash2,
                danger: true,
                separatorBefore: true,
                onSelect: () => setPendingDelete(row),
              },
            ]}
          />
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {classOptions.isPending
            ? Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-8 w-14 rounded-full" />)
            : classList.map((option) => {
                const selected = option.id === classId

                return (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setSelectedClassId(option.id)}
                    className={cn(
                      'rounded-full border px-3.5 py-1.5 text-[12px] font-medium transition-colors',
                      selected
                        ? 'border-primary bg-primary-soft text-primary'
                        : 'border-line text-ink-muted hover:bg-primary-soft hover:text-primary',
                    )}>
                    {option.label}
                  </button>
                )
              })}
        </div>

        <Button onClick={openCreate} disabled={!classId}>
          <Plus className="size-4" strokeWidth={1.75} />
          Add fee head
        </Button>
      </div>

      {structures.isError ? (
        <Alert tone="error" title="Could not load the fee structure">
          {structures.error instanceof ApiError ? structures.error.message : 'Please try again.'}
        </Alert>
      ) : null}

      <div className="space-y-3">
        <h2 className="text-ink text-[14px] font-medium">
          {structure ? `${structure.className} — Fee heads` : 'Fee heads'}
        </h2>

        <DataTable
          data={structure?.heads ?? []}
          columns={columns}
          getRowId={(row) => row.id}
          loading={structures.isPending}
          pageSize={10}
          emptyTitle="No fee heads yet"
          emptyDescription="Add the first line item for this class."
        />

        {structure ? (
          <div className="text-ink-muted flex flex-wrap items-center justify-end gap-x-6 gap-y-1 text-[13px]">
            <span>
              Total heads: <span className="text-ink font-medium">{structure.totalHeads}</span>
            </span>
            <span>
              Sum of amounts:{' '}
              <span className="text-ink font-medium tabular-nums">{formatPaise(structure.totalAmountPaise)}</span>
            </span>
          </div>
        ) : null}
      </div>

      {/* Keyed on the target so the form remounts with that head's values, never the last edit. */}
      <FeeHeadSheet
        key={editing?.id ?? `new-${classId}`}
        open={sheetOpen}
        classId={classId}
        academicYear={structure?.academicYear ?? ''}
        head={editing}
        onClose={() => setSheetOpen(false)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Delete this fee head?"
        description={
          pendingDelete
            ? `${pendingDelete.name} stops being chargeable. Invoices already raised from it are kept.`
            : undefined
        }
        confirmLabel="Delete fee head"
        tone="danger"
        loading={deleteFeeHead.isPending}
      />
    </div>
  )
}
