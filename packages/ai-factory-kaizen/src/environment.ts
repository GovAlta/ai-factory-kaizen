import { config } from 'dotenv';
import { cleanEnv, num, str } from 'envalid';
import { resolve } from 'path';

config({
  path: resolve(process.cwd(), 'packages/ai-factory-kaizen/.env'),
});

export const environment = cleanEnv(process.env, {
  KEYCLOAK_ROOT_URL: str({ default: 'https://access.adsp-dev.gov.ab.ca' }),
  DIRECTORY_URL: str({
    default: 'https://directory-service.adsp-dev.gov.ab.ca',
  }),
  TENANT_REALM: str({ default: '51e22cc3-265a-43c2-ad8a-6ff445d85218' }),
  CLIENT_ID: str({ default: 'urn:ads:Demo:ai-factory-kaizen' }),
  CLIENT_SECRET: str({ default: '' }),
  TRUSTED_PROXY: str({ default: 'uniquelocal' }),
  LOG_LEVEL: str({ default: 'debug' }),
  PORT: num({ default: 3333 }),
});
