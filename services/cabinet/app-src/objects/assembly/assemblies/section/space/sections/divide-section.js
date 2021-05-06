let dvs;

class DivideSection extends SpaceSection {
  constructor(sectionProperties, parent) {
    super(sectionFilePath('open'), 'dvds', 'divideSection', sectionProperties);
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
    this.dividerCount = () => (this.sections.length - 1) / 2
    this.isVertical = () => this.sections.length < 2 ? undefined : this.vertical();
    this.sectionProperties = () => JSON.stringify(sectionProperties);
    this.init = () => {
      if (this.sections.length === 0) {
        this.sections.push(new DivideSection(this.borders(0), this));
      }
    }

    this.children = () => this.sections;
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
        return {borders: {top, bottom, right, left}, depth};
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

        return {center, dividerLength, rotationFunc};
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
            this.sections.push(new DividerSection(`dv${index}`, this.dividerProps(index), this));
            this.sections.push(new DivideSection(this.borders(dividerCount + index + 1), this));
          }
          return diff !== 0;
        }
      }
      return false;
    }
    this.setSection = (constructorId, index) => {
      const section = Section.new(constructorId, 'dr', this.borders(index));
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

Assembly.register(DivideSection);
