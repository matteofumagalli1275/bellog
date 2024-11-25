import * as React from "react";
import { useLocation, useParams } from "react-router-dom";



export const PageRedirector = () => {

    const { profileVersion } = useParams()

    let url = window.location.href.replace(window.location.hash, "")
    let fileNameForLocalUse = ""
    let versionPath = profileVersion ? `/${profileVersion}` : "v0"
    if(url.endsWith("index.html")) {
        url = url.replace("index.html", "")
        fileNameForLocalUse = "index.html"
    }

    window.location.href = `${url}${versionPath}/${fileNameForLocalUse}${window.location.hash}`

    return (
        <React.Fragment>
        </React.Fragment>
    );
}

export default PageRedirector;