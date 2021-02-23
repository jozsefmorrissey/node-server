
const Crud = require('./database/mySqlWrapper').Crud;
const crud = Crud.instance('CE');

const { QuestionNotification, CommentNotification, ExplanationNotification,
        ExplanationConnections, CommentConnections, Site, Explanation,
        ExplanationTagFollower, QuestionTagFollower, CommentTagFollower,
        Follower, GroupFollower, Question } =
                require('./database/objects');

function notNotified(connection, notified, ignoreId, idAttr) {
  const id = connection[idAttr];
  if (id && id !== ignoreId) {
    if (notified[id]) {
      return false;
    }
    notified[id] = true;
    return true;
  }
  return false;
}

function notifyExpl (explanation) {
  const ignoreId = explanation.author.id;
  function insertNotifications(connectionArr) {
    const notifications = {};
    const notified = {};
    connectionArr.forEach((connection) => {
      if (notNotified(connection, notifications, ignoreId, 'commentorId')) {
        const commentorId = connection.commentorId;
        const site = new Site(connection.commentSiteId);
        crud.insert(new ExplanationNotification(commentorId, site, explanation))
      }
      if (notNotified(connection, notifications, ignoreId, 'askerId')) {
        const askerId = connection.askerId;
        const question = new Question(connection.questionId);
        const site = new Site(connection.questionSiteId);
        crud.insert(new QuestionNotification(askerId, site, explanation, question))
      }
    });
  }

  crud.select(new ExplanationConnections(explanation.id, undefined), insertNotifications,
        (err) => console.error(err));
}

function notifyComment (comment) {
  const id = comment.id;
  const ignoreId = comment.author.id;
  const explId = comment.explId;
  function insertNotifications(connectionArr) {
    let notifications = {};
    connectionArr.forEach((connection) => {
      const site = new Site(connection.siteId);
      const explanation = new Explanation(connection.explanationId);
      function insertComment(userId) {
        crud.insert(new CommentNotification(userId, site, explanation, comment));
      }
      if (notNotified(connection, notifications, ignoreId, 'explanationAuthorId')) {
        insertComment(connection.explanationAuthorId);
      }
      if (notNotified(connection, notifications, ignoreId, 'childCommentorId')) {
        insertComment(connection.childCommentorId);
      }
      if (notNotified(connection, notifications, ignoreId, 'siblingCommentorId')) {
        insertComment(connection.siblingCommentorId);
      }
      if (notNotified(connection, notifications, ignoreId, 'parentCommentorId')) {
        insertComment(connection.parentCommentorId);
      }
    });
  }

  const commentConnect = new CommentConnections(id, undefined);
  crud.select(commentConnect, insertNotifications);
}

function notifyCommentFollowers(comment) {
  function notifyFollowers(followers) {
    for (let index = 0; index < followers.length; index += 1) {
      const uId = followers[index].userId;
      const site = new Site(comment.siteId);
      const expl = new Explanation(comment.explanationId);
      const note = new CommentNotification(uId, site, expl, comment);
      crud.insert(note);
    }
  }

  crud.select(new CommentTagFollower(undefined, comment.tags));
}

function notifyExplanationFollowers(expl) {
  function notifyFollowers(followers) {
    for (let index = 0; index < followers.length; index += 1) {
      const uId = followers[index].userId;
      const site = new Site(expl.siteId);
      const note = new ExplanationNotification(uId, site, expl);
      crud.insert(note);
    }
  }

  crud.select(new ExplanationTagFollower(undefined, expl.tags));
}

function notifyQuestionFollowers(question) {
  function notifyFollowers(followers) {
    for (let index = 0; index < followers.length; index += 1) {
      const uId = followers[index].userId;
      const site = new Site(question.siteId);
      const note = new QuestionNotification(uId, site, question);
      crud.insert(note);
    }
  }

  crud.select(new QuestionTagFollower(undefined, question.tags));
}


function cloneNotifyUser(list, userIdAttr, notification) {
  for (let index = 0; index < list.length; index += 1) {
    const userId = list[index][userIdAttr];
    const userNote = notification.$d().clone();
    userNote.setUserId(userId);
    crud.insert(userNote);
  }
}

function notifyGroupFollowers(dataObj, notification) {
  if (dataObj.group && dataObj.group.id) {
    cloneNotifyUser([dataObj.group.creator], 'id', notification);
    const notify = (followers) => cloneNotifyUser(followers, 'userId', notification);
    crud.select(new GroupFollower(undefined, dataObj.group.id), notify);
  }
}

function notifyFollowers(authorId, notification) {
  console.log('\nhere\n',notification)
  const notify = (followers) => cloneNotifyUser(followers, 'userId', notification);
  crud.select(new Follower(undefined, authorId), notify);
}

function Notify(dataObject, success) {
  let note, authorId, expl, site;
  switch (dataObject.constructor.name) {
    case 'Explanation':
      notifyExpl(dataObject);
      notifyExplanationFollowers(dataObject);
      expl = dataObject;
      site = new Site(expl.siteId);
      note = new ExplanationNotification(undefined, site, expl);
      authorId = expl.author.id;
      break;
    case 'Comment':
      notifyComment(dataObject);
      notifyCommentFollowers(dataObject);
      const comment = dataObject;
      expl = new Explanation(comment.explanationId);
      site = new Site(comment.siteId);
      note = new CommentNotification(undefined, site, expl, comment);
      authorId = comment.author.id;
      break;
    case 'Question':
      notifyQuestionFollowers(dataObject);
      const question = dataObject;
      site = new Site(question.siteId);
      note = new QuestionNotification(undefined, site, question);
      authorId = question.asker.id;
      break;
    case 'Number':
      crud.select(new Notification(dataObject, undefined), success);
      break;
    default:
    console.error(`Unknown notification Object: '${dataObject.constructor.name}'`);
  }
  notifyGroupFollowers(dataObject, note);
  notifyFollowers(authorId, note);
}

exports.Notify = Notify;
