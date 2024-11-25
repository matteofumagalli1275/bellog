import {appStore, RootState} from "../store/AppStore";

export function buildIframePreviewSource(bodyCode: string) {

    const customScripts = Object.values(appStore.getState().profile.scripts.entities)
    const customStyles = Object.values(appStore.getState().profile.styles.entities)

    const source = `
                        <!DOCTYPE html>
                        <html lang="en">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <script type="text/javascript" src="/purify.min.js"></script>
                            <title>Preview</title>
                            ${customStyles.map((it) => {
        return `<style id=${it.name}>${it.code}</style>`;
    }).join("\r\n")}
                            <script>
                            const bellog = new Proxy({}, {
                                get(target, prop) {
                                    if (!(prop in target)) {
                                        target[prop] = new Proxy({}, {
                                            get(subTarget, subProp) {
                                                return subTarget[subProp]; // Default behavior
                                            },
                                            set(subTarget, subProp, value) {
                                                subTarget[subProp] = value;
                                                return true; // Indicate success
                                            }
                                        });
                                    }
                                    return target[prop];
                                }
                            });
                            </script>
                            
                            ${customScripts.map((it) => {
        return `<script id=${it.name} type="text/javascript">${it.code}</script>`;
    }).join("\r\n")}
                        </head>
                        <body>
                            ${bodyCode}
                        </body>
                        </html>
                        `

    return source;
}