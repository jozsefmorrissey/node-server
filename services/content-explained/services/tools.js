
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

exports.randomString = randomString;
