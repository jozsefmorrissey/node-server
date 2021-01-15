
const Crud = require('./database/mySqlWrapper').Crud;
const crud = Crud.instance('CE');

const { QuestionNotification, CommentNotification, ExplanationNotification,
        ExplanationConnections, CommentConnections, Site } =
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
  const id = explanation.id;
  const ignoreId = explanation.author.id;
  console.log('notifyExpl');
  function insertNotifications(connectionArr) {
    console.log(connectionArr);
    const notifications = {};
    const notified = {};
    connectionArr.forEach((connection) => {
      if (notNotified(connection, notifications, ignoreId, 'commentorId')) {
        const commentorId = connection.commentorId;
        const siteId = connection.commentorSiteId;
        crud.insert(new ExplanationNotification(commetorId, siteId, id))
      }
      console.log('cni:\n', connection, '\n\n', notifications, '\n\n', ignoreId)
      console.log('asker', connection.askerId)
      if (notNotified(connection, notifications, ignoreId, 'askerId')) {
        const askerId = connection.askerId;
        console.log('notNotified', askerId);
        const siteId = connection.questionSiteId;
        const questionId = connection.questionId;
        crud.insert(new QuestionNotification(askerId, siteId, questionId, id))
      }
    });
  }

  crud.select(new ExplanationConnections(id, undefined), insertNotifications,
        (err) => console.log(err));
}

function notifyComment (comment) {
  const id = comment.id;
  const ignoreId = comment.author.id;
  console.log('notifying comment')
  function insertNotifications(connectionArr) {
    console.log('connarr', connectionArr)
    let notifications = {};
    connectionArr.forEach((connection) => {
      const siteId = connection.siteId;
      if (notNotified(connection, notifications, ignoreId, 'explanationAuthorId')) {
        const userId = connection.explanationAuthorId;
        crud.insert(new CommentNotification(userId, new Site(siteId), id))
      }
      if (notNotified(connection, notifications, ignoreId, 'childCommentorId')) {
        const userId = connection.childCommentorId;
        crud.insert(new CommentNotification(userId, new Site(siteId), id))
      }
      if (notNotified(connection, notifications, ignoreId, 'siblingCommentorId')) {
        const userId = connection.siblingCommentorId;
        crud.insert(new CommentNotification(userId, new Site(siteId), id))
      }
      if (notNotified(connection, notifications, ignoreId, 'parentCommentorId')) {
        const userId = connection.parentCommentorId;
        crud.insert(new CommentNotification(userId, new Site(siteId), id))
      }
    });
  }

  const commentConnect = new CommentConnections(id - 1, undefined);
  console.log(commentConnect);
  crud.select(commentConnect, insertNotifications);
}

function Notify(dataObject, success) {
  console.log('notifying', dataObject.constructor.name, dataObject.id)
  switch (dataObject.constructor.name) {
    case 'Explanation':
      console.log('call expl')
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
