import type { ApiEnvelope } from './client'
import { backendClient, unwrap } from './client'
import type { CreateReviewPayload, ProductReviewsResponse, ProductReview } from '../../types/review'

export const reviewsService = {
  async getReviews(productId: number | string, signal?: AbortSignal): Promise<ProductReviewsResponse> {
    const response = await backendClient.get<ApiEnvelope<ProductReviewsResponse>>(
      `/products/${productId}/reviews`,
      { signal },
    )
    return unwrap(response.data)
  },

  /** Creates the review, or updates the caller's existing review for the product. */
  async saveReview(productId: number | string, payload: CreateReviewPayload): Promise<ProductReview> {
    const response = await backendClient.post<ApiEnvelope<ProductReview>>(
      `/products/${productId}/reviews`,
      payload,
    )
    return unwrap(response.data)
  },
}
