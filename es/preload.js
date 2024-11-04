import { ipcRenderer, contextBridge } from 'electron';
import { I as IPCEvents, f as forwardAction, c as createComposer } from './composeWithStateSync-B4TOSVQz.js';
import { v as validateAction, s as stopForwarding } from './actions-DN_BDx90.js';
import { p as preventDoubleInitialization } from './misc-DdOinKiQ.js';
import 'lodash.isplainobject';
import 'lodash.isstring';

function fetchInitialState(options) {
  const state = ipcRenderer.sendSync(IPCEvents.INIT_STATE);
  return JSON.parse(state, options.deserializer);
}

async function fetchInitialStateAsync(options, callback) {
  // Electron will throw an error if there isn't a handler for the channel.
  // We catch it so that we can throw a more useful error
  try {
    const state = await ipcRenderer.invoke(IPCEvents.INIT_STATE_ASYNC);
    callback(JSON.parse(state, options.deserializer));
  } catch (error) {
    console.warn(error);
    throw new Error('No Redux store found in main process. Did you use the mainStateSyncEnhancer in the MAIN process?');
  }
}

const forwardActionToMain = (action, options = {}) => {
  if (validateAction(action, options.denyList)) {
    console.log("electron-redux: SENDING ACTION TO MAIN", action.type);
    ipcRenderer.send(IPCEvents.ACTION, JSON.stringify(action));
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
  preventDoubleInitialization();
  return (reducer, state) => {
    const initialState = options.lazyInit ? state : fetchInitialState(options);
    const store = createStore(options.lazyInit ? withStoreReplacer(reducer) : reducer, initialState);
    if (options.lazyInit) {
      fetchInitialStateAsync(options, asyncState => {
        store.dispatch(replaceState(asyncState));
      });
    }
    // When receiving an action from main
    ipcRenderer.on(IPCEvents.ACTION, (_, actionJson) => {
      const action = JSON.parse(actionJson);
      const action1 = stopForwarding(action);
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
    return forwardAction(store, forwardActionToMain, options);
  };
};
const composeWithStateSync = (firstFuncOrOpts, ...funcs) => createComposer(stateSyncEnhancer, forwardActionToMain)(firstFuncOrOpts, ...funcs);
const preload = () => {
  const bridge = {
    stateSyncEnhancer,
    composeWithStateSync
  };
  try {
    contextBridge.exposeInMainWorld('__ElectronReduxBridge', bridge);
  } catch {
    window.__ElectronReduxBridge = bridge;
  }
};
// run it!
preload();
//# sourceURL=electronReduxPreload.js

export { preload };
