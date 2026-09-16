// Minimal React shim used only when bundling Coriolis sources.
//
// The Coriolis shipyard classes import React because some of their methods
// render UI components. This API never calls those methods, so a stub is
// enough to satisfy the bundler and keep React out of the dependency tree.
module.exports = {
  createElement: () => null,
  cloneElement: () => null,
  Component: class Component {},
  PureComponent: class PureComponent {},
  Fragment: 'Fragment',
};
