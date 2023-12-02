"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const SoduLite = {
    init: (SoduBaseConfig = { dbName: 'sodubase', path: 'database/', mode: 'prod' }) => {
        let db = (pathDB = 'data', ref) => {
            let node = (parent = {}, name, ...args) => __awaiter(void 0, void 0, void 0, function* () {
                var _a;
                try {
                    SoduBaseConfig.dbName = SoduBaseConfig.dbName
                        .replace(/[^\w _-]/g, '_')
                        .replace(/\_\_/g, '_')
                        .replace(/\_$/, '');
                    let service = {};
                    let isBrowser = (() => {
                        try {
                            return window;
                        }
                        catch (e) {
                            return false;
                        }
                    })();
                    if (isBrowser) {
                        let BrowserDB = yield Promise.resolve().then(() => __importStar(require('./browser/index.js')));
                        service = new BrowserDB.default(SoduBaseConfig.dbName + '_' + pathDB, SoduBaseConfig.mode);
                    }
                    else {
                        let NodeDB = yield Promise.resolve().then(() => __importStar(require('./node-js/index.js')));
                        SoduBaseConfig.path = (_a = SoduBaseConfig.path) === null || _a === void 0 ? void 0 : _a.replace(/^(\/|\.\/)/, '').replace(/[^\w /_-]/g, '_').replace(/\_\_/g, '_').replace(/\_$/, '');
                        let path = SoduBaseConfig.path + '/' + SoduBaseConfig.dbName + '/' + pathDB;
                        if (!/\.json$/.test(path))
                            path = path + '.json';
                        path = path.replace(/\/\//g, '/');
                        service = new NodeDB.default(path, SoduBaseConfig.mode);
                    }
                    let value, option, callback;
                    if ((args === null || args === void 0 ? void 0 : args.length) == 1) {
                        if (typeof args[0] != 'function')
                            value = args[0];
                        else
                            callback = args[0];
                    }
                    if ((args === null || args === void 0 ? void 0 : args.length) == 2) {
                        value = args[0];
                        if (typeof args[1] != 'function')
                            option = args[1];
                        else
                            callback = args[1];
                    }
                    if ((args === null || args === void 0 ? void 0 : args.length) >= 3) {
                        value = args[0];
                        option = args[1];
                        callback = args[2];
                    }
                    parent.ref = (childRef) => db(pathDB, childRef);
                    parent.child = (childRef) => db(pathDB, ref + '/' + childRef);
                    let resp = yield (service === null || service === void 0 ? void 0 : service[name](ref, value, option));
                    if (typeof callback == 'function')
                        callback(Object.assign(Object.assign({}, resp), parent));
                    else
                        return Object.assign(Object.assign({}, resp), parent);
                }
                catch (e) {
                    if (SoduBaseConfig.mode === 'dev')
                        console.log(e);
                    return Object.assign({}, parent);
                }
            });
            let crud = {
                create: (...args) => __awaiter(void 0, void 0, void 0, function* () { return node(crud, 'create', ...args); }),
                set: (...args) => __awaiter(void 0, void 0, void 0, function* () { return node(crud, 'set', ...args); }),
                get: (...args) => __awaiter(void 0, void 0, void 0, function* () { return node(crud, 'get', ...args); }),
                update: (...args) => __awaiter(void 0, void 0, void 0, function* () { return node(crud, 'update', ...args); }),
                delete: (...args) => __awaiter(void 0, void 0, void 0, function* () { return node(crud, 'delete', ...args); }),
                query: (...args) => __awaiter(void 0, void 0, void 0, function* () { return node(crud, 'query', ...args); }),
            };
            return crud;
        };
        return {
            load: (file = 'data') => {
                return {
                    ref: (ref) => db(file, ref),
                };
            },
        };
    },
};
exports.default = SoduLite;
