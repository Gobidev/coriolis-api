'use strict';

/**
 * Coriolis API server.
 *
 * This is a normal ES module that imports the conversion helpers straight from
 * the (cloned) Coriolis sources. `build.mjs` bundles it together with those
 * sources into a single CommonJS file (`coriolis-api.js`) using esbuild.
 */

import express from 'express';
import fs from 'node:fs';
import path from 'node:path';

import { convertLoadout, validateLoadout } from './convert.js';

const PORT = Number(process.env.PORT) || 7777;
const HOST = process.env.HOST || '0.0.0.0';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const BODY_LIMIT = process.env.BODY_LIMIT || '1mb';
const CONVERSIONS_FILE =
  process.env.CONVERSIONS_FILE || path.resolve('conversions.json');
const CONVERSIONS_MAX = Number(process.env.CONVERSIONS_MAX) || 5000;

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: BODY_LIMIT }));

app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', CORS_ORIGIN);
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  return next();
});

// Conversion URLs are appended to disk. Writes are serialized through a promise
// chain and every step is guarded so a failure can never crash the process.
let conversionsQueue = Promise.resolve();
function logConversion(url) {
  conversionsQueue = conversionsQueue
    .then(async () => {
      let entries = [];
      try {
        const raw = await fs.promises.readFile(CONVERSIONS_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          entries = parsed;
        }
      } catch (err) {
        if (err.code !== 'ENOENT') {
          console.error('[conversions] failed to read log:', err.message);
        }
      }
      entries.push([Date.now(), url]);
      if (entries.length > CONVERSIONS_MAX) {
        entries = entries.slice(-CONVERSIONS_MAX);
      }
      await fs.promises.writeFile(
        CONVERSIONS_FILE,
        JSON.stringify(entries, null, 2)
      );
    })
    .catch((err) => {
      console.error('[conversions] failed to write log:', err.message);
    });
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/convert', (req, res, next) => {
  try {
    const invalid = validateLoadout(req.body);
    if (invalid) {
      return res.status(400).json({ error: invalid });
    }

    const response = convertLoadout(req.body);
    const url = response.references[0].url;

    console.log(`${new Date().toISOString()} converted ${req.body.Ship} -> ${url}`);
    logConversion(url);

    return res.json(response);
  } catch (err) {
    return next(err);
  }
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  let status =
    err.status || err.statusCode || (typeof err === 'string' ? 400 : 500);
  let message;

  if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Invalid JSON body';
  } else if (err.type === 'entity.too.large') {
    status = 413;
    message = 'Request body too large';
  } else if (status >= 500) {
    message = 'Internal server error';
  } else {
    message = typeof err === 'string' ? err : err.message || 'Bad request';
  }

  const detail = typeof err === 'string' ? err : err.stack || err.message;
  if (status >= 500) {
    console.error(`[convert] request failed (${status}):`, detail);
  } else {
    console.warn(`[convert] bad request (${status}):`, detail);
  }

  res.status(status).json({ error: message });
});

const server = app.listen(PORT, HOST, () => {
  console.log(`Coriolis API listening on http://${HOST}:${PORT}`);
});

function shutdown(signal) {
  console.log(`Received ${signal}, shutting down`);
  server.close(() => process.exit(0));
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});
