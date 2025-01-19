
let nr = '(?:-|)[0-9]{1,}';
Number.regex = new RegExp(`(?:${nr}\\.${nr}|${nr}|\\.${nr})`);

Function.safeStdLibAddition(Number, 'is',  function (...numbers) {
  return numbers.findIndex(n => !(n instanceof Number)) === -1;
}, true);

Function.safeStdLibAddition(Number, 'float32',  {}, true);
Function.safeStdLibAddition(Number, 'float64',  {}, true);
Function.safeStdLibAddition(Number, 'int32',  {}, true);
Function.safeStdLibAddition(Number, 'bigInt64',  {}, true);
Function.safeStdLibAddition(Number.float32, 'littleEndian',  function (float) {
  return formatNumber(float, 4, 'setFloat32');
}, true);

Function.safeStdLibAddition(Number.float32, 'bigEndian',  function (float) {
  return formatNumber(float, 4, 'setFloat32', true);
}, true);

Function.safeStdLibAddition(Number.float64, 'littleEndian',  function (float) {
  return formatNumber(float, 8, 'setFloat64');
}, true);

Function.safeStdLibAddition(Number.float64, 'bigEndian',  function (float) {
  return formatNumber(float, 8, 'setFloat64', true);
}, true);

Function.safeStdLibAddition(Number.int32, 'littleEndian',  function (float, U) {
  return formatNumber(float, 4, U !== false ? 'setInt32' : 'setUInt32');
}, true);

Function.safeStdLibAddition(Number.int32, 'bigEndian',  function (float, U) {
  return formatNumber(float, 4, U !== false ? 'setInt32' : 'setUInt32', true);
}, true);

Function.safeStdLibAddition(Number.bigInt64, 'littleEndian',  function (float, U) {
  return formatNumber(float, 8, U !== false ? 'setBigInt64' : 'setBigUint64', true);
}, true);

Function.safeStdLibAddition(Number.bigInt64, 'bigEndian',  function (float, U) {
  return formatNumber(float, 8, U !== false ? 'setBigInt64' : 'setBigUint64', true);
}, true);


Function.safeStdLibAddition(Number, 'NaNfinity',  function (...vals) {
  for (let index = 0; index < vals.length; index++) {
    let val = vals[index];
    if(Number.isNaN(val) || !Number.isFinite(val)) return true;
  }
  return false;
}, true);
