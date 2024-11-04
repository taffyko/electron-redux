'use strict';

require('lodash.isplainobject');
require('lodash.isstring');
var misc = require('./misc-BU179J2R.js');

/**
 * Creates new instance of renderer process redux enhancer.
 * Upon initialization, it will fetch the state from the main process & subscribe for event
 *  communication required to keep the actions in sync.
 * @param {RendererStateSyncEnhancerOptions} options Additional settings for enhancer
 * @returns StoreEnhancer
 */
const stateSyncEnhancer = (options = {}) => {
  misc.preventDoubleInitialization();
  assertElectronReduxBridgeAvailability();
  return __ElectronReduxBridge.stateSyncEnhancer(options);
};
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const composeWithStateSync = (firstFuncOrOpts, ...funcs) => {
  assertElectronReduxBridgeAvailability();
  return __ElectronReduxBridge.composeWithStateSync(firstFuncOrOpts, ...funcs);
};
const assertElectronReduxBridgeAvailability = () => {
  if (typeof __ElectronReduxBridge === undefined) {
    throw new Error('Looks like this renderer process has not been configured properly. Did you forgot to include preload script?');
  }
};

exports.composeWithStateSync = composeWithStateSync;
exports.stateSyncEnhancer = stateSyncEnhancer;
