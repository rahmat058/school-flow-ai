import { API_PREFIX } from '../constants.js';

export interface PaginationLinks {
  self: string;
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPage: number;
  links: PaginationLinks;
}

export interface ResourceLinks {
  self: string;
  get: string;
  update: string;
  delete: string;
}

/** What a list service returns; the response interceptor turns it into `data` + `meta`. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;

export function isPaginated(value: unknown): value is Paginated<unknown> {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    Array.isArray(candidate.items) &&
    typeof candidate.total === 'number' &&
    typeof candidate.page === 'number' &&
    typeof candidate.limit === 'number'
  );
}

/** The request path with the `/api/v1` mount removed, so links are API-relative. */
export function relativePath(path: string): string {
  const prefix = `/${API_PREFIX}`;
  return path.startsWith(prefix) ? path.slice(prefix.length) || '/' : path;
}

export function buildPaginationMeta(input: {
  path: string;
  query: Record<string, unknown>;
  page: number;
  limit: number;
  total: number;
}): PaginationMeta {
  const { path, query, page, limit, total } = input;
  const totalPage = Math.max(1, Math.ceil(total / limit));
  const link = (target: number) => pageLink(path, query, target, limit);

  return {
    page,
    limit,
    totalItems: total,
    totalPage,
    links: {
      self: link(page),
      first: link(1),
      last: link(totalPage),
      prev: page > 1 ? link(page - 1) : null,
      next: page < totalPage ? link(page + 1) : null,
    },
  };
}

export function buildResourceLinks(base: string, id: string): ResourceLinks {
  const root = base.startsWith('/') ? base : `/${base}`;
  const item = `${root}/${id}`;
  return { self: root, get: item, update: item, delete: item };
}

function pageLink(
  path: string,
  query: Record<string, unknown>,
  page: number,
  limit: number,
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (key === 'page' || key === 'limit') continue;
    for (const entry of Array.isArray(value) ? value : [value]) {
      if (entry === undefined || entry === null) continue;
      params.append(key, String(entry));
    }
  }

  params.set('page', String(page));
  params.set('limit', String(limit));
  return `${path}?${params.toString()}`;
}
