import { Reducer, UnknownAction } from 'redux'
import { FluxStandardAction } from './isFSA'
import { ActionMeta } from '.'

interface ReplaceStateAction<S> extends FluxStandardAction<ActionMeta> {
    payload: S
}

const REPLACE_STATE = 'electron-redux.REPLACE_STATE'

/**
 * Creates an action that will replace the current state with the provided
 * state. The scope is set to local in this creator function to make sure it is
 * never forwarded.
 */
export const replaceState = <S>(state: S): ReplaceStateAction<S> => ({
    type: REPLACE_STATE,
    payload: state,
    meta: { scope: 'local' },
})

export const withStoreReplacer = <S, A extends UnknownAction, PreloadedState = S>(reducer: Reducer<S, A, PreloadedState>): Reducer<S, A, PreloadedState> => (
    state: S | PreloadedState | undefined,
    action: A
): S => {
    switch (action.type) {
        case REPLACE_STATE:
            return { ...state, ...(action as any).payload }
        default:
            return reducer(state, action)
    }
}
