import { backendClient, unwrap, type ApiEnvelope } from './client'

export interface Coupon {
  _id: string
  code: string
  kind: 'percent' | 'fixed'
  value: number
  minSubtotal: number
  expiresAt?: string
  active: boolean
  usageLimit?: number
  usedCount: number
  createdAt: string
  updatedAt: string
}

export interface CouponValidation {
  code: string
  kind: 'percent' | 'fixed'
  value: number
  discount: number
}

export const couponsService = {
  async validate(code: string, subtotal: number): Promise<CouponValidation> {
    const response = await backendClient.post<ApiEnvelope<CouponValidation>>('/coupons/validate', { code, subtotal })
    return unwrap(response.data)
  },

  async list(signal?: AbortSignal): Promise<Coupon[]> {
    const response = await backendClient.get<ApiEnvelope<Coupon[]>>('/coupons', { signal })
    return unwrap(response.data)
  },

  async create(dto: Partial<Coupon> & { code: string; kind: 'percent' | 'fixed'; value: number }): Promise<Coupon> {
    const response = await backendClient.post<ApiEnvelope<Coupon>>('/coupons', dto)
    return unwrap(response.data)
  },

  async update(id: string, dto: Partial<Coupon>): Promise<Coupon> {
    const response = await backendClient.patch<ApiEnvelope<Coupon>>(`/coupons/${id}`, dto)
    return unwrap(response.data)
  },

  async remove(id: string): Promise<Coupon> {
    const response = await backendClient.delete<ApiEnvelope<Coupon>>(`/coupons/${id}`)
    return unwrap(response.data)
  },
}
