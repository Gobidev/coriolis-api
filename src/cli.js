'use strict';

/**
 * Standalone conversion CLI: reads a loadout event as JSON on stdin and writes
 * the Coriolis build as JSON on stdout.
 *
 * Used by EDNeutronAssistant so the conversion can be bundled into the binary
 * and run offline without the HTTP server.
 *
 * Exit codes:
 *   0  success (build written to stdout)
 *   1  invalid input / conversion failure (message on stderr)
 */

import { convertLoadout, validateLoadout } from './convert.js';

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  input += chunk;
});
process.stdin.on('error', (err) => {
  fail(`Failed to read stdin: ${err.message}`);
});
process.stdin.on('end', () => {
  let body;
  try {
    body = JSON.parse(input);
  } catch (err) {
    fail(`Invalid JSON body: ${err.message}`);
    return;
  }

  const invalid = validateLoadout(body);
  if (invalid) {
    fail(invalid);
    return;
  }

  try {
    process.stdout.write(JSON.stringify(convertLoadout(body)));
  } catch (err) {
    fail(`Conversion failed: ${err.message}`);
  }
});
