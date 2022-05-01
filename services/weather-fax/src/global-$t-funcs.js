const $t = require('../../../public/js/utils/$t.js');
const utils = require('./utils');
const numbers = require('./numbers');


const footerTemplate = new $t('footer');
const footer = (isPdf) => {
  return footerTemplate.render({numbers, isPdf});
}

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const  dayIndexesToString = (indexes) => indexes.map((i) => days[i]).join(', ');

$t.global('utils', utils, true);
$t.global('Math', Math, true);
$t.global('footer', footer, true);
$t.global('timeStamp', () => new Date().getTime(), true)
$t.global('dayIndexesToString', dayIndexesToString, true);
