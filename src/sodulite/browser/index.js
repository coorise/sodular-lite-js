import { JsonDatabase } from '../utils/index.js';
class JsonBrowserStreamDB {
  db = {};
  constructor(dbName = 'sodulite', mode = 'prod') {
    this.dbName = dbName;
    this.mode = mode;
    this.jsonDB = new JsonDatabase();
    this.jsonDB.mode = mode;
    this.rootPath = 'data';
    if (!localStorage?.getItem(dbName))
      localStorage.setItem(
        this.dbName,
        JSON.stringify({ [this.rootPath]: {} })
      );
    try {
      let file = localStorage?.getItem(dbName);
      file = JSON.parse(file);
      if (Object.keys(file)?.length > 1)
        localStorage.setItem(
          this.dbName,
          JSON.stringify({ [this.rootPath]: file })
        );
      if (!file?.[this.rootPath])
        localStorage.setItem(
          this.dbName,
          JSON.stringify({ [this.rootPath]: file })
        );
    } catch (e) {}
    this.dbNameLock = this.dbName + '-lock';
  }
  acquireLock() {
    return new Promise((resolve) => {
      let dbLock = (() => {
        try {
          return localStorage.getItem(this.dbNameLock);
        } catch (e) {
          return false;
        }
      })();
      if (!dbLock) localStorage.setItem(this.dbNameLock, 'acquired');
      resolve();
    });
  }
  releaseLock() {
    return new Promise((resolve) => {
      localStorage.removeItem(this.dbNameLock);
      resolve();
    });
  }
  #readDB = async (dbName) => {
    return await new Promise((resolve) => {
      if (!dbName) dbName = this.dbName;
      try {
        resolve(JSON.parse(localStorage.getItem(dbName))?.[this.rootPath]);
      } catch (e) {
        resolve({});
      }
    });
  };
  #saveDB = async (dbTemp) => {
    return await new Promise((resolve) => {
      if (dbTemp) {
        localStorage.setItem(
          this.dbName,
          JSON.stringify({
            [this.rootPath]: dbTemp,
          })
        );
        this.db = dbTemp;
        resolve();
      }
    });
  };
  get = async (path, value) => {
    try {
      await this.acquireLock();
      this.jsonDB.data = await this.#readDB();
      return this.jsonDB.get(path, value);
    } finally {
      await this.releaseLock();
    }
  };
  exists = async (path) => {
    try {
      await this.acquireLock();
      this.jsonDB.data = await this.#readDB();
      return this.jsonDB.exists(path);
    } finally {
      await this.releaseLock();
    }
  };

  create = async (path, value, merge) => {
    try {
      await this.acquireLock();
      this.jsonDB.data = await this.#readDB();
      let resp = this.jsonDB.create(path, value, merge);

      if (resp.obj && Object.keys(resp.obj).length >= 1)
        await this.#saveDB(resp.obj);
      delete resp.obj;
      return resp;
    } finally {
      await this.releaseLock();
    }
  };
  set = async (path, value) => this.create(path, value, true);
  update = async (path, value, mod) => {
    try {
      await this.acquireLock();
      this.jsonDB.data = await this.#readDB();
      let resp = this.jsonDB.update(path, value, mod);
      if (resp.obj && Object.keys(resp.obj).length >= 1)
        await this.#saveDB(resp.obj);
      delete resp.obj;
      return resp;
    } finally {
      await this.releaseLock();
    }
  };
  delete = async (path, value) => {
    try {
      await this.acquireLock();
      this.jsonDB.data = await this.#readDB();
      let resp = this.jsonDB.delete(path, value);
      if (resp.obj && Object.keys(resp.obj).length >= 1)
        await this.#saveDB(resp.obj);
      delete resp.obj;
      return resp;
    } finally {
      await this.releaseLock();
    }
  };
  query = async (path, option) => {
    try {
      await this.acquireLock();
      this.jsonDB.data = await this.#readDB();
      return this.jsonDB.query(path, option);
    } finally {
      await this.releaseLock();
    }
  };
}
export default JsonBrowserStreamDB;
