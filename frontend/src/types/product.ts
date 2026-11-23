export interface ProductCategory {
  id: number
  name: string
  slug: string
  image: string
  createdAt: string
  updatedAt: string
}

export interface Product {
  /** MongoDB document id used by order and inventory references. */
  _id: string
  id: number
  title: string
  slug: string
  price: number
  description: string
  images: string[]
  stock: number
  branch?: 'north' | 'center' | 'south' | string
  ratingAverage?: number
  ratingCount?: number
  createdAt: string
  updatedAt: string
  category: ProductCategory
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type ProductSort = 'newest' | 'price_asc' | 'price_desc' | 'name'

export interface ProductQueryParams {
  q?: string
  categoryId?: number
  categoryIds?: number[]
  minPrice?: number
  maxPrice?: number
  sort?: ProductSort
  inStock?: boolean
  branchId?: string | null
  page?: number
  limit?: number
}

export interface GetProductsParams {
  offset?: number
  limit?: number
}

export interface CreateProductInput {
  title: string
  price: number
  description: string
  categoryId: number
  images: string[]
  stock: number
  branch?: string
}

export interface CreateBranchProductInput extends Omit<CreateProductInput, 'branch' | 'stock'> {
  branchQuantity: number
}
