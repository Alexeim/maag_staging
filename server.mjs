import { handler as ssrHandler } from './dist/server/entry.mjs';
import express from 'express';
import expressStaticGzip from 'express-static-gzip';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// Serve pre-compressed static files (.br, .gz created by astro-compressor at build time)
app.use(
  '/',
  expressStaticGzip(join(__dirname, './dist/client'), {
    enableBrotli: true,
    orderPreference: ['br', 'gz'],
    serveStatic: {
      maxAge: '1y',
      immutable: true,
    },
  })
);

// Astro SSR handler for all dynamic routes
app.use(ssrHandler);

const port = process.env.PORT || 8080;
const host = process.env.HOST || '0.0.0.0';

app.listen(port, host, () => {
  console.log(`Server running on ${host}:${port}`);
});
