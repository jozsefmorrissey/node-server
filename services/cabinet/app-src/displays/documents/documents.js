const FileTabDisplay = require('../../../../../public/js/utils/lists/file-tab.js');

const fileTabDisp = new FileTabDisplay();

function registerConstruction() {
  const Construction = require('./construction.js');
  const html = Construction.Order.html;
  const shouldRender = Construction.Order.shouldRender;
  fileTabDisp.register('Construction', html, shouldRender);
}

fileTabDisp.register('Summary', () => '<h1>Hello Summery</h1>');
registerConstruction();
fileTabDisp.register('Materials', require('./materials.js').html.order);

module.exports = fileTabDisp;
