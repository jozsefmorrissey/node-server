
const Crud = require('../services/database/mySqlWrapper').Crud;
const { User, Explanation, Site, Opinion, List, ListItem, Credential, DataObject,
        Ip, UserAgent} =
        require('../services/database/objects');
        
function populateDb() {
  const crud = new Crud({silent: true, mutex: true});
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

populateDb();
