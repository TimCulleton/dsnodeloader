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
});
