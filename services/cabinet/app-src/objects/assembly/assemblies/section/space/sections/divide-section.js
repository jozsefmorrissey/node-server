


const SpaceSection = require('../space.js');
const Pattern = require('../../../../../../division-patterns.js');
const DividerSection = require('../../partition/sections/divider.js');
const Section = require('../../section.js');
const Assembly = require('../../../../assembly.js');

function sectionId(parent, sectionProperties) {

}

let dvs;
let dsCount = 0;
class DivideSection extends SpaceSection {
  constructor(sectionProperties, parent) {
    const pId = parent && parent.uniqueId ? parent.uniqueId() : null;
    const sIndex = (typeof sectionProperties) === 'function' ? sectionProperties().index : null;
    super(`dvds-${pId}-${sIndex}`, 'divideSection', sectionProperties, parent);
    // this.important = ['partCode', 'partName', 'borderIds', 'index'];
    const instance = this;
    dvs = dvs || this;
    let pattern;
    let sectionCount = 1;
    this.vertical = (is) => instance.value('vertical', is);
    this.vertical(true);
    this.sections = [];
    this.pattern = (patternStr) => {
      if ((typeof patternStr) === 'string') {
        sectionCount = patternStr.length;
        this.divide(sectionCount - 1);
        pattern = new Pattern(patternStr);
      } else {
        if (!pattern || pattern.str.length !== sectionCount)
          pattern = new Pattern(new Array(sectionCount).fill('a').join(''));
      }
      return pattern;
    }
    this.dividerCount = () => this.init() && Math.ceil((this.sections.length - 1) / 2);
    this.isVertical = () => this.sections.length < 2 ? undefined : this.vertical();
    this.sectionProperties = () => JSON.stringify(sectionProperties);
    this.init = () => {
      if (this.sections.length === 0) {
        this.sections.push(new DivideSection(this.borders(0), this));
      }
      return true;
    }

    this.children = () => this.sections;
    this.partitions = () => this.sections.filter((e, index) => index % 2 === 1);
    this.spaces = () => this.sections.filter((e, index) => index % 2 === 0);
    this.borders = (index) => {
      return () => {
        // if (index === 1) {
        //   console.log('center');
        // }
        const props = sectionProperties();
        const position = {
          top: props.position.top,
          bottom: props.position.bottom,
          left: props.position.left,
          right: props.position.right
        };

        let top = props.borders.top;
        let bottom = props.borders.bottom;
        let left = props.borders.left;
        let right = props.borders.right;
        if (this.vertical()) {
          if (index !== 0) {
            left = this.sections[index - 1];
            position.left = undefined;
          } if (this.sections[index + 1] !== undefined) {
            right = this.sections[index + 1];
            position.right = undefined;
          }
        } else {
          if (index !== 0) {
            top = this.sections[index - 1];
            position.top = undefined;
          } if (this.sections[index + 1] !== undefined) {
            bottom = this.sections[index + 1];
            position.bottom = undefined;
          }
        }

        const depth = props.depth;
        if (!top || !bottom || !right || !left)
          throw new Error('Border not defined');
        return {borders: {top, bottom, right, left}, position, depth, index};
      }
    }
    this.dividerProps = (index) => {
      return () => {
        // if (index === 1) {
        //   console.log('center');
        // }
        const answer = this.dividerLayout().list;
        let offset = 0;
        for (let i = 0; i < index + 1; i += 1) offset += answer[i];
        let props = sectionProperties();
        const innerSize = this.innerSize();
        let center = this.center();
        let dividerLength;
        if (this.vertical()) {
          let start = sectionProperties().borders.left.position().center('x');
          start += sectionProperties().borders.left.position().limits('+x');
          center.x = start + offset;
          dividerLength = innerSize.y;
        } else {
          let start = sectionProperties().borders.top.position().center('y');
          start += sectionProperties().borders.top.position().limits('+x');
          center.y = start - offset;
          dividerLength = innerSize.x;
        }
        const rotationFunc = () =>  this.vertical() ? '' : 'z';

        const depth = props.depth;
        const vertical = this.vertical();
        return {center, dividerLength, rotationFunc, index, depth, vertical};
      }
    }

    this.sectionCount = () => this.dividerCount() + 1;
    this.dividerLayout = () => {
      let distance;
      if (!this.rootAssembly().propertyConfig.isRevealOverlay()) {
        distance = this.vertical() ? this.innerSize().x : this.innerSize().y;
        this.sections.forEach((section) =>
          distance -= section instanceof DividerSection ? section.maxWidth() : 0);
      } else {
        distance = this.vertical() ? this.outerSize().dems.x : this.outerSize().dems.y;
      }
      return this.pattern().calc(distance);
    };
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
            this.sections.push(new DividerSection(`dv-${this.uniqueId()}-${index}`, this.dividerProps(index), instance));
            const divideIndex = dividerCount + index + 1;
            this.sections.push(new DivideSection(this.borders(divideIndex), instance));
          }
          return diff !== 0;
        }
      }
      return false;
    }
    this.setSection = (constructorIdOobject, index) => {
      let section;
      if ((typeof constructorIdOobject) === 'string') {
        if (constructorIdOobject === 'DivideSection') {
          section = new DivideSection(this.borders(index), instance);
        } else {
          section = Section.new(constructorIdOobject, 'dr', this.borders(index), this);
        }
      } else {
        section = constructorIdOobject;
      }
      this.sections[index] = section;
    }
    this.size = () => {
      return {width: this.width, height: this.height};
    }
    this.sizes = () => {
      return 'val';
    }
    const assemToJson = this.toJson;
    this.toJson = () => {
      const json = assemToJson.apply(this);
      json.pattern = this.pattern().toJson();
      json.subAssemblies = this.sections.map((section) => section.toJson());
      return json;
    }
  }
}

DivideSection.fromJson = (json) => {
  const sectionProps = json.parent.borders(json.borderIds || json.index);
  const assembly = new DivideSection(sectionProps, json.parent);
  assembly.partCode(json.partCode);
  assembly.uniqueId(json.uniqueId)
  assembly.index(json.index);
  const subAssems = json.subAssemblies;
  assembly.values = json.values;
  for (let index = 0; index < subAssems.length / 2; index += 1) {
    const partIndex = index * 2 + 1;
    if (partIndex < subAssems.length) {
      const partJson = subAssems[partIndex];
      partJson.parent = assembly;
      const partition = Assembly.class(partJson._TYPE).fromJson(partJson, assembly);
      assembly.setSection(partition, partIndex);
    }

    const spaceIndex = index * 2;
    const spaceJson = subAssems[spaceIndex];
    spaceJson.index = spaceIndex;
    spaceJson.parent = assembly;
    const space = Assembly.class(spaceJson._TYPE).fromJson(spaceJson, assembly);
    assembly.setSection(space, spaceIndex);
  }
  assembly.pattern(json.pattern.str);
  const pattern = assembly.pattern();
  const patternIds = Object.keys(json.pattern.values);
  patternIds.forEach((id) => pattern.value(id, json.pattern.values[id]));
  return assembly;
}

DivideSection.abbriviation = 'ds';


module.exports = DivideSection
