
const { Context } = require('./context');
const Crud = require('./database/mySqlWrapper').Crud;
const crud = Crud.instance('CE');

const { SqlOperationFailed } = require('./exceptions.js');

function throwSqlErrorFunc(type, dataObject) {
  return function (error) {
    console.error(error);
    throw new SqlOperationFailed(type, dataObject.constructor.name);
  }
}
exports.throwSqlErrorFunc = throwSqlErrorFunc;

function retrieveOrInsert(dataObject, success) {
  const context = Context.fromFunc(success);
  function s(found) {success(found)}
  context.callbackTree(crud.selectOne, 'retrieveOrInsertDataObject', dataObject)
    .success(s)
    .fail(crud.insertGet, 'insert', dataObject)
    .success('insert', s)
    .fail('insert', throwSqlErrorFunc('insertGet', dataObject))
    .execute();
}
exports.retrieveOrInsert = retrieveOrInsert;

function retrieve(dataObject, success, fail) {
  const context = Context.fromFunc(success);
  function s(found) {success(found)}
  context.callbackTree(crud.selectOne, 'retrieveDataObject', dataObject)
    .success(s)
    .fail(fail)
    .execute();
}
exports.retrieve = retrieve;

const siteUrlReg = /^(http(s|):\/\/)(.*?\/)((((\#|\?)([^#]*))(((\#)(.*))|)|))$/;
function parseSiteUrl(url) {
  const match = url.match(siteUrlReg);
  if (!match) return [undefined, url];
  return [match[1], match[3], match[6], match[9]];
}
exports.parseSiteUrl = parseSiteUrl;

function getIp(ip, success) {
  retrieveOrInsert(new Ip(ip), success);
}
exports.getIp = getIp;

function getUserAgent(userAgent, success) {
  retrieveOrInsert(new UserAgent(userAgent), success);
}
exports.getUserAgent = getUserAgent;

function getWords(words, success) {
  retrieveOrInsert(new Words(words), success);
}
exports.getWords = getWords;

function getSite(url, success) {
  const insertObj = new Site();
  const breakdown = parseSiteUrl(url);
  let count = 0;
  let insertSite = false;
  const setValue = (name) => (sitePart) => {
    insertObj.$d().setValueFunc(name)(sitePart.id);
    if (++count === 4)  {
      if (insertSite) {
        crud.insertGet(insertObj, success, sqlErrFunc('insert', insertObj));
      } else {
        retrieveOrInsert(insertObj, success);
      }
    }
  };
  const insert = (sitePart, attr) => () => {
    insertSite = true;
    crud.insertGet(sitePart, setValue(attr), sqlErrorFunc(insert, sitePart))
  };
  const get = (index, attr) => {
    const text = breakdown[index];
    const sp = new SiteParts(text);
    if (text) {
      retrieveOrInsert(sp, setValue(attr), insert(sp, attr));
    } else {
      setValue(attr)({});
    }
  }

  get(0, 'one_id');
  get(1, 'two_id');
  get(2, 'three_id');
  get(3, 'four_id');
}
exports.getSite = getSite;

function retrieveSite(url, success, fail) {
  retrieve(new Site(parseSiteUrl(url)[1]), success, fail);
}
exports.retrieveSite = retrieveSite;
