import { getMockServer } from '../mock-server';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { ConfigService } from '@nestjs/config';

describe('API auth (e2e)', () => {
  let server: NestFastifyApplication;
  let testUserCreds;

  beforeAll(async () => {
    server = await getMockServer();

    const config = server.get(ConfigService);
    testUserCreds = config.get('seed.testUser');
  });

  afterAll(async () => {
    await server.close();
  });

  it('/api/v1/auth/signup (POST)', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/auth/signup',
      payload: {
        email: 'bla@bla.com',
        password: 'Aa123456789!',
      },
    });

    expect(JSON.parse(response.payload)).toMatchObject({
      jwt: expect.stringMatching(''),
    });
  });

  it('/api/v1/auth/login (POST)', async () => {
    const response = await server.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: testUserCreds,
    });

    expect(JSON.parse(response.payload)).toMatchObject({
      jwt: expect.stringMatching(''),
    });
  });
});
