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
    this.$d().addField('userId');
    this.$d().addField('activationSecret');
    this.$d().addField('ip', {class: Ip, relation: 'manyToOne', merge: true});
    this.$d().addField('userAgent', {class: UserAgent, relation: 'manyToOne', merge: true});
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
    this.$d().addField('Credentials', {class: Credential, relation: 'OneToMany', writeOnly: true});
    this.$d().addField('likes', {readOnly: true});
    this.$d().addField('dislikes', {readOnly: true});
    this.$d().init(arguments);
  }
}
new User();

class Tag extends DataObject {
  constructor() {
    super();
    this.$d().addField('value');
    this.$d().addField('id');
    this.$d().init(arguments);
  }
}
new Tag();

class ExplanationTag extends DataObject {
  constructor() {
    super();
    this.$d().addField('tag', {class: Tag, relation: 'manyToOne', merge: true});
    this.$d().addField('explanationId')
    this.$d().addField('id');
    this.$d().init(arguments);
  }
}
new ExplanationTag();

class Words extends DataObject {
  constructor() {
    super();
    this.$d().addField('value');
    this.$d().addField('id');
    this.$d().init(arguments);
  }
}
new Words();

class Explanation extends DataObject {
  constructor() {
    super();
    this.$d().setTableNames('EXPLANATION_DETAIL')
    this.$d().addField('content');
    this.$d().addField('id');
    this.$d().addField('words', {class: Words, relation: 'manyToOne'});
    this.$d().addField('author', {class: User, relation: 'manyToOne'});
    this.$d().addField('tags', {class: ExplanationTag, relation: 'oneToMany', merge: true});
    this.$d().addField('likes', {readOnly: true});
    this.$d().addField('dislikes', {readOnly: true});
    this.$d().init(arguments);
  }
}
new Explanation();

class Opinion extends DataObject {
  constructor() {
    super();
    this.$d().addField('favorable');
    this.$d().addField('explanationId');
    this.$d().addField('siteId');
    this.$d().addField('userId');
    this.$d().addField('id', {writeOnly: true});
    this.$d().init(arguments);
  }
}
new Opinion();

class SiteExplanation extends DataObject {
  constructor(id, explanation) {
    super();
    this.$d().addField('siteId');
    this.$d().addField('explanation', {class: Explanation, relation: 'manyToOne'});
    this.$d().addField('id');
    this.$d().init(arguments);
  }
}
new SiteExplanation();

class Site extends DataObject {
  constructor(id, url) {
    super();
    this.$d().addField('url');
    this.$d().addField('id');
    this.$d().addField('SiteExplanations', {class: SiteExplanation, relation: 'OneToMany'});
    this.$d().init(arguments);
  }
}
new Site();

exports.Ip = Ip;
exports.UserAgent = UserAgent;
exports.Credential = Credential;
exports.User = User;
exports.Explanation = Explanation;
exports.Site = Site;
exports.Opinion = Opinion;
exports.Site = Site;
exports.SiteExplanation = SiteExplanation;
exports.DataObject = DataObject;
exports.Words = Words;
exports.Tag = Tag;
exports.ExplanationTag = ExplanationTag;
