# SoduLite JS v0.1.0
SoduLite (Sodular Lite) is a lightweight JSON database based on path-like (similar to <a href="https://firebase.google.com/docs/database/web/read-and-write#web-namespaced-api_2" target="_blank">firebase database</a> )
<br>The data can be saved on local json file if you use Node JS or on browser with localStorage.

<a href="https://sodular.agglomy.com/" target="_blank"><img src="doc/assets/img/sodulite-logo.png"></a>

## Get Started
### 0. Download the package
Node JS: ``npm install @sodular/lite`` <br>
Browser:
* JsDelivr: <a href="https://cdn.jsdelivr.net/npm/@sodular/lite" target="_blank">https://cdn.jsdelivr.net/npm/@sodular/lite </a> , then copy all the code from the link and paste it in a file sodulite.min.js
### 1. Import the database
```
//import SoduLite from '@sodular/lite'; //Node JS
import SoduLite from '../sodulite.min.js'; //For browser
```

### 2. Init the database
```
let db = SoduLite.init({
dbName: 'sodulite @&', // we use regex to replace any special character to '\_'
path: './database@/project-Z $é/', //same for path, using '/xxxx' or './xxxx' is not necessary because we use the root of the project only.
});
```
Note: path  is only for Node JS

### 3. Call/Create the database service you want to work with
```
db = db = db.load('data'); //In Node Js, if .json is not added , it will automatically create it.
```
Note: load('service_name') is like your sub-dbName (sub-dbName.json if you are on Node Js). <br>
As service you have: auth, data, storage...

### 4. Do CRUD (Create|Read|Update|Delete) operation
Note: All operations are async, for those who don't know what we mean, it is as example below:
```
doSomething.then((result)=>{
  //work with your result
})

//OR 

(async () => {
  let result= await doSomething()
  //work with your result
})()
```
- #### 4.1 Do Create operation
```
let op = db
    .ref('/members/users/0')
    .create({ name: 'Alice' })
    .then((node) => { // using then to get the value
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
```
//OR
```
let  op = await db // asuming it's in an async function
    .ref('/members/users/0') // you could generate a unique uid for your users.
    .create({ name: 'Alice' })
    .catch((e) => {
      console.log('Create Bob Error: ', e);
    });
  console.log('Create Alice:', {
    path: op.path, 
    key: op.key,
    value: op.value, // you get the object value
    error: op.error,
  });
```
Note: If the ref with data exists already, you won't be allowed to create, instead you have to do the <a href="#updateOperation">Update Operation</a>.
- #### 4.2 Do Read operation
//Get the value of a path
```
let alice = await db // asuming it's in an async function
    .ref('/members/users/0')
    .get() //let it empty
    .catch((e) => {
      console.log('Get Alice Error: ', e);
    });
  console.log('Get Alice:', {
    path: alice.path,
    key: alice.key,
    value: alice.value,//the info of alice is here or it will return false.
    error: alice.error,
  });
```
//If path is an array[list of ids] or object{list of ids}
- Get the unique value of a path with a parameter
```
let alice = await db // asuming it's in an async function
    .ref('/members/users') //users is an array or object with ids as property
    .get({name:'Alice'}) // Will only fetch the first Alice found, so add multiple parameter to get your result efficiently like {name:'Alice,age:30,...}, but the best is {uid:'userId'}.
    .catch((e) => {
      console.log('Get Alice Error: ', e);
    });
  console.log('Get Alice:', {
    path: alice.path,
    key: alice.key,
    value: alice.value,//the info of alice is here or it will return false.
    error: alice.error,
  });
```
- Do the Query(Search), query always return an [array] of the result.
```
let query = await db // asuming it's in an async function
    .ref('/members/users') //users is an array or object with ids as property
    .query({ filter: { age: { _lte: 30 } } }) //Or { '$<=': 30 } , to get the condition little or equal to 30.
    .catch((e) => {
      console.log('Get Query Error: ', e);
    });
  console.log('Get Query:', {
    path: query.path,
    key: query.key,
    value: query.value,//array the value of query is here or it will return false.
    error: query.error,
  });
```
Note: See the parameters for query(filter = {}, sort, pagination, mod)
- <a href="#filterQuery">filter</a>
- <a href="#sortQuery">sort</a>
- <a href="#paginationQuery">pagination</a>
- <a href="#modQuery">mod</a>

//If you data is [], you could also use a path query string for a shorthand of pagination to get the list of objects in array.
```
let query = await db // asuming it's in an async function
    .ref('/members/users[0;1;5]') // if exist will select only the users[O], users[1] and users[5] in an array
    .query() //let it empty
    .catch((e) => {
      console.log('Get Query Error: ', e);
    });
  console.log('Get Query:', {
    path: query.path,
    key: query.key,
    value: query.value,//the array value of query is here or it will return false.
    error: query.error,
  });
```
Note: Check the <a href="#stringQuery">path query string</a>.

- #### 4.3 <span id="updateOperation">Do Update operation</span> 
//Overwrite the previous data
```
let alice = await db // asuming it's in an async function
    .ref('/members/users/0')
    .update({ name: 'Alice Lite' })
    .catch((e) => {
      console.log('Update Alice Error: ', e);
    });
  console.log('Update Alice:', {
    path: alice.path,
    key: alice.key,
    value: alice.value,//the info of alice is here or it will return false.
    error: alice.error,
  });
```
// To merge with the previous data , you add {merge=true}
```
let alice = await db // asuming it's in an async function
    .ref('/members/users/0')
    .update({ age: 26 },{merge=true}) //Here we merge with the existing value.
    .catch((e) => {
      console.log('Update Alice Error: ', e);
    });
  console.log('Update Alice:', {
    path: alice.path,
    key: alice.key,
    value: alice.value,//the info of alice is here or it will return false.
    error: alice.error,
  });
```
- #### 4.4 Do Delete operation
//Delete value with path
```
let alice = await db // asuming it's in an async function
    .ref('/members/users/0')
    .delete() //let it empty, it will delete everything on child=0
    .catch((e) => {
      console.log('Delete Alice Error: ', e);
    });
  console.log('Delete Alice:', {
    path: alice.path,
    key: alice.key,
    value: alice.value,//the info of alice is here or it will return false.
    error: alice.error,
  });
```
//If the final path is an array[list of ids] or object{list of ids}, the you can do the filter:
```
let alice = await db // asuming it's in an async function
    .ref('/members/users') //here you won't go to child=0, //users is an array or object with ids as property
    .delete({ age: 26 }) // will delete child which has age=26, 
    .catch((e) => {
      console.log('Delete Alice Error: ', e);
    });
  console.log('Delete Alice:', {
    path: alice.path,
    key: alice.key,
    value: alice.value,//the info of alice is here or it will return false.
    error: alice.error,
  });
```
Note:It will only delete the first object which has age=26 not all objects having age=26, <br>
so be careful to delete a unique uid, instead you should do .delete({ uid: uid_of_user }) or delete with the first method using path only.

## Advanced Options
### Query
```
let filter={
  //...
}
let sort={
  //...
}
let pagination={
  //...
}
let mod={
  //...
}
let result=await db //assuming async
           .ref()
           .query({filter,sort,pagination,mod})
           .catch((e) => {})
console.log('The result of filter: ', result?.value)
```
- #### <span id="filterQuery">Filter</span>
The available parameters are:
   * Object : filter = {age:30, name:'Alice'}
   * Object with operator: filter = {age:{'$<=':30}}, <br>
the operators are: <br>
     - case '$<': same as <br>
     - case '_lt': <br>
     return value < operand; <br>
     - case '$>': same as<br>
     - case '_gt': <br>
     return value > operand; <br>
     - case '$=': same as<br>
     - case '_eq': <br>
     if (typeof operand == 'object') return deepEqual(value, operand); <br>
     // can also compare array and obj <br>
     else return value === operand; <br>
     - case '$!=': same as<br>
     - case '_neq': <br>
     if (typeof operand == 'object') return !deepEqual(value, operand); <br>
     // can also compare array and obj <br>
     else return value !== operand; <br>
     - case '$>=': same as<br>
     - case '_gte': <br>
     return value >= operand; <br>
     - case '$<=': same as<br>
     - case '_lte': <br>
     return value <= operand; <br>
     - case '$match': <br>
     return new RegExp(operand).test(value); <br>
     - case '$!match': <br>
     return !new RegExp(operand).test(value); <br>
     - case '$includes': <br>
     return value?.includes(operand); <br>
     - case '$!includes': <br>
     return !value?.includes(operand); <br>
     - case '$between': <br>
     return value >= operand[0] && value <= operand[1]; <br>
     - case '$!between': <br>
     return !(value >= operand[0] && value <= operand[1]); <br>
     - case '$has': <br>
     return hasProperties(value, operand); // similar to filter={a:value}, but also has the function to compare children with object {a:{a-child:'value-child'}} <br>
     - case '$!has': <br>
     return !hasProperties(value, operand); <br>
     - case '$like': <br>
     return new RegExp(`^${operand?.replace(/\*/g, '.*')}$`).test(value); <br>
     - case '$!like': <br>
     return !new RegExp(`^${operand?.replace(/\*/g, '.*')}$`).test(value); <br>
     - case '$reg': <br>
     return new RegExp(operand).test(value); <br>
     
- #### <span id="sortQuery">Sort</span>
     * Object : sort = {age:'desc', name:'asc'} <br>
       the sort properties are: <br>
         - case 'asc': Ascendant  values<br>
         - case 'desc': Descendant values<br>
- #### <span id="paginationQuery">Pagination</span> <br>
     * Object : pagination = {page:1, limit:10} <br>
       the sort properties are: <br>
          - case page: Int value <br>
          - case limit: Int value<br>
- #### <span id="modQuery">Mod</span> <br>
     * Object : mod = {with:['name','age'],} <br>
       the mod properties are: <br>
          - case with: Array of String regex path value, will only match the path properties you set, eg: with:['child/**','child1/**/some_path'] <br>
          - case only: Array of String properties, select only the properties you selected, eg: only:['name']<br>
          - case rm: Array of String properties, remove the properties you selected, eg: rm:['name'] <br>
- #### <span id="stringQuery">Query String</span> <br>
     * String : db.ref('/path/users![a]').query() <br>
       the available string param are: <br>
       - case [a]: a is index int value, it will get list[a] value,<br> eg: users[1] the second user, users[-1] the last user, users[-2] the user before the last user...etc <br>
       - case ![a]: negation of [a] <br>
       - case [a:b]: a,b are index int value, it will get the interval list from a to b values,<br> eg: users[1:5] <br>
       - case ![a:b]: negation of [a:b] <br>
       - case [a,b,...etc]: a,b,...etc are index int value, it will select only list[a],list[b],...etc  ,<br> eg: users[1,5] <br>
       - case ![a,b]: negation of [a,b] <br>
       - case [?a]: a is index int value, it will get list from 0 to a similar to list[0:a],<br> eg: users[?3] <br>
       - case [?-a]: similar to [?a], but removes the indexes starting from last item(index from -1 to -a will be removed) ,<br> eg: users[?-2] <=> users[0,-2] <br>

## Todo
- Removing/Reduce some unusual dependencies,functions, refactoring paths/files...
- Making good and easy documentation with tutorials (videos, webpage...)
- Code Cleaning/ Making a suitable project structure with modular pattern (DRY and KISS dev).

## Join US
If you have any suggestion, feature to add ...etc
- Discord(Support Team, FAQ, Chat): https://discord.gg/5tHDeD3DQs

## Contributors
- Agglomy Team :
    - Ivan Joel Sobgui
## Licence

MIT: You can use it for educational/personal/business purpose!