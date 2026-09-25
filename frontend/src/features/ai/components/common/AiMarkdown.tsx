import type { ReactNode } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table'

/**
 * A deliberately small markdown renderer for AI output — headings, tables, lists, rules, paragraphs
 * and inline bold / italic / code. That is the shape the assistant's replies take (the prompt
 * templates ask for it), so a full markdown package would be a dependency for nothing. It builds
 * React nodes rather than HTML, so nothing a model returns is ever injected into the page.
 */
export function AiMarkdown({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const blocks: ReactNode[] = []
  let cursor = 0

  while (cursor < lines.length) {
    const line = lines[cursor]

    if (!line.trim()) {
      cursor += 1
      continue
    }

    if (isRule(line)) {
      blocks.push(<hr key={`hr-${cursor}`} className="border-line my-4" />)
      cursor += 1
      continue
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line)
    if (heading) {
      blocks.push(
        <p
          key={`h-${cursor}`}
          className={
            heading[1].length <= 2
              ? 'font-display text-ink mt-5 text-[15px] font-semibold tracking-[-0.01em] first:mt-0'
              : 'text-ink mt-4 text-[13.5px] font-semibold first:mt-0'
          }>
          {renderInline(heading[2])}
        </p>,
      )
      cursor += 1
      continue
    }

    if (line.includes('|') && isTableSeparator(lines[cursor + 1])) {
      const headers = splitRow(line)
      const rows: string[][] = []
      cursor += 2

      while (cursor < lines.length && lines[cursor].trim() && lines[cursor].includes('|')) {
        rows.push(splitRow(lines[cursor]))
        cursor += 1
      }

      blocks.push(<MarkdownTable key={`t-${cursor}`} headers={headers} rows={rows} />)
      continue
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = []
      while (cursor < lines.length && /^\s*[-*+]\s+/.test(lines[cursor])) {
        items.push(lines[cursor].replace(/^\s*[-*+]\s+/, ''))
        cursor += 1
      }

      blocks.push(
        <ul key={`ul-${cursor}`} className="text-ink-muted list-disc space-y-1.5 pl-5 text-[13.5px] leading-relaxed">
          {items.map((item, index) => (
            <li key={index}>{renderInline(item)}</li>
          ))}
        </ul>,
      )
      continue
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (cursor < lines.length && /^\s*\d+\.\s+/.test(lines[cursor])) {
        items.push(lines[cursor].replace(/^\s*\d+\.\s+/, ''))
        cursor += 1
      }

      blocks.push(
        <ol key={`ol-${cursor}`} className="text-ink-muted list-decimal space-y-1.5 pl-5 text-[13.5px] leading-relaxed">
          {items.map((item, index) => (
            <li key={index}>{renderInline(item)}</li>
          ))}
        </ol>,
      )
      continue
    }

    // A paragraph runs until a blank line or the start of another block.
    const paragraph: string[] = []
    while (cursor < lines.length && lines[cursor].trim() && !startsBlock(lines[cursor], lines[cursor + 1])) {
      paragraph.push(lines[cursor].trim())
      cursor += 1
    }
    if (paragraph.length === 0) {
      // A lone block marker the parser does not model — take the line as its own paragraph.
      paragraph.push(lines[cursor].trim())
      cursor += 1
    }

    blocks.push(
      <p key={`p-${cursor}`} className="text-ink-muted text-[13.5px] leading-relaxed">
        {renderInline(paragraph.join(' '))}
      </p>,
    )
  }

  return <div className="space-y-3">{blocks}</div>
}

function isRule(line: string): boolean {
  return /^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)
}

function isTableSeparator(line: string | undefined): boolean {
  return Boolean(line) && /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/.test(line as string)
}

function startsBlock(line: string, next: string | undefined): boolean {
  return (
    isRule(line) ||
    /^(#{1,6})\s+/.test(line) ||
    /^\s*[-*+]\s+/.test(line) ||
    /^\s*\d+\.\s+/.test(line) ||
    (line.includes('|') && isTableSeparator(next))
  )
}

/** `| a | b |` → `['a', 'b']`, dropping the outer pipes. */
function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

/** The reply's own headings are content inside a card, so they stay paragraphs with heading styling. */
function MarkdownTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {headers.map((header, index) => (
            <TableHead key={index} className="px-3 py-2 text-[10.5px]">
              {renderInline(header)}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>

      <TableBody>
        {rows.map((row, rowIndex) => (
          <TableRow key={rowIndex} className="hover:bg-transparent">
            {headers.map((_, cellIndex) => (
              <TableCell key={cellIndex} className="px-3 py-2 align-top text-[12.5px] leading-relaxed">
                {renderInline(row[cellIndex] ?? '')}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

/** Bold, inline code and italics — the three the prompt templates use, and nothing else. */
function renderInline(text: string): ReactNode[] {
  // Built per call: a module-level `g` regex would carry `lastIndex` between renders.
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|_[^_]+_)/g
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index))

    const token = match[0]
    if (token.startsWith('**')) {
      nodes.push(
        <strong key={key++} className="text-ink font-semibold">
          {token.slice(2, -2)}
        </strong>,
      )
    } else if (token.startsWith('`')) {
      nodes.push(
        <code key={key++} className="bg-canvas text-ink rounded px-1 py-0.5 font-mono text-[12px]">
          {token.slice(1, -1)}
        </code>,
      )
    } else {
      nodes.push(<em key={key++}>{token.slice(1, -1)}</em>)
    }

    lastIndex = match.index + token.length
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))

  return nodes
}
