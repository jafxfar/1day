import { z } from 'zod'

const booleanSchema = z.enum(['true', 'false']).transform(value => value === 'true')
const sameSiteSchema = z.enum(['lax', 'strict', 'none'])

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z.string().url().startsWith('postgres'),
  DATABASE_SSL: booleanSchema.default(false),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES: z.string().regex(/^\d+(ms|s|m|h|d|w|y)$/).default('30d'),
  CORS_ORIGINS: z.string().min(1),
  COOKIE_NAME: z.string().regex(/^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/).default('token'),
  COOKIE_SECURE: booleanSchema.default(false),
  COOKIE_SAME_SITE: sameSiteSchema.default('lax'),
  COOKIE_MAX_AGE_MS: z.coerce.number().int().positive().default(2_592_000_000),
})

export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'production'
  port: number
  databaseUrl: string
  databaseSsl: boolean
  jwtSecret: string
  jwtExpires: string
  corsOrigins: string[]
  cookie: {
    name: string
    secure: boolean
    sameSite: 'lax' | 'strict' | 'none'
    maxAgeMs: number
  }
}

export const parseConfig = (environment: NodeJS.ProcessEnv): AppConfig => {
  const parsed = envSchema.safeParse(environment)

  if (!parsed.success) {
    const details = parsed.error.issues
      .map(issue => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ')
    throw new Error(`Invalid environment configuration: ${details}`)
  }

  const corsOrigins = parsed.data.CORS_ORIGINS
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)

  if (corsOrigins.length === 0) {
    throw new Error('Invalid environment configuration: CORS_ORIGINS is empty')
  }

  const invalidOrigin = corsOrigins.find(origin => !z.url().safeParse(origin).success)
  if (invalidOrigin) {
    throw new Error(`Invalid environment configuration: invalid CORS origin ${invalidOrigin}`)
  }

  if (parsed.data.COOKIE_SAME_SITE === 'none' && !parsed.data.COOKIE_SECURE) {
    throw new Error('Invalid environment configuration: SameSite=None requires secure cookies')
  }

  return {
    nodeEnv: parsed.data.NODE_ENV,
    port: parsed.data.PORT,
    databaseUrl: parsed.data.DATABASE_URL.replace('@hostname', '@localhost'),
    databaseSsl: parsed.data.DATABASE_SSL,
    jwtSecret: parsed.data.JWT_SECRET,
    jwtExpires: parsed.data.JWT_EXPIRES,
    corsOrigins,
    cookie: {
      name: parsed.data.COOKIE_NAME,
      secure: parsed.data.COOKIE_SECURE,
      sameSite: parsed.data.COOKIE_SAME_SITE,
      maxAgeMs: parsed.data.COOKIE_MAX_AGE_MS,
    },
  }
}
