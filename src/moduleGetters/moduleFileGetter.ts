import fs = require("fs");
import path = require("path");
import util = require("util");
import { DSUtils } from "../utils/dsUtils";
import { WIN_B64 } from "../utils/dsUtils";
import { LINUX_A64 } from "../utils/dsUtils";
import { WEB_APPS } from "../utils/dsUtils";
import { IModuleGetter } from "./moduleGetterTypes";
import { IResponseData } from "./moduleGetterTypes";

export type FileExists = (path: string) => Promise<boolean>;
export type ReadFile = (path: string, encoding: string) => Promise<string>;

export interface IWebAppPaths { [key: string]: string; }

export interface IFileUtils {

    /**
     * Helper to test that a file/dir exists
     */
    fsExists: FileExists;

    /**
     * Helper to read a file
     */
    readFile: ReadFile;
}

export class ModuleFileGetter implements IModuleGetter {

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
            readFile: util.promisify(fs.readFile),
        };

        this._webAppPaths = {};
    }

    /**
     * Async File Exists Checker
     */
    private get fsExists(): FileExists {
        return this._fileUtils.fsExists;
    }

    /**
     * Async File Reader
     */
    private get readFile(): ReadFile {
        return this._fileUtils.readFile;
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
     * Read the contents of a DS Module and return the string result back.
     * This will search through the current prerequisites or through the supplied
     * webAppsPaths to find the module file.
     *
     * If no module file is found an exception will be thrown
     * @throws
     * @param {string} moduleID - DS Module we are trying to load
     * @param {string[]} [webAppPaths] - Optional collection of webAppPaths to search through
     */
    public async getModule(moduleID: string, webAppPaths?: string[]): Promise<IResponseData> {
        const modulePath = await this.getModulePath(moduleID, webAppPaths);
        if (modulePath) {
            const moduleData = await this.readFile(modulePath, `utf8`);
            return {
                data: moduleData,
                requestPath: modulePath,
            };
        } else {
            throw new Error(`Unable to find file for: ${moduleID}`);
        }
    }

    /**
     * Find the file path for the supplied DS Module by looking in the currently stored
     * Prerequisite webApps locations or against the optionally supplied webAppPaths.
     * This will search through the prerequisites in the order they are stored.
     * @param {string} moduleID - DS Module to find the path for
     * @param {string[]} [webAppPaths] - Optional WebAppPaths to control where to look
     */
    public async getModulePath(moduleID: string, webAppPaths?: string[]): Promise<string> {
        webAppPaths = webAppPaths || Object.values(this.webAppPaths);

        let filePath = "";
        for (const webAppPath of webAppPaths) {
            filePath = await this.doesModuleExistForWebApps(moduleID, webAppPath);
            if (filePath) { break; }
        }

        return filePath;
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
    public async getWebAppPathForPrerequisite(prereqPath: string): Promise<{ prereq: string, path: string }> {
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
    public async setPrerequisites(prereqPaths: string[]): Promise<IWebAppPaths> {
        const promises = prereqPaths.map((preq) => this.getWebAppPathForPrerequisite(preq));

        const data = await Promise.all(promises);
        this._webAppPaths = data.reduce((accumulator, pathData) => {
            accumulator[pathData.prereq] = pathData.path;
            return accumulator;
        }, Object.create(null) as IWebAppPaths);

        return this.webAppPaths;
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
        const moduleName = DSUtils.instance.getDSModuleName(moduleID);
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
                DSUtils.instance.getDSModuleFilePath(moduleID) + ".js",
            );

            found = await this.fsExists(modulePath);
            return found ? modulePath : "";
        }
    }
}
