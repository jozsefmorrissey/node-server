
const sectionFilePath = (filename) => `sections/${filename}`;

class Section extends Assembly {
  constructor(templatePath, isPartition, partCode, partName, sectionProperties) {
    super(templatePath, isPartition, partCode, partName);
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

    this.outerSize = () => {
      const props = sectionProperties();
      const topPos = props.borders.top.position();
      const botPos = props.borders.bottom.position();
      const leftPos = props.borders.left.position();
      const rightPos = props.borders.right.position();
      const x = leftPos.center('x') - rightPos.center('x');
      const y = topPos.center('y') - botPos.center('y');
      const z = topPos.center('z');
      return {x,y,z};
    }

    this.innerSize = () => {
      const props = sectionProperties();
      const topPos = props.borders.top.position();
      const botPos = props.borders.bottom.position();
      const leftPos = props.borders.left.position();
      const rightPos = props.borders.right.position();
      const x = leftPos.center('x') + leftPos.limits('-x') - (rightPos.center('x') + rightPos.limits('+x'));
      const y = topPos.center('y') + topPos.limits('-x') - ((botPos.center('y') + botPos.limits('+x')));
      const z = topPos.center('z');
      return {x,y,z};
    }

    this.rotationStr = () => sectionProperties().rotationFunc();

    this.isPartition = () => isPartition;
    if (templatePath === undefined) {
      throw new Error('template path must be defined');
    }
    this.constructorId = this.constructor.name;
    this.part = false;
    this.display = false;
    this.name = this.constructorId.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/ Section$/, '');
    Section.sections[this.constructorId] = this;
    Section.templates[this.constructorId] = new $t(templatePath);
  }
}
Section.sections = {};
Section.getSections = (isPartition) => {
  const sections = [];
  Object.values(Section.sections).forEach((section) => {
    const part = section.isPartition();
    if(isPartition === undefined || part === isPartition) sections.push(section);
  });
  return sections;
}
Section.keys = () => Object.keys(Section.sections);
Section.templates = {};
Section.new = (constructorId, divideProps) => new (Section.sections[constructorId]).constructor();
Section.render = (opening, scope) => {
  scope.featureDisplay = new FeatureDisplay(opening).html();
  const cId = opening.constructorId;
  if (cId === 'DivideSection') {
    return OpenSectionDisplay.html(scope.opening, scope.list, scope.sections);
  }
  return Section.templates[cId].render(scope);
}
