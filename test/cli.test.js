'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const ENTRY = path.join(ROOT, 'coriolis-convert.js');

const validLoadout = {
  Ship: 'krait_mkii',
  ShipName: 'cli test',
  Modules: [
    { Slot: 'Armour', Item: 'krait_mkii_armour_grade1', On: true },
    { Slot: 'PowerPlant', Item: 'Int_PowerPlant_Size7_Class5', On: true, Priority: 1 },
    { Slot: 'FrameShiftDrive', Item: 'Int_Hyperdrive_Size5_Class5', On: true, Priority: 1 },
    { Slot: 'FuelTank', Item: 'Int_FuelTank_Size5_Class3', On: true, Priority: 1 },
  ],
};

function run(input) {
  return spawnSync(process.execPath, [ENTRY], {
    input: typeof input === 'string' ? input : JSON.stringify(input),
    encoding: 'utf8',
  });
}

test.before(() => {
  assert.ok(fs.existsSync(ENTRY), 'coriolis-convert.js must be built before testing');
});

test('CLI converts a loadout to a Coriolis build', () => {
  const result = run(validLoadout);
  assert.strictEqual(result.status, 0, result.stderr);
  const build = JSON.parse(result.stdout);
  assert.strictEqual(build.ship, 'Krait Mk II');
  assert.ok(build.components && build.components.standard, 'has components');
  assert.ok(build.stats.fullTankRange > 0, 'has a jump range');
});

test('CLI defaults omitted On/Priority fields', () => {
  const loadout = {
    ...validLoadout,
    Modules: validLoadout.Modules.map(({ Slot, Item }) => ({ Slot, Item })),
  };
  const result = run(loadout);
  assert.strictEqual(result.status, 0, result.stderr);
  assert.strictEqual(JSON.parse(result.stdout).ship, 'Krait Mk II');
});

test('CLI fails on an invalid loadout', () => {
  const result = run({ Modules: [] });
  assert.strictEqual(result.status, 1);
  assert.match(result.stderr, /Ship/);
  assert.strictEqual(result.stdout, '');
});

test('CLI fails on malformed JSON', () => {
  const result = run('not json');
  assert.strictEqual(result.status, 1);
  assert.match(result.stderr, /Invalid JSON/);
});
