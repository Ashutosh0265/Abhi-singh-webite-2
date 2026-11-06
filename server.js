import { dirname, resolve } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs';
import express from 'express';

// Production server for Node hosting (Hostinger Web Apps).
// Mirrors what Vercel does from vercel.json: api/*.js routes, headers and rewrites.
const rootDir = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(rootDir, 'dist');
const apiDir = resolve(rootDir, 'api');
const { headers: headerRules } = JSON.parse(fs.readFileSync(resolve(rootDir, 'vercel.json'), 'utf8'));

const headersFor = (source) => headerRules.find((rule) => rule.source === source).headers;
const setHeaders = (res, headers) => headers.forEach(({ key, value }) => res.setHeader(key, value));

const app = express();
app.disable('x-powered-by');

app.use((req, res, next) => {
  setHeaders(res, headersFor('/(.*)'));
  if (req.path.startsWith('/admin')) {
    setHeaders(res, headersFor('/admin(.*)'));
  }
  next();
});

app.use('/api', express.json({ limit: '1mb' }));

for (const file of fs.readdirSync(apiDir)) {
  if (!file.endsWith('.js')) continue;
  const modulePath = pathToFileURL(resolve(apiDir, file)).href;
  app.all(`/api/${file.replace(/\.js$/, '')}`, async (req, res) => {
    try {
      const { default: handler } = await import(modulePath);
      await handler(req, res);
    } catch (err) {
      console.error('[API Error]:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });
}

app.use(express.static(distDir));

app.use((req, res) => {
  const isPageRoute = req.method === 'GET'
    && !req.path.startsWith('/api/')
    && !req.path.startsWith('/assets/')
    && !req.path.includes('.');

  if (!isPageRoute) {
    return res.status(404).send('Not found');
  }
  const isAdmin = req.path === '/admin' || req.path.startsWith('/admin/');
  return res.sendFile(resolve(distDir, isAdmin ? 'admin.html' : 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
