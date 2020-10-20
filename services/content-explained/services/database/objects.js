const DataObject = require('./mySqlWrapper').DataObject;

class User extends DataObject {
  constructor() {
    super();
    this.$d.addField('username');
    this.$d.addField('secret');
    this.$d.addField('id');
    // this.$d.addField('explanation', {class: Explanation, relation: 'oneToMany'});
    // this.$d.addField('opinion', {class: Opinion, relation: 'oneToMany'});
    this.$d.init(arguments);
  }
}
new User();

class Explanation extends DataObject {
  constructor() {
    super();
    this.$d.addField('content');
    this.$d.addField('author', {class: User, relation: 'manyToOne'});
    this.$d.addField('id');
    this.$d.init(arguments);
  }
}
new Explanation();


class Site extends DataObject {
  constructor() {
    super();
    this.$d.addField('url');
    this.$d.addField('id');
    this.$d.init(arguments);
  }
}
new Site();

class Opinion extends DataObject {
  constructor() {
    super();
    this.$d.addField('user', {class: User, relation: 'manyToOne'});
    this.$d.addField('explanation', {class: Explanation, relation: 'manyToOne'});
    this.$d.addField('site', {class: Site, relation: 'manyToOne'});
    this.$d.addField('favorable');
    this.$d.init(arguments);
  }
}
new Opinion();

class ListItem extends DataObject {
  constructor(id, explanation) {
    super();
    this.$d.addField('listId');
    this.$d.addField('explanation', {class: Explanation, relation: 'manyToOne'});
    this.$d.addField('id');
    this.$d.init(arguments);
  }
}
new ListItem();

class List extends DataObject {
  constructor(id, name) {
    super();
    this.$d.addField('name');
    this.$d.addField('id');
    this.$d.addField('listItems', {class: ListItem, relation: 'OneToMany'});
    this.$d.init(arguments);
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
exports.User = User;
exports.Explanation = Explanation;
exports.Site = Site;
exports.Opinion = Opinion;
exports.List = List;
exports.ListItem = ListItem;
