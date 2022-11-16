


const Assembly = require('../../assembly.js');
const CSG = require('../../../../../public/js/3d-modeling/csg.js');
/*
    a,b,c
    d,e,f
    g,h,i
*/
class Handle extends Assembly {
  constructor(partCode, partName, door, location, index, count) {
    let instance;
    function rotationConfig() {
      const rotation = door.position().rotation();
      if (!instance || !instance.location) return rotation;
      if (instance.location && instance.location() && instance.location().rotate) {
        return [{x:0,y:0,z:90}, rotation];
      }
      return rotation;
    }
    function demensionConfig(attr) {
      if (!instance || !instance.location) return {x:0,y:0,z:0};
      const dems = {x: 1, y: 9.6, z: 1.9};
      return attr ? dems[attr] : dems;
    }
    function centerConfig(attr) {
      if (!instance || !instance.location) return {x:0,y:0,z:0};
        let center;
        let pullDems = instance.demensionConfig();
        const edgeOffset = (19 * 2.54) / 16;
        const toCenter = 3 * 2.54;
        const front = door.front();

        switch (instance.location()) {
          case Handle.location.TOP_RIGHT:
            offset.x = doorDems.x / 2 -  edgeOffset;
            offset.y = doorDems.y / 2 - (pullDems.y / 2 + toCenter);
            break;
          case Handle.location.TOP_LEFT:
            offset.x = -doorDems.x / 2 +  edgeOffset;
            offset.y = doorDems.y / 2 - (pullDems.y / 2 + toCenter);
            break;
          case Handle.location.BOTTOM_RIGHT:
            offset.x = doorDems.x / 2 -  edgeOffset;
            offset.y = -doorDems.y / 2 + (pullDems.y / 2 + toCenter);
            break;
          case Handle.location.BOTTOM_LEFT:
            offset.x = -doorDems.x / 2 +  edgeOffset;
            offset.y = -doorDems.y / 2 + (pullDems.y / 2 + toCenter);
            break;
          case Handle.location.TOP:
            offset.x = 0;//offset(offset.x, doorDems.x);
            offset.y = doorDems.y / 2 - edgeOffset;
            break;
          case Handle.location.BOTTOM:
            offset.x = 0;//offset(offset.x, doorDems.x);
            offset.y = doorDems.y / -2 + edgeOffset;
            break;
          case Handle.location.RIGHT:
            offset.y = 0;
            offset.x = doorDems.x / 2 - edgeOffset;
            break;
          case Handle.location.LEFT:
            const top = front.line(0);
            center = top.startVertex;
            center.translate(top.vector().unit().scale(edgeOffset));
            const left = front.line(3);
            center.translate(left.vector().unit().inverse().scale(toCenter));
            break;
          case Handle.location.CENTER:
            offset.x = 0;
            offset.y = 0;
          break;
          case undefined:
            offset.x = 0;
            offset.y = 0;
            break;
          default:
            throw new Error('Invalid pull location');
        }
        const norm = front.normal().inverse();
        center.translate(norm.scale(pullDems.z / 2));
        return attr ? center[attr] : center;
    };

    super(partCode, 'Handle', centerConfig, demensionConfig, rotationConfig);
    // super(partCode, 'Handle', '0,0,0', '0,0,0', '0,0,0');
    Object.getSet(this, {location});
    this.setParentAssembly(door);
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
  }
}
Handle.location = {};
Handle.location.TOP_RIGHT = {rotate: true, position: 'TOP_Right'};
Handle.location.TOP_LEFT = {rotate: true, position: 'TOP_LEFT'};
Handle.location.BOTTOM_RIGHT = {rotate: true};
Handle.location.BOTTOM_LEFT = {rotate: true};
Handle.location.TOP = {multiple: true};
Handle.location.BOTTOM = {multiple: true};
Handle.location.RIGHT = {multiple: true, rotate: true};
Handle.location.LEFT = {multiple: true, rotate: true};
Handle.location.CENTER = {multiple: true};

Handle.abbriviation = 'hn';


module.exports = Handle
