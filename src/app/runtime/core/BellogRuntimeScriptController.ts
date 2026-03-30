import {ScriptExportedSymbols} from "../../common/model/profile/Common";

/**
 * Manages profile and library scripts.
 * bellog.symbols is pre-populated from the declared exported symbols table.
 * Scripts update symbols via window.bellog.symbols.set(name, value).
 * Global helpers/libraries are exposed via window.xxx directly.
 */

class BellogRuntimeScriptController {

    private contexts: Map<string, Function[]> = new Map();

    /** Reset state and pre-populate bellog.symbols from declared exported symbols. */
    init(exportedSymbols: ScriptExportedSymbols[] = []): void {
        this.contexts = new Map();
        this.contexts.set("", []);

        const symbols = new Map<string, any>();
        for (const sym of exportedSymbols) {
            symbols.set(sym.name, sym.defaultValue !== "" ? sym.defaultValue : undefined);
        }

        (window as any)["bellog"] = { symbols, lib: {} };
    }

    addProfileScript(name: string, code: string): void {
        const func = new Function(`
            const module = { exports: {} };
            const exports = module.exports;
            ${code}
            //# sourceURL=BellogScript_${name}.js
        `);
        const scripts = this.contexts.get("") ?? [];
        scripts.push(func);
        this.contexts.set("", scripts);
    }

    addLibraryScript(rdnId: string, name: string, code: string): void {
        const func = new Function(`
            const module = { exports: {} };
            const exports = module.exports;
            ${code}
            //# sourceURL=BellogLibScript_${rdnId}_${name}.js
        `);
        if (!this.contexts.has(rdnId)) {
            this.contexts.set(rdnId, []);
        }
        this.contexts.get(rdnId)!.push(func);
    }

    executeScripts(): void {
        const bellog = (window as any)["bellog"];

        for (const [key, scripts] of this.contexts.entries()) {
            if (key !== "" && !bellog.lib[key]) {
                bellog.lib[key] = { symbols: new Map() };
            }

            for (const func of scripts) {
                try {
                    func.call(null);
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
