import { ORIGIN, directUrl, proxyUrl } from './upstream';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 500) { super(message); this.status = status; }
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal, headers: { accept: 'application/json' } });
  const text = await res.text();
  let body: any;
  try { body = JSON.parse(text); } catch { throw new ApiError('The server returned an unreadable response.', res.status); }
  if (!res.ok || body?.success === false) {
    throw new ApiError(body?.error?.message || body?.message || `Request failed (${res.status})`, res.status);
  }
  return body as T;
}

async function postJson<T>(url: string, body: unknown, signal?: AbortSignal, simple = false): Promise<T> {
  const res = await fetch(url, {
    method: 'POST', signal,
    // text/plain keeps this a "simple" CORS request (no OPTIONS preflight); the
    // upstream reads the raw JSON body either way.
    headers: { accept: 'application/json', 'content-type': simple ? 'text/plain;charset=UTF-8' : 'application/json' },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  let parsed: any;
  try { parsed = JSON.parse(text); } catch { throw new ApiError('The server returned an unreadable response.', res.status); }
  if (!res.ok || parsed?.success === false) throw new ApiError(parsed?.error?.message || `Request failed (${res.status})`, res.status);
  return parsed as T;
}

/**
 * Reads go straight from the visitor's browser to the upstream API (it allows CORS).
 * If that is blocked by the network, we retry once through our own serverless proxy.
 */
export async function pw<T>(path: string, signal?: AbortSignal): Promise<T> {
  try {
    return await getJson<T>(directUrl(path), signal);
  } catch (err) {
    if (signal?.aborted) throw err;
    return getJson<T>(proxyUrl(path), signal);
  }
}

export interface CatalogBatch {
  batch_id: string; name: string; byName?: string; exam?: string | string[];
  language?: string; class?: string; photo?: string; start_date?: string;
  end_date?: string; amount?: number | string;
}
export interface Catalog { generated_at: string | null; batches: CatalogBatch[] }

export const api = {
  catalog: async (signal?: AbortSignal) => {
    try {
      return await getJson<Catalog>('/api/catalog', signal);
    } catch (err) {
      if (signal?.aborted) throw err;
      // Same catalog the reference dashboard loads; GitHub Pages allows CORS.
      const raw = await getJson<any>(`https://semfy-gros.github.io/batches/batcha.json?v=${Date.now()}`, signal);
      const batches = Array.isArray(raw) ? raw : raw.batches ?? raw.data ?? [];
      return { generated_at: raw.generated_at ?? null, batches: batches.filter((b: any) => b?.batch_id) } as Catalog;
    }
  },
  batch: (id: string, signal?: AbortSignal) => pw<{ data: BatchDetails }>(`/v3/batches/${id}/details`, signal),
  topics: (batchId: string, slug: string, page = 1, signal?: AbortSignal) =>
    pw<{ data: Topic[]; paginate?: Paginate }>(`/v2/batches/${batchId}/subject/${slug}/topics?page=${page}`, signal),
  contents: (batchId: string, slug: string, tag: string, type: 'videos' | 'notes', page = 1, signal?: AbortSignal) =>
    pw<{ data: Content[]; paginate?: Paginate }>(
      `/v2/batches/${batchId}/subject/${slug}/contents?tag=${encodeURIComponent(tag)}&contentType=${type}&page=${page}`, signal),
  todaySchedule: (batchId: string, signal?: AbortSignal) =>
    pw<{ data: any }>(`/v2/batches/${batchId}/todays-schedule?batchId=${batchId}`, signal),
  weeklySchedule: (batchId: string, signal?: AbortSignal) =>
    pw<{ data: any }>(`/v2/batches/${batchId}/weekly-schedules?batchId=${batchId}`, signal),
  announcements: (batchId: string, page = 1, signal?: AbortSignal) =>
    pw<{ data: Announcement[] }>(`/v1/batches/${batchId}/announcement/v2?page=${page}`, signal),
  tests: (batchId: string, page = 1, signal?: AbortSignal) =>
    pw<{ data: Test[]; paginate?: Paginate }>(`/v3/test-service/tests?batchId=${batchId}&page=${page}`, signal),
  dpp: (batchId: string, page = 1, signal?: AbortSignal) =>
    pw<{ data: Test[]; paginate?: Paginate }>(
      `/v3/test-service/tests/new-dpp-list?page=${page}&batchId=${batchId}&dppType=ALL&limit=20`, signal),
  khazanaFilters: (programId: string, signal?: AbortSignal) =>
    pw<{ data: any }>(`/v2/programs/${programId}/filters?page=1&limit=20`, signal),
  khazanaChapters: (programId: string, subjectId: string, page = 1, signal?: AbortSignal) =>
    pw<{ data: Topic[] }>(`/v2/programs/${programId}/subjects/${subjectId}/chapters/list?page=${page}`, signal),
  pdfBank: (signal?: AbortSignal) =>
    pw<{ data: PdfExam[] }>(`/student-engagement-core/private/v1/study-material/exams-with-categories?page=1&limit=100`, signal),
  pdfNodes: async (deeplink: string, signal?: AbortSignal) => {
    const path = '/student-engagement-core/private/v1/study-material/get-child-nodes';
    try {
      return await postJson<{ data: PdfNode[] }>(directUrl(path), { deeplink }, signal, true);
    } catch (err) {
      if (signal?.aborted) throw err;
      return postJson<{ data: PdfNode[] }>(proxyUrl(path), { deeplink }, signal);
    }
  }
};

export interface Paginate { limit?: number; totalCount?: number; totalPages?: number; videosCount?: number }
export interface ImageId { baseUrl?: string; key?: string }
export interface Teacher { _id: string; firstName?: string; lastName?: string; imageId?: ImageId; qualification?: string }
export interface Subject {
  _id: string; subject: string; slug: string; subjectId: string; imageId?: ImageId;
  tagCount?: number; lectureCount?: number; teacherIds?: Teacher[];
}
export interface BatchDetails {
  _id: string; name: string; byName?: string; slug?: string; language?: string;
  exam?: string[]; class?: string; startDate?: string; endDate?: string;
  description?: string; shortDescription?: string; previewImage?: ImageId;
  fee?: { amount?: number; total?: number; discount?: number };
  subjects?: Subject[]; khazanaProgramId?: string; mode?: string;
}
export interface Topic {
  _id: string; name: string; slug: string; notes?: number; videos?: number;
  lectureVideos?: number; exercises?: number; displayOrder?: number;
}
export interface Content {
  _id: string; topic: string; date?: string; startTime?: string; url?: string; urlType?: string;
  isVideoLecture?: boolean; hasAttachment?: boolean; isLocked?: boolean; isFree?: boolean; isDPPNotes?: boolean;
  teachers?: Teacher[]; tags?: { _id: string; name: string }[];
  videoDetails?: { name?: string; image?: string; duration?: string; videoUrl?: string; hls_url?: string; findKey?: string };
  homeworkIds?: { _id?: string; topic?: string; note?: string; attachmentIds?: { _id: string; name?: string; baseUrl?: string; key?: string }[] }[];
}
export interface Announcement {
  _id: string; title?: string; announcement?: string; content?: string; createdAt?: string;
  created_at?: string; date?: string; createdBy?: { firstName?: string; lastName?: string };
}
export interface Test {
  _id: string; name: string; slug?: string; totalQuestions?: number; totalMarks?: number;
  maxDuration?: number; startTime?: string; endTime?: string; testActivityStatus?: string;
  isFree?: boolean; tag1?: string | null; tag2?: string | null;
}

export interface PdfNode {
  name: string; nodeId?: string; level?: number; displayOrder?: number; type?: string;
  icon?: string; deeplink?: string; url?: string; file?: string;
  meta?: Record<string, any> | null;
}
export interface PdfExam { exam: string; file?: string; file_id?: string; categories?: PdfNode[] }

export const nodeUrl = (n: PdfNode): string => {
  const meta = n.meta || {};
  const candidates = [n.url, n.file, meta.url, meta.file, meta.fileUrl, meta.pdfUrl, meta.pdf, n.deeplink];
  return candidates.find((c): c is string => typeof c === 'string' && /^https?:\/\//.test(c)) || '';
};

export const imgUrl = (img?: ImageId, fallback = '') =>
  img?.baseUrl && img?.key ? `${img.baseUrl.replace(/\/$/, '')}/${img.key}` : fallback;

export const teacherName = (t?: Teacher) => (t ? `${t.firstName ?? ''} ${t.lastName ?? ''}`.trim() : '');

/** Deep link into the reference site's own player (it resolves the protected stream). */
export function playerLink(batchId: string, subjectId: string, content: Content) {
  const params = new URLSearchParams({
    batch_id: batchId,
    video_type: 'pw',
    subject_id_original: subjectId,
    video_key: content.videoDetails?.findKey || content._id,
    urlType: content.urlType || 'penpencilvdo',
    name: content.topic || content.videoDetails?.name || 'Lecture'
  });
  return `${ORIGIN}/play.php?${params.toString()}`;
}

/** Upstream returns an empty `key` for files the visitor is not entitled to. */
export const attachmentUrl = (a: { baseUrl?: string; key?: string }) =>
  a.baseUrl && a.key ? `${a.baseUrl.replace(/\/$/, '')}/${a.key.replace(/^\//, '')}` : '';

/** Where a visitor can open a protected attachment with their own AryaVidya access. */
export const referenceBatchLink = (batchId: string) => `${ORIGIN}/#/batch/${batchId}`;
