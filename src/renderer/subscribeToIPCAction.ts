import { ipcRenderer } from 'electron'
import { Action } from 'redux'
import { IPCEvents } from 'src/constants'

export const subscribeToIPCAction = (callback: (action: Action) => void): void => {
    // TODO: avoid parsing more than once even if subscribed multiple times
    ipcRenderer.on(IPCEvents.ACTION, (_, actionJson: string) => {
        const action: Action = JSON.parse(actionJson)
        callback(action)
    })
}
