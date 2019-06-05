export const WIN_B64 = "win_b64";
export const LINUX_A64 = "linux_a64";
export const WEB_APPS = "webapps";

/**
 * Test that the supplied module ID is a DS Module.
 * A DS module is defined as having a 'DS/' prefix
 * EG 'DS/GEOExplorationCorpusClient/Services/dsexplorationService'
 * @param {string} moduleID - AMD Module ID
 */
export function isDSModule(moduleID: string): boolean {
    return !!moduleID.match(/^DS/);
}

/**
 * Extract the module name from the AMD module ID.
 * DS module naming convention is text after the DS/ between
 * the slash tags to be the Module name.
 *
 * @param {string} moduleID - AMD Module ID
 *
 * @example
 * const moduleName = getDSModuleName('DS/GEOExplorationCorpusClient/Services/dsexplorationService');
 * moduleName === `GEOExplorationCorpusClient`;
 */
export function getDSModuleName(moduleID: string): string {
    const matches = moduleID.match(/^DS\/(\w+)\/.+/);
    return matches ? matches[1] : "";
}

/**
 * Extract the the Module Path from the AMD Module ID.
 * DS Module naming convention is text after the DS/
 * to map the file structure inside the web apps folder.
 * 
 * @param {string} moduleID - AMD Module ID
 * @example Usage
 * const modulePath = getDSModuleFilePath(`DS/GEOExplorationCorpusClient/Services/dsexplorationService`);
 * modulePath === `GEOExplorationCorpusClient/Services/dsexplorationService`;
 */
export function getDSModuleFilePath(moduleID: string): string {
    let filePath = moduleID;
    if (isDSModule(moduleID)) {
        const matches = moduleID.match(/^DS\/(.+)/);
        filePath = matches ? matches[1] : "";
    }

    return filePath;
}
