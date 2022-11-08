
const Vertex3D = require('../../../../three-d/objects/vertex.js');
const KeyValue = require('../../../../../../../public/js/utils/object/key-value.js');
const Notification = require('../../../../../../../public/js/utils/collections/notification.js');
const Assembly = require('../../assembly.js');
const CSG = require('../../../../../public/js/3d-modeling/csg.js');
const DividerSection = require('./partition/divider.js');
const Pattern = require('../../../../division-patterns.js');

const v = () => new Vertex3D();
class SectionProperties extends KeyValue{
  constructor(config) {
    super({childrenAttribute: 'sections', parentAttribute: 'parentAssembly'})

    const coordinates = new Notification(true, {inner: [v(),v(),v(),v()], outer: [v(),v(),v(),v()]});
    let rotation, innerCenter, outerCenter, outerLength, innerLength, outerWidth, innerWidth = null;
    const temporaryInitialVals = {parent, _TEMPORARY: true};
    Object.getSet(this, temporaryInitialVals);
    Object.getSet(this, {divideRight: false}, 'divider', 'parentAssembly', 'cover');
    const instance = this;
    let pattern;

    this.coordinates = () => coordinates;
    this.partCode = () => 'sp';
    this.part = () => false;
    this.included = () => false;
    this.joints = [];
    this.subassemblies = [];
    this.vertical = (is) => !instance.value('vertical', is);
    this.vertical(true);
    this.isVertical = () => this.sections.length < 2 ? undefined : this.vertical();
    this.verticalDivisions = () => {
      const parent = this.parentAssembly();
      if (parent instanceof SectionProperties) return parent.isVertical();
      return false;
    }
    this.rotation = () => {
      if (config.rotation === undefined || config._Type === 'part-code') return {x:0,y:0,z:0};
      if (rotation === null) rotation = this.getRoot().evalObject(config.rotation);
      return JSON.copy(rotation);
    }

    this.getCabinet = () => {
      const root = this.getRoot();
      return root.constructor.name === 'Cabinet' ? root : undefined;
    }

    this.innerDepth = () => {
      const cabinet = this.getCabinet();
      if (cabinet && (config.rotation === undefined || config._Type === 'part-code'))
        return cabinet.getAssembly(config.back).position().centerAdjust('z', '-z');
      return 30;
    };

    function offsetCenter(center, left, right, up, down, forward, backward) {
        const offset = {
          x: (right - left) / 2,
          y: (up - down) / 2,
          z: (forward - backward) / -2
        }
        return CSG.transRotate(center, offset, instance.rotation());
    }

    function offsetPoint(point, x, y, z) {
      const offset = {x,y,z};
      return CSG.transRotate(point, offset, instance.rotation());
    }
    this.offsetPoint = offsetPoint;

    function init () {
      if (instance.sections.length === 0) {
        instance.sections.push(new SectionProperties({rotation: config.rotation, back: config.back}));
      }
      return true;
    }
    this.dividerCount = () => this.sections.length - 1;
    this.sectionCount = () => this.sections.length;
    this.children = () => this.sections;
    this.getSubassemblies = () => {
      const assems = Object.values(this.sections);
      const cover = this.cover()
      if (cover) assems.concatInPlace(cover.getSubassemblies());
      if (this.divideRight()) assems.concatInPlace(this.divider().getSubassemblies());
      for (let index = 0; index < this.sections.length; index++) {
        assems.concatInPlace(this.sections[index].getSubassemblies());
      }
      return assems;
    }

    this.propertyConfig = () => this.getCabinet().propertyConfig();

    this.getAssembly = (partCode, callingAssem) => {
      if (callingAssem === this) return undefined;
      if (this.partCode() === partCode) return this;
      if (this.subassemblies[partCode]) return this.subassemblies[partCode];
      if (callingAssem !== undefined) {
        const children = Object.values(this.subassemblies);
        for (let index = 0; index < children.length; index += 1) {
          const assem = children[index].getAssembly(partCode, this);
          if (assem !== undefined) return assem;
        }
      }
      if (this.parentAssembly() !== undefined && this.parentAssembly() !== callingAssem)
        return this.parentAssembly().getAssembly(partCode, this);
      return undefined;
    }

    function makePlane1ToMeetPlane2(plane1, plane2, rotation) {
      const rotated1 = CSG.reverseRotate(plane1, rotation);
      const rotated2 = CSG.reverseRotate(plane2, rotation);
      const center1 = Vertex3D.center(rotated1);
      if (approximate.eq(center1.z, 0)) throw new Error('Invalid planeRotation: Rotation reversed should make plane1.z === 0');
      const keep1 = [];
      const keep2 = [];
      const intersections = [];
      const plane2Line2d = Line2d.combine(new Line2d(rotated2[0], rotated2[1]), new Line2d(rotated2[2], rotated2[3]));
      const p2l2Midpoint = plane2Line2d.midPoint();
      const len = plane1.length;
      let keep = keep1;
      for (let index = 0; index < plane1.length; index++) {
        const nextIndex = (index + 1) % len;
        const prevIndex = (index + 1) % len;
        const positiveLine = new Line2d(plane1[nextIndex], plane1[index]);
        const negativeLine = new Line2d(plane1[prevIndex], plane1[index]);
        const intersection1 = plane2Line2d.findDirectionalIntersection(positiveLine);
        const intersection2 = plane2Line2d.findDirectionalIntersection(negativeLine);
        if (intersections.length > 0) keep = keep2;
        if (!intersection1 && !intersection2) keep.push(plan1[index]);
        else if (!intersection1) intersections.push(intersection2);
        else if (!intersection2) intersections.push(intersection1);
        else {
          const dist1 = p2l2Midpoint.distance(intersection1);
          const dist2 = p2l2Midpoint.distance(intersection2);
          intersections.push(dist1 > dist2 ? intersection1 : intersection2);
        }
      }
      plane1.removeAll();
      plane1.concat(keep1.concat(intersections).concat(keep2));
    }

    // function updateDividerCoordinates(section, patVal, dividerOffsetInfo) {
    //   const pos = section.position();
    //   const dOffset = dividerOffsetInfo[index];
    //   const widthOffset = section.maxWidth() / 2;
    //   const divideCenter = dOffset + patVal + widthOffset;
    //   pos.depth = instance.innerDepth();
    //   if (instance.vertical()) {
    //     pos.center = {y: divideCenter};
    //     pos.center.x = instance.innerCenter().x;
    //     pos.length = instance.innerWidth();
    //   } else {
    //     pos.center = {x: divideCenter};
    //     pos.center.y = instance.innerCenter().y;
    //     pos.length = instance.innerLength();
    //   }
    //   pos.center.z = pos.depth / 2
    //
    // }

    function updatdSectionPropertiesCoordinates(section, startOuter, startInner, endInner, endOuter) {
      const coords = {};
      const outer = instance.coordinates().outer;
      const inner = instance.coordinates().inner;
      if (instance.vertical()) {
        coords.outer = [{x: outer[0].x, y: endOuter, z: outer[0].z},
                        {x: outer[1].x, y: endOuter, z: outer[1].z},
                        {x: outer[2].x, y: startOuter, z: outer[2].z},
                        {x: outer[3].x, y: startOuter, z: outer[3].z}];
        coords.inner = [{x: inner[0].x, y: endInner, z: inner[0].z},
                        {x: inner[1].x, y: endInner, z: inner[1].z},
                        {x: inner[2].x, y: startInner, z: inner[2].z},
                        {x: inner[3].x, y: startInner, z: inner[3].z}];
      } else {
        coords.outer = [{y: outer[0].y, x: startOuter, z: outer[0].z},
                        {y: outer[1].y, x: endOuter, z: outer[1].z},
                        {y: outer[2].y, x: endOuter, z: outer[2].z},
                        {y: outer[3].y, x: startOuter, z: outer[3].z}];
        coords.inner = [{y: inner[0].y, x: startInner, z: inner[0].z},
                        {y: inner[1].y, x: endInner, z: inner[1].z},
                        {y: inner[2].y, x: endInner, z: inner[2].z},
                        {y: inner[3].y, x: startInner, z: inner[3].z}];
      }
      section.updateCoordinates(coords);
    }

    function setSectionCoordinates() {
      const vertical = instance.vertical();
      const dividerOffsetInfo = instance.dividerOffsetInfo();
      const revealOffsetInfo = instance.revealOffsetInfo();
      const isReveal = instance.propertyConfig().isReveal();
      let distance = isReveal ?
              (vertical ? instance.outerLength() : instance.outerWidth()) :
              (vertical ? instance.innerLength() : instance.innerWidth());
      if (revealOffsetInfo.length > 1) {
        distance -= revealOffsetInfo._TOTAL;
        const patternInfo = instance.pattern().calc(distance);

        let offset = instance.coordinates().inner[3][vertical ? 'y' : 'x'];
        for (let index = 0; index < instance.sections.length; index++) {
          const section = instance.sections[index];
          const patVal = patternInfo.list;
          const startOuter = offset;
          const startInner = startOuter + revealOffsetInfo[index].offset/2;
          const endInner = startInner + patVal[!vertical ? index : instance.sections.length - index - 1];
          const endOuter = endInner + revealOffsetInfo[index + 1].offset / 2;
          if (index < instance.sections.length - 1) section.divideRight(true);
          updatdSectionPropertiesCoordinates(section, startOuter, startInner, endInner, endOuter);
          offset = endOuter;
        }
      }
    }

    this.revealOffsetInfo = () => {
      const info = [{offset: 0}];
      info._TOTAL = 0;
      const propConfig = this.propertyConfig();
      for (let index = 0; index < this.sections.length; index += 1) {
        const section = this.sections[index];
        let offset = 0;
        if (index < this.sections.length - 1) {
          const divider = section.divider();
          if (propConfig.isReveal()) {
            if (offset === 0) offset += propConfig.reveal().r.value();
            offset += propConfig.reveal().r.value();
          }  else if (propConfig.isInset()) {
            const insetValue = propConfig('Inset').is.value();
            offset += divider.maxWidth() + insetValue * 2;
          } else {
            offset += divider.maxWidth();
            offset -= propConfig.overlay() * 2;
          }
          info[index + 1] = {offset, divider};
        } else {
          info[index + 1] = {offset};
        }
        info._TOTAL += offset;
      }
      return info;
    }

    this.dividerOffsetInfo = () => {
      const info = [];
      let offset = this.isVertical() ? this.outerLength() : this.outerWidth();
      const propConfig = this.propertyConfig();
      for (let index = 0; index < this.sections.length; index += 1) {
        const section = this.sections[index];
        if (index < this.sections.length - 1) {
          const divider = section.divider();
          const maxWidth = divider.maxWidth();
          let halfReveal;
          if (propConfig.isReveal()) {
            halfReveal = propConfig.reveal().r.value() / 2;
          } else if (propConfig.isInset()) {
            const insetValue = propConfig('Inset').is.value();
            halfReveal = (divider.maxWidth() + insetValue * 2) / 2;
          } else {
            halfReveal = (maxWidth - propConfig.overlay() * 2)/2;
          }
          info[index] = {offset, divider};
          offset = offset + index < this.sections.length - 1 ? halfReveal*2 : halfReveal;
        } else {
          info[index] = {offset};
        }
      }
      return info;
    }

    this.divide = (dividerCount) => {
      init();
      if (!Number.isNaN(dividerCount) && dividerCount !== this.dividerCount()) {
        dividerCount = dividerCount > 10 ? 10 : dividerCount;
        dividerCount = dividerCount < 0 ? 0 : dividerCount;
        const currDividerCount = this.dividerCount();
        if (dividerCount < currDividerCount) {
          const diff = currDividerCount - dividerCount;
          this.sections.splice(dividerCount + 1);
          setSectionCoordinates();
          return true;
        } else {
          const diff = dividerCount - currDividerCount;
          for (let index = currDividerCount; index < dividerCount; index +=1) {
            const section = new SectionProperties({rotation: config.rotation, back: config.back});
            this.sections.push(section);
          }
          if (diff !== 0) setSectionCoordinates();
          return diff !== 0;
        }
      }
      return false;
    }

    this.pattern = (patternStr) => {
      if ((typeof patternStr) === 'string') {
        const sectionCount = patternStr.length;
        this.divide(sectionCount - 1);
        pattern = new Pattern(patternStr);
      } else {
        if (!pattern || pattern.str.length !== this.sectionCount())
          pattern = new Pattern(new Array(this.sectionCount()).fill('a').join(''));
      }
      return pattern;
    }

    this.dividerLayout = () => {
      let distance;
      const coverable = this.coverable();
      distance = this.vertical() ? coverable.dems.x : coverable.dems.y;
      distance -= this.dividerReveal();
      return this.pattern().calc(distance);
    };

    this.outerCenter = () => {
      if (outerCenter === null) outerCenter = Vertex3D.center(coordinates.outer);
      return outerCenter;
    }

    this.innerCenter = () => {
      if (innerCenter === null) innerCenter = Vertex3D.center(coordinates.inner);
      return innerCenter;
    }

    this.outerLength = () => {
      if (outerLength === null)
        outerLength = coordinates.outer[0].distance(coordinates.outer[3]);
      return outerLength;
    }

    this.outerWidth = () => {
      if (outerWidth === null)
        outerWidth = coordinates.outer[0].distance(coordinates.outer[1]);
      return outerWidth;
    }

    this.innerLength = () => {
      if (innerLength === null)
        innerLength = coordinates.inner[0].distance(coordinates.inner[3]);
      return innerLength;
    }

    this.innerWidth = () => {
      if (innerWidth === null)
        innerWidth = coordinates.inner[0].distance(coordinates.inner[1]);
      return innerWidth;
    }

    this.longestRadius = () => {
      const oc = this.outerCenter();
      let max = oc.distance(outerCoordinates[0]);
      for (let index = 1; index < outerCoordinates.length; index++) {
        const dist = oc.distance(coordinates.outer[index]);
        if (dist > max) max = dist;
      }
      return max;
    };

    this.coverInfo = () => {
      const propConfig = this.propertyConfig();
      let center, length, width;
      const doorThickness = 3 * 2.54/4;
      const bumperThickness = 3 * 2.54 / 16;
      const bumperOffset = bumperThickness * - 2
      if (propConfig.isInset()) {
        const offset = propConfig('Inset').is.value();
        const negOffset = -1 * offset;
        const projection = 3 * 2.54/64;
        const zOffset = (projection - doorThickness) / 2;
        center = offsetCenter(this.innerCenter(), 0, 0, 0, 0, zOffset, projection);
        length = this.innerLength() - 2*offset;
        width = this.innerWidth() - 2*offset;
      } else if (propConfig.isReveal()) {
        const offset =propConfig.reveal().r.value() / 2;
        const negOffset = -1 * offset;
        const projection = 3 * 2.54/64;
        center = offsetCenter(this.outerCenter(), 0, 0, 0, 0, doorThickness, bumperOffset);
        length = this.outerLength() - 2*offset;
        width = this.outerWidth() - 2*offset;
      } else {
        const offset = propConfig.overlay();
        const negOffset = -1 * offset;
        center = offsetCenter(this.innerCenter(), 0, 0, 0, 0, doorThickness, bumperOffset);
        length = this.innerLength() + 2*offset;
        width = this.innerWidth() + 2*offset;
      }

      return {center, doorThickness, length, width, rotation};
    }

    this.dividerInfo = () => {
      const depth = this.innerDepth();
      const length = this.innerLength();
      const width = this.innerWidth();
      const innerCenter = this.innerCenter();
      if (this.verticalDivisions()) {
        const topCenter = Vertex3D.center(coordinates.inner[0],coordinates.inner[1]);
        const point1 = offsetCenter(topCenter, width*2, 0, 0, 0, 0, 0);
        const point4 = offsetCenter(topCenter, -width*2, 0, 0, 0, 0, 0);
        const point2 = offsetCenter(point1, 0,0,0,0,0,depth*2);
        const point3 = offsetCenter(point4, 0,0,0,0,0,depth*2);
        const center = Vertex3D.center(point1, point2, point3, point4);
        return {center, length: width, width: depth};
      }
      const rightCenter = Vertex3D.center(coordinates.inner[1],coordinates.inner[2]);
      const point1 = offsetCenter(rightCenter, 0, 0, length*2, 0, 0, 0);
      const point4 = offsetCenter(rightCenter, 0, 0, length*-2, 0, 0, 0);
      const point2 = offsetCenter(point1, 0,0,0,0,0,depth*2);
      const point3 = offsetCenter(point4, 0,0,0,0,0,depth*2);
      const center = Vertex3D.center(point1, point2, point3, point4);
      return {center, length: length, width: depth};
    }

    const assemToJson = this.toJson;
    this.toJson = () => {
      const json = assemToJson.apply(this);
      json.pattern = this.pattern().toJson();
      json.subassemblies = this.sections.map((section) => section.toJson());
      return json;
    }

    function removeCachedValues() {
      rotation = innerCenter = outerCenter = innerLength = innerWidth = outerLength = outerWidth = null;
      setSectionCoordinates();
    }

    function updateCoordinates(obj, newCoords) {
      let change = false;
      for (let i = 0; i < 4; i++) {
        const v = obj[i];
        const nv = newCoords[i];
        if (v.x !== nv.x || v.y !== nv.y || v.z !== nv.z) change = true;
        v.x = nv.x;
        v.y = nv.y;
        v.z = nv.z;
      }
      return change
    }

    this.updateCoordinates = (newCoords) => {
      let change = updateCoordinates(coordinates.outer, newCoords.outer) | updateCoordinates(coordinates.inner, newCoords.inner);
      if (change) {
        removeCachedValues();
      }
    }

    this.setSection = (constructorIdOobject) => {
      let section;
      this.cover(SectionProperties.new(constructorIdOobject, this));
    }

    this.divider(new DividerSection('divider', this));
    coordinates.onAfterChange(setSectionCoordinates);
  }
}

const list = [];
const byId = {};
const tolerance = .04
SectionProperties.updateLinks = (sectionProp) => {
  const id = sectionProp.id();
  if (byId[id] === undefined) {
    byId[id] = sectionProp;
    list.push(sectionProp);
  }
  sectionProp.clearDirections();
  const sectRad = section.longestRadius();
  const sectionOuterCenter = sectionProp.outerCenter();
  const centerDist = {};
  for (let index = 0; index < list.length; index++) {
    if (!other.rotation().equals(this.rotation()))  {
      const other = list[index];
      const otherRad = other.longestRadius();
      const centerDist = sectionOuterCenter.distance(other.outerCenter());
      if (centerDist - tolerance < otherRad + sectRad) {
        const direction = Vertex3D.direction(sectionProp.outerCoordinates(), other.outerCoordinates(), tolerance, true);
        if (direction) {
          if (sectionProp[direction]() === undefined || centerDist < centerDistObj[distance]) {
            sectionProp[direction](other);
            centerDistObj[distance] = centerDist;
          }
        }
      }
    }
  }
}

SectionProperties.new = function (constructorId) {
  const section = Assembly.new.apply(null, arguments);
  return section;
}

module.exports = SectionProperties;
