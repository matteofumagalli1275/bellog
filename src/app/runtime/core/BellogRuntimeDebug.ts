class BellogRuntimeDebug {
    enabled: boolean = false;

    log(...args: any[]) {
        if (this.enabled) {
            console.log('[Debug]', ...args);
        }
    }
}

export const bellogRuntimeDebug = new BellogRuntimeDebug();
