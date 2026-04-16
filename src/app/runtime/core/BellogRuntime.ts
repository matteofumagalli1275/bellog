import {ProfileRepositoryInterface} from "../../common/repositories/ProfileRepositoryInterface";
import {ProfileRepositoryFactory} from "../../common/repositories/ProfileRepositoryFactory";
import {ProfileProperty} from "../../common/model/profile/Profile";
import {ElementReference, ElementReferenceType, ElementType} from "../../common/model/profile/Common";
import {InterfacesProperty} from "../../common/model/profile/Interface";
import {Interface, DriverOpenClose, isDriverOpenClose} from "../interfaces/Interface";
import {ViewFragmentAppend, ViewProperty} from "../../common/model/profile/View";
import {bellogRuntimeLayerController} from "./BellogRuntimeLayerController";
import {getElementFromRef} from "../../setup/components/Utils";
import {bellogRuntimeScriptController} from "./BellogRuntimeScriptController";
import {bellogRuntimeEventEngine} from "./BellogRuntimeEventEngine";
import {initActionExecutor} from "./BellogRuntimeActionExecutor";
import {DriverFactory} from "../interfaces/DriverFactory";
import {db} from "../../common/providers/indexedDb/db";
import {bellogRuntimeDebug} from "./BellogRuntimeDebug";

class BellogRuntime {

    private repository: ProfileRepositoryInterface;
    private profile: ProfileProperty;
    private _profileId: number = 0;
    private interfaces: {props: InterfacesProperty, ifc: Interface}[] = [];

    constructor() {
        this.repository = ProfileRepositoryFactory.getRepository();
    }

    get profileId(): number { return this._profileId; }

    async loadProfile(profileId: number) {
        await this.repository.connect();
        this._profileId = profileId;
        const userDataProfileProject = await this.repository.getProfile(profileId);
        this.profile = JSON.parse(userDataProfileProject.setup);

        // Backward compat: handle old profiles with 'middlewares' key
        const profileAny = this.profile as any;
        if (profileAny.middlewares && !this.profile.layers) {
            this.profile.layers = profileAny.middlewares;
            delete profileAny.middlewares;
        }

        // Configure layer controller
        bellogRuntimeLayerController.setLayers(this.profile.layers);
        bellogRuntimeLayerController.setChannels(this.profile.channels);

        // Create interface instances via DriverFactory
        this.interfaces = [];
        const tokenSetting = await db.settings.get("websocketToken");
        const websocketToken = tokenSetting?.value || '';
        bellogRuntimeDebug.enabled = this.profile.settings?.debugMode ?? false;

        for (const ifcProp of this.profile.interfaces) {
            if ((ifcProp as any).deleted) continue;
            const ifc = DriverFactory.build(ifcProp.type, ifcProp.settings, websocketToken);
            this.interfaces.push({ props: ifcProp, ifc });

            // Wire receive: interface → layer controller
            ifc.onReceive((data, chunkInfo) => {
                bellogRuntimeDebug.log(`[IFC RX] "${ifcProp.name}"`, data);
                const now = new Date();
                bellogRuntimeLayerController.outputFromIfc(ifcProp, Date.now(), {
                    data: data,
                    _origin: {
                        datetime: now,
                        time: now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 } as any),
                        timestamp: now.getTime(),
                        ...chunkInfo?.meta,
                    },
                });
            });

            ifc.onError((ex) => {
                console.error(`[BellogRuntime] Interface "${ifcProp.name}" error:`, ex);
            });
        }

        // Initialize action executor (needs profile + send callback)
        initActionExecutor(this.profile, (ifcRefId, data) => this.sendToInterface(ifcRefId, data));

        // Initialize event engine (ChannelUpdate subscriptions)
        bellogRuntimeEventEngine.init(this.profile);

        // Load and execute profile scripts
        await bellogRuntimeScriptController.init(this._profileId, this.profile.scriptsExportedSymbols ?? []);
        this.setupGlobalApi();
        for (const script of this.profile.scripts) {
            bellogRuntimeScriptController.addProfileScript(script.name, script.code);
        }
        bellogRuntimeScriptController.executeScripts();

        // Inject profile styles into <head>
        this.injectStyles();
    }

    /**
     * Load a profile for replay mode. Sets up layers, channels, scripts
     * and views but does NOT create or connect interfaces.
     */
    async loadProfileForReplay(profileId: number) {
        await this.repository.connect();
        this._profileId = profileId;
        const userDataProfileProject = await this.repository.getProfile(profileId);
        this.profile = JSON.parse(userDataProfileProject.setup);

        const profileAny = this.profile as any;
        if (profileAny.middlewares && !this.profile.layers) {
            this.profile.layers = profileAny.middlewares;
            delete profileAny.middlewares;
        }

        bellogRuntimeLayerController.setLayers(this.profile.layers);
        bellogRuntimeLayerController.setChannels(this.profile.channels);

        this.interfaces = [];

        bellogRuntimeDebug.enabled = this.profile.settings?.debugMode ?? false;

        bellogRuntimeEventEngine.init(this.profile);

        await bellogRuntimeScriptController.init(this._profileId, this.profile.scriptsExportedSymbols ?? []);
        this.setupGlobalApi();
        for (const script of this.profile.scripts) {
            bellogRuntimeScriptController.addProfileScript(script.name, script.code);
        }
        bellogRuntimeScriptController.executeScripts();

        this.injectStyles();
    }

    /**
     * Attach all bellog.* API functions onto the global bellog object.
     * Called after bellogRuntimeScriptController.init() (which creates window.bellog)
     * and before executeScripts() so scripts can use them at startup.
     */
    private setupGlobalApi(): void {
        const g = (window as any)["bellog"];

        /** Send data to all connected interfaces. */
        g.rawSend = (data: Uint8Array | string) => {
            for (const entry of this.interfaces) {
                entry.ifc.send(data);
            }
        };

        /** Send data to a specific interface by its id. */
        g.send = (id: number, data: Uint8Array | string) => {
            this.sendToInterface(id, data);
        };

        /**
         * Return a list of loaded interfaces.
         * @returns array of { id, name, type }
         */
        g.getInterfaces = () => {
            return this.interfaces
                .map(e => ({ id: e.props.id, name: e.props.name, type: e.props.type }));
        };
    }

    private injectStyles(): void {
        if (!this.profile.styles) return;
        for (const style of this.profile.styles) {
            if (!style.code || style.code.trim().length === 0) continue;
            const el = document.createElement('style');
            el.setAttribute('data-blr-profile-style', style.name);
            el.textContent = style.code;
            document.head.appendChild(el);
        }
    }

    getProfile(): ProfileProperty {
        return this.profile;
    }

    getInterfaces(): InterfacesProperty[] {
        return this.interfaces.map(it => it.props);
    }

    getViews(): ElementReference[] {
        return this.profile.views
            .filter(v => !(v as any).deleted)
            .map(v => ({
                type: ElementType.View,
                refType: ElementReferenceType.LocalReference,
                refName: v.name,
                refId: v.id,
                libraryRdnId: ""
            }));
    }

    getDynamicViewSupport(): boolean {
        return false;
    }

    /**
     * Resolve any element reference against the loaded profile.
     * Handles the ElementType → profile key mapping.
     */
    getElement<T>(ref: ElementReference): T {
        const keyMap: Record<string, string> = {
            [ElementType.Interface]: 'interfaces',
            [ElementType.Html]: 'htmls',
            [ElementType.Layer]: 'layers',
            [ElementType.Channel]: 'channels',
            [ElementType.View]: 'views',
            [ElementType.Action]: 'actions',
            [ElementType.ConditionalRendering]: 'conditionalRenderings',
        };
        const key = keyMap[ref.type];
        return getElementFromRef(ref, this.profile[key] ?? [], []) as T;
    }

    /** Attach interface listeners (e.g. clipboard paste) to a fragment's DOM root. */
    attachViewFragmentAppend(view: ViewProperty, fragment: ViewFragmentAppend, root: HTMLElement): void {
        for (const entry of this.interfaces) {
            entry.ifc.attach(root);
        }
    }

    /** Open/connect a DriverOpenClose interface. */
    async connectInterface(ifcId: number): Promise<void> {
        const entry = this.interfaces.find(i => i.props.id === ifcId);
        if (!entry) return;
        if (isDriverOpenClose(entry.ifc)) {
            await (entry.ifc as DriverOpenClose).open();
        }
    }

    /** Close/disconnect a DriverOpenClose interface. */
    disconnectInterface(ifcId: number): void {
        const entry = this.interfaces.find(i => i.props.id === ifcId);
        if (!entry) return;
        if (isDriverOpenClose(entry.ifc)) {
            (entry.ifc as DriverOpenClose).close();
        }
    }

    /** Send data to an interface (used by SendData actions). */
    sendToInterface(ifcId: number, data: any): void {
        const entry = this.interfaces.find(i => i.props.id === ifcId);
        if (!entry) return;
        bellogRuntimeDebug.log(`[IFC TX] "${entry.props.name}"`, data);
        entry.ifc.send(data);
    }

    /**
     * Manually feed data through an interface's input pipeline.
     * Used by the toolbar "Paste" button.
     */
    feedData(ifcId: number, data: string | Uint8Array): void {
        const entry = this.interfaces.find(i => i.props.id === ifcId);
        if (!entry) return;
        bellogRuntimeDebug.log(`[IFC RX] "${entry.props.name}"`, data);
        const now = new Date();
        bellogRuntimeLayerController.outputFromIfc(entry.props, Date.now(), {
            data: data,
            _origin: {
                datetime: now,
                time: now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 } as any),
                timestamp: now.getTime(),
            },
        });
    }
}

export const bellogRuntime = new BellogRuntime();