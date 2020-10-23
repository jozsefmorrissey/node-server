const DataObject = require('./mySqlWrapper').DataObject;

class Ip extends DataObject {
  constructor() {
    super();
    this.$d().addField('value');
    this.$d().addField('id');
    this.$d().init(arguments);
  }
}
new Ip();

class UserAgent extends DataObject {
  constructor() {
    super();
    this.$d().addField('value');
    this.$d().addField('id');
    this.$d().init(arguments);
  }
}
new UserAgent();

class Credential extends DataObject {
  constructor() {
    super();
    this.$d().addField('secret');
    this.$d().addField('ip', {class: Ip, relation: 'manyToOne', merge: true});
    this.$d().addField('userAgent', {class: UserAgent, relation: 'manyToOne', merge: true});
    this.$d().addField('user_id');
    this.$d().addField('id');
    this.$d().init(arguments);
  }
}
new Credential();

class User extends DataObject {
  constructor() {
    super();
    this.$d().setTableNames('USER_DETAIL')
    this.$d().addField('username');
    this.$d().addField('email', {writeOnly: true});
    this.$d().addField('id');
    this.$d().addField('Credentials', {class: Credential, relation: 'OneToMany'});
    this.$d().addField('likes', {readOnly: true});
    this.$d().addField('dislikes', {readOnly: true});
    this.$d().init(arguments);
  }
}
new User();

class Explanation extends DataObject {
  constructor() {
    super();
    this.$d().setTableNames('EXPLANATION_DETAIL')
    this.$d().addField('content');
    this.$d().addField('author', {class: User, relation: 'manyToOne'});
    this.$d().addField('id');
    this.$d().addField('likes', {readOnly: true});
    this.$d().addField('dislikes', {readOnly: true});
    this.$d().init(arguments);
  }
}
new Explanation();


class Site extends DataObject {
  constructor() {
    super();
    this.$d().addField('url');
    this.$d().addField('id');
    this.$d().init(arguments);
  }
}
new Site();

class Opinion extends DataObject {
  constructor() {
    super();
    this.$d().addField('userId');
    this.$d().addField('explanationId');
    this.$d().addField('siteId');
    this.$d().addField('favorable');
    this.$d().init(arguments);
  }
}
new Opinion();

class ListItem extends DataObject {
  constructor(id, explanation) {
    super();
    this.$d().addField('listId');
    this.$d().addField('explanation', {class: Explanation, relation: 'manyToOne'});
    this.$d().addField('id');
    this.$d().init(arguments);
  }
}
new ListItem();

class List extends DataObject {
  constructor(id, name) {
    super();
    this.$d().addField('name');
    this.$d().addField('id');
    this.$d().addField('listItems', {class: ListItem, relation: 'OneToMany'});
    this.$d().init(arguments);
  }
}
new List();

// console.log('User: ', DataObject.prototype.getChildTables(new User()));
// console.log('Explanation: ', DataObject.prototype.getChildTables(new Explanation()), '\n\n');
// console.log('Site: ', DataObject.prototype.getChildTables(new Site()), '\n\n');
// console.log('Opinion: ', DataObject.prototype.getChildTables(new Opinion()), '\n\n');
// console.log('List: ', DataObject.prototype.getChildTables(new List()), '\n\n');
// console.log('ListItem: ', DataObject.prototype.getChildTables(new ListItem()), '\n\n');

// exports = {User, Explanation, Site, Opinion, List, ListItem};
exports.Ip = Ip;
exports.UserAgent = UserAgent;
exports.Credential = Credential;
exports.User = User;
exports.Explanation = Explanation;
exports.Site = Site;
exports.Opinion = Opinion;
exports.List = List;
exports.ListItem = ListItem;
exports.DataObject = DataObject;
