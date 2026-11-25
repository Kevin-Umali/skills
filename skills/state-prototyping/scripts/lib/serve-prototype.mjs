import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { extname, join, normalize, relative } from 'node:path';
import { pathToFileURL } from 'node:url';
import { toPosix } from './prototype-files.mjs';

const CONTENT_TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff': 'font/woff', '.woff2': 'font/woff2',
};

const serveStatic = (projectRoot) => new Promise((resolveServer) => {
  const server = createServer((request, response) => {
    const requestPath = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = normalize(join(projectRoot, requestPath));
    const isServable = !relative(projectRoot, file).startsWith('..') && existsSync(file) && statSync(file).isFile();
    if (!isServable) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { 'content-type': CONTENT_TYPES[extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file));
  });
  server.listen(0, '127.0.0.1', () => resolveServer({ origin: `http://127.0.0.1:${server.address().port}/`, close: () => server.close(), kind: 'static' }));
});

const serveVite = async (projectRoot, configFile) => {
  const vite = await import(pathToFileURL(createRequire(join(projectRoot, 'package.json')).resolve('vite')).href);
  const server = await vite.createServer({ configFile, logLevel: 'error', server: { port: 0, strictPort: false } });
  await server.listen();
  return { origin: server.resolvedUrls.local[0], close: () => server.close(), kind: 'vite' };
};

export const servePrototype = async (projectRoot, prototypeDirectory) => {
  const configFile = join(prototypeDirectory, 'vite.config.mjs');
  const served = existsSync(configFile) ? await serveVite(projectRoot, configFile) : await serveStatic(projectRoot);
  return { ...served, url: new URL(`${toPosix(relative(projectRoot, prototypeDirectory))}/measure.html`, served.origin).href };
};
