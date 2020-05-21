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
  JWT_PRIVATE_KEY_PATH: Joi.string().uri(),
  JWT_PUBLIC_KEY_PATH: Joi.string().uri(),
  JWT_ALGORITHM: Joi.string().valid('RS256', 'RS384', 'RS512'),
  JWT_ISSUER: Joi.string(),
  JWT_EXPIRES_IN: Joi.string(),
});

export const config = () => ({
  nodeEnv: process.env.NODE_ENV,
  port: parseInt(process.env.PORT, 10) || 3000,
  host: process.env.HOST || 'http://localhost:3000',
  db: {
    type: process.env.DB_TYPE || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USERNAME || 'devPostgresUser',
    password: process.env.DB_PASSWORD || 'devPostgresPassword',
    database: process.env.DB_NAME || 'be-infra',
    autoLoadEntities: true,
    synchronize: false,
    migrations: ['dist/**/*.migration{.ts,.js}'],
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
});
