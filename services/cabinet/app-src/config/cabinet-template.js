
const cabinetsJson = require('../../public/json/cabinets.json');
const Cabinet = require('../objects/assembly/assemblies/cabinet.js')
const Lookup = require('../../../../public/js/utils/object/lookup.js');
const PropertyConfig = require('./property/config');
const AssemblyTemplate = require('assembly-template');
const Order = require('../objects/order.js');



class CabinetTemplate extends AssemblyTemplate {
  constructor(type) {
    super(type);
    const instance = this;
    const initialVals = {
      dividerJoint: {},
      fromFloor: 0,
      openings: [CabinetTemplate.defaultPartCodeOpening()],
      autoToeKick: false,
      _FORCE_FROM_JSON: true
    };
    Object.getSet(this, initialVals);
    CabinetTemplate.map[type] = this;

    function get(length, width, thickness, pc) {
      const group = Order.createGroup('cabinet-template');
      const cabinet = Cabinet.build(instance.type(), group, instance.toJson());
      cabinet.length(length || this.height());
      cabinet.width(width || this.width());
      cabinet.thickness(thickness || this.thickness());

      if (pc instanceof PropertyConfig) cabinet.group().propertyConfig = pc;
      return cabinet;
    }
    this.get = get;

    this.validOpenings = () => {
      const bms = this.openings();
      for (let index = 0; index < bms.length; index += 1) {
        const bm = bms[index];
        if (!(vpc(bm.top) && vpc(bm.bottom) && vpc(bm.right) &&
                vpc(bm.left) && vpc(bm.bottom))) {
          return false;
        }
      }
      return true;
    }
    this.validateDividerJoint = () => {
      const j = this.dividerJoint();
      return j.type === 'Butt' || (j.type === 'Dado' && j.maleOffset > 0);
    }

    this.valid = () => {
      let cab;
      try {
        cab ||= get();
      } catch (e) {
        return false;
      }
      return this.validateValues(cab) && this.validOpenings() &&
              this.validateDividerJoint() && this.validateJoints() &&
              this.validateSubassemblies(cab);
    }
  }
}

CabinetTemplate.map = {};
CabinetTemplate.defaultList = () => {
  const list = [];
  const keys = Object.keys(cabinetsJson);
  // comment out to get corner-wall to be the first.
  // keys.sort();
  for (let index = 0; index < keys.length; index += 1) {
    list.push(new CabinetTemplate().fromJson(cabinetsJson[keys[index]]));
  }
  return list;
}

CabinetTemplate.typeUndefined = (type) => CabinetTemplate.map[type] === undefined;
CabinetTemplate.defaultPartCodeOpening = () => ({
    _Type: "part-code",
    top: "pt",
    bottom: "pb",
    left: "pl",
    right: "pr",
    back: "pback"
  }
);

CabinetTemplate.defaultLocationOpening = () => ({
  _Type: "location",
  zRotation: 0,
  inner: {
    top: {left: {x: 0, y: 0, z: 0}, right: {x: 0, y: 0, z: 0}},
    bottom: {right:{x: 0, y: 0, z: 0}, left: {x: 0, y: 0, z: 0}}
  },
  outer: {
    top: {left: {x: 0, y: 0, z: 0}, right: {x: 0, y: 0, z: 0}},
    bottom: {right:{x: 0, y: 0, z: 0}, left: {x: 0, y: 0, z: 0}}
  }
});

new CabinetTemplate();

module.exports = CabinetTemplate;
