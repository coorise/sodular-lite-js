//Using Chat GPT 3.5:
/*
  generate js json db crud operation path-like with query object should be like:
  (path='/path/to/key', filter={key:{"$<":30}},sort={name:'example'}, pagination ={page:1,limit:3}) ,
  you have to note that  "$<" is a key comparison with switch condition,
  it could also be "$>","$!=","$>=","$<=","$match":match string,"$includes":string or in array,
  "$between":compare between two values ,
  "$has": value must be an object to compare,
  "$like": should do wildard on value baba* or "$reg":RegExp
*/

import {
  getArrayParam,
  operationInObj,
  sanitizePath,
  isValidPath,
  HTTP_RESPONSE,
} from '../index.js';
class JsonDatabase {
  mode = 'prod';
  data = {};
  constructor(data = {}) {
    this.data = data;
  }

  exists(path) {
    isValidPath(path);
    path = sanitizePath(path);
    let resp = {
      path,
      key: path.split('/').pop(),
    };
    let get = this.get(path);
    let value = get?.value;

    if (value) resp.value = true;
    else {
      resp.value = false;
      resp.error = {
        code: HTTP_RESPONSE.PAGE_NOT_FOUND_CODE,
        message: HTTP_RESPONSE.MESSAGE.PAGE_NOT_FOUND_CODE,
      };
    }

    return resp;
  }

  create(path, value, merge = false) {
    isValidPath(path);
    path = sanitizePath(path);
    let resp = {
      path,
      key: path.split('/').pop(),
    };
    let isExist = this.exists(path);

    if (isExist.value && !merge) {
      return {
        ...resp,
        value: false,
        error: {
          code: HTTP_RESPONSE.FORBIDDEN_CODE,
          message: HTTP_RESPONSE.MESSAGE.FORBIDDEN_CODE,
        },
      };
    }

    const keys = path.split('/').filter((key) => key !== ''); // Split the path into keys

    try {
      let obj = this.data;
      let current = obj;
      let pathFound = false;
      if (!pathFound) {
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];

          if (i === keys.length - 1) {
            // Last key in the path
            if (
              merge &&
              current[key] &&
              typeof current[key] === 'object' &&
              typeof value === 'object'
            ) {
              // Merge the existing object with the new value
              if (Array.isArray(current[key]) && Array.isArray(value)) {
                current[key] = [...current[key], ...value];
              } else {
                current[key] = { ...current[key], ...value };
              }
              pathFound = true;
            } else {
              // Replace the value
              current[key] = value;
              resp.value = value;
              pathFound = true;
            }
          } else {
            // Continue traversing the object
            if (!current[key]) {
              // Create an empty object if the key doesn't exist
              current[key] = {};
            }
            current = current[key];
          }
        }
      }
      if (resp.value) resp.obj = obj;
    } catch (e) {
      if (this.mode === 'dev') console.log(e);
      resp.obj = this.data;
      resp.value = false;
      resp.error = {
        code: HTTP_RESPONSE.INTERNAL_ERROR_CODE,
        message: HTTP_RESPONSE.MESSAGE.INTERNAL_ERROR_CODE,
      };
    }

    return resp;
  }

  set(path, value) {
    //use set to override existing value
    return this.create(path, value, true);
  }

  get(path, valueObj) {
    isValidPath(path);
    path = sanitizePath(path);
    let resp = {
      path,
      key: path.split('/').pop(),
    };

    const keys = path?.split('/').filter((key) => key !== ''); // Split the path into keys
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
        if (query?.value.length >= 1) {
          value = query.value?.[0]?.value;
          resp.path = query.value?.[0]?.path;
          resp.key = query.value?.[0]?.key;
        } else value = undefined;
      } else {
        if (path.length > 1) {
          //console.log('get length: ',keys)
          for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
              value = value[key];
            } else {
              value = undefined;
            }
          }
        }
      }

      if (value) resp.value = value;
      else {
        resp.value = false;
        resp.error = {
          path,
          code: HTTP_RESPONSE.PAGE_NOT_FOUND_CODE,
          message: HTTP_RESPONSE.MESSAGE.PAGE_NOT_FOUND_CODE,
        };
      }
    } catch (e) {
      if (this.mode === 'dev') console.log(e);
      resp.value = false;
      resp.error = {
        code: HTTP_RESPONSE.INTERNAL_ERROR_CODE,
        message: HTTP_RESPONSE.MESSAGE.INTERNAL_ERROR_CODE,
      };
    }

    return resp;
  }

  update(path, value, mod = {}) {
    let result = this.exists(path);
    if (!result.value) {
      return result;
    }
    isValidPath(path);
    path = sanitizePath(path);
    let resp = {
      path,
      key: path.split('/').pop(),
    };

    const segments = path.split('/').filter((key) => key !== ''); // Split the path into keys
    let obj = this.data;
    let current = obj;
    try {
      for (let i = 0; i < segments.length - 1; i++) {
        const segment = segments[i];
        current[segment] = current[segment] || {};
        current = current[segment];
      }
      const lastSegment = segments[segments.length - 1];
      if (
        current[lastSegment] &&
        typeof current[lastSegment] === 'object' &&
        typeof value === 'object' &&
        mod.merge
      ) {
        if (Array.isArray(current[lastSegment])) {
          let mainArray = current[lastSegment];
          if (mod?.insertAt && mainArray.length > parseInt(mod?.insertAt)) {
            let part1 = mainArray.slice(0, mod.insertAt);
            let part2 = mainArray.slice(mod.insertAt, mainArray.length);
            value = [...part1, ...value, ...part2];
          } else value = [...mainArray, ...value];
        } else {
          //console.log(arrayOperations.insert({value:'z'},2)); // 2 is the index
          let mainObj = current[lastSegment];
          let mainArray = Object.keys(mainObj);
          if (mod?.insertAt && mainArray.length > parseInt(mod?.insertAt)) {
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
          } else value = { ...current[lastSegment], ...value };
        }
        current[lastSegment] = value;
      } else {
        current[lastSegment] = value;
      }
      resp.value = value;
      resp.obj = obj;
    } catch (e) {
      if (this.mode === 'dev') console.log(e);
      resp.obj = this.data;
      resp.value = false;
      resp.error = {
        code: HTTP_RESPONSE.INTERNAL_ERROR_CODE,
        message: HTTP_RESPONSE.MESSAGE.INTERNAL_ERROR_CODE,
      };
    }

    return resp;
  }
  delete(path, value) {
    let result = this.exists(path);
    if (!result.value) {
      return result;
    }
    isValidPath(path);
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
          let keys = Object.keys(result?.value);
          for (let key of keys) {
            let savedVal = result?.value[key];
            let delValue = this.remove(result?.path + '/' + key);
            if (delValue.value) {
              resp.value[key] = savedVal;
              resp.path = result?.path;
              resp.key = result?.key;
              resp.obj = delValue.obj;
            }
          }
        } catch (e) {
          if (this.mode === 'dev') console.log(e);
          resp.value = undefined;
          resp.obj = this.data;
          resp.error = {
            code: HTTP_RESPONSE.INTERNAL_ERROR_CODE,
            message: HTTP_RESPONSE.MESSAGE.INTERNAL_ERROR_CODE,
          };
        }

        return resp;
      } else return result;
    } else return this.remove(path);
  }
  remove(path) {
    let result = this.exists(path);
    if (!result.value) {
      return result;
    }
    path = sanitizePath(path);
    let resp = {
      path,
      key: path.split('/').pop(),
    };

    const keys = path.split('/').filter((key) => key !== ''); // Split the path into keys

    let obj = this.data;
    let current = obj;
    let pathFound = false;
    try {
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];

        if (current[key] && i === keys.length - 1) {
          // Last key in the path
          resp.value = current[key];
          delete current[key];
          pathFound = true;
        } else {
          // Continue traversing the object
          if (!current[key]) {
            // Create an empty object if the key doesn't exist
            //current[key] = {};
            resp.value = false;
            pathFound = true;
            i = keys.length + 1;
          } else current = current[key];
        }
      }
      if (resp.value) resp.obj = obj;
    } catch (e) {
      if (this.mode === 'dev') console.log(e);
      resp.obj = this.data;
      resp.value = false;
      resp.error = {
        code: HTTP_RESPONSE.INTERNAL_ERROR_CODE,
        message: HTTP_RESPONSE.MESSAGE.INTERNAL_ERROR_CODE,
      };
    }

    return resp;
  }

  queryPath(path) {
    isValidPath(path);
    path = sanitizePath(path);
    let resp = { path };
    let error = {
      code: HTTP_RESPONSE.ERROR_FROM_USER_CODE,
      message: HTTP_RESPONSE.MESSAGE.ERROR_FROM_USER_CODE,
    };
    try {
      const matches = path?.match(/(!?\[.*?\])/); //we capture the parameter [x], ![x], ...etc
      let data = this.get(path?.replace(matches?.[0], '')); //we remove parameters from path, to get the array or object value
      if (typeof data?.value === 'object') {
        try {
          resp.key = data.key;
          let result;
          let objectOperation = operationInObj(data?.value);
          let getParam = getArrayParam(path);
          //console.log('get Param: ', objectOperation);
          switch (getParam?.mod?.withFunc) {
            case 'get':
              result = objectOperation.get(getParam?.value);
              resp.params = matches[0];
              resp.key = getParam?.value;
              if (result) resp.value = result;
              else {
                resp.value = false;
                resp.error = error;
              }
              break;
            case 'remove':
              result = objectOperation.remove(getParam?.value);
              resp.params = matches[0];
              resp.key = getParam?.value;
              if (result) resp.value = result;
              else {
                resp.value = false;
                resp.error = error;
              }
              break;
            case 'getInterval':
              result = objectOperation.getInterval(...getParam?.value);
              resp.params = matches[0];
              resp.key = getParam?.value;
              if (result) resp.value = result;
              else {
                resp.value = false;
                resp.error = error;
              }
              break;
            case 'getNotInterval':
              result = objectOperation.getNotInterval(...getParam?.value);
              resp.params = matches[0];
              resp.key = getParam?.value;
              if (result) resp.value = result;
              else {
                resp.value = false;
                resp.error = error;
              }
              break;
            case 'getAllTill':
              result = objectOperation.getAllTill(getParam?.value);
              resp.params = matches[0];
              resp.key = getParam?.value;
              if (result) resp.value = result;
              else {
                resp.value = false;
                resp.error = error;
              }
              break;
            case 'getOnly':
              result = objectOperation.getOnly(...getParam?.value);
              resp.params = matches[0];
              resp.key = getParam?.value;
              if (result) resp.value = result;
              else {
                resp.value = false;
                resp.error = error;
              }
              break;
            case 'getAllExcept':
              result = objectOperation.getAllExcept(...getParam?.value);
              resp.params = matches[0];
              resp.key = getParam?.value;
              if (result) resp.value = result;
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
        } catch (e) {
          if (this.mode === 'dev') console.log(e);
          resp.value = false;
          resp.error = error;
        }
      } else {
        resp.value = false;
        resp.error = error;
      }
    } catch (e) {
      resp.value = false;
      resp.error = {
        code: HTTP_RESPONSE.INTERNAL_ERROR_CODE,
        message: HTTP_RESPONSE.MESSAGE.INTERNAL_ERROR_CODE,
      };
    }

    return resp;
  }

  query(path, { filter = {}, sort, pagination, mod } = {}) {
    isValidPath(path);
    const matches = path.match(/(!?\[.*?\])/);
    if (matches?.length > 1) return this.queryPath(path); //path= /root/users[5]

    path = sanitizePath(path);
    const results = [];
    const response = {
      path: path,
      key: path.split('/').pop(),
    };

    try {
      function applyFilter(data) {
        if (Object?.keys(filter)?.length <= 0) return true;
        return Object.keys(filter).every((key) =>
          compare(data[key], filter?.[key])
        );
      }

      function hasProperties(parent, child) {
        if(typeof parent!=='object') return false;
        for (const key in child) {
          if (child.hasOwnProperty(key)) {
            if (typeof child[key] === 'object' && child[key] !== null) {
              if (!hasProperties(parent[key], child[key])) {
                return false;
              }
            } else {
              if (parent[key] !== child[key]) {
                return false;
              }
            }
          } else {
            return false;
          }
        }
        return true;
      }
      function deepEqual(a, b) {
        if (a === b) return true;

        if (typeof a !== typeof b) return false;

        if (typeof a === 'object') {
          if (Array.isArray(a) !== Array.isArray(b)) return false;

          if (Array.isArray(a)) {
            if (a.length !== b.length) return false;

            for (let i = 0; i < a.length; i++) {
              if (!deepEqual(a[i], b[i])) return false;
            }

            return true;
          } else {
            const keysA = Object.keys(a);
            const keysB = Object.keys(b);

            if (keysA.length !== keysB.length) return false;

            for (const key of keysA) {
              if (!keysB.includes(key)) return false;
              if (!deepEqual(a[key], b[key])) return false;
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
              if (typeof operand == 'object') return deepEqual(value, operand);
              // can also compare array and obj
              else return value === operand;
            case '$!=':
            case '_neq':
              if (typeof operand == 'object') return !deepEqual(value, operand);
              // can also compare array and obj
              else return value !== operand;
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
              return value?.includes(operand);
            case '$!includes':
              return !value?.includes(operand);
            case '$between':
              return value >= operand[0] && value <= operand[1];
            case '$!between':
              return !(value >= operand[0] && value <= operand[1]);
            case '$has':
              return hasProperties(value, operand); // similar to filter={a:value}, but also has the function to compare children with object {a:{a-child:'value-child'}}
            case '$!has':
              return !hasProperties(value, operand);
            case '$like':
              return new RegExp(`^${operand?.replace(/\*/g, '.*')}$`).test(
                value
              );
            case '$!like':
              return !new RegExp(`^${operand?.replace(/\*/g, '.*')}$`).test(
                value
              );
            case '$reg':
              return new RegExp(operand).test(value);
            default:
              return false;
          }
        } else {
          return value === condition;
        }
      }

      function createGlobMatcher(globPattern) {
        const regexPattern = globPattern
          .split('/')
          .map((segment) => {
            if (segment === '**') return '.*?';
            return segment
              .replace(/\*\*/g, '.*?')
              .replace(/\*/g, '[^/]*')
              .replace(/\?/g, '.');
          })
          .join('/');
        //console.log('Regexpattern ', `^${regexPattern}$`)
        const regex = new RegExp(`^${regexPattern}$`);
        return (str) => regex.test(str);
      }

      function traverse(currentPath, obj) {
        for (const key in obj) {
          const newPath = `${currentPath}/${key}/`.replace(/\/{2,}/g, '/');
          const value = obj[key];
          if (
            typeof value === 'object' &&
            (path.length + 1 >= currentPath.length ||
              shouldInclude(path, newPath))
          ) {
            traverse(newPath, value);
          } else if (applyFilter(obj)) {
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
        newPath = newPath.replace(/\/{2,}/g, '/');
        //console.log('NewPath ', newPath)
        let test = mod?.with?.some((child) => {
          if (child.match(/[a-zA-Z0-9_-]$/)) child = child + '/**';
          return createGlobMatcher(
            (path + '/' + child).replace(/\/{2,}/g, '/')
          )(newPath);
        });
        //console.log('Test Pattern ', test)
        return test || mod?.with?.includes('*');
      }

      function applyModifiers(obj) {
        if (mod?.rm && mod?.only) delete mod.rm;
        if (mod?.only)
          Object.keys(obj).forEach((item) => {
            if (!mod.only.includes(item)) delete obj[item];
          });
        if (mod?.rm) mod.rm.forEach((item) => delete obj[item]);
        if (mod?.rm?.includes('*')) obj = {};
      }

      let startingNode = this.get(response.path);
      startingNode = startingNode?.value;
      if (typeof startingNode === 'object')
        traverse(response.path, startingNode);

      if (sort && Object.keys(sort).length >= 1) {
        results.sort((a, b) =>
          Object.keys(sort).reduce((result, field) => {
            const order = sort[field] === 'asc' ? 1 : -1;
            const aValue = a.value[field];
            const bValue = b.value[field];
            return (
              result || (aValue < bValue ? -order : aValue > bValue ? order : 0)
            );
          }, 0)
        );
      }

      if (typeof pagination != 'object') pagination = {};

      if (pagination) {
        const { page = 1, limit = 10 } = pagination;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        if (results.length >= 1)
          response.pagination = { max: results.length, page, limit };
        response.value = results.slice(startIndex, endIndex);
      }
    } catch (e) {
      if (this.mode === 'dev') console.log(e);
      response.value = false;
      response.error = {
        code: HTTP_RESPONSE.INTERNAL_ERROR_CODE,
        message: HTTP_RESPONSE.MESSAGE.INTERNAL_ERROR_CODE,
      };
    }

    return response;
  }
}

/*
// Example usage:
const db = new JsonDatabase();

db.set('/products/product1/name', 'Product 1');
db.set('/products/product1/price', 20);
db.set('/products/product2/name', 'Product 2');
db.set('/products/product2/price', 30);
db.set('/products/product3/name', 'Product 3');
db.set('/products/product3/price', 15);
db.set('/members/users',[
    {userId1:{
            name:'Jeam',
            email:'user1@gmail.com',
            age:20
        }},
    {userId2:{
            name:'Joress',
            email:'user2@gmail.com',
            age:5
        }},
    {userId3:{
            name:'Luc',
            email:'user3@gmail.com',
            age:20
        }},
])

const filter = {
    age: 20,
    //name: { '$match': 'L.*' },
};

const sort = {
    age: 'asc',
};

const pagination = {
    page: 1,
    limit: 2,
};

let mod={
    with:['/!**!/users'], //Regex pattern, we already added '^'and '$', so no need to do: "^key$" // also you have enable '*' to fetch on array
    //rm:['*'],//remove keys from result
    only:['age'], //only selected key will be added
    //Note: You can't add 'rm' and  'only' at the same time, else it will take only as property

}
let path= '/'
const queryResults = db.query(path, { filter, sort, pagination,mod });

console.log(queryResults);
*/

/*const filter = {
  price: { '$>': 20 },
  name: { '$match': 'Product.*' },
};

const sort = {
  price: 'asc',
};

const pagination = {
  page: 1,
  limit: 2,
};
let path='products'
const queryResults = db.query(path,{ filter, sort, pagination });

console.log(queryResults);*/

export default JsonDatabase;
