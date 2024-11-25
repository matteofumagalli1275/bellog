/**
 * Manages profile and library scripts.
 * Scripts export symbols into window["bellog"].symbols (or .lib[rdnId].symbols).
 */

class BellogRuntimeScriptController {

    private contexts: Map<string, { func: Function; exports: any[] }[]> = new Map();

    /** Reset state — call before loading a new profile. */
    init(): void {
        this.contexts = new Map();
        this.contexts.set("", []);

        // Initialize the global bellog object
        if (!(window as any)["bellog"]) {
            (window as any)["bellog"] = { symbols: new Map(), lib: {} };
        }
    }

    addProfileScript(name: string, code: string): void {
        const namespace = new Function(`
            let exports = {};
            ${code}
            return exports;
            //# sourceURL=BellogGlobalScripts_${name}.js
        `);
        const scripts = this.contexts.get("") ?? [];
        scripts.push({ func: namespace, exports: [] });
        this.contexts.set("", scripts);
    }

    addLibraryScript(rdnId: string, name: string, code: string): void {
        const namespace = new Function(`
            let exports = {};
            ${code}
            return exports;
            //# sourceURL=BellogLibScripts_${rdnId}_${name}.js
        `);
        if (!this.contexts.has(rdnId)) {
            this.contexts.set(rdnId, []);
        }
        this.contexts.get(rdnId)!.push({ func: namespace, exports: [] });
    }

    executeScripts(): void {
        const bellog = (window as any)["bellog"];

        for (const [key, scripts] of this.contexts.entries()) {
            // Resolve the symbols map for this scope
            let symbolsMap: Map<string, any>;
            if (key === "") {
                symbolsMap = bellog.symbols;
            } else {
                if (!bellog.lib[key]) {
                    bellog.lib[key] = { symbols: new Map() };
                }
                symbolsMap = bellog.lib[key].symbols;
            }

            for (const script of scripts) {
                try {
                    const exported = script.func.call(null);
                    script.exports.push(exported);

                    // Merge exported names into the symbols map
                    if (exported && typeof exported === 'object') {
                        for (const [k, v] of Object.entries(exported)) {
                            symbolsMap.set(k, v);
                        }
                    }
                } catch (e) {
                    console.error(`[ScriptController] Error executing script:`, e);
                }
            }
        }
    }

    executeInContext(rdnId: string, func: Function): void {
        // Simple direct call — context isolation can be added later
        try {
            func();
        } catch (e) {
            console.error(`[ScriptController] Error in context "${rdnId}":`, e);
        }
    }
}

export const bellogRuntimeScriptController = new BellogRuntimeScriptController();