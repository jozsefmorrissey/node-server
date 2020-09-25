const testing = require('testing');
const ju = require('../public/js/ju.js').ju;

function stringReplaceWithinSimpleTest(callback) {
  const testStr = '1 2 3 4 5 6 7 9 0';
  let replaced = ju.string.replaceWithin(testStr, /([0-9])/, '"change: $1"', '2 3', '7 9');
  testing.assertEquals(replaced, '1 2 3 "change: 4" "change: 5" "change: 6" 7 9 0');
  testing.success(callback);
}

function stringReplaceWithinSameCharTest(callback) {
  const testStr = '1 2 4 3 4 5 6 7 9 0';
  let replaced = ju.string.replaceWithin(testStr, /([0-9])/, '"change: $1"', '4', '4');
  testing.assertEquals(replaced, '1 2 4 "change: 3" 4 5 6 7 9 0');
  testing.success(callback);
}

function stringReplaceWithinEndpointsTest(callback) {
  const testStr = '1 2 3 4 5 6 7 9 0';
  let replaced = ju.string.replaceWithin(testStr, /([0-9])/, '"change: $1"', '1', '0');
  testing.assertEquals(replaced, '1 "change: 2" "change: 3" "change: 4" "change: 5" "change: 6" "change: 7" "change: 9" 0');
  testing.success(callback);
}

function stringReplaceWithinNoTerminatorTest(callback) {
  const testStr = '1 2 3 4 5 6 7 9 0';
  let replaced = ju.string.replaceWithin(testStr, /([0-9])/, '"change: $1"', '1', '1');
  testing.assertEquals(replaced, '1 2 3 4 5 6 7 9 0');
  testing.success(callback);
}

function stringParseMultilineTest(callback) {
  const multilineJsonStr = `{
    "str1": "
    this
    line
    has
    newlines",
    "str2": "this line does not\n"
  }`

  const multilineJson = ju.string.parseMultiline(multilineJsonStr);
  jsonObj = {
    "str1": "\n    this\n    line\n    has\n    newlines",
    "str2": "this line does not\n"
  };
  testing.assertEquals(multilineJson.str1, jsonObj.str1);
  testing.assertEquals(multilineJson.str2, jsonObj.str2);
  testing.success(callback);
}

function stringParseSeperatorEndCapTest(callback) {
  const endCap = 'key1=val1|key2=val2|key3=val3|';
  const endCapObj = ju.string.parseSeperator(endCap, '|');
  testing.assertEquals(endCapObj.key1, 'val1');
  testing.assertEquals(endCapObj.key2, 'val2');
  testing.assertEquals(endCapObj.key3, 'val3');
  testing.success(callback);
}

function stringParseSeperatorNoEndCapTest(callback) {
  const noEndCap = 'key1=val1|key2=val2|key3=val3';
  const noEndCapObj = ju.string.parseSeperator(noEndCap, '|');
  testing.assertEquals(noEndCapObj.key1, 'val1');
  testing.assertEquals(noEndCapObj.key2, 'val2');
  testing.assertEquals(noEndCapObj.key3, 'val3');
  testing.success(callback);
}

function stringParseSeperatorRegexTest(callback) {
  const regexStr = 'key1=val1123key2=val2456key3=val3789';
  const regexObj = ju.string.parseSeperator(regexStr, '(123|456|789)', true);
  testing.assertEquals(regexObj.key1, 'val1');
  testing.assertEquals(regexObj.key2, 'val2');
  testing.assertEquals(regexObj.key3, 'val3');
  testing.success(callback);
}

function stringParseCookieTest(callback) {
  const cookieStr = 'key1=val1;key2=val2;key3=val3;';
  const cookieObj = ju.string.parseCookie(cookieStr, '(123|456|789)', true);
  testing.assertEquals(cookieObj.key1, 'val1');
  testing.assertEquals(cookieObj.key2, 'val2');
  testing.assertEquals(cookieObj.key3, 'val3');
  testing.success(callback);
}

function arrayGetByKeyRegTest(callback) {
  var array = [
    { id: 'id1'},
    {},
    { id: 'id2'},
    { id: 'sid1'},
    { id: 'id3'}
  ]
  testing.assertEquals(ju.array.getByKeyReg(array, 'id', 'id[0-9]$').length, 4);
  testing.assertEquals(ju.array.getByKeyReg(array, 'id', '^id[0-9]$').length, 3);
  testing.assertEquals(ju.array.getByKeyReg(array, 'id', '^id[0-2]$').length, 2);
  testing.assertEquals(ju.array.getByKeyReg(array, 'id', '^id[0-1]$').length, 1);
  testing.success(callback);
}

function arrayRegexObjTest(callback) {
  var array = [{str: 'val1:val2:val3'}, {str: 'val4:val5:val6'}];
  var regex = /(.*?):(.*?):(.*)/;
  var regArrayObj = ju.array.regexObj(array, 'str', regex, 'first', 'second', 'third');
  testing.assertEquals(regArrayObj[0].first, 'val1');
  testing.assertEquals(regArrayObj[0].second, 'val2');
  testing.assertEquals(regArrayObj[0].third, 'val3');
  testing.assertEquals(regArrayObj[1].first, 'val4');
  testing.assertEquals(regArrayObj[1].second, 'val5');
  testing.assertEquals(regArrayObj[1].third, 'val6');
  testing.success(callback);
}

function arrayMatches(callback) {
  var array = ['id1', 'id2', 'sid3', 'id4', 5]

  var fullTest = ju.array.matches(array, /((.{1,}?)([0-9]))$/, undefined, 'key', 'id');
  testing.assertEquals(fullTest.length, 4);
  testing.assertEquals(Object.keys(fullTest[2]).length, 2);
  testing.assertEquals(fullTest[2].key, 'sid');
  testing.assertEquals(fullTest[2].id, '3');


  testing.assertEquals(ju.array.matches(array, /[0-9]/).length, 5);
  testing.assertEquals(ju.array.matches(array, /^id[0-9]$/).length, 3);
  testing.assertEquals(ju.array.matches(array, /^id[0-3]$/).length, 2);
  testing.assertEquals(ju.array.matches(array, /^id[0-1]$/).length, 1);
  testing.success(callback);
}

function objectAsStringTest(callback) {
  var obj = {key1: 'value1', key2: 'value2', key3: 'value3'};
  var strObj = ju.object.asString(obj, ';');
  testing.assertEquals(strObj, 'key1=value1;key2=value2;key3=value3;');
  testing.success(callback);
}

function objectStringifyMultiline(callback) {
  const multilineJsonStr = `{"str1":"
    this
    line
    has
    newlines
 ","str2":"this line does not
"}`
  const jsonObj = {
    "str1": "\n    this\n    line\n    has\n    newlines\n ",
    "str2": "this line does not\n"
  };

  const objStr = ju.object.stringifyMultiline(jsonObj);
  testing.assertEquals(multilineJsonStr, objStr);
  testing.success(callback);
}

function objectGetPathTest(callback) {
  var obj = {path: {to: {value: 'value1'}}, value: 'value2'};
  testing.assertEquals(ju.object.getPath(obj, 'path', 'to'), 'value1');
  testing.assertEquals(ju.object.getPath(obj), 'value2');
  testing.success(callback);
}

function objectSetPathTest(callback) {
  var obj = {path: {to: {value: 'value1'}}, value: 'value2'};
  ju.object.setPath(obj, 'value1', 'path', 'to');
  testing.assertEquals(obj.path.to.value, 'value1');
  ju.object.setPath(obj, 'value2');
  testing.assertEquals(obj.value, 'value2');
  testing.success(callback);
}

function objectMatchesTest(callback) {
  var noArrayTemplate = {string: '', object: {}};
  var template = {string: '', object: {array: [{number: 3, optional: 'object1'}]}};
  var obj1Template = {boolean: false};

  var identical = {string: '', object: {}};
  testing.assert(ju.object.matches(noArrayTemplate, identical));

  var noOptional = {string: '', object: {array: [{number: 3},{number: 3, }]}};
  testing.assert(ju.object.matches(noOptional, template, obj1Template));


  var fullOptional = {string: '', object: {array: [{number: 3, optional: {boolean: false}},{number: 3, optional: {boolean: false}}]}};
  testing.assert(ju.object.matches(fullOptional, template, obj1Template));

  var missing1Optional = {string: '', object: {array: [{number: 3, optional: {boolean: false}},{number: 3}]}};
  testing.assert(ju.object.matches(missing1Optional, template, obj1Template));

  var missingNumber = {string: '', object: {array: [{optional: {boolean: false}},{number: 3}]}};
  testing.assert(!ju.object.matches(missingNumber, template, obj1Template));

  var missingString = {object: {array: [{number: 3, optional: {boolean: false}},{number: 3}]}};
  testing.assert(!ju.object.matches(missingString, template, obj1Template));

  var missingBoolean = {string: '', object: {array: [{number: 3, optional: {boolean: false}},{number: 3, optional: {}}]}};
  testing.assert(!ju.object.matches(missingBoolean, template, obj1Template));

  testing.success(callback);
}

function validateTypesTest(callback) {
  testing.assert(ju.validateTypes('', 'string', 5, 'number', {}, 'object', [], 'object'));

  try {
    ju.validateTypes('', 'string', "", 'number', 4, 'object', 3, 'object');
    testing.fail(callback);
  } catch (e) {
    testing.success(callback);
  }
}

testing.run([
  stringReplaceWithinSimpleTest,
  stringReplaceWithinSameCharTest,
  stringReplaceWithinEndpointsTest,
  stringReplaceWithinNoTerminatorTest,
  stringParseMultilineTest,
  stringParseSeperatorEndCapTest,
  stringParseSeperatorNoEndCapTest,
  stringParseSeperatorRegexTest,
  stringParseCookieTest,
  arrayGetByKeyRegTest,
  arrayRegexObjTest,
  arrayMatches,
  objectAsStringTest,
  objectStringifyMultiline,
  objectGetPathTest,
  objectSetPathTest,
  objectMatchesTest,
  validateTypesTest
]);
