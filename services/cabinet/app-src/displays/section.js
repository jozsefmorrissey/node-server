

Section.templates = {};

Section.templates[this.constructorId] = new $t(templatePath);


class SectionDisplay {
  constructor (section) {
    Section.render = (scope) => {
      scope.featureDisplay = new FeatureDisplay(scope.opening).html();
      const cId = scope.opening.constructorId;
      if (cId === 'DivideSection') {
        return OpenSectionDisplay.html(scope.opening, scope.list, scope.sections);
      }
      return Section.templates[cId].render(scope);
    }
  }
}


const du = require('../../../public/js/utils/dom-utils.js');

afterLoad.push(() => du.on.match('change', '.feature-radio', (target) => {
  const allRadios = document.querySelectorAll(`[name="${target.name}"]`);
  allRadios.forEach((radio) => radio.nextElementSibling.hidden = true);
  target.nextElementSibling.hidden = !target.checked;
}))
