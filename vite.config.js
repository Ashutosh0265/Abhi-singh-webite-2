import { resolve } from 'path';
import fs from 'fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function apiMiddlewarePlugin() {
  return {
    name: 'api-serverless-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/')) {
          return next();
        }
        try {
          const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
          const pathname = urlObj.pathname;
          const query = Object.fromEntries(urlObj.searchParams.entries());

          const routeName = pathname.replace(/^\/api\//, '').split('?')[0];
          let modulePath = resolve(__dirname, `api/${routeName}.js`);
          if (!fs.existsSync(modulePath)) {
            modulePath = resolve(__dirname, `api/${routeName.split('/')[0]}.js`);
          }

          if (fs.existsSync(modulePath)) {
            let body = {};
            if (req.method === 'POST' || req.method === 'PUT') {
              const buffers = [];
              for await (const chunk of req) {
                buffers.push(chunk);
              }
              const rawBody = Buffer.concat(buffers).toString('utf8');
              try {
                body = rawBody ? JSON.parse(rawBody) : {};
              } catch {
                body = rawBody;
              }
            }

            req.query = query;
            req.body = body;

            res.status = function (code) {
              res.statusCode = code;
              return res;
            };
            res.json = function (json) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(json));
              return res;
            };
            res.redirect = function (codeOrUrl, url) {
              const redirectCode = typeof codeOrUrl === 'number' ? codeOrUrl : 302;
              const redirectUrl = typeof codeOrUrl === 'string' ? codeOrUrl : url;
              res.statusCode = redirectCode;
              res.setHeader('Location', redirectUrl);
              res.end();
              return res;
            };

            const mod = await import(`file://${modulePath}?t=${Date.now()}`);
            if (mod && mod.default) {
              return await mod.default(req, res);
            }
          }
          next();
        } catch (err) {
          console.error('[API Middleware Error]:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), apiMiddlewarePlugin()],
  define: {
    MAX_FILE_SIZE_BYTES: JSON.stringify(25 * 1024 * 1024),
    MAX_VIDEO_FILE_SIZE_BYTES: JSON.stringify(100 * 1024 * 1024),
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    open: false,
    watch: {
      ignored: ['**/E.L.R.x*', '**/ELRx*', '**/*.html.tmp*']
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html')
      }
    }
  }
});
