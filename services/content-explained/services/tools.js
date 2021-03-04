
const { DebugGuiClient } = require('../../debug-gui/public/js/debug-gui-client');

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

const charSet = 'dqtag1JybAfu3zG4OpCQc6WL5Bie7P0ZrKs2XoxEIjkFVMSU89wDhNYlvmRnT';

class CharCode {
  constructor(charSet) {
    const charMap = {};
    const intMap = {};
    for (let index = 0; index < charSet.length; index += 1) {
      const char = charSet.charAt(index);
      intMap[index] = char;
      charMap[char] = index;
    }
    this.getValue = (ref) => {
      if (Number.isInteger(ref)) return intMap[ref];
      return charMap[ref];
    }
    this.base = charSet.length;
  }
}

function fromCodeToNumber(code, codeSet) {
  let value = 0;
  for (let index = code.length - 1; index > -1; index -= 1) {
    const char = code[index];
    value += codeSet.getValue(char) * Math.pow(codeSet.base, code.length - index - 1);
  }
  return value;
}

function fromNumberToCode(num, codeSet) {
  let exponent = 0;
  let str = '';
  while (num > 0) {

    const modulous = num % Math.pow(codeSet.base, exponent);
    str += codeSet.getValue(modulous % codeSet.base);
    num -= modulous * Math.pow(codeSet.base, exponent++);
  }
  return str;
}

exports.randomString = randomString;
