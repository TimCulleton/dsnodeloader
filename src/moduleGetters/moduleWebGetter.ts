import http from "http";
import https from "https";
import { DSUtils } from "../utils/dsUtils";
import { IModuleGetter } from "./moduleGetterTypes";
import { IResponseData } from "./moduleGetterTypes";

export interface IWebRequester {
    /**
     * Perform a get request using the supplied config data
     * returning back the: response, data and request path
     * @param {http.RequestOptions | https.RequestOptions} config - config object
     * that will have the following properties set:
     * host, port and path
     */
    get(config: http.RequestOptions | https.RequestOptions): Promise<IGetResponseData>;
}

/**
 * Wrapper interface to return back the additional http response object
 * from the request
 */
export interface IGetResponseData extends IResponseData {

    /**
     * Response object from the http/https request
     */
    response: http.IncomingMessage;
}

/**
 * Configuration object controlling the underlying
 * http/https request
 */
export interface IModuleWebGetterConfig {

    /**
     * Hostname of the server
     * eg: localhost
     */
    hostName?: string;

    /**
     * Port to make requests on
     */
    port?: number;

    /**
     * https mode
     */
    https?: boolean;
}

export class ModuleWebGetter implements IModuleGetter {

    private _config: IModuleWebGetterConfig;

    private _webRequester: IWebRequester;

    constructor(config?: IModuleWebGetterConfig) {
        this._config = config || {};
        this._webRequester = {
            get: this._makeRequest.bind(this),
        };
    }

    /**
     * Set the host url to make requests against.
     * The host url will have its: https mode, hostname and port
     * extracted and stored against the current request configuration
     * @param {string} hostUrl - Url that will be used to make requests against
     * EG: http://localhost:8176
     * This will cause the configuration to be updated as follows:
     * https: false\n
     * hostName: "localhost"
     * port: 8176
     */
    public setHostUrl(hostUrl: string): this {
        const matches = hostUrl.match(/(^\w+):\/\/(.+):(\d+)/);
        if (matches) {
            this.updateConfig("https", matches[1] === "https");
            this.updateConfig("hostName", matches[2]);
            this.updateConfig("port", parseInt(matches[3], 10));
            return this;
        } else {
            throw new Error(`Invalid Host URL: ${hostUrl}`);
        }
    }

    /**
     * Host name that is to be used for requests
     */
    public get hostName(): string {
        return this._config.hostName || "";
    }

    /**
     * Port that is to be used for requests
     */
    public get port(): number {
        return this._config.port || 8080;
    }

    /**
     * Will the requests use https
     */
    public get isHttps(): boolean {
        return !!this._config.https;
    }

    /**
     * Manually update a specified property of the request config.
     * Typically this will not need to be done as setting the hostUrl will
     * update the relevant properties
     * @param key - Property to change
     * @param value - Value to assign to the specified property
     */
    public updateConfig<T extends keyof IModuleWebGetterConfig>(key: T, value: IModuleWebGetterConfig[T]): this {
        this._config[key] = value;
        return this;
    }

    /**
     * Get the module by making a request to the currently configured server
     * by first trying to make a request for the concatenated module file then
     * if a 404 is returned for that a second request to the individual module file
     *
     * This will return the contents of the file in a plain string along with the
     * request url path
     * @param {moduleID} moduleID - DS Module to be loaded
     * @example
     * const requestData = await getModule(`DS/GEOCommonClient/Services/ServiceBase`);
     * requestData.data === "some-js-content";
     * requestData.requestPath === "http://localhost:8176/GEOCommonClient/Services/ServiceBase.js"
     */
    public async getModule(moduleID: string): Promise<IResponseData> {
        const moduleName = DSUtils.instance.getDSModuleName(moduleID);
        let path = `/${moduleName}/${moduleName}.js`;

        const responseHandler = (inputData: IGetResponseData): IResponseData => {
            return {
                requestPath: inputData.requestPath,
                data: inputData.data,
            };
        };

        let responseData = await this._getModuleImp(path, true);

        // Concatenated Module
        if (responseData) {
            return responseHandler(responseData);
        // Single Module
        } else {
            path = `/${DSUtils.instance.getDSModuleFilePath(moduleID)}.js`;
            responseData = await this._getModuleImp(path);
            return responseHandler(responseData);
        }
    }

    /**
     * Get the request url used to retrieve the DS Module.
     * Note - this will call the underlying getModule function due
     * to having to make a request to check the existence of the concatenated module file.
     * As a result it would be more performant to use 'getModule' as it will return the 
     * request path in addition to the data
     * @param {moduleID} moduleID - DS Module to be loaded
     * @deprecated
     * @example
     * const requestPath = await getModulePath(`DS/GEOCommonClient/Services/ServiceBase`);
     * requestPath === "http://localhost:8176/GEOCommonClient/Services/ServiceBase.js";
     */
    public async getModulePath(moduleID: string): Promise<string> {
        const data = await this.getModule(moduleID);
        return data.requestPath;
    }

    /**
     * Implementation of the 'getModule' where a http config object is built using the 
     * currently defined request configuration: host, port, https
     *
     * If the concatenated module flag is set and the resulting request returns a '404'
     * then 'undefined' will be returned.
     *
     * This is due to the common nature of modules only been in a concatenated module when
     * the module has been built in 'release' mode
     *
     * @param {string} modulePath - path to the module resource relative to the host
     * @param {boolean} [concatenatedModule] - Flag that denotes if the module request is 
     * concatenated.
     */
    private async _getModuleImp(modulePath: string, concatenatedModule?: boolean): Promise<IGetResponseData> {
        try {
            const data = await this._webRequester.get({
                host: this.hostName,
                path: modulePath,
                port: this.port,
            });
            return data;
        } catch (e) {
            const casted = e as http.IncomingMessage;
            if (concatenatedModule && casted.statusCode === 404) {
                return undefined as any;
            }
            // TODO - Make a logging tool
            console.error(e);
            throw e;
        }
    }

    /**
     * Internal http/https requester which will make a request 
     * to retrieve the resource.
     * The data from the request along with the http response as well as the request url will
     * be returned.
     *
     * If a non 200 response is returned then the response will be assumed to have failed and will reject
     * with the response object
     * @param {http.RequestOptions | https.RequestOptions} config - http request object specifying resource
     * to request
     * @throws
     */
    private _makeRequest(config: http.RequestOptions | https.RequestOptions): Promise<IGetResponseData> {
        return new Promise<IGetResponseData>((resolve, reject) => {
            const requester = this.isHttps ? https : http;

            const buffer: string[] = [];
            const requestUrl = `${this.isHttps ? `https` : `http`}://${config.host}:${config.port}${config.path}`;
            const request = requester.get(config, (response) => {

                response.on("data", (data: string) => {
                    buffer.push(data);
                });

                response.on("end", () => {
                    if (response.statusCode === 200) {
                        resolve({
                            data: buffer.join(""),
                            response,
                            requestPath: requestUrl,
                        });
                    } else {
                        reject(response);
                    }
                });

                response.on("error", (e) => {
                    reject(e);
                });
            });

            request.on("error", (e) => {
                reject(e);
            });
        });
    }
}
