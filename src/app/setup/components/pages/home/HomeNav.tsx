import * as React from "react";
import {NavLink, Outlet} from "react-router-dom";
import {dbEntriesSelectors} from "../../../store/dbEntries/dbEntries";
import {useSelector} from "react-redux";

export const HomeNav = () => {

    const workspaces = useSelector(dbEntriesSelectors.selectWorkspaces)

    return <React.Fragment>
        <section className="section">
            <div className="container">
                <div className="columns">
                    <div className="column is-one-quarter">
                        <aside className="menu">
                            <p className="menu-label">Navigation</p>
                            <ul className="menu-list">
                                <li>
                                    <NavLink className={({isActive}) => isActive ? 'is-active' : ""}
                                             to="/#">Dashboard</NavLink>
                                </li>
                                <li>
                                    <NavLink className={({isActive}) => isActive ? 'is-active' : ""}
                                             to="workspaces">Workspaces</NavLink>
                                    <ul>
                                        {
                                            workspaces.map((workspace) =>
                                                <li key={workspace.id}>
                                                    <NavLink className={({isActive}) => isActive ? 'is-active' : ""}
                                                             to={`workspace/${workspace.id}`}>{workspace.name}</NavLink>
                                                </li>
                                            )
                                        }
                                    </ul>
                                </li>
                                <li>
                                    <NavLink className={({isActive}) => isActive ? 'is-active' : ""}
                                             to="settings">Settings</NavLink>
                                </li>
                            </ul>
                        </aside>
                    </div>
                    <Outlet/>
                </div>
            </div>
        </section>
    </React.Fragment>;
}

export default HomeNav;