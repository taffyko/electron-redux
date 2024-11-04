import { ipcRenderer } from 'electron'
import { IPCEvents } from '../constants'
import { RendererStateSyncEnhancerOptions } from '../options/RendererStateSyncEnhancerOptions'
import { validateAction } from '../utils'

export const forwardActionToMain = <A>(
    action: A,
    options: RendererStateSyncEnhancerOptions = {}
): void => {
    if (validateAction(action, options.denyList)) {
        console.log("electron-redux: SENDING ACTION TO MAIN", action.type)
        ipcRenderer.send(IPCEvents.ACTION, JSON.stringify(action))
    }
}
