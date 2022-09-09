


const Assembly = require('../../assembly.js');

/*
    a,b,c
    d,e,f
    g,h,i
*/
class Handle extends Assembly {
  constructor(partCode, partName, door, location, index, count) {
    super(partCode, 'Handle');
    Object.getSet(this, {location});
    this.setParentAssembly(door);
    index = index || 0;
    count = count || 1;

    function offset(center, distance) {
      const spacing = distance / count;
      return center - (distance / 2) + spacing / 2 + spacing * (index);
    }


    this.demensionStr = (attr) => {
      const dems = {x: 1, y: 9.6, z: 1.9};
      return attr ? dems[attr] : dems;
    }

    this.rotationStr = () => this.location() && this.location().rotate ? {x: 0, y:0, z: 90} : {x: 0, y:0, z: 0};

    const edgeOffset = 3.01625;
    const toCenter = 4;
    this.centerStr = (attr) => {
        let center = door.position().center();
        let doorDems = door.position().demension();
        let pullDems = this.demensionStr();
        center.z -= (doorDems.z + pullDems.z) / 2;

        switch (this.location()) {
          case Handle.location.TOP_RIGHT:
            center.x = center.x + doorDems.x / 2 +  edgeOffset;
            center.y = center.y + doorDems.y / 2 - (pullDems.y / 2 + toCenter);
					  break;
          case Handle.location.TOP_LEFT:
            center.x = center.x - doorDems.x / 2 -  edgeOffset;
            center.y = center.y + doorDems.y / 2 - (pullDems.y / 2 + toCenter);
  					break;
          case Handle.location.BOTTOM_RIGHT:
            center.x = center.x + doorDems.x / 2 -  edgeOffset;
            center.y = center.y + doorDems.y / 2 - (pullDems.y / 2 + toCenter);
  					break;
          case Handle.location.BOTTOM_LEFT:
            center.x = center.x + doorDems.x / 2 -  edgeOffset;
            center.y = center.y + doorDems.y / 2 - (pullDems.y / 2 + toCenter);
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

    if (door !== undefined)this.updatePosition();
  }
}
Handle.location = {};
Handle.location.TOP_RIGHT = {rotate: true, position: 'TOP_Right'};
Handle.location.TOP_LEFT = {rotate: true, position: 'TOP_LEFT'};
Handle.location.BOTTOM_RIGHT = {rotate: true};
Handle.location.BOTTOM_LEFT = {rotate: true};
Handle.location.TOP = {multiple: true};
Handle.location.BOTTOM = {multiple: true};
Handle.location.RIGHT = {multiple: true};
Handle.location.LEFT = {multiple: true};
Handle.location.CENTER = {multiple: true};

Handle.abbriviation = 'hn';


module.exports = Handle
