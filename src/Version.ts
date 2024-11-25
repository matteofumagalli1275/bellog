
export const PROFILE_VERSION = "5"
export const SCHEMA_VERSION = 1
export const VERSION = "v0.3.0"

export function checkVersionForRedirection(setupVersion: string) {
    if(setupVersion !== PROFILE_VERSION) {
        let url = window.location.href.replace(window.location.hash, "")
        let fileNameForLocalUse = ""
        if(url.endsWith("index.html")) {
            url = url.replace("index.html", "")
            fileNameForLocalUse = "index.html"
        }
    
        const newLoc = `${url}pv${setupVersion}/${fileNameForLocalUse}${window.location.hash}`
        window.location.replace(newLoc)
    }
}