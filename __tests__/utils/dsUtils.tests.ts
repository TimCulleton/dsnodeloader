import path = require("path");
import * as dsUtils from "../../src/utils/dsUtils";

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

});
