import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { installCalibratedAuthoritativePipeline } from './src/cubio/intelligence/pipeline/calibratedAuthoritativePipeline';
import { CubiOInferenceRouter } from './src/cubio/inference/backend/cubioInferenceRouter';

// Install calibrated authoritative pipeline singleton into CUBiO core
installCalibratedAuthoritativePipeline();

const inferenceRouter = new CubiOInferenceRouter();

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'cubio-inference-api-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const url = req.url || '';
            if (url.startsWith('/api/cubio/')) {
              const method = (req.method || 'GET').toUpperCase() as 'GET' | 'POST';

              let bodyData: any = {};
              if (method === 'POST') {
                const chunks: Buffer[] = [];
                for await (const chunk of req) {
                  chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
                }
                const rawBody = Buffer.concat(chunks).toString('utf-8');
                try {
                  bodyData = JSON.parse(rawBody || '{}');
                } catch {
                  bodyData = {};
                }
              }

              if (url === '/api/cubio/checkpoint/generate' && method === 'POST') {
                try {
                  const { generateCheckpoint } = await import('./src/funnel02/export_service');
                  const { grid, epoch, description } = bodyData || {};
                  const exportResult = generateCheckpoint({
                    grid,
                    epoch: typeof epoch === 'number' ? epoch : 0,
                    description: description || 'Live 3D Memory Studio Core Checkpoint',
                  });

                  res.writeHead(200, {
                    'Content-Type': 'application/octet-stream',
                    'Content-Disposition': `attachment; filename="${exportResult.filename}"`,
                    'X-Checkpoint-SHA256': exportResult.sha256,
                    'X-Cells-Count': exportResult.cellsCount.toString(),
                    'X-Address-Count': exportResult.addressCount.toString(),
                    'Access-Control-Allow-Origin': '*',
                  });
                  res.end(exportResult.jsonString);
                  return;
                } catch (err: any) {
                  res.writeHead(400, {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                  });
                  res.end(JSON.stringify({ success: false, error: err.message || 'Failed to generate checkpoint' }));
                  return;
                }
              }

              try {
                const routeRes = await inferenceRouter.routeRequest(url, method, bodyData);
                if (routeRes.isStream && routeRes.stream) {
                  res.writeHead(routeRes.status, {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                  });
                  for await (const sseChunk of routeRes.stream) {
                    res.write(sseChunk);
                  }
                  res.end();
                  return;
                }

                res.writeHead(routeRes.status, {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*',
                });
                res.end(JSON.stringify(routeRes.data || {}));
                return;
              } catch (err: any) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message || 'Inference engine error' }));
                return;
              }
            }
            next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/data/**', '**/data/cubio_sessions.json'],
      },
      proxy: {
        '/api/v1': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
  };
});
