import type { RequestHandler } from 'express'
import type { ZodType } from 'zod'
import { AppError } from './errors.js'

type RequestSource = 'body' | 'params' | 'query'

export const validate = (source: RequestSource, schema: ZodType): RequestHandler => (
  request,
  response,
  next,
) => {
  const result = schema.safeParse(request[source])

  if (!result.success) {
    next(new AppError(400, 'Validation failed', result.error.flatten()))
    return
  }

  response.locals[source] = result.data
  if (source !== 'query') Object.assign(request[source], result.data)
  next()
}
