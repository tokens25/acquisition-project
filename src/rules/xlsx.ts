/**
 * A minimal .xlsx reader, with no dependencies.
 *
 * An xlsx is a zip of XML. Browsers can inflate a raw deflate stream natively
 * (`DecompressionStream`), and the sheets this reads are ones we author, so a
 * focused reader beats a general spreadsheet library here: no 400KB dependency
 * for a file with a header row and some strings in it.
 *
 * It handles what the content template contains — inline strings, shared
 * strings, numbers, booleans — and nothing else. Formulas resolve to their
 * cached value; anything it cannot read comes back as an empty cell rather than
 * throwing, because a half-filled template is the normal case.
 */

export type SheetRows = Record<string, string[][]>

interface ZipEntry {
  name: string
  compression: number
  offset: number
  size: number
}

const dv = (b: Uint8Array) => new DataView(b.buffer, b.byteOffset, b.byteLength)

/** Entries from the zip's central directory, which is at the end of the file. */
function readDirectory(bytes: Uint8Array): ZipEntry[] {
  const view = dv(bytes)
  let end = -1
  // The end-of-directory record is last, after a comment of unknown length.
  for (let i = bytes.length - 22; i >= 0; i -= 1) {
    if (view.getUint32(i, true) === 0x06054b50) {
      end = i
      break
    }
  }
  if (end < 0) throw new Error('Not a zip file — no end-of-directory record.')

  const count = view.getUint16(end + 10, true)
  let at = view.getUint32(end + 16, true)
  const entries: ZipEntry[] = []
  for (let i = 0; i < count; i += 1) {
    if (view.getUint32(at, true) !== 0x02014b50) break
    const compression = view.getUint16(at + 10, true)
    const size = view.getUint32(at + 20, true)
    const nameLength = view.getUint16(at + 28, true)
    const extraLength = view.getUint16(at + 30, true)
    const commentLength = view.getUint16(at + 32, true)
    const offset = view.getUint32(at + 42, true)
    const name = new TextDecoder().decode(bytes.subarray(at + 46, at + 46 + nameLength))
    entries.push({ name, compression, offset, size })
    at += 46 + nameLength + extraLength + commentLength
  }
  return entries
}

async function readEntry(bytes: Uint8Array, entry: ZipEntry): Promise<string> {
  const view = dv(bytes)
  // The local header repeats the name and extra lengths, which can differ from
  // the central directory's — the data starts after whatever this one says.
  const nameLength = view.getUint16(entry.offset + 26, true)
  const extraLength = view.getUint16(entry.offset + 28, true)
  const start = entry.offset + 30 + nameLength + extraLength
  const data = bytes.subarray(start, start + entry.size)

  if (entry.compression === 0) return new TextDecoder().decode(data)
  if (entry.compression !== 8) throw new Error(`Unsupported compression: ${entry.compression}`)

  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw'))
  return new Response(stream).text()
}

const unescapeXml = (s: string) =>
  s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, '&')

/** Text of every `<t>` inside a fragment, joined — rich text is split across several. */
function textOf(fragment: string): string {
  const out: string[] = []
  const re = /<t\b[^>]*>([\s\S]*?)<\/t>/g
  let match: RegExpExecArray | null
  while ((match = re.exec(fragment))) out.push(unescapeXml(match[1]))
  return out.join('')
}

/** Column letters to a zero-based index: A→0, Z→25, AA→26. */
function columnIndex(ref: string): number {
  const letters = /^([A-Z]+)/.exec(ref)?.[1] ?? 'A'
  let n = 0
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n - 1
}

function parseSheet(xml: string, shared: string[]): string[][] {
  const rows: string[][] = []
  const rowRe = /<row\b([^>]*)>([\s\S]*?)<\/row>/g
  let rowMatch: RegExpExecArray | null
  while ((rowMatch = rowRe.exec(xml))) {
    const cells: string[] = []
    const cellRe = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g
    let cellMatch: RegExpExecArray | null
    while ((cellMatch = cellRe.exec(rowMatch[2]))) {
      const attrs = cellMatch[1]
      const body = cellMatch[2] ?? ''
      const ref = /r="([A-Z]+)\d+"/.exec(attrs)?.[1] ?? ''
      const type = /t="([^"]*)"/.exec(attrs)?.[1] ?? 'n'

      let value = ''
      if (type === 'inlineStr') value = textOf(body)
      else if (type === 's') {
        const index = Number(/<v>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? '')
        value = shared[index] ?? ''
      } else if (type === 'str') value = unescapeXml(/<v>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? '')
      else if (type === 'b') value = /<v>1<\/v>/.test(body) ? 'TRUE' : 'FALSE'
      else value = unescapeXml(/<v>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? '')

      // Placed by column reference, so a blank cell in the middle of a row does
      // not shift every value after it into the wrong field.
      const at = ref ? columnIndex(ref) : cells.length
      while (cells.length < at) cells.push('')
      cells[at] = value.trim()
    }
    rows.push(cells)
  }
  return rows
}

/** Every sheet in the workbook, keyed by the tab name a person sees. */
export async function readWorkbook(file: Blob): Promise<SheetRows> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const entries = readDirectory(bytes)
  const find = (name: string) => entries.find((e) => e.name === name)

  const sharedEntry = find('xl/sharedStrings.xml')
  const shared: string[] = []
  if (sharedEntry) {
    const xml = await readEntry(bytes, sharedEntry)
    const re = /<si\b[^>]*>([\s\S]*?)<\/si>/g
    let match: RegExpExecArray | null
    while ((match = re.exec(xml))) shared.push(textOf(match[1]))
  }

  // Tab name to file: workbook.xml names them in order and carries the rel id;
  // the rels file maps that id to the sheet's path.
  const workbook = await readEntry(bytes, find('xl/workbook.xml')!)
  const relsXml = await readEntry(bytes, find('xl/_rels/workbook.xml.rels')!)
  const targets = new Map<string, string>()
  const relRe = /<Relationship\b([^>]*)\/>/g
  let rel: RegExpExecArray | null
  while ((rel = relRe.exec(relsXml))) {
    const id = /Id="([^"]*)"/.exec(rel[1])?.[1]
    const target = /Target="([^"]*)"/.exec(rel[1])?.[1]
    if (id && target) targets.set(id, target.replace(/^\/?xl\//, '').replace(/^\//, ''))
  }

  const out: SheetRows = {}
  const sheetRe = /<sheet\b([^>]*)\/>/g
  let sheet: RegExpExecArray | null
  while ((sheet = sheetRe.exec(workbook))) {
    const name = unescapeXml(/name="([^"]*)"/.exec(sheet[1])?.[1] ?? '')
    const id = /r:id="([^"]*)"/.exec(sheet[1])?.[1]
    const target = id ? targets.get(id) : undefined
    const entry = target ? find(`xl/${target}`) : undefined
    if (!name || !entry) continue
    out[name] = parseSheet(await readEntry(bytes, entry), shared)
  }
  return out
}
