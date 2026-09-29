import { Panel, PanelField } from '@/components/ui/Panel'
import { StatusBadge } from '@/components/ui/Badge'
import type { ParentListItem } from '@/types/people'

interface ParentOverviewTabProps {
  parent: ParentListItem
}

/** Overview: the guardian's own record and how many students they are on file for. */
export function ParentOverviewTab({ parent }: ParentOverviewTabProps) {
  return (
    <Panel title="Parent details">
      <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
        <PanelField label="Email" value={parent.email ?? '—'} />
        <PanelField label="Phone" value={parent.phone ?? '—'} />
        <PanelField label="Occupation" value={parent.occupation ?? '—'} />
        <PanelField label="Linked students" value={String(parent.children.length)} />
        <PanelField label="Address" value={parent.address ?? '—'} />
        <PanelField label="Status" value={<StatusBadge status={parent.status} />} />
      </dl>
    </Panel>
  )
}
