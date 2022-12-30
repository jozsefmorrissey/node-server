
const Vertex3D = require('../../../../three-d/objects/vertex.js');
const Polygon3D = require('../../../../three-d/objects/polygon.js');
const Line3D = require('../../../../three-d/objects/line.js');
const Plane = require('../../../../three-d/objects/plane.js');
const BiPolygon = require('../../../../three-d/objects/bi-polygon.js');
const KeyValue = require('../../../../../../../public/js/utils/object/key-value.js');
const Notification = require('../../../../../../../public/js/utils/collections/notification.js');
const Assembly = require('../../assembly.js');
const CSG = require('../../../../../public/js/3d-modeling/csg.js');
const DividerSection = require('./partition/divider.js');
const Pattern = require('../../../../division-patterns.js');

const v = () => new Vertex3D();
class SectionProperties extends KeyValue{
  constructor(config, index) {
    super({childrenAttribute: 'sections', parentAttribute: 'parentAssembly'})

    index ||= 0;
    this.index = () => index;
    const coordinates = {inner: [v(),v(),v(),v()], outer: [v(),v(),v(),v()]};
    let rotation, innerCenter, outerCenter, outerLength, innerLength, outerWidth, innerWidth = null;
    const temporaryInitialVals = {parent, _TEMPORARY: true};
    Object.getSet(this, temporaryInitialVals);
    Object.getSet(this, {divideRight: false}, 'divider', 'parentAssembly', 'cover');
    const instance = this;
    let pattern = new Pattern('a');

    this.divideRight = () =>
      this.parentAssembly().sectionCount && this.parentAssembly().sectionCount() !== index;
    this.partCode = () => 'S';
    this.partName = () => {
      const orientation = this.vertical() ? 'V' : 'H';
      if (!(this.parentAssembly() instanceof SectionProperties)) return orientation;
      const pPartName = this.parentAssembly().partName();
      return `${pPartName}${index}.${orientation}`;
    }

    this.outerPoly = () => new Polygon3D(this.coordinates().outer);
    this.innerPoly = () => new Polygon3D(this.coordinates().inner);
    this.coordinates = () => JSON.clone(coordinates);
    this.reverseInner = () => CSG.reverseRotateAll(this.coordinates().inner);
    this.reverseOuter = () => CSG.reverseRotateAll(this.coordinates().outer);
    this.part = () => false;
    this.included = () => false;
    this.joints = [];
    this.coverType = () => this.cover() && this.cover().constructor.name;
    this.subassemblies = [];
    this.vertical = (is) => {
      const curr = instance.value('vertical', is);
      if (is !== undefined && curr !== is) removeCachedValues();
      return curr;
    }
    this.isVertical = () => this.sections.length < 2 ? undefined : this.vertical();
    this.verticalDivisions = () => {
      const parent = this.parentAssembly();
      if (parent instanceof SectionProperties) return parent.isVertical();
      return false;
    }
    this.rotation = () => {
      if (config.rotation === undefined || config._Type === 'part-code') return {x:0,y:0,z:0};
      if (true || rotation === null) rotation = this.getRoot().evalObject(config.rotation);
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
      // TODO: access Variable.
      return 4*2.54;
    };

    function offsetCenter(center, left, right, up, down, forward, backward) {
      center = JSON.copy(center);
      const offset = {
        x: (right - left) / 2,
        y: (up - down) / 2,
        z: (forward - backward) / 2
      }
      const rotated = CSG.rotatePointAroundCenter(instance.rotation(), offset, {x:0,y:0, z:0});

      return {x: center.x + rotated.x, y: center.y + rotated.y, z: center.z + rotated.z};
    }

    function offsetRotatedPoint(point, x, y, z, rotation) {
      rotation ||= instance.rotation();
      point = JSON.copy(point);
      const originalPosition = CSG.reverseRotate(point, rotation);
      originalPosition.x += x;
      originalPosition.y += y;
      originalPosition.z += z;
      return CSG.rotate(originalPosition, rotation);
    }
    this.offsetRotatedPoint = offsetRotatedPoint;
    this.transRotate = CSG.transRotate;

    function offsetPoint(point, x, y, z) {
      const offset = {x,y,z};
      return CSG.transRotate(point, offset, instance.rotation());
    }
    this.offsetPoint = offsetPoint;

    function init () {
      if (instance.sections.length === 0) {
        instance.sections.push(new SectionProperties({rotation: config.rotation, back: config.back}, 1));
      }
    }

    this.init = init;
    this.dividerCount = () => this.sections.length - 1;
    this.sectionCount = () => this.sections.length || 1;
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

    function updatdSectionPropertiesCoordinates(section, startOuter, startInner, endInner, endOuter, innerOffset) {
      const coords = {};
      const fresh = instance.coordinates();
      const outer = fresh.outer;
      const inner = fresh.inner;
      const rotation = instance.rotation();
      if (!instance.vertical()) {
        const leftOutLine = new Line3D(outer[0], outer[3]);
        const leftInnerLine = new Line3D(inner[0], inner[3]);
        const rightOutLine = new Line3D(outer[1], outer[2]);
        const rightInnerLine = new Line3D(inner[1], inner[2]);
        coords.outer = [leftOutLine.pointAtDistance(startOuter),
                        rightOutLine.pointAtDistance(startOuter),
                        rightOutLine.pointAtDistance(endOuter),
                        leftOutLine.pointAtDistance(endOuter)];
        coords.inner = [
                        leftInnerLine.pointAtDistance((startInner - innerOffset)),
                        rightInnerLine.pointAtDistance((startInner - innerOffset)),
                        rightInnerLine.pointAtDistance((endInner - innerOffset)),
                        leftInnerLine.pointAtDistance((endInner - innerOffset))
                                    ];


      } else {
        const topOutLine = new Line3D(outer[0], outer[1]);
        const topInnerLine = new Line3D(inner[0], inner[1]);
        const bottomOutLine = new Line3D(outer[3], outer[2]);
        const bottomInnerLine = new Line3D(inner[3], inner[2]);
        coords.outer = [topOutLine.pointAtDistance(startOuter),
                        topOutLine.pointAtDistance(endOuter),
                        bottomOutLine.pointAtDistance(endOuter),
                        bottomOutLine.pointAtDistance(startOuter)];
        coords.inner = [topInnerLine.pointAtDistance(startInner - innerOffset),
                        topInnerLine.pointAtDistance(endInner - innerOffset),
                        bottomInnerLine.pointAtDistance(endInner - innerOffset),
                        bottomInnerLine.pointAtDistance(startInner - innerOffset)];
      }
      section.updateCoordinates(coords);
    }

    this.dividerLayout = () => {
      init();
      const dividerOffsetInfo = instance.dividerOffsetInfo();
      const coverage = instance.coverage(dividerOffsetInfo.startOffset, dividerOffsetInfo.endOffset);
      return instance.pattern().calc(coverage._TOTAL);
    }

    function setSectionCoordinates() {
      const dividerOffsetInfo = instance.dividerOffsetInfo();
      const coverage = instance.coverage(dividerOffsetInfo.startOffset, dividerOffsetInfo.endOffset);

      if (coverage.length > 1) {
        const patternInfo = instance.pattern().calc(coverage._TOTAL);

        let offset = 0;
        const innerOffset = dividerOffsetInfo[0].offset;
        for (let index = 0; index < instance.sections.length; index++) {
          const section = instance.sections[index];
          const patVal = patternInfo.list;
          const overlayOffset = coverage[index * 2].overlay + coverage[index * 2 + 1].overlay;
          let startOuter, startInner, endInner, endOuter;

          startOuter = offset;
          if (index === 0) startInner = startOuter + dividerOffsetInfo[index].offset;
          else startInner = startOuter + dividerOffsetInfo[index].offset/2;


          endInner = startInner + patVal[index] - overlayOffset;
          if (index === instance.sections.length - 1) endOuter = endInner + dividerOffsetInfo[index + 1].offset;
          else endOuter = endInner + dividerOffsetInfo[index + 1].offset / 2;
          if (index < instance.sections.length - 1) section.divideRight(true);
          updatdSectionPropertiesCoordinates(section, startOuter, startInner, endInner, endOuter, innerOffset);
          offset = endOuter;
        }
      }
    }

    function perpendicularDistance(point, line) {
      if (instance.sectionCount() !== 0) {
        const plane = Plane.fromPointNormal(point, line.vector());
        const intersection = plane.lineIntersection(line);
        const distance = line.startVertex.distance(intersection);
        return distance;
      }
      return 0;
    }

    this.coverage = (startOffset, endOffset) => {
      const info = [];
      const propConfig = this.propertyConfig();
      const isReveal = propConfig.isReveal();
      const isInset = propConfig.isInset();
      const vertical = instance.vertical();
      info._TOTAL = isReveal ?
              (!vertical ? instance.outerLength() : instance.outerWidth()) :
              (!vertical ? instance.innerLength() : instance.innerWidth());

      let overlay, reveal, insetValue;
      if (isReveal) reveal = propConfig.reveal().r.value();
      else if (propConfig.isInset()) insetValue = propConfig('Inset').is.value();
      else overlay = propConfig.overlay();

      for (let index = 0; index < this.sections.length * 2; index += 1) {
        const section = this.sections[Math.ceil((index - 1)/2)];
        let offset = 0;
        const divider = section.divider();
        if (isReveal) {
          if (index % 2 === 0) {
            if (index === 0) info._TOTAL -= reveal;
            else info._TOTAL -= reveal;
          }
          if (index === 0) info.push({overlay: startOffset - reveal / 2});
          if (index === this.sections.length - 1) info.push({overlay: endOffset - reveal / 2});
          else info.push({overlay: (divider.maxWidth() - reveal)/2});
        }  else if (isInset) {
          if (index % 2 === 0) {
            if (index === this.sections.length * 2 - 2) info._TOTAL -= insetValue * 2;
            else info._TOTAL -= (divider.maxWidth() + insetValue * 2);
          }
          info.push({overlay: -insetValue});
        } else {
          if (index % 2 === 0) {
            if (index === this.sections.length * 2 - 2) info._TOTAL += overlay * 2;
            else info._TOTAL += overlay * 2 - divider.maxWidth();
          }
          info.push({overlay: overlay});
        }
      }
      return info;
    }

    this.dividerOffsetInfo = () => {
      let startOffset = 0;
      let endOffset = 0;

      const coords = this.coordinates();
      const outer = coords.outer;
      const inner = coords.inner;
      if (this.vertical()) {
         startOffset = perpendicularDistance(outer[3], new Line3D(inner[3], inner[2]));
         endOffset = perpendicularDistance(outer[2], new Line3D(inner[2], inner[3]));
       } else {
         startOffset = perpendicularDistance(outer[0], new Line3D(inner[0], inner[3]));
         endOffset = perpendicularDistance(outer[3], new Line3D(inner[3], inner[0]));
       }
       const info = [{offset: startOffset}];
       info.startOffset = startOffset;
       info.endOffset = endOffset;

      let offset = this.isVertical() ? this.outerLength() : this.outerWidth();
      const propConfig = this.propertyConfig();
      for (let index = 0; index < this.sections.length; index += 1) {
        if (index < this.sections.length - 1) {
          const section = this.sections[index];
          const divider = section.divider();
          const offset = divider.maxWidth();
          info[index + 1] = {offset, divider};
        } else {
          info[index + 1] = {offset: endOffset};
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
            const section = new SectionProperties({rotation: config.rotation, back: config.back}, index + 2);
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
        pattern = pattern.clone(patternStr);
        this.divide(sectionCount - 1);
      } else {
        if (!pattern || pattern.str.length !== this.sectionCount()) {
          const patStr = new Array(this.sectionCount()).fill('a').join('');
          pattern = pattern.clone(patStr);
        }
      }
      return pattern;
    }

    this.outerCenter = () => {
      if (true || outerCenter === null) outerCenter = Vertex3D.center(coordinates.outer);
      return outerCenter;
    }

    this.innerCenter = () => {
      if (true || innerCenter === null) innerCenter = Vertex3D.center(coordinates.inner);
      return innerCenter;
    }

    this.outerLength = () => {
      if (true || outerLength === null)
        outerLength = coordinates.outer[0].distance(coordinates.outer[3]);
      return outerLength;
    }

    this.outerWidth = () => {
      if (true || outerWidth === null)
        outerWidth = coordinates.outer[0].distance(coordinates.outer[1]);
      return outerWidth;
    }

    this.innerLength = () => {
      if (true || innerLength === null)
        innerLength = coordinates.inner[0].distance(coordinates.inner[3]);
      return innerLength;
    }

    this.innerWidth = () => {
      if (true || innerWidth === null)
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
      let biPolygon, backOffset, frontOffset, offset, coords;
      const doorThickness = 3 * 2.54/4;
      const bumperThickness = 3 * 2.54 / 16;
      if (propConfig.isInset()) {
        coords = this.coordinates().inner;
        offset = propConfig('Inset').is.value() * -2;
        const projection = 3 * 2.54/64;
        frontOffset = projection;
        backOffset = projection - doorThickness;
      } else if (propConfig.isReveal()) {
        coords = this.coordinates().outer;
        offset = -propConfig.reveal().r.value();
        frontOffset = (doorThickness + bumperThickness);
        backOffset = bumperThickness;
      } else {
        coords = this.coordinates().inner;
        offset = propConfig.overlay();
        frontOffset = (doorThickness + bumperThickness);
        backOffset = bumperThickness;
      }

      frontOffset *= -1;
      backOffset *= -1;
      const offsetObj = {x: offset, y: offset};
      biPolygon = BiPolygon.fromPolygon(new Polygon3D(coords), frontOffset, backOffset, offsetObj);
      return {biPolygon, frontOffset, backOffset};
    }

    this.dividerInfo = (panelThickness) => {
      const coverInfo = this.coverInfo();
      const normal = coverInfo.biPolygon.normal().inverse();
      const depth = this.innerDepth();
      const length = this.innerLength();
      const width = this.innerWidth();
      const innerCenter = this.innerCenter();
      const coordinates = this.coordinates();
      if (!this.verticalDivisions()) {
        const outer = coordinates.outer;
        const point1 = outer[3];
        const point2 = outer[2];
        let depthVector = normal.scale(depth);
        const point3 = point2.translate(depthVector, true);
        const point4 = point1.translate(depthVector, true);
        const points = [point1, point2, point3, point4];
        const offset = panelThickness / 2;
        return BiPolygon.fromPolygon(new Polygon3D(points), offset, -offset);
      }
      const outer = coordinates.outer;
      const point1 = outer[1];
      const point2 = outer[2];
      let depthVector = normal.scale(depth);
      const point3 = point2.translate(depthVector, true);
      const point4 = point1.translate(depthVector, true);
      const points = [point1, point2, point3, point4];
      const offset = panelThickness / -2;
      return BiPolygon.fromPolygon(new Polygon3D(points), offset, -offset);
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
        setSectionCoordinates();
      }
    }

    this.setSection = (constructorIdOobject) => {
      let section = SectionProperties.new(constructorIdOobject, this);
      this.cover(section);
      section.parentAssembly(this);
    }

    const divider = new DividerSection(this);
    divider.parentAssembly(this);
    this.divider(divider);
    this.value('vertical', true);
    this.pattern().onChange(setSectionCoordinates);
    // this.vertical(true);
    // coordinates.onAfterChange(setSectionCoordinates);
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

const sections = [];
SectionProperties.addSection = (clazz) => sections.push(clazz);
SectionProperties.list = () => [].concat(sections);

module.exports = SectionProperties;
