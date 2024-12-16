import { webContents } from 'electron'
import { IPCEvents } from 'src/constants'
import { MainStateSyncEnhancerOptions } from 'src/options/MainStateSyncEnhancerOptions'
import { validateAction } from 'src/utils'

export const forwardActionToRenderers = <A>(
    action: A,
    options: MainStateSyncEnhancerOptions = {}
): void => {
    if (validateAction(action, options.denyList)) {
        let value: unknown = null
        webContents.getAllWebContents().forEach((contents) => {
            // Ignore chromium devtools
            if (contents.getURL().startsWith('devtools://')) return
            if (contents.getURL().startsWith('chrome-extension://')) return
            if (value === null) {
                value = action
                try {
                    value = JSON.stringify(action)
                } catch {}
        
            }
            contents.send(IPCEvents.ACTION, value)
        })
    }
}
