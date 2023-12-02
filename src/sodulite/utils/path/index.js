import { HTTP_RESPONSE } from '../index.js';
let isValidPath = (path) => {
  //console.log('path is: ', path);
  if (typeof path != 'string')
    return {
      path,
      error: {
        code: HTTP_RESPONSE.PAGE_NOT_FOUND_CODE,
        message: HTTP_RESPONSE.MESSAGE.PAGE_NOT_FOUND_CODE,
      },
    };
};
let sanitizePath = (path) => {
  try {
    if (!path.match(/^\//)) path = '/' + path;
    if (path.length > 1 && path.match(/\/$/)) path = path.replace(/\/$/, '');
    path = path.replace(/\/{2,}/g, '/');
  } catch (e) {}

  return path;
};

//current = current.slice(start, end + 1); //cut array in interval
//const index = parseInt('100'); //convert string to integer
//current.hasOwnProperty(key) //check if key exists

let getArrayParam = (path) => {
  let result = { path: path, value: null, mod: {} };
  const matches = path.match(/(!?\[.*?\])/);
  if (matches.length > 1) {
    try {
      const param = matches[0];
      switch (true) {
        case /^\[\d+\]$/.test(param):
          result.mod.withFunc = 'get'; // Case [x]
          result.value = Number(param.slice(1, -1));
          break;
        case /^!\[\d+\]$/.test(param):
          result.mod.withFunc = 'remove'; // Case ![x]
          result.mod.notIn = true;
          result.value = Number(param.slice(2, -1));
          break;
        case /^\[\d+:\d+\]$/.test(param):
          result.mod.withFunc = 'getInterval'; // Case [x:y]
          result.value = param.slice(1, -1).split(':').map(Number);
          break;
        case /^!\[\d+:\d+\]$/.test(param):
          result.mod.withFunc = 'getNotInterval'; // Case ![x:y]
          result.mod.notIn = true;
          result.value = param.slice(2, -1).split(':').map(Number);
          break;
        case /^\[\d+(,\d+)*\]$/.test(param):
          result.mod.withFunc = 'getOnly'; // Case [x,y,...]
          result.value = param.slice(1, -1).split(',').map(Number);
          break;
        case /^!\[\d+(,\d+)*\]$/.test(param):
          result.mod.withFunc = 'getAllExcept'; // Case ![x,y,z,...]
          result.mod.notIn = true;
          result.value = param
              .slice(2, -1)
              .split(',')
              .filter(Boolean)
              .map(Number);
          break;
        case /^\[(\?(-)*\d+)\]$/.test(param):
          result.mod.withFunc = 'getAllTill'; // Case [?x] or [?-x]
          const valueStr = param.match(/\d+/)[0]; // Extract the number x
          result.mod.till = true;
          if (!param.includes('-')) {
            result.value = Number(valueStr);
          } else {
            result.mod.reverse = true;
            result.value = -Number(valueStr);
          }
          break;

      }
    } catch (e) {}

    result.path = path.replace(matches[0], '');
  }

  return result;
};

/*
// Test cases
console.log(getArrayParam('/root/users[2]'));              // { path: '/root/users', value: 2, mod: { withFunc: 'get' } }
console.log(getArrayParam('/root/users![2]'));             // { path: '/root/users', value: 2, mod: { notIn: true, withFunc: 'remove' } }
console.log(getArrayParam('/root/users[2,4]'));            // { path: '/root/users', value: [2, 4], mod: { withFunc: 'getInterval' } }
console.log(getArrayParam('/root/users![2,4]'));           // { path: '/root/users', value: [2, 4], mod: { notIn: true, withFunc: 'getNotInterval' } }
console.log(getArrayParam('/root/users[?2]'));             // { path: '/root/users', value: 2, mod: { till: true, withFunc: 'getTill' } }
console.log(getArrayParam('/root/users[?-2]'));            // { path: '/root/users', value: -2, mod: { till: true, reverse: true, withFunc: 'getTill' } }
console.log(getArrayParam('/root/users[2;4]'));            // { path: '/root/users', value: [2, 4], mod: { withFunc: 'getOnly' } }
console.log(getArrayParam('/root/users![2;4]'));           // { path: '/root/users', value: [2, 4], mod: { notIn: true, withFunc: 'getNotInterval' } }
console.log(getArrayParam('/root/users![2;4;-6;3]'));      // { path: '/root/users', value: [2, 4, -6, 3], mod: { notIn: true, withFunc: 'getAllExcept' } }
*/

let operationInObj = (input) => {
  let data = input;

  if (Array.isArray(input)) {
    data = [...input];
  } else if (typeof input === 'object') {
    data = { ...input };
  }

  function insert({ key, value }, index = undefined) {
    if (Array.isArray(data)) {
      if (index === undefined) {
        data.push(value);
      } else {
        data.splice(index, 0, value);
      }
    } else {
      if (typeof key !== 'undefined') {
        let result = { ...data };
        if (index === undefined) {
          result[key] = value;
        } else {
          const keys = Object.keys(result);
          keys.splice(index, 0, key);
          const newObj = {};
          keys.forEach((k, i) => {
            if (k === key) {
              newObj[k] = value;
            } else {
              newObj[k] = obj?.[k];
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
    if (Array.isArray(data)) {
      if (x >= 0) {
        data.splice(x, 1);
      } else {
        data.splice(data.length + x, 1);
      }
    } else {
      const result = { ...data };
      if (x >= 0) {
        delete result[Object.keys(data)?.[x]];
      } else {
        delete result[Object.keys(data)[Object.keys(data)?.length + x]];
      }
      data = result;
    }
    return data;
  }

  function get(x = 0) {
    if (Array.isArray(data)) {
      if (x >= 0) {
        return data[x];
      } else {
        return data[data.length + x];
      }
    } else {
      let isInteger = parseInt(x);
      if (isInteger) {
        let result = { ...data };
        let keys = Object.keys(result);
        let index = isInteger;
        if (isInteger == -1) index = keys.length - 1;
        return { [keys[index]]: data[keys[index]] };
      }
      return data[x];
    }
  }
  function getInterval(x = 0, y = 0) {
    if (Array.isArray(data)) {
      return data.slice(x, y + 1);
    } else {
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
    } else {
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
      } else {
        return data.slice(x);
      }
    } else {
      const result = {};
      const keys = Object.keys(data);
      if (x >= 0) {
        keys.slice(0, x + 1).forEach((key) => {
          result[key] = data[key];
        });
      } else {
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
    } else {
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
    } else {
      const result = { ...data };
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

/*
// Usage with array
let arr = ['a', 'b', 'c', 'd', 'e', 'f'];
const arrayOperations = operationInObj(arr);

console.log(arrayOperations.getInterval(1, 3)); // ['b', 'c', 'd']
console.log(arrayOperations.getNotInterval(0, 2)); // ['d', 'e', 'f']
console.log(arrayOperations.getAllTill(3)); // ['a', 'b', 'c', 'd']
//console.log(arrayOperations.insert({value:'z'},2)); // 2 is the index, ['a', 'b', 'z', 'c', 'd', 'e', 'f']
console.log(arrayOperations.get(-1)); // f
console.log(arrayOperations.getOnly([1, 4, 2])); // ['b', 'e', 'c']
console.log(arrayOperations.getAllExcept([1, 4, 2])); // ['a', 'd', 'f']

// Usage with object
let obj = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6 };
const objectOperations = operationInObj(obj);

console.log(objectOperations.getInterval(1, 3)); // { b: 2, c: 3, d: 4 }
console.log(objectOperations.getNotInterval(0, 2)); // { d: 4, e: 5, f: 6 }
console.log(objectOperations.getAllTill(3)); // { a: 1, b: 2, c: 3, d: 4 }
//console.log(objectOperations.insert({key:'z',value:26},2)); // 2 is the index, { a: 1, b: 2, z:26, c: 3, d: 4, e: 5, f: 6 }
console.log(objectOperations.get(-1)) // f:6
console.log(objectOperations.getOnly([1, 4, 2])); // { b: 2, e: 5, c: 3 }
console.log(objectOperations.getAllExcept([1, 4, 2])); // { a: 1, d: 4, f: 6 }
*/

export { getArrayParam, operationInObj, sanitizePath, isValidPath };
