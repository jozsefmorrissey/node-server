


const EPNTS = require('../generated/EPNTS.js');
const Test = require('../../../public/js/utils/test/test').Test;

if (EPNTS.getEnv() === 'local') {
  require('./tests/cabinet');
  require('../../../public/js/utils/test/tests/decision-tree');
  require('../../../public/js/utils/test/tests/logic-tree');
  require('./tests/polygon-merge');
  require('./tests/array-math');
  require('./tests/plane');
  require('./tests/line2d');
  require('./tests/line-consolidate');
}

Test.run();
