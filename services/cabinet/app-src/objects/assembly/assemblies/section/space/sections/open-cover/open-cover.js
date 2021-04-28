const PULL_TYPE = {
  DRAWER: 'Drawer',
  DOOR: 'Door'
}

class OpeningCoverSection extends SpaceSection {
  constructor(filePath, partCode, partName, divideProps, pullType) {
    super(filePath, partCode, partName, divideProps);

    const instance = this;

    pullType = pullType || PULL_TYPE.DOOR;
    let pulls = [];

    this.setPullType = (pt) => pullType = pt;
    if (divideProps === undefined) return;

    this.updatePulls = (count) => {
      pulls = [];
      if (pullType === PULL_TYPE.DRAWER) {
        count = count || instance.drawerPullCount();
        for (let index = 0; index < count; index += 1) {
          pulls.push(new Pull(`dwp-${index}`, 'Drawer.Pull', instance.drawerPullCenter(index, count), instance.pullDems));
        }
      } else {
        pulls.push(new Pull(`dp`, 'Door.Pull', instance.doorPullCenter, instance.pullDems, 'z'));
      }
    }

    this.coverDems = function(attr) {
      const props = divideProps();
      const dems = instance.innerSize()
      dems.z = instance.value('pwt34');
      dems.x = dems.x + 1;
      dems.y = dems.y + 1;
      return attr ? dems[attr] : dems;
    }

    this.coverCenter = function (attr) {
      const props = divideProps();
      const dems = instance.coverDems();
      const center = instance.center();
      center.z -= (props.borders.top.position().demension('z') + dems.z) / 2 - 1/8;
      return attr ? center[attr] : center;
    }

    this.hingeSide = () => {
      const props = divideProps();
      return props.borders.right.partCode === 'rr' ? '+x' : '-x';
    }


    const gap = 1/16;
    function duelDoorDems() {
      const dems = instance.coverDems();
      dems.x = (dems.x - gap) / 2;
      return dems;
    }
    this.duelDoorDems = duelDoorDems;

    function duelDoorCenter(right) {
      return function () {
        const direction = right ? -1 : 1;
        const center = instance.coverCenter();
        const dems = duelDoorDems();
        center.x += (dems.x + gap) / 2 * direction;
        return center;
      }
    }
    this.duelDoorCenter = duelDoorCenter;

    function closest(target) {
      let winner = {value: arguments[1], diff: Math.abs(target - arguments[1])};
      for (let index = 2; index < arguments.length; index += 1) {
        const value = arguments[index];
        const diff = Math.abs(target - value);
        if (diff < winner.diff) {
          winner = {diff, value}
        }
      }
      return winner.value;
    }

    this.drawerPullCenter = (index, count) =>
      (attr) => {
        const center = instance.coverCenter(attr);
        const dems = instance.coverDems();
        const spacing = (dems.x / (count));
        center.x += -(dems.x/2) + spacing / 2 + spacing * (index);
        center.z -= (instance.coverDems('z') + dems.z) / 2;
        return center;
    };

    this.pullDems = (attr) => {
      const dems = {x: 1, y: 5, z: 2};
      return attr ? dems[attr] : dems;
    }

    this.doorPullCenter = () => {
      const idealPullHeight = instance.value('iph');
      const dems = this.coverDems();
      const center = this.coverCenter();
      const top = center.y +  dems.y / 2 - 4;
      const bottom = center.y -  dems.y / 2 + 4;
      const xOffset = dems.x / 2 - 1.5;
      center.x = center.x - xOffset * (this.hingeSide() === '-x' ? 1 : -1);
      center.y = closest(idealPullHeight, top, center.y, bottom);
      center.z -= (instance.coverDems('z') + dems.z) / 2;
      return center;
    }

  }
}
