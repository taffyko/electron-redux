import { webContents } from 'electron'
import { IPCEvents } from 'src/constants'
import { MainStateSyncEnhancerOptions } from 'src/options/MainStateSyncEnhancerOptions'
import { validateAction } from 'src/utils'

export const forwardActionToRenderers = <A>(
    action: A,
    options: MainStateSyncEnhancerOptions = {}
): void => {
    if (validateAction(action, options.denyList)) {
        let json: {} | null = null
        webContents.getAllWebContents().forEach((contents) => {
            // Ignore chromium devtools
            if (contents.getURL().startsWith('devtools://')) return
            if (contents.getURL().startsWith('chrome-extension://')) return
            if (json === null) {
                json = JSON.stringify(action)
            }
            contents.send(IPCEvents.ACTION, json)
        })
    }
}
