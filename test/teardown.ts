import { execSync } from 'child_process';

export default async () => {
  await global['__SERVER__'].close();
  execSync('docker-compose -f ./test/docker-compose-test.yml down');
};
