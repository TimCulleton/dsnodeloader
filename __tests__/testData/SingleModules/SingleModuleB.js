define("DS/SingleModules/SingleModuleB", [
    "DS/SingleModules/SingleModuleA"
], function(
    SingleModuleA
) {
    "use strict";

    return {
        moduleID: "DS/SingleModules/SingleModuleA",
        moduleA: SingleModuleA.moduleID
    };
});
