/**
 * Event engine — subscribes to the DataBus for each configured Event
 * and triggers the associated Action when conditions match.
 */
import {EventProperty, EventType, EventChannelUpdate} from "../../common/model/profile/Event";
import {ProfileProperty} from "../../common/model/profile/Profile";
import {
    CompareDataType,
    CompareDataCode,
    CompareDataQuery,
    CompareDataRegex,
} from "../../common/model/profile/Common";
import {bellogRuntimeDataBus, DataBusEntry} from "./BellogRuntimeDataBus";
import {executeAction} from "./BellogRuntimeActionExecutor";

class BellogRuntimeEventEngine {

    private unsubscribes: (() => void)[] = [];

    /**
     * Initialize the event engine with the loaded profile.
     * Sets up DataBus subscriptions for each event.
     */
    init(profile: ProfileProperty): void {
        this.destroy();

        for (const event of profile.events) {
            if ((event as any).deleted) continue;
            switch (event.type) {
                case EventType.ChannelUpdate:
                    this.setupChannelUpdateEvent(event);
                    break;
            }
        }
    }

    private setupChannelUpdateEvent(event: EventProperty): void {
        const config = event.config as EventChannelUpdate;
        if (!config.channelRef) return;

        const channelId = config.channelRef.refId;
        const nodeId = config.layerId.toString();

        const unsub = bellogRuntimeDataBus.subscribe(channelId, nodeId, (entry: DataBusEntry) => {
            if (entry.error) return; // skip error entries

            if (this.evaluateEventCondition(config, entry.data)) {
                executeAction(config.actionRef, entry.data);
            }
        });

        this.unsubscribes.push(unsub);
    }

    private evaluateEventCondition(config: EventChannelUpdate, data: any): boolean {
        const type = config.compareType;
        const settings = config.compareDataSettings;
        if (!settings) return true;

        try {
            switch (type) {
                case CompareDataType.Code: {
                    const code = (settings as CompareDataCode).code;
                    if (!code || code.trim().length === 0) return true;
                    const fn = new Function('data', code);
                    return !!fn(data);
                }
                case CompareDataType.Query: {
                    const query = (settings as CompareDataQuery).query;
                    if (!query || query.trim().length === 0) return true;
                    const fn = new Function('data', 'return ' + query);
                    return !!fn(data);
                }
                case CompareDataType.Regex: {
                    const regex = (settings as CompareDataRegex).regex;
                    if (!regex || regex.trim().length === 0) return true;
                    const re = new RegExp(regex);
                    const str = typeof data === 'string' ? data : JSON.stringify(data);
                    return re.test(str);
                }
                default:
                    return true;
            }
        } catch (e) {
            console.error('[EventEngine] condition evaluation error:', e);
            return false;
        }
    }

    /** Tear down all event subscriptions. */
    destroy(): void {
        for (const unsub of this.unsubscribes) unsub();
        this.unsubscribes = [];
    }
}

export const bellogRuntimeEventEngine = new BellogRuntimeEventEngine();
