const FileTabDisplay = require('../../../../../public/js/utils/lists/file-tab.js');

const fileTabDisp = new FileTabDisplay();
fileTabDisp.register('Summary', () => '<h1>Hello Summery</h1>');
fileTabDisp.register('Construction', require('./construction.js').html.order);
fileTabDisp.register('Materials', () => '<h1>Hello Materials</h1>');


module.exports = {
  html: fileTabDisp.html
}
