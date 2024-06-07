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
  AERIAL: {title: 'Areal', html: Construction.Aerial},
  ELEVATION: {title: 'Elevation', html: notDefined},
  BUILD_DIAGRAM: {title: 'Build Diagram', html: Construction.BuildDiagram},
  MATERIALS: {title: 'Materials', html: Construction.Materials},
  DOOR_LIST: {title: 'Door List', html: Construction.DoorList},
  DRAWER_FRONT_LIST: {title: 'Drawer Front List', html: Construction.DrawerFrontList},
  DRAWER_LIST: {title: 'Drawer Box List', html: Construction.DrawerBoxList},
  PANEL_CL: {title: 'Panel Cut List', html: Construction.PanelCutList},
  SHELVE_CL: {title: 'Shelve Cut List', html: Construction.ShelveCutList},
  PANEL_CCL: {title: 'Panel Complex Cut List', html: Construction.PanelComplexCutList},
  SHELVE_CCL: {title: 'Shelve Complex Cut List', html: Construction.ShelveComplexCutList},
  CABINET_LIST: {title: 'Cabinet List', html: Construction.CabinetList},
  SUMMARY: {title: 'Summary', html: Construction.Summary},
  EVERYTHING: {title: 'Everything', html: Construction.Everything}
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
