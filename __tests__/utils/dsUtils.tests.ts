import path = require("path");
import dsUtils = require("../../src/utils/dsUtils");

describe(`DS Util Tests`, () => {

    it(`Is DS Module with DS Prefix - True`, () => {
        const moduleID = `DS/GEOExplorationCorpusClient/Services/dsexplorationService`;
        expect(dsUtils.isDSModule(moduleID)).toBeTruthy();
    });

    it(`Is DS Module without DS Prefix - False`, () => {
        const moduleID = `UWA/Core`;
        expect(dsUtils.isDSModule(moduleID)).toBeFalsy();
    });

    it(`Get DS Module Name - `, () => {
        const moduleID = `DS/GEOExplorationCorpusClient/Services/dsexplorationService`;
        const moduleName = `GEOExplorationCorpusClient`;
        expect(dsUtils.getDSModuleName(moduleID)).toBe(moduleName);
    });

    it(`Get Module Path from Module ID - with DS prefix`, () => {
        const moduleID = `DS/GEOExplorationCorpusClient/Services/dsexplorationService`;
        const modulePath = `GEOExplorationCorpusClient/Services/dsexplorationService`;
        expect(dsUtils.getDSModuleFilePath(moduleID)).toBe(modulePath);
    });

    it(`Get Module Path from Module ID - without DS Prefix`, () => {
        const moduleID = `UWA/Core`;
        const modulePath = `UWA/Core`;
        expect(dsUtils.getDSModuleFilePath(moduleID)).toBe(modulePath);
    });

    /**
     * Ensure that that we are able to determine the webapps path from the 
     * BSF
     */
    it(`Get WebAppPath From BSF`, async () => {
        const preqPath = `\\\\ap-bri-san03b\\\\R422\\\\BSF`;

        const preqWebAppPath = path.resolve(preqPath, "win_b64", "webapps");
        const foundPath = await dsUtils.getWebAppPathForPrereq(preqPath);

        expect(foundPath.path).toBe(preqWebAppPath);
        return;
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

        const modulePath = await dsUtils.doesModuleExistForWebApps(moduleID, prereq);
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

        const modulePath = await dsUtils.doesModuleExistForWebApps(moduleID, webappsPath);
        expect(modulePath).toBe(expectedPath);
    });
});
