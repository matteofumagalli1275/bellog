import * as React from "react";
import {Link, useLocation} from "react-router-dom";

export enum SetupSideBarItems {
    MainSettings = "MainSettings",
    View = "View",
    CustomHtmlComponents = "CustomHtmlComponents",
    CustomParserAndBuilders = "CustomParserAndBuilders",
    Actions = "Actions",
    CustomCodeAndStyles = "CustomCodeAndStyles",
    OtherSettings = "OtherSettings"
}

export const SetupSiedBar = () => {

    const location = useLocation();

    // Helper function to check if the last segment of the current path matches the link's destination
    const isActive = (path: string) => {
        const currentPathSegments = location.pathname.split('/');
        // We use slice(-1)[0] to get the last segment of the path
        return currentPathSegments.slice(-1)[0] === path.split('/').slice(-1)[0];
    };

    const handleBlur = (event: React.MouseEvent<HTMLAnchorElement>) => {
        const target = event.currentTarget;
        setTimeout(() => target.blur(), 0); // Ensure focus is removed after navigation
    };

    const style = "sidelink is-clickable has-text-white has-tooltip-right"

    return (
        <div className="column is-flex is-flex-direction-column
                    is-align-items-center is-justify-content-space-between has-background-color-primary-plus "
            style={{width: "60px", flex: "none"}}>
            <Link className={`${style} ${isActive("/setup") ? 'has-background-color-primary-plus-selected' : ''}`}
                data-tooltip="Main settings" to={""}
                  onClick={handleBlur}>
                <i className="fas fa-lg fa-address-card "></i>
            </Link>

            <Link className={`${style} ${isActive('/views') ? 'has-background-color-primary-plus-selected' : ''}`}
                  data-tooltip="View" to={"views"}>
                <i className="fas fa-lg fa-mountain-sun "></i>
            </Link>

            <Link className={`${style} ${isActive('/htmls') ? 'has-background-color-primary-plus-selected' : ''}`}
                data-tooltip="Custom Html Components" to={"htmls"}
                  onClick={handleBlur}>
                <i className="fas fa-lg fa-pencil "></i>
            </Link>

            <Link className={`${style} ${isActive('/layers') ? 'has-background-color-primary-plus-selected' : ''}`}
                  data-tooltip="Layers" to={"layers"}
                  onClick={handleBlur}>
                <i className="fas fa-lg fa-arrow-down-up-across-line "></i>
            </Link>

            <Link className={`${style} ${isActive('/events') ? 'has-background-color-primary-plus-selected' : ''}`}
                  data-tooltip="Events" to={"events"}>
                <i className="fas fa-lg fa-bolt"></i>
            </Link>

            <Link className={`${style} ${isActive('/scripts') ? 'has-background-color-primary-plus-selected' : ''}`}
                data-tooltip="Custom Code and Styles" to={"scripts"}
                onClick={handleBlur}>
                <i className="fas fa-lg fa-code "></i>
            </Link>

            <Link className={`${style} ${isActive('/settings') ? 'has-background-color-primary-plus-selected' : ''}`}
                data-tooltip="Advanced Settings" to={"settings"}
                onClick={handleBlur}>
                <i className="fas fa-lg fa-gear "></i>
            </Link>
        </div>
    )
}
