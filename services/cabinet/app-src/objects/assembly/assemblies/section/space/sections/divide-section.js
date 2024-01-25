


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
    const pId = parent && parent.id ? parent.id() : null;
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

    // TODO: will break in future should be calling getJoints.. recursive iissue;
    // this.getJoints = () => {
    //   let joints = [];
    //   this.children().forEach((child) => joints = joints.concat(child.joints));
    //   return joints;
    // }
    this.children = () => this.sections;
    this.partitions = () => this.sections.filter((e, index) => index % 2 === 1);
    this.spaces = () => this.sections.filter((e, index) => index % 2 === 0);
    this.borders = (index) => {
      return () => {
        const props = sectionProperties();
        const position = {
          front: props.position.front,
          back: props.position.back,
          top: props.position.top,
          bottom: props.position.bottom,
          left: props.position.left,
          right: props.position.right
        };
        const rotation = props.rotation;

        let top = props.borders ? props.borders.top : props.position.top;
        let bottom = props.borders ? props.borders.bottom : props.position.bottom;
        let left = props.borders ? props.borders.left : props.position.left;
        let right = props.borders ? props.borders.right : props.position.right;
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
        return {borders: {top, bottom, right, left}, position, depth, index, rotation};
      }
    }
    this.dividerProps = (index) => {
      return () => {
        const answer = this.dividerLayout().list;
        let offset = this.dividerOffset(index * 2);
        for (let i = 0; i < index + 1; i += 1) offset += answer[i];
        let props = sectionProperties();
        const innerSize = this.innerSize();
        let center = this.center();
        let dividerLength;
        if (this.vertical()) {
          const start = props.borders ? props.borders.left.position().centerAdjust('x', '-z') : props.position.left;
          center.x = start + offset;
          dividerLength = innerSize.y;
        } else {
          const start = props.borders ? props.borders.top.position().centerAdjust('y', '+z') : props.position.top;
          center.y = start - offset;
          dividerLength = innerSize.x;
        }
        const rotationFunc = () =>  this.vertical() ? {x: 0, y:0, z: 0} : {x: 0, y:0, z: 90};

        const depth = props.depth;
        const vertical = this.vertical();
        const borders = props.borders;
        return {center, dividerLength, rotationFunc, index, depth, vertical, borders};
      }
    }

    this.dividerOffset = (limitIndex) => {
      limitIndex = limitIndex > -1 && limitIndex < this.sections.length ? limitIndex : this.sections.length;
      let cov = this.coverable();
      let frOut = this.outerSize();
      let offset = this.isVertical() ? cov.limits['-x'] - frOut.limits['-x'] : frOut.limits.y - cov.limits.y;
      for (let index = 0; index < limitIndex + 2; index += 1) {
        const section = this.sections[index];
        if (section instanceof DividerSection) {
          const maxWidth = section.maxWidth();
          let halfReveal;
          if (this.propertyConfig().isReveal()) {
            halfReveal = this.propertyConfig().reveal().r.value() / 2;
          } else if (this.propertyConfig().isInset()) {
            const insetValue = this.propertyConfig('Inset').is.value();
            halfReveal = (section.maxWidth() + insetValue * 2) / 2;
          } else {
            halfReveal = (maxWidth - this.propertyConfig().overlay() * 2)/2;
          }
          offset += index < limitIndex ? halfReveal*2 : halfReveal;
        }
      }
      return offset;
    }

    this.dividerReveal = (limitIndex) => {
      limitIndex = limitIndex > -1 && limitIndex < this.sections.length ? limitIndex : this.sections.length;
      let offset = 0;
      for (let index = 0; index < limitIndex; index += 1) {
        const section = this.sections[index];
        if (section instanceof DividerSection) {
          if (this.propertyConfig().isReveal()) {
            offset += this.propertyConfig().reveal().r.value();
          }  else if (this.propertyConfig().isInset()) {
            const insetValue = this.propertyConfig('Inset').is.value();
            offset += section.maxWidth() + insetValue * 2;
          } else {
            offset += section.maxWidth();
            offset -= this.propertyConfig().overlay() * 2;
          }
        }
      }
      return offset;
    }

    this.sectionCount = () => this.dividerCount() + 1;
    this.dividerLayout = () => {
      let distance;
      const coverable = this.coverable();
      distance = this.vertical() ? coverable.dems.x : coverable.dems.y;
      distance -= this.dividerReveal();
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
            this.sections.push(new DividerSection(`dv-${this.id()}-${index}`, this.dividerProps(index), instance));
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
      index = Number.parseInt(index);
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
      json.subassemblies = this.sections.map((section) => section.toJson());
      return json;
    }
  }
}

DivideSection.fromJson = (json) => {
  const sectionProps = json.parent.borders(json.borderIds || json.index);
  const assembly = new DivideSection(sectionProps, json.parent);
  assembly.partCode(json.partCode);
  assembly.id(json.id)
  assembly.index(json.index);
  const subAssems = json.subassemblies;
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
