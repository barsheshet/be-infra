import { execSync } from 'child_process';
import * as nock from 'nock';
import { ConfigService } from '@nestjs/config';
import { getMockServer } from './mock-server';

export default async () => {
  execSync('docker-compose -f ./test/docker-compose-test.yml up -d');

  // wait for 3 seconds for docker to be ready
  await new Promise(resolve => setTimeout(resolve, 3000));

  const server = await getMockServer();
  const configService = server.get(ConfigService);

  nock(configService.get('sendgrid.host'))
    .post(/.*/)
    .reply(200)
    .persist();
  nock(configService.get('twilio.host'))
    .post(/.*/)
    .reply(200)
    .persist();

  global['__SERVER__'] = server;
};
