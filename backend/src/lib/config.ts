const DEFAULT_CORS_ORIGINS = [
  'http://localhost',
  'http://localhost:5173',
  'http://localhost:3000',
]

const parseOrigins = (value: string | undefined): string[] => {
  if (!value?.trim()) return DEFAULT_CORS_ORIGINS

  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  if (origins.length === 0) return DEFAULT_CORS_ORIGINS

  return origins
}

export const PORT = Number(process.env.PORT ?? 3000)

export const CORS_ORIGINS = parseOrigins(process.env.CORS_ORIGINS)
