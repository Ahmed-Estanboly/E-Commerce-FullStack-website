import { Transform, Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto.js';

export const PRODUCT_SORTS = ['newest', 'price_asc', 'price_desc', 'name'] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

const SORT_MAP: Record<ProductSort, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  price_asc: { price: 1 },
  price_desc: { price: -1 },
  name: { title: 1 },
};

export function productSortOrder(sort?: ProductSort) {
  return SORT_MAP[sort ?? 'newest'];
}

function parseIdList(value: unknown): number[] | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const raw = Array.isArray(value) ? value : String(value as string | number).split(',');
  const ids = raw
    .map((entry) => Number(String(entry).trim()))
    .filter((entry) => Number.isInteger(entry) && entry > 0);
  return ids.length ? ids : undefined;
}

export class ProductQueryDto extends PaginationQueryDto {
  /** Free-text search across title and description. */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(/^[^<>]{1,120}$/)
  q?: string;

  /** Single category id (kept for backwards compatibility). */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number;

  /** Comma-separated category ids, e.g. `categoryIds=1,4`. */
  @IsOptional()
  @Transform(({ value }) => parseIdList(value))
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(1, { each: true })
  categoryIds?: number[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsIn(PRODUCT_SORTS)
  sort?: ProductSort;

  /** When true, only products with stock > 0 are returned. */
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  inStock?: boolean;

  /**
   * Branch (Mongo id). Restricts results to products assigned to that
   * branch's inventory — the same set the storefront shows per branch.
   */
  @IsOptional()
  @IsMongoId()
  branchId?: string;
}
