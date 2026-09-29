import { Link } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { Panel } from '@/components/ui/Panel'
import { studentProfilePath } from '@/routes/paths'
import type { ParentListItem } from '@/types/people'

interface ParentChildrenTabProps {
  parent: ParentListItem
}

/** The students this guardian is linked to; each opens that student's profile. */
export function ParentChildrenTab({ parent }: ParentChildrenTabProps) {
  return (
    <Panel title={`Linked students (${parent.children.length})`}>
      {parent.children.length === 0 ? (
        <p className="text-ink-subtle text-[13px]">No students linked yet.</p>
      ) : (
        <ul className="divide-line divide-y">
          {parent.children.map((child) => (
            <li key={child.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
              <Avatar name={child.name} size="sm" />

              <div className="min-w-0 flex-1">
                <Link to={studentProfilePath(child.id)} className="text-ink hover:text-primary text-[14px] font-medium">
                  {child.name}
                </Link>
                <p className="text-ink-subtle text-[12px]">{child.className}</p>
              </div>

              <span className="bg-primary-soft text-primary rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize">
                {child.relation.toLowerCase()}
              </span>
              {child.isPrimary ? (
                <span className="bg-success-soft text-success rounded-full px-2.5 py-0.5 text-[11px] font-medium">
                  Primary
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
