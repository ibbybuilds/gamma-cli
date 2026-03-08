import { getApiKey } from './config.js';

const BASE_URL = 'https://public-api.gamma.app/v1.0';

function headers(apiKey: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'X-API-KEY': apiKey,
  };
}

export class ApiError extends Error {
  status: number;
  body: Record<string, unknown>;
  requestId: string | null;

  constructor(status: number, body: Record<string, unknown>, requestId: string | null) {
    super((body.message as string) || (body.error as { message?: string })?.message || `API error ${status}`);
    this.status = status;
    this.body = body;
    this.requestId = requestId;
  }
}

export async function post(path: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const apiKey = getApiKey();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify(body),
  });
  const requestId = res.headers.get('x-request-id');
  if (!res.ok) {
    const text = await res.text();
    let parsed: Record<string, unknown>;
    try { parsed = JSON.parse(text); } catch { parsed = { message: text }; }
    throw new ApiError(res.status, parsed, requestId);
  }
  const data = await res.json();
  if (requestId) data._requestId = requestId;
  return data;
}

export async function get(path: string, params: Record<string, string | number | undefined> = {}): Promise<Record<string, unknown>> {
  const apiKey = getApiKey();
  const url = new URL(`${BASE_URL}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: headers(apiKey),
  });
  const requestId = res.headers.get('x-request-id');
  if (!res.ok) {
    const text = await res.text();
    let parsed: Record<string, unknown>;
    try { parsed = JSON.parse(text); } catch { parsed = { message: text }; }
    throw new ApiError(res.status, parsed, requestId);
  }
  const data = await res.json();
  if (requestId) data._requestId = requestId;
  return data;
}

interface PollOptions {
  interval?: number;
  timeout?: number;
  onPoll?: (info: { attempt: number; elapsed: number; status: string }) => void;
}

export async function pollGeneration(generationId: string, opts: PollOptions = {}): Promise<Record<string, unknown>> {
  const { interval = 5000, timeout = 300000, onPoll } = opts;
  const start = Date.now();
  let attempt = 0;
  while (Date.now() - start < timeout) {
    attempt++;
    const result = await get(`/generations/${generationId}`);
    if (onPoll) onPoll({ attempt, elapsed: Date.now() - start, status: result.status as string });
    if (result.status === 'completed' || result.status === 'failed') {
      return result;
    }
    await new Promise(r => setTimeout(r, interval));
  }
  throw new Error(`Generation ${generationId} timed out after ${timeout / 1000}s`);
}
