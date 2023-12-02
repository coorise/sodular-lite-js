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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("../utils/index.js");
const fs_extra_1 = __importDefault(require("fs-extra"));
const JSONStream_1 = __importDefault(require("JSONStream"));
let writeStream = (that, service = 'create', path, value, merge = false) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        yield that.acquireLock();
        try {
            let resp = {
                path,
            };
            let error = {
                code: index_js_1.HTTP_RESPONSE.ERROR_FROM_USER_CODE,
                message: index_js_1.HTTP_RESPONSE.MESSAGE.ERROR_FROM_USER_CODE,
            };
            const readStream = fs_extra_1.default.createReadStream(that.filePath, {
                encoding: 'utf8',
            });
            const writeStream = fs_extra_1.default.createWriteStream(that.filePathTemp, {
                encoding: 'utf8',
            });
            let pathFound = false;
            readStream
                .pipe(JSONStream_1.default.parse(that.rootPath, (data) => {
                let obj = data;
                that.jsonDB.data = obj;
                if (!pathFound) {
                    resp = that.jsonDB[service](path, value, merge);
                    pathFound = true;
                }
                obj = resp.obj || obj;
                delete resp.obj;
                return { [that.rootPath]: obj };
            }))
                .pipe(JSONStream_1.default.stringify(false, undefined, undefined, 2))
                .on('data', (data) => {
                writeStream.write(data);
            })
                .on('end', () => {
                readStream.destroy();
                writeStream.end();
                delete resp.obj;
                if (!pathFound) {
                    resp.value = false;
                    resp.error = error;
                    resolve(resp);
                }
                else {
                    fs_extra_1.default.rename(that.filePathTemp, that.filePath, (err) => {
                        if (err) {
                            if (that.mode === 'dev')
                                console.log(e);
                            resp.value = false;
                            resp.error = {
                                code: index_js_1.HTTP_RESPONSE.INTERNAL_ERROR_CODE,
                                message: index_js_1.HTTP_RESPONSE.MESSAGE.INTERNAL_ERROR_CODE,
                            };
                        }
                        resolve(resp);
                    });
                }
            })
                .on('error', (error) => {
                resp.value = false;
                resp.error = {
                    code: index_js_1.HTTP_RESPONSE.INTERNAL_ERROR_CODE,
                    message: index_js_1.HTTP_RESPONSE.MESSAGE.INTERNAL_ERROR_CODE,
                };
            });
        }
        finally {
            yield that.releaseLock();
        }
    }));
});
let readStream = (that, service = 'get', path, value) => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => __awaiter(void 0, void 0, void 0, function* () {
        yield that.acquireLock();
        try {
            path = (0, index_js_1.sanitizePath)(path);
            let resp = {
                path,
                key: path.split('/').pop(),
            };
            let error = {
                code: index_js_1.HTTP_RESPONSE.ERROR_FROM_USER_CODE,
                message: index_js_1.HTTP_RESPONSE.MESSAGE.ERROR_FROM_USER_CODE,
            };
            const stream = fs_extra_1.default.createReadStream(that.filePath, { encoding: 'utf8' });
            let search;
            const matches = path.match(/(!?\[.*?\])/);
            if ((matches === null || matches === void 0 ? void 0 : matches.length) > 1) {
                search = path === null || path === void 0 ? void 0 : path.replace(matches === null || matches === void 0 ? void 0 : matches[0], '');
                resp.key = search.split('/').pop();
                search = search.replace(/\//g, '.');
                value = {};
            }
            else
                search = path.replace(/\//g, '.');
            const parser = JSONStream_1.default.parse(search);
            let found = false;
            stream.pipe(parser);
            parser.on('data', (obj) => {
                if (obj) {
                    if (value) {
                        let lastKey = path === null || path === void 0 ? void 0 : path.replace(matches === null || matches === void 0 ? void 0 : matches[0], '').split('/').pop();
                        that.jsonDB.data = {
                            [lastKey]: obj,
                        };
                        resp = that.jsonDB[service]('/' + path.split('/').pop(), value);
                    }
                    else
                        resp.value = obj;
                    found = true;
                }
            });
            parser.on('end', () => {
                if (!found) {
                    resp.value = false;
                    resp.error = error;
                }
                resolve(resp);
            });
            parser.on('error', (err) => {
                resp.value = false;
                resp.error = {
                    code: index_js_1.HTTP_RESPONSE.INTERNAL_ERROR_CODE,
                    message: index_js_1.HTTP_RESPONSE.MESSAGE.INTERNAL_ERROR_CODE,
                };
                resolve(resp);
            });
        }
        finally {
            yield that.releaseLock();
        }
    }));
});
class JsonNodeStreamDB {
    constructor(filePath, mode = 'prod') {
        var _a;
        this.filePath = filePath;
        this.mode = mode;
        this.jsonDB = new index_js_1.JsonDatabase();
        this.jsonDB.mode = mode;
        this.rootPath = 'data';
        if (!fs_extra_1.default.existsSync(this.filePath)) {
            fs_extra_1.default.ensureFileSync(this.filePath);
            fs_extra_1.default.outputFileSync(this.filePath, JSON.stringify({ [this.rootPath]: {} }));
        }
        else {
            let file = fs_extra_1.default.readFileSync(this.filePath, {
                encoding: 'utf8',
                flag: 'r',
            });
            try {
                file = JSON.parse(file);
                if (((_a = Object.keys(file)) === null || _a === void 0 ? void 0 : _a.length) > 1)
                    fs_extra_1.default.outputFileSync(this.filePath, JSON.stringify({ [this.rootPath]: file }));
                if (!(file === null || file === void 0 ? void 0 : file.data))
                    fs_extra_1.default.outputFileSync(this.filePath, JSON.stringify({ [this.rootPath]: {} }));
            }
            catch (e) { }
        }
        this.filePathLock = this.filePath + '.lock';
        this.filePathTemp = this.filePath + '.temp';
    }
    acquireLock() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                if (fs_extra_1.default.existsSync(this.filePathLock)) {
                    resolve(true);
                }
                yield fs_extra_1.default.ensureFile(this.filePathLock);
                resolve(false);
            }));
        });
    }
    releaseLock() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                yield fs_extra_1.default.remove(this.filePathLock);
                resolve(true);
            }));
        });
    }
    get(path, value) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield readStream(this, 'get', path, value);
        });
    }
    query(path, value) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield readStream(this, 'query', path, value);
        });
    }
    set(path, value) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.create(path, value, true);
        });
    }
    create(path, value, merge = false) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield writeStream(this, 'create', path, value, merge);
        });
    }
    update(path, value, merge) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield writeStream(this, 'update', path, value, merge);
        });
    }
    delete(path, value) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield writeStream(this, 'delete', path, value);
        });
    }
}
exports.default = JsonNodeStreamDB;
