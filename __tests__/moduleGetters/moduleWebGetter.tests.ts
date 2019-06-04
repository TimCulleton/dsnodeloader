import { ModuleWebGetter } from "../../src/moduleGetters/moduleWebGetter";

describe(`Module Web Getter Tests`, () => {
    let moduleGetter: ModuleWebGetter;

    beforeEach(() => {
        moduleGetter = new ModuleWebGetter();
    });

    it(`Set Host URL - fully qualified name`, () => {
        const hostUrl = `http://LP5-HQ9-AUS.dsone.3ds.com:8176`;
        const isHttps = false;
        const hostName = `LP5-HQ9-AUS.dsone.3ds.com`;
        const port = 8176;

        moduleGetter.setHostUrl(hostUrl);
        expect(moduleGetter.hostName).toBe(hostName);
        expect(moduleGetter.port).toBe(port);
        expect(moduleGetter.isHttps).toBe(isHttps);
    });

    it(`Set Host URL - localhost name`, () => {
        const hostUrl = `http://localhost:8176`;
        const isHttps = false;
        const hostName = `localhost`;
        const port = 8176;

        moduleGetter.setHostUrl(hostUrl);
        expect(moduleGetter.hostName).toBe(hostName);
        expect(moduleGetter.port).toBe(port);
        expect(moduleGetter.isHttps).toBe(isHttps);
    });

    /**
     * Get the request url of the specified module
     */
    it(`Get Module Path - Non Concatenated`, async () => {
        const moduleID = `DS/GEOCommonClient/Services/ServiceBase`;
        const hostUrl = `http://localhost:8176`;
        const expectedPath = `${hostUrl}/GEOCommonClient/Services/ServiceBase.js`;

        const requestPath = await moduleGetter.setHostUrl(hostUrl).getModulePath(moduleID);
        expect(requestPath).toBe(expectedPath);
    });

    /**
     * Make a request to retrieve the module js file
     * from the server
     */
    it(`Get Module Data`, async () => {
        const moduleID = `DS/GEOCommonClient/Services/ServiceBase`;
        const hostUrl = `http://localhost:8176`;

        moduleGetter.setHostUrl(hostUrl);
        const responseData = await moduleGetter.getModule(moduleID);
        expect(responseData).toBeTruthy();
        expect(responseData.data).toBeTruthy();
        expect(responseData.requestPath).toBeTruthy();
    });

});
