import path = require("path");
import { DSUtils } from "../../src/utils/dsUtils";
import { FileExists } from "../../src/utils/dsUtils";
import { WIN_B64 } from "../../src/utils/dsUtils";
import { WEB_APPS } from "../../src/utils/dsUtils";

describe(`DS Util Tests`, () => {
    let dsUtils: DSUtils;

    /**
     * Flag to control if the file checker should be
     * mocked out.
     * False will cause the the checkers to properly
     * access the files via the files system
     */
    const UseMock = true;

    beforeEach(() => {
        dsUtils = new DSUtils();
    });

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

        if (UseMock) {
            const fsChecker: FileExists = async (webappPath) => {
                const values = Object.values(expectedData);
                return values.indexOf(webappPath as string) !== -1;
            };
            dsUtils.updateFileUtils("fsExists", fsChecker);
        }

        await dsUtils.setPrereqs(Object.keys(expectedData));
        const data = dsUtils.webAppPaths;
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

        if (UseMock) {
            const fileChecker: FileExists = async (filePath) => {
                return true;
            };
            dsUtils.updateFileUtils("fsExists", fileChecker);
        }

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

        // When mocking we reject the first file check as it will attempt to find
        // the concatenated module.
        if (UseMock) {
            const moduleName = dsUtils.getDSModuleName(moduleID);
            const concatPath = path.resolve(
                webappsPath,
                moduleName,
                moduleName + ".js",
            );

            const fileChecker: FileExists = async (inputPath) => {
                return inputPath !== concatPath;
            };
            dsUtils.updateFileUtils("fsExists", fileChecker);
        }

        const modulePath = await dsUtils.doesModuleExistForWebApps(moduleID, webappsPath);
        expect(modulePath).toBe(expectedPath);
    });

    /**
     * Search for DS module file from multiple Prerequisite paths.
     * This will get a hit from the first path - local
     */
    it(`Get DS Module file path from multiple prerequisites - local file`, async () => {

        const local = "D:\\Dev\\gitWorkspaces\\WebApps";
        const BSF = "\\\\ap-bri-san03b\\R422\\BSF";
        const BSFTST = "\\\\ap-bri-san03b\\R422\\BSFTST";
        const moduleID = `DS/GEOCommonClient/Services/ServiceBase`;

        const localWebApps = path.resolve(local, WIN_B64, WEB_APPS);
        const BSFWebApps = path.resolve(BSF, WIN_B64, WEB_APPS);
        const BSFTSTWebApps = path.resolve(BSFTST, WIN_B64, WEB_APPS);
        const moduleName = dsUtils.getDSModuleFilePath(moduleID);

        const LocalModuleFilePath = path.resolve(
            localWebApps,
            moduleName + ".js",
        );

        // return true for the initial webapps dirs and the local modulePath
        if (UseMock) {
            const pathMap = [
                localWebApps,
                BSFWebApps,
                BSFTSTWebApps,
                LocalModuleFilePath,
            ].reduce((accumulator, key) => {
                accumulator[key] = true;
                return accumulator;
            }, {} as { [key: string]: boolean });

            const fileChecker: FileExists = async (suppliedPath) => {
                return !!pathMap[suppliedPath as string];
            };
            dsUtils.updateFileUtils("fsExists", fileChecker);
        }

        await dsUtils.setPrereqs([local, BSF, BSFTST]);
        const filePath = await dsUtils.getFilePathForDSModule(moduleID);

        expect(filePath).toBe(LocalModuleFilePath);
    });

    /**
     * Search for DS module file from multiple Prerequisite paths.
     * This will get a hit from the second path and will get the concatenated module
     */
    it(`Get DS Module file path from multiple prerequisites - BSF file`, async () => {

        const local = "D:\\Dev\\gitWorkspaces\\WebApps";
        const BSF = "\\\\ap-bri-san03b\\R422\\BSF";
        const BSFTST = "\\\\ap-bri-san03b\\R422\\BSFTST";
        const moduleID = `DS/ApplicationFrame/PlayerButton`;

        const localWebApps = path.resolve(local, WIN_B64, WEB_APPS);
        const BSFWebApps = path.resolve(BSF, WIN_B64, WEB_APPS);
        const BSFTSTWebApps = path.resolve(BSFTST, WIN_B64, WEB_APPS);

        const expectedPath = path.resolve(
            BSF,
            WIN_B64,
            WEB_APPS,
            `ApplicationFrame/ApplicationFrame.js`,
        );

        if (UseMock) {
            const pathMap = [
                localWebApps,
                BSFWebApps,
                BSFTSTWebApps,
                expectedPath,
            ].reduce((accumulator, key) => {
                accumulator[key] = true;
                return accumulator;
            }, {} as { [key: string]: boolean });

            const fileChecker: FileExists = async (suppliedPath) => {
                return !!pathMap[suppliedPath as string];
            };
            dsUtils.updateFileUtils("fsExists", fileChecker);
        }

        await dsUtils.setPrereqs([local, BSF, BSFTST]);
        const filePath = await dsUtils.getFilePathForDSModule(moduleID);

        expect(filePath).toBe(path.resolve(local, expectedPath));
    });
});
