import { execSync } from 'child_process';

export default async () => {
  await global['__APP__'].close();
  execSync('docker-compose -f ./test/docker-compose-test.yml down');
};
