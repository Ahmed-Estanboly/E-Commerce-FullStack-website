import { backendClient } from './client'

/** Turns the API-relative `/uploads/...` path into a URL the browser can load. */
function resolveUploadUrl(path: string): string {
  const base = backendClient.defaults.baseURL ?? ''
  if (base.startsWith('http')) {
    return `${base.replace(/\/api\/v\d+\/?$/, '')}${path}`
  }
  return path
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
