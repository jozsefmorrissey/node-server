
const testFiles = [
  "./tests/cabinet",
  "./tests/polygon2d",
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
  "./tests/web-worker/documentation"];

const testAll = window.location.href.match(/(\?|&)testAll=true($|&)/) !== null;
const fileContainsMatch = window.location.href.match(/(\?|&)testFile=(.{1,}?)($|&)/);
const fileContains = fileContainsMatch && fileContainsMatch[2];
const testNameMatch = window.location.href.match(/(\?|&)testName=(.{1,}?)($|&)/);
const testNameContains = testNameMatch && testNameMatch[2];


let filter;
if (fileContainsMatch) filter = (fileName) => fileName.indexOf(fileContains) !== -1;

if (testAll || fileContains || testNameContains) {
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
