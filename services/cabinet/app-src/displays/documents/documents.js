const FileTabDisplay = require('../../../../../public/js/utils/lists/file-tab.js');
const Construction = require('./construction.js');
const Global = require('../../services/global.js');
const du = require('../../../../../public/js/utils/dom-utils');

const shouldRender = (cnt) => {
  const order = Global.order();
  const hashElem = du.find.down('[order-hash]', cnt);
  if (!hashElem) return true;
  return hashElem.getAttribute('order-hash') === '' + order.hash();
};

let count = 1;
const notDefined = () => 'Yet To Be Defined:' + count++;
const fileTabDisp = new FileTabDisplay();
fileTabDisp.TITLES = {
  AREAL: {title: 'Areal', html: Construction.Arials},
  ELEVATION: {title: 'Elevation', html: notDefined},
  BUILD_DIAGRAM: {title: 'Build Diagram', html: Construction.BuildDiagram},
  MATERIALS: {title: 'Materials', html: Construction.Materials},
  DOOR_LIST: {title: 'Door List', html: Construction.DoorList},
  DRAWER_FRONT_LIST: {title: 'Drawer Front List', html: Construction.DrawerFrontList},
  CUT_LIST: {title: 'Cut List', html: Construction.CutList},
  COMPLEX_CUT_LIST: {title: 'Complex Cut List', html: Construction.Order},
  SUMMARY: {title: 'Summary', html: notDefined},
  EVERYTHING: {title: 'Everything', html: notDefined}
}

// function registerConstruction() {
//   const Construction = require('./construction.js');
//   const html = Construction.Order.html;
//   const shouldRender = Construction.Order.shouldRender;
//   // fileTabDisp.register('Construction', html, shouldRender);
// }
//
// fileTabDisp.register('Summary', () => '<h1>Hello Summery</h1>');
// registerConstruction();
// fileTabDisp.register('Materials', require('./materials.js').html.order);

Object.values(fileTabDisp.TITLES).forEach(obj => fileTabDisp.register(obj.title, obj.html, shouldRender));

module.exports = fileTabDisp;
