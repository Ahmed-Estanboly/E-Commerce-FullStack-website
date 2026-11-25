import { backendClient } from './client'

/** Turns the API-relative `/uploads/...` path into a URL the browser can load. */
function resolveUploadUrl(path: string): string {
  const base = (backendClient.defaults.baseURL ?? '').replace(/\/+$/, '')
  // baseURL already ends with /api/v1, where uploads are now served
  return base ? `${base}${path}` : `/api/v1${path}`
}

export const uploadService = {
  async uploadImage(file: File): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await backendClient.post<{ success: boolean; data: { url: string } }>('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return resolveUploadUrl(response.data.data.url)
  },
}
