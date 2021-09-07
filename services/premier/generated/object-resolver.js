const DrawerList = require('./src/objects/drawer-list.js');
const BottomMaterial = require('./src/objects/lookup/bottom-material.js');
const BoxMaterial = require('./src/objects/lookup/box-material.js');
const DrawerBox = require('./src/objects/lookup/drawer-box.js');
const Option = require('./src/objects/lookup/option.js');
const PerBoxCost = require('./src/objects/lookup/per-box-cost.js');
const Style = require('./src/objects/lookup/style.js');
const Lookup = require('./src/objects/lookup.js');
const OrderInfo = require('./src/objects/order-info.js');
function objectResolver(obj) {
    const type = obj._TYPE;
    switch(type) {
      case 'DrawerList': return new DrawerList(obj.id).fromJson(obj);
      case 'BottomMaterial': return new BottomMaterial(obj.id).fromJson(obj);
      case 'BoxMaterial': return new BoxMaterial(obj.id).fromJson(obj);
      case 'DrawerBox': return new DrawerBox(obj.id).fromJson(obj);
      case 'Option': return new Option(obj.id).fromJson(obj);
      case 'PerBoxCost': return new PerBoxCost(obj.id).fromJson(obj);
      case 'Style': return new Style(obj.id).fromJson(obj);
      case 'Lookup': return new Lookup(obj.id).fromJson(obj);
      case 'OrderInfo': return new OrderInfo(obj.id).fromJson(obj);
      default: return JSON.clone(obj);
    }
  }

  exports = objectResolver;