import { Test, TestingModule } from '@nestjs/testing';
import { getConnection } from 'typeorm';
import { AppModule } from '../src/app.module';
import { execSync } from 'child_process';
import * as nock from 'nock';
import { ConfigService } from '@nestjs/config';
import { mockServer } from './mock-server';

export default async () => {
  execSync('docker-compose -f ./test/docker-compose-test.yml up -d');

  // wait for 3 seconds for docker to be ready
  await new Promise(resolve => setTimeout(resolve, 3000));

  const server = await mockServer();
  const configService = server.get(ConfigService);

  const connection = getConnection();
  await connection.runMigrations();

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
