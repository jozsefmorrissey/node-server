
const Crud = require('./database/mySqlWrapper').Crud;
const crud = Crud.instance('CE');

const { Notification, ExplanationConnections, CommentConnections } =
                require('./database/objects');

const TYPES = {
  EXPLANATION: 0,
  QUESTION: 1,
  COMMENT: 2
}

function insert(notifications) {
  notifications = Object.values(notifications);
  if (notifications.length > 0) {
    crud.insert(notifications, undefined, () =>
            console.error('Notification Insert failed:\n\t', notifications));
  } else {
    console.log('no nots...')
  }
}

function addNotification(connection, ignoreId, objList, targetId, type, refType,
                            userIdAttr, siteIdAttr, refIdAttr) {
  const userId = connection[userIdAttr];
  const siteId = connection[siteIdAttr];
  const refId = connection[refIdAttr];
  console.log('uid', userId)
  if (userId && userId !== ignoreId) {
    const uniqueId = [targetId, type, userId, siteId, refId].join(':');
    console.log('uniqId', uniqueId);
    if (objList[uniqueId] === undefined) {
      objList[uniqueId] = new Notification(userId, targetId, siteId, type, refType, refId);
    }
  }
}

function notifyExpl (explanation) {
  const id = explanation.id;
  const ignoreId = explanation.author.id;
  function insertNotifications(connectionArr) {
    const notifications = {};
    connectionArr.forEach((connection) => {
      addNotification(connection, ignoreId, notifications, id, TYPES.EXPLANATION,
            TYPES.COMMENT, 'commentorId', 'commentorSiteId');
      addNotification(connection, ignoreId, notifications, id, TYPES.EXPLANATION,
            TYPES.QUESTION, 'askerId', 'questionSiteId', 'questionId');
    });
    insert(notifications);
  }

  crud.select(new ExplanationConnections(id, undefined), insertNotifications);
}

function notifyComment (comment) {
  const id = comment.id;
  const ignoreId = comment.author.id;
  console.log('notifying comment')
  function insertNotifications(connectionArr) {
    console.log('connarr', connectionArr)
    let notifications = {};
    connectionArr.forEach((connection) => {
      addNotification(connection, ignoreId, notifications, id, TYPES.COMMENT,
            TYPES.EXPLANATION, 'explanationAuthorId', 'siteId');
      addNotification(connection, ignoreId, notifications, id, TYPES.COMMENT,
            TYPES.COMMENT, 'childCommentorId', 'siteId');
      addNotification(connection, ignoreId, notifications, id, TYPES.COMMENT,
            TYPES.COMMENT, 'siblingCommentorId', 'siteId');
      addNotification(connection, ignoreId, notifications, id, TYPES.COMMENT,
            TYPES.COMMENT, 'parentCommentorId', 'siteId');
    });
    insert(notifications);
  }

  const commentConnect = new CommentConnections(id - 1, undefined);
  console.log(commentConnect);
  crud.select(commentConnect, insertNotifications);
}

function Notify(dataObject, success) {
  console.log('notifying', dataObject.constructor.name, dataObject.id)
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
