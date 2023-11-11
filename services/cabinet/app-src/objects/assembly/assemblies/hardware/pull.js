


const Assembly = require('../../assembly.js');
const CSG = require('../../../../../../../public/js/utils/3d-modeling/csg.js');
const pull = require('../../../../three-d/models/pull.js');
/*
    a,b,c
    d,e,f
    g,h,i
*/
class Handle extends Assembly {
  constructor(partCode, partName, door, location, index, count) {
    let instance;
    location ||= Handle.location.CENTER;
    function baseCenter() {
      let center;
      const edgeOffset = (19 * 2.54) / 16;
      const toCenter = 3 * 2.54 + instance.centerToCenter() / 2;
      const front = instance.parentAssembly().front();
      const top = front.line(0);
      // TODO: Maybe... not sure why these are flipped.
      const left = front.line(-1);
      const right = front.line(1);
      const bottom = front.line(2);

      switch (instance.location()) {
        case Handle.location.TOP_RIGHT:
          center = top.endVertex;
          center.translate(top.vector().unit().scale(-edgeOffset));
          center.translate(right.vector().unit().scale(toCenter));
          break;
        case Handle.location.TOP_LEFT:
          center = top.startVertex;
          center.translate(top.vector().unit().scale(edgeOffset));
          center.translate(left.vector().unit().scale(-toCenter));
          break;
        case Handle.location.BOTTOM_RIGHT:
          center = bottom.startVertex;
          center.translate(bottom.vector().unit().scale(edgeOffset));
          center.translate(right.vector().unit().scale(-toCenter));
          break;
        case Handle.location.BOTTOM_LEFT:
          center = bottom.endVertex;
          center.translate(bottom.vector().unit().scale(-edgeOffset));
          center.translate(left.vector().unit().scale(toCenter));
          break;
        case Handle.location.TOP:
          center = top.midpoint();
          center.translate(right.vector().unit().scale(edgeOffset));
          break;
        case Handle.location.BOTTOM:
          center = bottom.midpoint();
          center.translate(right.vector().unit().scale(-edgeOffset));
          break;
        case Handle.location.RIGHT:
          center = right.midpoint();
          center.translate(top.vector().unit().scale(-edgeOffset));
          break;
        case Handle.location.LEFT:
          center = left.midpoint();
          center.translate(top.vector().unit().scale(edgeOffset));
          break;
        case Handle.location.CENTER:
          center = front.center();
          break;
        break;
        default:
          throw new Error('Invalid pull location');
      }
      return center;
    };

    super('p', 'Handle');
    Object.getSet(this, {location});
    this.partName = () =>
      `${this.parentAssembly().partName()}.Pull.${this.location().position}`;
    this.partCode = (full) => {
      if (!full) return partCode;
      const parent = this.parentAssembly();
      const parentStr = parent ? `${parent.partCode(true)}-` : '';
      const indexStr = this.count() > 0 ? `-${index}` : '';
      return `${parentStr}${partCode}${indexStr}`;
    }
    this.inElivation = true;
    instance = this;
    index = index || 0;
    count = count || 1;

    this.count = (c) => {
      if (c > 0) {
        count = c;
      }
      return count;
    }

    function offset(center, distance) {
      const spacing = distance / count;
      return center - (distance / 2) + spacing / 2 + spacing * (index);
    }

    this.toModel = (simple) => {
      const baseC = baseCenter();
      const biPolygon = this.parentAssembly().biPolygon();
      const front = biPolygon.front();
      const rotated =  instance.location().rotate;
      const line = rotated ? front.line(-1) : front.line(0);
      const normal = biPolygon.normal();
      if (simple)
        return pull.simple(baseC, line, normal, this.projection(), this.centerToCenter());
      else
        return pull(baseC, line, normal, this.projection(), this.centerToCenter());
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

Handle.abbriviation = 'hn';

Handle.fromJson = (json) => {
  const obj = Assembly.fromJson(json);
  obj.location(Handle.location[json.location.position]);
  return obj;
}


module.exports = Handle
