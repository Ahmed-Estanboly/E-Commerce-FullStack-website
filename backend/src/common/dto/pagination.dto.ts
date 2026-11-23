import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export const PAGINATION_DEFAULT_LIMIT = 20;
export const PAGINATION_MAX_LIMIT = 100;

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(PAGINATION_MAX_LIMIT)
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  skip: number;
  limit: number;
  page: number;
}

/**
 * Returns skip/limit params when the client asked for pagination (`page`
 * present; `limit` alone is ignored for backwards compatibility), otherwise
 * null so callers can keep returning the legacy plain-array response.
 */
export function resolvePagination(query: PaginationQueryDto): PaginationParams | null {
  if (query.page === undefined) {
    return null;
  }
  const limit = query.limit ?? PAGINATION_DEFAULT_LIMIT;
  const page = query.page;
  return { skip: (page - 1) * limit, limit, page };
}

export function toPaginatedResult<T>(
  items: T[],
  total: number,
  params: PaginationParams,
): PaginatedResult<T> {
  return {
    items,
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.max(1, Math.ceil(total / params.limit)),
  };
}
