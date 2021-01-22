
const Crud = require('./database/mySqlWrapper').Crud;
const crud = Crud.instance('CE');

const { QuestionNotification, CommentNotification, ExplanationNotification,
        ExplanationConnections, CommentConnections, Site, Explanation,
        Question } =
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

function Notify(dataObject, success) {
  switch (dataObject.constructor.name) {
    case 'Explanation':
      notifyExpl(dataObject);
      success(dataObject);
      break;
    case 'Comment':
      notifyComment(dataObject);
      success(dataObject);
      break;
    case 'Number':
      crud.select(new Notification(dataObject, undefined), success);
      break;
    default:
    console.error(`Unknown notification Object: '${dataObject.constructor.name}'`);
  }
}

exports.Notify = Notify;
