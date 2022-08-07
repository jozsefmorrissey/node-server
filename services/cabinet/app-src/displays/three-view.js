
const Lookup = require('../../../../public/js/utils/object/lookup.js');
const $t = require('../../../../public/js/utils/$t.js');
const du = require('../../../../public/js/utils/dom-utils');
const Viewer = require('../../public/js/3d-modeling/viewer.js').Viewer;
const addViewer = require('../../public/js/3d-modeling/viewer.js').addViewer;
const pull = require('../three-d/models/pull.js');
const ThreeDModel = require('../three-d/three-d-model.js');

class ThreeView extends Lookup {
  constructor() {
    super();
    const instance = this;
    const cnt = du.create.element('div', {class: 'three-view-cnt', id: this.id()});
    const p = pull(5,2);
    const viewer = new Viewer(p, 600, 600, 50);
    let threeDModel;
    document.body.append(cnt);
    cnt.innerHTML = ThreeView.template.render({});

    function init() {
      addViewer(viewer, `#${instance.id()}`);
    }

    this.update = (cabinet) => {
      if (threeDModel === undefined) threeDModel = new ThreeDModel(cabinet, viewer);
      threeDModel.assembly(cabinet, viewer);
      threeDModel.render(cabinet);
    }

    this.isolatePart = (partCode) => threeDModel.inclusiveTarget('part-code', partCode);

    this.lastModel = () => threeDModel ? threeDModel.lastModel() : undefined;
    this.partMap = () => threeDModel ? threeDModel.partMap() : {};

    setTimeout(init, 1000);
  }
}

ThreeView.template = new $t('three-view');

module.exports = ThreeView;
