
const Crud = require('./database/mySqlWrapper').Crud;
const crud = Crud.instance('CE');

const { QuestionNotification, CommentNotification, ExplanationNotification,
        ExplanationConnections, CommentConnections, Site, Explanation,
        ExplanationTagFollower, QuestionTagFollower, CommentTagFollower,
        Follower, GroupFollower, Question, ExplanationComment,
        QuestionComment, ExplanationCommentConnections,
        QuestionCommentConnections, QuestionConnections,
        ExplanationCommentNotification, QuestionCommentNotification } =
                require('./database/objects');

function notifyAll(notifyFunc, userIdFields, ignoreUserId) {
  return function (connections) {
    let connectionMap = [];
    for (let index = 0; index < connections.length; index += 1) {
      for (let uIndex = 0; uIndex < userIdFields.length; uIndex += 1) {
        const conn = connections[index];
        const field = userIdFields[uIndex];
        console.log(field.name);
        const userId = conn.$d().getValueFunc(field.name)();
        if (connectionMap[userId] === undefined && userId !== ignoreUserId) {
          connectionMap[userId] = notifyFunc(userId);
        }
      }
    }
    crud.insert(connectionMap);
  }
}

function notifyConfiguration(dataObj) {
  let connectionObj, notificationFunc, ignoreUserId;
  switch (dataObj.constructor) {
    case Explanation:
      ignoreUserId = dataObj.author.id;
      connectionObj = new ExplanationConnections(dataObj.id);
      notificationFunc = (userId) => new ExplanationNotification(userId, dataObj);
      break;
    case Question:
      ignoreUserId = dataObj.asker.id;
      connectionObj = new QuestionConnections(dataObj.id);
      notificationFunc = (userId) => new QuestionNotification(userId, dataObj);
      break;
    case ExplanationComment:
      ignoreUserId = dataObj.author.id;
      connectionObj = new ExplanationCommentConnections(dataObj.id);
      notificationFunc = (userId) => new ExplanationCommentNotification(userId, dataObj);
      break;
    case QuestionComment:
      ignoreUserId = dataObj.author.id;
      connectionObj = new QuestionCommentConnections(dataObj.id);
      notificationFunc = (userId) => new QuestionCommentNotification(userId, dataObj);
  }
  return {connectionObj, notificationFunc, ignoreUserId};
}

function Notify(dataObj, success) {
  const notifyConfig = notifyConfiguration(dataObj);
  const connObj = notifyConfig.connectionObj;
  if (notifyConfig.connectionObj !== undefined) {
    const notifyFunc = notifyConfig.notificationFunc;
    const userIdFields = connObj.$d().getFields('userId');
    crud.select(connObj, notifyAll(notifyFunc, userIdFields, notifyConfig.ignoreUserId));
  }
}

exports.Notify = Notify;
