export const hasBrowserStorage = (): boolean => typeof window !== 'undefined' && Boolean(window.localStorage);
