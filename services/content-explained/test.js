const testing = require('testing');
const ce = require('./content-explained.js');

function randomString(length, characterSetRegEx, regEx) {
  let generatedString = "";
  while (!generatedString.match(regEx)) {
    generatedString = "";
    for (let i = 0; i < length; i ++) {
      let character = "";
      while (character.length != 1 || !character.match(characterSetRegEx)) {
        character = String.fromCharCode(Math.floor(Math.random() * 107 + 20));
      }
      generatedString += character;
    }
  }
    return generatedString;
}


function cleanStrTest(callback) {
  testing.assertEquals(ce.cleanStr('created'), 'creat');
  testing.assertEquals(ce.cleanStr('filesystem'), 'filesystem');
  testing.assertEquals(ce.cleanStr('maximum number of files'), 'maximum/number/of/fil');
  testing.assertEquals(ce.cleanStr('depends'), 'depend');
  testing.assertEquals(ce.cleanStr('files'), 'fil');
  testing.assertEquals(ce.cleanStr('cooking'), 'cook');
  testing.assertEquals(ce.cleanStr('cooKING'), 'cook');
  testing.success(callback);
}

function getFileTest(callback) {
  for (let index = 0; index < 100; index += 1) {
    const str = randomString(25, /.*/, /.{1,}/);
    const file = ce.getFile(str);
    const errMsg = `File format failure: "${str}" mapped to "${file}"`;
    testing.assert(file.match(/^.*\/[0-9]{2}\/[0-9]{2}\.json$/), errMsg, callback);
  }
  testing.success(callback);
}

testing.run([
  cleanStrTest,
  getFileTest
]);
