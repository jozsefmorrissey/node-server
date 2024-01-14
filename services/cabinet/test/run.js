const EPNTS = require('../generated/EPNTS.js');
const Test = require('../../../public/js/utils/test/test').Test;

const skipTests = window.location.href.match(/(\?|&)skipTests=true($|&)/) !== null;
if (!skipTests || EPNTS.getEnv() === 'local') {
  require('./tests/cabinet');
  require('./tests/web-worker');
if (!skipTests) {
    require('./tests/polygon2d');
    require('../../../public/js/utils/test/tests/vector3D');
    require('../../../public/js/utils/test/tests/polygon3d');
    require('../../../public/js/utils/test/tests/navigator');
    require('../../../public/js/utils/test/tests/compress-string');
    require('../../../public/js/utils/test/tests/json-utils');
    require('../../../public/js/utils/test/tests/utils');
    require('../../../public/js/utils/test/tests/imposter');
    // TODO: write new tests - not important until we start working on the programmable cost interface.
    // require('../../../public/js/utils/test/tests/decision-tree');
    require('./tests/polygon-merge');
    require('./tests/array-math');
    require('./tests/plane');
    require('./tests/line2d');
    require('./tests/line-consolidate');
  }
}

Test.run();
