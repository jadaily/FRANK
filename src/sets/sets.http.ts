import * as http from 'http';
import { SetsService } from './sets.service';

export function createSetLogServer() {
  const service = new SetsService(undefined as any, undefined as any, {
    saveSetLog: async (input: any) => ({ id: 1, ...input }),
    saveRatingHistory: async (input: any) => ({ id: 1, ...input }),
  } as any);

  return http.createServer(async (req, res) => {
    if (req.method === 'POST' && req.url === '/sets') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', async () => {
        try {

          const authHeader = req.headers['authorization'];
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.writeHead(401, { 'content-type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Unauthorized: Missing or invalid token' }));
          }
          
          const userId = authHeader.split('-').pop() || 'unknown-user';
          const payload = JSON.parse(body);
          const result = await service.logSet(userId, payload);

          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (error) {
          res.writeHead(400, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Invalid request' }));
        }
      });
      return;
    }

    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });
}
