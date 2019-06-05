import path = require("path");
import { ModuleFileGetter } from "../../src/moduleGetters/moduleFileGetter";
import { FileExists } from "../../src/moduleGetters/moduleFileGetter";
import * as dsUtils from "../../src/utils/dsUtils";

describe(`Module File Getter Tests`, () => {
    let moduleFileGetter: ModuleFileGetter;

    const UseMock = true;

    beforeEach(() => {
        moduleFileGetter = new ModuleFileGetter();
    });

    /**
     * Ensure that that we are able to determine the webapps path from the 
     * BSF
     */
    it(`Get WebAppPath From BSF`, async () => {
        const preqPath = `\\\\ap-bri-san03b\\\\R422\\\\BSF`;

        const preqWebAppPath = path.resolve(preqPath, "win_b64", "webapps");
        const foundPath = await moduleFileGetter.getWebAppPathForPrerequisite(preqPath);

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
            moduleFileGetter.updateFileUtils("fsExists", fsChecker);
        }

        await moduleFileGetter.setPrerequisites(Object.keys(expectedData));
        const data = moduleFileGetter.webAppPaths;
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
            moduleFileGetter.updateFileUtils("fsExists", fileChecker);
        }

        const modulePath = await moduleFileGetter.doesModuleExistForWebApps(moduleID, prereq);
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
            moduleFileGetter.updateFileUtils("fsExists", fileChecker);
        }

        const modulePath = await moduleFileGetter.doesModuleExistForWebApps(moduleID, webappsPath);
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

        const localWebApps = path.resolve(local, dsUtils.WIN_B64, dsUtils.WEB_APPS);
        const BSFWebApps = path.resolve(BSF, dsUtils.WIN_B64, dsUtils.WEB_APPS);
        const BSFTSTWebApps = path.resolve(BSFTST, dsUtils.WIN_B64, dsUtils.WEB_APPS);
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
            moduleFileGetter.updateFileUtils("fsExists", fileChecker);
        }

        await moduleFileGetter.setPrerequisites([local, BSF, BSFTST]);
        const filePath = await moduleFileGetter.getModulePath(moduleID);

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

        const localWebApps = path.resolve(local, dsUtils.WIN_B64, dsUtils.WEB_APPS);
        const BSFWebApps = path.resolve(BSF, dsUtils.WIN_B64, dsUtils.WEB_APPS);
        const BSFTSTWebApps = path.resolve(BSFTST, dsUtils.WIN_B64, dsUtils.WEB_APPS);

        const expectedPath = path.resolve(
            BSF,
            dsUtils.WIN_B64,
            dsUtils.WEB_APPS,
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
            moduleFileGetter.updateFileUtils("fsExists", fileChecker);
        }

        await moduleFileGetter.setPrerequisites([local, BSF, BSFTST]);
        const filePath = await moduleFileGetter.getModulePath(moduleID);

        expect(filePath).toBe(path.resolve(local, expectedPath));
    });

    it(`Read DS Module File`, async () => {
        const local = "D:\\Dev\\gitWorkspaces\\WebApps";
        const BSF = "\\\\ap-bri-san03b\\R422\\BSF";
        const BSFTST = "\\\\ap-bri-san03b\\R422\\BSFTST";
        const moduleID = `DS/ApplicationFrame/PlayerButton`;

        const localWebApps = path.resolve(local, dsUtils.WIN_B64, dsUtils.WEB_APPS);
        const BSFWebApps = path.resolve(BSF, dsUtils.WIN_B64, dsUtils.WEB_APPS);
        const BSFTSTWebApps = path.resolve(BSFTST, dsUtils.WIN_B64, dsUtils.WEB_APPS);

        const expectedPath = path.resolve(
            BSF,
            dsUtils.WIN_B64,
            dsUtils.WEB_APPS,
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
            moduleFileGetter.updateFileUtils("fsExists", fileChecker);

            // Mock out the read file to return random data
            // Also validate that the supplied path is correct
            moduleFileGetter.updateFileUtils("readFile", async (moduleFilePath, encoding) => {
                expect(moduleFilePath).toBe(expectedPath);
                expect(encoding).toBe("utf8");
                return "random data";
            });
        }

        await moduleFileGetter.setPrerequisites([local, BSF, BSFTST]);
        const fileContent = await moduleFileGetter.getModule(moduleID);
        expect(fileContent).toBeTruthy();
        expect(fileContent.data).toBeTruthy();
        expect(fileContent.requestPath).toBeTruthy();
    });

    it(`Read DS Module File - File does not exist Throw Error`, async () => {
        const local = "D:\\Dev\\gitWorkspaces\\WebApps";
        const BSF = "\\\\ap-bri-san03b\\R422\\BSF";
        const BSFTST = "\\\\ap-bri-san03b\\R422\\BSFTST";
        const moduleID = `DS/Fake/Fake`;

        const localWebApps = path.resolve(local, dsUtils.WIN_B64, dsUtils.WEB_APPS);
        const BSFWebApps = path.resolve(BSF, dsUtils.WIN_B64, dsUtils.WEB_APPS);
        const BSFTSTWebApps = path.resolve(BSFTST, dsUtils.WIN_B64, dsUtils.WEB_APPS);

        if (UseMock) {
            const pathMap = [
                localWebApps,
                BSFWebApps,
                BSFTSTWebApps,
            ].reduce((accumulator, key) => {
                accumulator[key] = true;
                return accumulator;
            }, {} as { [key: string]: boolean });

            const fileChecker: FileExists = async (suppliedPath) => {
                return !!pathMap[suppliedPath as string];
            };
            moduleFileGetter.updateFileUtils("fsExists", fileChecker);
        }

        await moduleFileGetter.setPrerequisites([local, BSF, BSFTST]);

        expect(moduleFileGetter.getModule(moduleID)).rejects.toThrow(new Error(`Unable to find file for: ${moduleID}`));
    });
});
