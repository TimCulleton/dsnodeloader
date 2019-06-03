import path = require("path");
import { DSUtils } from "../../src/utils/dsUtils";

describe(`DS Util Tests`, () => {

    it(`Is DS Module with DS Prefix - True`, () => {
        const moduleID = `DS/GEOExplorationCorpusClient/Services/dsexplorationService`;
        expect(DSUtils.instance.isDSModule(moduleID)).toBeTruthy();
    });

    it(`Is DS Module without DS Prefix - False`, () => {
        const moduleID = `UWA/Core`;
        expect(DSUtils.instance.isDSModule(moduleID)).toBeFalsy();
    });

    it(`Get DS Module Name - `, () => {
        const moduleID = `DS/GEOExplorationCorpusClient/Services/dsexplorationService`;
        const moduleName = `GEOExplorationCorpusClient`;
        expect(DSUtils.instance.getDSModuleName(moduleID)).toBe(moduleName);
    });

    it(`Get Module Path from Module ID - with DS prefix`, () => {
        const moduleID = `DS/GEOExplorationCorpusClient/Services/dsexplorationService`;
        const modulePath = `GEOExplorationCorpusClient/Services/dsexplorationService`;
        expect(DSUtils.instance.getDSModuleFilePath(moduleID)).toBe(modulePath);
    });

    it(`Get Module Path from Module ID - without DS Prefix`, () => {
        const moduleID = `UWA/Core`;
        const modulePath = `UWA/Core`;
        expect(DSUtils.instance.getDSModuleFilePath(moduleID)).toBe(modulePath);
    });

    /**
     * Ensure that that we are able to determine the webapps path from the 
     * BSF
     */
    it(`Get WebAppPath From BSF`, async () => {
        const preqPath = `\\\\ap-bri-san03b\\\\R422\\\\BSF`;

        const preqWebAppPath = path.resolve(preqPath, "win_b64", "webapps");
        const foundPath = await DSUtils.instance.getWebAppPathForPrereq(preqPath);

        expect(foundPath.path).toBe(preqWebAppPath);
        return;
    });

    it(`Set PreReqs`, async () => {
        const expectedData = {
            "D:\\Dev\\gitWorkspaces\\WebApps": path.resolve(`D:\\Dev\\gitWorkspaces\\WebApps`, "win_b64", "webapps"),
            "\\\\ap-bri-san03b\\R422\\BSF": path.resolve(`\\\\ap-bri-san03b\\R422\\BSF`, "win_b64", "webapps"),
            "\\\\ap-bri-san03b\\R422\\BSFTST": path.resolve(`\\\\ap-bri-san03b\\R422\\BSFTST`, "win_b64", "webapps"),
        } as { [key: string]: string };

        await DSUtils.instance.setPrereqs(Object.keys(expectedData));

        const data = DSUtils.instance.webAppPaths;
        const keys = Object.keys(expectedData);
        expect(Object.keys(data).length).toBe(keys.length);

        for (const key of keys) {
            expect(data[key]).toBe(expectedData[key]);
        }
    });

    /**
     * Find the file for a module that has been concatenated
     * In this scenario individual files will not exist
     * instead they will be outputted into a single module file
     */
    it(`Get Module from BSF - Concatenated`, async () => {
        const prereq = `\\\\ap-bri-san03b\\\\R422\\\\BSF\\win_b64\\webapps`;
        const moduleID = `DS/ApplicationFrame/PlayerButton`;
        const expectedPath = path.resolve(
            prereq,
            `ApplicationFrame/ApplicationFrame.js`,
        );

        const modulePath = await DSUtils.instance.doesModuleExistForWebApps(moduleID, prereq);
        expect(modulePath).toBe(expectedPath);
    });

    /**
     * Find the file for a module that has not been concatenated.
     * In this scenario js files have been outputted into the structure
     * as defined in the Module ID
     */
    it(`Get Module from BSF - Individual Files`, async () => {
        const webappsPath = `\\\\ap-bri-san03b\\\\R422\\\\BSF\\win_b64\\webapps`;
        const moduleID = `DS/GEOCommonClient/Services/ServiceBase`;
        const expectedPath = path.resolve(
            webappsPath,
            `GEOCommonClient/Services/ServiceBase.js`,
        );

        const modulePath = await DSUtils.instance.doesModuleExistForWebApps(moduleID, webappsPath);
        expect(modulePath).toBe(expectedPath);
    });
});
