//ChatGPT 3.5
/*
hey generate node js  function to stream on heavy json file to do crud operation using path-like using  JsonStreamDB(filePath='data.json'). So that i could write/append/read on file
without loading the whole json data
// we have a file data.json , containing as example:
{
  "members": {
    "users": [
      {
        "user_id": "583c3ac3f38e84297c002546",
        "email": "test@test.com",
        "name": "test@test.com",
        "given_name": "Hello",
        "family_name": "Test",
        "nickname": "test",
        "last_ip": "94.121.163.63",
        "logins_count": 15,
        "created_at": "2016-11-28T14:10:11.338Z",
        "updated_at": "2016-12-02T01:17:29.310Z",
        "last_login": "2016-12-02T01:17:29.310Z",
        "email_verified": true
        "location":{"long":1222,33}
      },
      {
        "user_id": "583c5484cb79a5fe593425a9",
        "email": "test1@test.com",
        "name": "test1@test.com",
        "given_name": "Hello1",
        "family_name": "Test1",
        "nickname": "test1",
        "last_ip": "94.121.168.53",
        "logins_count": 1,
        "created_at": "2016-11-28T16:00:04.209Z",
        "updated_at": "2016-11-28T16:00:47.203Z",
        "last_login": "2016-11-28T16:00:47.203Z",
        "email_verified": true
      },

    ]
  }
}
  //to read
await JsonStreamDB.read('/members/users') //return our perform a 'for' loop to get the value based on json path-like "parent/child/..."" = {"parent":{child={...}} on the object data.json
 // to write
await JsonStreamDB.write('/members/users/O', value, merge) // will write value on the specified path with stream based on the data.json object(so we won't load the whole json data),. If the value already exists, it will override the value on that specific path.
// unless merge is true, then you merge if the existing value is an array or object. Then return success true or false.

await JsonStreamDB.remove('/members/users/1') // will remove value on the json file and return true or false

Note: You have to note that we won't load the whole json database to avoid memory consumption, we read/write/remove only the value on a specified path-like on object.

*/
import { JsonDatabase, HTTP_RESPONSE, sanitizePath } from '../utils/index.js';
import fs from 'fs-extra';
import JSONStream from 'JSONStream';
let writeStream = async (
  that,
  service = 'create',
  path,
  value,
  merge = false
) => {
  return new Promise(async (resolve, reject) => {
    await that.acquireLock();
    try {
      let resp = {
        path,
        //key: path.split('/').pop()
      };
      let error = {
        code: HTTP_RESPONSE.ERROR_FROM_USER_CODE,
        message: HTTP_RESPONSE.MESSAGE.ERROR_FROM_USER_CODE,
      };
      const readStream = fs.createReadStream(that.filePath, {
        encoding: 'utf8',
      });
      const writeStream = fs.createWriteStream(that.filePathTemp, {
        encoding: 'utf8',
      });

      let pathFound = false;

      readStream
        .pipe(
          JSONStream.parse(that.rootPath, (data) => {
            //console.log('Get data: ', data);
            let obj = data;
            that.jsonDB.data = obj;

            if (!pathFound) {
              resp = that.jsonDB[service](path, value, merge);

              pathFound = true;
            }
            //console.log('get value: ', { data: resp.obj });
            obj = resp.obj || obj;
            delete resp.obj;
            return { [that.rootPath]: obj };
          })
        )
        .pipe(JSONStream.stringify(false, undefined, undefined, 2))
        .on('data', (data) => {
          // console.log('get data: ', data);
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
          } else {
            fs.rename(that.filePathTemp, that.filePath, (err) => {
              if (err) {
                if (that.mode === 'dev') console.log(e);
                resp.value = false;
                resp.error = {
                  code: HTTP_RESPONSE.INTERNAL_ERROR_CODE,
                  message: HTTP_RESPONSE.MESSAGE.INTERNAL_ERROR_CODE,
                };
              }
              resolve(resp);
            });
          }
        })
        .on('error', (error) => {
          resp.value = false;
          resp.error = {
            code: HTTP_RESPONSE.INTERNAL_ERROR_CODE,
            message: HTTP_RESPONSE.MESSAGE.INTERNAL_ERROR_CODE,
          };
        });
    } finally {
      await that.releaseLock();
    }
  });
};
let readStream = async (that, service = 'get', path, value) => {
  return new Promise(async (resolve, reject) => {
    await that.acquireLock();
    try {
      path = sanitizePath(path);
      let resp = {
        path,
        key: path.split('/').pop(),
      };
      let error = {
        code: HTTP_RESPONSE.ERROR_FROM_USER_CODE,
        message: HTTP_RESPONSE.MESSAGE.ERROR_FROM_USER_CODE,
      };
      const stream = fs.createReadStream(that.filePath, { encoding: 'utf8' });
      let search;
      const matches = path.match(/(!?\[.*?\])/);
      if (matches?.length > 1) {
        search = path?.replace(matches?.[0], '');
        resp.key = search.split('/').pop();
        search = search.replace(/\//g, '.');
        value = {};
      } else search = path.replace(/\//g, '.');
      const parser = JSONStream.parse(search);

      let found = false;

      stream.pipe(parser);

      parser.on('data', (obj) => {
        // console.log('Get JSONSTREAM chunck: ', obj);
        if (obj) {
          if (value) {
            let lastKey = path?.replace(matches?.[0], '').split('/').pop();
            that.jsonDB.data = {
              [lastKey]: obj,
            };
            //console.log('last key: ', '/' + path.split('/').pop());
            resp = that.jsonDB[service]('/' + path.split('/').pop(), value);
          } else resp.value = obj;
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
          code: HTTP_RESPONSE.INTERNAL_ERROR_CODE,
          message: HTTP_RESPONSE.MESSAGE.INTERNAL_ERROR_CODE,
        };
        resolve(resp);
      });
    } finally {
      await that.releaseLock();
    }
  });
};
class JsonNodeStreamDB {
  constructor(filePath, mode = 'prod') {
    this.filePath = filePath;
    this.mode = mode;
    this.jsonDB = new JsonDatabase();
    this.jsonDB.mode = mode;
    this.rootPath = 'data';
    if (!fs.existsSync(this.filePath)) {
      fs.ensureFileSync(this.filePath);
      fs.outputFileSync(this.filePath, JSON.stringify({ [this.rootPath]: {} }));
    } else {
      let file = fs.readFileSync(this.filePath, {
        encoding: 'utf8',
        flag: 'r',
      });
      try {
        file = JSON.parse(file);
        if (Object.keys(file)?.length > 1)
          fs.outputFileSync(
            this.filePath,
            JSON.stringify({ [this.rootPath]: file })
          );
        if (!file?.data)
          fs.outputFileSync(
            this.filePath,
            JSON.stringify({ [this.rootPath]: {} })
          );
      } catch (e) {}
    }

    this.filePathLock = this.filePath + '.lock';
    this.filePathTemp = this.filePath + '.temp';
  }

  async acquireLock() {
    return new Promise(async (resolve, reject) => {
      if (fs.existsSync(this.filePathLock)) {
        // return false;
        resolve(true);
        //return reject(new Error('Database is locked by another user.'));
      }
      await fs.ensureFile(this.filePathLock); // file does not exists ,  it will create it
      resolve(false);
    });
  }

  async releaseLock() {
    return new Promise(async (resolve, reject) => {
      await fs.remove(this.filePathLock);
      resolve(true);
    });
  }

  async get(path, value) {
    return await readStream(this, 'get', path, value);
  }
  async query(path, value) {
    return await readStream(this, 'query', path, value);
  }
  async set(path, value) {
    return this.create(path, value, true);
  }
  async create(path, value, merge = false) {
    return await writeStream(this, 'create', path, value, merge);
  }

  async update(path, value, merge) {
    return await writeStream(this, 'update', path, value, merge);
  }

  async delete(path, value) {
    return await writeStream(this, 'delete', path, value);
  }
}

/*
// Example usage:

const db = new JsonNodeStreamDB('db.json'); // Replace 'your_database.json' with your desired JSON file path
//import Queue from '../utils'
const queue = new Queue();

(async () => {
    //let resp =await queue.enqueue(async () => { return await db.get('path')});
    await db.create('/members/users/0', { name: 'Alice' }).catch((e) => {
        console.log('Create: ', e);
    });
    await db.create('/members/users/1', { name: 'Bob' }).catch((e) => {
        console.log('Create: ', e);
    });

    const alice = await db.get('/members/users/0').catch((e) => {
        console.log('Get: ', e);
    });
    console.log('Alice:', alice);

    //await db.update('/members/users/0', { age: 30 }); //without merge, it will override the existing value
    await db.update('/members/users/0', { age: 30 }, true).catch((e) => {
        console.log('Update: ', e);
    });

    const updatedAlice = await db.get('/members/users/0').catch((e) => {
        console.log('Get: ', e);
    });
    console.log('Updated Alice:', updatedAlice);

    /!*
    //await db.delete('/members/users/1').catch((e) => {
      console.log('Get: ', e);
    });
    *!/

    const bob = await db.get('/members/users/1').catch((e) => {
        console.log('Get: ', e);
    });
    console.log('Bob:', bob); // Should be null
})();*/

export default JsonNodeStreamDB;
