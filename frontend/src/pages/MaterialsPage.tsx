import { useEffect, useState } from 'react'
import { BookOpen, Plus, Search } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/Modal'
import { Select } from '@/components/ui/Select'
import { Skeleton } from '@/components/ui/Skeleton'
import { materialTypeFilterOptions } from '@/lib/options'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/apiClient'
import { useCurrentUser } from '@/store/auth'
import { useClassOptions } from '@/features/classes/api'
import { fetchMaterialDetail, useDeleteMaterial, useMaterials } from '@/features/materials/api'
import { MaterialCard } from '@/features/materials/components/admin/MaterialCard'
import { MaterialFormSheet } from '@/features/materials/components/admin/MaterialFormSheet'
import { MaterialPreviewModal } from '@/features/materials/components/admin/MaterialPreviewModal'
import { useSubjects } from '@/features/subjects/api'
import type { MaterialListItem, MaterialType } from '@/types/materials'

export function MaterialsPage() {
  const { toast } = useToast()
  const user = useCurrentUser()
  // Everyone reads the library; only staff upload or remove.
  const canManage = user?.role === 'ADMIN' || user?.role === 'TEACHER'

  const classOptions = useClassOptions()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [classId, setClassId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [type, setType] = useState<MaterialType | ''>('')
  const [formOpen, setFormOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<MaterialListItem | null>(null)
  const [previewTarget, setPreviewTarget] = useState<MaterialListItem | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  // Debounced so typing does not fire a request per keystroke.
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300)

    return () => window.clearTimeout(timer)
  }, [search])

  const materials = useMaterials({ search: debouncedSearch, classId, subjectId, type })
  const subjects = useSubjects(classId ? { classId } : {})
  const deleteMaterial = useDeleteMaterial()
  const rows = materials.data ?? []
  const hasFilters = Boolean(debouncedSearch || classId || subjectId || type)

  const classSelectOptions = [
    { value: '', label: 'All classes' },
    ...(classOptions.data ?? []).map((option) => ({ value: option.id, label: option.label })),
  ]

  // Subjects belong to a class, so the filter cannot offer them until one is chosen.
  const subjectSelectOptions = [
    { value: '', label: 'All subjects' },
    ...(subjects.data ?? []).map((subject) => ({ value: subject.id, label: subject.name })),
  ]

  async function handleDownload(material: MaterialListItem) {
    // Opened up-front so the browser ties the tab to the click, not to the await below.
    const tab = window.open('', '_blank')
    setDownloadingId(material.id)

    try {
      const detail = await fetchMaterialDetail(material.id)

      if (tab) {
        tab.opener = null
        tab.location.href = detail.signedUrl
      } else {
        window.open(detail.signedUrl, '_blank', 'noopener')
      }
    } catch (error) {
      tab?.close()
      toast({
        tone: 'error',
        title: 'Could not prepare this download',
        description: error instanceof ApiError ? error.message : 'Please try again.',
      })
    } finally {
      setDownloadingId(null)
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return

    try {
      await deleteMaterial.mutateAsync(pendingDelete.id)
      toast({
        tone: 'success',
        title: `${pendingDelete.title} removed`,
        description: 'The file leaves the library along with its record.',
      })
      setPendingDelete(null)
    } catch (error) {
      toast({
        tone: 'error',
        title: 'Could not remove this material',
        description: error instanceof ApiError ? error.message : 'Please try again.',
      })
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-ink text-[24px] font-semibold tracking-[-0.03em]">Study materials</h1>
          <p className="text-ink-muted text-[14px]">
            {materials.isPending
              ? 'Loading materials…'
              : `${rows.length} material${rows.length === 1 ? '' : 's'}${hasFilters ? ' match' : ' total'}.`}
          </p>
        </div>

        {canManage ? (
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="size-4" strokeWidth={1.75} />
            Upload material
          </Button>
        ) : null}
      </header>

      {materials.isError ? (
        <Alert tone="error" title="Could not load study materials">
          {materials.error instanceof ApiError ? materials.error.message : 'Please try again.'}
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full max-w-sm">
          <Input
            icon={Search}
            type="search"
            placeholder="Search by title, subject or class…"
            aria-label="Search study materials"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <Select
          className="max-w-45"
          options={classSelectOptions}
          value={classId}
          onValueChange={(value) => {
            setClassId(value)
            // The chosen subject may not be taught in the new class.
            setSubjectId('')
          }}
          aria-label="Filter by class"
        />

        <Select
          className="max-w-45"
          options={subjectSelectOptions}
          placeholder="All subjects"
          value={subjectId}
          onValueChange={setSubjectId}
          disabled={!classId || subjects.isPending}
          aria-label="Filter by subject"
        />

        <Select
          className="max-w-45"
          options={materialTypeFilterOptions}
          value={type}
          onValueChange={(value) => setType(value as MaterialType | '')}
          aria-label="Filter by type"
        />
      </div>

      {materials.isPending ? (
        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-64 rounded-xl" />
          ))}
        </section>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No study materials found"
          description={
            hasFilters
              ? 'Nothing matches those filters yet. Try another class or clear the search.'
              : 'No material has been uploaded yet.'
          }
          action={
            canManage && !hasFilters ? (
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="size-4" strokeWidth={1.75} />
                Upload material
              </Button>
            ) : null
          }
        />
      ) : (
        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((material) => (
            <MaterialCard
              key={material.id}
              material={material}
              canManage={canManage}
              downloading={downloadingId === material.id}
              onPreview={(row) => setPreviewTarget(row)}
              onDownload={handleDownload}
              onDelete={setPendingDelete}
            />
          ))}
        </section>
      )}

      {/* Keyed on the open state so a fresh upload never inherits a cancelled form's file. */}
      <MaterialFormSheet key={formOpen ? 'open' : 'closed'} open={formOpen} onClose={() => setFormOpen(false)} />

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Delete this material?"
        description={
          pendingDelete
            ? `${pendingDelete.title} leaves the library and its stored file is removed. This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete material"
        tone="danger"
        loading={deleteMaterial.isPending}
      />

      <MaterialPreviewModal
        material={previewTarget}
        onClose={() => setPreviewTarget(null)}
        onDownload={handleDownload}
      />
    </div>
  )
}
