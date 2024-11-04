var IPCEvents;
(function (IPCEvents) {
  IPCEvents["INIT_STATE"] = "electron-redux.INIT_STATE";
  IPCEvents["INIT_STATE_ASYNC"] = "electron-redux.INIT_STATE_ASYNC";
  IPCEvents["ACTION"] = "electron-redux.ACTION";
})(IPCEvents || (IPCEvents = {}));

const forwardAction = (store, processForwarder, options = {}) => {
  return {
    ...store,
    dispatch: action => {
      const value = store.dispatch(action);
      if (!(options != null && options.preventActionReplay)) {
        processForwarder(action, options);
      }
      return value;
    }
  };
};

/* eslint-disable @typescript-eslint/ban-types */
const forwardActionEnhancer = (processForwarder, options) => createStore => (reducer, preloadedState) => {
  const store = createStore(reducer, preloadedState);
  return forwardAction(store, processForwarder, options);
};
const extensionCompose = (stateSyncEnhancer, processForwarder, options) => (...funcs) => {
  return createStore => {
    return [stateSyncEnhancer({
      ...options,
      preventActionReplay: true
    }), ...funcs, forwardActionEnhancer(processForwarder, options)].reduceRight((composed, f) => f(composed), createStore);
  };
};
function createComposer(stateSyncEnhancer, processForwarder) {
  return function composeWithStateSync(firstFuncOrOpts, ...funcs) {
    if (arguments.length === 0) {
      return stateSyncEnhancer({});
    }
    if (arguments.length === 1 && typeof firstFuncOrOpts === 'object') {
      return extensionCompose(stateSyncEnhancer, processForwarder, firstFuncOrOpts)();
    }
    return extensionCompose(stateSyncEnhancer, processForwarder, {})(firstFuncOrOpts, ...funcs);
  };
}

export { IPCEvents as I, createComposer as c, forwardAction as f };
