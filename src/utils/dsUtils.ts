import child_process = require("child_process");
import fs = require("fs");
import path = require("path");
import util = require("util");

const fsExists = util.promisify(fs.exists);

let PreReqPaths: string[] = [];
let WebAppPaths: { [key: string]: string } = Object.create(null);

export const WIN_B64 = "win_b64";
export const LINUX_A64 = "linux_a64";
export const WEB_APPS = "webapps";

export function setPreqs(prereqs: string[]): void {
    PreReqPaths = prereqs.slice(0);
}

/**
 * Get the web app path for the supplied prereq path. Where the client
 * JS files live
 * This will attempt to search through the win_b64 and if that fails the linux_a64
 * folder.
 *
 * If the path exists the path will be returned else an empty string will be set on the path
 * value
 * @param {string} prereqPath - The Base mkmk prerequisite path. This should be something like
 * \\ap-bri-san03b\R422\BSF
 * 
 * @example Found Path
 * const pathData = await getWebAppPathForPrereq(`\\\\ap-bri-san03b\\R422\\BSF`);
 * pathData.path === `\\\\ap-bri-san03b\\R422\\BSF\\win_b64\\webapps`;
 * pathData.prereq === `\\\\ap-bri-san03b\\R422\\BSF`;
 */
export async function getWebAppPathForPrereq(prereqPath: string): Promise<{ prereq: string, path: string }> {
    return new Promise<{ prereq: string, path: string }>(async (resolve) => {
        let webAppPath = path.resolve(prereqPath, WIN_B64, WEB_APPS);

        let exists = await fsExists(webAppPath);
        if (exists) {
            resolve({
                prereq: prereqPath,
                path: webAppPath,
            });
        } else {

            webAppPath = path.resolve(prereqPath, LINUX_A64, WEB_APPS);
            exists = await fsExists(webAppPath);

            resolve({
                prereq: prereqPath,
                path: exists ? webAppPath : "",
            });
        }
    });
}

/**
 * 
 */
export async function initPrereqs(): Promise<{ [key: string]: string }> {
    const promises = PreReqPaths.map((preq) => getWebAppPathForPrereq(preq));

    const data = await Promise.all(promises);
    WebAppPaths = data.reduce((accumulator, pathData) => {
        accumulator[pathData.prereq] = pathData.path;
        return accumulator;
    }, Object.create(null) as { [key: string]: string });

    return WebAppPaths;
}

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

export async function getFilePathForDSModule(moduleID: string, prereqs?: string[]): Promise<string> {
    prereqs = prereqs || PreReqPaths;

    let filePath = "";
    for (const prereq of prereqs) {
        filePath = await doesModuleExistForWebApps(moduleID, prereq);
        if (filePath) { break; }
    }

    return filePath;
}

/**
 * Check to see if the specified module exists in the webAppsPath.
 * This will first try to find concatenated module where if that fails
 * it will fall back to searching for the individual module.
 *
 * If the module is found the path will be returned else an empty string
 *
 * @param {string} moduleID - DS Module to attempt to find
 * @param {strin} webAppsPath - WebAppsPath search in
 */
export async function doesModuleExistForWebApps(moduleID: string, webAppsPath: string): Promise<string> {
    const moduleName = getDSModuleName(moduleID);
    const concatenatedModulePath = path.resolve(
        webAppsPath,
        moduleName,
        moduleName + ".js",
    );

    // Concatenated Module
    let found = await fsExists(concatenatedModulePath);
    if (found) {
        return concatenatedModulePath;
    } else {
        // Single Module
        const modulePath = path.resolve(
            webAppsPath,
            getDSModuleFilePath(moduleID) + ".js",
        );

        found = await fsExists(modulePath);
        return found ? modulePath : "";
    }
}
