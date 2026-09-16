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

import { shipFromLoadoutJSON } from '../coriolis/src/app/utils/JournalUtils.js';
import { toDetailedBuild } from '../coriolis/src/app/shipyard/Serializer.js';

const PORT = Number(process.env.PORT) || 7777;
const HOST = process.env.HOST || '0.0.0.0';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
const BODY_LIMIT = process.env.BODY_LIMIT || '1mb';
const CONVERSIONS_FILE =
  process.env.CONVERSIONS_FILE || path.resolve('conversions.json');
const CONVERSIONS_MAX = Number(process.env.CONVERSIONS_MAX) || 5000;

const MAX_PRIORITY = 4;

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

/**
 * Validates an Elite: Dangerous loadout event.
 * @param {*} body Parsed request body
 * @return {string|null} An error message, or null when the body looks valid
 */
function validateLoadout(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Request body must be a JSON object';
  }
  if (typeof body.Ship !== 'string' || body.Ship.trim() === '') {
    return 'Missing required string field "Ship"';
  }
  if (!Array.isArray(body.Modules)) {
    return 'Missing required array field "Modules"';
  }
  for (let i = 0; i < body.Modules.length; i++) {
    const module = body.Modules[i];
    if (!module || typeof module !== 'object') {
      return `Modules[${i}] must be an object`;
    }
    if (typeof module.Slot !== 'string' || module.Slot === '') {
      return `Modules[${i}] is missing required string field "Slot"`;
    }
    if (typeof module.Item !== 'string' || module.Item === '') {
      return `Modules[${i}] is missing required string field "Item"`;
    }
  }
  return null;
}

/**
 * Fills in the optional fields that the loadout event (and third party tools)
 * may omit. Without this the Coriolis power band calculation crashes on
 * undefined/out-of-range priorities.
 * @param {Array} modules Loadout modules (mutated in place)
 */
function applyDefaults(modules) {
  for (const module of modules) {
    if (module.On === undefined) {
      module.On = true;
    }
    let priority = Number(module.Priority);
    if (!Number.isInteger(priority) || priority < 0) {
      priority = 1;
    }
    module.Priority = Math.min(priority, MAX_PRIORITY);
  }
}

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

    applyDefaults(req.body.Modules);

    const buildName =
      typeof req.body.ShipName === 'string' ? req.body.ShipName : '';

    const ship = shipFromLoadoutJSON(req.body);
    ship.updateStats();

    const response = toDetailedBuild(buildName, ship);
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
