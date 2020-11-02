const testing = require('testing');
var Mutex = require('async-mutex').Mutex;
const testMutex = new Mutex();

const Crud = require('../services/database/mySqlWrapper').Crud;
const { User, Explanation, Site, Opinion, SiteExplanation, Credential, DataObject,
        Ip, UserAgent} =
        require('../services/database/objects');

function validateObj (validationObj, obj) {
  const keys = Object.keys(validationObj);
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    testing.assertEquals(typeof obj, 'object', `${validationObj[key]}`);
    testing.assertEquals(obj[key], validationObj[key], `\n\t${keys}`);
  }
}

function crudCallback(validateResponse, test) {
  return function (response) {
    validateObj(validateResponse, response);
    if ((typeof test) === 'function') {
      test(result, error);
    }
  }
}

function testCrud(callback) {
  const crud = new Crud({silent: true, mutex: true});
  let rootName = Math.random().toString(36).substring(2);
  for (let index = 0; index < 10; index += 1) {
    crud.insert(new User(`${rootName}-${index}`, 'lkasldkfj'), crudCallback({affectedRows: 1}));
  }
  crud.select(new User(`${rootName}-0`), crudCallback({length: 1}));
  crud.select(new User(new RegExp(`^${rootName}-[0-5]$`)), crudCallback({length: 6}));
  crud.delete(new User(`${rootName}-0`, 'lkasldkfjj'), crudCallback({affectedRows: 0}));
  crud.delete(new User(`${rootName}-0`, 'lkasldkfj'), crudCallback({affectedRows: 1}));
  crud.delete(new User(`${rootName}-1`, 'lkasldkfj'), crudCallback({affectedRows: 1}));
  crud.delete(new User(new RegExp(`^${rootName}-[0-9]*$`)), crudCallback({affectedRows: 8}));

  testing.success(callback);
}

function testRelationCrud(callback) {
  const users = [];
  const crud = new Crud({silent: true, mutex: true});
  let mainTestStarted = false;
  function createQuery() {
    testMutex.acquire().then(function (release) {
      const username = Math.random().toString(36).substring(2);
      const secret = 'lkjasdflkjaslk';
      const user = new User(username, secret);

      function pushUser(result) {
        user.setId(result.insertId);
        users.push(user);
      }

      function selectCallBack(result) {
        if (mainTestStarted) {
          return;
        }

        if (result.length === 0 && users.length < 3) {
            crud.insert(user, pushUser);
        }

        if (users.length < 3) {
          createQuery();
          release();
          return;
        } else {
          mainTestStarted = true;
          crud.delete(users[2], crudCallback({affectedRows:1}));
          crud.insert(new Explanation('My explanation 1', users[2]), undefined, crudCallback({errno: 1452}));
          crud.insert(new Explanation('My explanation 2', users[0]), crudCallback({affectedRows: 1}));
          crud.insert(new Explanation('My explanation 3', users[0]), crudCallback({affectedRows: 1}));
          crud.insert(new Explanation('My explanation 4', users[1]), crudCallback({affectedRows: 1}));

          crud.delete(new Explanation(undefined, new User(users[1].id)), crudCallback({affectedRows: 1}));
          crud.delete(new User(users[0].id), crudCallback({affectedRows: 1}))
          crud.delete(new User(users[1].id), crudCallback({affectedRows: 1}))
        }
        release();
      }
      release();
      crud.select(new User(username, undefined, undefined), selectCallBack, undefined, true);
    });
  }

  testing.success(callback);
  createQuery();
}

testing.run([testCrud, testRelationCrud]);
