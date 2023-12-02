const SoduLite = {
  init: (
    SoduBaseConfig = { dbName: 'sodubase', path: 'database/', mode: 'prod' }
  ) => {
    let db = (pathDB = 'data', ref) => {
      let node = async (parent = {}, name, ...args) => {
        // console.log('get parent: ', parent);
        try {
          SoduBaseConfig.dbName = SoduBaseConfig.dbName
            .replace(/[^\w _-]/g, '_')
            .replace(/\_\_/g, '_')
            .replace(/\_$/, '');
          let service = {};
          let isBrowser = (() => {
            try {
              return window;
            } catch (e) {
              return false;
            }
          })();
          if (isBrowser) {
            let BrowserDB = await import('./browser/index.js');
            service = new BrowserDB.default(
              SoduBaseConfig.dbName + '_' + pathDB,
              SoduBaseConfig.mode
            );
          } else {
            let NodeDB = await import('./node-js/index.js');
            SoduBaseConfig.path = SoduBaseConfig.path
              ?.replace(/^(\/|\.\/)/, '')
              .replace(/[^\w /_-]/g, '_')
              .replace(/\_\_/g, '_')
              .replace(/\_$/, '');
            let path =
              SoduBaseConfig.path + '/' + SoduBaseConfig.dbName + '/' + pathDB;
            if (!/\.json$/.test(path)) path = path + '.json';
            path = path.replace(/\/\//g, '/');
            service = new NodeDB.default(path, SoduBaseConfig.mode);
          }

          let value, option, callback;
          if (args?.length == 1) {
            if (typeof args[0] != 'function') value = args[0];
            else callback = args[0];
          }
          if (args?.length == 2) {
            value = args[0];
            if (typeof args[1] != 'function') option = args[1];
            else callback = args[1];
          }
          if (args?.length >= 3) {
            value = args[0];
            option = args[1];
            callback = args[2];
          }
          parent.ref = (childRef) => db(pathDB, childRef);
          parent.child = (childRef) => db(pathDB, ref + '/' + childRef);
          let resp = await service?.[name](ref, value, option);
          if (typeof callback == 'function')
            callback({
              ...resp,
              ...parent,
            });
          else
            return {
              ...resp, // {path, value,}
              ...parent,
            };
        } catch (e) {
          if (SoduBaseConfig.mode === 'dev') console.log(e);
          return {
            ...parent,
          };
        }
      };
      let crud = {
        create: async (...args) => node(crud, 'create', ...args),
        set: async (...args) => node(crud, 'set', ...args),
        get: async (...args) => node(crud, 'get', ...args),
        update: async (...args) => node(crud, 'update', ...args),
        delete: async (...args) => node(crud, 'delete', ...args),
        query: async (...args) => node(crud, 'query', ...args),
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
export default SoduLite;
