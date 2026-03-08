export interface OutputOpts {
  format?: 'json' | 'table' | 'yaml';
  pretty?: boolean;
}

export function output(data: unknown, opts: OutputOpts = {}): void {
  const format = opts.format || (opts.pretty ? 'table' : 'json');

  switch (format) {
    case 'table':
      prettyPrint(data);
      break;
    case 'yaml':
      printYaml(data);
      break;
    case 'json':
    default:
      console.log(JSON.stringify(data));
      break;
  }
}

function prettyPrint(data: unknown): void {
  // Detect paginated wrapper: {data: [...], hasMore, nextCursor}
  if (isPaginatedResponse(data)) {
    const resp = data as { data: Record<string, unknown>[]; hasMore?: boolean; nextCursor?: string };
    printTable(resp.data);
    if (resp.hasMore) {
      console.log(`\n(more results available, use --after ${resp.nextCursor})`);
    }
    return;
  }

  if (Array.isArray(data)) {
    printTable(data);
  } else if (typeof data === 'object' && data !== null) {
    const entries = Object.entries(data);
    const maxKey = Math.max(...entries.map(([k]) => k.length));
    for (const [k, v] of entries) {
      const val = typeof v === 'object' ? JSON.stringify(v) : String(v);
      console.log(`${k.padEnd(maxKey)}  ${val}`);
    }
  } else {
    console.log(data);
  }
}

function isPaginatedResponse(data: unknown): boolean {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return false;
  const obj = data as Record<string, unknown>;
  return Array.isArray(obj.data) && 'hasMore' in obj;
}

function printTable(rows: Record<string, unknown>[]): void {
  if (rows.length === 0) {
    console.log('(no results)');
    return;
  }
  // For table display, flatten arrays/objects to short strings and pick displayable keys
  const keys = Object.keys(rows[0]).filter(k => !k.startsWith('_'));
  const stringRows = rows.map(row =>
    Object.fromEntries(keys.map(k => [k, summarize(row[k])]))
  );
  const widths = keys.map(k =>
    Math.min(60, Math.max(k.length, ...stringRows.map(r => r[k].length)))
  );
  const header = keys.map((k, i) => k.padEnd(widths[i])).join('  ');
  const sep = widths.map(w => '-'.repeat(w)).join('  ');
  console.log(header);
  console.log(sep);
  for (const row of stringRows) {
    console.log(keys.map((k, i) => truncate(row[k], widths[i]).padEnd(widths[i])).join('  '));
  }
}

function summarize(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (Array.isArray(v)) return v.slice(0, 3).join(', ') + (v.length > 3 ? '...' : '');
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 3) + '...' : s;
}

function printYaml(data: unknown, indent = 0): void {
  const pad = ' '.repeat(indent);
  if (Array.isArray(data)) {
    for (const item of data) {
      if (typeof item === 'object' && item !== null) {
        const entries = Object.entries(item);
        entries.forEach(([k, v], i) => {
          const prefix = i === 0 ? `${pad}- ` : `${pad}  `;
          if (typeof v === 'object' && v !== null) {
            console.log(`${prefix}${k}:`);
            printYaml(v, indent + 4);
          } else {
            console.log(`${prefix}${k}: ${yamlVal(v)}`);
          }
        });
      } else {
        console.log(`${pad}- ${yamlVal(item)}`);
      }
    }
  } else if (typeof data === 'object' && data !== null) {
    for (const [k, v] of Object.entries(data)) {
      if (typeof v === 'object' && v !== null) {
        console.log(`${pad}${k}:`);
        printYaml(v, indent + 2);
      } else {
        console.log(`${pad}${k}: ${yamlVal(v)}`);
      }
    }
  } else {
    console.log(`${pad}${yamlVal(data)}`);
  }
}

function yamlVal(v: unknown): string {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'string') return v.includes(':') || v.includes('#') ? `"${v}"` : v;
  return String(v);
}

interface ErrorLike {
  message: string;
  status?: number;
  requestId?: string | null;
  body?: Record<string, unknown>;
}

export function errorOutput(err: ErrorLike): never {
  const out: Record<string, unknown> = {
    error: err.message,
    ...(err.status && { status: err.status }),
    ...(err.requestId && { requestId: err.requestId }),
    ...(err.body && { details: err.body }),
  };
  console.error(JSON.stringify(out));
  process.exit(1);
}
