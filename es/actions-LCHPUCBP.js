import isPlainObject from 'lodash.isplainobject';
import isString from 'lodash.isstring';

const isFSA = action => isPlainObject(action) && isString(action.type) && Object.keys(action).every(isValidKey);
const isValidKey = key => ['type', 'payload', 'error', 'meta'].indexOf(key) > -1;

/**
 * stopForwarding allows you to give it an action, and it will return an
 * equivalent action that will only play in the current process
 */
const stopForwarding = action => ({
  ...action,
  meta: {
    ...action.meta,
    scope: 'local'
  }
});
/**
 * validateAction ensures that the action meets the right format and isn't scoped locally
 */
const validateAction = (action,
// Actions that we should never replay across stores
denyList = [/^@@/, /^redux-form/]) => {
  var _action$meta;
  return isFSA(action) && ((_action$meta = action.meta) == null ? void 0 : _action$meta.scope) !== 'local' && denyList.every(rule => !rule.test(action.type));
};

export { stopForwarding as s, validateAction as v };
