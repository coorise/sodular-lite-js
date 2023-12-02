import SoduLite from '../sodulite';

// Example usage:

let db = SoduLite.init({
  dbName: 'sodulite @&', // We use regex to replace any special character to '_'
  path: './database@/project-Z $é/', //Same for path, using '/xxxx' or './xxxx' is not necessary because we use the root of the project only.
  mode: 'dev',
});

(async () => {
  db = db.load('data'); // If .json is not supplied, we will add it. We only support JSON file
  let op;
  //console.log('get ref: ', db);

  /*op = await db
    .ref('/members/users/0')
    .create({ name: 'Alice' })
    .then((node) => {
      console.log('Create Alice: ', {
        path: node.path,
        key: node.key,
        value: node.value,
        error: node.error,
      });
    })
    .catch((e) => {
      console.log('Create Alice Error: ', e);
    });

  op = await db
    .ref('/members/users/1')
    .create({ name: 'Bob' })
    .catch((e) => {
      console.log('Create Bob Error: ', e);
    });
  console.log('Create Bob:', {
    path: op.path,
    key: op.key,
    value: op.value,
    error: op.error,
  });*/

  /*
  alice = await db.ref('/members/users').get({ name: 'Alice' }).catch((e) => {*/
  let alice = await db
    .ref('/members/users/0')
    .get()
    .catch((e) => {
      console.log('Get Alice Error: ', e);
    });
  console.log('Get Alice:', {
    path: alice.path,
    key: alice.key,
    value: alice.value,
    error: alice.error,
  });

  //await db.update('/members/users/0', { age: 30 }); //without merge, it will override the existing value
  /*op = await db
    .ref('/members/users/0')
    .update({ age: 30 }, { merge: true })
    .catch((e) => {
      console.log('Update Alice Error: ', e);
    });
  console.log('Update Alice:', {
    path: op.path,
    key: op.key,
    value: op.value,
    error: op.error,
  });

  let bob = await db.ref('/members/users');
  bob = await bob
    .delete({ name: 'Bob' })
    .then((node) => {
      console.log('Delete Bob: ', {
        path: node.path,
        key: node.key,
        value: node.value,
        error: node.error,
      });
    })
    .catch((e) => {
      console.log('Delete Bob Error: ', e);
    });
*/
  op = await db
    .ref('/members/users[0;1]') //.ref('/members/users[0]').query() //without any argument
    .query(null, (snapshot) => {
      console.log('Query Alice: ', {
        path: snapshot.path,
        key: snapshot.key,
        value: snapshot.value,
        error: snapshot.error,
      });
    })
    .catch((e) => {
      console.log('Query Alice Error: ', e);
    });
})();
