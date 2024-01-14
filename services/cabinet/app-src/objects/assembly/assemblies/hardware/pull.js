


const Assembly = require('../../assembly.js');
const CSG = require('../../../../../../../public/js/utils/3d-modeling/csg.js');
const pull = require('../../../../three-d/models/pull.js');
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
    Object.getSet(this, {location});
    this.partName = () =>
      `${this.parentAssembly().partName()}.Pull.${this.location().position}`;
    this.partCode = () => partCode;
    this.locationCode = () => {
      const parent = this.parentAssembly();
      const parentStr = parent ? `${parent.locationCode()}:` : '';
      const indexStr = this.count() > 0 ? `${this.index()}` : '';
      return `${parentStr}${partCode}${indexStr}`;
    }
    this.inElivation = true;
    instance = this;

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
    this.centerToCenter = () => 9.6;
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

Handle.joinable = false;

Handle.abbriviation = 'hn';

Handle.fromJson = (json) => {
  const obj = Assembly.fromJson(json);
  obj.location(Handle.location[json.location.position]);
  return obj;
}


module.exports = Handle
