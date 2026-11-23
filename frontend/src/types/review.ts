export interface ProductReview {
  _id: string
  productId: number
  userId: number
  userName: string
  rating: number
  title?: string
  comment: string
  createdAt: string
  updatedAt: string
}

export interface ProductReviewsResponse {
  items: ProductReview[]
  average: number
  count: number
  myReview: ProductReview | null
}

export interface CreateReviewPayload {
  rating: number
  title?: string
  comment: string
}
