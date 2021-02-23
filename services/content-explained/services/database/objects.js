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

class AccessibleGroup extends DataObject {
  constructor() {
    super();
    this.$d().addField('userId');
    this.$d().addField('name');
    this.$d().addField('contributorId');
    this.$d().addField('level');
    this.$d().addField('description');
    this.$d().addField('image');
    this.$d().addField('id');
    this.$d().init(arguments);
  }
}
new AccessibleGroup();

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

class UserName extends DataObject {
  constructor() {
    super();
    this.$d().setTableNames('USER', 'USER')
    this.$d().addField('username');
    this.$d().addField('id');
    this.$d().init(arguments);
  }
}
new UserName();

class ConciseUser extends DataObject {
  constructor() {
    super();
    this.$d().setTableNames('USER_DETAIL')
    this.$d().addField('username');
    this.$d().addField('id');
    this.$d().addField('likes', {readOnly: true});
    this.$d().addField('dislikes', {readOnly: true});
    this.$d().init(arguments);
  }
}
new ConciseUser();

class User extends DataObject {
  constructor() {
    super();
    this.$d().setTableNames('USER_DETAIL')
    this.$d().addField('username');
    this.$d().addField('email', {writeOnly: true});
    this.$d().addField('id');
    this.$d().addField('groups', {class: AccessibleGroup, relation: 'oneToMany'});
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

class GroupContributor extends DataObject {
  constructor() {
    super();
    this.$d().addField('user', {class: ConciseUser, relation: 'manyToOne', exclude: ['groups']});
    this.$d().addField('groupId');
    this.$d().addField('emailNotify');
    this.$d().addField('inAppNotify');
    this.$d().addField('level');
    this.$d().addField('id');
    this.$d().init(arguments);
  }
}
new GroupContributor();

class GroupTag extends DataObject {
  constructor() {
    super();
    this.$d().addField('tag', {class: Tag, relation: 'manyToOne', merge: 'value'});
    this.$d().addField('referenceId');
    this.$d().addField('id');
    this.$d().init(arguments);
  }
}
new GroupTag();

class Group extends DataObject {
  constructor() {
    super();
    this.$d().setTableNames('GROUPING', 'GROUPING');
    this.$d().addField('name');
    this.$d().addField('description');
    this.$d().addField('adminLevel');
    this.$d().addField('image');
    this.$d().addField('creator', {class: ConciseUser, relation: 'manyToOne'});
    this.$d().addField('emailNotify');
    this.$d().addField('inAppNotify');
    this.$d().addField('contributors', {class:  GroupContributor, relation: 'OneToMany'});
    this.$d().addField('tags', {map: {id: 'REFERENCE_ID'}, class: GroupTag, relation: 'OneToMany', readOnly: true, merge: 'tag'});
    this.$d().addField('id');
    this.$d().init(arguments);
  }
}
new Group();

class PendingUserUpdate extends DataObject {
  constructor() {
    super();
    this.$d().addField('updateSecret');
    this.$d().addField('username');
    this.$d().addField('email');
    this.$d().addField('user', {class: ConciseUser, relation: 'manyToOne'});
    this.$d().addField('id');
    this.$d().init(arguments);
  }
}
new PendingUserUpdate();

class Words extends DataObject {
  constructor() {
    super();
    this.$d().addField('value');
    this.$d().addField('id');
    this.$d().init(arguments);
  }
}
new Words();

class CommentTag extends DataObject {
  constructor() {
    super();
    this.$d().addField('tag', {class: Tag, relation: 'manyToOne', merge: 'value'});
    this.$d().addField('referenceId');
    this.$d().addField('id');
    this.$d().init(arguments);
  }
}
new CommentTag();

class CommentTagFollower extends DataObject {
  constructor() {
    super();
    this.$d().addField('userId');
    this.$d().addField('tagId');
    this.$d().addField('id');
    this.$d().init(arguments);
  }
}
new CommentTagFollower();

class OpenSite extends DataObject {
  constructor() {
    super();
    this.$d().addField('url');
    this.$d().addField('userId');
    this.$d().addField('id');
    this.$d().init(arguments);
  }
}
new OpenSite();


class Comment extends DataObject {
  constructor() {
    super();
    this.$d().addField('value');
    this.$d().addField('explanationId');
    this.$d().addField('siteId');
    this.$d().addField('commentId');
    this.$d().addField('group', {class: Group, exclude: ['creator', 'contributors', 'tags'], relation: 'manyToOne'});
    this.$d().addField('author', {class: ConciseUser, relation: 'manyToOne'});
    this.$d().addField('lastUpdate');
    this.$d().addField('tags', {map: {id: 'REFERENCE_ID'}, class: CommentTag, relation: 'OneToMany', readOnly: true, merge: 'tag'});
    this.$d().addField('id');
    this.$d().init(arguments);
  }
}
new Comment();

class ExplanationTag extends DataObject {
  constructor() {
    super();
    this.$d().addField('tag', {class: Tag, relation: 'manyToOne', merge: 'value'});
    this.$d().addField('referenceId');
    this.$d().addField('id');
    this.$d().init(arguments);
  }
}
new ExplanationTag();

class ExplanationTagFollower extends DataObject {
  constructor() {
    super();
    this.$d().addField('userId');
    this.$d().addField('tagId');
    this.$d().addField('id');
    this.$d().init(arguments);
  }
}
new ExplanationTagFollower();

class Following extends DataObject {
  constructor() {
    super();
    this.$d().addField('userId');
    this.$d().addField('target', {class: ConciseUser, relation: 'manyToOne', key: true});
    this.$d().addField('group', {class: Group, relation: 'manyToOne', key: true,
                                  exclude: ['creator', 'contributors', 'tags', 'adminLevel']});
    this.$d().addField('questionTag', {class: Tag, relation: 'manyToOne', key: true});
    this.$d().addField('explanationTag', {class: Tag, relation: 'manyToOne', key: true});
    this.$d().addField('commentTag', {class: Tag, relation: 'manyToOne', key: true});
    this.$d().init(arguments);
  }
}
new Following();

class Explanation extends DataObject {
  constructor() {
    super();
    this.$d().setTableNames('EXPLANATION_DETAIL')
    this.$d().addField('content');
    this.$d().addField('words', {class: Words, relation: 'manyToOne', merge: 'value'});
    this.$d().addField('searchWords', {class: Words, relation: 'manyToOne', merge: 'value'});
    this.$d().addField('author', {class: ConciseUser, relation: 'manyToOne'});
    this.$d().addField('groupAuthor', {class: Group, exclude: ['creator', 'contributors', 'tags'], relation: 'manyToOne'});
    this.$d().addField('siteId');
    this.$d().addField('comments', {class: Comment, relation: 'oneToMany'});
    this.$d().addField('lastUpdate');
    this.$d().addField('id');
    this.$d().addField('tags', {class: ExplanationTag, map: {id: 'REFERENCE_ID'}, relation: 'OneToMany', readOnly: true, merge: 'tag'});
    this.$d().addField('likes', {readOnly: true});
    this.$d().addField('dislikes', {readOnly: true});
    this.$d().init(arguments);
  }
}
new Explanation();

class GroupedOpinion extends DataObject {
  constructor() {
    super();
    this.$d().addField('explanationId');
    this.$d().addField('groupId');
    this.$d().addField('lyke');
    this.$d().addField('dislike');
    this.$d().addField('userId');
    this.$d().addField('id', {writeOnly: true});
    this.$d().init(arguments);
  }
}
new GroupedOpinion();

class GroupedExplanation extends DataObject {
  constructor() {
    super();
    this.$d().setTableNames('GROUPED_EXPLANATION_DETAIL')
    this.$d().addField('groupId', {key: true});
    this.$d().addField('explanation', {key: true, class: Explanation, relation: 'manyToOne'});
    this.$d().addField('likes', {readOnly: true});
    this.$d().addField('dislikes', {readOnly: true});
    this.$d().init(arguments);
  }
}
new GroupedExplanation();

class GroupFollower extends DataObject {
  constructor() {
    super();
    this.$d().addField('userId');
    this.$d().addField('groupId');
    this.$d().addField('id');
    this.$d().init(arguments);
  }
}
new GroupFollower();

class Follower extends DataObject {
  constructor() {
    super();
    this.$d().addField('userId');
    this.$d().addField('targetId');
    this.$d().addField('id');
    this.$d().init(arguments);
  }
}
new Follower();

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
      super();
      this.$d().addField('questionId');
      this.$d().addField('userId');
      this.$d().addField('unclear');
      this.$d().addField('answered');
      this.$d().addField('id');
      this.$d().init(arguments);
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

class QuestionTag extends DataObject {
  constructor() {
    super();
    this.$d().addField('tag', {class: Tag, relation: 'manyToOne', merge: 'value'});
    this.$d().addField('referenceId');
    this.$d().addField('id');
    this.$d().init(arguments);
  }
}
new QuestionTag();

class QuestionTagFollower extends DataObject {
  constructor() {
    super();
    this.$d().addField('userId');
    this.$d().addField('tagId');
    this.$d().addField('id');
    this.$d().init(arguments);
  }
}
new QuestionTagFollower();

class Question extends DataObject {
  constructor() {
    super();
    this.$d().addField('elaboration');
    this.$d().addField('words', {class: Words, relation: 'manyToOne', merge: 'value'});
    this.$d().addField('siteId');
    this.$d().addField('asker', {class: ConciseUser, relation: 'manyToOne'});
    this.$d().addField('groupAsker', {class: Group, exclude: ['creator', 'contributors', 'tags'], relation: 'manyToOne'});
    this.$d().addField('lastUpdate');
    this.$d().addField('unclearVotes');
    this.$d().addField('answeredVotes');
    this.$d().addField('tags', {class: QuestionTag, map: {id: 'REFERENCE_ID'}, relation: 'OneToMany', readOnly: true, merge: 'tag'});
    this.$d().addField('id');
    this.$d().init(arguments);
  }
}
new Question();

class NotificationType extends DataObject {
  constructor() {
    super();
    this.$d().addField('id');
    this.$d().addField('value');
    this.$d().init(arguments);
  }
}

class Notification extends DataObject {
  constructor() {
    super();
    this.$d().setTableNames('NOTIFICATION', 'NOTIFICATION')
    this.$d().addField('userId');
    this.$d().addField('site', {class: Site, relation: 'manyToOne'});
    this.$d().addField('explanation', {
      class: Explanation, relation: 'manyToOne',
      exclude: ['comments', 'tags']
    });
    this.$d().addField('comment', {class: Comment, relation: 'manyToOne', exclude: ['tags']});
    this.$d().addField('question', {class: Question, relation: 'manyToOne', exclude: ['tags']});
    this.$d().addField('type', {class: NotificationType, relation: 'manyToOne', merge: 'value'});
    this.$d().addField('seen', {init: false});
    this.$d().addField('at', {init: false});
    this.$d().addField('poppedup', {init: false});
    this.$d().addField('id');
    this.$d().init(arguments);
  }
}
new Notification();

class ExplanationNotification extends Notification {
  constructor(userId, site, explanation) {
    super(userId, site, explanation);
    this.setType(new NotificationType(2, 'Explanation'))
  }
}
new ExplanationNotification();

class CommentNotification extends Notification {
  constructor(userId, site, explanation, comment) {
    super(userId, site, explanation, comment);
    this.setType(new NotificationType(1, 'Comment'))
  }
}
new CommentNotification();

class QuestionNotification extends Notification {
  constructor(userId, site, question) {
    super(userId, site, undefined, question);
    this.setType(new NotificationType(3, 'Question'))
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
exports.Credential = Credential;
exports.UserName = UserName;
exports.ConciseUser = ConciseUser;
exports.User = User;
exports.PendingUserUpdate = PendingUserUpdate;
exports.Tag = Tag;
exports.Words = Words;
exports.CommentTag = CommentTag;
exports.CommentTagFollower = CommentTagFollower;
exports.OpenSite = OpenSite;
exports.Comment = Comment;
exports.GroupTag = GroupTag;
exports.AccessibleGroup = AccessibleGroup;
exports.Group = Group;
exports.ExplanationTag = ExplanationTag;
exports.ExplanationTagFollower = ExplanationTagFollower;
exports.Explanation = Explanation;
exports.GroupContributor = GroupContributor;
exports.GroupedOpinion = GroupedOpinion;
exports.GroupedExplanation = GroupedExplanation;
exports.GroupFollower = GroupFollower;
exports.Follower = Follower;
exports.Opinion = Opinion;
exports.SiteExplanation = SiteExplanation;
exports.SiteParts = SiteParts;
exports.Site = Site;
exports.QuestionOpinion = QuestionOpinion;
exports.QuestionComment = QuestionComment;
exports.QuestionTag = QuestionTag;
exports.QuestionTagFollower = QuestionTagFollower;
exports.Question = Question;
exports.Notification = Notification;
exports.ExplanationNotification = ExplanationNotification;
exports.CommentNotification = CommentNotification;
exports.QuestionNotification = QuestionNotification;
exports.CommentConnections = CommentConnections;
exports.ExplanationConnections = ExplanationConnections;
exports.Following = Following;
