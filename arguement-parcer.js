
const trueReg = /^true$/;
const falseReg = /^false$/;
const numberReg = /^[0-9]{1,}$/;
const arrayReg = /^(.*[,].*(,|)){1,}$/;

function getValue(str) {
  if (str === '') return undefined;
  if (str.match(trueReg)) return true;
  if (str.match(falseReg)) return false;
  if (str.match(numberReg)) return Number.parseInt(str);
  if (str.match(arrayReg)) {
    const arr = [];
    const elems = str.split(',');
    for (let index = 0; index < elems.length; index += 1) {
      arr.push(getValue(elems[index]));
    }
    return arr;
  }
  return str;
}

const valueRegex = /[A-Z.a-z]{1,}=.*$/;
const booleanRegex = /\-[a-zA-Z0-9]*/;
function argParser() {
  for (let index = 2; index < process.argv.length; index += 1) {
    const arg = process.argv[index];
    if (arg.match(valueRegex)) {
      const varName = arg.split('=', 1)[0];
      const valueStr = arg.substr(varName.length + 1);
      global[varName] = getValue(valueStr.trim());
    } else if (arg.match(booleanRegex)) {
      const varName = arg.split('-')[1];
      global[varName] = true;
    }
  }
}

global.__basedir = __dirname;

argParser();
