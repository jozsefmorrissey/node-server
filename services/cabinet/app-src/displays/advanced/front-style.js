const du = require('../../../../../public/js/utils/dom-utils');
const $t = require('../../../../../public/js/utils/$t.js');

const templates = {
  Overlay: new $t('advanced/front-style/overlay'),
  Inset: new $t('advanced/front-style/inset'),
  Reveal: new $t('advanced/front-style/reveal'),
}

du.on.match('change', '#front-overlay-select', (elem) => {
  const cnt = du.find.closest('.style-cnt', elem);
  const assem = Lookup.get(du.find.up.attribute('lookup-id', elem));
  assem.value('style', elem.value);
  cnt.innerHTML = templates[assem.resolve('style', true)].render(assem);
});
