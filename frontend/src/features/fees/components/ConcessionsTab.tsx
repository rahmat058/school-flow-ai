import { useState } from 'react'
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/Modal'
import { DataTable } from '@/components/ui/DataTable'
import type { DataTableColumn } from '@/components/ui/DataTable'
import { Dropdown } from '@/components/ui/Dropdown'
import { formatPaise } from '@/lib/format'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/apiClient'
import { useConcessions, useDeleteConcession } from '@/features/fees/api'
import { ConcessionSheet } from '@/features/fees/components/ConcessionSheet'
import type { ConcessionCategory, ConcessionRow } from '@/types/fees'

const CATEGORY_LABELS: Record<ConcessionCategory, string> = {
  SIBLING: 'Sibling',
  MERIT: 'Merit',
  SC_ST: 'SC / ST',
  STAFF_WARD: 'Staff ward',
  CUSTOM: 'Custom',
}

export function ConcessionsTab() {
  const { toast } = useToast()
  const concessions = useConcessions()
  const deleteConcession = useDeleteConcession()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<ConcessionRow | null>(null)
  const [pendingDelete, setPendingDelete] = useState<ConcessionRow | null>(null)

  function openCreate() {
    setEditing(null)
    setSheetOpen(true)
  }

  function openEdit(concession: ConcessionRow) {
    setEditing(concession)
    setSheetOpen(true)
  }

  async function confirmDelete() {
    if (!pendingDelete) return

    try {
      await deleteConcession.mutateAsync(pendingDelete.id)
      toast({ tone: 'success', title: 'Concession removed' })
      setPendingDelete(null)
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Could not remove the concession',
        description: error instanceof ApiError ? error.message : 'Please try again.',
      })
    }
  }

  const columns: Array<DataTableColumn<ConcessionRow>> = [
    {
      id: 'student',
      header: 'Student',
      sortValue: (row) => row.studentName,
      cell: (row) => <span className="text-ink text-[14px] font-medium">{row.studentName}</span>,
    },
    { id: 'class', header: 'Class', sortValue: (row) => row.className, cell: (row) => row.className },
    {
      id: 'head',
      header: 'Fee structure',
      sortValue: (row) => row.feeHeadTitle ?? 'All',
      cell: (row) => <span className="text-ink-muted text-[13px]">{row.feeHeadTitle ?? 'All fee structures'}</span>,
    },
    {
      id: 'type',
      header: 'Type',
      sortValue: (row) => row.category,
      cell: (row) => (
        <span className="bg-canvas text-ink-muted rounded-full px-2.5 py-1 text-[11px] font-medium">
          {CATEGORY_LABELS[row.category]}
        </span>
      ),
    },
    {
      id: 'discount',
      header: 'Discount',
      sortValue: (row) => row.discountLabel,
      cell: (row) => <span className="text-success font-medium tabular-nums">{row.discountLabel}</span>,
    },
    {
      id: 'effective',
      header: 'Effective amount',
      align: 'right',
      sortValue: (row) => row.effectivePaise,
      cell: (row) => <span className="tabular-nums">{formatPaise(row.effectivePaise)}</span>,
    },
    {
      id: 'description',
      header: 'Description',
      cell: (row) => <span className="text-ink-muted line-clamp-1 max-w-[240px] text-[13px]">{row.reason ?? '—'}</span>,
    },
    {
      id: 'actions',
      header: 'Actions',
      align: 'right',
      cell: (row) => (
        <div className="flex justify-end">
          <Dropdown
            triggerLabel={`Actions for ${row.studentName}'s concession`}
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
        <div>
          <h2 className="font-display text-ink text-[18px] font-semibold tracking-[-0.03em]">
            Concession / discount management
          </h2>
          <p className="text-ink-muted mt-1 text-[13px]">Apply % or flat discounts per student per fee head.</p>
        </div>

        <Button onClick={openCreate}>
          <Plus className="size-4" strokeWidth={1.75} />
          Add concession
        </Button>
      </div>

      {concessions.isError ? (
        <Alert tone="error" title="Could not load concessions">
          {concessions.error instanceof ApiError ? concessions.error.message : 'Please try again.'}
        </Alert>
      ) : null}

      <DataTable
        data={concessions.data ?? []}
        columns={columns}
        getRowId={(row) => row.id}
        loading={concessions.isPending}
        pageSize={10}
        emptyTitle="No concessions yet"
        emptyDescription="Discounts recorded here are applied when the next invoice is raised."
      />

      {/* Keyed on the target so the form remounts with that concession's values. */}
      <ConcessionSheet
        key={editing?.id ?? 'new'}
        open={sheetOpen}
        concession={editing}
        onClose={() => setSheetOpen(false)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Remove this concession?"
        description={
          pendingDelete
            ? `${pendingDelete.studentName}'s ${CATEGORY_LABELS[pendingDelete.category].toLowerCase()} concession stops applying to new invoices.`
            : undefined
        }
        confirmLabel="Remove concession"
        tone="danger"
        loading={deleteConcession.isPending}
      />
    </div>
  )
}
