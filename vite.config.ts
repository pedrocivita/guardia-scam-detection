import path from 'path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const SERVER_ENV = ['GEMINI_API_KEY', 'GEMINI_MODEL'];

function applyServerEnv(mode: string) {
  const loaded = loadEnv(mode, process.cwd(), '');
  for (const name of SERVER_ENV) {
    const value = loaded[name];
    if (value && !process.env[name]) process.env[name] = value;
  }
}

function toWebRequest(req: IncomingMessage, body: Buffer): Request {
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      for (const item of value) headers.append(key, item);
    } else {
      headers.set(key, value);
    }
  }
  headers.delete('content-length');
  headers.delete('transfer-encoding');
  const host = req.headers.host ?? 'localhost';
  const method = req.method ?? 'GET';
  return new Request(`http://${host}${req.url}`, {
    method,
    headers,
    body: method === 'GET' || method === 'HEAD' ? undefined : body,
  });
}

function guardiaApiPlugin(mode: string): Plugin {
  return {
    name: 'guardia-api',
    configureServer(server) {
      applyServerEnv(mode);
      server.middlewares.use((req, res, next) => {
        const pathname = (req.url ?? '').split('?')[0];
        if (pathname !== '/api/analyze') {
          next();
          return;
        }
        const chunks: Buffer[] = [];
        req.on('data', (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });
        req.on('error', () => {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Could not read the request body.' }));
        });
        req.on('end', () => {
          void handleApi(req, res, server, Buffer.concat(chunks)).catch((error: unknown) => {
            console.error('API dev middleware failed');
            if (error instanceof Error) console.error(error.message);
            if (!res.headersSent) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({ error: 'API dev middleware failed.' }));
            }
          });
        });
      });
    },
  };
}

async function handleApi(
  req: IncomingMessage,
  res: ServerResponse,
  server: { ssrLoadModule: (url: string) => Promise<Record<string, unknown>> },
  body: Buffer,
) {
  const mod = await server.ssrLoadModule('/api/analyze.js');
  const method = req.method ?? 'GET';
  const handler = method === 'GET' ? mod.GET : method === 'POST' ? mod.POST : null;
  if (typeof handler !== 'function') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, POST');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Method not allowed.' }));
    return;
  }

  const response = await (handler as (request: Request) => Promise<Response>)(
    toWebRequest(req, body),
  );
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    if (key !== 'transfer-encoding') res.setHeader(key, value);
  });
  res.end(Buffer.from(await response.arrayBuffer()));
}

export default function viteConfig({ mode }: { mode: string }) {
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), guardiaApiPlugin(mode)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
}
