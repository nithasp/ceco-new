import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const MIN_SECRET_LENGTH = 32;
const DAY_MS = 24 * 60 * 60 * 1000;

const secret = z.string().min(MIN_SECRET_LENGTH, `must be at least ${MIN_SECRET_LENGTH} characters`);

const trimmedUrl = z
  .string()
  .transform((value) => value.trim().replace(/\/+$/, ''))
  .refine((value) => /^https?:\/\//.test(value), { error: 'must start with http:// or https://' });

const envSchema = z
  .object({
    ENV: z.enum(['dev', 'test', 'production']).default('dev'),
    NODE_ENV: z.string().optional(),
    PORT: z.coerce.number().int().positive().default(3000),
    ALLOWED_ORIGIN: z.string().default('http://localhost:4200'),
    PUBLIC_BASE_URL: trimmedUrl.optional(),
    JSON_BODY_LIMIT: z.string().default('1mb'),
    TRUST_PROXY: z.coerce.number().int().min(0).default(1),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).optional(),

    API_RATE_LIMIT: z.coerce.number().int().positive().default(500),
    AUTH_RATE_LIMIT: z.coerce.number().int().positive().default(20),

    TOKEN_SECRET: secret,
    ACCESS_TOKEN_EXPIRY: z.string().default('15m'),
    REFRESH_TOKEN_EXPIRY_DAYS: z.coerce.number().int().positive().max(365).default(7),
    REFRESH_COOKIE_SAMESITE: z.enum(['strict', 'lax', 'none']).optional(),

    PASSWORD_PEPPER: secret,
    SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(10),

    AUDIT_LOG_RETENTION_DAYS: z.coerce.number().int().positive().default(90),

    DATABASE_URL: z.string().optional(),
    MYSQL_HOST: z.string().default('127.0.0.1'),
    MYSQL_PORT: z.coerce.number().int().positive().default(3306),
    MYSQL_DB: z.string().default('ceco_dev'),
    MYSQL_TEST_DB: z.string().default('ceco_test'),
    MYSQL_USER: z.string().optional(),
    MYSQL_PASSWORD: z.string().optional(),
    MYSQL_POOL_LIMIT: z.coerce.number().int().positive().max(100).default(10),
    DATABASE_SSL: z.enum(['off', 'no-verify', 'verify']).optional(),
    DATABASE_SSL_CA: z.string().optional(),

    STORAGE_DRIVER: z.enum(['auto', 'r2', 'local']).default('auto'),
    R2_ACCOUNT_ID: z.string().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_BUCKET: z.string().optional(),
    R2_PUBLIC_URL: trimmedUrl.optional(),
    R2_ENDPOINT: trimmedUrl.optional(),
    R2_PREFIX: z.string().default('ceco'),
    UPLOAD_DIR: z.string().default('uploads'),
    MAX_UPLOAD_MB: z.coerce.number().int().positive().max(100).default(15),

    ADMIN_USERNAME: z.string().optional(),
    ADMIN_PASSWORD: z.string().optional(),
    ADMIN_FIRST_NAME: z.string().optional(),
    ADMIN_LAST_NAME: z.string().optional(),
  })
  .refine((env) => env.DATABASE_URL || (env.MYSQL_USER && env.MYSQL_PASSWORD), {
    error: 'set DATABASE_URL, or MYSQL_USER and MYSQL_PASSWORD',
    path: ['DATABASE_URL'],
  })
  // A browser drops a SameSite=None cookie that is not also Secure, which would leave production
  // with no refresh cookie at all (OWASP API2)
  .refine((env) => env.REFRESH_COOKIE_SAMESITE !== 'none' || env.ENV === 'production', {
    error: "'none' needs the Secure flag, which is only set when ENV=production",
    path: ['REFRESH_COOKIE_SAMESITE'],
  })
  // Asking for R2 explicitly and leaving a credential out would upload nothing and serve broken
  // image URLs, so the process stops here instead (OWASP API8)
  .refine(
    (env) =>
      env.STORAGE_DRIVER !== 'r2' ||
      Boolean(env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET),
    {
      error: 'STORAGE_DRIVER=r2 needs R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET',
      path: ['STORAGE_DRIVER'],
    },
  );

// An unset or unusable value stops the process here rather than falling back to a default that
// would weaken authentication or the database connection (OWASP API8)
function readEnv(): z.infer<typeof envSchema> {
  const present = Object.fromEntries(
    Object.entries(process.env).filter(([, value]) => value !== undefined && value !== ''),
  );

  const parsed = envSchema.safeParse(present);
  if (!parsed.success) {
    const problems = parsed.error.issues.map(
      (issue) => `  ${issue.path.join('.') || 'env'}: ${issue.message}`,
    );
    throw new Error(`[config] The environment is not usable:\n${problems.join('\n')}`);
  }
  return parsed.data;
}

const env = readEnv();

const sslMode = env.DATABASE_SSL ?? (env.DATABASE_URL ? 'verify' : 'off');

// The frontend and the API are served from different sites in production, so a Strict cookie is
// never attached to the refresh call and the session cannot be renewed; None keeps it cross-site
// while Secure and the /auth path stop it travelling anywhere else (OWASP API2)
const refreshCookieSameSite = env.REFRESH_COOKIE_SAMESITE ?? (env.ENV === 'production' ? 'none' : 'strict');

const r2Configured = Boolean(
  env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET,
);

// 'auto' keeps a machine without R2 credentials working on the local disk, so the site can be
// developed and seeded before the bucket exists
const storageDriver: 'r2' | 'local' =
  env.STORAGE_DRIVER === 'local' ? 'local' : env.STORAGE_DRIVER === 'r2' || r2Configured ? 'r2' : 'local';

export const config = {
  env: env.ENV,
  isProduction: env.ENV === 'production',
  isTest: env.ENV === 'test',
  port: env.PORT,
  allowedOrigins: env.ALLOWED_ORIGIN.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  publicBaseUrl: env.PUBLIC_BASE_URL ?? `http://localhost:${env.PORT}`,
  jsonBodyLimit: env.JSON_BODY_LIMIT,
  trustProxy: env.TRUST_PROXY,
  logLevel: env.LOG_LEVEL ?? (env.ENV === 'test' ? 'silent' : 'info'),
  prettyLogs: env.ENV === 'dev' && env.NODE_ENV !== 'production',

  apiRateLimit: env.API_RATE_LIMIT,
  authRateLimit: env.AUTH_RATE_LIMIT,

  tokenSecret: env.TOKEN_SECRET,
  accessTokenExpiry: env.ACCESS_TOKEN_EXPIRY,
  refreshTokenExpiryMs: env.REFRESH_TOKEN_EXPIRY_DAYS * DAY_MS,

  passwordPepper: env.PASSWORD_PEPPER,
  saltRounds: env.SALT_ROUNDS,

  auditLogRetentionDays: env.AUDIT_LOG_RETENTION_DAYS,

  database: {
    url: env.DATABASE_URL,
    host: env.MYSQL_HOST,
    port: env.MYSQL_PORT,
    name: env.ENV === 'test' ? env.MYSQL_TEST_DB : env.MYSQL_DB,
    user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
    poolLimit: env.MYSQL_POOL_LIMIT,
    sslMode,
    sslCa: env.DATABASE_SSL_CA,
  },

  storage: {
    driver: storageDriver,
    maxUploadBytes: env.MAX_UPLOAD_MB * 1024 * 1024,
    maxUploadMb: env.MAX_UPLOAD_MB,
    uploadDir: env.UPLOAD_DIR,
    localUrlPath: '/uploads',
    r2: {
      accountId: env.R2_ACCOUNT_ID,
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      bucket: env.R2_BUCKET,
      publicUrl: env.R2_PUBLIC_URL,
      endpoint: env.R2_ENDPOINT ?? `https://${env.R2_ACCOUNT_ID ?? ''}.r2.cloudflarestorage.com`,
      prefix: env.R2_PREFIX.replace(/^\/+|\/+$/g, ''),
    },
  },

  // The browser keeps the refresh token in a cookie JavaScript cannot read, so an XSS bug in the
  // frontend cannot steal a session; it is sent only to the auth routes (OWASP API2)
  refreshCookie: {
    name: 'refreshToken',
    path: '/api/v1/auth',
    sameSite: refreshCookieSameSite,
    httpOnly: true,
    secure: env.ENV === 'production',
    maxAgeMs: env.REFRESH_TOKEN_EXPIRY_DAYS * DAY_MS,
  },

  adminSeed: {
    username: env.ADMIN_USERNAME,
    password: env.ADMIN_PASSWORD,
    firstName: env.ADMIN_FIRST_NAME,
    lastName: env.ADMIN_LAST_NAME,
  },
};
