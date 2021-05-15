/*
    a,b,c
    d,e,f
    g,h,i
*/
class Pull extends Assembly {
  constructor(partCode, partName, door, location, index, count) {
    super(partCode, 'Pull');
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
          case Pull.location.TOP_RIGHT:
            center.x = center.x + doorDems.x / 2 -  edgeOffset;
            center.y = center.y + doorDems.y / 2 - (pullDems.y / 2 + edgeOffset);
					break;
          case Pull.location.TOP_LEFT:
          center.x = center.x + doorDems.x / 2 -  edgeOffset;
          center.y = center.y + doorDems.y / 2 - (pullDems.y / 2 + edgeOffset);
					break;
          case Pull.location.BOTTOM_RIGHT:
          center.x = center.x + doorDems.x / 2 -  edgeOffset;
          center.y = center.y + doorDems.y / 2 - (pullDems.y / 2 + edgeOffset);
					break;
          case Pull.location.BOTTOM_LEFT:
          center.x = center.x + doorDems.x / 2 -  edgeOffset;
          center.y = center.y + doorDems.y / 2 - (pullDems.y / 2 + edgeOffset);
					break;
          case Pull.location.TOP:
            center.x = offset(center.x, doorDems.x);
            center.y -= doorDems.y / 2;
					break;
          case Pull.location.BOTTOM:
            center.x = offset(center.x, doorDems.x);
            center.y += doorDems.y / 2;
					break;
          case Pull.location.RIGHT:
            center.y = offset(center.y, doorDems.y);
            center.x += doorDems.x / 2;
					break;
          case Pull.location.LEFT:
            center.y = offset(center.y, doorDems.y);
            center.x -= doorDems.x / 2;
					break;
          case Pull.location.CENTER:
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
Pull.location = {};
Pull.location.TOP_RIGHT = {rotate: true};
Pull.location.TOP_LEFT = {rotate: true};
Pull.location.BOTTOM_RIGHT = {rotate: true};
Pull.location.BOTTOM_LEFT = {rotate: true};
Pull.location.TOP = {multiple: true};
Pull.location.BOTTOM = {multiple: true};
Pull.location.RIGHT = {multiple: true};
Pull.location.LEFT = {multiple: true};
Pull.location.CENTER = {multiple: true, rotate: true};

Pull.abbriviation = 'pu';

Assembly.register(Pull);
