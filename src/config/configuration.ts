import * as Joi from '@hapi/joi';

export const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .required(),
  PORT: Joi.number(),
  HOST: Joi.string().uri(),
  DB_TYPE: Joi.string().valid(
    'mysql',
    'postgres',
    'cockroachdb',
    'mariadb',
    'sqlite',
    'oracle',
    'mssql',
    'mongodb',
  ),
  DB_HOST: Joi.string(),
  DB_PORT: Joi.number(),
  DB_USERNAME: Joi.string(),
  DB_PASSWORD: Joi.string(),
  DB_NAME: Joi.string(),
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
});

export const config = () => ({
  nodeEnv: process.env.NODE_ENV,
  port: parseInt(process.env.PORT, 10) || 3000,
  host: process.env.HOST || 'http://localhost:3000',
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
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    },
  },
  trustedDeviceCookieOptions: {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365 * 20, // 20 years :),
    secure: process.env.NODE_ENV !== 'development',
  },
  verifications: {
    email: {
      url: process.env.VERIFICATION_EMAIL_URL || 'http://localhost:9000',
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
});
