


const Assembly = require('../../assembly.js');
const JointSettings = require('../../../../../web-worker/shared/settings.js');
const CSG = require('../../../../../../../public/js/utils/3d-modeling/csg.js');
const {HandleCenter} = require('../../../../../web-worker/shared/utilities.js');

/*
    a,b,c
    d,e,f
    g,h,i
*/
class Handle extends Assembly {
  constructor(partCode, partName, location) {
    let instance;
    location ||= Handle.location.CENTER;
    super('p', 'Handle');
    this.color = this.value.getterSetter('pcolor', true);
    this.jointSettings.sliceAtOpening(false);
    Object.getSet(this, {location, centerToCenter: 9.6});
    this.partName = () =>
      `${this.parentAssembly().partName()}.Pull.${this.location().position}`;
    this.partCode = () => partCode;
    this.jointSettings = new JointSettings(false,false,false,false);
    this.locationCode = () => {
      const parent = this.parentAssembly();
      const parentStr = parent ? `${parent.locationCode()}:` : '';
      const indexStr = this.count() > 0 ? `${this.index()}` : '';
      return `${parentStr}${partCode}${indexStr}`;
    }
    this.inElivation = true;
    instance = this;

    this.center = (poly) => {
      if (!poly) {
        let coverSection = this.linkListFind('parentAssembly', a => a.cover && a.cover());
        poly = coverSection.approximateCoverPoly();
      }
      if (!poly) throw new Error('Valid CoverSection is required to find center');
      const heo = this.resolve('heo');
      const hcco = this.resolve('hcco');
      return HandleCenter(this.location(), poly, heo, hcco, this.centerToCenter());
    }

    this.locations = (poly) => {
      const mainCenter = this.center(poly);
      const rotate = this.location().rotate;
      if (this.count() === 1) return [{center: mainCenter, rotate}];
      throw new Error('have not implemented for multiple pulls');
    }

    this.index = () => {
      const parent = this.parentAssembly();
      if (!parent) return 1;
      return parent.pulls().indexOf(this) + 1;
    }

    this.count = (c) => {
      const parent = this.parentAssembly();
      if (!parent) return 1;
      return parent.pulls().length;
    }

    this.projection = () => 2.54;
  }
}
Handle.location = {};
Handle.location.TOP_RIGHT = {rotate: true, position: 'TOP_RIGHT'};
Handle.location.TOP_LEFT = {rotate: true, position: 'TOP_LEFT'};
Handle.location.BOTTOM_RIGHT = {rotate: true, position: 'BOTTOM_RIGHT'};
Handle.location.BOTTOM_LEFT = {rotate: true, position: 'BOTTOM_LEFT'};
Handle.location.TOP = {multiple: true, position: 'TOP'};
Handle.location.BOTTOM = {multiple: true, position: 'BOTTOM'};
Handle.location.RIGHT = {multiple: true, rotate: true, position: 'RIGHT'};
Handle.location.LEFT = {multiple: true, rotate: true, position: 'LEFT'};
Handle.location.CENTER = {multiple: true, position: 'CENTER'};


Handle.fromJson = (json) => {
  const obj = Assembly.fromJson(json);
  obj.location(Handle.location[json.location.position]);
  // TODO: incase i dont fix this. this value is being reset at some point during the toJson proccess i think...
  obj.jointSettings.sliceAtOpening(false);
  return obj;
}

module.exports = Handle
