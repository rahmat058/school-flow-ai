import { Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { ReactNode } from 'react'
import type { StudentProfile } from '@/types/people'

/**
 * Presentational pieces shared by every student sheet. Components only — the builders in
 * `studentPdf.tsx` compose them, which keeps both files clean for the fast-refresh rule.
 */

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: 'Helvetica', color: '#0a0a0a' },
  school: { fontSize: 16, fontFamily: 'Helvetica-Bold' },
  heading: { fontSize: 12, color: '#6b6b6b', marginTop: 2 },
  meta: { marginTop: 18, flexDirection: 'row', flexWrap: 'wrap', gap: 18 },
  metaLabel: { fontSize: 8, color: '#9c9c9c', textTransform: 'uppercase' },
  metaValue: { fontSize: 11, marginTop: 2 },
  summary: { marginTop: 18, flexDirection: 'row', gap: 18 },
  summaryCell: { borderWidth: 1, borderColor: '#e8e8ec', borderRadius: 6, padding: 10, flexGrow: 1 },
  table: { marginTop: 22, borderTopWidth: 1, borderColor: '#e8e8ec' },
  headRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#9c9c9c', paddingBottom: 4 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#e8e8ec', paddingVertical: 6 },
  cell: { fontSize: 9 },
  headCell: { fontSize: 8, color: '#6b6b6b', textTransform: 'uppercase' },
  empty: { marginTop: 22, fontSize: 10, color: '#6b6b6b' },
  footer: { marginTop: 24, fontSize: 8, color: '#9c9c9c' },
})

export interface PdfCell {
  text: string
  width: number
  align?: 'left' | 'right'
}

export function SheetPage({ children }: { children: ReactNode }) {
  return (
    <Page size="A4" style={styles.page}>
      {children}
    </Page>
  )
}

/** School, sheet name and the student block — identical on every sheet. */
export function SheetHeading({
  schoolName,
  title,
  profile,
}: {
  schoolName: string
  title: string
  profile: StudentProfile
}) {
  return (
    <View>
      <Text style={styles.school}>{schoolName}</Text>
      <Text style={styles.heading}>
        {title} · {profile.className}
      </Text>

      <View style={styles.meta}>
        <Meta label="Student" value={`${profile.firstName} ${profile.lastName}`} />
        <Meta label="Admission no." value={profile.admissionNo} />
        <Meta label="Class" value={profile.className} />
        <Meta label="Roll no." value={String(profile.rollNo)} />
      </View>
    </View>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  )
}

export function Summary({ children }: { children: ReactNode }) {
  return <View style={styles.summary}>{children}</View>
}

export function Tile({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryCell}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  )
}

export function SheetTable({ head, children }: { head: PdfCell[]; children: ReactNode }) {
  return (
    <View style={styles.table}>
      <Row cells={head} head />
      {children}
    </View>
  )
}

export function Row({ cells, head = false }: { cells: PdfCell[]; head?: boolean }) {
  return (
    <View style={head ? styles.headRow : styles.row}>
      {cells.map((cell, index) => (
        <Text
          key={index}
          style={[
            head ? styles.headCell : styles.cell,
            { width: cell.width },
            cell.align === 'right' ? { textAlign: 'right' } : {},
          ]}>
          {cell.text}
        </Text>
      ))}
    </View>
  )
}

export function SheetEmpty({ text }: { text: string }) {
  return <Text style={styles.empty}>{text}</Text>
}

export function SheetNote({ text }: { text: string }) {
  return <Text style={styles.footer}>{text}</Text>
}
