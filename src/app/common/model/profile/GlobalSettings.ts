export interface SettingsProperty {
    // reverse domain name notation (RDN) ex. com.myorg.application
    rdnId: string,
    isLibrary: boolean,
    version: string,
    maximumItemsPerView: number,
    debugMode?: boolean,
}