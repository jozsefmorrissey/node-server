


const SectionProperties = require('../section-properties.js');
const Panel = require('../../panel');
const Assembly = require('../../../assembly.js');
const Cabinet = require('../../cabinet.js');
const BiPolygon = require('../../../../../three-d/objects/bi-polygon.js');
const Joint = require('../../../../joint/joint.js');
const DividerSection = require('../partition/divider.js');

let count = 0;
class PanelSection extends Assembly {
  constructor(panel) {
    super('ps', 'panelSection');
    const instance = this;
    this.part = () => false;
    const sectionProps = () => instance.parentAssembly();

    const addJoint = (dir) => {
      const part = sectionProps()[dir]();
      const partCode = (part instanceof DividerSection ? part.panel() : part).locationCode();
      panel.addJoints(new Joint(panel.locationCode(), partCode));
    }

    function updateJoints() {
      panel.joints.deleteAll();
      addJoint('left');
      addJoint('right');
      addJoint('top');
      addJoint('bottom');
    }

    function getBiPolygon () {
      const sp = sectionProps();
      const ip = sp.innerPoly();
      const tt = sp.top().thickness();
      const bt = sp.bottom().thickness();
      const lt = sp.left().thickness();
      const rt = sp.right().thickness();

      const sizeOffset = {x: lt + rt , y: tt + bt};
      const poly = BiPolygon.fromPolygon(ip, 0, 3*2.54/4, sizeOffset);

      const rightOffset = ip.lines()[0].vector().unit().scale(rt - lt);
      const downOffset = ip.lines()[0].vector().unit().scale(bt - tt);
      const centerOffset = rightOffset.add(downOffset);
      poly.translate(centerOffset);


      return poly;
    }

    function toModel () {
      return getBiPolygon().toModel();
    }

    if (!panel) panel = new Panel.Model('ps', 'Panel-' + count++, toModel);
    else panel.toModel = toModel;

    const initialize = (assem) => () => {
      if (assem instanceof Cabinet) {
        this.on.change(updateJoints);
      } else {
        const parent = instance.parentAssembly();
        parent.on.parentSet(initialize(parent));
      }
      // setTimeout(() => );
      // panel.part(false);
      this.addSubAssembly(panel);

    }

    this.on.parentSet(initialize(this));
  }
}

PanelSection.fromJson = (json) => {
  const panel = Object.fromJson(json.subassemblies.ps);
  return new PanelSection(panel);
}

PanelSection.abbriviation = 'ps';
SectionProperties.addSection(PanelSection);

module.exports = PanelSection
