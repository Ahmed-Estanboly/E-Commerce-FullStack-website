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
  createdAt: string
  updatedAt: string
  category: ProductCategory
}

export interface GetProductsParams {
  offset?: number
  limit?: number
}
