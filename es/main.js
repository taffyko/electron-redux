import { webContents, ipcMain } from 'electron';
import { I as IPCEvents, f as forwardAction, c as createComposer } from './composeWithStateSync-B4TOSVQz.js';
import { v as validateAction, s as stopForwarding } from './actions-DN_BDx90.js';
import { p as preventDoubleInitialization } from './misc-DdOinKiQ.js';
import 'lodash.isplainobject';
import 'lodash.isstring';

const forwardActionToRenderers = (action, options = {}) => {
  if (validateAction(action, options.denyList)) {
    let json = null;
    webContents.getAllWebContents().forEach(contents => {
      // Ignore chromium devtools
      if (contents.getURL().startsWith('devtools://')) return;
      if (contents.getURL().startsWith('chrome-extension://')) return;
      if (json === null) {
        json = JSON.stringify(action);
      }
      console.log("electron-redux: SENDING TO RENDERER", contents.getURL(), action.type);
      contents.send(IPCEvents.ACTION, json);
    });
  }
};

/**
 * Creates new instance of main process redux enhancer.
 * @param {MainStateSyncEnhancerOptions} options Additional enhancer options
 * @returns StoreEnhancer
 */
const stateSyncEnhancer = (options = {}) => createStore => {
  preventDoubleInitialization();
  return (reducer, preloadedState) => {
    const store = createStore(reducer, preloadedState);
    ipcMain.handle(IPCEvents.INIT_STATE_ASYNC, async () => {
      return JSON.stringify(store.getState(), options.serializer);
    });
    ipcMain.on(IPCEvents.INIT_STATE, event => {
      event.returnValue = JSON.stringify(store.getState(), options.serializer);
    });
    // When receiving an action from a renderer
    ipcMain.on(IPCEvents.ACTION, (event, actionJson) => {
      const action = JSON.parse(actionJson);
      const localAction = stopForwarding(action);
      store.dispatch(localAction);
      // Forward it to all of the other renderers
      webContents.getAllWebContents().forEach(contents => {
        // Ignore the renderer that sent the action and chromium devtools
        if (contents.id !== event.sender.id && !contents.getURL().startsWith('devtools://') && !contents.getURL().startsWith('chrome-extension://')) {
          console.log("electron-redux: FORWARDING ACTION TO RENDERER", contents.getURL(), localAction.type);
          contents.send(IPCEvents.ACTION, actionJson);
        }
      });
    });
    return forwardAction(store, forwardActionToRenderers, options);
  };
};
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const composeWithStateSync = (firstFuncOrOpts, ...funcs) => createComposer(stateSyncEnhancer, forwardActionToRenderers)(firstFuncOrOpts, ...funcs);

export { composeWithStateSync, stateSyncEnhancer };
