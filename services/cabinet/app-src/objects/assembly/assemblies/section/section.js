
const sectionFilePath = (filename) => `sections/${filename}`;

class Section extends Assembly {
  constructor(templatePath, isPartition, partCode, partName, sectionProperties) {
    super(partCode, partName);
    this.index = () => sectionProperties().index;
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
      let reveal = border.value('r');
      const insideRailStart = CoverStartPoints.INSIDE_RAIL === border.value('csp');
      const positive = insideRailStart ? direction.indexOf('-') !== -1 :
                          direction.indexOf('-') === -1;
      const axis = direction.replace(/\+|-/, '');
      const magnitude = positive ? 1 : -1;
      const divisor = insideRailStart ? 1 : 2;
      const borderOrigin = !insideRailStart ? borderPos.center(axis) :
        (positive ? borderPos.centerAdjust(`${axis}`, '-x') :
                    borderPos.centerAdjust(`${axis}`, '+x'));
      return  borderOrigin + ((reveal * magnitude) / divisor);
    }


    this.outerSize = () => {
      const props = sectionProperties();
      const pos = props.position;

      const top = props.borders.top;
      const bot = props.borders.bottom;
      const left = props.borders.left;
      const right = props.borders.right;

      const limits = {};
      limits.x = pos.right || calculateRevealOffset(right, '-x');
      limits['-x'] = pos.left || calculateRevealOffset(left, '+x');
      limits.y = pos.top || calculateRevealOffset(top, '-y');
      limits['-y'] = pos.bottom || calculateRevealOffset(bot, '+y');
      limits['-z'] = top.position().limits('-z');
      limits.z = props.depth - limits['-z'];

      const center = {};
      center.x = limits['-x'] + ((limits.x - limits['-x']) / 2);
      center.y = limits['-y'] + ((limits.y - limits['-y']) / 2);
      center.z = limits['-z'] + ((limits.z - limits['-z']) / 2);

      const dems = {};
      dems.x = limits.x - limits['-x'];
      dems.y = limits.y - limits['-y'];
      dems.z = props.depth;

      return {limits, center, dems};
    }

    this.innerSize = () => {
      const props = sectionProperties();
      const topPos = props.borders.top.position();
      const botPos = props.borders.bottom.position();
      const leftPos = props.borders.left.position();
      const rightPos = props.borders.right.position();
      const x = rightPos.center('x') + rightPos.limits('-x') - (leftPos.center('x') + leftPos.limits('+x'));
      const y = topPos.center('y') + topPos.limits('-x') - ((botPos.center('y') + botPos.limits('+x')));
      const z = topPos.center('z');
      return {x,y,z};
    }

    if (templatePath === undefined) {
      throw new Error('template path must be defined');
    }
    this.isPartition = () => isPartition;
    this.constructorId = this.constructor.name;
    this.part = false;
    this.display = false;
    this.name = this.constructorId.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/ Section$/, '');
    Section.templates[this.constructorId] = new $t(templatePath);
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
Section.keys = () => Assembly.classIds(Section.sectionInstance);
Section.templates = {};
Section.new = function (constructorId) {
  const section = Assembly.new.apply(null, arguments);
  if (section instanceof Section) return section;
  throw new Error(`Invalid section Id: '${constructorId}'`);
}
Section.render = (scope) => {
  scope.featureDisplay = new FeatureDisplay(scope.opening).html();
  const cId = scope.opening.constructorId;
  if (cId === 'DivideSection') {
    return OpenSectionDisplay.html(scope.opening, scope.list, scope.sections);
  }
  return Section.templates[cId].render(scope);
}

Assembly.register(Section);
