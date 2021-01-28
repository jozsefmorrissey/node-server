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
    this.$d().addField('lastUpdate');
    this.$d().addField('id');
    this.$d().init(arguments);
  }
}
new Comment();

class Explanation extends DataObject {
  constructor() {
    super();
    this.$d().setTableNames('EXPLANATION_DETAIL')
    this.$d().addField('content');
    this.$d().addField('words', {class: Words, relation: 'manyToOne', merge: 'value'});
    this.$d().addField('searchWords', {class: Words, relation: 'manyToOne', merge: 'value'});
    this.$d().addField('author', {class: User, relation: 'manyToOne'});
    this.$d().addField('comments', {class: Comment, relation: 'oneToMany'});
    this.$d().addField('lastUpdate');
    this.$d().addField('id');
    this.$d().addField('likes', {readOnly: true});
    this.$d().addField('dislikes', {readOnly: true});
    this.$d().init(arguments);
  }
}
new Explanation();

class Group extends DataObject {
  constructor() {
    super();
    this.$d().addField('name');
    this.$d().addField('discription');
    this.$d().addField('creatorId', {class: User, relation: 'manyToOne'});
    this.$d().addField('contributors', {class:  GroupContributor, relation: 'OneToMany'});
    this.$d().addField('id');
    this.$d().init(arguments);
  }
}
new Group();

class GroupContributor extends DataObject {
  constructor() {
    super();
    this.$d().addField('user', {class: User, relation: 'manyToOne'});
    this.$d().addField('admin');
    this.$d().addField('groupId');
    this.$d().addField('id');
    this.$d().init(arguments);
  }
}
new GroupContributor();

class GroupOpinion extends DataObject {
  constructor() {
    super();
    this.$d().addField('favorable');
    this.$d().addField('explanationId');
    this.$d().addField('groupId');
    this.$d().addField('userId');
    this.$d().addField('id', {writeOnly: true});
    this.$d().init(arguments);
  }
}

class GroupExplanation extends DataObject {
  constructor() {
    super();
    this.$d().setTableNames('GROUP_EXPLANATION_DETAIL')
    this.$d().addField('groupId');
    this.$d().addField('explanation', {class: Explanation, relation: 'manyToOne'});
    this.$d().addField('id');
    this.$d().addField('likes', {readOnly: true});
    this.$d().addField('dislikes', {readOnly: true});
    this.$d().init(arguments);
  }
}
new GroupExplanation();

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

class SiteParts extends DataObject {
  constructor(value) {
    super();
    this.$d().addField('value');
    this.$d().addField('id');
    this.$d().init(arguments);
  }
}
new SiteParts();

class Site extends DataObject {
  constructor(id, url) {
    super();
    this.$d().setTableNames('SITE_DETAIL')
    this.$d().addField('heart', {readOnly: true});
    this.$d().addField('url', {readOnly: true});
    this.$d().addField('one_id');
    this.$d().addField('two_id');
    this.$d().addField('three_id');
    this.$d().addField('four_id');
    this.$d().addField('id');
    this.$d().init(arguments);
  }
}
new Site();

class QuestionOpinion extends DataObject {
    constructor() {
      this.$d().addField('questionId');
      this.$d().addField('unclear');
      this.$d().addField('answered');
      this.$d().addField('userId');
      this.$d().addField('id');
    }
}

class QuestionComment extends DataObject {
  constructor() {
    this.$d().addField('value');
    this.$d().addField('questionId');
    this.$d().addField('commentId');
    this.$d().addField('authorId');
    this.$d().addField('lastUpdate');
    this.$d().addField('id');
  }
}

class Question extends DataObject {
  constructor() {
    super();
    this.$d().addField('words', {class: Words, relation: 'manyToOne', merge: 'value'});
    this.$d().addField('elaboration');
    this.$d().addField('siteId');
    this.$d().addField('asker', {class: User, relation: 'manyToOne'});
    this.$d().addField('lastUpdate');
    this.$d().addField('unclearVotes');
    this.$d().addField('answeredVotes');
    this.$d().addField('id');
    this.$d().init(arguments);
  }
}
new Question();

class Notification extends DataObject {
  constructor() {
    super();
    this.$d().addField('userId');
    this.$d().addField('site', {class: Site, relation: 'manyToOne'});
    this.$d().addField('seen', {default: true});
    this.$d().addField('poppedup', {default: true});
    this.$d().addField('id', {default: true});
    this.$d().addField('explanation', {class: Explanation, relation: 'manyToOne'});
  }
}
new Notification();

class ExplanationNotification extends Notification {
  constructor() {
    super();
    this.type = 'Explanation';
    this.$d().init(arguments);
  }
}
new ExplanationNotification();

class CommentNotification extends Notification {
  constructor() {
    super();
    this.type = 'Comment';
    this.$d().addField('comment', {class: Comment, relation: 'manyToOne'});
    this.$d().init(arguments);
  }
}
new CommentNotification();

class QuestionNotification extends Notification {
  constructor() {
    super();
    this.type = 'Question';
    this.$d().addField('question', {class: Question, relation: 'manyToOne'});
    this.$d().init(arguments);
  }
}
new QuestionNotification();

class CommentConnections extends DataObject {
  constructor() {
    super();
    this.$d().addField('commentId', {key: true});
    this.$d().addField('siteId', {key: true});
    this.$d().addField('explanationAuthorId', {key: true});
    this.$d().addField('explanationId', {key: true});
    this.$d().addField('childCommentorId', {key: true});
    this.$d().addField('siblingCommentorId', {key: true});
    this.$d().addField('parentCommentorId', {key: true});
    this.$d().init(arguments);
  }
}
new CommentConnections();

class ExplanationConnections extends DataObject {
  constructor() {
    super();
    this.$d().addField('explanationId', {key: true});
    this.$d().addField('commentorId', {key: true});
    this.$d().addField('commentSiteId', {key: true});
    this.$d().addField('askerId', {key: true});
    this.$d().addField('questionId', {key: true});
    this.$d().addField('questionSiteId', {key: true});
    this.$d().init(arguments);
  }
}
new ExplanationConnections();

exports.Ip = Ip;
exports.UserAgent = UserAgent;
exports.Comment = Comment;
exports.Credential = Credential;
exports.User = User;
exports.Explanation = Explanation;
exports.SiteParts = SiteParts;
exports.Site = Site;
exports.Opinion = Opinion;
exports.Site = Site;
exports.SiteExplanation = SiteExplanation;
exports.DataObject = DataObject;
exports.Words = Words;
exports.Tag = Tag;
exports.PendingUserUpdate = PendingUserUpdate;
exports.Question = Question;
exports.Notification = Notification;
exports.CommentConnections = CommentConnections;
exports.ExplanationConnections = ExplanationConnections;
exports.QuestionNotification = QuestionNotification;
exports.CommentNotification = CommentNotification;
exports.ExplanationNotification = ExplanationNotification;
