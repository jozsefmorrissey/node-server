

const $t = require('../../../../public/js/utils/$t');

class FeatureDisplay {
  constructor(assembly, parentSelector) {
    this.html = () => FeatureDisplay.template.render({features: assembly.features, id: 'root'});
    this.refresh = () => {
      const container = document.querySelector(parentSelector);
      container.innerHTML = this.html;
    }
  }
}
FeatureDisplay.template = new $t('features');
module.exports = FeatureDisplay
