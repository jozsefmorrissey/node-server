


const Assembly = require('../../assembly.js');


class Section extends Assembly {
  constructor(isPartition, partCode, partName, sectionProperties, parent) {
    super(partCode, partName);
    const instance = this;
    this.setParentAssembly(parent);
    this.setIndex = () => this.index = () => sectionProperties().index;
    this.setIndex();
    this.center = (attr) => {
      const props = sectionProperties();
      const topPos = props.borders.top.position();
      const botPos = props.borders.bottom.position();
      const leftPos = props.borders.left.position();
      const rightPos = props.borders.right.position();
      const center = {};
      center.x = (!attr || attr === 'x') &&
            leftPos.center('x') - ((leftPos.center('x') - rightPos.center('x')) / 2);
      center.y = (!attr || attr === 'y') &&
            botPos.center('y') + ((topPos.center('y') - botPos.center('y')) / 2);
      center.z = (!attr || attr === 'z') &&
            topPos.center('z');
      return attr ? center[attr] : center;
    }

    const calculateRevealOffset = (border, direction) => {
      const borderPos = border.position();
      const propConfig = this.propertyConfig();
      const positive = direction.indexOf('-') === -1;
      const axis = direction.replace(/\+|-/, '');
      const magnitude = positive ? 1 : -1;
      let borderOrigin = (magnitude > 0 ? borderPos.centerAdjust(`${axis}`, '+z') :
	                    borderPos.centerAdjust(`${axis}`, '-z'));
      if (propConfig.isInset()) {
        const insetValue = propConfig('Inset').is.value();
        borderOrigin += magnitude * insetValue;
      } else if (propConfig.isReveal()) {
        let reveal = propConfig.reveal().r.value();
        borderOrigin -= magnitude * (border.maxWidth() - reveal) / 2;
      } else {
        const overlay = propConfig('Overlay').ov.value();
        borderOrigin -= magnitude * overlay;
      }

      return  borderOrigin;
    }


    this.outerSize = () => {
      const props = sectionProperties();
      const pos = props.position;

      let top, bot, right, left;
      if (props.borders) {
        top = props.borders.top;
        bot = props.borders.bottom;
        left = props.borders.left;
        right = props.borders.right;
      }

      const limits = {};
      limits.x = pos.right || calculateRevealOffset(right, '-x');
      limits['-x'] = pos.left || calculateRevealOffset(left, '+x');
      limits.y = pos.top || calculateRevealOffset(top, '-y');
      limits['-y'] = pos.bottom || calculateRevealOffset(bot, '+y');
      //TODO: hard coded fix
      limits['-z'] = 0;
      limits.z = props.depth - limits['-z'];

      let center;
      if ((typeof props.center) === 'function') {
        center = props.center(3/-4);
      } else {
        center = {};
        center.x = limits['-x'] + ((limits.x - limits['-x']) / 2);
        center.y = limits['-y'] + ((limits.y - limits['-y']) / 2);
        center.z = limits['-z'] + ((limits.z - limits['-z']) / 2);
      }

      const dems = {};
      dems.x = limits.x - limits['-x'];
      dems.y = limits.y - limits['-y'];
      dems.z = props.depth;

      return {limits, center, dems};
    }

    this.rotation = function (attr) {
      if (sectionProperties) {
        const props = sectionProperties();
        if (props.rotation) {
          if (attr) {
            return instance.eval(props.rotation[attr]);
          }
          const rotation = {
            x: instance.eval(props.rotation.x),
            y: instance.eval(props.rotation.y),
            z: instance.eval(props.rotation.z)
          };
          return rotation;
        }
      }
      return {y:0,x:0,z:0};
    }

    function calculateInnerPosition(defined1, defined2, border1, border2, axis, offsetAxis) {
      if (defined1 === undefined) defined1 = border1.position().centerAdjust(axis, `-${offsetAxis}`);
      if (defined2 === undefined) defined2 = border2.position().centerAdjust(axis, `+${offsetAxis}`);
      return defined2 - defined1;
    }

    this.innerSize = () => {
      const props = sectionProperties();
      const pos = props.position;
      const bds = props.borders || {};

      const topPos = pos.top || props.borders.top.position();
      const botPos = pos.bottom || props.borders.bottom.position();
      const leftPos = pos.left || props.borders.left.position();
      const rightPos = pos.right || props.borders.right.position();
      const x = calculateInnerPosition(pos.right, pos.left, bds.right, bds.left, 'x', 'z');
      const y = calculateInnerPosition(pos.top, pos.bottom, bds.top, bds.bottom, 'y', 'z');
      const z = 0;
      return {x,y,z};
    }

    this.isPartition = () => isPartition;
    this.sectionProperties = sectionProperties;
    this.constructorId = this.constructor.name;
    this.part(false);
    this.display = false;
    this.name = this.constructorId.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/ Section$/, '');

    ///////////////////////////////   Boundry Functions   //////////////////////
    let coverCache;
    this.coverable = () => {
      const time = new Date().getTime();
      if (!coverCache || coverCache.time < time + 200) {
        const props = sectionProperties();
        const pos = props.position;

        let top, bot, right, left;
        if (props.borders) {
          top = props.borders.top;
          bot = props.borders.bottom;
          left = props.borders.left;
          right = props.borders.right;
        }

        const limits = {};
        limits.x = pos.right || calculateRevealOffset(right, '-x');
        limits['-x'] = pos.left || calculateRevealOffset(left, '+x');
        limits.y = pos.top || calculateRevealOffset(top, '-y');
        limits['-y'] = pos.bottom || calculateRevealOffset(bot, '+y');
        //TODO: hard coded fix
        limits['-z'] = 0;
        limits.z = props.depth - limits['-z'];

        const center = {};
        center.x = limits['-x'] + ((limits.x - limits['-x']) / 2);
        center.y = limits['-y'] + ((limits.y - limits['-y']) / 2);
        center.z = limits['-z'] + ((limits.z - limits['-z']) / 2);

        const dems = {};
        dems.x = limits.x - limits['-x'];
        dems.y = limits.y - limits['-y'];
        dems.z = props.depth;

        coverCache = {value: {limits, center, dems}, time};
      }
      return coverCache.value;
    }

    // this.frameInner = () => {
    //   const props = sectionProperties();
    //   const pos = props.position;
    //
    //   const topPos = props.borders.top.position();
    //   const botPos = props.borders.bottom.position();
    //   const leftPos = props.borders.left.position();
    //   const rightPos = props.borders.right.position();
    //
    //   const limits = {};
    //   limits.x = leftPos.centerAdjust('x', '+x');
    //   limits['-x'] = rightPos.centerAdjust('x', '-x');
    //   limits.y = topPos.centerAdjust('y', '-y');
    //   limits['-y'] = botPos.centerAdjust('y', '+y');
    //   limits.z = top.position().limits('+z');
    //   limits['-z'] = top.position().limits('-z');
    //
    //   const center = {};
    //   center.x = limits['-x'] + ((limits.x - limits['-x']) / 2);
    //   center.y = limits['-y'] + ((limits.y - limits['-y']) / 2);
    //   center.z = limits['-z'] + ((limits.z - limits['-z']) / 2);
    //
    //   const dems = {};
    //   dems.x = limits.x - limits['-x'];
    //   dems.y = limits.y - limits['-y'];
    //   dems.z = props.depth;
    //
    //   return {limits, center, dems};
    // }
    //
    // this.frameOuter = () => {
    //   const props = sectionProperties();
    //   const pos = props.position;
    //
    //   const topPos = props.borders.top.position();
    //   const botPos = props.borders.bottom.position();
    //   const leftPos = props.borders.left.position();
    //   const rightPos = props.borders.right.position();
    //
    //   const limits = {};
    //   limits.x = leftPos.centerAdjust('x', '-x');
    //   limits['-x'] = rightPos.centerAdjust('x', '+x');
    //   limits.y = topPos.centerAdjust('y', '+y');
    //   limits['-y'] = botPos.centerAdjust('y', '-y');
    //   limits.z = NaN;
    //   limits['-z'] = NaN;
    //
    //   const center = {};
    //   center.x = limits['-x'] + ((limits.x - limits['-x']) / 2);
    //   center.y = limits['-y'] + ((limits.y - limits['-y']) / 2);
    //   center.z = limits['-z'] + ((limits.z - limits['-z']) / 2);
    //
    //   const dems = {};
    //   dems.x = limits.x - limits['-x'];
    //   dems.y = limits.y - limits['-y'];
    //   dems.z = props.depth;
    //
    //   return {limits, center, dems};
    // }
    //
    // this.panelOuter = () => {
    //   const props = sectionProperties();
    //   const pos = props.position;
    //
    //   const topPos = props.borders.top.position();
    //   const botPos = props.borders.bottom.position();
    //   const leftPos = props.borders.left.position();
    //   const rightPos = props.borders.right.position();
    //
    //   const limits = {};
    //   limits.x = rightPos.centerAdjust('x', '+z');
    //   limits['-x'] = leftPos.centerAdjust('x', '-z');
    //   limits.y = topPos.centerAdjust('y', '+z');
    //   limits['-y'] = botPos.centerAdjust('y', '-z');
    //   limits.z = NaN;
    //   limits['-z'] = NaN;
    //
    //   const center = {};
    //   center.x = limits['-x'] + ((limits.x - limits['-x']) / 2);
    //   center.y = limits['-y'] + ((limits.y - limits['-y']) / 2);
    //   center.z = limits['-z'] + ((limits.z - limits['-z']) / 2);
    //
    //   const dems = {};
    //   dems.x = limits.x - limits['-x'];
    //   dems.y = limits.y - limits['-y'];
    //   dems.z = props.depth;
    //
    //   return {limits, center, dems};
    // }
    //
    // this.panelInner = () => {
    //   const props = sectionProperties();
    //   const pos = props.position;
    //
    //   const topPos = props.borders.top.position();
    //   const botPos = props.borders.bottom.position();
    //   const leftPos = props.borders.left.position();
    //   const rightPos = props.borders.right.position();
    //
    //   const limits = {};
    //   limits.x = leftPos.centerAdjust('x', '+x');
    //   limits['-x'] = rightPos.centerAdjust('x', '-x');
    //   limits.y = topPos.centerAdjust('y', '-y');
    //   limits['-y'] = botPos.centerAdjust('y', '+y');
    //   limits.z = top.position().limits('+z');
    //   limits['-z'] = top.position().limits('-z');
    //
    //   const center = {};
    //   center.x = limits['-x'] + ((limits.x - limits['-x']) / 2);
    //   center.y = limits['-y'] + ((limits.y - limits['-y']) / 2);
    //   center.z = limits['-z'] + ((limits.z - limits['-z']) / 2);
    //
    //   const dems = {};
    //   dems.x = limits.x - limits['-x'];
    //   dems.y = limits.y - limits['-y'];
    //   dems.z = props.depth;
    //
    //   return {limits, center, dems};
    // }
  }
}
Section.isPartition = () => false;
Section.abstractClasses = ['PartitionSection', 'OpeningCoverSection', 'SpaceSection']
Section.sectionInstance = (clazz) => clazz.prototype instanceof Section &&
  Section.abstractClasses.indexOf(clazz.name) === -1;
Section.sections = () => Assembly.classList(Section.sectionInstance);
Section.getSections = (isPartition) => {
  const sections = [];
  Section.sections().forEach((section) => {
    const part = section.isPartition();
    if(isPartition === undefined || part === isPartition) sections.push(section);
  });
  return sections;
}
Section.filePath = (filename) => `sections/${filename}`;

Section.keys = () => Assembly.classIds(Section.sectionInstance);
Section.new = function (constructorId) {
  const section = Assembly.new.apply(null, arguments);
  if (section instanceof Section) return section;
  throw new Error(`Invalid section Id: '${constructorId}'`);
}


module.exports = Section
