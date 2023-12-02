"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _JsonBrowserStreamDB_readDB, _JsonBrowserStreamDB_saveDB;
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("../utils/index.js");
class JsonBrowserStreamDB {
    constructor(dbName = 'sodulite', mode = 'prod') {
        var _a;
        this.db = {};
        _JsonBrowserStreamDB_readDB.set(this, (dbName) => __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve) => {
                var _a;
                if (!dbName)
                    dbName = this.dbName;
                try {
                    resolve((_a = JSON.parse(localStorage.getItem(dbName))) === null || _a === void 0 ? void 0 : _a[this.rootPath]);
                }
                catch (e) {
                    resolve({});
                }
            });
        }));
        _JsonBrowserStreamDB_saveDB.set(this, (dbTemp) => __awaiter(this, void 0, void 0, function* () {
            return yield new Promise((resolve) => {
                if (dbTemp) {
                    localStorage.setItem(this.dbName, JSON.stringify({
                        [this.rootPath]: dbTemp,
                    }));
                    this.db = dbTemp;
                    resolve();
                }
            });
        }));
        this.get = (path, value) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.acquireLock();
                this.jsonDB.data = yield __classPrivateFieldGet(this, _JsonBrowserStreamDB_readDB, "f").call(this);
                return this.jsonDB.get(path, value);
            }
            finally {
                yield this.releaseLock();
            }
        });
        this.exists = (path) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.acquireLock();
                this.jsonDB.data = yield __classPrivateFieldGet(this, _JsonBrowserStreamDB_readDB, "f").call(this);
                return this.jsonDB.exists(path);
            }
            finally {
                yield this.releaseLock();
            }
        });
        this.create = (path, value, merge) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.acquireLock();
                this.jsonDB.data = yield __classPrivateFieldGet(this, _JsonBrowserStreamDB_readDB, "f").call(this);
                let resp = this.jsonDB.create(path, value, merge);
                if (resp.obj && Object.keys(resp.obj).length >= 1)
                    yield __classPrivateFieldGet(this, _JsonBrowserStreamDB_saveDB, "f").call(this, resp.obj);
                delete resp.obj;
                return resp;
            }
            finally {
                yield this.releaseLock();
            }
        });
        this.set = (path, value) => __awaiter(this, void 0, void 0, function* () { return this.create(path, value, true); });
        this.update = (path, value, mod) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.acquireLock();
                this.jsonDB.data = yield __classPrivateFieldGet(this, _JsonBrowserStreamDB_readDB, "f").call(this);
                let resp = this.jsonDB.update(path, value, mod);
                if (resp.obj && Object.keys(resp.obj).length >= 1)
                    yield __classPrivateFieldGet(this, _JsonBrowserStreamDB_saveDB, "f").call(this, resp.obj);
                delete resp.obj;
                return resp;
            }
            finally {
                yield this.releaseLock();
            }
        });
        this.delete = (path, value) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.acquireLock();
                this.jsonDB.data = yield __classPrivateFieldGet(this, _JsonBrowserStreamDB_readDB, "f").call(this);
                let resp = this.jsonDB.delete(path, value);
                if (resp.obj && Object.keys(resp.obj).length >= 1)
                    yield __classPrivateFieldGet(this, _JsonBrowserStreamDB_saveDB, "f").call(this, resp.obj);
                delete resp.obj;
                return resp;
            }
            finally {
                yield this.releaseLock();
            }
        });
        this.query = (path, option) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.acquireLock();
                this.jsonDB.data = yield __classPrivateFieldGet(this, _JsonBrowserStreamDB_readDB, "f").call(this);
                return this.jsonDB.query(path, option);
            }
            finally {
                yield this.releaseLock();
            }
        });
        this.dbName = dbName;
        this.mode = mode;
        this.jsonDB = new index_js_1.JsonDatabase();
        this.jsonDB.mode = mode;
        this.rootPath = 'data';
        if (!(localStorage === null || localStorage === void 0 ? void 0 : localStorage.getItem(dbName)))
            localStorage.setItem(this.dbName, JSON.stringify({ [this.rootPath]: {} }));
        try {
            let file = localStorage === null || localStorage === void 0 ? void 0 : localStorage.getItem(dbName);
            file = JSON.parse(file);
            if (((_a = Object.keys(file)) === null || _a === void 0 ? void 0 : _a.length) > 1)
                localStorage.setItem(this.dbName, JSON.stringify({ [this.rootPath]: file }));
            if (!(file === null || file === void 0 ? void 0 : file[this.rootPath]))
                localStorage.setItem(this.dbName, JSON.stringify({ [this.rootPath]: file }));
        }
        catch (e) { }
        this.dbNameLock = this.dbName + '-lock';
    }
    acquireLock() {
        return new Promise((resolve) => {
            let dbLock = (() => {
                try {
                    return localStorage.getItem(this.dbNameLock);
                }
                catch (e) {
                    return false;
                }
            })();
            if (!dbLock)
                localStorage.setItem(this.dbNameLock, 'acquired');
            resolve();
        });
    }
    releaseLock() {
        return new Promise((resolve) => {
            localStorage.removeItem(this.dbNameLock);
            resolve();
        });
    }
}
_JsonBrowserStreamDB_readDB = new WeakMap(), _JsonBrowserStreamDB_saveDB = new WeakMap();
exports.default = JsonBrowserStreamDB;
