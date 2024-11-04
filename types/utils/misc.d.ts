export declare const preventDoubleInitialization: () => void;
/**
 * Removes the property prop from the given object. Think of it as an actual
 * runtime implementation of the TypeScript Omit<T, K> type.
 */
export declare const trimProperty: <T extends keyof X, X extends {}>(prop: T, obj: X) => Omit<X, T>;
/**
 * Removes multiple properties from the given object.
 */
export declare const trimProperties: <T extends keyof X, X extends {}>(props: T[], obj: X) => Omit<X, T>;
