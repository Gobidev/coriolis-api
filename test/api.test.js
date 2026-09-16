'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');

const ROOT = path.resolve(__dirname, '..');
const ENTRY = path.join(ROOT, 'coriolis-api.js');

let server;
let baseUrl;
let tmpDir;

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

function waitForHealth(url, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = async () => {
      try {
        const res = await fetch(`${url}/health`);
        if (res.ok) {
          return resolve();
        }
      } catch {
        // not up yet
      }
      if (Date.now() > deadline) {
        return reject(new Error('server did not become healthy in time'));
      }
      return setTimeout(attempt, 100);
    };
    attempt();
  });
}

async function post(body, { raw = false } = {}) {
  const res = await fetch(`${baseUrl}/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: raw ? body : JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, text, json };
}

const validLoadout = {
  Ship: 'krait_mkii',
  ShipName: 'test build',
  Modules: [
    { Slot: 'Armour', Item: 'krait_mkii_armour_grade1', On: true },
    { Slot: 'PowerPlant', Item: 'Int_PowerPlant_Size7_Class5', On: true, Priority: 1 },
    { Slot: 'MainEngines', Item: 'Int_Engine_Size6_Class5', On: true, Priority: 1 },
    { Slot: 'FrameShiftDrive', Item: 'Int_Hyperdrive_Size5_Class5', On: true, Priority: 1 },
    { Slot: 'LifeSupport', Item: 'Int_LifeSupport_Size5_Class3', On: true, Priority: 1 },
    { Slot: 'PowerDistributor', Item: 'Int_PowerDistributor_Size7_Class5', On: true, Priority: 1 },
    { Slot: 'Radar', Item: 'Int_Sensors_Size6_Class5', On: true, Priority: 1 },
    { Slot: 'FuelTank', Item: 'Int_FuelTank_Size5_Class3', On: true, Priority: 1 },
  ],
};

before(async () => {
  assert.ok(fs.existsSync(ENTRY), 'coriolis-api.js must be built before testing');
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'coriolis-api-test-'));
  const port = await freePort();
  baseUrl = `http://127.0.0.1:${port}`;
  server = spawn(process.execPath, [ENTRY], {
    cwd: tmpDir,
    env: {
      ...process.env,
      PORT: String(port),
      HOST: '127.0.0.1',
      CONVERSIONS_FILE: path.join(tmpDir, 'conversions.json'),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', () => {});
  server.stderr.on('data', () => {});
  await waitForHealth(baseUrl);
});

after(() => {
  if (server) {
    server.kill('SIGTERM');
  }
  if (tmpDir) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('converts a loadout event (Priority omitted) to a Coriolis build', async () => {
  const { ShipName, ...withoutName } = validLoadout;
  const { status, json } = await post(withoutName);
  assert.strictEqual(status, 200);
  assert.strictEqual(json.ship, 'Krait Mk II');
  assert.match(json.references[0].url, /^https:\/\/coriolis\.io\/outfit\/krait_mkii\?code=/);
  assert.ok(json.components && json.components.standard, 'has components');
  assert.ok(Object.keys(json.stats).length > 0, 'has stats');
});

test('rejects a missing Ship field', async () => {
  const { status, json } = await post({ Modules: [] });
  assert.strictEqual(status, 400);
  assert.match(json.error, /Ship/);
});

test('rejects a missing Modules field', async () => {
  const { status, json } = await post({ Ship: 'krait_mkii' });
  assert.strictEqual(status, 400);
  assert.match(json.error, /Modules/);
});

test('rejects a module without a Slot', async () => {
  const { status, json } = await post({
    Ship: 'krait_mkii',
    Modules: [{ Item: 'Int_FuelTank_Size5_Class3' }],
  });
  assert.strictEqual(status, 400);
  assert.match(json.error, /Slot/);
});

test('rejects malformed JSON with a JSON error (no stack trace)', async () => {
  const { status, json } = await post('{not json', { raw: true });
  assert.strictEqual(status, 400);
  assert.strictEqual(json.error, 'Invalid JSON body');
  assert.ok(!json.error.includes('coriolis-api.js'), 'does not leak internals');
});

test('rejects an unknown ship', async () => {
  const { status, json } = await post({ Ship: 'not_a_real_ship', Modules: [] });
  assert.strictEqual(status, 400);
  assert.match(json.error, /No such ship/);
});

test('clamps out-of-range priorities instead of crashing', async () => {
  const loadout = {
    ...validLoadout,
    Modules: validLoadout.Modules.map((m) => ({ ...m, Priority: 99 })),
  };
  const { status } = await post(loadout);
  assert.strictEqual(status, 200);
});

test('survives concurrent requests and keeps the conversion log valid', async () => {
  const results = await Promise.all(
    Array.from({ length: 50 }, () => post(validLoadout))
  );
  assert.ok(results.every((r) => r.status === 200));

  const health = await fetch(`${baseUrl}/health`);
  assert.strictEqual(health.status, 200);

  const logFile = path.join(tmpDir, 'conversions.json');
  let entries;
  for (let i = 0; i < 100; i++) {
    try {
      entries = JSON.parse(fs.readFileSync(logFile, 'utf8'));
      if (entries.length >= 50) {
        break;
      }
    } catch {
      // log not written yet
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  assert.ok(Array.isArray(entries), 'log file is valid JSON');
  assert.ok(entries.length >= 50, `logged every conversion (got ${entries && entries.length})`);
  assert.ok(entries.every((e) => Array.isArray(e) && e.length === 2));
});
