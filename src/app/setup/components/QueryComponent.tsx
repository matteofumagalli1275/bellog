import * as React from "react";
import {useMemo, useRef, useState, useEffect} from "react";
import {
    defaultOperators,
    formatQuery,
    Field,
    QueryBuilder,
    RuleGroupType,
} from "react-querybuilder";
import {QueryBuilderBulma} from "@react-querybuilder/bulma";
import 'react-querybuilder/dist/query-builder.css';
import '../../../myquerystyles.css'
import {parseCEL} from "react-querybuilder/parseCEL";
import {IOParameter} from "../../common/model/profile/Layer";

const initialQuery: RuleGroupType = { combinator: 'and', rules: [] };

export const QueryComponent = (props: {
    query: string,
    params: IOParameter[],
    onQueryUpdate: (query: string) => void
}) => {

    // Map IOParameter[] to react-querybuilder Field[] (needs name + label)
    const fields: Field[] = useMemo(() =>
        props.params.map(p => ({
            name: p.name,
            label: p.name,
            ...(p.values ? {values: p.values, valueEditorType: 'select' as const} : {}),
        })),
        [props.params]
    );

    // Keep query state internal to avoid re-parsing CEL on every keystroke (which causes defocus)
    const [query, setQuery] = useState<RuleGroupType>(() =>
        props.query ? parseCEL(props.query) : initialQuery
    );

    // Sync from parent only when the CEL string changes externally
    const lastEmitted = useRef(props.query);
    useEffect(() => {
        if (props.query !== lastEmitted.current) {
            lastEmitted.current = props.query;
            setQuery(props.query ? parseCEL(props.query) : initialQuery);
        }
    }, [props.query]);

    function handleChange(q: RuleGroupType) {
        setQuery(q);
        const cel = formatQuery(q, 'cel');
        lastEmitted.current = cel;
        props.onQueryUpdate(cel);
    }

    return (
        <div>

            <QueryBuilderBulma>
                <QueryBuilder fields={fields} query={query} onQueryChange={handleChange}/>
            </QueryBuilderBulma>

            <fieldset className="fieldset">
                <legend className="ml-2">Expression</legend>
                {props.query}
            </fieldset>

        </div>
    );
}