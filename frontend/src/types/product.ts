export interface ProductCategory {
  id: number
  name: string
  image: string
  creationAt: string
  updatedAt: string
}

export interface Product {
  id: number
  title: string
  price: number
  description: string
  images: string[]
  creationAt: string
  updatedAt: string
  category: ProductCategory
}

export interface GetProductsParams {
  offset?: number
  limit?: number
}