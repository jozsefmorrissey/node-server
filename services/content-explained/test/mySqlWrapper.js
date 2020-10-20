const testing = require('testing');
var Mutex = require('async-mutex').Mutex;
const testMutex = new Mutex();

const Crud = require('../services/database/mySqlWrapper').Crud;
const { User, Explanation, Site, Opinion, List, ListItem } =
        require('../services/database/objects');

function validateObj (validationObj, obj) {
  const keys = Object.keys(validationObj);
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    testing.assertEquals(typeof obj, 'object', `${validationObj[key]}`);
    testing.assertEquals(obj[key], validationObj[key], `\n\t${keys}`);
    console.log(`${key}: ${validationObj[key]} === ${obj[key]}`);
  }
}

function crudCallback(validateResult, validateError, test) {
  return function (result, error) {
    if (validateError) {
      validateObj(validateError, error);
    } else if (validateResult) {
      validateObj(validateResult, result);
    } else if ((typeof test) === 'function') {
      test(result, error);
    }

    // console.log('ret: ', String.fromCharCode.apply(null, result[0].listItems[0].explanation.content));
    // console.log(result[0].listItems[0].explanation.content instanceof Buffer);
    // console.log(result[0].listItems[0].explanation);
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
      // const userId = Number.parseInt(Math.random().toString().substring(4));
      const user = new User(username, secret);

      function pushUser(result) {
        user.setId(result.insertId);
        users.push(user);
      }

      function selectCallBack(result, error) {
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
          crud.insert(new Explanation('My explanation 1', users[2]), crudCallback(undefined, {errno: 1452}));
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
      crud.select(new User(username, undefined, undefined), selectCallBack, true);
    });
  }

  testing.success(callback);
  createQuery();
}

function populateDb() {
  const crud = new Crud({silent: false, mutex: true});
  const secret = 'password';
  const users = [];
  const explanations = [];
  const sites = [];
  const opinions = [];
  const lists = [];

  function setId(dataObj, array) {
    array.push(dataObj);
    return function (result) {
      if (dataObj) {
        dataObj.setId(result.insertId);
      }
    }
  }

  function addUsers() {
    for(let index = 0; index < 5; index += 1) {
      const username = Math.random().toString(36).substring(2);
      const user = new User(username, secret);
      crud.insert(user, setId(user, users));
    }
  }

  function addExplanations() {
    for (let index = 0; index < 50; index += 1) {
      let author = users[index % 5];
      let explanation = new Explanation('My explanation ' + index, author);
      crud.insert(explanation, setId(explanation, explanations));
    }
  }

  function addSites() {
    for (let index = 0; index < 100; index += 1) {
      let site = new Site(`http://www.myUrl${index}.com`);
        crud.insert(site, setId(site, sites));
      }
  }

  function addOpinions() {
    for (let index = 0; index < 1000; index += 1) {
      let user = users[Math.floor(Math.random() * 5)];
      let explanation = explanations[Math.floor(Math.random() * 50)];
      let site = sites[Math.floor(Math.random() * 100)];
      let favorable = Math.floor(Math.random() * 5) > 0;

      let opinion = new Opinion(user, explanation, site, favorable);
      crud.insert(opinion, setId(undefined, opinions));
    }
  }

  function addList() {
    for (let index = 0; index < 10; index += 1) {
      let list = new List(`name-${index}`);
      crud.insert(list, setId(list, lists));
    }
  }

  const listItems = [];
  function addListItems() {
    for (let index = 0; index < 100; index += 1) {
      let listId = lists[index % 10].id;
      let explanation = explanations[Math.floor(Math.random() * 50)]
      let listItem = new ListItem(listId, explanation);
      crud.insert(listItem, setId(listItem, listItems));
    }
  }

  function callAfter(time) {
    let index = 1;
    const args = arguments;
    function nextOnStandBy() {
      if ((typeof args[index]) === 'function') {
        args[index++]();
        setTimeout(nextOnStandBy, time);
      }
    }

    nextOnStandBy();
  }

  callAfter(2000, addUsers, addExplanations, addSites, addOpinions, addList, addListItems);
}

// populateDb();
// testing.run([testCrud]);
testing.run([testRelationCrud]);
// testing.run([testCrud, testRelationCrud]);



// const crud = new Crud({silent: false, mutex: true});
// crud.select(new List(5), crudCallback());
