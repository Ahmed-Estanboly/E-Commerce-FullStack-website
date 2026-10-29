import { useCallback, useEffect, useState } from 'react'
import axios from 'axios'

interface UseFetchResult<T> {
  data: T | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Use this hook for any API request that returns a typed result.
 *
 * Products:
 * useFetch<Product[]>((signal) => productsService.getProducts(undefined, signal))
 *
 * Other resources:
 * useFetch<User>((signal) => usersService.getUser(userId, signal))
 *
 * The request should pass the signal to Axios so requests are cancelled when
 * the component unmounts or the request function changes.
 */
export function useFetch<T>(
  request: (signal: AbortSignal) => Promise<T>,
): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [requestId, setRequestId] = useState(0)

  const refetch = useCallback(() => {
    setRequestId((currentRequestId) => currentRequestId + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    async function loadData() {
      setIsLoading(true)
      setError(null)

      try {
        setData(await request(controller.signal))
      } catch (requestError) {
        if (axios.isCancel(requestError)) {
          return
        }

        setError(
          axios.isAxiosError(requestError)
            ? requestError.message
            : 'Unable to fetch data.',
        )
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadData()

    return () => controller.abort()
  }, [request, requestId])

  return { data, isLoading, error, refetch }
}