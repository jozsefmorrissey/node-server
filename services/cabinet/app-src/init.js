

require('../../../public/js/utils/utils.js');
const $t = require('../../../public/js/utils/$t');
const EPNTS = require('../generated/EPNTS.js');
$t.loadFunctions(require('../generated/html-templates'))
require('./displays/user.js');
const Order = require('./objects/order.js');
const OrderDisplay = require('./displays/order.js');
const ThreeDModel = require('./three-d/three-d-model.js');
const PropertyDisplay = require('./displays/property.js');
const DisplayManager = require('./display-utils/displayManager.js');

if (EPNTS.getEnv() === 'local') require('../test/tests/to-from-json');

let roomDisplay;
let order;
let propertyDisplay;
let mainDisplayManager;

order = new Order();
orderDisplay = new OrderDisplay('#app');
setTimeout(ThreeDModel.init, 1000);
propertyDisplay = new PropertyDisplay('#property-manager');
mainDisplayManager = new DisplayManager('display-ctn', 'menu', 'menu-btn');

exports.roomDisplay = roomDisplay
exports.order = order
exports.mainDisplayManager = mainDisplayManager
exports.PropertyDisplay = propertyDisplay
