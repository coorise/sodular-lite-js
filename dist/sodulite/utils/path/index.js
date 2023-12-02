"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidPath = exports.sanitizePath = exports.operationInObj = exports.getArrayParam = void 0;
const index_js_1 = require("../index.js");
let isValidPath = (path) => {
    if (typeof path != 'string')
        return {
            path,
            error: {
                code: index_js_1.HTTP_RESPONSE.PAGE_NOT_FOUND_CODE,
                message: index_js_1.HTTP_RESPONSE.MESSAGE.PAGE_NOT_FOUND_CODE,
            },
        };
};
exports.isValidPath = isValidPath;
let sanitizePath = (path) => {
    try {
        if (!path.match(/^\//))
            path = '/' + path;
        if (path.length > 1 && path.match(/\/$/))
            path = path.replace(/\/$/, '');
        path = path.replace(/\/{2,}/g, '/');
    }
    catch (e) { }
    return path;
};
exports.sanitizePath = sanitizePath;
let getArrayParam = (path) => {
    let result = { path: path, value: null, mod: {} };
    const matches = path.match(/(!?\[.*?\])/);
    if (matches.length > 1) {
        try {
            const param = matches[0];
            switch (true) {
                case /^\[\d+\]$/.test(param):
                    result.mod.withFunc = 'get';
                    result.value = Number(param.slice(1, -1));
                    break;
                case /^!\[\d+\]$/.test(param):
                    result.mod.withFunc = 'remove';
                    result.mod.notIn = true;
                    result.value = Number(param.slice(2, -1));
                    break;
                case /^\[\d+:\d+\]$/.test(param):
                    result.mod.withFunc = 'getInterval';
                    result.value = param.slice(1, -1).split(':').map(Number);
                    break;
                case /^!\[\d+:\d+\]$/.test(param):
                    result.mod.withFunc = 'getNotInterval';
                    result.mod.notIn = true;
                    result.value = param.slice(2, -1).split(':').map(Number);
                    break;
                case /^\[\d+(,\d+)*\]$/.test(param):
                    result.mod.withFunc = 'getOnly';
                    result.value = param.slice(1, -1).split(',').map(Number);
                    break;
                case /^!\[\d+(,\d+)*\]$/.test(param):
                    result.mod.withFunc = 'getAllExcept';
                    result.mod.notIn = true;
                    result.value = param
                        .slice(2, -1)
                        .split(',')
                        .filter(Boolean)
                        .map(Number);
                    break;
                case /^\[(\?(-)*\d+)\]$/.test(param):
                    result.mod.withFunc = 'getAllTill';
                    const valueStr = param.match(/\d+/)[0];
                    result.mod.till = true;
                    if (!param.includes('-')) {
                        result.value = Number(valueStr);
                    }
                    else {
                        result.mod.reverse = true;
                        result.value = -Number(valueStr);
                    }
                    break;
            }
        }
        catch (e) { }
        result.path = path.replace(matches[0], '');
    }
    return result;
};
exports.getArrayParam = getArrayParam;
let operationInObj = (input) => {
    let data = input;
    if (Array.isArray(input)) {
        data = [...input];
    }
    else if (typeof input === 'object') {
        data = Object.assign({}, input);
    }
    function insert({ key, value }, index = undefined) {
        if (Array.isArray(data)) {
            if (index === undefined) {
                data.push(value);
            }
            else {
                data.splice(index, 0, value);
            }
        }
        else {
            if (typeof key !== 'undefined') {
                let result = Object.assign({}, data);
                if (index === undefined) {
                    result[key] = value;
                }
                else {
                    const keys = Object.keys(result);
                    keys.splice(index, 0, key);
                    const newObj = {};
                    keys.forEach((k, i) => {
                        if (k === key) {
                            newObj[k] = value;
                        }
                        else {
                            newObj[k] = obj === null || obj === void 0 ? void 0 : obj[k];
                        }
                    });
                    result = newObj;
                }
                data = result;
            }
        }
        return data;
    }
    function remove(x = 0) {
        var _a, _b;
        if (Array.isArray(data)) {
            if (x >= 0) {
                data.splice(x, 1);
            }
            else {
                data.splice(data.length + x, 1);
            }
        }
        else {
            const result = Object.assign({}, data);
            if (x >= 0) {
                delete result[(_a = Object.keys(data)) === null || _a === void 0 ? void 0 : _a[x]];
            }
            else {
                delete result[Object.keys(data)[((_b = Object.keys(data)) === null || _b === void 0 ? void 0 : _b.length) + x]];
            }
            data = result;
        }
        return data;
    }
    function get(x = 0) {
        if (Array.isArray(data)) {
            if (x >= 0) {
                return data[x];
            }
            else {
                return data[data.length + x];
            }
        }
        else {
            let isInteger = parseInt(x);
            if (isInteger) {
                let result = Object.assign({}, data);
                let keys = Object.keys(result);
                let index = isInteger;
                if (isInteger == -1)
                    index = keys.length - 1;
                return { [keys[index]]: data[keys[index]] };
            }
            return data[x];
        }
    }
    function getInterval(x = 0, y = 0) {
        if (Array.isArray(data)) {
            return data.slice(x, y + 1);
        }
        else {
            const result = {};
            const keys = Object.keys(data).slice(x, y + 1);
            keys.forEach((key) => {
                result[key] = data[key];
            });
            return result;
        }
    }
    function getNotInterval(x = 0, y = 0) {
        if (Array.isArray(data)) {
            return data.filter((_, index) => index < x || index > y);
        }
        else {
            const result = {};
            Object.keys(data).forEach((key, index) => {
                if (index < x || index > y) {
                    result[key] = data[key];
                }
            });
            return result;
        }
    }
    function getAllTill(x = 0) {
        if (Array.isArray(data)) {
            if (x >= 0) {
                return data.slice(0, x + 1);
            }
            else {
                return data.slice(x);
            }
        }
        else {
            const result = {};
            const keys = Object.keys(data);
            if (x >= 0) {
                keys.slice(0, x + 1).forEach((key) => {
                    result[key] = data[key];
                });
            }
            else {
                keys.slice(x).forEach((key) => {
                    result[key] = data[key];
                });
            }
            return result;
        }
    }
    function getOnly(...indexes) {
        if (Array.isArray(data)) {
            return indexes.map((idx) => data[idx]);
        }
        else {
            const result = {};
            indexes.forEach((idx) => {
                const key = Object.keys(data)[idx];
                if (key) {
                    result[key] = data[key];
                }
            });
            return result;
        }
    }
    function getAllExcept(...indexes) {
        if (Array.isArray(data)) {
            return data.filter((_, index) => !indexes.includes(index));
        }
        else {
            const result = Object.assign({}, data);
            indexes.forEach((idx) => {
                const key = Object.keys(data)[idx];
                if (key) {
                    delete result[key];
                }
            });
            return result;
        }
    }
    return {
        getInterval,
        getNotInterval,
        getAllTill,
        remove,
        insert,
        get,
        getOnly,
        getAllExcept,
    };
};
exports.operationInObj = operationInObj;
