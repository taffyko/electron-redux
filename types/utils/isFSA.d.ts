export declare const isFSA: (action: FluxStandardAction) => boolean;
export type FluxStandardAction<Meta = unknown> = {
    type: string;
    payload?: unknown;
    meta?: Meta;
};
