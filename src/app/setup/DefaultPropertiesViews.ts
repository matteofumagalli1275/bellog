import {LayoutType, ViewFragmentType, ViewProperty, ViewType} from "../common/model/profile/View";
import {generateUniqueName} from "../common/utility/JSUtils";
import {buildDefaultViewFragment} from "./DefaultProperties";


export function buildDefaultView(values: ViewProperty[]): [number, ViewProperty] {

    let maxId = Math.max(...values.map(o => o.id))
    maxId = maxId < 0 ? 0 : maxId

    const newName = generateUniqueName("View", values.map((it) => it.name))

    return [
        maxId + 1, {
            id: maxId + 1,
            name: newName,
            layout: LayoutType.Full,
            type: ViewType.TabView,
            config: {
                fragment1: buildDefaultViewFragment(ViewFragmentType.Append),
                fragment2: buildDefaultViewFragment(ViewFragmentType.Append),
                fragment3: buildDefaultViewFragment(ViewFragmentType.Append)
            },
            deleted: false
        }
    ]
}