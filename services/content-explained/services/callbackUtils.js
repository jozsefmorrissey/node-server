
function callAfter(count, getBody, success, failure) {
  getBody = getBody || ((r) => r);
  const returnArr = [];
  let processed = 0;
  return function (results) {
    returnArr.push(results);
    if (++processed === count) {
      const returnVal = getBody(returnArr);
      if (returnVal instanceof Error) {
        failure(returnVal);
      } else {
        success(returnVal);
      }
    }
  }
}
exports.callAfter = callAfter;
