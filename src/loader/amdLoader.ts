export enum ModuleLoadStatus {
    Loading,
    Registered,
    Error,
}

export interface IModuleLoadData {
    status: ModuleLoadStatus;
    data?: any;
}

export interface IModuleMap { [key: string]: IModuleLoadData; }

// tslint:disable-next-line: no-string-literal
// tslint:disable-next-line: ban-types
const originalDefine: Function = (global as any)["define"];

export class AmdLoader {

    private _moduleMap: IModuleMap;

    constructor() {
        this._moduleMap = {};
    }

    // tslint:disable-next-line: ban-types
    private amdDefine(moduleID: string, dependencies: string[], callback: Function) {

    }
}
