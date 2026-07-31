import { useCallback, useState } from 'react'

type ApiAction<Params, Result> = (params: Params) => Promise<Result>

export interface ApiActionOptions {
  skipCache?: boolean
}

const isApiActionOptions = (value: unknown): value is ApiActionOptions => {
  if (value === null || typeof value !== 'object') return false

  const keys = Object.keys(value)
  return keys.length > 0 && keys.every((key) => key === 'skipCache')
}

export const useApiAction = <Params = void, Result = unknown>(
  action: ApiAction<Params, Result>,
) => {
  const [data, setData] = useState<Result | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trigger = useCallback(
    async (
      params?: Params | ApiActionOptions,
      options?: ApiActionOptions,
    ): Promise<Result | null> => {
      setLoading(true)
      setError(null)

      try {
        const actionParams = isApiActionOptions(params) ? undefined : params
        const requestOptions = isApiActionOptions(params) ? params : options
        void requestOptions

        const result = await action(actionParams as Params)
        setData(result)
        return result
      } catch (caughtError) {
        const message = caughtError instanceof Error
          ? caughtError.message
          : String(caughtError)

        setError(message)
        return null
      } finally {
        setLoading(false)
      }
    },
    [action],
  )

  return { data, loading, error, trigger }
}
