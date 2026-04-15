import {ScriptExportedSymbols} from "../../common/model/profile/Common";
import {persistentSymbolRepository} from "../../common/repositories/PersistentSymbolRepository";

/**
 * Manages profile and library scripts.
 * bellog.symbols is pre-populated from the declared exported symbols table.
 * Scripts update symbols via window.bellog.symbols.set(name, value).
 * Global helpers/libraries are exposed via window.xxx directly.
 *
 * Symbols marked as `persistent` have their values stored in IndexedDB and
 * are restored across profile runs instead of being reset to defaultValue.
 */

function coerceSymbolValue(value: string): string | number | boolean | undefined {
    if (value === "") return undefined;
    if (value === "true") return true;
    if (value === "false") return false;
    const n = Number(value);
    if (!isNaN(n)) return n;
    return value;
}

/**
 * Map subclass that intercepts set() for symbols marked as persistent and
 * writes the new value to IndexedDB (fire-and-forget).
 */
class SymbolMap extends Map<string, any> {
    private readonly persistentNames: Set<string>;
    private readonly profileId: number;

    constructor(profileId: number, persistentNames: Set<string>, entries: [string, any][]) {
        super(entries); // populate via super to bypass our overridden set()
        this.profileId = profileId;
        this.persistentNames = persistentNames;
    }

    set(key: string, value: any): this {
        super.set(key, value);
        if (this.persistentNames?.has(key)) {
            persistentSymbolRepository
                .set(this.profileId, key, JSON.stringify(value))
                .catch(e => console.error('[SymbolMap] Failed to persist symbol:', key, e));
        }
        return this;
    }
}

class BellogRuntimeScriptController {

    private contexts: Map<string, Function[]> = new Map();

    /**
     * Reset state and pre-populate bellog.symbols from declared exported symbols.
     * Symbols with persistent=true are loaded from IndexedDB; all others start
     * from their defaultValue.
     */
    async init(profileId: number, exportedSymbols: ScriptExportedSymbols[] = []): Promise<void> {
        this.contexts = new Map();
        this.contexts.set("", []);

        const persistentNames = new Set(
            exportedSymbols.filter(s => s.persistent).map(s => s.name)
        );

        // Load stored values for this profile's persistent symbols
        const stored = new Map<string, any>();
        if (persistentNames.size > 0) {
            const rows = await persistentSymbolRepository.getAll(profileId);
            for (const row of rows) {
                if (persistentNames.has(row.name)) {
                    try { stored.set(row.name, JSON.parse(row.value)); }
                    catch { stored.set(row.name, row.value); }
                }
            }
        }

        // Build initial entries without going through the overridden set() so
        // we don't spuriously write back values we just read from IndexedDB.
        const entries: [string, any][] = exportedSymbols.map(sym => [
            sym.name,
            sym.persistent && stored.has(sym.name)
                ? stored.get(sym.name)
                : coerceSymbolValue(sym.defaultValue),
        ]);

        const symbols = new SymbolMap(profileId, persistentNames, entries);
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
