'use strict';

var electron = require('electron');
var composeWithStateSync$1 = require('./composeWithStateSync-B54hJ0yc.js');
var actions = require('./actions-ubUkq45M.js');
var misc = require('./misc-BU179J2R.js');
require('lodash.isplainobject');
require('lodash.isstring');

function fetchInitialState(options) {
  const state = electron.ipcRenderer.sendSync(composeWithStateSync$1.IPCEvents.INIT_STATE);
  return JSON.parse(state, options.deserializer);
}

async function fetchInitialStateAsync(options, callback) {
  // Electron will throw an error if there isn't a handler for the channel.
  // We catch it so that we can throw a more useful error
  try {
    const state = await electron.ipcRenderer.invoke(composeWithStateSync$1.IPCEvents.INIT_STATE_ASYNC);
    callback(JSON.parse(state, options.deserializer));
  } catch (error) {
    console.warn(error);
    throw new Error('No Redux store found in main process. Did you use the mainStateSyncEnhancer in the MAIN process?');
  }
}

const forwardActionToMain = (action, options = {}) => {
  if (actions.validateAction(action, options.denyList)) {
    console.log("electron-redux: SENDING ACTION TO MAIN", action.type);
    electron.ipcRenderer.send(composeWithStateSync$1.IPCEvents.ACTION, JSON.stringify(action));
  }
};

const REPLACE_STATE = 'electron-redux.REPLACE_STATE';
/**
 * Creates an action that will replace the current state with the provided
 * state. The scope is set to local in this creator function to make sure it is
 * never forwarded.
 */
const replaceState = state => ({
  type: REPLACE_STATE,
  payload: state,
  meta: {
    scope: 'local'
  }
});
const withStoreReplacer = reducer => (state, action) => {
  switch (action.type) {
    case REPLACE_STATE:
      return action.payload;
    default:
      return reducer(state, action);
  }
};

const stateSyncEnhancer = (options = {}) => createStore => {
  misc.preventDoubleInitialization();
  return (reducer, state) => {
    const initialState = options.lazyInit ? state : fetchInitialState(options);
    const store = createStore(options.lazyInit ? withStoreReplacer(reducer) : reducer, initialState);
    if (options.lazyInit) {
      fetchInitialStateAsync(options, asyncState => {
        store.dispatch(replaceState(asyncState));
      });
    }
    // When receiving an action from main
    electron.ipcRenderer.on(composeWithStateSync$1.IPCEvents.ACTION, (_, actionJson) => {
      const action = JSON.parse(actionJson);
      const action1 = actions.stopForwarding(action);
      console.log("electron-redux: RECEIVED ACTION", action.type);
      console.time("garbageCollection");
      window.gc == null || window.gc();
      console.timeEnd("garbageCollection");
      console.time('dispatch');
      console.log("BEGIN dispatchEnter", Date.now());
      store.dispatch(action1);
      console.log("END dispatchExit", Date.now());
      console.timeEnd('dispatch');
      // @ts-ignore
      window.actionJson = actionJson;
      // @ts-ignore
      window.action1 = action1;
    });
    return composeWithStateSync$1.forwardAction(store, forwardActionToMain, options);
  };
};
const composeWithStateSync = (firstFuncOrOpts, ...funcs) => composeWithStateSync$1.createComposer(stateSyncEnhancer, forwardActionToMain)(firstFuncOrOpts, ...funcs);
const preload = () => {
  const bridge = {
    stateSyncEnhancer,
    composeWithStateSync
  };
  try {
    electron.contextBridge.exposeInMainWorld('__ElectronReduxBridge', bridge);
  } catch {
    window.__ElectronReduxBridge = bridge;
  }
};
// run it!
preload();
//# sourceURL=electronReduxPreload.js

exports.preload = preload;
