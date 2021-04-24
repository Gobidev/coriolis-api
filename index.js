const Dist = require('./ships');
const LZString = require('lz-string');
const Lodash = require('lodash');
const zlib = require('zlib');
const express = require("express");
const bodyParser = require("body-parser");
const jsonParser = bodyParser.json();
const app = express();
const winston = require('winston');
const expressWinston = require('express-winston');

// mapping from fd's ship model names to coriolis'
const SHIP_FD_NAME_TO_CORIOLIS_NAME = {
    'Adder': 'adder',
    'Anaconda': 'anaconda',
    'Asp': 'asp',
    'Asp_Scout': 'asp_scout',
    'BelugaLiner': 'beluga',
    'CobraMkIII': 'cobra_mk_iii',
    'CobraMkIV': 'cobra_mk_iv',
    'Cutter': 'imperial_cutter',
    'DiamondBackXL': 'diamondback_explorer',
    'DiamondBack': 'diamondback',
    'Dolphin': 'dolphin',
    'Eagle': 'eagle',
    'Empire_Courier': 'imperial_courier',
    'Empire_Eagle': 'imperial_eagle',
    'Empire_Trader': 'imperial_clipper',
    'Federation_Corvette': 'federal_corvette',
    'Federation_Dropship': 'federal_dropship',
    'Federation_Dropship_MkII': 'federal_assault_ship',
    'Federation_Gunship': 'federal_gunship',
    'FerDeLance': 'fer_de_lance',
    'Hauler': 'hauler',
    'Independant_Trader': 'keelback',
    'Krait_MkII': 'krait_mkii',
    'Mamba': 'mamba',
    'Krait_Light': 'krait_phantom',
    'Orca': 'orca',
    'Python': 'python',
    'SideWinder': 'sidewinder',
    'Type6': 'type_6_transporter',
    'Type7': 'type_7_transport',
    'Type9': 'type_9_heavy',
    'Type9_Military': 'type_10_defender',
    'TypeX': 'alliance_chieftain',
    'TypeX_2': 'alliance_crusader',
    'TypeX_3': 'alliance_challenger',
    'Viper': 'viper',
    'Viper_MkIV': 'viper_mk_iv',
    'Vulture': 'vulture'
  };

  // Mapping from hardpoint class to name in companion API
const HARDPOINT_NUM_TO_CLASS = {
    0: 'Tiny',
    1: 'Small',
    2: 'Medium',
    3: 'Large',
    4: 'Huge'
  };
  
const UNIQUE_MODULES = ['psg', 'sg', 'bsg', 'rf', 'fs', 'fh', 'gfsb', 'dc'];

// Constants for modifications struct
const SLOT_ID_DONE = -1;
const MODIFICATION_ID_DONE = -1;
const MODIFICATION_ID_BLUEPRINT = -2;
const MODIFICATION_ID_GRADE = -3;
const MODIFICATION_ID_SPECIAL = -4;


/**
 * Generates ship-loadout JSON Schema standard object
 * @param  {Object} standard model
 * @return {Object} JSON Schema
 */
 function standardToSchema(standard) {
    if (standard.m) {
      let o = {
        class: standard.m.class,
        rating: standard.m.rating,
        enabled: Boolean(standard.enabled),
        priority: standard.priority + 1
      };
  
      if (standard.m.name) {
        o.name = standard.m.name;
      }
  
      if (standard.m.mods && Object.keys(standard.m.mods).length > 0) {
        o.modifications = standard.m.mods;
      }
  
      if (standard.m.blueprint && Object.keys(standard.m.blueprint).length > 0) {
        o.blueprint = standard.m.blueprint;
      }
  
      return o;
    }
    return null;
  }
  
  /**
   * Generates ship-loadout JSON Schema slot object
   * @param  {Object} slot Slot model
   * @return {Object}      JSON Schema Slot
   */
  function slotToSchema(slot) {
    if (slot.m) {
      let o = {
        class: slot.m.class,
        rating: slot.m.rating,
        enabled: Boolean(slot.enabled),
        priority: slot.priority + 1,
        group: ModuleGroupToName[slot.m.grp]
      };
  
      if (slot.m.name) {
        o.name = slot.m.name;
      }
      if (slot.m.mount) {
        o.mount = MountMap[slot.m.mount];
      }
      if (slot.m.missile) {
        o.missile = slot.m.missile;
      }
      if (slot.m.mods && Object.keys(slot.m.mods).length > 0) {
        o.modifications = slot.m.mods;
      }
      if (slot.m.blueprint && Object.keys(slot.m.blueprint).length > 0) {
        o.blueprint = slot.m.blueprint;
      }
  
      return o;
    }
    return null;
  }
  
  /**
 * Generates a URL for the outiffing page
 * @param  {String} shipId    Ship Id
 * @param  {String} code      [optional] Serliazed build code
 * @param  {String} buildName [optional] Build name
 * @return {String}           URL
 */
function outfitURL(shipId, code, buildName) {
  let path = '/outfit/' + shipId;

  let sepChar = '?';

  if (code) {
    path = path + sepChar + 'code=' + encodeURIComponent(code);
    sepChar = '&';
  }

  if (buildName) {
    path = path + sepChar + 'bn=' + encodeURIComponent(buildName);
  }

  return path;
}


  /**
   * Generates an object conforming to the ship-loadout JSON schema from a Ship model
   * @param  {string} buildName The build name
   * @param  {Ship} ship        Ship instance
   * @return {Object}           ship-loadout object
   */
  function toDetailedBuild(buildName, ship) {
    let standard = ship.standard,
        hardpoints = ship.hardpoints,
        internal = ship.internal,
        code = ship.toString();
  
    let data = {
      $schema: 'https://coriolis.io/schemas/ship-loadout/4.json#',
      name: buildName,
      ship: ship.name,
      references: [{
        name: 'Coriolis.io',
        url: 'https://coriolis.io' + outfitURL(ship.id, code, buildName),
        code,
        shipId: ship.id
      }],
      components: {
        standard: {
          bulkheads: BulkheadNames[ship.bulkheads.m.index],
          cargoHatch: { enabled: Boolean(ship.cargoHatch.enabled), priority: ship.cargoHatch.priority + 1 },
          powerPlant: standardToSchema(standard[0]),
          thrusters: standardToSchema(standard[1]),
          frameShiftDrive: standardToSchema(standard[2]),
          lifeSupport: standardToSchema(standard[3]),
          powerDistributor: standardToSchema(standard[4]),
          sensors: standardToSchema(standard[5]),
          fuelTank: standardToSchema(standard[6])
        },
        hardpoints: hardpoints.filter(slot => slot.maxClass > 0).map(slotToSchema),
        utility: hardpoints.filter(slot => slot.maxClass === 0).map(slotToSchema),
        internal: internal.map(slotToSchema)
      },
      stats: {}
    };
  
    for (let stat in ship) {
      if (!isNaN(ship[stat])) {
        data.stats[stat] = Math.round(ship[stat] * 100) / 100;
      }
    }
  
    return data;
  };
  
  /**
   * Instantiates a ship from a ship-loadout  object
   * @param  {Object} detailedBuild ship-loadout object
   * @return {Ship} Ship instance
   */
  function fromDetailedBuild(detailedBuild) {
    let shipId = Object.keys(Ships).find((shipId) => Ships[shipId].properties.name.toLowerCase() == detailedBuild.ship.toLowerCase());
    if (!shipId) {
      throw 'No such ship: ' + detailedBuild.ship;
    }
  
    let shipData = Ships[shipId];
    let ship = new Ship(shipId, shipData.properties, shipData.slots);
  
    if (!detailedBuild.references[0] || !detailedBuild.references[0].code) {
      throw 'Missing reference code';
    }
  
    ship.buildFrom(detailedBuild.references[0].code);
  
    return ship;
  }
  
  function getBlueprint(name, module) {
    // Start with a copy of the blueprint
    const findMod = val => Object.keys(Dist.Modifications.blueprints).find(elem => elem.toString().toLowerCase().search(val.toString().toLowerCase().replace(/(OutfittingFieldType_|persecond)/igm, '')) >= 0);
    const found = Dist.Modifications.blueprints[findMod(name)];
    if (!found || !found.fdname) {
      return {};
    }
    const blueprint = JSON.parse(JSON.stringify(found));
    return blueprint;
  }

  /**
   * Generates an array of ship-loadout JSON Schema object for export
   * @param  {Array} builds   Array of ship builds
   * @return {Array}         Array of of ship-loadout objects
   */
  function toDetailedExport(builds) {
    let data = [];
  
    for (let shipId in builds) {
      for (let buildName in builds[shipId]) {
        let code = builds[shipId][buildName];
        let shipData = Ships[shipId];
        let ship = new Ship(shipId, shipData.properties, shipData.slots);
        ship.buildFrom(code);
        data.push(toDetailedBuild(buildName, ship, code));
      }
    }
    return data;
  };
  
  /**
   * Serializes a comparion and all of the ships to zipped
   * Base 64 encoded JSON.
   * @param  {string} name        Comparison name
   * @param  {array} builds       Array of ship builds
   * @param  {array} facets       Selected facets
   * @param  {string} predicate   sort predicate
   * @param  {boolean} desc       sort order
   * @return {string}             Zipped Base 64 encoded JSON
   */
  function fromComparison(name, builds, facets, predicate, desc) {
    return LZString.compressToBase64(JSON.stringify({
      n: name,
      b: builds.map((b) => { return { s: b.id, n: b.buildName, c: b.toString() }; }),
      f: facets,
      p: predicate,
      d: desc ? 1 : 0
    }));
  };
  
  /**
   * Parses the comarison data string back to an object.
   * @param  {string} code Zipped Base 64 encoded JSON comparison data
   * @return {Object} Comparison data object
   */
  function toComparison(code) {
    return JSON.parse(LZString.decompressFromBase64(Utils.fromUrlSafe(code)));
  };
  

  
  /**
   * Obtain a module given its ED ID
   * @param {Integer} edId the Elite ID of the module
   * @return {Module} the module
   */
  function _moduleFromEdId(edId) {
    if (!edId) return null;
  
    // Check standard modules
    for (const grp in Modules.standard) {
      if (Modules.standard.hasOwnProperty(grp)) {
        for (const i in Modules.standard[grp]) {
          if (Modules.standard[grp][i].edID === edId) {
            // Found it
            return new Module({ template: Modules.standard[grp][i] });
          }
        }
      }
    }
  
    // Check hardpoint modules
    for (const grp in Modules.hardpoints) {
      if (Modules.hardpoints.hasOwnProperty(grp)) {
        for (const i in Modules.hardpoints[grp]) {
          if (Modules.hardpoints[grp][i].edID === edId) {
            // Found it
            return new Module({ template: Modules.hardpoints[grp][i] });
          }
        }
      }
    }
  
    // Check internal modules
    for (const grp in Modules.internal) {
      if (Modules.internal.hasOwnProperty(grp)) {
        for (const i in Modules.internal[grp]) {
          if (Modules.internal[grp][i].edID === edId) {
            // Found it
            return new Module({ template: Modules.internal[grp][i] });
          }
        }
      }
    }
  
    // Not found
    return null;
  }
  
  /**
   * Obtain the model of a ship given its ED name
   * @param {string} edName the Elite name of the ship
   * @return {string} the Coriolis model of the ship
   */
  function _shipModelFromEDName(edName) {
    return SHIP_FD_NAME_TO_CORIOLIS_NAME[Object.keys(SHIP_FD_NAME_TO_CORIOLIS_NAME).find(elem => elem.toLowerCase() === edName.toLowerCase())];
  }
  
  /**
   * Obtain a ship's model from the companion API JSON
   * @param {object} json the companion API JSON
   * @return {string} the Coriolis model of the ship
   */
  function shipModelFromJson(json) {
    return _shipModelFromEDName(json.name || json.Ship);
  }
  
  /**
   * Build a ship from the companion API JSON
   * @param {object} json the companion API JSON
   * @return {Ship} the built ship
   */
  function shipFromJson(json) {
    // Start off building a basic ship
    const shipModel = shipModelFromJson(json);
    if (!shipModel) {
      throw 'No such ship found: "' + json.name + '"';
    }
    const shipTemplate = Ships[shipModel];
  
    let ship = new Ship(shipModel, shipTemplate.properties, shipTemplate.slots);
    ship.buildWith(null);
  
    // Set the cargo hatch
    if (json.modules.CargoHatch) {
      ship.cargoHatch.enabled = json.modules.CargoHatch.module.on == true;
      ship.cargoHatch.priority = json.modules.CargoHatch.module.priority;
    } else {
      // We don't have any information on it so guess it's priority 5 and disabled
      ship.cargoHatch.enabled = false;
      ship.cargoHatch.priority = 4;
    }
  
    let rootModule;
  
    // Add the bulkheads
    const armourJson = json.modules.Armour.module;
    if (armourJson.name.toLowerCase().endsWith('_armour_grade1')) {
      ship.useBulkhead(0, true);
    } else if (armourJson.name.toLowerCase().endsWith('_armour_grade2')) {
      ship.useBulkhead(1, true);
    } else if (armourJson.name.toLowerCase().endsWith('_armour_grade3')) {
      ship.useBulkhead(2, true);
    } else if (armourJson.name.toLowerCase().endsWith('_armour_mirrored')) {
      ship.useBulkhead(3, true);
    } else if (armourJson.name.toLowerCase().endsWith('_armour_reactive')) {
      ship.useBulkhead(4, true);
    } else {
      throw 'Unknown bulkheads "' + armourJson.name + '"';
    }
    ship.bulkheads.enabled = true;
    rootModule = json.modules.Armour;
    if (rootModule.WorkInProgress_modifications) _addModifications(ship.bulkheads.m, rootModule.WorkInProgress_modifications, rootModule.engineer.recipeName, rootModule.engineer.recipeLevel);
  
    // Add the standard modules
    // Power plant
    const powerplantJson = json.modules.PowerPlant.module;
    const powerplant = _moduleFromEdId(powerplantJson.id);
    rootModule = json.modules.PowerPlant;
    if (rootModule.WorkInProgress_modifications) _addModifications(powerplant, rootModule.WorkInProgress_modifications, rootModule.engineer.recipeName, rootModule.engineer.recipeLevel);
    ship.use(ship.standard[0], powerplant, true);
    ship.standard[0].enabled = powerplantJson.on === true;
    ship.standard[0].priority = powerplantJson.priority;
  
    // Thrusters
    const thrustersJson = json.modules.MainEngines.module;
    const thrusters = _moduleFromEdId(thrustersJson.id);
    rootModule = json.modules.MainEngines;
    if (rootModule.WorkInProgress_modifications) _addModifications(thrusters, rootModule.WorkInProgress_modifications, rootModule.engineer.recipeName, rootModule.engineer.recipeLevel);
    ship.use(ship.standard[1], thrusters, true);
    ship.standard[1].enabled = thrustersJson.on === true;
    ship.standard[1].priority = thrustersJson.priority;
  
    // FSD
    const frameshiftdriveJson = json.modules.FrameShiftDrive.module;
    const frameshiftdrive = _moduleFromEdId(frameshiftdriveJson.id);
    rootModule = json.modules.FrameShiftDrive;
    if (rootModule.WorkInProgress_modifications) _addModifications(frameshiftdrive, rootModule.WorkInProgress_modifications, rootModule.engineer.recipeName, rootModule.engineer.recipeLevel);
    ship.use(ship.standard[2], frameshiftdrive, true);
    ship.standard[2].enabled = frameshiftdriveJson.on === true;
    ship.standard[2].priority = frameshiftdriveJson.priority;
  
    // Life support
    const lifesupportJson = json.modules.LifeSupport.module;
    const lifesupport = _moduleFromEdId(lifesupportJson.id);
    rootModule = json.modules.LifeSupport;
    if (rootModule.WorkInProgress_modifications) _addModifications(lifesupport, rootModule.WorkInProgress_modifications, rootModule.engineer.recipeName, rootModule.engineer.recipeLevel);
    ship.use(ship.standard[3], lifesupport, true);
    ship.standard[3].enabled = lifesupportJson.on === true;
    ship.standard[3].priority = lifesupportJson.priority;
  
    // Power distributor
    const powerdistributorJson = json.modules.PowerDistributor.module;
    const powerdistributor = _moduleFromEdId(powerdistributorJson.id);
    rootModule = json.modules.PowerDistributor;
    if (rootModule.WorkInProgress_modifications) _addModifications(powerdistributor, rootModule.WorkInProgress_modifications, rootModule.engineer.recipeName, rootModule.engineer.recipeLevel);
    ship.use(ship.standard[4], powerdistributor, true);
    ship.standard[4].enabled = powerdistributorJson.on === true;
    ship.standard[4].priority = powerdistributorJson.priority;
  
    // Sensors
    const sensorsJson = json.modules.Radar.module;
    const sensors = _moduleFromEdId(sensorsJson.id);
    rootModule = json.modules.Radar;
    if (rootModule.WorkInProgress_modifications) _addModifications(sensors, rootModule.WorkInProgress_modifications, rootModule.engineer.recipeName, rootModule.engineer.recipeLevel);
    ship.use(ship.standard[5], sensors, true);
    ship.standard[5].enabled = sensorsJson.on === true;
    ship.standard[5].priority = sensorsJson.priority;
  
    // Fuel tank
    const fueltankJson = json.modules.FuelTank.module;
    const fueltank = _moduleFromEdId(fueltankJson.id);
    ship.use(ship.standard[6], fueltank, true);
    ship.standard[6].enabled = true;
    ship.standard[6].priority = 0;
  
    // Add hardpoints
    let hardpointClassNum = -1;
    let hardpointSlotNum = -1;
    let hardpointArrayNum = 0;
    for (let i in shipTemplate.slots.hardpoints) {
      if (shipTemplate.slots.hardpoints[i] === hardpointClassNum) {
        // Another slot of the same class
        hardpointSlotNum++;
      } else {
        // The first slot of a new class
        hardpointClassNum = shipTemplate.slots.hardpoints[i];
        hardpointSlotNum = 1;
      }
  
      // Now that we know what we're looking for, find it
      const hardpointName = HARDPOINT_NUM_TO_CLASS[hardpointClassNum] + 'Hardpoint' + hardpointSlotNum;
      const hardpointSlot = json.modules[hardpointName];
      if (!hardpointSlot) {
        // This can happen with old imports that don't contain new hardpoints
      } else if (!hardpointSlot.module) {
        // No module
      } else {
        const hardpointJson = hardpointSlot.module;
        const hardpoint = _moduleFromEdId(hardpointJson.id);
        rootModule = hardpointSlot;
        if (rootModule.WorkInProgress_modifications) _addModifications(hardpoint, rootModule.WorkInProgress_modifications, rootModule.engineer.recipeName, rootModule.engineer.recipeLevel, rootModule.specialModifications);
        ship.use(ship.hardpoints[hardpointArrayNum], hardpoint, true);
        ship.hardpoints[hardpointArrayNum].enabled = hardpointJson.on === true;
        ship.hardpoints[hardpointArrayNum].priority = hardpointJson.priority;
      }
      hardpointArrayNum++;
    }
  
    // Add internal compartments
    let internalSlotNum = 1;
    let militarySlotNum = 1;
    for (let i in shipTemplate.slots.internal) {
      const isMilitary = isNaN(shipTemplate.slots.internal[i]) ? shipTemplate.slots.internal[i].name == 'Military' : false;
  
      // The internal slot might be a standard or a military slot.  Military slots have a different naming system
      let internalSlot = null;
      if (isMilitary) {
        const internalName = 'Military0' + militarySlotNum;
        internalSlot = json.modules[internalName];
        militarySlotNum++;
      } else {
        // Slot numbers are not contiguous so handle skips.
        while (internalSlot === null && internalSlotNum < 99) {
          // Slot sizes have no relationship to the actual size, either, so check all possibilities
          for (let slotsize = 0; slotsize < 9; slotsize++) {
            const internalName = 'Slot' + (internalSlotNum <= 9 ? '0' : '') + internalSlotNum + '_Size' + slotsize;
            if (json.modules[internalName]) {
              internalSlot = json.modules[internalName];
              break;
            }
          }
          internalSlotNum++;
        }
      }
  
      if (!internalSlot) {
        // This can happen with old imports that don't contain new slots
      } else if (!internalSlot.module) {
        // No module
      } else {
        const internalJson = internalSlot.module;
        const internal = _moduleFromEdId(internalJson.id);
        rootModule = internalSlot;
        if (rootModule.WorkInProgress_modifications) _addModifications(internal, rootModule.WorkInProgress_modifications, rootModule.engineer.recipeName, rootModule.engineer.recipeLevel);
        ship.use(ship.internal[i], internal, true);
        ship.internal[i].enabled = internalJson.on === true;
        ship.internal[i].priority = internalJson.priority;
      }
    }
  
    // Now update the ship's codes before returning it
    return ship.updatePowerPrioritesString().updatePowerEnabledString().updateModificationsString();
  }
  
  /**
   * Add the modifications for a module
   * @param {Module} module the module
   * @param {Object} modifiers the modifiers
   * @param {Object} blueprint the blueprint of the modification
   * @param {Object} grade the grade of the modification
   * @param {Object} specialModifications special modification
   */
  function _addModifications(module, modifiers, blueprint, grade, specialModifications) {
    if (!modifiers) return;
    let special;
    if (specialModifications) {
      special = Modifications.specials[Object.keys(specialModifications)[0]];
    }
    for (const i in modifiers) {
      // Some special modifications
      if (modifiers[i].name === 'mod_weapon_clip_size_override') {
        // This is a numeric addition to the clip size, but we need to work it out in terms of being a percentage so
        // that it works the same as other modifications
        const origClip = module.clip || 1;
        module.setModValue('clip', ((modifiers[i].value  - origClip) / origClip) * 10000);
      } else if (modifiers[i].name === 'mod_weapon_burst_size') {
        // This is an absolute number that acts as an override
        module.setModValue('burst', modifiers[i].value * 100);
      } else if (modifiers[i].name === 'mod_weapon_burst_rof') {
        // This is an absolute number that acts as an override
        module.setModValue('burstrof', modifiers[i].value * 100);
      } else if (modifiers[i].name === 'mod_weapon_falloffrange_from_range') {
        // Obtain the falloff value directly from the range
        module.setModValue('fallofffromrange', 1);
      } else if (modifiers[i].name && modifiers[i].name.startsWith('special_')) {
        // We don't add special effects directly, but keep a note of them so they can be added when fetching values
        special = Modifications.specials[modifiers[i].name];
      } else {
        // Look up the modifiers to find what we need to do
        const modifierActions = Modifications.modifierActions[i];
        let value;
        if (i === 'OutfittingFieldType_DefenceModifierShieldMultiplier') {
          value = modifiers[i].value - 1;
        } else if (i === 'OutfittingFieldType_DefenceModifierHealthMultiplier' && blueprint.startsWith('Armour_')) {
          value = (modifiers[i].value - module.hullboost) / module.hullboost;
        } else if (i === 'OutfittingFieldType_DefenceModifierHealthMultiplier') {
          value = modifiers[i].value / module.hullboost;
        } else if (i === 'OutfittingFieldType_RateOfFire') {
          value = (1 / Math.abs(modifiers[i].value));
        } else {
          value = modifiers[i].value - 1;
        }
        // Carry out the required changes
        for (const action in modifierActions) {
          if (isNaN(modifierActions[action])) {
            module.setModValue(action, modifierActions[action]);
          } else {
            const actionValue = modifierActions[action] * value;
            let mod = module.getModValue(action) / 10000;
            if (!mod) {
              mod = 0;
            }
            module.setModValue(action, ((1 + mod) * (1 + actionValue) - 1) * 10000);
          }
        }
      }
    }
  
    // Add the blueprint definition, grade and special
    if (blueprint) {
      module.blueprint = getBlueprint(blueprint, module);
      if (grade) {
        module.blueprint.grade = Number(grade);
      }
      if (special) {
        module.blueprint.special = special;
      }
    }
  
    // Need to fix up a few items
  
    // Shield boosters are treated internally as straight modifiers, so rather than (for example)
    // being a 4% boost they are a 104% multiplier.  Unfortunately this means that our % modification
    // is incorrect so we fix it
    if (module.grp === 'sb' && module.getModValue('shieldboost')) {
      const alteredBoost = (1 + module.shieldboost) * (module.getModValue('shieldboost') / 10000);
      module.setModValue('shieldboost', alteredBoost * 10000 / module.shieldboost);
    }
  
    // Shield booster resistance is actually a damage modifier, so needs to be inverted.
    if (module.grp === 'sb') {
      if (module.getModValue('explres')) {
        module.setModValue('explres', ((module.getModValue('explres') / 10000) * -1) * 10000);
      }
      if (module.getModValue('kinres')) {
        module.setModValue('kinres', ((module.getModValue('kinres') / 10000) * -1) * 10000);
      }
      if (module.getModValue('thermres')) {
        module.setModValue('thermres', ((module.getModValue('thermres') / 10000) * -1) * 10000);
      }
    }
  
    // Shield generator resistance is actually a damage modifier, so needs to be inverted.
    // In addition, the modification is based off the inherent resistance of the module
    if (ModuleUtils.isShieldGenerator(module.grp)) {
      if (module.getModValue('explres')) {
        module.setModValue('explres', ((1 - (1 - module.explres) * (1 + module.getModValue('explres') / 10000)) - module.explres) * 10000);
      }
      if (module.getModValue('kinres')) {
        module.setModValue('kinres', ((1 - (1 - module.kinres) * (1 + module.getModValue('kinres') / 10000)) - module.kinres) * 10000);
      }
      if (module.getModValue('thermres')) {
        module.setModValue('thermres', ((1 - (1 - module.thermres) * (1 + module.getModValue('thermres') / 10000)) - module.thermres) * 10000);
      }
    }
  
    // Hull reinforcement package resistance is actually a damage modifier, so needs to be inverted.
    // In addition, the modification is based off the inherent resistance of the module
    if (module.grp === 'hr') {
      if (module.getModValue('explres')) {
        module.setModValue('explres', ((1 - (1 - module.explres) * (1 + module.getModValue('explres') / 10000)) - module.explres) * 10000);
      }
      if (module.getModValue('kinres')) {
        module.setModValue('kinres', ((1 - (1 - module.kinres) * (1 + module.getModValue('kinres') / 10000)) - module.kinres) * 10000);
      }
      if (module.getModValue('thermres')) {
        module.setModValue('thermres', ((1 - (1 - module.thermres) * (1 + module.getModValue('thermres') / 10000)) - module.thermres) * 10000);
      }
    }
  
    // Bulkhead resistance is actually a damage modifier, so needs to be inverted.
    // In addition, the modification is based off the inherent resistance of the module
    if (module.grp == 'bh') {
      if (module.getModValue('explres')) {
        module.setModValue('explres', ((1 - (1 - module.explres) * (1 + module.getModValue('explres') / 10000)) - module.explres) * 10000);
      }
      if (module.getModValue('kinres')) {
        module.setModValue('kinres', ((1 - (1 - module.kinres) * (1 + module.getModValue('kinres') / 10000)) - module.kinres) * 10000);
      }
      if (module.getModValue('thermres')) {
        module.setModValue('thermres', ((1 - (1 - module.thermres) * (1 + module.getModValue('thermres') / 10000)) - module.thermres) * 10000);
      }
    }
  
    // Bulkhead boost is based off the inherent boost of the module
    if (module.grp == 'bh') {
      const alteredBoost = (1 + module.hullboost) * (1 + module.getModValue('hullboost') / 10000) - 1;
      module.setModValue('hullboost', (alteredBoost / module.hullboost - 1) * 1000);
    }
  
    // Jitter is an absolute number, so we need to divide it by 100
    if (module.getModValue('jitter')) {
      module.setModValue('jitter', module.getModValue('jitter') / 100);
    }
  
    // Clip size is rounded up so that the result is a whole number
    if (module.getModValue('clip')) {
      const individual = 1 / (module.clip || 1);
      module.setModValue('clip', Math.ceil((module.getModValue('clip') / 10000) / individual) * individual * 10000);
    }
  }


  const SizeMap = ['', 'small', 'medium', 'large', 'capital'];

  const StandardArray = [
    'pp', // Power Plant
    't',  // Thrusters
    'fsd', // Frame Shift Drive
    'ls', // Life Support
    'pd', // Power Distributor
    's',  // Sensors
    'ft', // Fuel Tank
    'gpp', // Guardian Hybrid Power Plant
    'gpd' // Guardian Hybrid Power Distributor
  ];
  
  // Map to lookup group labels/names for component grp, used for JSON Serialization
  const ModuleGroupToName = {
    // Standard
    pp: 'Power Plant',
    gpp: 'Guardian Hybrid Power Plant',
    gpd: 'Guardian Power Distributor',
    t: 'Thrusters',
    fsd: 'Frame Shift Drive',
    ls: 'Life Support',
    pd: 'Power Distributor',
    s: 'Sensors',
    ft: 'Fuel Tank',
    pas: 'Planetary Approach Suite',
  
    // Internal
    fs: 'Fuel Scoop',
    sc: 'Scanner',
    am: 'Auto Field-Maintenance Unit',
    bsg: 'Bi-Weave Shield Generator',
    cr: 'Cargo Rack',
    fh: 'Fighter Hangar',
    fi: 'Frame Shift Drive Interdictor',
    hb: 'Hatch Breaker Limpet Controller',
    hr: 'Hull Reinforcement Package',
    mrp: 'Module Reinforcement Package',
    rf: 'Refinery',
    scb: 'Shield Cell Bank',
    sg: 'Shield Generator',
    pv: 'Planetary Vehicle Hangar',
    psg: 'Prismatic Shield Generator',
    dc: 'Docking Computer',
    fx: 'Fuel Transfer Limpet Controller',
    pc: 'Prospector Limpet Controller',
    pce: 'Economy Class Passenger Cabin',
    pci: 'Business Class Passenger Cabin',
    pcm: 'First Class Passenger Cabin',
    pcq: 'Luxury Passenger Cabin',
    cc: 'Collector Limpet Controller',
    ss: 'Surface Scanner',
    gsrp: 'Guardian Shield Reinforcement Packages',
    gfsb: 'Guardian Frame Shift Drive Booster',
    ghrp: 'Guardian Hull Reinforcement Package',
    gmrp: 'Guardian Module Reinforcement Package',
    mahr: 'Meta Alloy Hull Reinforcement Package',
    sua: 'Supercruise Assist',
  
    // Hard Points
    bl: 'Beam Laser',
    ul: 'Burst Laser',
    c: 'Cannon',
    ch: 'Chaff Launcher',
    cs: 'Cargo Scanner',
    cm: 'Countermeasure',
    ec: 'Electronic Countermeasure',
    fc: 'Fragment Cannon',
    rfl: 'Remote Release Flak Launcher',
    hs: 'Heat Sink Launcher',
    ws: 'Frame Shift Wake Scanner',
    kw: 'Kill Warrant Scanner',
    nl: 'Mine Launcher',
    ml: 'Mining Laser',
    mr: 'Missile Rack',
    axmr: 'AX Missile Rack',
    pa: 'Plasma Accelerator',
    po: 'Point Defence',
    mc: 'Multi-cannon',
    axmc: 'AX Multi-cannon',
    pl: 'Pulse Laser',
    rg: 'Rail Gun',
    sb: 'Shield Booster',
    tp: 'Torpedo Pylon',
    sfn: 'Shutdown Field Neutraliser',
    xs: 'Xeno Scanner',
    rcpl: 'Recon Limpet Controller',
    rsl: 'Research Limpet Controller',
    dtl: 'Decontamination Limpet Controller',
    gpc: 'Guardian Plasma Charger',
    ggc: 'Guardian Gauss Cannon',
    tbsc: 'Shock Cannon',
    gsc: 'Guardian Shard Cannon',
    tbem: 'Enzyme Missile Rack',
    tbrfl: 'Remote Release Flechette Launcher',
    pwa: 'Pulse Wave Analyser',
    abl: 'Abrasion Blaster',
    scl: 'Seismic Charge Launcher',
    sdm: 'Sub-Surface Displacement Missile',
  };
  
  let GrpNameToCodeMap = {};
  
  for (let grp in ModuleGroupToName) {
    GrpNameToCodeMap[ModuleGroupToName[grp].toLowerCase()] = grp;
  }
  
  const ModuleNameToGroup = GrpNameToCodeMap;
  
  const MountMap = {
    'F': 'Fixed',
    'G': 'Gimballed',
    'T': 'Turret',
    'Fixed': 'F',
    'Gimballed': 'G',
    'Turret': 'T'
  };
  
  const BulkheadNames = [
    'Lightweight Alloy',
    'Reinforced Alloy',
    'Military Grade Composite',
    'Mirrored Surface Composite',
    'Reactive Surface Composite'
  ];
  
  /**
   * Array of all Ship properties (facets) organized into groups
   * used for ship comparisons.
   *
   * @type {Array}
   */
  const ShipFacets = [
    {                   // 0
      title: 'agility',
      props: ['topPitch', 'topRoll', 'topYaw'],
      lbls: ['pitch', 'roll', 'yaw'],
      fmt: 'f1',
      i: 0
    },
    {                   // 1
      title: 'speed',
      props: ['topSpeed', 'topBoost'],
      lbls: ['thrusters', 'boost'],
      unit: 'm/s',
      fmt: 'int',
      i: 1
    },
    {                   // 2
      title: 'armour',
      props: ['armour'],
      fmt: 'int',
      i: 2
    },
    {                   // 3
      title: 'shields',
      props: ['shield'],
      unit: 'MJ',
      fmt: 'int',
      i: 3
    },
    {                   // 4
      title: 'jump range',
      props: ['unladenRange', 'fullTankRange', 'ladenRange'],
      lbls: ['max', 'full tank', 'laden'],
      unit: 'LY',
      fmt: 'round',
      i: 4
    },
    {                   // 5
      title: 'mass',
      props: ['unladenMass', 'ladenMass'],
      lbls: ['unladen', 'laden'],
      unit: 'T',
      fmt: 'round',
      i: 5
    },
    {                   // 6
      title: 'cargo',
      props: ['cargoCapacity'],
      unit: 'T',
      fmt: 'int',
      i: 6
    },
    {                   // 7
      title: 'fuel',
      props: ['fuelCapacity'],
      unit: 'T',
      fmt: 'int',
      i: 7
    },
    {                   // 8
      title: 'power',
      props: ['powerRetracted', 'powerDeployed', 'powerAvailable'],
      lbls: ['retracted', 'deployed', 'available'],
      unit: 'MW',
      fmt: 'f2',
      i: 8
    },
    {                   // 9
      title: 'cost',
      props: ['totalCost'],
      unit: 'CR',
      fmt: 'int',
      i: 9
    },
    {                   // 10
      title: 'farthest range',
      props: ['unladenFastestRange', 'ladenFastestRange'],
      lbls: ['unladen', 'laden'],
      unit: 'LY',
      fmt: 'round',
      i: 10
    },
    {                   // 11
      title: 'DPS',
      props: ['totalDps', 'totalExplDps', 'totalKinDps', 'totalThermDps'],
      lbls: ['total', 'explosive', 'kinetic', 'thermal'],
      fmt: 'round',
      i: 11
    },
    {                   // 14
      title: 'Sustained DPS',
      props: ['totalSDps', 'totalExplSDps', 'totalKinSDps', 'totalThermSDps'],
      lbls: ['total', 'explosive', 'kinetic', 'thermal'],
      fmt: 'round',
      i: 14
    },
    {                   // 12
      title: 'EPS',
      props: ['totalEps'],
      lbls: ['EPS'],
      fmt: 'round',
      i: 12
    },
    {                   // 13
      title: 'HPS',
      props: ['totalHps'],
      lbls: ['HPS'],
      fmt: 'round',
      i: 13
    }
  ];
  
  /**
   * Set of all insurance levels
   */
  const Insurance = {
    'standard': 0.05,
    'alpha': 0.025,
    'beta': 0.0375
  };
  
  /**
   * Set of all available / theoretical discounts
   */
  const Discounts = {
    '0%': 1,
    '2.5%': 0.975,
    '5%': 0.95,
    '10%': 0.90,
    '12.5%': 0.875,
    '15%': 0.85,
    '20%': 0.80,
    '25%': 0.75
  };
  
/**
 * Modification - a modification and its value
 */
 class Modification {
    /**
     * @param {String} id         Unique modification ID
     * @param {Number} value      Value of the modification
     */
    constructor(id, value) {
      this.id = id;
      this.value = value;
    }
  }

/**
 * Filter eligble modules based on parameters
 * @param  {Array}  arr       Available modules array
 * @param  {number} maxClass  Max class
 * @param  {number} minClass  Minimum class
 * @param  {number} mass      Mass
 * @return {Array}            Fitlered module subset
 */
 function filter(arr, maxClass, minClass, mass) {
    return arr.filter(m => m.class <= maxClass && m.class >= minClass && (m.maxmass === undefined || mass <= m.maxmass));
  }
  
  /**
   * The available module set for a specific ship
   */
  class ModuleSet {
    /**
     * Instantiate the module set
     * @param  {Object} modules        All Modules
     * @param  {Object} shipData       Ship Specifications Data (see coriolis-data/Ships)
     */
    constructor(modules, shipData) {
      let maxInternal = isNaN(shipData.slots.internal[0]) ? shipData.slots.internal[0].class : shipData.slots.internal[0];
      let mass = shipData.properties.hullMass + 6.5;
      let maxStandardArr = shipData.slots.standard;
      let maxHardPoint = shipData.slots.hardpoints[0];
      let stnd = modules.standard;
      this.mass = mass;
      this.standard = {};
      this.internal = {};
      this.hardpoints = {};
      this.hpClass = {};
      this.intClass = {};
  
      this.bulkheads = shipData.bulkheads.map((b, i) => {
        return Object.assign(new Module(), { grp: 'bh', id: i, name: BulkheadNames[i], index: i, class: '', rating: '' }, b);
      });
  
      this.standard[0] = filter(stnd.pp, maxStandardArr[0], 0, mass);  // Power Plant
      this.standard[2] = filter(stnd.fsd, maxStandardArr[2], 0, mass);  // FSD
      this.standard[4] = filter(stnd.pd, maxStandardArr[4], 0, mass);  // Power Distributor
      this.standard[6] = filter(stnd.ft, maxStandardArr[6], 0, mass);  // Fuel Tank
      // Thrusters, filter modules by class only (to show full list of ratings for that class)
      let minThrusterClass = stnd.t.reduce((clazz, th) => (th.maxmass >= mass && th.class < clazz) ? th.class : clazz, maxStandardArr[1]);
      this.standard[1] = filter(stnd.t, maxStandardArr[1], minThrusterClass, 0);  // Thrusters
      // Slots where module class must be equal to slot class
      this.standard[3] = filter(stnd.ls, maxStandardArr[3], maxStandardArr[3], 0);     // Life Supprt
      this.standard[5] = filter(stnd.s, maxStandardArr[5], maxStandardArr[5], mass);  // Sensors
  
      for (let h in modules.hardpoints) {
        this.hardpoints[h] = filter(modules.hardpoints[h], maxHardPoint, 0, mass);
      }
  
      for (let g in modules.internal) {
        this.internal[g] = filter(modules.internal[g], maxInternal, 0, mass);
      }
    }
  
    /**
     * Get the specified bulkhead
     * @param  {integer} index Bulkhead index
     * @return {Object}      Bulkhead module details
     */
    getBulkhead(index) {
      return this.bulkheads[index] ? new Module({ template: this.bulkheads[index] }) : null;
    }
  
    /**
     * Determine the modules that areeligible for an internal slot
     * @param  {Object} ship      The ship
     * @param  {integer} c        The max class module that can be mounted in the slot
     * @param  {Object} eligible) The map of eligible internal groups
     * @return {object}           A map of all eligible modules by group
     */
    getInts(ship, c, eligible) {
      let o = {};
      for (let key in this.internal) {
        if (eligible && !eligible[key]) {
          continue;
        }
        if (key == 'pcq' && !(ship.luxuryCabins && ship.luxuryCabins  === true)) {
          continue;
        }
        if (key == 'fh' && !(ship.fighterHangars && ship.fighterHangars  === true)) {
          continue;
        }
        let data = filter(this.internal[key], c, 0, this.mass);
        if (data.length) {  // If group is not empty
          o[key] = data;
        }
      }
      return o;
    }
  
    /**
     * Determining the modules that are eligible for an hardpoint slot
     * @param  {integer} c        The max class module that can be mounted in the slot
     * @param  {Object} eligible) The map of eligible hardpoint groups
     * @return {object}           A map of all eligible modules by group
     */
    getHps(c, eligible) {
      let o = {};
      for (let key in this.hardpoints) {
        if (eligible && !eligible[key]) {
          continue;
        }
        let data = filter(this.hardpoints[key], c, c ? 1 : 0, this.mass);
        if (data.length) {  // If group is not empty
          o[key] = data;
        }
      }
      return o;
    }
  
    /**
     * Find the lightest Power Distributor that provides sufficient
     * energy to boost.
     * @param  {number} boostEnergy The energy that is required to boost
     * @return {Object}             Power Distributor
     */
    lightestPowerDist(boostEnergy) {
      let pd = this.standard[4][0];
      for (let p of this.standard[4]) {
        if (p.mass < pd.mass && p.engcap > boostEnergy) {
          pd = p;
        }
      }
      return new Module({ template: pd });
    };
  
    /** Find the power distributor that matches the requirements
     * @param  {Object} requirements The requirements to be met (currently only support 'weprate')
     * @return {Object}              Power distributor
     */
    matchingPowerDist(requirements) {
      let pd = this.standard[4][0];
      for (let p of this.standard[4]) {
        if (p.weprate >= requirements.weprate || p.weprate >= pd.weprate) {
          pd = p;
        }
      }
      return new Module({ template: pd });
    }
  
    /**
     * Finds the lightest Thruster that can handle the specified tonnage
     * @param  {number} ladenMass Ship laden mass (mass + cargo + fuel)
     * @return {Object}           Thruster
     */
    lightestThruster(ladenMass) {
      let th = this.standard[1][0];
  
      for (let t of this.standard[1]) {
        if (t.mass < th.mass && t.maxmass >= ladenMass) {
          th = t;
        }
      }
      return new Module({ template: th });
    };
  
    /**
     * Finds the lightest usable Shield Generator
     * @param  {number} hullMass  Ship hull mass
     * @return {Object}           Thruster
     */
    lightestShieldGenerator(hullMass) {
      let sg = this.internal.sg[0];
  
      for (let s of this.internal.sg) {
        if (s.mass < sg.mass && s.maxmass > hullMass) {
          sg = s;
        }
      }
      return new Module({ template: sg });
    };
  
    /**
     * Find the lightest Power Plant that provides sufficient power
     * @param  {number} powerNeeded Power requirements in MJ
     * @param  {string} rating      The optional rating of the power plant
     * @return {Object}             Power Plant
     */
    lightestPowerPlant(powerNeeded, rating) {
      let pp = this.standard[0][0];
  
      for (let p of this.standard[0]) {
        // Provides enough power, is lighter or the same mass as current power plant but better output/efficiency
        if (p.pgen >= powerNeeded && (p.mass < pp.mass || (p.mass == pp.mass && p.pgen > pp.pgen)) && (!rating || rating == p.rating)) {
          pp = p;
        }
      }
      return new Module({ template: pp });
    }
  }
  


/*
 * All functions below must return a fresh Module rather than a definition or existing module, as
 * the resultant object can be altered with modifications.
 */


/**
 * Created a cargo hatch model
 * @return {Object} Cargo hatch model
 */
 function cargoHatch() {
    let hatch = new Module();
    Object.assign(hatch, { name: 'Cargo Hatch', class: 1, rating: 'H', power: 0.6 });
    return hatch;
  };
  
  /**
   * Finds the module with the specific group and ID
   * @param  {String} grp           Module group (pp - power plant, pl - pulse laser etc)
   * @param  {String} id            The module ID
   * @return {Object}               The module or null
   */
  function findModule(grp, id) {
    // See if it's a standard module
    if (Dist.Modules.standard[grp]) {
      let standardmod = Dist.Modules.standard[grp].find(e => e.id == id);
      if (standardmod != null) {
        return new Module({ template: standardmod });
      }
    }
  
    // See if it's an internal module
    if (Dist.Modules.internal[grp]) {
      let internalmod = Dist.Modules.internal[grp].find(e => e.id == id);
      if (internalmod != null) {
        return new Module({ template: internalmod });
      }
    }
  
    // See if it's a hardpoint module
    if (Dist.Modules.hardpoints[grp]) {
      let hardpointmod = Dist.Modules.hardpoints[grp].find(e => e.id == id);
      if (hardpointmod != null) {
        return new Module({ template: hardpointmod });
      }
    }
  
    return null;
  }
  
  /**
   * Finds the standard module type with the specified ID
   * @param  {String|Number} type   Standard Module Type (0/pp - Power Plant, 1/t - Thrusters, etc)
   * @param  {String} id            The module ID or '[Class][Rating]'
   * @return {Object}               The standard module or null
   */
  function standard(type, id) {
    if (!isNaN(type)) {
      type = StandardArray[type];
    }
    let s = Dist.Modules.standard[type].find(e => e.id === id);
    if (!s) {
      s = Dist.Modules.standard[type].find(e => (e.class == id.charAt(0) && e.rating == id.charAt(1)));
    }
    if (s) {
      s = new Module({ template: s });
    }
    return s || null;
  };
  
  /**
   * Finds the hardpoint with the specified ID
   * @param  {String} id Hardpoint ID
   * @return {Object}    Hardpoint module or null
   */
  function hardpoints(id) {
    for (let n in Dist.Modules.hardpoints) {
      let group = Dist.Modules.hardpoints[n];
      for (let i = 0; i < group.length; i++) {
        if (group[i].id == id) {
          return new Module({ template: group[i] });
        }
      }
    }
    return null;
  };
  
  /**
   * Finds the internal module with the specified ID
   * @param  {String} id Internal module ID
   * @return {Object}    Internal module or null
   */
  function internal(id) {
    for (let n in Dist.Modules.internal) {
      let group = Dist.Modules.internal[n];
      for (let i = 0; i < group.length; i++) {
        if (group[i].id == id) {
          return new Module({ template: group[i] });
        }
      }
    }
    return null;
  };
  
  /**
   * Finds a standard module based on Class, Rating, Group and/or name.
   * At least one of Group name or unique module name must be provided
   *
   * @param  {String} groupName [Optional] Full name or abbreviated name for module group
   * @param  {integer} clss     module Class
   * @param  {String} rating    module Rating
   * @param  {String} name      [Optional] Long/unique name for module -e.g. 'Advanced Discover Scanner'
   * @return {Object}           The module if found, null if not found
   */
  function findStandard(groupName, clss, rating, name) {
    let groups = {};
  
    if (groupName) {
      if (Dist.Modules.standard[groupName]) {
        groups[groupName] = Dist.Modules.standard[groupName];
      } else {
        let grpCode = ModuleNameToGroup[groupName.toLowerCase()];
        if (grpCode && Dist.Modules.standard[grpCode]) {
          groups[grpCode] = Dist.Modules.standard[grpCode];
        }
      }
    } else if (name) {
      groups = Dist.Modules.standard;
    }
  
    for (let g in groups) {
      let group = groups[g];
      for (let i = 0, l = group.length; i < l; i++) {
        if (group[i].class == clss && group[i].rating == rating && ((!name && !group[i].name) || group[i].name == name)) {
          return group[i];
        }
      }
    }
  
    return null;
  }
  
  /**
   * Finds a standard Module ID based on Class, Rating, Group and/or name.
   * At least one of Group name or unique module name must be provided
   *
   * @param  {String} groupName [Optional] Full name or abbreviated name for module group
   * @param  {integer} clss     module Class
   * @param  {String} rating    Module Rating
   * @param  {String} name      [Optional] Long/unique name for module -e.g. 'Advanced Discover Scanner'
   * @return {String}           The id of the module if found, null if not found
   */
  function findStandardId(groupName, clss, rating, name) {
    let i = this.findStandard(groupName, clss, rating, name);
    return i ? i.id : 0;
  }
  
  /**
   * Finds an internal module based on Class, Rating, Group and/or name.
   * At least one ofGroup name or unique module name must be provided
   *
   * @param  {String} groupName [Optional] Full name or abbreviated name for module group
   * @param  {integer} clss     module Class
   * @param  {String} rating    module Rating
   * @param  {String} name      [Optional] Long/unique name for module -e.g. 'Advanced Discover Scanner'
   * @return {Object}           The module if found, null if not found
   */
  function findInternal(groupName, clss, rating, name) {
    let groups = {};
  
    if (groupName) {
      if (Dist.Modules.internal[groupName]) {
        groups[groupName] = Dist.Modules.internal[groupName];
      } else {
        let grpCode = ModuleNameToGroup[groupName.toLowerCase()];
        if (grpCode && Dist.Modules.internal[grpCode]) {
          groups[grpCode] = Dist.Modules.internal[grpCode];
        }
      }
    } else if (name) {
      groups = Dist.Modules.internal;
    }
  
    for (let g in groups) {
      let group = groups[g];
      for (let i = 0, l = group.length; i < l; i++) {
        if (group[i].class == clss && group[i].rating == rating && ((!name && !group[i].name) || group[i].name == name)) {
          return group[i];
        }
      }
    }
  
    return null;
  }
  
  /**
   * Finds an internal module based on Class, Rating, Group and/or name.
   * At least one of Group name or unique module name must be provided.
   * will start searching at specified class and proceed lower until a
   * module is found or 0 is hit
   * Uses findInternal internally
   *
   * @param  {String} groupName [Optional] Full name or abbreviated name for module group
   * @param  {integer} clss     module Class
   * @param  {String} rating    module Rating
   * @param  {String} name      [Optional] Long/unique name for module -e.g. 'Advanced Discover Scanner'
   * @return {Object}           The module if found, null if not found
   */
  function findMaxInternal(groupName, clss, rating, name) {
    let foundModule = null;
    let currentClss = clss;
    while (currentClss > 0 && foundModule == null) {
      foundModule = findInternal(groupName, currentClss, rating, name);
      currentClss = currentClss - 1;
    }
    return foundModule;
  }
  
  /**
   * Finds an internal Module ID based on Class, Rating, Group and/or name.
   * At least one ofGroup name or unique module name must be provided
   *
   * @param  {String} groupName [Optional] Full name or abbreviated name for module group
   * @param  {integer} clss     module Class
   * @param  {String} rating    Module Rating
   * @param  {String} name      [Optional] Long/unique name for module -e.g. 'Advanced Discover Scanner'
   * @return {String}           The id of the module if found, null if not found
   */
  function findInternalId(groupName, clss, rating, name) {
    let i = this.findInternal(groupName, clss, rating, name);
    return i ? i.id : 0;
  }
  
  /**
   * Finds a hardpoint Module based on Class, Rating, Group and/or name.
   * At least one ofGroup name or unique module name must be provided
   *
   * @param  {String} groupName [Optional] Full name or abbreviated name for module group
   * @param  {integer} clss     Module Class
   * @param  {String} rating    [Optional] module Rating
   * @param  {String} name      [Optional] Long/unique name for module -e.g. 'Heat Sink Launcher'
   * @param  {String} mount     Mount type - [F]ixed, [G]imballed, [T]urret
   * @param  {String} missile   [Optional] Missile type - [D]umbfire, [S]eeker
   * @return {String}           The id of the module if found, null if not found
   */
  function findHardpoint(groupName, clss, rating, name, mount, missile) {
    let groups = {};
  
    if (groupName) {
      if (Dist.Modules.hardpoints[groupName]) {
        groups[groupName] = Dist.Modules.hardpoints[groupName];
      } else {
        let grpCode = ModuleNameToGroup[groupName.toLowerCase()];
        if (grpCode && Dist.Modules.hardpoints[grpCode]) {
          groups[grpCode] = Dist.Modules.hardpoints[grpCode];
        }
      }
    } else if (name) {
      groups = Dist.Modules.hardpoints;
    }
  
    for (let g in groups) {
      let group = groups[g];
      for (let h of group) {
        if (h.class == clss && (!rating || h.rating == rating) && h.mount == mount && h.name == name && h.missile == missile) {
          return h;
        }
      }
    }
  
    return null;
  }
  
  /**
   * Finds a hardpoint module ID based on Class, Rating, Group and/or name.
   * At least one of Group name or unique module name must be provided
   *
   * @param  {String} groupName [Optional] Full name or abbreviated name for module group
   * @param  {integer} clss     module Class
   * @param  {String} rating    module Rating
   * @param  {String} name      [Optional] Long/unique name for module -e.g. 'Heat Sink Launcher'
   * @param  {String} mount     Mount type - [F]ixed, [G]imballed, [T]urret
   * @param  {String} missile   [Optional] Missile type - [D]umbfire, [S]eeker
   * @return {String}           The id of the module if found, null if not found
   */
  function findHardpointId(groupName, clss, rating, name, mount, missile) {
    let h = this.findHardpoint(groupName, clss, rating, name, mount, missile);
    if (h) {
      return h.id;
    }
  
    // Countermeasures used to be lumped in a single group but have been broken, out.  If we have been given a groupName of 'Countermeasure' then
    // rely on the unique name to find it
    if (groupName === 'cm' || groupName === 'Countermeasure') {
      h = this.findHardpoint(null, clss, rating, name, mount, missile);
    }
  
    return h ? h.id : 0;
  }
  
  /**
   * Get the bulkhead index for the given bulkhead name
   * @param  {String} bulkheadName Bulkhead name in english
   * @return {number}              Bulkhead index
   */
  function bulkheadIndex(bulkheadName) {
    return BulkheadNames.indexOf(bulkheadName);
  }
  
  
  /**
   * Determine if a module group is a shield generator
   * @param  {String}  g Module Group name
   * @return {Boolean}   True if the group is a shield generator
   */
  function isShieldGenerator(g) {
    return g == 'sg' || g == 'psg' || g == 'bsg';
  }
  
  /**
   * Creates a new ModuleSet that contains all available modules
   * that the specified ship is eligible to use.
   *
   * 6.5 T is the lightest possible mass of standard components that any ship can use
   *
   * @param  {String} shipId    Unique ship Id/Key
   * @return {ModuleSet}     The set of modules the ship can install
   */
  function forShip(shipId) {
    return new ModuleSet(Dist.Modules, Ships[shipId]);
  }
  


/**
 * Module - active module in a ship's buildout
 */
 class Module {
    /**
     * Construct a new module
     * @param {Object} params   Module parameters.  Either grp/id or template
     */
    constructor(params) {
      let properties = Object.assign({ grp: null, id: null, template: null }, params);
  
      if (properties.class != undefined) {
        // We already have a fully-formed module; copy the data over
        for (let p in properties) { this[p] = properties[p]; }
      } else if (properties.template != undefined) {
        // We have a template from coriolis-data; copy the data over
        for (let p in properties.template) { this[p] = properties.template[p]; }
      } else {
        // We don't have a template; find it given the group and ID
        return findModule(properties.grp, properties.id);
      }
    }
  
    /**
     * Clone an existing module
     * @return {Object}  A clone of the existing module
     */
    clone() {
      return new Module(JSON.parse(JSON.stringify(this)));
    }
  
    /**
     * Get a value for a given modification
     * @param {Number} name The name of the modification
     * @param {Number} raw  True if the value returned should be raw i.e. without the influence of special effects
     * @return {object}     The value of the modification. If it is a numeric value then it is returned as an integer value scaled so that 1.23% == 123
     */
    getModValue(name, raw) {
      let baseVal = this[name];
      let result = this.mods  && this.mods[name] ? this.mods[name] : null;
  
      if ((!raw) && this.blueprint && this.blueprint.special) {
        // This module has a special effect, see if we need to alter our returned value
        const modifierActions = Dist.Modifications.modifierActions[this.blueprint.special.edname];
        if (modifierActions && modifierActions[name]) {
          // this special effect modifies our returned value
          const modification = Dist.Modifications.modifications[name];
          const multiplier = modification.type === 'percentage' ? 10000 : 100;
          if (name === 'explres' || name === 'kinres' || name === 'thermres' || name === 'causres') {
            // Apply resistance modding mechanisms to special effects subsequently
            result = result + modifierActions[name] * (1 - (this[name] + result / multiplier)) * 100;
          } else if (modification.method === 'additive') {
            result = result + modifierActions[name] * 100;
          } else if (modification.method === 'overwrite') {
            result = modifierActions[name];
          } else {
            result = (((1 + result / multiplier) * (1 + modifierActions[name])) - 1) * multiplier;
          }
        }
      }
  
      // Sanitise the resultant value to 4dp equivalent
      return isNaN(result) ? result : Math.round(result);
    }
  
    /**
     * Set a value for a given modification ID
     * @param {Number} name                 The name of the modification
     * @param {object} value  The value of the modification. If it is a numeric value then it should be an integer scaled so that -2.34% == -234
     * @param {Boolean}   valueiswithspecial   true if the value includes the special effect (when coming from a UI component)
     */
    setModValue(name, value, valueiswithspecial) {
      if (!this.mods) {
        this.mods = {};
      }
      if (!this.origVals) {
        this.origVals = {};
      }
      if (valueiswithspecial && this.blueprint && this.blueprint.special) {
        // This module has a special effect, see if we need to alter the stored value
        const modifierActions = Dist.Modifications.modifierActions[this.blueprint.special.edname];
        if (modifierActions && modifierActions[name]) {
          // This special effect modifies the value being set, so we need to revert it prior to storing the value
          const modification = Dist.Modifications.modifications[name];
          if (name === 'explres' || name === 'kinres' || name === 'thermres' || name === 'causres') {
            let res = (this[name] ? this[name] : 0) + value / 10000;
            let experimental = modifierActions[name] / 100;
            value = (experimental - res) / (experimental - 1) - this[name];
            value *= 10000;
            // value = ((baseMult - value / 10000) / (1 - modifierActions[name] / 100) - baseMult) * -10000;
          } else if (modification.method === 'additive') {
            value = value - modifierActions[name];
          } else if (modification.method === 'overwrite') {
            value = null;
          } else {
            value = ((value / 10000 + 1) / (1 + modifierActions[name]) - 1) * 10000;
          }
        }
      }
  
      if (value == null || value == 0) {
        delete this.mods[name];
      } else {
        this.mods[name] = value;
      }
    }
  
    /**
     * Helper to obtain a module's value.
     * @param {String} name     The name of the modifier to obtain
     * @param {Number} modified Whether to return the raw or modified value
     * @return {Number} The value queried
     */
    get(name, modified = true) {
      if (name == 'rof' && isNaN(this[name])) {
        let fireint = this['fireint'];
        if (!isNaN(fireint)) {
          this['rof'] = 1 / fireint;
        }
      }
  
      let val;
      if (modified) {
        val = this._getModifiedValue(name);
      } else {
        val = this[name];
      }
      return isNaN(val) ? null : val;
    }
  
    /**
     * Sets mod values such that the overall result for the given stat equals value
     * @param {String} name The name of the modification
     * @param {Number} value The value to effectively set
     * @param {Boolean} valueIsWithSpecial True when value includes an special
     *                                     effects
     */
    set(name, value, valueIsWithSpecial) {
      const modification = Dist.Modifications.modifications[name];
      if (!modification || isNaN(value)) {
        // TODO: throw?
        return;
      }
  
      let baseValue = this[name];
      let modValue = 0;
      if (modification.method === 'overwrite') {
        modValue = value;
      } else if (modification.method === 'additive') {
        // additive modifications can be given without a base value
        if (!baseValue) {
          baseValue = 0;
        }
        modValue = value - baseValue;
      } else if (name === 'shieldboost' || name === 'hullboost') {
        modValue = (1 + value) / (1 + baseValue) - 1;
      } else if (name === 'rof') {
        let burst = this.get('burst', true) || 1;
        let burstInt = 1 / (this.get('burstrof', true) / 1);
  
        let interval = burst / value;
        let newFireint = (interval - (burst - 1) * burstInt);
        modValue = newFireint / this['fireint'] - 1;
      } else { // multiplicative
        modValue = baseValue == 0 ? 0 : value / baseValue - 1;
      }
  
      if (modification.type === 'percentage') {
        modValue = modValue * 10000;
      } else if (modification.type === 'numeric') {
        modValue = modValue * 100;
      }
  
      this.setModValue(name, modValue, valueIsWithSpecial);
    }
  
    /**
     * Returns a value for a given modification in pretty format, i.e. percentages
     * are returned as 90 not as 0.9.
     * @param {String} name Name of the modification to get the value for
     * @param {Boolean} [modified = true] If set to false, the raw value of the
     *                                    raw value of the stat is returned
     * @param {Number} [places = 2] Number of decimal places to round
     * @return {Number} Value for given stat
     */
    getPretty(name, modified = true, places = 2) {
      const formattingOptions = STATS_FORMATTING[name];
      let val;
      if (formattingOptions && formattingOptions.synthetic) {
        val = (this[formattingOptions.synthetic]).call(this, modified);
      } else {
        val = this.get(name, modified);
      }
      val = val || 0;
  
      if (formattingOptions && formattingOptions.format.startsWith('pct')) {
        return 100 * val;
      }
      // Round to two decimal places
      let precisionMult = 10 ** places;
      return Math.round(val * precisionMult) / precisionMult;
    }
  
    /**
     * Same as {@see Module#set} but values expects value that are percentages to
     * come in format 90 as opposed to 0.9.
     * @param {String} name The name of the modification
     * @param {Number} value The value to effectively set
     * @param {Boolean} valueIsWithSpecial True when value includes an special
     */
    setPretty(name, value, valueIsWithSpecial) {
      const formattingOptions = STATS_FORMATTING[name];
      if (formattingOptions && formattingOptions.format.startsWith('pct')) {
        value = value / 100;
      }
      this.set(name, value, valueIsWithSpecial);
    }
  
    /**
     * Helper to obtain a modified value using standard multipliers
     * @param {String}  name     the name of the modifier to obtain
     * @return {Number}          the value queried
     */
    _getModifiedValue(name) {
      const modification = Dist.Modifications.modifications[name];
      let result = this[name];
  
      if (modification) {
        // We store percentages as decimals, so to get them back we need to divide by 10000.  Otherwise
        // we divide by 100.  Both ways we end up with a value with two decimal places
        let modValue;
        if (modification.type === 'percentage') {
          modValue = this.getModValue(name) / 10000;
        } else if (modification.type === 'numeric') {
          modValue = this.getModValue(name) / 100;
        } else {
          modValue = this.getModValue(name);
        }
        if (modValue) {
          if (!result && modification.method === 'additive') {
            // If the modification is additive and no value is given by default we
            // start at zero
            result = 0;
          }
  
          if (result !== undefined) {
            if (modification.method === 'additive') {
              result = result + modValue;
            } else if (modification.method === 'overwrite') {
              result = modValue;
            } else if (name === 'shieldboost' || name === 'hullboost') {
              result = (1 + result) * (1 + modValue) - 1;
            } else {
              // Rate of fire modifiers are special as they actually are modifiers
              // for fire interval. Translate them accordingly here:
              if (name == 'rof') {
                modValue = 1 / (1 + modValue) - 1;
              }
              result = result * (1 + modValue);
            }
          } else if (name === 'burstrof' || name === 'burst') {
            // Burst and burst rate of fire are special, as it can not exist but
            // have a modification
            result = modValue;
          }
        }
      }
  
      return isNaN(result) ? null : result;
    }
  
    /**
     * Creates a react element that pretty-prints the queried module value
     * @param {String} name     The name of the value
     * @param {object} language Language object holding formats and util functions
     * @param {String} [unit]   If unit is given not the stat's default formatting
     *                          unit will be applied but the given one taking into
     *                          account SI-prefixes such as kilo, milli, etc.
     * @param {Number} [val]    If val is given, not the modules value but given
     *                          one will be formated
     * @returns {React.Component} The formated value as component
     */
    formatModifiedValue(name, language, unit, val) {
      const formattingOptions = STATS_FORMATTING[name];
      if (val === undefined) {
        val = this.getPretty(name, true);
      }
  
      val = val || 0;
  
      if (!formattingOptions) {
        return;
      }
  
      let { format } = formattingOptions;
      unit = unit || formattingOptions.unit;
      let storedUnit = formattingOptions.storedUnit || formattingOptions.unit;
      let factor = 1;
      if (storedUnit && storedUnit !== unit) {
        // Find out si prefix of storedUnit and unit as si prefixes can only take
        // on charactere it suffices to compare the first character of each string
        let prefixUnit = unit[0];
        let prefixStored = unit[0];
        if (unit.length > storedUnit.length) {
          factor /= SI_PREFIXES[prefixUnit];
        } else if (storedUnit.length > unit.length) {
          factor *= SI_PREFIXES[prefixStored];
        } else if (prefixUnit !== prefixStored) {
          factor *= SI_PREFIXES[prefixStored];
          factor /= SI_PREFIXES[prefixUnit];
        }
      }
  
      if (format && language.formats[format]) {
        val = (language.formats[format])(val * factor);
      }
  
      return;
    }
  
    /**
     * Returns the change rate in percentage of a given stat. Change rate can
     * differ from return value of {@see Module#getModValue} when formatting
     * options are given.
     * @param {String} name Name of the value to get the change for
     * @param {Number} [val] If given not the modules value but this one will be
     *                       taken as new value
     * @return {Number} Change rate of the stat according to formatting options
     */
    getChange(name, val) {
      const formattingOptions = STATS_FORMATTING[name];
  
      if (isNaN(val)) {
        // Calculate the percentage change for an abstract value
        if (formattingOptions && formattingOptions.synthetic) {
          const statGetter = this[formattingOptions.synthetic];
          let unmodifiedStat = statGetter.call(this, false);
          let modifiedStat = statGetter.call(this, true);
          val = (modifiedStat / unmodifiedStat - 1)  * 10000;
        } else {
          val = this.getModValue(name);
        }
      }
  
      if (formattingOptions && formattingOptions.change) {
        let changeFormatting = formattingOptions.change;
        let baseVal = this[name] || 0;
        let absVal = this._getModifiedValue(name);
        if (changeFormatting === 'additive') {
          val = absVal - baseVal;
        } else if (changeFormatting === 'multiplicative') {
          val = absVal / baseVal - 1;
        }
        if (Dist.Modifications.modifications[name].method === 'overwrite') {
          val *= 100;
        } else {
          val *= 10000;
        }
      }
      return val;
    }
  
    /**
     * Returns the the unit key for a given stat. For example '%' for 'kinres'.
     * @param {String} name Name of the stat
     * @return {String} Unit key
     */
    getUnitFor(name) {
      const formattingOptions = STATS_FORMATTING[name];
      if (!formattingOptions || !formattingOptions.unit) {
        if (formattingOptions.format && formattingOptions.format.startsWith('pct')) {
          return 'pct';
        }
        return '';
      }
  
      return formattingOptions.unit;
    }
  
    /**
     * Same as {@see Module#getUnitFor} but returns the unit in which the stat is
     * stored. For example 'm' for 'range' as opposed to 'km' which is the unit
     * 'range' is usually displayed.
     * @param {String} name Name of the stat
     * @return {String} Unit key
     */
    getStoredUnitFor(name) {
      const formattingOptions = STATS_FORMATTING[name];
      if (!formattingOptions || !formattingOptions.storedUnit) {
        return this.getUnitFor(name);
      }
      return formattingOptions.storedUnit;
    }
  
    /**
     * Get the power generation of this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the power generation of this module
     */
    getPowerGeneration(modified = true) {
      return this.get('pgen', modified);
    }
  
    /**
     * Get the power usage of this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the power usage of this module
     */
    getPowerUsage(modified = true) {
      return this.get('power', modified);
    }
  
    /**
     * Get the integrity of this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the integrity of this module
     */
    getIntegrity(modified = true) {
      return this.get('integrity', modified);
    }
  
    /**
     * Get the mass of this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the mass of this module
     */
    getMass(modified = true) {
      return this.get('mass', modified);
    }
  
    /**
     * Get the thermal efficiency of this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the thermal efficiency of this module
     */
    getThermalEfficiency(modified = true) {
      return this.get('eff', modified);
    }
  
    /**
     * Get the maximum fuel per jump for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the maximum fuel per jump of this module
     */
    getMaxFuelPerJump(modified = true) {
      return this.get('maxfuel', modified);
    }
  
    /**
     * Get the systems capacity for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the systems capacity of this module
     */
    getSystemsCapacity(modified = true) {
      return this.get('syscap', modified);
    }
  
    /**
     * Get the engines capacity for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the engines capacity of this module
     */
    getEnginesCapacity(modified = true) {
      return this.get('engcap', modified);
    }
  
    /**
     * Get the weapons capacity for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the weapons capacity of this module
     */
    getWeaponsCapacity(modified = true) {
      return this.get('wepcap', modified);
    }
  
    /**
     * Get the systems recharge rate for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the systems recharge rate of this module
     */
    getSystemsRechargeRate(modified = true) {
      return this.get('sysrate', modified);
    }
  
    /**
     * Get the engines recharge rate for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the engines recharge rate of this module
     */
    getEnginesRechargeRate(modified = true) {
      return this.get('engrate', modified);
    }
  
    /**
     * Get the weapons recharge rate for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the weapons recharge rate of this module
     */
    getWeaponsRechargeRate(modified = true) {
      return this.get('weprate', modified);
    }
  
    /**
     * Get the kinetic resistance for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the kinetic resistance of this module
     */
    getKineticResistance(modified = true) {
      return this.get('kinres', modified);
    }
  
    /**
     * Get the thermal resistance for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the thermal resistance of this module
     */
    getThermalResistance(modified = true) {
      return this.get('thermres', modified);
    }
  
    /**
     * Get the explosive resistance for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the explosive resistance of this module
     */
    getExplosiveResistance(modified = true) {
      return this.get('explres', modified);
    }
  
    /**
     * Get the caustic resistance for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the caustic resistance of this module
     */
    getCausticResistance(modified = true) {
      return this.get('causres', modified);
    }
  
    /**
     * Get the regeneration rate for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the regeneration rate of this module
     */
    getRegenerationRate(modified = true) {
      return this.get('regen', modified);
    }
  
    /**
     * Get the broken regeneration rate for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the broken regeneration rate of this module
     */
    getBrokenRegenerationRate(modified = true) {
      return this.get('brokenregen', modified);
    }
  
    /**
     * Get the range for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the range rate of this module
     */
    getRange(modified = true) {
      return this.get('range', modified);
    }
  
    /**
     * Get the falloff for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the falloff of this module
     */
    getFalloff(modified = true) {
      // Falloff from range is mapped to range
      if (modified && this.mods && this.mods['fallofffromrange']) {
        return this.getRange();
      // Standard falloff calculation
      } else {
        const range = this.getRange();
        const falloff = this._getModifiedValue('falloff');
        return (falloff > range ? range : falloff);
      }
    }
  
    /**
     * Get the range (in terms of seconds, for FSDI) for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the range of this module
     */
    getRangeT(modified = true) {
      return this.get('ranget', modified);
    }
  
    /**
     * Get the scan time for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the scan time of this module
     */
    getScanTime(modified = true) {
      return this.get('scantime', modified);
    }
  
    /**
     * Get the capture arc for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the capture arc of this module
     */
    getCaptureArc(modified = true) {
      return this.get('arc', modified);
    }
  
    /**
     * Get the hull reinforcement for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the hull reinforcement of this module
     */
    getHullReinforcement(modified = true) {
      return this.get('hullreinforcement', modified);
    }
  
    /**
     * Get the protection for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the protection of this module
     */
    getProtection(modified = true) {
      return this.get('protection', modified);
    }
  
    /**
     * Get the duration for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the duration of this module
     */
    getDuration(modified = true) {
      return this.get('duration', modified);
    }
  
    /**
     * Get the shield boost for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the shield boost of this module
     */
    getShieldBoost(modified = true) {
      return this.get('shieldboost', modified);
    }
  
    /**
     * Get the minimum mass for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the minimum mass of this module
     */
    getMinMass(modified = true) {
      // Modifier is optmass
      let result = 0;
      if (this['minmass']) {
        result = this['minmass'];
        if (result && modified) {
          let mult = this.getModValue('optmass') / 10000;
          if (mult) { result = result * (1 + mult); }
        }
      }
      return result;
    }
  
    /**
     * Get the optimum mass for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the optimum mass of this module
     */
    getOptMass(modified = true) {
      return this.get('optmass', modified);
    }
  
    /**
     * Get the maximum mass for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the maximum mass of this module
     */
    getMaxMass(modified = true) {
      // Modifier is optmass
      let result = 0;
      if (this['maxmass']) {
        result = this['maxmass'];
        if (result && modified && !ModuleUtils.isShieldGenerator(this['grp'])) {
          let mult = this.getModValue('optmass') / 10000;
          if (mult) { result = result * (1 + mult); }
        }
      }
      return result;
    }
  
    /**
     * Get the minimum multiplier for this module
     * @param {string} type the type for which we are obtaining the multiplier.  Can be 'speed', 'rotation', 'acceleration', or null
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the minimum multiplier of this module
     */
    getMinMul(type = null, modified = true) {
      // Modifier is optmul
      let result = 0;
      if (this['minmul' + type]) {
        result = this['minmul' + type];
      } else if (this['minmul']) {
        result = this['minmul'];
      }
      if (result && modified) {
        let mult = this.getModValue('optmul') / 10000;
        if (mult) { result = result * (1 + mult); }
      }
      return result;
    }
  
    /**
     * Get the optimum multiplier for this module
     * @param {string} type the type for which we are obtaining the multiplier.  Can be 'speed', 'rotation', 'acceleration', or null
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the optimum multiplier of this module
     */
    getOptMul(type = null, modified = true) {
      // Modifier is optmul
      let result = 0;
      if (this['optmul' + type]) {
        result = this['optmul' + type];
      } else if (this['optmul']) {
        result = this['optmul'];
      }
      if (result && modified) {
        let mult = this.getModValue('optmul') / 10000;
        if (mult) { result = result * (1 + mult); }
      }
      return result;
    }
  
    /**
     * Get the maximum multiplier for this module
     * @param {string} type the type for which we are obtaining the multiplier.  Can be 'speed', 'rotation', 'acceleration', or null
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the maximum multiplier of this module
     */
    getMaxMul(type = null, modified = true) {
      // Modifier is optmul
      let result = 0;
      if (this['maxmul' + type]) {
        result = this['maxmul' + type];
      } else if (this['maxmul']) {
        result = this['maxmul'];
      }
      if (result && modified) {
        let mult = this.getModValue('optmul') / 10000;
        if (mult) { result = result * (1 + mult); }
      }
      return result;
    }
  
    /**
     * Get the damage for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the damage of this module
     */
    getDamage(modified = true) {
      return this.get('damage', modified);
    }
  
    /**
     * Get the distributor draw for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the distributor draw of this module
     */
    getDistDraw(modified = true) {
      return this.get('distdraw', modified);
    }
  
    /**
     * Get the DPS for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the DPS of this module
     */
    getDps(modified = true) {
      // DPS is a synthetic value
      let damage = this.getDamage(modified);
      let rpshot = this.roundspershot || 1;
      let rof = this.getRoF(modified) || 1;
  
      return damage * rpshot * rof;
    }
  
    /**
     * Get the DPE for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the DPE of this module
     */
    getDpe(modified = true) {
      return this.getDps(modified) / this.getEps(modified);
    }
  
    /**
     * Return the factor that gets applied when calculating certain "sustained"
     * values, e.g. `SDPS = this.getSustainedFactor() * DPS`.
     * @param {Boolean} [modified=true] Whether to take modifications into account
     */
    getSustainedFactor(modified = true) {
      let clipSize = this.getClip(modified);
      if (clipSize) {
        // If auto-loader is applied, effective clip size will be nearly doubled
        // as you get one reload for every two shots fired.
        if (this.blueprint && this.blueprint.special && this.blueprint.special.edname === 'special_auto_loader' && modified) {
          clipSize += clipSize - 1;
        }
  
        let burstSize = this.get('burst', modified) || 1;
        let rof = this.getRoF(modified);
        // rof averages burstfire + pause until next interval but for sustained
        // rof we need to take another burst without pause into account
        let burstOverhead = (burstSize - 1) / (this.get('burstrof', modified) || 1);
        let srof = clipSize / ((clipSize - burstSize) / rof + burstOverhead + this.getReload(modified));
        return srof / rof;
      } else {
        return 1;
      }
    }
  
    /**
     * Get the SDPS for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} The SDPS of this module
     */
    getSDps(modified = true) {
      return this.getDps(modified) * this.getSustainedFactor(modified);
    }
  
    /**
     * Get the EPS for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the EPS of this module
     */
    getEps(modified = true) {
      // EPS is a synthetic value
      let distdraw = this.getDistDraw(modified);
      // We don't use rpshot here as dist draw is per combined shot
      let rof = this.getRoF(modified) || 1;
  
      return distdraw * rof;
    }
  
    /**
     * Get the HPS for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the HPS of this module
     */
    getHps(modified = true) {
      // HPS is a synthetic value
      let heat = this.get('thermload', modified);
      // We don't use rpshot here as dist draw is per combined shot
      let rof = this.getRoF(modified) || 1;
  
      return heat * rof;
    }
  
    /**
     * Get the clip size for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the clip size of this module
     */
    getClip(modified = true) {
      // Clip size is always rounded up
      let result = this.get('clip', modified);
      if (result) { result = Math.ceil(result); }
      return result;
    }
  
    /**
     * Get the ammo size for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the ammo size of this module
     */
    getAmmo(modified = true) {
      return this.get('ammo', modified);
    }
  
    /**
     * Get the reload time for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the reload time of this module
     */
    getReload(modified = true) {
      return this.get('reload', modified);
    }
  
    /**
     * Get the rate of fire for this module.
     * The rate of fire is a combination value, and needs to take in to account
     * bursts of fire.
     * Firing goes [burst 1] [burst interval] [burst 2] [burst interval] ... [burst n] [interval]
     * where 'n' is 'burst', 'burst interval' is '1/burstrof' and 'interval' is '1/rof'
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the rate of fire for this module
     */
    getRoF(modified = true) {
      const burst = this.get('burst', modified) || 1;
      const burstRoF = this.get('burstrof', modified) || 1;
      const intRoF = this.get('rof', modified);
  
      return burst / (((burst - 1) / burstRoF) + 1 / intRoF);
    }
  
    /**
     * Get the facing limit for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the facing limit for this module
     */
    getFacingLimit(modified = true) {
      return this.get('facinglimit', modified);
    }
  
    /**
     * Get the hull boost for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the hull boost for this module
     */
    getHullBoost(modified = true) {
      return this.get('hullboost', modified);
    }
  
    /**
     * Get the shield reinforcement for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the shield reinforcement for this module
     */
    getShieldReinforcement(modified = true) {
      return this.get('shieldreinforcement', modified);
    }
  
    /**
     * Get the shield addition for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the shield addition for this module
     */
    getShieldAddition(modified = true) {
      return this.get('shieldaddition', modified);
    }
  
    /**
     * Get the jump range boost for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the jump range boost for this module
     */
    getJumpBoost(modified = true) {
      return this.get('jumpboost', modified);
    }
  
    /**
     * Get the piercing for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the piercing for this module
     */
    getPiercing(modified = true) {
      return this.get('piercing', modified);
    }
  
    /**
     * Get the bays for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the bays for this module
     */
    getBays(modified) {
      return this.get('bays', modified);
    }
  
    /**
     * Get the rebuilds per bay for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the rebuilds per bay for this module
     */
    getRebuildsPerBay(modified = true) {
      return this.get('rebuildsperbay', modified);
    }
  
    /**
     * Get the jitter for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {Number} the jitter for this module
     */
    getJitter(modified = true) {
      return this.get('jitter', modified);
    }
  
    /**
     * Get the damage distribution for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {string} the damage distribution for this module
     */
    getDamageDist(modified = true) {
      return (modified && this.getModValue('damagedist')) || this.damagedist;
    }
  
    /**
     * Get the shot speed for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {string} the shot speed for this module
     */
    getShotSpeed(modified = true) {
      return this.get('shotspeed', modified);
    }
  
    /**
     * Get the spinup for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {string} the spinup for this module
     */
    getSpinup(modified = true) {
      return this.get('spinup', modified);
    }
  
    /**
     * Get the time for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {string} the time for this module
     */
    getTime(modified = true) {
      return this.get('time', modified);
    }
  
    /**
     * Get the hack time for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {string} the time for this module
     */
    getHackTime(modified = true) {
      return this.get('hacktime', modified);
    }
  
    /**
     * Get the scan range for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {string} the time for this module
     */
    getScanRange(modified = true) {
      return this.get('scanrange', modified);
    }
  
    /**
     * Get the scan angle for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {string} the time for this module
     */
    getScanAngle(modified = true) {
      return this.get('scanangle', modified);
    }
  
    /**
     * Get the max angle for this module
     * @param {Boolean} [modified=true] Whether to take modifications into account
     * @return {string} the time for this module
     */
    getMaxAngle(modified = true) {
      return this.get('maxangle', modified);
    }
  }
  



/*
 * All functions below must return a fresh Module rather than a definition or existing module, as
 * the resultant object can be altered with modifications.
 */


/**
 * Created a cargo hatch model
 * @return {Object} Cargo hatch model
 */
 function cargoHatch() {
    let hatch = new Module();
    Object.assign(hatch, { name: 'Cargo Hatch', class: 1, rating: 'H', power: 0.6 });
    return hatch;
  };
  
  /**
   * Finds the module with the specific group and ID
   * @param  {String} grp           Module group (pp - power plant, pl - pulse laser etc)
   * @param  {String} id            The module ID
   * @return {Object}               The module or null
   */
  function findModule(grp, id) {
    // See if it's a standard module
    if (Dist.Modules.standard[grp]) {
      let standardmod = Dist.Modules.standard[grp].find(e => e.id == id);
      if (standardmod != null) {
        return new Module({ template: standardmod });
      }
    }
  
    // See if it's an internal module
    if (Dist.Modules.internal[grp]) {
      let internalmod = Dist.Modules.internal[grp].find(e => e.id == id);
      if (internalmod != null) {
        return new Module({ template: internalmod });
      }
    }
  
    // See if it's a hardpoint module
    if (Dist.Modules.hardpoints[grp]) {
      let hardpointmod = Dist.Modules.hardpoints[grp].find(e => e.id == id);
      if (hardpointmod != null) {
        return new Module({ template: hardpointmod });
      }
    }
  
    return null;
  }
  
  /**
   * Finds the standard module type with the specified ID
   * @param  {String|Number} type   Standard Module Type (0/pp - Power Plant, 1/t - Thrusters, etc)
   * @param  {String} id            The module ID or '[Class][Rating]'
   * @return {Object}               The standard module or null
   */
  function standard(type, id) {
    if (!isNaN(type)) {
      type = StandardArray[type];
    }
    let s = Dist.Modules.standard[type].find(e => e.id === id);
    if (!s) {
      s = Dist.Modules.standard[type].find(e => (e.class == id.charAt(0) && e.rating == id.charAt(1)));
    }
    if (s) {
      s = new Module({ template: s });
    }
    return s || null;
  };
  
  /**
   * Finds the hardpoint with the specified ID
   * @param  {String} id Hardpoint ID
   * @return {Object}    Hardpoint module or null
   */
  function hardpoints(id) {
    for (let n in Dist.Modules.hardpoints) {
      let group = Dist.Modules.hardpoints[n];
      for (let i = 0; i < group.length; i++) {
        if (group[i].id == id) {
          return new Module({ template: group[i] });
        }
      }
    }
    return null;
  };
  
  /**
   * Finds the internal module with the specified ID
   * @param  {String} id Internal module ID
   * @return {Object}    Internal module or null
   */
  function internal(id) {
    for (let n in Dist.Modules.internal) {
      let group = Dist.Modules.internal[n];
      for (let i = 0; i < group.length; i++) {
        if (group[i].id == id) {
          return new Module({ template: group[i] });
        }
      }
    }
    return null;
  };
  
  /**
   * Finds a standard module based on Class, Rating, Group and/or name.
   * At least one of Group name or unique module name must be provided
   *
   * @param  {String} groupName [Optional] Full name or abbreviated name for module group
   * @param  {integer} clss     module Class
   * @param  {String} rating    module Rating
   * @param  {String} name      [Optional] Long/unique name for module -e.g. 'Advanced Discover Scanner'
   * @return {Object}           The module if found, null if not found
   */
  function findStandard(groupName, clss, rating, name) {
    let groups = {};
  
    if (groupName) {
      if (Dist.Modules.standard[groupName]) {
        groups[groupName] = Dist.Modules.standard[groupName];
      } else {
        let grpCode = ModuleNameToGroup[groupName.toLowerCase()];
        if (grpCode && Dist.Modules.standard[grpCode]) {
          groups[grpCode] = Dist.Modules.standard[grpCode];
        }
      }
    } else if (name) {
      groups = Dist.Modules.standard;
    }
  
    for (let g in groups) {
      let group = groups[g];
      for (let i = 0, l = group.length; i < l; i++) {
        if (group[i].class == clss && group[i].rating == rating && ((!name && !group[i].name) || group[i].name == name)) {
          return group[i];
        }
      }
    }
  
    return null;
  }
  
  /**
   * Finds a standard Module ID based on Class, Rating, Group and/or name.
   * At least one of Group name or unique module name must be provided
   *
   * @param  {String} groupName [Optional] Full name or abbreviated name for module group
   * @param  {integer} clss     module Class
   * @param  {String} rating    Module Rating
   * @param  {String} name      [Optional] Long/unique name for module -e.g. 'Advanced Discover Scanner'
   * @return {String}           The id of the module if found, null if not found
   */
  function findStandardId(groupName, clss, rating, name) {
    let i = this.findStandard(groupName, clss, rating, name);
    return i ? i.id : 0;
  }
  
  /**
   * Finds an internal module based on Class, Rating, Group and/or name.
   * At least one ofGroup name or unique module name must be provided
   *
   * @param  {String} groupName [Optional] Full name or abbreviated name for module group
   * @param  {integer} clss     module Class
   * @param  {String} rating    module Rating
   * @param  {String} name      [Optional] Long/unique name for module -e.g. 'Advanced Discover Scanner'
   * @return {Object}           The module if found, null if not found
   */
  function findInternal(groupName, clss, rating, name) {
    let groups = {};
  
    if (groupName) {
      if (Dist.Modules.internal[groupName]) {
        groups[groupName] = Dist.Modules.internal[groupName];
      } else {
        let grpCode = ModuleNameToGroup[groupName.toLowerCase()];
        if (grpCode && Dist.Modules.internal[grpCode]) {
          groups[grpCode] = Dist.Modules.internal[grpCode];
        }
      }
    } else if (name) {
      groups = Dist.Modules.internal;
    }
  
    for (let g in groups) {
      let group = groups[g];
      for (let i = 0, l = group.length; i < l; i++) {
        if (group[i].class == clss && group[i].rating == rating && ((!name && !group[i].name) || group[i].name == name)) {
          return group[i];
        }
      }
    }
  
    return null;
  }
  
  /**
   * Finds an internal module based on Class, Rating, Group and/or name.
   * At least one of Group name or unique module name must be provided.
   * will start searching at specified class and proceed lower until a
   * module is found or 0 is hit
   * Uses findInternal internally
   *
   * @param  {String} groupName [Optional] Full name or abbreviated name for module group
   * @param  {integer} clss     module Class
   * @param  {String} rating    module Rating
   * @param  {String} name      [Optional] Long/unique name for module -e.g. 'Advanced Discover Scanner'
   * @return {Object}           The module if found, null if not found
   */
  function findMaxInternal(groupName, clss, rating, name) {
    let foundModule = null;
    let currentClss = clss;
    while (currentClss > 0 && foundModule == null) {
      foundModule = findInternal(groupName, currentClss, rating, name);
      currentClss = currentClss - 1;
    }
    return foundModule;
  }
  
  /**
   * Finds an internal Module ID based on Class, Rating, Group and/or name.
   * At least one ofGroup name or unique module name must be provided
   *
   * @param  {String} groupName [Optional] Full name or abbreviated name for module group
   * @param  {integer} clss     module Class
   * @param  {String} rating    Module Rating
   * @param  {String} name      [Optional] Long/unique name for module -e.g. 'Advanced Discover Scanner'
   * @return {String}           The id of the module if found, null if not found
   */
  function findInternalId(groupName, clss, rating, name) {
    let i = this.findInternal(groupName, clss, rating, name);
    return i ? i.id : 0;
  }
  
  /**
   * Finds a hardpoint Module based on Class, Rating, Group and/or name.
   * At least one ofGroup name or unique module name must be provided
   *
   * @param  {String} groupName [Optional] Full name or abbreviated name for module group
   * @param  {integer} clss     Module Class
   * @param  {String} rating    [Optional] module Rating
   * @param  {String} name      [Optional] Long/unique name for module -e.g. 'Heat Sink Launcher'
   * @param  {String} mount     Mount type - [F]ixed, [G]imballed, [T]urret
   * @param  {String} missile   [Optional] Missile type - [D]umbfire, [S]eeker
   * @return {String}           The id of the module if found, null if not found
   */
  function findHardpoint(groupName, clss, rating, name, mount, missile) {
    let groups = {};
  
    if (groupName) {
      if (Dist.Modules.hardpoints[groupName]) {
        groups[groupName] = Dist.Modules.hardpoints[groupName];
      } else {
        let grpCode = ModuleNameToGroup[groupName.toLowerCase()];
        if (grpCode && Dist.Modules.hardpoints[grpCode]) {
          groups[grpCode] = Dist.Modules.hardpoints[grpCode];
        }
      }
    } else if (name) {
      groups = Dist.Modules.hardpoints;
    }
  
    for (let g in groups) {
      let group = groups[g];
      for (let h of group) {
        if (h.class == clss && (!rating || h.rating == rating) && h.mount == mount && h.name == name && h.missile == missile) {
          return h;
        }
      }
    }
  
    return null;
  }
  
  /**
   * Finds a hardpoint module ID based on Class, Rating, Group and/or name.
   * At least one of Group name or unique module name must be provided
   *
   * @param  {String} groupName [Optional] Full name or abbreviated name for module group
   * @param  {integer} clss     module Class
   * @param  {String} rating    module Rating
   * @param  {String} name      [Optional] Long/unique name for module -e.g. 'Heat Sink Launcher'
   * @param  {String} mount     Mount type - [F]ixed, [G]imballed, [T]urret
   * @param  {String} missile   [Optional] Missile type - [D]umbfire, [S]eeker
   * @return {String}           The id of the module if found, null if not found
   */
  function findHardpointId(groupName, clss, rating, name, mount, missile) {
    let h = this.findHardpoint(groupName, clss, rating, name, mount, missile);
    if (h) {
      return h.id;
    }
  
    // Countermeasures used to be lumped in a single group but have been broken, out.  If we have been given a groupName of 'Countermeasure' then
    // rely on the unique name to find it
    if (groupName === 'cm' || groupName === 'Countermeasure') {
      h = this.findHardpoint(null, clss, rating, name, mount, missile);
    }
  
    return h ? h.id : 0;
  }
  
  /**
   * Get the bulkhead index for the given bulkhead name
   * @param  {String} bulkheadName Bulkhead name in english
   * @return {number}              Bulkhead index
   */
  function bulkheadIndex(bulkheadName) {
    return BulkheadNames.indexOf(bulkheadName);
  }
  
  
  /**
   * Determine if a module group is a shield generator
   * @param  {String}  g Module Group name
   * @return {Boolean}   True if the group is a shield generator
   */
  function isShieldGenerator(g) {
    return g == 'sg' || g == 'psg' || g == 'bsg';
  }
  
  /**
   * Creates a new ModuleSet that contains all available modules
   * that the specified ship is eligible to use.
   *
   * 6.5 T is the lightest possible mass of standard components that any ship can use
   *
   * @param  {String} shipId    Unique ship Id/Key
   * @return {ModuleSet}     The set of modules the ship can install
   */
  function forShip(shipId) {
    return new ModuleSet(Dist.Modules, Dist.Ships[shipId]);
  }
  


/**
 * Reduce function used to get the IDs for a slot group (or array of slots)
 * @param  {array} idArray    The current Array of IDs
 * @param  {Object} slot      Slot object
 * @param  {integer} slotIndex The index for the slot in its group
 * @return {array}           The mutated idArray
 */
 function reduceToIDs(idArray, slot, slotIndex) {
    idArray[slotIndex] = slot.m ? slot.m.id : '-';
    return idArray;
  }
  
  /**
   * Ship Model - Encapsulates and models in-game ship behavior
   */
  class Ship {
    /**
     * @param {String} id         Unique ship Id / Key
     * @param {Object} properties Basic ship properties such as name, manufacturer, mass, etc
     * @param {Object} slots      Collection of slot groups (standard/standard, internal, hardpoints) with their max class size.
     */
    constructor(id, properties, slots) {
      this.id = id;
      this.serialized = {};
      this.cargoHatch = { m: cargoHatch(), type: 'SYS' };
      this.bulkheads = { incCost: true, maxClass: 8 };
      this.availCS = forShip(id);
  
      for (let p in properties) { this[p] = properties[p]; }  // Copy all base properties from shipData
  
      for (let slotType in slots) {   // Initialize all slots
        let slotGroup = slots[slotType];
        let group = this[slotType] = [];   // Initialize Slot group (Standard, Hardpoints, Internal)
        for (let slot of slotGroup) {
          if (typeof slot == 'object') {
            group.push({ m: null, incCost: true, maxClass: slot.class, eligible: slot.eligible });
          } else {
            group.push({ m: null, incCost: true, maxClass: slot });
          }
        }
      }
      // Make a Ship 'slot'/item similar to other slots
      this.m = { incCost: true, type: 'SHIP', discountedCost: this.hullCost, m: { class: '', rating: '', name: this.name, cost: this.hullCost } };
      this.costList = this.internal.concat(this.m, this.standard, this.hardpoints, this.bulkheads);
      this.powerList = this.internal.concat(
        this.cargoHatch,
        this.standard[0],  // Add Power Plant
        this.standard[2],  // Add FSD
        this.standard[1],  // Add Thrusters
        this.standard[4],  // Add Power Distributor
        this.standard[5],  // Add Sensors
        this.standard[3],  // Add Life Support
        this.hardpoints
      );
      this.moduleCostMultiplier = 1;
      this.priorityBands = [
        { deployed: 0, retracted: 0, },
        { deployed: 0, retracted: 0, },
        { deployed: 0, retracted: 0, },
        { deployed: 0, retracted: 0, },
        { deployed: 0, retracted: 0, }
      ];
    }
  
    /* GETTERS */
  
    /**
     * Can the ship thrust/move
     * @param  {Number} cargo     Amount of cargo in the ship
     * @param  {Number} fuel      Amount of fuel in the ship
     * @return {[type]} True if thrusters operational
     */
    canThrust(cargo, fuel) {
      return this.getSlotStatus(this.standard[1]) == 3 &&   // Thrusters are powered
          this.unladenMass + cargo + fuel < this.standard[1].m.getMaxMass(); // Max mass not exceeded
    }
  
    /**
     * Can the ship boost
     * @param  {Number} cargo     Amount of cargo in the ship
     * @param  {Number} fuel      Amount of fuel in the ship
     * @return {[type]} True if boost capable
     */
    canBoost(cargo, fuel) {
      return this.canThrust(cargo, fuel) &&                           // Thrusters operational
          this.standard[4].m.getEnginesCapacity() > this.boostEnergy; // PD capacitor is sufficient for boost
    }
  
    /**
     * Calculate the hypothetical laden jump range based on a potential change in mass, fuel, or FSD
     * @param  {Number} massDelta Optional - Change in laden mass (mass + cargo + fuel)
     * @param  {Number} fuel      Optional - Available fuel (defaults to max fuel based on FSD)
     * @param  {Object} fsd       Optional - Frame Shift Drive (or use mounted FSD)
     * @return {Number}           Jump range in Light Years
     */
    calcLadenRange(massDelta, fuel, fsd) {
      return Calc.jumpRange(this.ladenMass + (massDelta || 0), fsd || this.standard[2].m, fuel, this);
    }
  
    /**
     * Calculate the hypothetical unladen jump range based on a potential change in mass, fuel, or FSD
     * @param  {Number} massDelta Optional - Change in ship mass
     * @param  {Number} fuel      Optional - Available fuel (defaults to lesser of fuel capacity or max fuel based on FSD)
     * @param  {Object} fsd       Optional - Frame Shift Drive (or use mounted FSD)
     * @return {Number}           Jump range in Light Years
     */
    calcUnladenRange(massDelta, fuel, fsd) {
      fsd = fsd || this.standard[2].m;
      let fsdMaxFuelPerJump = fsd instanceof Module ? fsd.getMaxFuelPerJump() : fsd.maxfuel;
      return Calc.jumpRange(this.unladenMass + (massDelta || 0) +  Math.min(fsdMaxFuelPerJump, fuel || this.fuelCapacity), fsd || this.standard[2].m, fuel, this);
    }
  
    /**
     * Calculate the hypothetical top speeds at cargo and fuel tonnage
     * @param  {Number} fuel  Fuel available in tons
     * @param  {Number} cargo Cargo in tons
     * @return {array}       Speed at pip settings
     */
    calcSpeedsWith(fuel, cargo) {
      return Calc.speed(this.unladenMass + fuel + cargo, this.speed, this.standard[1].m, this.pipSpeed);
    }
  
    /**
     * Calculate the speed for a given configuration
     * @param  {Number}  eng   Number of pips in ENG
     * @param  {Number}  fuel  Amount of fuel carried
     * @param  {Number}  cargo Amount of cargo carried
     * @param  {boolean} boost true if boost is applied
     * @return {Number}        Speed
     */
    calcSpeed(eng, fuel, cargo, boost) {
      return Calc.calcSpeed(this.unladenMass + fuel + cargo, this.speed, this.standard[1].m, this.pipSpeed, eng, this.boost / this.speed, boost);
    }
  
    /**
     * Calculate the pitch for a given configuration
     * @param  {Number}  eng   Number of pips in ENG
     * @param  {Number}  fuel  Amount of fuel carried
     * @param  {Number}  cargo Amount of cargo carried
     * @param  {boolean} boost true if boost is applied
     * @return {Number}        Pitch
     */
    calcPitch(eng, fuel, cargo, boost) {
      return Calc.calcPitch(this.unladenMass + fuel + cargo, this.pitch, this.standard[1].m, this.pipSpeed, eng, this.boost / this.speed, boost);
    }
  
    /**
     * Calculate the roll for a given configuration
     * @param  {Number}  eng   Number of pips in ENG
     * @param  {Number}  fuel  Amount of fuel carried
     * @param  {Number}  cargo Amount of cargo carried
     * @param  {boolean} boost true if boost is applied
     * @return {Number}        Roll
     */
    calcRoll(eng, fuel, cargo, boost) {
      return Calc.calcRoll(this.unladenMass + fuel + cargo, this.roll, this.standard[1].m, this.pipSpeed, eng, this.boost / this.speed, boost);
    }
  
    /**
     * Calculate the yaw for a given configuration
     * @param  {Number}  eng   Number of pips in ENG
     * @param  {Number}  fuel  Amount of fuel carried
     * @param  {Number}  cargo Amount of cargo carried
     * @param  {boolean} boost true if boost is applied
     * @return {Number}        Yaw
     */
    calcYaw(eng, fuel, cargo, boost) {
      return Calc.calcYaw(this.unladenMass + fuel + cargo, this.yaw, this.standard[1].m, this.pipSpeed, eng, this.boost / this.speed, boost);
    }
  
    /**
     * Calculate the hypothetical shield strength for the ship using the specified parameters
     * @param  {Object} sg              [optional] Shield Generator to use
     * @param  {Number} multiplierDelta [optional] Change to shield multiplier (+0.2, - 0.12, etc)
     * @return {Number}                 Shield strength in MJ
     */
    calcShieldStrengthWith(sg, multiplierDelta) {
      if (!sg) {
        let sgSlot = this.findInternalByGroup('sg');
        if (!sgSlot) {
          return 0;
        }
        sg = sgSlot.m;
      }
      // TODO Not accurate if the ship has modified shield boosters
      return Calc.shieldStrength(this.hullMass, this.baseShieldStrength, sg, 1 + (multiplierDelta || 0));
    }
  
    /**
     * Get the set of available modules for this ship
     * @return {ModuleSet} Available module set
     */
    getAvailableModules() {
      return this.availCS;
    }
  
    /**
     * Returns the a slots power status:
     *  0 - No status [Blank]
     *  1 - Disabled (Switched off)
     *  2 - Offline (Insufficient power available)
     *  3 - Online
     * @param  {Object} slot        Slot model
     * @param  {boolean} deployed   True - power used when hardpoints are deployed
     * @return {Number}             status index
     */
    getSlotStatus(slot, deployed) {
      if (!slot.m) { // Empty Slot
        return 0;   // No Status (Not possible to be active in this state)
      } else if (!slot.enabled) {
        return 1;   // Disabled
      } else if (deployed) {
        return this.priorityBands[slot.priority].deployedSum >= this.powerAvailable ? 2 : 3; // Offline : Online
        // Active hardpoints have no retracted status
      } else if ((slot.cat === 1 && !slot.m.passive)) {
        return 0;  // No Status (Not possible to be active in this state)
      }
      return this.priorityBands[slot.priority].retractedSum >= this.powerAvailable ? 2 : 3;    // Offline : Online
    }
  
    /**
     * Find an internal slot that has an installed modul of the specific group.
     *
     * @param  {String} group Module group/type
     * @return {Number}       The index of the slot in ship.internal
     */
    findInternalByGroup(group) {
      if (isShieldGenerator(group)) {
        return this.internal.find(slot => slot.m && isShieldGenerator(slot.m.grp));
      } else {
        return this.internal.find(slot => slot.m && slot.m.grp == group);
      }
    }
  
    /**
     * Find the shield generator for this ship
     * @return {object}       The shield generator module for this ship
     */
    findShieldGenerator() {
      const slot = this.internal.find(slot => slot.m && isShieldGenerator(slot.m.grp));
      return slot ? slot.m : undefined;
    }
  
    /**
     * Serializes the ship to a string
     * @return {String} Serialized ship 'code'
     */
    toString() {
      return [
        'A',
        this.getStandardString(),
        this.getHardpointsString(),
        this.getInternalString(),
        '.',
        this.getPowerEnabledString(),
        '.',
        this.getPowerPrioritiesString(),
        '.',
        this.getModificationsString()
      ].join('');
    }
  
    /**
     * Serializes the standard modules to a string
     * @return {String} Serialized standard modules 'code'
     */
    getStandardString() {
      if(!this.serialized.standard) {
        this.serialized.standard = this.bulkheads.m.index + this.standard.reduce((arr, slot, i) => {
          arr[i] = slot.m ? slot.m.id : '-';
          return arr;
        }, new Array(this.standard.length)).join('');
      }
      return this.serialized.standard;
    }
  
    /**
     * Serializes the internal modules to a string
     * @return {String} Serialized internal modules 'code'
     */
    getInternalString() {
      if(!this.serialized.internal) {
        this.serialized.internal = this.internal.reduce(reduceToIDs, new Array(this.internal.length)).join('');
      }
      return this.serialized.internal;
    }
  
    /**
     * Serializes the hardpoints and utility modules to a string
     * @return {String} Serialized hardpoints and utility modules 'code'
     */
    getHardpointsString() {
      if(!this.serialized.hardpoints) {
        this.serialized.hardpoints = this.hardpoints.reduce(reduceToIDs, new Array(this.hardpoints.length)).join('');
      }
      return this.serialized.hardpoints;
    }
  
    /**
     * Serializes the modifications to a string
     * @return {String} Serialized modifications 'code'
     */
    getModificationsString() {
      // Dist.Modifications can be updated outside of the ship's direct knowledge, for example when sliders change the value,
      // so always recreate it from scratch
      this.updateModificationsString();
      return this.serialized.modifications;
    }
  
    /**
     * Get the serialized module active/inactive settings
     * @return {String} Serialized active/inactive settings
     */
    getPowerEnabledString() {
      return this.serialized.enabled;
    }
  
    /**
     * Get the serialized module priority settings
     * @return {String} Serialized priority settings
     */
    getPowerPrioritiesString() {
      return this.serialized.priorities;
    }
  
    /* Mutate / Update Ship */
  
    /**
     * Recalculate all item costs and total based on discounts.
     * @param  {Number} shipDiscount      Ship cost discount (e.g. 0.1 === 10% discount)
     * @param  {Number} moduleDiscount    Module cost discount (e.g. 0.75 === 25% discount)
     * @return {this} The current ship instance for chaining
     */
    applyDiscounts(shipDiscount, moduleDiscount) {
      let shipCostMultiplier = 1 - shipDiscount;
      let moduleCostMultiplier = 1 - moduleDiscount;
      let total = 0;
      let costList = this.costList;
  
      for (let i = 0, l = costList.length; i < l; i++) {
        let item = costList[i];
        if (item.m && item.m.cost) {
          item.discountedCost = item.m.cost * (item.type == 'SHIP' ? shipCostMultiplier : moduleCostMultiplier);
          if (item.incCost) {
            total += item.discountedCost;
          }
        }
      }
      this.moduleCostMultiplier = moduleCostMultiplier;
      this.totalCost = total;
      return this;
    }
  
    /**
     * Clear all modification values for a module
     * @param  {Number} m      The module for which to clear the modifications
     */
    clearModifications(m) {
      m.mods = {};
      this.updatePowerGenerated()
        .updatePowerUsed()
        .recalculateMass()
        .updateJumpStats()
        .recalculateShield()
        .recalculateShieldCells()
        .recalculateArmour()
        .recalculateDps()
        .recalculateEps()
        .recalculateHps()
        .updateMovement();
    }
  
    /**
     * Set blueprint for a module
     * @param  {Object} m      The module for which to set the blueprint
     * @param  {Object} bp     The blueprint
     */
    setModuleBlueprint(m, bp) {
      m.blueprint = bp;
      this.clearModifications(m);
      // Set any hidden items for the blueprint now
      if (m.blueprint.grades[m.blueprint.grade] && m.blueprint.grades[m.blueprint.grade].features) {
        const features = m.blueprint.grades[m.blueprint.grade].features;
        for (const featureName in features) {
          if (Dist.Modifications.modifications[featureName].hidden) {
            this.setModification(m, featureName, bp.grades[bp.grade].features[featureName][0]);
          }
        }
      }
  
      this.updateModificationsString();
    }
  
    /**
     * Clear blueprint for a module
     * @param  {Object} m      The module for which to clear the blueprint
     */
    clearModuleBlueprint(m) {
      m.blueprint = {};
      this.updateModificationsString();
    }
  
    /**
     * Set special for a module
     * @param  {Object} m       The module for which to set the blueprint
     * @param  {Object} special The special
     */
    setModuleSpecial(m, special) {
      if (m.blueprint) {
        m.blueprint.special = special;
      }
      this.updatePowerGenerated()
        .updatePowerUsed()
        .recalculateMass()
        .updateJumpStats()
        .recalculateShield()
        .recalculateShieldCells()
        .recalculateArmour()
        .recalculateDps()
        .recalculateEps()
        .recalculateHps()
        .updateMovement();
    }
  
    /**
     * Clear special for a module
     * @param  {Object} m      The module for which to clear the blueprint
     */
    clearModuleSpecial(m) {
      this.setModuleSpecial(m, null);
    }
  
    /**
     * Set a modification value and update ship stats
     * @param {Object} m          The module to change
     * @param {Object} name       The name of the modification to change
     * @param {Number} value The new value of the modification.  The value of the modification is scaled to provide two decimal places of precision in an integer.  For example 1.23% is stored as 123
     * @param {bool}   sentfromui True if this update was sent from the UI
     * @param {bool}   isAbsolute True if value is an absolute value and not a
     *                            modification value
     */
    setModification(m, name, value, sentfromui, isAbsolute) {
      if (isNaN(value)) {
        // Value passed is invalid; reset it to 0
        value = 0;
      }
  
      if (isAbsolute) {
        m.setPretty(name, value, sentfromui);
      } else {
        // Resistance modifiers scale with the base value
        if (name == 'kinres' || name == 'thermres' || name == 'causres' || name == 'explres') {
          let baseValue = m.get(name, false);
          value = (1 - baseValue) * value;
        }
        m.setModValue(name, value, sentfromui);
      }
  
      // Handle special cases
      if (name === 'pgen') {
        // Power generation
        this.updatePowerGenerated();
      } else if (name === 'power') {
        // Power usage
        this.updatePowerUsed();
      } else if (name === 'mass') {
        // Mass
        this.recalculateMass();
        this.updateMovement();
        this.updateJumpStats();
      } else if (name === 'maxfuel') {
        this.updateJumpStats();
      } else if (name === 'optmass') {
        // Could be for any of thrusters, FSD or shield
        this.updateMovement();
        this.updateJumpStats();
        this.recalculateShield();
      } else if (name === 'optmul') {
        // Could be for any of thrusters, FSD or shield
        this.updateMovement();
        this.updateJumpStats();
        this.recalculateShield();
      } else if (name === 'shieldboost') {
        this.recalculateShield();
      } else if (name === 'hullboost' || name === 'hullreinforcement' || name === 'modulereinforcement') {
        this.recalculateArmour();
      } else if (name === 'shieldreinforcement') {
        this.recalculateShieldCells();
      } else if (name === 'burst' || name == 'burstrof' || name === 'clip' || name === 'damage' || name === 'distdraw' || name === 'jitter' || name === 'piercing' || name === 'range' || name === 'reload' || name === 'rof' || name === 'thermload') {
        this.recalculateDps();
        this.recalculateHps();
        this.recalculateEps();
      } else if (name === 'explres' || name === 'kinres' || name === 'thermres') {
        // Could be for shields or armour
        this.recalculateArmour();
        this.recalculateShield();
      } else if (name === 'engcap') {
        // Might have resulted in a change in boostability
        this.updateMovement();
      }
    }
  
    /**
     * Builds/Updates the ship instance with the ModuleUtils[comps] passed in.
     * @param {Object} comps Collection of ModuleUtils used to build the ship
     * @param {array} priorities Slot priorities
     * @param {Array} enabled    Slot active/inactive
     * @param {Array} mods       Dist.Modifications
     * @param {Array} blueprints Blueprints for modifications
     * @return {this} The current ship instance for chaining
     */
    buildWith(comps, priorities, enabled, mods, blueprints) {
      let internal = this.internal,
          standard = this.standard,
          hps = this.hardpoints,
          cl = standard.length,
          i, l;
  
      // Reset Cumulative stats
      this.fuelCapacity = 0;
      this.cargoCapacity = 0;
      this.passengerCapacity = 0;
      this.ladenMass = 0;
      this.armour = this.baseArmour;
      this.shield = this.baseShieldStrength;
      this.shieldCells = 0;
      this.totalCost = this.m.incCost ? this.m.discountedCost : 0;
      this.unladenMass = this.hullMass;
      this.totalDpe = 0;
      this.totalAbsDpe = 0;
      this.totalExplDpe = 0;
      this.totalKinDpe = 0;
      this.totalThermDpe = 0;
      this.totalDps = 0;
      this.totalAbsDps = 0;
      this.totalExplDps = 0;
      this.totalKinDps = 0;
      this.totalThermDps = 0;
      this.totalSDps = 0;
      this.totalAbsSDps = 0;
      this.totalExplSDps = 0;
      this.totalKinSDps = 0;
      this.totalThermSDps = 0;
      this.totalEps = 0;
      this.totalHps = 0;
      this.shieldExplRes = 0;
      this.shieldKinRes = 0;
      this.shieldThermRes = 0;
      this.hullExplRes = 0;
      this.hullKinRes = 0;
      this.hullThermRes = 0;
  
      this.bulkheads.m = null;
      this.useBulkhead(comps && comps.bulkheads ? comps.bulkheads : 0, true);
      this.bulkheads.m.mods = mods && mods[0] ? mods[0] : {};
      if (blueprints && blueprints[0]) {
        this.bulkheads.m.blueprint = getBlueprint(blueprints[0].fdname, this.bulkheads.m);
        this.bulkheads.m.blueprint.grade = blueprints[0].grade;
        this.bulkheads.m.blueprint.special = blueprints[0].special;
      } else {
        this.bulkheads.m.blueprint = {};
      }
      this.cargoHatch.priority = priorities ? priorities[0] * 1 : 0;
      this.cargoHatch.enabled = enabled ? enabled[0] * 1 : true;
  
      for (i = 0; i < cl; i++) {
        standard[i].cat = 0;
        standard[i].priority = priorities && priorities[i + 1] ? priorities[i + 1] * 1 : 0;
        standard[i].type = 'SYS';
        standard[i].m = null; // Resetting 'old' module if there was one
        standard[i].discountedCost = 0;
        if (comps) {
          let module = ModuleUtils.standard(i, comps.standard[i]);
          if (module != null) {
            module.mods = mods && mods[i + 1] ? mods[i + 1] : {};
            if (blueprints && blueprints[i + 1]) {
              module.blueprint = getBlueprint(blueprints[i + 1].fdname, module);
              module.blueprint.grade = blueprints[i + 1].grade;
              module.blueprint.special = blueprints[i + 1].special;
            } else {
              module.blueprint = {};
            }
          }
          this.use(standard[i], module, true);
        }
        standard[i].enabled = enabled ? enabled[i + 1] * 1 : true;
      }
  
      standard[1].type = 'ENG'; // Thrusters
      standard[2].type = 'ENG'; // FSD
      cl++; // Increase accounts for Cargo Scoop
  
      for (i = 0, l = hps.length; i < l; i++) {
        hps[i].cat = 1;
        hps[i].priority = priorities && priorities[cl + i] ? priorities[cl + i] * 1 : 0;
        hps[i].type = hps[i].maxClass ? 'WEP' : 'SYS';
        hps[i].m = null; // Resetting 'old' modul if there was one
        hps[i].discountedCost = 0;
  
        if (comps && comps.hardpoints[i] !== 0) {
          let module = ModuleUtils.hardpoints(comps.hardpoints[i]);
          if (module != null) {
            module.mods = mods && mods[cl + i] ? mods[cl + i] : {};
            if (blueprints && blueprints[cl + i]) {
              module.blueprint = getBlueprint(blueprints[cl + i].fdname, module);
              module.blueprint.grade = blueprints[cl + i].grade;
              module.blueprint.special = blueprints[cl + i].special;
            } else {
              module.blueprint = {};
            }
          }
          this.use(hps[i], module, true);
        }
        hps[i].enabled = enabled ? enabled[cl + i] * 1 : true;
      }
  
      cl += hps.length; // Increase accounts for hardpoints
  
      for (i = 0, l = internal.length; i < l; i++) {
        internal[i].cat = 2;
        internal[i].priority = priorities && priorities[cl + i] ? priorities[cl + i] * 1 : 0;
        internal[i].type = 'SYS';
        internal[i].m = null; // Resetting 'old' modul if there was one
        internal[i].discountedCost = 0;
  
        if (comps && comps.internal[i] !== 0) {
          let module = ModuleUtils.internal(comps.internal[i]);
          if (module != null) {
            module.mods = mods && mods[cl + i] ? mods[cl + i] : {};
            if (blueprints && blueprints[cl + i]) {
              module.blueprint = getBlueprint(blueprints[cl + i].fdname, module);
              module.blueprint.grade = blueprints[cl + i].grade;
              module.blueprint.special = blueprints[cl + i].special;
            } else {
              module.blueprint = {};
            }
          }
          this.use(internal[i], module, true);
        }
        internal[i].enabled = enabled ? enabled[cl + i] * 1 : true;
      }
  
      // Update aggragated stats
      if (comps) {
        this.updatePowerGenerated()
          .updatePowerUsed()
          .recalculateMass()
          .updateJumpStats()
          .recalculateShield()
          .recalculateShieldCells()
          .recalculateArmour()
          .recalculateDps()
          .recalculateEps()
          .recalculateHps()
          .updateMovement();
      }
  
      return this.updatePowerPrioritesString().updatePowerEnabledString().updateModificationsString();
    }
  
    /**
     * Updates an existing ship instance's slots with modules determined by the
     * code.
     *
     * @param {String}  serializedString  The string to deserialize
     * @return {this} The current ship instance for chaining
     */
    buildFrom(serializedString) {
      if (!serializedString) {
        // Empty serialized string; nothing to do
        return this;
      }
  
      let standard = new Array(this.standard.length),
          hardpoints = new Array(this.hardpoints.length),
          internal = new Array(this.internal.length),
          modifications = new Array(1 + this.standard.length + this.hardpoints.length + this.internal.length),
          blueprints = new Array(1 + this.standard.length + this.hardpoints.length + this.internal.length),
          parts = serializedString.split('.'),
          priorities = null,
          enabled = null,
          code = parts[0];
  
      // Code has a version ID embedded as the first character (if it is alphabetic)
      let version;
      if (code && code.match(/^[0-4]/)) {
        // Starting with bulkhead number is version 1
        version = 1;
      } else {
        // Version 2 (current version)
        version = 2;
        if (code) {
          code = code.substring(1);
        }
      }
  
      if (parts[1]) {
        enabled = LZString.decompressFromBase64(Utils.fromUrlSafe(parts[1])).split('');
      }
  
      if (parts[2]) {
        priorities = LZString.decompressFromBase64(Utils.fromUrlSafe(parts[2])).split('');
      }
  
      if (parts[3]) {
        const modstr = parts[3];
        if (modstr.match(':')) {
          this.decodeModificationsString(modstr, modifications);
        } else {
          try {
            this.decodeModificationsStruct(zlib.gunzipSync(new Buffer(Utils.fromUrlSafe(modstr), 'base64')), modifications, blueprints);
          } catch (err) {
            // Could be out-of-date URL; ignore
          }
        }
      }
  
      decodeToArray(code, internal, decodeToArray(code, hardpoints, decodeToArray(code, standard, 1)));
  
      if (version != 2) {
        // Alter as required due to changes in the (build) code from one version to the next
        this.upgradeInternals(internal, 1 + this.standard.length + this.hardpoints.length, priorities, enabled, modifications, blueprints, version);
      }
  
      return this.buildWith(
        {
          bulkheads: code.charAt(0) * 1,
          standard,
          hardpoints,
          internal
        },
        priorities,
        enabled,
        modifications,
        blueprints,
      );
    };
  
    /**
     * Empties all hardpoints and utility slots
     * @return {this} The current ship instance for chaining
     */
    emptyHardpoints() {
      for (let i = this.hardpoints.length; i--;) {
        this.use(this.hardpoints[i], null);
      }
      return this;
    }
  
    /**
     * Empties all Internal slots
     * @return {this} The current ship instance for chaining
     */
    emptyInternal() {
      for (let i = this.internal.length; i--;) {
        this.use(this.internal[i], null);
      }
      return this;
    }
  
    /**
     * Empties all Utility slots
     * @return {this} The current ship instance for chaining
     */
    emptyUtility() {
      for (let i = this.hardpoints.length; i--;) {
        if (!this.hardpoints[i].maxClass) {
          this.use(this.hardpoints[i], null);
        }
      }
      return this;
    }
  
    /**
     * Empties all hardpoints
     * @return {this} The current ship instance for chaining
     */
    emptyWeapons() {
      for (let i = this.hardpoints.length; i--;) {
        if (this.hardpoints[i].maxClass) {
          this.use(this.hardpoints[i], null);
        }
      }
      return this;
    }
  
    /**
     * Optimize for the lower mass build that can still boost and power the ship
     * without power management.
     * @param  {Object} m Standard Module overrides
     * @return {this} The current ship instance for chaining
     */
    optimizeMass(m) {
      return this.emptyHardpoints().emptyInternal().useLightestStandard(m);
    }
  
    /**
     * Include/Exclude a item/slot in cost calculations
     * @param {Object} item       Slot or item
     * @param {boolean} included  Cost included
     * @return {this} The current ship instance for chaining
     */
    setCostIncluded(item, included) {
      if (item.incCost != included && item.m) {
        this.totalCost += included ? item.discountedCost : -item.discountedCost;
      }
      item.incCost = included;
      return this;
    }
  
    /**
     * Set slot active/inactive
     * @param {Object} slot    Slot model
     * @param {boolean} enabled  True - active
     * @return {this} The current ship instance for chaining
     */
    setSlotEnabled(slot, enabled) {
      if (slot.enabled != enabled) { // Enabled state is changing
        slot.enabled = enabled;
        if (slot.m) {
          if (ModuleUtils.isShieldGenerator(slot.m.grp) || slot.m.grp === 'sb') {
            this.recalculateShield();
          }
          if (slot.m.grp === 'scb') {
            this.recalculateShieldCells();
          }
  
          this.updatePowerUsed();
          this.updatePowerEnabledString();
  
          if (slot.m.getDps()) {
            this.recalculateDps();
          }
  
          if (slot.m.getHps()) {
            this.recalculateHps();
          }
  
          if (slot.m.getEps()) {
            this.recalculateEps();
          }
        }
      }
      return this;
    }
  
    /**
     * Will change the priority of the specified slot if the new priority is valid
     * @param  {Object} slot        The slot to be updated
     * @param  {Number} newPriority The new priority to be set
     * @return {boolean}            Returns true if the priority was changed (within range)
     */
    setSlotPriority(slot, newPriority) {
      if (newPriority >= 0 && newPriority < this.priorityBands.length) {
        slot.priority = newPriority;
        this.updatePowerPrioritesString();
  
        if (slot.enabled) { // Only update power if the slot is enabled
          this.updatePowerUsed();
        }
        return true;
      }
      return false;
    }
  
    /**
     * Updates the ship's cumulative and aggregated stats based on the module change.
     * @param  {Object} slot            The slot being updated
     * @param  {Object} n               The new module (may be null)
     * @param  {Object} old             The old module (may be null)
     * @param  {boolean} preventUpdate  If true the global ship state will not be updated
     * @return {this}                   The ship instance (for chaining operations)
     */
    updateStats(slot, n, old, preventUpdate) {
      let powerGeneratedChange = slot == this.standard[0];
      let powerDistributorChange = slot == this.standard[4];
      let powerUsedChange = false;
      let dpsChanged = n && n.getDps() || old && old.getDps();
      let epsChanged = n && n.getEps() || old && old.getEps();
      let hpsChanged = n && n.getHps() || old && old.getHps();
  
      let armourChange = (slot === this.bulkheads) ||
        (n && n.grp === 'hr') || (old && old.grp === 'hr') ||
        (n && n.grp === 'ghrp') || (old && old.grp === 'ghrp') ||
        (n && n.grp == 'mahr') || (old && old.grp == 'mahr') ||
        (n && n.grp === 'mrp') || (old && old.grp === 'mrp') ||
        (n && n.grp === 'gmrp') || (old && old.grp == 'gmrp');
  
      let shieldChange = (n && n.grp === 'bsg') || (old && old.grp === 'bsg') || (n && n.grp === 'psg') || (old && old.grp === 'psg') || (n && n.grp === 'sg') || (old && old.grp === 'sg') || (n && n.grp === 'sb') || (old && old.grp === 'sb') || (old && old.grp === 'gsrp') || (n && n.grp === 'gsrp');
  
      let shieldCellsChange = (n && n.grp === 'scb') || (old && old.grp === 'scb');
  
      if (old) {  // Old modul now being removed
        if (slot.incCost && old.cost) {
          this.totalCost -= old.cost * this.moduleCostMultiplier;
        }
  
        if (old.getPowerUsage() > 0 && slot.enabled) {
          powerUsedChange = true;
        }
      }
  
      if (n) {
        if (slot.incCost && n.cost) {
          this.totalCost += n.cost * this.moduleCostMultiplier;
        }
  
        if (n.power && slot.enabled) {
          powerUsedChange = true;
        }
      }
  
      if (!preventUpdate) {
        // Must recalculate mass first, as movement, jump etc. relies on it
        this.recalculateMass();
        if (dpsChanged) {
          this.recalculateDps();
        }
        if (epsChanged) {
          this.recalculateEps();
        }
        if (hpsChanged) {
          this.recalculateHps();
        }
        if (powerGeneratedChange) {
          this.updatePowerGenerated();
        }
        if (powerUsedChange) {
          this.updatePowerUsed();
        }
        if (armourChange) {
          this.recalculateArmour();
        }
        if (shieldChange) {
          this.recalculateShield();
        }
        if (shieldCellsChange) {
          this.recalculateShieldCells();
        }
        this.updateMovement();
        this.updateJumpStats();
      }
      return this;
    }
  
    /**
     * Calculate damage per second and related items for weapons
     * @return {this} The ship instance (for chaining operations)
     */
    recalculateDps() {
      let totalDpe = 0;
      let totalAbsDpe = 0;
      let totalExplDpe = 0;
      let totalKinDpe = 0;
      let totalThermDpe = 0;
      let totalDps = 0;
      let totalAbsDps = 0;
      let totalExplDps = 0;
      let totalKinDps = 0;
      let totalThermDps = 0;
      let totalSDps = 0;
      let totalAbsSDps = 0;
      let totalExplSDps = 0;
      let totalKinSDps = 0;
      let totalThermSDps = 0;
  
      for (let slotNum in this.hardpoints) {
        const slot = this.hardpoints[slotNum];
        if (slot.m && slot.enabled && slot.type === 'WEP' && slot.m.getDps()) {
          const dpe = slot.m.getEps() === 0 ? 0 : slot.m.getDps() / slot.m.getEps();
          const dps = slot.m.getDps();
          const sdps = slot.m.getClip() ? (slot.m.getClip() * slot.m.getDps() / slot.m.getRoF()) / ((slot.m.getClip() / slot.m.getRoF()) + slot.m.getReload()) : dps;
  
          totalDpe += dpe;
          totalDps += dps;
          totalSDps += sdps;
          if (slot.m.getDamageDist()) {
            if (slot.m.getDamageDist().A) {
              totalAbsDpe += dpe * slot.m.getDamageDist().A;
              totalAbsDps += dps * slot.m.getDamageDist().A;
              totalAbsSDps += sdps * slot.m.getDamageDist().A;
            }
            if (slot.m.getDamageDist().E) {
              totalExplDpe += dpe * slot.m.getDamageDist().E;
              totalExplDps += dps * slot.m.getDamageDist().E;
              totalExplSDps += sdps * slot.m.getDamageDist().E;
            }
            if (slot.m.getDamageDist().K) {
              totalKinDpe += dpe * slot.m.getDamageDist().K;
              totalKinDps += dps * slot.m.getDamageDist().K;
              totalKinSDps += sdps * slot.m.getDamageDist().K;
            }
            if (slot.m.getDamageDist().T) {
              totalThermDpe += dpe * slot.m.getDamageDist().T;
              totalThermDps += dps * slot.m.getDamageDist().T;
              totalThermSDps += sdps * slot.m.getDamageDist().T;
            }
          }
        }
      }
  
      this.totalDpe = totalDpe;
      this.totalAbsDpe = totalAbsDpe;
      this.totalExplDpe = totalExplDpe;
      this.totalKinDpe = totalKinDpe;
      this.totalThermDpe = totalThermDpe;
      this.totalDps = totalDps;
      this.totalAbsDps = totalAbsDps;
      this.totalExplDps = totalExplDps;
      this.totalKinDps = totalKinDps;
      this.totalThermDps = totalThermDps;
      this.totalSDps = totalSDps;
      this.totalAbsSDps = totalAbsSDps;
      this.totalExplSDps = totalExplSDps;
      this.totalKinSDps = totalKinSDps;
      this.totalThermSDps = totalThermSDps;
  
      return this;
    }
  
    /**
     * Calculate heat per second for weapons
     * @return {this} The ship instance (for chaining operations)
     */
    recalculateHps() {
      let totalHps = 0;
  
      for (let slotNum in this.hardpoints) {
        const slot = this.hardpoints[slotNum];
        if (slot.m && slot.enabled && slot.type === 'WEP' && slot.m.getHps()) {
          totalHps += slot.m.getHps();
        }
      }
      this.totalHps = totalHps;
  
      return this;
    }
  
    /**
     * Calculate energy per second for weapons
     * @return {this} The ship instance (for chaining operations)
     */
    recalculateEps() {
      let totalEps = 0;
  
      for (let slotNum in this.hardpoints) {
        const slot = this.hardpoints[slotNum];
        if (slot.m && slot.enabled && slot.m.getEps() && slot.type === 'WEP') {
          totalEps += slot.m.getEps();
        }
      }
      this.totalEps = totalEps;
  
      return this;
    }
  
    /**
     * Update power calculations when amount generated changes
     * @return {this} The ship instance (for chaining operations)
     */
    updatePowerGenerated() {
      this.powerAvailable = this.standard[0].m.getPowerGeneration();
      return this;
    };
  
    /**
     * Update power calculations when amount consumed changes
     * @return {this} The ship instance (for chaining operations)
     */
    updatePowerUsed() {
      let bands = [
        { deployed: 0, retracted: 0, },
        { deployed: 0, retracted: 0, },
        { deployed: 0, retracted: 0, },
        { deployed: 0, retracted: 0, },
        { deployed: 0, retracted: 0, }
      ];
  
      if (this.cargoHatch.enabled) {
        bands[this.cargoHatch.priority].retracted += this.cargoHatch.m.getPowerUsage();
      }
  
      for (let slotNum in this.standard) {
        const slot = this.standard[slotNum];
        if (slot.m && slot.enabled) {
          bands[slot.priority][powerUsageType(slot, slot.m)] += slot.m.getPowerUsage();
        }
      }
  
      for (let slotNum in this.internal) {
        const slot = this.internal[slotNum];
        if (slot.m && slot.enabled) {
          bands[slot.priority][powerUsageType(slot, slot.m)] += slot.m.getPowerUsage();
        }
      }
  
      for (let slotNum in this.hardpoints) {
        const slot = this.hardpoints[slotNum];
        if (slot.m && slot.enabled) {
          bands[slot.priority][powerUsageType(slot, slot.m)] += slot.m.getPowerUsage();
        }
      }
  
      // Work out the running totals
      let prevRetracted = 0, prevDeployed = 0;
      for (let i = 0, l = bands.length; i < l; i++) {
        let band = bands[i];
        prevRetracted = band.retractedSum = prevRetracted + band.retracted;
        prevDeployed = band.deployedSum = prevDeployed + band.deployed + band.retracted;
      }
  
      // Update global stats
      this.powerRetracted = prevRetracted;
      this.powerDeployed = prevDeployed;
      this.priorityBands = bands;
  
      return this;
    }
  
    /**
     * Eecalculate mass
     * @return {this} The ship instance (for chaining operations)
     */
    recalculateMass() {
      let unladenMass = this.hullMass;
      let cargoCapacity = 0;
      let fuelCapacity = 0;
      let passengerCapacity = 0;
  
      unladenMass += this.bulkheads.m.getMass();
  
      let slots = this.standard.concat(this.internal, this.hardpoints);
      // TODO: create class for slot and also add slot.get
      // handle unladen mass
      unladenMass += chain(slots)
        .map(slot => slot.m ? slot.m.get('mass') : null)
        .map(mass => mass || 0)
        .reduce((sum, mass) => sum + mass)
        .value();
  
      // handle fuel capacity
      fuelCapacity += chain(slots)
        .map(slot => slot.m ? slot.m.get('fuel') : null)
        .map(fuel => fuel || 0)
        .reduce((sum, fuel) => sum + fuel)
        .value();
  
      // handle cargo capacity
      cargoCapacity += chain(slots)
        .map(slot => slot.m ? slot.m.get('cargo') : null)
        .map(cargo => cargo || 0)
        .reduce((sum, cargo) => sum + cargo)
        .value();
  
      // handle passenger capacity
      passengerCapacity += chain(slots)
        .map(slot => slot.m ? slot.m.get('passengers') : null)
        .map(passengers => passengers || 0)
        .reduce((sum, passengers) => sum + passengers)
        .value();
  
      // Update global stats
      this.unladenMass = unladenMass;
      this.cargoCapacity = cargoCapacity;
      this.fuelCapacity = fuelCapacity;
      this.passengerCapacity = passengerCapacity;
      this.ladenMass = unladenMass + fuelCapacity + cargoCapacity;
  
      return this;
    }
  
    /**
     * Update movement values
     * @return {this} The ship instance (for chaining operations)
     */
    updateMovement() {
      this.speeds = Calc.speed(this.unladenMass + this.fuelCapacity, this.speed, this.standard[1].m, this.pipSpeed);
      this.topSpeed = this.speeds[4];
      this.topBoost = this.canBoost(0, 0) ? this.speeds[4] * this.boost / this.speed : 0;
  
      this.pitches = Calc.pitch(this.unladenMass + this.fuelCapacity, this.pitch, this.standard[1].m, this.pipSpeed);
      this.topPitch = this.pitches[4];
  
      this.rolls = Calc.roll(this.unladenMass + this.fuelCapacity, this.roll, this.standard[1].m, this.pipSpeed);
      this.topRoll = this.rolls[4];
  
      this.yaws = Calc.yaw(this.unladenMass + this.fuelCapacity, this.yaw, this.standard[1].m, this.pipSpeed);
      this.topYaw = this.yaws[4];
  
      return this;
    }
  
    /**
     * Update shield
     * @return {this} The ship instance (for chaining operations)
     */
    recalculateShield() {
      // Obtain shield metrics with 0 pips to sys (parts affected by SYS aren't used here)
      const metrics = Calc.shieldMetrics(this, 0);
  
      this.shield = metrics.generator ? metrics.generator + metrics.boosters + metrics.addition : 0;
      this.shieldExplRes = this.shield > 0 ? 1 - metrics.explosive.total : null;
      this.shieldKinRes = this.shield > 0 ?  1 - metrics.kinetic.total : null;
      this.shieldThermRes = this.shield > 0 ?  1 - metrics.thermal.total : null;
      return this;
    }
  
    /**
     * Update shield cells
     * @return {this} The ship instance (for chaining operations)
     */
    recalculateShieldCells() {
      let shieldCells = 0;
  
      for (let slot of this.internal) {
        if (slot.m && slot.m.grp == 'scb') {
          // There is currently a bug with Elite where you can have a clip > 1 thanks to engineering but it doesn't do anything,
          // so we need to hard-code clip to 1
          shieldCells += slot.m.getShieldReinforcement() * slot.m.getDuration() * (slot.m.getAmmo() + 1);
        }
      }
  
      this.shieldCells = shieldCells;
  
      return this;
    }
  
    /**
     * Update armour and hull resistances
     * @return {this} The ship instance (for chaining operations)
     */
    recalculateArmour() {
      // Armour from bulkheads
      let metrics = Calc.armourMetrics(this);
  
      this.armour = metrics.total ? metrics.total : 0;
      this.modulearmour = metrics.modulearmour;
      this.moduleprotection = metrics.moduleprotection;
      this.hullExplRes = 1 - metrics.explosive.total;
      this.hullKinRes = 1 - metrics.kinetic.total;
      this.hullThermRes = 1 - metrics.thermal.total;
      this.hullCausRes = 1 - metrics.caustic.total;
      return this;
    }
  
    /**
     * Jump Range and total range calculations
     * @return {this} The ship instance (for chaining operations)
     */
    updateJumpStats() {
      let fsd = this.standard[2].m;   // Frame Shift Drive;
      let { unladenMass, fuelCapacity } = this;
      this.unladenRange = this.calcUnladenRange(); // Includes fuel weight for jump
      this.fullTankRange = Calc.jumpRange(unladenMass + fuelCapacity, fsd, fuelCapacity, this); // Full Tank
      this.ladenRange = this.calcLadenRange(); // Includes full tank and caro
      this.unladenFastestRange = Calc.totalJumpRange(unladenMass + this.fuelCapacity, fsd, fuelCapacity, this);
      this.ladenFastestRange = Calc.totalJumpRange(unladenMass + this.fuelCapacity + this.cargoCapacity, fsd, fuelCapacity, this);
      this.maxJumpCount = Math.ceil(fuelCapacity / fsd.getMaxFuelPerJump());
      return this;
    }
  
    /**
     * Update the serialized power priorites string
     * @return {this} The ship instance (for chaining operations)
     */
    updatePowerPrioritesString() {
      let priorities = [this.cargoHatch.priority];
  
      for (let slot of this.standard) {
        priorities.push(slot.priority);
      }
      for (let slot of this.hardpoints) {
        priorities.push(slot.priority);
      }
      for (let slot of this.internal) {
        priorities.push(slot.priority);
      }
  
      this.serialized.priorities = LZString.compressToBase64(priorities.join(''));
      return this;
    }
  
    /**
     * Update the serialized power active/inactive string
     * @return {this} The ship instance (for chaining operations)
     */
    updatePowerEnabledString() {
      let enabled = [this.cargoHatch.enabled ? 1 : 0];
  
      for (let slot of this.standard) {
        enabled.push(slot.enabled ? 1 : 0);
      }
      for (let slot of this.hardpoints) {
        enabled.push(slot.enabled ? 1 : 0);
      }
      for (let slot of this.internal) {
        enabled.push(slot.enabled ? 1 : 0);
      }
  
      this.serialized.enabled = LZString.compressToBase64(enabled.join(''));
      return this;
    }
  
    /**
     * Populate the modifications array with modification values from the code
     * @param {String} code    Serialized modification code
     * @param {Array}  arr     Modification array
     */
    decodeModificationsString(code, arr) {
      let moduleMods = code.split(',');
      for (let i = 0; i < arr.length; i++) {
        arr[i] = {};
        if (moduleMods.length > i && moduleMods[i] != '') {
          let mods = moduleMods[i].split(';');
          for (let j = 0; j < mods.length; j++) {
            let modElements = mods[j].split(':');
            if (modElements[0].match('[0-9]+')) {
              const modification = _.find(Dist.Modifications.modifications, function(o) { return o.id === modElements[0]; });
              if (modification != null) arr[i][modification.name] = Number(modElements[1]);
            } else {
              arr[i][modElements[0]] = Number(modElements[1]);
            }
          }
        }
      }
    }
  
    /**
     * Update the modifications string.
     * This is a binary structure.  It starts with a byte that identifies a slot, with bulkheads being ID 0 and moving through
     * standard modules, hardpoints, and finally internal modules.  It then contains one or more modifications, with each
     * modification being a one-byte modification ID and at two-byte modification value.  Modification IDs are based on the array
     * in Dist.Modifications.modifications.  The list of modifications is terminated by a modification ID of -1.  The structure then repeats
     * for the next module, and the next, and is terminated by a slot ID of -1.
     * @return {this} The ship instance (for chaining operations)
     */
    updateModificationsString() {
      // Start off by gathering the information that we need
      let slots = new Array();
      let blueprints = new Array();
      let specials = new Array();
  
      let bulkheadMods = new Array();
      let bulkheadBlueprint = null;
      if (this.bulkheads.m && this.bulkheads.m.mods) {
        for (let modKey in this.bulkheads.m.mods) {
          // Filter out invalid modifications
          if (Dist.Modifications.modules['bh'] && Dist.Modifications.modules['bh'].modifications.indexOf(modKey) != -1) {
            bulkheadMods.push({ id: Dist.Modifications.modifications[modKey].id, value: this.bulkheads.m.getModValue(modKey, true) });
          }
        }
        bulkheadBlueprint = this.bulkheads.m.blueprint;
      }
      slots.push(bulkheadMods);
      blueprints.push(bulkheadBlueprint);
      specials.push(bulkheadBlueprint ? bulkheadBlueprint.special : null);
  
      for (let slot of this.standard) {
        let slotMods = new Array();
        if (slot.m && slot.m.mods) {
          for (let modKey in slot.m.mods) {
            // Filter out invalid modifications
            if (Dist.Modifications.modules[slot.m.grp] && Dist.Modifications.modules[slot.m.grp].modifications.indexOf(modKey) != -1) {
              slotMods.push({ id: Dist.Modifications.modifications[modKey].id, value: slot.m.getModValue(modKey, true) });
            }
          }
        }
        slots.push(slotMods);
        blueprints.push(slot.m ? slot.m.blueprint : null);
        specials.push(slot.m && slot.m.blueprint ? slot.m.blueprint.special : null);
      }
  
      for (let slot of this.hardpoints) {
        let slotMods = new Array();
        if (slot.m && slot.m.mods) {
          for (let modKey in slot.m.mods) {
            // Filter out invalid modifications
            if (Dist.Modifications.modules[slot.m.grp] && Dist.Modifications.modules[slot.m.grp].modifications.indexOf(modKey) != -1) {
              slotMods.push({ id: Dist.Modifications.modifications[modKey].id, value: slot.m.getModValue(modKey, true) });
            }
          }
        }
        slots.push(slotMods);
        blueprints.push(slot.m ? slot.m.blueprint : null);
        specials.push(slot.m && slot.m.blueprint ? slot.m.blueprint.special : null);
      }
  
      for (let slot of this.internal) {
        let slotMods = new Array();
        if (slot.m && slot.m.mods) {
          for (let modKey in slot.m.mods) {
            // Filter out invalid modifications
            if (Dist.Modifications.modules[slot.m.grp] && Dist.Modifications.modules[slot.m.grp].modifications.indexOf(modKey) != -1) {
              slotMods.push({ id: Dist.Modifications.modifications[modKey].id, value: slot.m.getModValue(modKey, true) });
            }
          }
        }
        slots.push(slotMods);
        blueprints.push(slot.m ? slot.m.blueprint : null);
        specials.push(slot.m && slot.m.blueprint ? slot.m.blueprint.special : null);
      }
  
      // Now work out the size of the binary buffer from our modifications array
      let bufsize = 0;
      for (let i = 0; i < slots.length; i++) {
        if (slots[i].length > 0 || (blueprints[i] && blueprints[i].id)) {
          // Length is 1 for the slot ID, 5 for each modification, 1 for the end marker of the modifications and 1 for the end marker of the slot
          bufsize = bufsize + 1 + (5 * slots[i].length) + 1 + 1;
  
          if (blueprints[i] && blueprints[i].id) {
            // Additional 10 for the blueprint and grade
            bufsize += 10;
          }
  
          if (specials[i]) {
            // Additional 5 for each special
            bufsize += 5;
          }
        }
      }
  
      if (bufsize > 0) {
        bufsize = bufsize + 1; // For end marker
        // Now create and populate the buffer
        let buffer = Buffer.alloc(bufsize);
        let curpos = 0;
        let i = 0;
        for (let slot of slots) {
          if (slot.length > 0 || (blueprints[i] && blueprints[i].id)) {
            buffer.writeInt8(i, curpos++);
            if (blueprints[i] && blueprints[i].id) {
              buffer.writeInt8(MODIFICATION_ID_BLUEPRINT, curpos++);
              buffer.writeInt32LE(blueprints[i].id, curpos);
              curpos += 4;
              buffer.writeInt8(MODIFICATION_ID_GRADE, curpos++);
              buffer.writeInt32LE(blueprints[i].grade, curpos);
              curpos += 4;
            }
            if (specials[i]) {
              buffer.writeInt8(MODIFICATION_ID_SPECIAL, curpos++);
              buffer.writeInt32LE(specials[i].id, curpos);
              curpos += 4;
            }
            for (let slotMod of slot) {
              buffer.writeInt8(slotMod.id, curpos++);
              if (isNaN(slotMod.value)) {
                // Need to write the string with exactly four characters, so pad with whitespace
                buffer.write(('    ' + slotMod.value).slice(-4), curpos, 4);
              } else {
                buffer.writeInt32LE(slotMod.value, curpos);
              }
              const modification = Lodash.find(Dist.Modifications.modifications, function(o) { return o.id === slotMod.id; });
              // console.log('ENCODE Slot ' + i + ': ' + modification.name + ' = ' + slotMod.value);
              curpos += 4;
            }
            buffer.writeInt8(MODIFICATION_ID_DONE, curpos++);
          }
          i++;
        }
        if (curpos > 0) {
          buffer.writeInt8(SLOT_ID_DONE, curpos++);
        }
  
        this.serialized.modifications = zlib.gzipSync(buffer).toString('base64');
        // console.log(this.serialized.modifications)
      } else {
        this.serialized.modifications = null;
      }
      return this;
    }
  
    /**
     * Populate the modifications array with modification values from the code.
     * See updateModificationsString() for details of the structure.
     * @param {String} buffer         Buffer holding modification info
     * @param {Array}  modArr         Modification array
     * @param {Array}  blueprintArr    Blueprint array
     */
    decodeModificationsStruct(buffer, modArr, blueprintArr) {
      let curpos = 0;
      let slot = buffer.readInt8(curpos++);
      while (slot != SLOT_ID_DONE) {
        let modifications = {};
        let blueprint = {};
        let modificationId = buffer.readInt8(curpos++);
        while (modificationId != MODIFICATION_ID_DONE) {
          let modificationValue;
          if (modificationId === 40) {
            // Type is special, in that it's a character string
            modificationValue = buffer.toString('utf8', curpos, curpos + 4).trim();
          } else {
            modificationValue = buffer.readInt32LE(curpos);
          }
          curpos += 4;
          // There are a number of 'special' modification IDs, check for them here
          if (modificationId === MODIFICATION_ID_BLUEPRINT) {
            if (modificationValue !== 0) {
              blueprint = Object.assign(blueprint, _.find(Dist.Modifications.blueprints, function(o) { return o.id === modificationValue; }));
            }
          } else if (modificationId === MODIFICATION_ID_GRADE) {
            if (modificationValue !== 0) {
              blueprint.grade = modificationValue;
            }
          } else if (modificationId === MODIFICATION_ID_SPECIAL) {
            blueprint.special = _.find(Dist.Modifications.specials, function(o) { return o.id === modificationValue; });
          } else {
            const modification = _.find(Dist.Modifications.modifications, function(o) { return o.id === modificationId; });
            // console.log('DECODE Slot ' + slot + ': ' + modification.name + ' = ' + modificationValue);
            modifications[modification.name] = modificationValue;
          }
          modificationId = buffer.readInt8(curpos++);
        }
        modArr[slot] = modifications;
        if (blueprint.id) {
          blueprintArr[slot] = blueprint;
        }
        slot = buffer.readInt8(curpos++);
      }
    }
  
    /**
     * Update a slot with a the modul if the id is different from the current id for this slot.
     * Has logic handling ModuleUtils that you may only have 1 of (Shield Generator or Refinery).
     *
     * @param {Object}  slot            The modul slot
     * @param {Object}  mdef            Properties for the selected modul
     * @param {boolean} preventUpdate   If true, do not update aggregated stats
     * @return {this} The ship instance (for chaining operations)
     */
    use(slot, mdef, preventUpdate) {
      // See if the module passed in is really a module or just a definition, and fix it accordingly so that we have a module instance
      let m;
      if (mdef == null) {
        m = null;
      } else if (mdef instanceof Module) {
        m = mdef;
      } else {
        m = new Module({ grp: mdef.grp, id: mdef.id });
      }
  
      if (slot.m != m) { // Selecting a different modul
        // Slot is an internal slot, is not being emptied, and the selected modul group/type must be of unique
        if (slot.cat == 2 && m && UNIQUE_MODULES.indexOf(m.grp) != -1) {
          // Find another internal slot that already has this type/group installed
          let similarSlot = this.findInternalByGroup(m.grp);
          // If another slot has an installed modul with of the same type
          if (!preventUpdate && similarSlot && similarSlot !== slot) {
            this.updateStats(similarSlot, null, similarSlot.m);
            similarSlot.m = null;  // Empty the slot
            similarSlot.discountedCost = 0;
          }
        }
        let oldModule = slot.m;
        slot.m = m;
        slot.enabled = true;
        slot.discountedCost = (m && m.cost) ? m.cost * this.moduleCostMultiplier : 0;
        this.updateStats(slot, m, oldModule, preventUpdate);
  
        switch (slot.cat) {
          case 0: this.serialized.standard = null; break;
          case 1: this.serialized.hardpoints = null; break;
          case 2: this.serialized.internal = null;
        }
      }
      return this;
    }
  
    /**
     * Mount the specified bulkhead type (index)
     * @param  {Number} index           Bulkhead index [0-4]
     * @param  {boolean} preventUpdate  Prevent summary update
     * @return {this} The ship instance (for chaining operations)
     */
    useBulkhead(index, preventUpdate) {
      let oldBulkhead = this.bulkheads.m;
      this.bulkheads.m = this.availCS.getBulkhead(index);
      this.bulkheads.discountedCost = this.bulkheads.m.cost * this.moduleCostMultiplier;
      this.updateStats(this.bulkheads, this.bulkheads.m, oldBulkhead, preventUpdate);
      this.serialized.standard = null;
      return this;
    }
  
    /**
     * Set all standard slots to use the speficied rating and class based on
     * the slot's max class
     * @param  {String} rating Module Rating (A-E)
     * @return {this} The ship instance (for chaining operations)
     */
    useStandard(rating) {
      for (let i = this.standard.length - 1; i--;) { // All except Fuel Tank
        let id = this.standard[i].maxClass + rating;
        this.use(this.standard[i], ModuleUtils.standard(i, id));
      }
      return this;
    }
  
    /**
     * Calculate the lowest possible mass for this ship.
     * @param  {Object} m Module override set (standard type => Module)
     * @return {number} The lowest possible mass for this ship
     */
    calcLowestPossibleMass(m) {
      m = m || {};
  
      let mass = this.hullMass;
      mass += m.pp ? m.pp.getMass() : ModuleUtils.standard(0, '2D').getMass();
      mass += m.th ? m.th.getMass() : ModuleUtils.standard(1, '2D').getMass();
      mass += m.fsd ? m.fsd.getMass() : ModuleUtils.standard(2, '2D').getMass();
      mass += m.ls ? m.ls.getMass() : ModuleUtils.standard(3, this.standard[3].maxClass + 'D').getMass() * 0.3; // Lightweight grade 4 mod reduces mass by up to 70%
      mass += m.pd ? m.pd.getMass() : ModuleUtils.standard(4, '1D').getMass();
      mass += m.s ? m.s.getMass() : ModuleUtils.standard(5, this.standard[5].maxClass + 'D').getMass() * 0.2; // Lightweight grade 5 mod reduces mass by up to 80%
      // Ignore fuel tank as it could be empty
      return mass;
    }
  
    /**
     * Use the lightest standard ModuleUtils unless otherwise specified
     * @param  {Object} m Module override set (standard type => module ID)
     * @return {this} The ship instance (for chaining operations)
     */
    useLightestStandard(m) {
      m = m || {};
  
      let standard = this.standard,
          // Find lightest Power Distributor that can still boost;
          pd = m.pd ? ModuleUtils.standard(4, m.pd) : this.availCS.lightestPowerDist(this.boostEnergy),
          fsd = ModuleUtils.standard(2, m.fsd || standard[2].maxClass + 'A'),
          ls = ModuleUtils.standard(3, m.ls || standard[3].maxClass + 'D'),
          s = ModuleUtils.standard(5, m.s || standard[5].maxClass + 'D'),
          ft = m.ft ? ModuleUtils.standard(6, m.ft) : standard[6].m, // Use existing fuel tank unless specified
          updated;
  
      this.useBulkhead(0)
        .use(standard[2], fsd)   // FSD
        .use(standard[3], ls)    // Life Support
        .use(standard[5], s)     // Sensors
        .use(standard[4], pd)    // Power Distributor
        .use(standard[6], ft);   // Fuel Tank
  
      // Turn off nearly everything
      if (m.fsdDisabled) this.setSlotEnabled(this.standard[2], false);
      if (m.pdDisabled) this.setSlotEnabled(this.standard[4], false);
      if (m.sDisabled) this.setSlotEnabled(this.standard[5], false);
  
      // Thrusters and Powerplant must be determined after all other ModuleUtils are mounted
      // Loop at least once to determine absolute lightest PD and TH
      do {
        updated = false;
        // Find lightest Thruster that still works for the ship at max mass
        let th = m.th ? ModuleUtils.standard(1, m.th) : this.availCS.lightestThruster(this.ladenMass);
        if (!isEqual.isEqual(th, standard[1].m)) {
          this.use(standard[1], th);
          updated = true;
        }
        // Find lightest Power plant that can power the ship
        let pp = m.pp ? ModuleUtils.standard(0, m.pp) : this.availCS.lightestPowerPlant(Math.max(this.powerRetracted, this.powerDeployed), m.ppRating);
  
        if (!isEqual.isEqual(pp, standard[0].m)) {
          this.use(standard[0], pp);
          updated = true;
        }
      } while (updated);
  
      return this;
    }
  
    /**
     * Fill all utility slots with the specified module
     * @param  {String} group   Group name
     * @param  {String} rating  Rating [A-I]
     * @param  {String} name    Module name
     * @param  {boolean} clobber Overwrite non-empty slots
     * @return {this} The ship instance (for chaining operations)
     */
    useUtility(group, rating, name, clobber) {
      let m = ModuleUtils.findHardpoint(group, 0, rating, name);
      for (let i = this.hardpoints.length; i--;) {
        if ((clobber || !this.hardpoints[i].m) && !this.hardpoints[i].maxClass) {
          this.use(this.hardpoints[i], m);
        }
      }
      return this;
    }
  
    /**
     * [useWeapon description]
     * @param  {[type]} group   [description]
     * @param  {[type]} mount   [description]
     * @param  {[type]} missile [description]
     * @param  {boolean} clobber Overwrite non-empty slots
     * @return {this} The ship instance (for chaining operations)
     */
    useWeapon(group, mount, missile, clobber) {
      let hps = this.hardpoints;
      for (let i = hps.length; i--;) {
        if (hps[i].maxClass) {
          let size = hps[i].maxClass, m;
          do {
            m = ModuleUtils.findHardpoint(group, size, null, null, mount, missile);
            if ((clobber || !hps[i].m) && m) {
              this.use(hps[i], m);
              break;
            }
          } while (!m && (--size > 0));
        }
      }
      return this;
    }
  
    /**
     * Upgrade information about internals with version changes
     * @param {array} internals     the internals from the ship code
     * @param {int}   offset        the offset of the internals information in the priorities etc. arrays
     * @param {array} priorities    the existing priorities arrray
     * @param {array} enableds      the existing enableds arrray
     * @param {array} modifications the existing modifications arrray
     * @param {array} blueprints    the existing blueprints arrray
     * @param {int}   version       the version of the information
     */
    upgradeInternals(internals, offset, priorities, enableds, modifications, blueprints, version) {
      if (version == 1) {
        // Version 2 reflects the addition of military slots.  this means that we need to juggle the internals and their
        // associated information around to make holes in the appropriate places
        for (let slotId = 0; slotId < this.internal.length; slotId++) {
          if (this.internal[slotId].eligible && this.internal[slotId].eligible.mrp) {
            // Found a restricted military slot - push all of the existing items down one to compensate for the fact that they didn't exist before now
            internals.push.apply(internals, [0].concat(internals.splice(slotId).slice(0, -1)));
  
            const offsetSlotId = offset + slotId;
  
            // Same for priorities etc.
            if (priorities) { priorities.push.apply(priorities, [0].concat(priorities.splice(offsetSlotId))); }
            if (enableds) { enableds.push.apply(enableds, [1].concat(enableds.splice(offsetSlotId))); }
            if (modifications) { modifications.push.apply(modifications, [null].concat(modifications.splice(offsetSlotId).slice(0, -1))); }
            if (blueprints) { blueprints.push.apply(blueprints, [null].concat(blueprints.splice(offsetSlotId).slice(0, -1))); }
          }
        }
        // Ensure that all items are the correct length
        internals.splice(Ships[this.id].slots.internal.length);
      }
    }
  }
  


/**
 * Obtain the model of a ship given its ED name
 * @param {string} edName the Elite name of the ship
 * @return {string} the Coriolis model of the ship
 */
 function _shipModelFromEDName(edName) {
    return SHIP_FD_NAME_TO_CORIOLIS_NAME[Object.keys(SHIP_FD_NAME_TO_CORIOLIS_NAME).find(elem => escape(elem).toLowerCase() === escape(edName).toLowerCase())];
  }
  
  /**
   * Obtain a ship's model from the companion API JSON
   * @param {object} json the companion API JSON
   * @return {string} the Coriolis model of the ship
   */
  function shipModelFromJson(json) {
    return _shipModelFromEDName(json.name || json.Ship);
  }

/**
 * Obtain a module given its FD Name
 * @param {string} fdname the FD Name of the module
 * @return {Module} the module
 */
 function _moduleFromFdName(fdname) {
    if (!fdname) return null;
    fdname = fdname.toLowerCase();
    // Check standard modules
    for (const grp in Dist.Modules.standard) {
      if (Dist.Modules.standard.hasOwnProperty(grp)) {
        for (const i in Dist.Modules.standard[grp]) {
          if (Dist.Modules.standard[grp][i].symbol && Dist.Modules.standard[grp][i].symbol.toLowerCase() === fdname) {
            // Found it
            return new Module({ template: Dist.Modules.standard[grp][i] });
          }
        }
      }
    }
  
    // Check hardpoint modules
    for (const grp in Dist.Modules.hardpoints) {
      if (Dist.Modules.hardpoints.hasOwnProperty(grp)) {
        for (const i in Dist.Modules.hardpoints[grp]) {
          if (Dist.Modules.hardpoints[grp][i].symbol && Dist.Modules.hardpoints[grp][i].symbol.toLowerCase() === fdname) {
            // Found it
            return new Module({ template: Dist.Modules.hardpoints[grp][i] });
          }
        }
      }
    }
  
    // Check internal modules
    for (const grp in Dist.Modules.internal) {
      if (Dist.Modules.internal.hasOwnProperty(grp)) {
        for (const i in Dist.Modules.internal[grp]) {
          if (Dist.Modules.internal[grp][i].symbol && Dist.Modules.internal[grp][i].symbol.toLowerCase() === fdname) {
            // Found it
            return new Module({ template: Dist.Modules.internal[grp][i] });
          }
        }
      }
    }
  
    // Not found
    return null;
  }
  
  /**
   * Build a ship from the journal Loadout event JSON
   * @param {object} json the Loadout event JSON
   * @return {Ship} the built ship
   */
  function shipFromLoadoutJSON(json) {
  // Start off building a basic ship
    const shipModel = shipModelFromJson(json);
    if (!shipModel) {
      throw 'No such ship found: "' + json.Ship + '"';
    }
    const shipTemplate = Dist.Ships[shipModel];
  
    let ship = new Ship(shipModel, shipTemplate.properties, shipTemplate.slots);
    ship.buildWith(null);
    // Initial Ship building, don't do engineering yet.
    let modsToAdd = [];
  
    for (const module of json.Modules) {
      switch (module.Slot.toLowerCase()) {
        // Cargo Hatch.
        case 'cargohatch':
          ship.cargoHatch.enabled = module.On;
          ship.cargoHatch.priority = module.Priority;
          break;
        // Add the bulkheads
        case 'armour':
          if (module.Item.toLowerCase().endsWith('_armour_grade1')) {
            ship.useBulkhead(0, true);
          } else if (module.Item.toLowerCase().endsWith('_armour_grade2')) {
            ship.useBulkhead(1, true);
          } else if (module.Item.toLowerCase().endsWith('_armour_grade3')) {
            ship.useBulkhead(2, true);
          } else if (module.Item.toLowerCase().endsWith('_armour_mirrored')) {
            ship.useBulkhead(3, true);
          } else if (module.Item.toLowerCase().endsWith('_armour_reactive')) {
            ship.useBulkhead(4, true);
          } else {
            throw 'Unknown bulkheads "' + module.Item + '"';
          }
          ship.bulkheads.enabled = true;
          if (module.Engineering) _addModifications(ship.bulkheads.m, module.Engineering.Modifiers, module.Engineering.BlueprintName, module.Engineering.Level, module.Engineering.ExperimentalEffect);
          break;
        case 'powerplant':
          const powerplant = _moduleFromFdName(module.Item);
          ship.use(ship.standard[0], powerplant, true);
          ship.standard[0].enabled = module.On;
          ship.standard[0].priority = module.Priority;
          if (module.Engineering) _addModifications(powerplant, module.Engineering.Modifiers, module.Engineering.BlueprintName, module.Engineering.Level, module.Engineering.ExperimentalEffect);
          break;
        case 'mainengines':
          const thrusters = _moduleFromFdName(module.Item);
          ship.use(ship.standard[1], thrusters, true);
          ship.standard[1].enabled = module.On;
          ship.standard[1].priority = module.Priority;
          if (module.Engineering) _addModifications(thrusters, module.Engineering.Modifiers, module.Engineering.BlueprintName, module.Engineering.Level, module.Engineering.ExperimentalEffect);
          break;
        case 'frameshiftdrive':
          const frameshiftdrive = _moduleFromFdName(module.Item);
          ship.use(ship.standard[2], frameshiftdrive, true);
          ship.standard[2].enabled = module.On;
          ship.standard[2].priority = module.Priority;
          if (module.Engineering)  _addModifications(frameshiftdrive, module.Engineering.Modifiers, module.Engineering.BlueprintName, module.Engineering.Level, module.Engineering.ExperimentalEffect);
          break;
        case 'lifesupport':
          const lifesupport = _moduleFromFdName(module.Item);
          ship.use(ship.standard[3], lifesupport, true);
          ship.standard[3].enabled = module.On === true;
          ship.standard[3].priority = module.Priority;
          if (module.Engineering) _addModifications(lifesupport, module.Engineering.Modifiers, module.Engineering.BlueprintName, module.Engineering.Level, module.Engineering.ExperimentalEffect);
          break;
        case 'powerdistributor':
          const powerdistributor = _moduleFromFdName(module.Item);
          ship.use(ship.standard[4], powerdistributor, true);
          ship.standard[4].enabled = module.On;
          ship.standard[4].priority = module.Priority;
          if (module.Engineering) _addModifications(powerdistributor, module.Engineering.Modifiers, module.Engineering.BlueprintName, module.Engineering.Level, module.Engineering.ExperimentalEffect);
          break;
        case 'radar':
          const sensors = _moduleFromFdName(module.Item);
          ship.use(ship.standard[5], sensors, true);
          ship.standard[5].enabled = module.On;
          ship.standard[5].priority = module.Priority;
          if (module.Engineering) _addModifications(sensors, module.Engineering.Modifiers, module.Engineering.BlueprintName, module.Engineering.Level, module.Engineering.ExperimentalEffect);
          break;
        case 'fueltank':
          const fueltank = _moduleFromFdName(module.Item);
          ship.use(ship.standard[6], fueltank, true);
          ship.standard[6].enabled = true;
          ship.standard[6].priority = 0;
          break;
        default:
      }
      if (module.Slot.toLowerCase().search(/hardpoint/) !== -1) {
        // Add hardpoints
        let hardpoint;
        let hardpointClassNum = -1;
        let hardpointSlotNum = -1;
        let hardpointArrayNum = 0;
        for (let i in shipTemplate.slots.hardpoints) {
          if (shipTemplate.slots.hardpoints[i] === hardpointClassNum) {
            // Another slot of the same class
            hardpointSlotNum++;
          } else {
            // The first slot of a new class
            hardpointClassNum = shipTemplate.slots.hardpoints[i];
            hardpointSlotNum = 1;
          }
  
          // Now that we know what we're looking for, find it
          const hardpointName = HARDPOINT_NUM_TO_CLASS[hardpointClassNum] + 'Hardpoint' + hardpointSlotNum;
          const hardpointSlot = json.Modules.find(elem => elem.Slot.toLowerCase() === hardpointName.toLowerCase());
          if (!hardpointSlot) {
            // This can happen with old imports that don't contain new hardpoints
          } else if (!hardpointSlot) {
            // No module
          } else {
            hardpoint = _moduleFromFdName(hardpointSlot.Item);
            ship.use(ship.hardpoints[hardpointArrayNum], hardpoint, true);
            ship.hardpoints[hardpointArrayNum].enabled = hardpointSlot.On;
            ship.hardpoints[hardpointArrayNum].priority = hardpointSlot.Priority;
            modsToAdd.push({ coriolisMod: hardpoint, json: hardpointSlot });
          }
          hardpointArrayNum++;
        }
      }
    }
  
    let internalSlotNum = 0;
    let militarySlotNum = 1;
    for (let i in shipTemplate.slots.internal) {
      if (!shipTemplate.slots.internal.hasOwnProperty(i)) {
        continue;
      }
      const isMilitary = isNaN(shipTemplate.slots.internal[i]) ? shipTemplate.slots.internal[i].name == 'Military' : false;
  
      // The internal slot might be a standard or a military slot.  Military slots have a different naming system
      let internalSlot = null;
      if (isMilitary) {
        const internalName = 'Military0' + militarySlotNum;
        internalSlot = json.Modules.find(elem => elem.Slot.toLowerCase() === internalName.toLowerCase());
        militarySlotNum++;
      } else {
        // Slot numbers are not contiguous so handle skips.
        for (; internalSlot === null && internalSlotNum < 99; internalSlotNum++) {
          // Slot sizes have no relationship to the actual size, either, so check all possibilities
          for (let slotsize = 0; slotsize < 9; slotsize++) {
            const internalName = 'Slot' + (internalSlotNum <= 9 ? '0' : '') + internalSlotNum + '_Size' + slotsize;
            if (json.Modules.find(elem => elem.Slot.toLowerCase() === internalName.toLowerCase())) {
              internalSlot = json.Modules.find(elem => elem.Slot.toLowerCase() === internalName.toLowerCase());
              break;
            }
          }
        }
      }
  
      if (!internalSlot) {
        // This can happen with old imports that don't contain new slots
      } else {
        const internalJson = internalSlot;
        const internal = _moduleFromFdName(internalJson.Item);
        ship.use(ship.internal[i], internal, true);
        ship.internal[i].enabled = internalJson.On === true;
        ship.internal[i].priority = internalJson.Priority;
        modsToAdd.push({ coriolisMod: internal, json: internalSlot });
      }
    }
  
    for (const i of modsToAdd) {
      if (i.json.Engineering) {
        _addModifications(i.coriolisMod, i.json.Engineering.Modifiers, i.json.Engineering.BlueprintName, i.json.Engineering.Level, i.json.Engineering.ExperimentalEffect);
      }
    }
    // We don't have any information on it so guess it's priority 5 and disabled
    if (!ship.cargoHatch) {
      ship.cargoHatch.enabled = false;
      ship.cargoHatch.priority = 4;
    }
  
    // Now update the ship's codes before returning it
    ship = ship.updatePowerPrioritesString().updatePowerEnabledString().updateModificationsString();
    return ship;
  }
  
  /**
   * Add the modifications for a module
   * @param {Module} module the module
   * @param {Object} modifiers the modifiers
   * @param {Object} blueprint the blueprint of the modification
   * @param {Object} grade the grade of the modification
   * @param {Object} specialModifications special modification
   */
  function _addModifications(module, modifiers, blueprint, grade, specialModifications) {
    if (!modifiers) return;
    let special;
    if (specialModifications) {
      if (specialModifications == 'special_plasma_slug') {
        if (module.symbol.match(/PlasmaAccelerator/i)) {
          specialModifications = 'special_plasma_slug_pa';
        } else {
          specialModifications = 'special_plasma_slug_cooled';
        }
      }
      special = Dist.Modifications.specials[specialModifications];
    }
    // Add the blueprint definition, grade and special
    if (blueprint) {
      module.blueprint = getBlueprint(blueprint, module);
      if (grade) {
        module.blueprint.grade = Number(grade);
      }
      if (special) {
        module.blueprint.special = special;
      }
    }
    for (const i in modifiers) {
      // Some special modifications
      // Look up the modifiers to find what we need to do
      const findMod = val => Object.keys(Dist.Modifications.modifierActions).find(elem => elem.toString().toLowerCase().replace(/(outfittingfieldtype_|persecond)/igm, '') === val.toString().toLowerCase().replace(/(outfittingfieldtype_|persecond)/igm, ''));
      const modifierActions = Dist.Modifications.modifierActions[findMod(modifiers[i].Label)];
      // TODO: Figure out how to scale this value.
      if (!!modifiers[i].LessIsGood) {
  
      }
      let value = (modifiers[i].Value / modifiers[i].OriginalValue * 100 - 100)  * 100;
      if (value === Infinity) {
        value = modifiers[i].Value * 100;
      }
      if (modifiers[i].Label.search('DamageFalloffRange') >= 0) {
        value = (modifiers[i].Value / module.range - 1) * 100;
      }
      if (modifiers[i].Label.search('Resistance') >= 0) {
        value = (modifiers[i].Value * 100) - (modifiers[i].OriginalValue * 100);
      }
      if (modifiers[i].Label.search('ShieldMultiplier') >= 0 || modifiers[i].Label.search('DefenceModifierHealthMultiplier') >= 0) {
        value = ((100 + modifiers[i].Value) / (100 + modifiers[i].OriginalValue) * 100 - 100)  * 100;
      }
  
      // Carry out the required changes
      for (const action in modifierActions) {
        if (isNaN(modifierActions[action])) {
          module.setModValue(action, modifierActions[action]);
        } else {
          module.setModValue(action, value, true);
        }
      }
    }
  }

var router = express.Router()

app.use(expressWinston.logger({
  transports: [
    new winston.transports.Console()
  ],
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.json()
  ),
  meta: true,
  msg: "HTTP {{req.method}} {{req.url}}",
  expressFormat: true,
  colorize: true,
  ignoreRoute: function (req, res) { return false; }
}))

app.use(router);

app.post("/convert", jsonParser, (req, res) => {

  var ship = shipFromLoadoutJSON(req.body)
  var response = toDetailedBuild("MyShip", ship, ship.toString())

  res.type("json")
  res.send(response)
})

app.listen(7777, () => {
    console.log("API started successfully")
})
