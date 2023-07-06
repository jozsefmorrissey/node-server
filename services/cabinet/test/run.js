


const EPNTS = require('../generated/EPNTS.js');
const Test = require('../../../public/js/utils/test/test').Test;

if (EPNTS.getEnv() === 'local') {
  require('../../../public/js/utils/test/tests/navigator');
  require('../../../public/js/utils/test/tests/compress-string');
  require('../../../public/js/utils/test/tests/json-utils');
  require('../../../public/js/utils/test/tests/utils');
  require('../../../public/js/utils/test/tests/imposter');
  require('./tests/cabinet');
  require('../../../public/js/utils/test/tests/decision-tree');
  require('../../../public/js/utils/test/tests/star-line-map');
  require('./tests/polygon-merge');
  require('./tests/array-math');
  require('./tests/plane');
  require('./tests/line2d');
  require('./tests/line-consolidate');
}

Test.run();
