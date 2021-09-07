

require('../../../public/js/utils/utils.js');
const Order = require('./objects/order.js');
const OrderDisplay = require('./displays/order.js');
const ThreeDModel = require('./three-d/three-d-model.js');
const PropertyDisplay = require('./displays/property.js');
const DisplayManager = require('./display-utils/displayManager.js');


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
