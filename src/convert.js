'use strict';

/**
 * Core loadout -> Coriolis build conversion.
 *
 * Shared by the HTTP server (`index.js`) and the stdin/stdout CLI (`cli.js`),
 * so both expose exactly the same behaviour.
 */

import { shipFromLoadoutJSON } from '../coriolis/src/app/utils/JournalUtils.js';
import { toDetailedBuild } from '../coriolis/src/app/shipyard/Serializer.js';

const MAX_PRIORITY = 4;

/**
 * Validates an Elite: Dangerous loadout event.
 * @param {*} body Parsed loadout event
 * @return {string|null} An error message, or null when the body looks valid
 */
export function validateLoadout(body) {
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
export function applyDefaults(modules) {
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

/**
 * Converts a loadout event to the Coriolis ship JSON format.
 * @param {object} body Loadout event
 * @return {object} Coriolis build
 * @throws {Error} When the loadout is invalid (error has no `status` for
 *   HTTP; use {@link validateLoadout} beforehand to get a 400 instead of 500)
 */
export function convertLoadout(body) {
  applyDefaults(body.Modules);
  const ship = shipFromLoadoutJSON(body);
  ship.updateStats();
  return toDetailedBuild(
    typeof body.ShipName === 'string' ? body.ShipName : '',
    ship
  );
}
