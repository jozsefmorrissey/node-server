


const Assembly = require('../../assembly.js');

/*
    a,b,c
    d,e,f
    g,h,i
*/
class Handle extends Assembly {
  constructor(partCode, partName, door, location, index, count) {
    let instance;
    function rotationConfig() {
      if (!instance || !instance.location) return {x:0,y:0,z:0};
      return instance.location && instance.location() && instance.location().rotate ?
          {x: 0, y:0, z: 90} : {x: 0, y:0, z: 0};
    }
    function demensionConfig(attr) {
      if (!instance || !instance.location) return {x:0,y:0,z:0};
      const dems = {x: 1, y: 9.6, z: 1.9};
      return attr ? dems[attr] : dems;
    }
    function centerConfig(attr) {
      if (!instance || !instance.location) return {x:0,y:0,z:0};
        let center = door.position().center();
        let doorDems = door.position().demension();
        let pullDems = instance.demensionConfig();
        center.z -= (doorDems.z + pullDems.z) / 2;
        const edgeOffset = (19 * 2.54) / 16;
        const toCenter = 3 * 2.54;

        switch (instance.location()) {
          case Handle.location.TOP_RIGHT:
            center.x = center.x + doorDems.x / 2 -  edgeOffset;
            center.y = center.y + doorDems.y / 2 - (pullDems.y / 2 + toCenter);
            break;
          case Handle.location.TOP_LEFT:
            center.x = center.x - doorDems.x / 2 +  edgeOffset;
            center.y = center.y + doorDems.y / 2 - (pullDems.y / 2 + toCenter);
            break;
          case Handle.location.BOTTOM_RIGHT:
            center.x = center.x + doorDems.x / 2 -  edgeOffset;
            center.y = center.y - doorDems.y / 2 + (pullDems.y / 2 + toCenter);
            break;
          case Handle.location.BOTTOM_LEFT:
            center.x = center.x - doorDems.x / 2 +  edgeOffset;
            center.y = center.y - doorDems.y / 2 + (pullDems.y / 2 + toCenter);
            break;
          case Handle.location.TOP:
            center.x = offset(center.x, doorDems.x);
            center.y += doorDems.y / 2 - edgeOffset;
            break;
          case Handle.location.BOTTOM:
            center.x = offset(center.x, doorDems.x);
            center.y -= doorDems.y / 2 - edgeOffset;
            break;
          case Handle.location.RIGHT:
            center.y = center.y;
            center.x += doorDems.x / 2 - edgeOffset;
            break;
          case Handle.location.LEFT:
            center.y = center.y;
            center.x -= doorDems.x / 2 - edgeOffset;
            break;
          case Handle.location.CENTER:
            center.x = offset(center.x, doorDems.x);
            break;
          case undefined:
            center.x = 0;
            center.y = 0;
            center.z = 0;
            break;
          default:
            throw new Error('Invalid pull location');
        }
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
