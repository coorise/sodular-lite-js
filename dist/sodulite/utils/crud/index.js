"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("../index.js");
class JsonDatabase {
    constructor(data = {}) {
        this.mode = 'prod';
        this.data = {};
        this.data = data;
    }
    exists(path) {
        (0, index_js_1.isValidPath)(path);
        path = (0, index_js_1.sanitizePath)(path);
        let resp = {
            path,
            key: path.split('/').pop(),
        };
        let get = this.get(path);
        let value = get === null || get === void 0 ? void 0 : get.value;
        if (value)
            resp.value = true;
        else {
            resp.value = false;
            resp.error = {
                code: index_js_1.HTTP_RESPONSE.PAGE_NOT_FOUND_CODE,
                message: index_js_1.HTTP_RESPONSE.MESSAGE.PAGE_NOT_FOUND_CODE,
            };
        }
        return resp;
    }
    create(path, value, merge = false) {
        (0, index_js_1.isValidPath)(path);
        path = (0, index_js_1.sanitizePath)(path);
        let resp = {
            path,
            key: path.split('/').pop(),
        };
        let isExist = this.exists(path);
        if (isExist.value && !merge) {
            return Object.assign(Object.assign({}, resp), { value: false, error: {
                    code: index_js_1.HTTP_RESPONSE.FORBIDDEN_CODE,
                    message: index_js_1.HTTP_RESPONSE.MESSAGE.FORBIDDEN_CODE,
                } });
        }
        const keys = path.split('/').filter((key) => key !== '');
        try {
            let obj = this.data;
            let current = obj;
            let pathFound = false;
            if (!pathFound) {
                for (let i = 0; i < keys.length; i++) {
                    const key = keys[i];
                    if (i === keys.length - 1) {
                        if (merge &&
                            current[key] &&
                            typeof current[key] === 'object' &&
                            typeof value === 'object') {
                            if (Array.isArray(current[key]) && Array.isArray(value)) {
                                current[key] = [...current[key], ...value];
                            }
                            else {
                                current[key] = Object.assign(Object.assign({}, current[key]), value);
                            }
                            pathFound = true;
                        }
                        else {
                            current[key] = value;
                            resp.value = value;
                            pathFound = true;
                        }
                    }
                    else {
                        if (!current[key]) {
                            current[key] = {};
                        }
                        current = current[key];
                    }
                }
            }
            if (resp.value)
                resp.obj = obj;
        }
        catch (e) {
            if (this.mode === 'dev')
                console.log(e);
            resp.obj = this.data;
            resp.value = false;
            resp.error = {
                code: index_js_1.HTTP_RESPONSE.INTERNAL_ERROR_CODE,
                message: index_js_1.HTTP_RESPONSE.MESSAGE.INTERNAL_ERROR_CODE,
            };
        }
        return resp;
    }
    set(path, value) {
        return this.create(path, value, true);
    }
    get(path, valueObj) {
        var _a, _b, _c, _d, _e, _f;
        (0, index_js_1.isValidPath)(path);
        path = (0, index_js_1.sanitizePath)(path);
        let resp = {
            path,
            key: path.split('/').pop(),
        };
        const keys = path === null || path === void 0 ? void 0 : path.split('/').filter((key) => key !== '');
        let value = this.data;
        try {
            if (valueObj) {
                let query = this.query(path, {
                    filter: valueObj,
                    pagination: {
                        page: 1,
                        limit: 1,
                    },
                });
                if ((query === null || query === void 0 ? void 0 : query.value.length) >= 1) {
                    value = (_b = (_a = query.value) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value;
                    resp.path = (_d = (_c = query.value) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.path;
                    resp.key = (_f = (_e = query.value) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.key;
                }
                else
                    value = undefined;
            }
            else {
                if (path.length > 1) {
                    for (const key of keys) {
                        if (value && typeof value === 'object' && key in value) {
                            value = value[key];
                        }
                        else {
                            value = undefined;
                        }
                    }
                }
            }
            if (value)
                resp.value = value;
            else {
                resp.value = false;
                resp.error = {
                    path,
                    code: index_js_1.HTTP_RESPONSE.PAGE_NOT_FOUND_CODE,
                    message: index_js_1.HTTP_RESPONSE.MESSAGE.PAGE_NOT_FOUND_CODE,
                };
            }
        }
        catch (e) {
            if (this.mode === 'dev')
                console.log(e);
            resp.value = false;
            resp.error = {
                code: index_js_1.HTTP_RESPONSE.INTERNAL_ERROR_CODE,
                message: index_js_1.HTTP_RESPONSE.MESSAGE.INTERNAL_ERROR_CODE,
            };
        }
        return resp;
    }
    update(path, value, mod = {}) {
        let result = this.exists(path);
        if (!result.value) {
            return result;
        }
        (0, index_js_1.isValidPath)(path);
        path = (0, index_js_1.sanitizePath)(path);
        let resp = {
            path,
            key: path.split('/').pop(),
        };
        const segments = path.split('/').filter((key) => key !== '');
        let obj = this.data;
        let current = obj;
        try {
            for (let i = 0; i < segments.length - 1; i++) {
                const segment = segments[i];
                current[segment] = current[segment] || {};
                current = current[segment];
            }
            const lastSegment = segments[segments.length - 1];
            if (current[lastSegment] &&
                typeof current[lastSegment] === 'object' &&
                typeof value === 'object' &&
                mod.merge) {
                if (Array.isArray(current[lastSegment])) {
                    let mainArray = current[lastSegment];
                    if ((mod === null || mod === void 0 ? void 0 : mod.insertAt) && mainArray.length > parseInt(mod === null || mod === void 0 ? void 0 : mod.insertAt)) {
                        let part1 = mainArray.slice(0, mod.insertAt);
                        let part2 = mainArray.slice(mod.insertAt, mainArray.length);
                        value = [...part1, ...value, ...part2];
                    }
                    else
                        value = [...mainArray, ...value];
                }
                else {
                    let mainObj = current[lastSegment];
                    let mainArray = Object.keys(mainObj);
                    if ((mod === null || mod === void 0 ? void 0 : mod.insertAt) && mainArray.length > parseInt(mod === null || mod === void 0 ? void 0 : mod.insertAt)) {
                        let part1 = mainArray.slice(0, mod.insertAt);
                        let object1 = {};
                        for (let key of part1) {
                            object1[key] = mainObj[key];
                        }
                        let part2 = mainArray.slice(mod.insertAt, mainArray.length);
                        let object2 = {};
                        for (let key of part2) {
                            object2[key] = mainObj[key];
                        }
                        value = [...object1, ...value, ...object2];
                    }
                    else
                        value = Object.assign(Object.assign({}, current[lastSegment]), value);
                }
                current[lastSegment] = value;
            }
            else {
                current[lastSegment] = value;
            }
            resp.value = value;
            resp.obj = obj;
        }
        catch (e) {
            if (this.mode === 'dev')
                console.log(e);
            resp.obj = this.data;
            resp.value = false;
            resp.error = {
                code: index_js_1.HTTP_RESPONSE.INTERNAL_ERROR_CODE,
                message: index_js_1.HTTP_RESPONSE.MESSAGE.INTERNAL_ERROR_CODE,
            };
        }
        return resp;
    }
    delete(path, value) {
        let result = this.exists(path);
        if (!result.value) {
            return result;
        }
        (0, index_js_1.isValidPath)(path);
        if (typeof value == 'object' && !Array.isArray(value)) {
            let result = this.get(path, value);
            if (result.value) {
                let resp = {
                    path,
                    key: path.split('/').pop(),
                    value: {},
                    obj: {},
                };
                try {
                    let keys = Object.keys(result === null || result === void 0 ? void 0 : result.value);
                    for (let key of keys) {
                        let savedVal = result === null || result === void 0 ? void 0 : result.value[key];
                        let delValue = this.remove((result === null || result === void 0 ? void 0 : result.path) + '/' + key);
                        if (delValue.value) {
                            resp.value[key] = savedVal;
                            resp.path = result === null || result === void 0 ? void 0 : result.path;
                            resp.key = result === null || result === void 0 ? void 0 : result.key;
                            resp.obj = delValue.obj;
                        }
                    }
                }
                catch (e) {
                    if (this.mode === 'dev')
                        console.log(e);
                    resp.value = undefined;
                    resp.obj = this.data;
                    resp.error = {
                        code: index_js_1.HTTP_RESPONSE.INTERNAL_ERROR_CODE,
                        message: index_js_1.HTTP_RESPONSE.MESSAGE.INTERNAL_ERROR_CODE,
                    };
                }
                return resp;
            }
            else
                return result;
        }
        else
            return this.remove(path);
    }
    remove(path) {
        let result = this.exists(path);
        if (!result.value) {
            return result;
        }
        path = (0, index_js_1.sanitizePath)(path);
        let resp = {
            path,
            key: path.split('/').pop(),
        };
        const keys = path.split('/').filter((key) => key !== '');
        let obj = this.data;
        let current = obj;
        let pathFound = false;
        try {
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                if (current[key] && i === keys.length - 1) {
                    resp.value = current[key];
                    delete current[key];
                    pathFound = true;
                }
                else {
                    if (!current[key]) {
                        resp.value = false;
                        pathFound = true;
                        i = keys.length + 1;
                    }
                    else
                        current = current[key];
                }
            }
            if (resp.value)
                resp.obj = obj;
        }
        catch (e) {
            if (this.mode === 'dev')
                console.log(e);
            resp.obj = this.data;
            resp.value = false;
            resp.error = {
                code: index_js_1.HTTP_RESPONSE.INTERNAL_ERROR_CODE,
                message: index_js_1.HTTP_RESPONSE.MESSAGE.INTERNAL_ERROR_CODE,
            };
        }
        return resp;
    }
    queryPath(path) {
        var _a;
        (0, index_js_1.isValidPath)(path);
        path = (0, index_js_1.sanitizePath)(path);
        let resp = { path };
        let error = {
            code: index_js_1.HTTP_RESPONSE.ERROR_FROM_USER_CODE,
            message: index_js_1.HTTP_RESPONSE.MESSAGE.ERROR_FROM_USER_CODE,
        };
        try {
            const matches = path === null || path === void 0 ? void 0 : path.match(/(!?\[.*?\])/);
            let data = this.get(path === null || path === void 0 ? void 0 : path.replace(matches === null || matches === void 0 ? void 0 : matches[0], ''));
            if (typeof (data === null || data === void 0 ? void 0 : data.value) === 'object') {
                try {
                    resp.key = data.key;
                    let result;
                    let objectOperation = (0, index_js_1.operationInObj)(data === null || data === void 0 ? void 0 : data.value);
                    let getParam = (0, index_js_1.getArrayParam)(path);
                    switch ((_a = getParam === null || getParam === void 0 ? void 0 : getParam.mod) === null || _a === void 0 ? void 0 : _a.withFunc) {
                        case 'get':
                            result = objectOperation.get(getParam === null || getParam === void 0 ? void 0 : getParam.value);
                            resp.params = matches[0];
                            resp.key = getParam === null || getParam === void 0 ? void 0 : getParam.value;
                            if (result)
                                resp.value = result;
                            else {
                                resp.value = false;
                                resp.error = error;
                            }
                            break;
                        case 'remove':
                            result = objectOperation.remove(getParam === null || getParam === void 0 ? void 0 : getParam.value);
                            resp.params = matches[0];
                            resp.key = getParam === null || getParam === void 0 ? void 0 : getParam.value;
                            if (result)
                                resp.value = result;
                            else {
                                resp.value = false;
                                resp.error = error;
                            }
                            break;
                        case 'getInterval':
                            result = objectOperation.getInterval(...getParam === null || getParam === void 0 ? void 0 : getParam.value);
                            resp.params = matches[0];
                            resp.key = getParam === null || getParam === void 0 ? void 0 : getParam.value;
                            if (result)
                                resp.value = result;
                            else {
                                resp.value = false;
                                resp.error = error;
                            }
                            break;
                        case 'getNotInterval':
                            result = objectOperation.getNotInterval(...getParam === null || getParam === void 0 ? void 0 : getParam.value);
                            resp.params = matches[0];
                            resp.key = getParam === null || getParam === void 0 ? void 0 : getParam.value;
                            if (result)
                                resp.value = result;
                            else {
                                resp.value = false;
                                resp.error = error;
                            }
                            break;
                        case 'getAllTill':
                            result = objectOperation.getAllTill(getParam === null || getParam === void 0 ? void 0 : getParam.value);
                            resp.params = matches[0];
                            resp.key = getParam === null || getParam === void 0 ? void 0 : getParam.value;
                            if (result)
                                resp.value = result;
                            else {
                                resp.value = false;
                                resp.error = error;
                            }
                            break;
                        case 'getOnly':
                            result = objectOperation.getOnly(...getParam === null || getParam === void 0 ? void 0 : getParam.value);
                            resp.params = matches[0];
                            resp.key = getParam === null || getParam === void 0 ? void 0 : getParam.value;
                            if (result)
                                resp.value = result;
                            else {
                                resp.value = false;
                                resp.error = error;
                            }
                            break;
                        case 'getAllExcept':
                            result = objectOperation.getAllExcept(...getParam === null || getParam === void 0 ? void 0 : getParam.value);
                            resp.params = matches[0];
                            resp.key = getParam === null || getParam === void 0 ? void 0 : getParam.value;
                            if (result)
                                resp.value = result;
                            else {
                                resp.value = false;
                                resp.error = error;
                            }
                            break;
                        default:
                            resp.params = matches[0];
                            resp.value = false;
                            resp.error = error;
                            break;
                    }
                }
                catch (e) {
                    if (this.mode === 'dev')
                        console.log(e);
                    resp.value = false;
                    resp.error = error;
                }
            }
            else {
                resp.value = false;
                resp.error = error;
            }
        }
        catch (e) {
            resp.value = false;
            resp.error = {
                code: index_js_1.HTTP_RESPONSE.INTERNAL_ERROR_CODE,
                message: index_js_1.HTTP_RESPONSE.MESSAGE.INTERNAL_ERROR_CODE,
            };
        }
        return resp;
    }
    query(path, { filter = {}, sort, pagination, mod } = {}) {
        (0, index_js_1.isValidPath)(path);
        const matches = path.match(/(!?\[.*?\])/);
        if ((matches === null || matches === void 0 ? void 0 : matches.length) > 1)
            return this.queryPath(path);
        path = (0, index_js_1.sanitizePath)(path);
        const results = [];
        const response = {
            path: path,
            key: path.split('/').pop(),
        };
        try {
            function applyFilter(data) {
                var _a;
                if (((_a = Object === null || Object === void 0 ? void 0 : Object.keys(filter)) === null || _a === void 0 ? void 0 : _a.length) <= 0)
                    return true;
                return Object.keys(filter).every((key) => compare(data[key], filter === null || filter === void 0 ? void 0 : filter[key]));
            }
            function hasProperties(parent, child) {
                if (typeof parent !== 'object')
                    return false;
                for (const key in child) {
                    if (child.hasOwnProperty(key)) {
                        if (typeof child[key] === 'object' && child[key] !== null) {
                            if (!hasProperties(parent[key], child[key])) {
                                return false;
                            }
                        }
                        else {
                            if (parent[key] !== child[key]) {
                                return false;
                            }
                        }
                    }
                    else {
                        return false;
                    }
                }
                return true;
            }
            function deepEqual(a, b) {
                if (a === b)
                    return true;
                if (typeof a !== typeof b)
                    return false;
                if (typeof a === 'object') {
                    if (Array.isArray(a) !== Array.isArray(b))
                        return false;
                    if (Array.isArray(a)) {
                        if (a.length !== b.length)
                            return false;
                        for (let i = 0; i < a.length; i++) {
                            if (!deepEqual(a[i], b[i]))
                                return false;
                        }
                        return true;
                    }
                    else {
                        const keysA = Object.keys(a);
                        const keysB = Object.keys(b);
                        if (keysA.length !== keysB.length)
                            return false;
                        for (const key of keysA) {
                            if (!keysB.includes(key))
                                return false;
                            if (!deepEqual(a[key], b[key]))
                                return false;
                        }
                        return true;
                    }
                }
                return false;
            }
            function compare(value, condition) {
                if (typeof condition === 'object') {
                    const operator = Object.keys(condition)[0];
                    const operand = condition[operator];
                    switch (operator) {
                        case '$<':
                        case '_lt':
                            return value < operand;
                        case '$>':
                        case '_gt':
                            return value > operand;
                        case '$=':
                        case '_eq':
                            if (typeof operand == 'object')
                                return deepEqual(value, operand);
                            else
                                return value === operand;
                        case '$!=':
                        case '_neq':
                            if (typeof operand == 'object')
                                return !deepEqual(value, operand);
                            else
                                return value !== operand;
                        case '$>=':
                        case '_gte':
                            return value >= operand;
                        case '$<=':
                        case '_lte':
                            return value <= operand;
                        case '$match':
                            return new RegExp(operand).test(value);
                        case '$!match':
                            return !new RegExp(operand).test(value);
                        case '$includes':
                            return value === null || value === void 0 ? void 0 : value.includes(operand);
                        case '$!includes':
                            return !(value === null || value === void 0 ? void 0 : value.includes(operand));
                        case '$between':
                            return value >= operand[0] && value <= operand[1];
                        case '$!between':
                            return !(value >= operand[0] && value <= operand[1]);
                        case '$has':
                            return hasProperties(value, operand);
                        case '$!has':
                            return !hasProperties(value, operand);
                        case '$like':
                            return new RegExp(`^${operand === null || operand === void 0 ? void 0 : operand.replace(/\*/g, '.*')}$`).test(value);
                        case '$!like':
                            return !new RegExp(`^${operand === null || operand === void 0 ? void 0 : operand.replace(/\*/g, '.*')}$`).test(value);
                        case '$reg':
                            return new RegExp(operand).test(value);
                        default:
                            return false;
                    }
                }
                else {
                    return value === condition;
                }
            }
            function createGlobMatcher(globPattern) {
                const regexPattern = globPattern
                    .split('/')
                    .map((segment) => {
                    if (segment === '**')
                        return '.*?';
                    return segment
                        .replace(/\*\*/g, '.*?')
                        .replace(/\*/g, '[^/]*')
                        .replace(/\?/g, '.');
                })
                    .join('/');
                const regex = new RegExp(`^${regexPattern}$`);
                return (str) => regex.test(str);
            }
            function traverse(currentPath, obj) {
                for (const key in obj) {
                    const newPath = `${currentPath}/${key}/`.replace(/\/{2,}/g, '/');
                    const value = obj[key];
                    if (typeof value === 'object' &&
                        (path.length + 1 >= currentPath.length ||
                            shouldInclude(path, newPath))) {
                        traverse(newPath, value);
                    }
                    else if (applyFilter(obj)) {
                        applyModifiers(obj);
                        currentPath = ('/' + currentPath)
                            .replace(/\/{2,}/g, '/')
                            .replace(/\/$/, '');
                        results.push({
                            path: currentPath,
                            key: currentPath.split('/').pop(),
                            value: obj,
                        });
                        break;
                    }
                }
            }
            function shouldInclude(path, newPath) {
                var _a, _b;
                newPath = newPath.replace(/\/{2,}/g, '/');
                let test = (_a = mod === null || mod === void 0 ? void 0 : mod.with) === null || _a === void 0 ? void 0 : _a.some((child) => {
                    if (child.match(/[a-zA-Z0-9_-]$/))
                        child = child + '/**';
                    return createGlobMatcher((path + '/' + child).replace(/\/{2,}/g, '/'))(newPath);
                });
                return test || ((_b = mod === null || mod === void 0 ? void 0 : mod.with) === null || _b === void 0 ? void 0 : _b.includes('*'));
            }
            function applyModifiers(obj) {
                var _a;
                if ((mod === null || mod === void 0 ? void 0 : mod.rm) && (mod === null || mod === void 0 ? void 0 : mod.only))
                    delete mod.rm;
                if (mod === null || mod === void 0 ? void 0 : mod.only)
                    Object.keys(obj).forEach((item) => {
                        if (!mod.only.includes(item))
                            delete obj[item];
                    });
                if (mod === null || mod === void 0 ? void 0 : mod.rm)
                    mod.rm.forEach((item) => delete obj[item]);
                if ((_a = mod === null || mod === void 0 ? void 0 : mod.rm) === null || _a === void 0 ? void 0 : _a.includes('*'))
                    obj = {};
            }
            let startingNode = this.get(response.path);
            startingNode = startingNode === null || startingNode === void 0 ? void 0 : startingNode.value;
            if (typeof startingNode === 'object')
                traverse(response.path, startingNode);
            if (sort && Object.keys(sort).length >= 1) {
                results.sort((a, b) => Object.keys(sort).reduce((result, field) => {
                    const order = sort[field] === 'asc' ? 1 : -1;
                    const aValue = a.value[field];
                    const bValue = b.value[field];
                    return (result || (aValue < bValue ? -order : aValue > bValue ? order : 0));
                }, 0));
            }
            if (typeof pagination != 'object')
                pagination = {};
            if (pagination) {
                const { page = 1, limit = 10 } = pagination;
                const startIndex = (page - 1) * limit;
                const endIndex = startIndex + limit;
                if (results.length >= 1)
                    response.pagination = { max: results.length, page, limit };
                response.value = results.slice(startIndex, endIndex);
            }
        }
        catch (e) {
            if (this.mode === 'dev')
                console.log(e);
            response.value = false;
            response.error = {
                code: index_js_1.HTTP_RESPONSE.INTERNAL_ERROR_CODE,
                message: index_js_1.HTTP_RESPONSE.MESSAGE.INTERNAL_ERROR_CODE,
            };
        }
        return response;
    }
}
exports.default = JsonDatabase;
