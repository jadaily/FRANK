import * as http from 'http';
import { AddressInfo } from 'net';
import { createSetLogServer } from './sets.http';

describe('set logging HTTP endpoint', () => {
  let server: http.Server;
  let port: number;

  beforeEach(async () => {
    server = createSetLogServer();
    await new Promise<void>((resolve) => {
      server.listen(0, () => resolve());
    });
    port = (server.address() as AddressInfo).port;
  });

  afterEach(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it('accepts a POST request and returns the rating update payload', async () => {
    const response = await new Promise<{ statusCode: number; body: string }>((resolve, reject) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path: '/sets',
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'authorization': 'Bearer mock-valid-jwt-token-string-user-1'
           },
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', () => resolve({ statusCode: res.statusCode ?? 0, body }));
        },
      );

      req.on('error', reject);

      req.write(JSON.stringify({
        exercise: 'squat',
        weight: 225,
        reps: 5,
        sex: 'male',
        bodyweightKg: 82.5,
      }));
      req.end();
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('estimatedOneRepMax');

    expect(response.body).toContain('2361.7');
    expect(response.body).toContain('493.6');
  });
});
