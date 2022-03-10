


const EPNTS = require('../generated/EPNTS.js');
const Test = require('../../../public/js/utils/test/test').Test;

if (EPNTS.getEnv() === 'local') {
  require('../test/tests/to-from-json');
  require('../../../public/js/utils/test/tests/decision-tree');
}

Test.run();
