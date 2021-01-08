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
    this.$d().addField('ip', {class: Ip, relation: 'manyToOne', merge: 'value'});
    this.$d().addField('userAgent', {class: UserAgent, relation: 'manyToOne', merge: 'value'});
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

class PendingUserUpdate extends DataObject {
  constructor() {
    super();
    this.$d().addField('updateSecret');
    this.$d().addField('username');
    this.$d().addField('email');
    this.$d().addField('user', {class: User, relation: 'manyToOne'});
    this.$d().addField('id');
    this.$d().init(arguments);
  }
}
new PendingUserUpdate();

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
    this.$d().addField('tag', {class: Tag, relation: 'manyToOne', merge: 'value'});
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

class Comment extends DataObject {
  constructor() {
    super();
    this.$d().addField('value');
    this.$d().addField('explanationId');
    this.$d().addField('siteId');
    this.$d().addField('commentId');
    this.$d().addField('author', {class: User, relation: 'manyToOne'});
    this.$d().addField('id');
    this.$d().init(arguments);
  }
}
new Comment();

class Explanation extends DataObject {
  constructor() {
    super();
    this
    this.$d().setTableNames('EXPLANATION_DETAIL')
    this.$d().addField('content');
    this.$d().addField('words', {class: Words, relation: 'manyToOne', merge: 'value'});
    this.$d().addField('searchWords', {class: Words, relation: 'manyToOne', merge: 'value'});
    this.$d().addField('author', {class: User, relation: 'manyToOne'});
    this.$d().addField('tags', {class: ExplanationTag, relation: 'oneToMany', merge: 'tag'});
    this.$d().addField('comments', {class: Comment, relation: 'oneToMany'});
    this.$d().addField('id');
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
  constructor() {
    super();
    this.$d().setTableNames('SITE_EXPLANATION_DETAIL')
    this.$d().addField('siteId');
    this.$d().addField('explanation', {class: Explanation, relation: 'manyToOne'});
    this.$d().addField('id');
    this.$d().addField('url', {readOnly: true});
    this.$d().addField('likes', {readOnly: true});
    this.$d().addField('dislikes', {readOnly: true});
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

class Question extends DataObject {
  constructor() {
    super();
    this
    this.$d().addField('words', {class: Words, relation: 'manyToOne', merge: 'value'});
    this.$d().addField('siteId');
    this.$d().addField('asker', {class: User, relation: 'manyToOne'});
    this.$d().addField('id');
    this.$d().init(arguments);
  }
}
new Question();

class Notification extends DataObject {
  constructor() {
    super();
    this.$d().addField('userId');
    this.$d().addField('explanationId');
    this.$d().addField('questionId');
    this.$d().addField('commentId');
    this.$d().addField('siteId');
    this.$d().addField('id');
    this.$d().init(arguments);
  }
}
new Notification();


exports.Ip = Ip;
exports.UserAgent = UserAgent;
exports.Comment = Comment;
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
exports.PendingUserUpdate = PendingUserUpdate;
exports.ExplanationTag = ExplanationTag;
exports.Question = Question;
exports.Notification = Notification;
