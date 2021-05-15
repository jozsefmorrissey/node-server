let dvs;
let dsCount = 0;
class DivideSection extends SpaceSection {
  constructor(sectionProperties, parent) {
    super(sectionFilePath('open'), `dvds-${dsCount++}`, 'divideSection', sectionProperties);
    this.important = ['partCode', 'partName', 'borderIds', 'index'];
    this.setParentAssembly(parent);
    dvs = dvs || this;
    this.vertical = (is) => this.value('vertical', is);
    this.vertical(true);
    this.sections = [];
    this.value('vPattern', {name: 'Equal'});
    this.value('hPattern', {name: 'Equal'});
    this.pattern = (name, index, value) => {
      if (name === undefined) return this.vertical() ? this.value('vPattern') : this.value('hPattern');
      if (this.vertical()) this.value('vPattern', {name, index, value});
      else this.value('hPattern', {name, index, value});
    }
    this.measurments = [];
    this.dividerCount = () => Math.ceil((this.sections.length - 1) / 2);
    this.isVertical = () => this.sections.length < 2 ? undefined : this.vertical();
    this.sectionProperties = () => JSON.stringify(sectionProperties);
    this.init = () => {
      if (this.sections.length === 0) {
        this.sections.push(new DivideSection(this.borders(0), this));
      }
    }

    this.children = () => this.sections;
    this.partitions = () => this.sections.filter((e, index) => index % 2 === 1);
    this.spaces = () => this.sections.filter((e, index) => index % 2 === 0);
    this.borders = (index) => {
      return () => {
        const props = sectionProperties();

        let top = props.borders.top;
        let bottom = props.borders.bottom;
        let left = props.borders.left;
        let right = props.borders.right;
        if (this.vertical()) {
          if (index !== 0) {
            right = this.sections[index - 1];
          } if (index !== this.sections.length - 1) {
            left = this.sections[index + 1];
          }
        } else {
          if (index !== 0) {
            top = this.sections[index - 1];
          } if (index !== this.sections.length - 1) {
            bottom = this.sections[index + 1];
          }
        }

        const depth = props.depth;
        return {borders: {top, bottom, right, left}, depth, index};
      }
    }
    this.dividerProps = (index) => {
      return () => {
        const answer = this.calcSections().list;
        let offset = 0;
        for (let i = 0; i < index + 1; i += 1) offset += answer[i];
        let props = sectionProperties();
        const innerSize = this.innerSize();
        let center = this.center();
        let dividerLength;
        if (this.vertical()) {
          let start = sectionProperties().borders.right.position().center('x');
          start += sectionProperties().borders.right.position().limits('+x');
          center.x = start + offset;
          dividerLength = innerSize.y;
        } else {
          let start = sectionProperties().borders.top.position().center('y');
          start += sectionProperties().borders.top.position().limits('+x');
          center.y = start - offset;
          dividerLength = innerSize.x;
        }
        const rotationFunc = () =>  this.vertical() ? '' : 'z';

        return {center, dividerLength, rotationFunc, index};
      }
    }
    this.calcSections = (pattern, index, value) => {
      if (pattern && (typeof pattern.name) === 'string' && typeof(index + value) === 'number') {
        this.pattern(pattern.name, index, value);
      } else {
        pattern = DivisionPattern.patterns[this.pattern().name];
      }

      const config = this.pattern();
      const props = sectionProperties();
      const distance = this.vertical() ? this.outerSize().x : this.outerSize().y;
      const count = this.dividerCount() + 1;
      const answer = pattern.resolution(distance, config.index, config.value, count);
      config.fill = answer.fill;
      return answer;
    }
    this.divide = (dividerCount) => {
      if (!Number.isNaN(dividerCount)) {
        dividerCount = dividerCount > 10 ? 10 : dividerCount;
        dividerCount = dividerCount < 0 ? 0 : dividerCount;
        const currDividerCount = this.dividerCount();
        if (dividerCount < currDividerCount) {
          const diff = currDividerCount - dividerCount;
          this.sections.splice(dividerCount * 2 + 1);
          return true;
        } else {
          const diff = dividerCount - currDividerCount;
          for (let index = currDividerCount; index < dividerCount; index +=1) {
            this.sections.push(new DividerSection(`dv${index}`, this.dividerProps(index)));
            const divideIndex = dividerCount + index + 1;
            this.sections.push(new DivideSection(this.borders(divideIndex)));
            this.sections[index].setParentAssembly(this);
            this.sections[divideIndex].setParentAssembly(this);
          }
          return diff !== 0;
        }
      }
      return false;
    }
    this.setSection = (constructorIdOobject, index) => {
      const section = (typeof constructorIdOobject) === 'string' ?
          Section.new(constructorIdOobject, 'dr', this.borders(index)) :
          constructorIdOobject;
      section.setParentAssembly(this);
      this.sections[index] = section;
    }
    this.size = () => {
      return {width: this.width, height: this.height};
    }
    this.sizes = () => {
      return 'val';
    }
  }
}

DivideSection.fromJson = (json, parent) => {
  const sectionProps = parent.borders(json.borderIds || json.index);
  const assembly = new DivideSection(sectionProps, parent);
  const subAssems = json.subAssemblies;
  for (let index = 0; index < subAssems.length / 2; index += 1) {
    const partIndex = index * 2 + 1;
    if (partIndex < subAssems.length) {
      const partJson = subAssems[partIndex];
      const partition = Assembly.class(partJson.type).fromJson(partJson, assembly);
      assembly.setSection(partition, partIndex);
    }

    const spaceIndex = index * 2;
    const spaceJson = subAssems[spaceIndex];
    const space = Assembly.class(spaceJson.type).fromJson(spaceJson, assembly);
    assembly.setSection(space, spaceIndex);
  }
  return assembly;
}

DivideSection.abbriviation = 'ds';

Assembly.register(DivideSection);
