


const Assembly = require('../../assembly.js');
const pull = require('../../../../three-d/models/pull.js');

/*
    a,b,c
    d,e,f
    g,h,i
*/
class Handle extends Assembly {
  constructor(partCode, partName, door, location, index, count) {
    super(partCode, 'Handle');
    this.setParentAssembly(door);
    index = index || 0;
    count = count || 1;
    this.setLocation = (l) => location = l;

    function offset(center, distance) {
      const spacing = distance / count;
      return center - (distance / 2) + spacing / 2 + spacing * (index);
    }


    this.demensionStr = (attr) => {
      const dems = {x: 1, y: 3, z: 1.5};
      return attr ? dems[attr] : dems;
    }

    const edgeOffset = 1;
    this.centerStr = (attr) => {
        let center = door.position().center();
        let doorDems = door.position().demension();
        let pullDems = this.demensionStr();
        center.z -= (doorDems.z + pullDems.z) / 2;
        switch (location) {
          case Handle.location.TOP_RIGHT:
            center.x = center.x + doorDems.x / 2 -  edgeOffset;
            center.y = center.y + doorDems.y / 2 - (pullDems.y / 2 + edgeOffset);
					break;
          case Handle.location.TOP_LEFT:
          center.x = center.x - doorDems.x / 2 -  edgeOffset;
          center.y = center.y + doorDems.y / 2 - (pullDems.y / 2 + edgeOffset);
					break;
          case Handle.location.BOTTOM_RIGHT:
          center.x = center.x + doorDems.x / 2 -  edgeOffset;
          center.y = center.y + doorDems.y / 2 - (pullDems.y / 2 + edgeOffset);
					break;
          case Handle.location.BOTTOM_LEFT:
          center.x = center.x + doorDems.x / 2 -  edgeOffset;
          center.y = center.y + doorDems.y / 2 - (pullDems.y / 2 + edgeOffset);
					break;
          case Handle.location.TOP:
            center.x = offset(center.x, doorDems.x);
            center.y -= doorDems.y / 2;
					break;
          case Handle.location.BOTTOM:
            center.x = offset(center.x, doorDems.x);
            center.y += doorDems.y / 2;
					break;
          case Handle.location.RIGHT:
            center.y = offset(center.y, doorDems.y);
            center.x += doorDems.x / 2;
					break;
          case Handle.location.LEFT:
            center.y = offset(center.y, doorDems.y);
            center.x -= doorDems.x / 2;
					break;
          case Handle.location.CENTER:
            center.x = offset(center.x, doorDems.x);
					break;
          default:
            throw new Error('Invalid pull location');
        }
        return attr ? center[attr] : center;
    };

    this.updatePosition();
  }
}
Handle.location = {};
Handle.location.TOP_RIGHT = {rotate: true};
Handle.location.TOP_LEFT = {rotate: true};
Handle.location.BOTTOM_RIGHT = {rotate: true};
Handle.location.BOTTOM_LEFT = {rotate: true};
Handle.location.TOP = {multiple: true};
Handle.location.BOTTOM = {multiple: true};
Handle.location.RIGHT = {multiple: true};
Handle.location.LEFT = {multiple: true};
Handle.location.CENTER = {multiple: true, rotate: true};

Handle.abbriviation = 'pu';

Assembly.register(Handle);
module.exports = Handle




