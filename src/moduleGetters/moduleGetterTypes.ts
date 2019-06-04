
export interface IResponseData {
    /**
     * Data/Content retrieved from the resource
     */
    data: string;

    /**
     * Path used to retrieve the specified resource
     */
    requestPath: string;
}

export interface IModuleGetter {

    /**
     * Make a request to retrieve the contents of the supplied
     * DS Module and return the request path used to retrieve
     * the module
     * @param {string} moduleID - DS Module ID
     */
    getModule(moduleID: string): Promise<IResponseData>;

    /**
     * Get the request path to access the the supplied DS Module
     * @param {string} moduleID - DS Module ID 
     */
    getModulePath(moduleID: string): Promise<string>;
}
