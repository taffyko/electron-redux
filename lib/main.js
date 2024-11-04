'use strict';

var electron = require('electron');
var composeWithStateSync$1 = require('./composeWithStateSync-B54hJ0yc.js');
var actions = require('./actions-ubUkq45M.js');
var misc = require('./misc-BU179J2R.js');
require('lodash.isplainobject');
require('lodash.isstring');

const forwardActionToRenderers = (action, options = {}) => {
  if (actions.validateAction(action, options.denyList)) {
    let json = null;
    electron.webContents.getAllWebContents().forEach(contents => {
      // Ignore chromium devtools
      if (contents.getURL().startsWith('devtools://')) return;
      if (contents.getURL().startsWith('chrome-extension://')) return;
      if (json === null) {
        json = JSON.stringify(action);
      }
      console.log("electron-redux: SENDING TO RENDERER", contents.getURL(), action.type);
      contents.send(composeWithStateSync$1.IPCEvents.ACTION, json);
    });
  }
};

/**
 * Creates new instance of main process redux enhancer.
 * @param {MainStateSyncEnhancerOptions} options Additional enhancer options
 * @returns StoreEnhancer
 */
const stateSyncEnhancer = (options = {}) => createStore => {
  misc.preventDoubleInitialization();
  return (reducer, preloadedState) => {
    const store = createStore(reducer, preloadedState);
    electron.ipcMain.handle(composeWithStateSync$1.IPCEvents.INIT_STATE_ASYNC, async () => {
      return JSON.stringify(store.getState(), options.serializer);
    });
    electron.ipcMain.on(composeWithStateSync$1.IPCEvents.INIT_STATE, event => {
      event.returnValue = JSON.stringify(store.getState(), options.serializer);
    });
    // When receiving an action from a renderer
    electron.ipcMain.on(composeWithStateSync$1.IPCEvents.ACTION, (event, actionJson) => {
      const action = JSON.parse(actionJson);
      const localAction = actions.stopForwarding(action);
      store.dispatch(localAction);
      // Forward it to all of the other renderers
      electron.webContents.getAllWebContents().forEach(contents => {
        // Ignore the renderer that sent the action and chromium devtools
        if (contents.id !== event.sender.id && !contents.getURL().startsWith('devtools://') && !contents.getURL().startsWith('chrome-extension://')) {
          console.log("electron-redux: FORWARDING ACTION TO RENDERER", contents.getURL(), localAction.type);
          contents.send(composeWithStateSync$1.IPCEvents.ACTION, actionJson);
        }
      });
    });
    return composeWithStateSync$1.forwardAction(store, forwardActionToRenderers, options);
  };
};
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const composeWithStateSync = (firstFuncOrOpts, ...funcs) => composeWithStateSync$1.createComposer(stateSyncEnhancer, forwardActionToRenderers)(firstFuncOrOpts, ...funcs);

exports.composeWithStateSync = composeWithStateSync;
exports.stateSyncEnhancer = stateSyncEnhancer;
