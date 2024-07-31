
const Global = require('../app-src/services/global.js');
const Order = require('../app-src/objects/order.js');

const testFiles = [
  "./tests/cabinet",
  "./tests/polygon2d",
  "../../../public/js/utils/test/tests/csg",
  "../../../public/js/utils/test/tests/measurement",
  "../../../public/js/utils/test/tests/vector3D",
  "../../../public/js/utils/test/tests/polygon3d",
  "../../../public/js/utils/test/tests/navigator",
  "../../../public/js/utils/test/tests/compress-string",
  "../../../public/js/utils/test/tests/json-utils",
  "../../../public/js/utils/test/tests/utils",
  "../../../public/js/utils/test/tests/imposter",
  // TODO: write new tests - not important until we start working on the programmable cost interface.
  // "../../../public/js/utils/test/tests/decision-tree",
  "./tests/polygon-merge",
  "./tests/array-math",
  "./tests/plane",
  "./tests/line2d",
  "./tests/line-consolidate",
  "./tests/web-worker/data-transfer-objects",
  "./tests/web-worker/simple",
  "./tests/web-worker/assembly",
  "./tests/web-worker/room",
  "./tests/web-worker/documentation",
  "./tests/bi-polygon"];

const getUriVariable = (name) => (match = window.location.href.match(new RegExp(`(\\?|&)${name}=(.{1,}?)($|&)`))) && match && decodeURI(match[2]);

const shouldTestAll = getUriVariable('testAll') === 'true';
const fileContains = getUriVariable('testFile');
const testNameContains = getUriVariable('testName');
const loadTestOrder = getUriVariable('testOrder') === 'true';

if(loadTestOrder) Global.order(Order.fromJson(require('./tests/test-order.json')))

let filter;
if (fileContains) filter = (fileName) => fileName.indexOf(fileContains) !== -1;

if (shouldTestAll || fileContains || testNameContains) {
  const EPNTS = require("../generated/EPNTS.js");
  const Test = require('../../../public/js/utils/test/test').Test;
  if (testNameContains) Test.filter((name) => name.indexOf(testNameContains) !== -1);

  for (let index = 0; index < testFiles.length; index++) {
    const fileName = testFiles[index];
    if (!filter || filter(fileName)) {
      require(fileName);
    }
  }

  Test.run();
}
