


const SpaceSection = require('../../space.js');
const PULL_TYPE = require('../../../../../../../../globals/CONSTANTS.js').PULL_TYPE;
const Handle = require('../../../../hardware/pull.js');
const Door = require('../../../../door/door.js');
const Assembly = require('../../../../../assembly.js');


class OpeningCoverSection extends SpaceSection {
  constructor(partCode, partName, divideProps, parent, pullType) {
    super(partCode, partName, divideProps, parent);
    const instance = this;

    pullType = pullType || PULL_TYPE.DOOR;
    let pulls = [];

    this.setHandleType = (pt) => pullType = pt;
    if (divideProps === undefined) return;

    this.updateHandles = (count) => {
      pulls = [];
      if (pullType === PULL_TYPE.DRAWER) {
        count = count || instance.drawerHandleCount();
        for (let index = 0; index < count; index += 1) {
          pulls.push(new Handle(`dwp-${index}`, 'Drawer.Handle', instance.drawerHandleCenter(index, count), instance.pullDems));
        }
      } else {
        pulls.push(new Handle(`dp`, 'Door.Handle', instance.doorHandleCenter, instance.pullDems, 'z'));
      }
    }

    this.coverDems = function(attr) {
      const inset = instance.rootAssembly().propertyConfig.isInset();
      const dems = inset ? instance.innerSize() : instance.outerSize().dems;
      dems.z = 3/4;
      return attr ? dems[attr] : dems;
    }

    this.coverCenter = function (attr) {
      const center = instance.outerSize().center;
      const inset = instance.rootAssembly().propertyConfig.isInset();
      center.z = inset ? 3/32 : -3/4;
      return attr ? center[attr] : center;
    }

    this.hingeSide = () => {
      const props = divideProps();
      return props.borders.right.partCode === 'fr' ? '+x' : '-x';
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

    this.drawerHandleCenter = (index, count) =>
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

    this.doorHandleCenter = () => {
      const idealHandleHeight = instance.value('iph');
      const dems = this.coverDems();
      const center = this.coverCenter();
      const top = center.y +  dems.y / 2 - 4;
      const bottom = center.y -  dems.y / 2 + 4;
      const xOffset = dems.x / 2 - 1.5;
      center.x = center.x - xOffset * (this.hingeSide() === '-x' ? 1 : -1);
      center.y = closest(idealHandleHeight, top, center.y, bottom);
      center.z -= (instance.coverDems('z') + dems.z) / 2;
      return center;
    }

    const parentToJson = this.toJson;
    this.toJson = () => {
      const json = parentToJson();
      delete json.subAssemblies;
      return json;
    }

  }
}

OpeningCoverSection.dontSaveChildren = true;


module.exports = OpeningCoverSection
