
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
    let pattern;

    this.partCode = () => {
      const oreintation = this.vertical() ? 'V' : 'H';
      if (index === 0) return oreintation;
      const pPartCode = this.parentAssembly().partCode();
      return `${pPartCode}${index}${this.sections.length > 1 ? oreintation : ''}`;
    }
    this.coordinates = () => JSON.clone(coordinates);
    this.reverseInner = () => CSG.reverseRotateAll(this.coordinates().inner);
    this.reverseOuter = () => CSG.reverseRotateAll(this.coordinates().outer);
    this.part = () => false;
    this.included = () => false;
    this.joints = [];
    this.subassemblies = [];
    this.vertical = (is) =>
        instance.value('vertical', is);
    this.vertical(false);
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
        instance.sections.push(new SectionProperties({rotation: config.rotation, back: config.back, flipNormal: config.flipNormal}, 1));
      }
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

    function updatdSectionPropertiesCoordinates(section, startOuter, startInner, endInner, endOuter, innerOffset) {
      const coords = {};
      instance.getRoot().openings[0].update();
      const fresh = instance.coordinates();
      const outer = fresh.outer;
      const inner = fresh.inner;
      const rotation = instance.rotation();
      if (!instance.vertical()) {
        const leftOutLine = new Line3D(outer[3], outer[0]);
        const leftInnerLine = new Line3D(inner[3], inner[0]);
        const rightOutLine = new Line3D(outer[2], outer[1]);
        const rightInnerLine = new Line3D(inner[2], inner[1]);
        coords.outer = [leftOutLine.pointAtDistance(endOuter),
                        rightOutLine.pointAtDistance(endOuter),
                        rightOutLine.pointAtDistance(startOuter),
                        leftOutLine.pointAtDistance(startOuter)];
        coords.inner = [leftInnerLine.pointAtDistance(endInner - innerOffset),
                        rightInnerLine.pointAtDistance(endInner - innerOffset),
                        rightInnerLine.pointAtDistance(startInner - innerOffset),
                        leftInnerLine.pointAtDistance(startInner - innerOffset)];

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

    function setSectionCoordinates() {
      instance.getRoot().openings[0].update();
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
         startOffset = perpendicularDistance(outer[0], new Line3D(inner[0], inner[1]));
         endOffset = perpendicularDistance(outer[1], new Line3D(inner[0], inner[1]));
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
            const section = new SectionProperties({rotation: config.rotation, back: config.back, flipNormal: config.flipNormal}, index + 2);
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
      this.getRoot().openings[0].update();
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

      const offsetObj = {x: offset, y: offset};
      if (config.flipNormal) {
        frontOffset *= -1;
        backOffset *= -1;
      }
      biPolygon = BiPolygon.fromPolygon(new Polygon3D(coords), frontOffset, backOffset, offsetObj, config.flipNormal);
      return {biPolygon};
    }

    this.dividerInfo = (panelThickness) => {
      const depth = this.innerDepth() * (config.flipNormal ? 1 : -1);
      const length = this.innerLength();
      const width = this.innerWidth();
      const innerCenter = this.innerCenter();
      const coordinates = this.coordinates();
      if (!this.verticalDivisions()) {
        const outer = coordinates.outer;
        const point1 = outer[0];
        const point2 = outer[1];
        let depthVector = new Polygon3D(outer).normal();
        depthVector = depthVector.scale(depth);
        const point3 = outer[1].translate(depthVector, true);
        const point4 = outer[0].translate(depthVector, true);
        const points = [point1, point2, point3, point4];
        const offset = panelThickness / (config.flipNormal ? -2 : 2);
        return BiPolygon.fromPolygon(new Polygon3D(points), offset, -offset, null, config.flipNormal);
      }
      const outer = coordinates.outer;
      const point1 = outer[1];
      const point2 = outer[2];
      let depthVector = new Polygon3D(outer).normal();
      depthVector = depthVector.scale(depth);
      const point3 = point2.translate(depthVector, true);
      const point4 = point1.translate(depthVector, true);
      const points = [point1, point2, point3, point4];
      const offset = panelThickness / (config.flipNormal ? -2 : 2);
      return BiPolygon.fromPolygon(new Polygon3D(points), offset, -offset, null, config.flipNormal);
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

module.exports = SectionProperties;
