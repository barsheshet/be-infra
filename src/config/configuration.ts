import * as Joi from '@hapi/joi';

export const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .required(),
  PORT: Joi.number(),
  HOST: Joi.string().uri(),
  // only PostgreSQL supported at the moment
  DB_TYPE: Joi.string().valid('postgres'),
  DB_HOST: Joi.string(),
  DB_PORT: Joi.number(),
  DB_USERNAME: Joi.string(),
  DB_PASSWORD: Joi.string(),
  DB_NAME: Joi.string(),
  DB_DEBUG: Joi.boolean(),
  REDIS_HOST: Joi.string(),
  REDIS_PORT: Joi.number(),
  REDIS_PASSWORD: Joi.string(),
  REDIS_CONNECTION_NAME: Joi.string(),
  JWT_PRIVATE_KEY_PATH: Joi.string().uri(),
  JWT_PUBLIC_KEY_PATH: Joi.string().uri(),
  JWT_ALGORITHM: Joi.string().valid('RS256', 'RS384', 'RS512'),
  JWT_ISSUER: Joi.string(),
  JWT_EXPIRES_IN: Joi.string(),
  SENDGRID_API_KEY: Joi.string(),
  SENDGRID_DEFAULT_FROM: Joi.string(),
  TWILIO_ACCOUNT_SID: Joi.string(),
  TWILIO_AUTH_TOKEN: Joi.string(),
  SYSTEM_ADMIN_EMAIL: Joi.string()
    .email()
    .required(),
  SYSTEM_ADMIN_PASSWORD: Joi.string().required(),
  CORS: Joi.string().default('')
});

export const config = () => ({
  nodeEnv: process.env.NODE_ENV,
  port: parseInt(process.env.PORT, 10) || 3000,
  host: process.env.HOST || 'http://localhost:3000',
  cors: {
    origin: process.env.CORS.split(','),
    credentials: true
  },
  db: {
    type: process.env.DB_TYPE || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5430,
    username: process.env.DB_USERNAME || 'devPostgresUser',
    password: process.env.DB_PASSWORD || 'devPostgresPassword',
    database: process.env.DB_NAME || 'be-infra',
    autoLoadEntities: true,
    synchronize: false,
    migrations: ['dist/**/*.migration{.ts,.js}'],
    logging: Boolean(process.env.DB_DEBUG) || false,
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || 'devRedisPassword',
    connectionName: process.env.REDIS_CONNECTION_NAME || 'be-infra',
    connectTimeout: 500,
    maxRetriesPerRequest: 1,
  },
  sendgrid: {
    host: 'https://api.sendgrid.com/v3',
    apiKey: process.env.SENDGRID_API_KEY || 'SENDGRID_API_KEY',
    defaultFrom:
      process.env.SENDGRID_DEFAULT_FROM || 'be-infra <noreply@be-infra.com>',
  },
  twilio: {
    host: 'https://api.twilio.com/2010-04-01',
    accountSid: process.env.TWILIO_ACCOUNT_SID || 'TWILIO_ACCOUNT_SID',
    authToken: process.env.TWILIO_AUTH_TOKEN || 'TWILIO_AUTH_TOKEN',
    defaultFrom: process.env.TWILIO_DEFAULT_FROM || '+12512505295',
  },
  jwt: {
    privateKeyPath:
      process.env.JWT_PRIVATE_KEY_PATH || 'src/config/private.key',
    publicKeyPath: process.env.JWT_PUBLIC_KEY_PATH || 'src/config/public.key',
    options: {
      algorithm: process.env.JWT_ALGORITHM || 'RS256',
      issuer: process.env.JWT_ISSUER || 'be-infra',
      expiresIn: '15m' // 15 minutes,
    },
  },
  refreshTokenCookieOptions: {
    httpOnly: true,
    sameSite: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    secure: process.env.NODE_ENV !== 'development',
  },
  trustedDeviceCookieOptions: {
    httpOnly: true,
    sameSite: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 365 * 20, // 20 years :),
    secure: process.env.NODE_ENV !== 'development',
  },
  verifications: {
    email: {
      url: process.env.VERIFICATION_EMAIL_URL || 'http://localhost:3001/verify-email',
      expiration: {
        hours: 24,
      },
    },
    sms: {
      expiration: {
        minutes: 5,
      },
    },
  },
  rateLimits: {
    global: {
      points: 300,
      duration: 60,
    },
    slowBruteByIP: {
      points: 50,
      duration: 60 * 60 * 24,
      blockDuration: 60 * 60 * 24, // Block for 1 day, if 50 wrong attempts per day
    },
    consecutiveFailsByUsernameAndIP: {
      points: 10,
      duration: 60 * 60 * 24 * 90, // Store number for 90 days since first fail
      blockDuration: 60 * 60 * 24 * 365 * 20, // Block for infinity after 10 consecutive fails
    },
    slowBruteByUsername: {
      points: 50,
      duration: 60 * 60 * 24,
      blockDuration: 60 * 60 * 24 * 365 * 20, // Block for infinity after 50 fails in one day
    },
  },
  seed: {
    systemAdmin: {
      email: process.env.SYSTEM_ADMIN_EMAIL,
      password: process.env.SYSTEM_ADMIN_PASSWORD,
      role: 'admin',
      info: {
        firstName: 'Admin',
        lastName: 'Admin'
      },
    },
    testUser: {
      email: 'test@be-infra.com',
      password: 'Aa123456789!',
      role: 'member',
      info: {
        firstName: 'Test',
        lastName: 'Test'
      },
    },
  },
  acl: {
    admin: [{ action: 'manage', subject: 'all' }],
    member: [
      { action: 'GET', subject: '/api/v1/account/getProfile' },
      { action: 'POST', subject: '/api/v1/account/setInfo' },
      { action: 'POST', subject: '/api/v1/account/setMobile' },
      { action: 'POST', subject: '/api/v1/account/verifyMobile' },
      { action: 'POST', subject: '/api/v1/account/setEmail' },
      { action: 'POST', subject: '/api/v1/account/setSmsTwoFa' },
      { action: 'POST', subject: '/api/v1/account/logout' },
    ],
  },
});
