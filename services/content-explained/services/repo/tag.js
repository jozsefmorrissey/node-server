
const Crud = require('../database/mySqlWrapper').Crud;

const crud = Crud.instance('CE');
const utils = require('../dataUtils');
const { Notify } = require('../notification');
const { Context } = require('../context');
const { InvalidDataFormat } =
        require('../exceptions.js');
const { Tag, ExplanationTag, GroupTag, QuestionTag, ExplanationComment, QuestionComment,
        Explanation, Group, Question, QuestionCommentTag, ExplanationCommentTag } =
        require('../database/objects');

exports.list = (success, fail) => {
  crud.select(new Tag(), success, fail);
}

function typeSpecificValues(dataObj, tagStr) {
  tagStr = tagStr || '';
  let getInstance;
  console.log('aaagrs:', arguments)
  if (dataObj instanceof ExplanationComment) {
    tagStr += ' ' + dataObj.value;
    getInstance = () => new ExplanationCommentTag(undefined, dataObj.id);
  } else if (dataObj instanceof QuestionComment) {
    tagStr += ' ' + dataObj.value;
    getInstance = () => new QuestionCommentTag(undefined, dataObj.id);
  } else if (dataObj instanceof Explanation) {
    tagStr += ' ' + dataObj.content;
    getInstance = () => new ExplanationTag(undefined, dataObj.id);
  } else if (dataObj instanceof Group) {
    tagStr += ' ' + dataObj.description;
    getInstance = () => new GroupTag(undefined, dataObj.id);
  } else if (dataObj instanceof Question) {
    tagStr += ' ' + dataObj.elaboration;
    getInstance = () => new QuestionTag(undefined, dataObj.id);
  } else {
    throw new Error('Unknown Tag Type');
  }

  return { tagStr, getInstance };
}

// TODO: clean - consolidate into one sql call.
function insertReference(countObj, referenceTag, dataObj) {
  const setFunc = dataObj.$d().setValueFunc('tags');
  let returned = 0;
  return function (data) {
    referenceTag.setTag(new Tag(data.id));
    crud.insert(referenceTag);
    if (++returned === countObj.count) {
      Notify(dataObj);
    }
  }
}

exports.updateObj = (dataObj, tagStr) => {
  const tagInserted = {};
  const tsv = typeSpecificValues(dataObj, tagStr);
  crud.delete(tsv.getInstance());
  const matches = tsv.tagStr.match(/#[^#^\s]*/g);
  if (matches) {
    const countObj = {count: matches.length};
    const tagsSetFunc = dataObj.$d().setValueFunc('tags');
    tagsSetFunc([]);
    const success = insertReference(countObj, tsv.getInstance(), dataObj);
    for (let index = 0; index < matches.length; index += 1) {
      const tagObj = new Tag(matches[index].substr(1));
      tagsSetFunc(tagObj.value, true);
      if (!tagInserted[tagObj.value]) {
        utils.retrieveOrInsert(tagObj, success, (err) => console.log('common:', err));
        tagInserted[tagObj.value] = true;
      } else {
        countObj.count--;
      }
    }
  }
}

exports.update = (strOarr, tagStr) => {
  if (Array.isArray(strOarr)) {
    strOarr = strOarr.join(' ');
  }
  const matches = strOarr.match(/#[^\s]*/g);
  matches.forEach((tag) => {
    crud.insert(new Tag(tag.substr(1)));
  });
}
