import * as React from "react";
import {
    defaultOperators,
    formatQuery,
    QueryBuilder,
    RuleGroupType,
} from "react-querybuilder";
import {QueryBuilderBulma} from "@react-querybuilder/bulma";
import 'react-querybuilder/dist/query-builder.css';
import '../../../myquerystyles.css'
import {useDispatch, useSelector} from "react-redux";
import {parseCEL} from "react-querybuilder/parseCEL";
import {IOParameter} from "../../common/model/profile/Layer";


export const RegexComponent = (props: {
    regex: string,
    onRegexUpdate: (regex: string) => void
}) => {

    const regex= props.regex

    return (
        <div className="field">
            <label className="label">Regex</label>
            <div className="control">
                <input className="input" type="text" placeholder="Regex input" value={regex}
                       onChange={(evt) => props.onRegexUpdate( evt.target.value)
                       }/>
            </div>
        </div>
    );
}