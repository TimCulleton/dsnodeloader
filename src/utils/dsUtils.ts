import child_process = require("child_process");
import fs = require("fs");
import path = require("path");
import util = require("util");

// tslint:disable: variable-name

export type FileExists = (path: fs.PathLike) => Promise<boolean>;

export interface IWebAppPaths { [key: string]: string; }

export interface IFileUtils {

    /**
     * Helper to test that a file/dir exists
     */
    fsExists: FileExists;
}

export const WIN_B64 = "win_b64";
export const LINUX_A64 = "linux_a64";
export const WEB_APPS = "webapps";

export class DSUtils {

    private static _instance: DSUtils;

    /**
     * File Utilities allowing for easier dependency injection
     * and mocking
     */
    private _fileUtils: IFileUtils;

    /**
     * Collection of the currently stored File Paths
     */
    private _webAppPaths: IWebAppPaths;

    constructor() {
        this._fileUtils = {
            fsExists: util.promisify(fs.exists),
        };

        this._webAppPaths = {};
    }

    /**
     * Static Instance of DS Utils
     */
    static get instance(): DSUtils {
        if (!DSUtils._instance) {
            DSUtils._instance = new DSUtils();
        }

        return DSUtils._instance;
    }

    /**
     * Async File Exists Checker
     */
    private get fsExists(): FileExists {
        return this._fileUtils.fsExists;
    }

    /**
     * Map containing the the currently defined webApps
     * locations for the prereq paths
     */
    public get webAppPaths(): IWebAppPaths {
        return this._webAppPaths;
    }

    /**
     * Update File Utility Properties.
     * @param {T} key - Name of property to change
     * @param {IFileUtils[T]} value  - Value to be assigned to property
     */
    public updateFileUtils<T extends keyof IFileUtils>(key: T, value: IFileUtils[T]): this {
        this._fileUtils[key] = value;
        return this;
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
    public async getWebAppPathForPrereq(prereqPath: string): Promise<{ prereq: string, path: string }> {
        return new Promise<{ prereq: string, path: string }>(async (resolve) => {
            let webAppPath = path.resolve(prereqPath, WIN_B64, WEB_APPS);

            let exists = await this.fsExists(webAppPath);
            if (exists) {
                resolve({
                    prereq: prereqPath,
                    path: webAppPath,
                });
            } else {

                webAppPath = path.resolve(prereqPath, LINUX_A64, WEB_APPS);
                exists = await this.fsExists(webAppPath);

                resolve({
                    prereq: prereqPath,
                    path: exists ? webAppPath : "",
                });
            }
        });
    }

    /**
     * Set the Prerequisites paths triggering a search to try find the associated webApps location.
     * @param {string[]} prereqPaths - Prerequisite paths to find webApps locations on
     */
    public async setPrereqs(prereqPaths: string[]): Promise<IWebAppPaths> {
        const promises = prereqPaths.map((preq) => this.getWebAppPathForPrereq(preq));

        const data = await Promise.all(promises);
        this._webAppPaths = data.reduce((accumulator, pathData) => {
            accumulator[pathData.prereq] = pathData.path;
            return accumulator;
        }, Object.create(null) as IWebAppPaths);

        return this.webAppPaths;
    }

    /**
     * Test that the supplied module ID is a DS Module.
     * A DS module is defined as having a 'DS/' prefix
     * EG 'DS/GEOExplorationCorpusClient/Services/dsexplorationService'
     * @param {string} moduleID - AMD Module ID
     */
    public isDSModule(moduleID: string): boolean {
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
    public getDSModuleName(moduleID: string): string {
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
    public getDSModuleFilePath(moduleID: string): string {
        let filePath = moduleID;
        if (this.isDSModule(moduleID)) {
            const matches = moduleID.match(/^DS\/(.+)/);
            filePath = matches ? matches[1] : "";
        }

        return filePath;
    }

    /**
     * Find the file path for the supplied DS Module by looking in the currently stored
     * Prerequisite webApps locations or against the optionally supplied webAppPaths.
     * This will search through the prerequisites in the order they are stored.
     * @param {string} moduleID - DS Module to find the path for
     * @param {string[]} [webAppPaths] - Optional WebAppPaths to control where to look
     */
    public async getFilePathForDSModule(moduleID: string, webAppPaths?: string[]): Promise<string> {
        webAppPaths = webAppPaths || Object.values(this.webAppPaths);

        let filePath = "";
        for (const webAppPath of webAppPaths) {
            filePath = await this.doesModuleExistForWebApps(moduleID, webAppPath);
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
     * @param {string} webAppsPath - WebAppsPath search in
     */
    public async doesModuleExistForWebApps(moduleID: string, webAppsPath: string): Promise<string> {
        const moduleName = this.getDSModuleName(moduleID);
        const concatenatedModulePath = path.resolve(
            webAppsPath,
            moduleName,
            moduleName + ".js",
        );

        // Concatenated Module
        let found = await this.fsExists(concatenatedModulePath);
        if (found) {
            return concatenatedModulePath;
        } else {
            // Single Module
            const modulePath = path.resolve(
                webAppsPath,
                this.getDSModuleFilePath(moduleID) + ".js",
            );

            found = await this.fsExists(modulePath);
            return found ? modulePath : "";
        }
    }
}
