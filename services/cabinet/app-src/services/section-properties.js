
const Vertex3D = require('vertex');

class SectionProperties {
  constructor(coordinates, rotation, cabinet) {
    let inner, outer, outerLength, innerLength, outerWidth, innerWidth = null;
    this.sections = [];

    this.coordinates = () => coordinates;

    function offsetCenter(center, left, right, up, down, forward, backward) {
        const offset = {
          x: (right - left) / 2,
          y: (up - down) / 2,
          z: (forward - backward) / 2
        }
        return CSG.transRotate(center, offset, rotation);
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

    function updateDividerCoordinates(section, patVal) {
      const pos = section.position();
      const dOffset = dividerOffsetInfo[index];
      const widthOffset = dividerOffsetsection.width / 2;
      const divideCenter = dOffset + patVal + widthOffset;
      pos.depth = this.innerDepth();
      if (this.vertical()) {
        pos.center = {y: dividerCenter};
        pos.center.x = this.innerCenter().x;
        pos.length = this.innerWidth();
      } else {
        pos.center = {x: dividerCenter};
        pos.center.y = this.innerCenter().y;
        pos.length = this.innerLength();
      }
      pos.center.z = pos.depth / 2

    }

    function updatdSectionPropertiesCoordinates(section, patVal) {
      const coords = section.coordinates();
      if (this.vertical()) {
        const yOutTop = revealOffsetInfo[index] + patVal[index];
        const yOutBottom = revealOffsetInfo[index] + patVal[index + 1];
        coords.outer[0] = {x: outer[0].x, y: yOutTop};
        coords.outer[1] = {x: outer[1].x, y: yOutTop};
        coords.outer[2] = {x: outer[2].x, y: yOutBottom};
        coords.outer[3] = {x: outer[3].x, y: yOutBottom};
        const yInTop = revealOffsetInfo[index] + patVal[index];
        const yInBottom = revealOffsetInfo[index] + patVal[index + 1];
        coords.inner[0] = {x: outer[0].x, y: yInTop};
        coords.inner[1] = {x: outer[1].x, y: yInTop};
        coords.inner[2] = {x: outer[2].x, y: yInBottom};
        coords.inner[3] = {x: outer[3].x, y: yInBottom};
      } else {
        const xOutTop = revealOffsetInfo[index] + patVal[index];
        const xOutBottom = revealOffsetInfo[index] + patVal[index + 1];
        coords.outer[0] = {y: outer[0].y, x: xOutTop};
        coords.outer[1] = {y: outer[1].y, x: xOutTop};
        coords.outer[2] = {y: outer[2].y, x: xOutBottom};
        coords.outer[3] = {y: outer[3].y, x: xOutBottom};
        const xInTop = revealOffsetInfo[index] + patVal[index];
        const xInBottom = revealOffsetInfo[index] + patVal[index + 1];
        coords.inner[0] = {y: outer[0].y, x: xInTop};
        coords.inner[1] = {y: outer[1].y, x: xInTop};
        coords.inner[2] = {y: outer[2].y, x: xInBottom};
        coords.inner[3] = {y: outer[3].y, x: xInBottom};
      }
    }

    function setSectionCoordinates() {
      const dividerOffsetInfo = this.dividerOffsetInfo();
      const revealOffsetInfo = this.revealOffsetInfo();
      const isReveal = this.propertyConfig().isReveal();
      let distance = isReveal ?
              (this.vertical() ? this.outerLength() : this.outerWidth()) :
              (this.vertical() ? this.innerLength() : this.innerWidth());
      distance -= revealOffsetInfo[revealOffsetInfo.length - 1].offset;
      const patternInfo = this.pattern().calc(distance);

      for (let index = 0; index < sections.length; index++) {
        const section = sections[index];
        const patVal = patternInfo.values[Math.floor(index / 2)];
        if (section instanceof DividerSection) {
          updateDividerCoordinates(section, patVal);
        } else if (section instanceof SectionProperties) {
          updatdSectionPropertiesCoordinates(section, patVal);
        }
      }
    }

    this.revealOffsetInfo = () => {
      let offset = 0;
      const info = [];
      for (let index = 0; index < limitIndex; index += 1) {
        const section = this.sections[index];
        if (section instanceof DividerSection) {
          if (this.propertyConfig().isReveal()) {
            if (offset === 0) offset += this.propertyConfig().reveal().r.value();
            offset += this.propertyConfig().reveal().r.value();
          }  else if (this.propertyConfig().isInset()) {
            const insetValue = this.propertyConfig('Inset').is.value();
            offset += section.maxWidth() + insetValue * 2;
          } else {
            offset += section.maxWidth();
            offset -= this.propertyConfig().overlay() * 2;
          }
          info[index] = {offset, section};
        }
      }
      return info;
    }

    this.dividerOffsetInfo = () => {
      const info = [];
      let offset = this.isVertical() ? this.outerLength() : this.outerWidth();
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
          info[index] = {offset, section};
          offset = startOffset + index < sections.length - 1 ? halfReveal*2 : halfReveal;
        }
      }
      return info;
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
            this.sections.push(new DividerSection(`dv-${this.id()}-${index}`, this.dividerProps(index), instance));
            const divideIndex = dividerCount + index + 1;
            this.sections.push(new DivideSection(this.borders(divideIndex), instance));
          }
          return diff !== 0;
        }
      }
      return false;
    }

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

    this.dividerLayout = () => {
      let distance;
      const coverable = this.coverable();
      distance = this.vertical() ? coverable.dems.x : coverable.dems.y;
      distance -= this.dividerReveal();
      return this.pattern().calc(distance);
    };

    function removeCachedValues() {
      inner = outer = outerLength = innerLength = outerWidth = innerWidth = null;
      this.coordinates();
    }

    this.coordinates = () => {
      if (inner=== null) {
        inner = this.evalObject(innerCoordinates);
      }
      if (outer === null) {
        outer = this.evalObject(outerCoordinates);
      }
      return {inner, outer};
    }
    this.outerCenter = () => {
      if (outerCenter === null) outerCenter = Vertex3D.center(outer);
      return outerCenter;
    }

    this.innerCenter = () => {
      if (innerCenter === null) innerCenter = Vertex3D.center(inner);
      return outerCenter;
    }

    this.outerLength = () => {
      if (outerLength === null)
        outerLength = Math.max(outer[0].distance(outer[3]), outer[1].distance(outer[2]));
      return outerLength;
    }

    this.outerWidth = () => {
      if (outerWidth === null)
        outerWidth = Math.max(outer[0].distance(outer[1]), outer[3].distance(outer[2]));
      return outerWidth;
    }

    this.longestRadius = () => {
      const oc = this.outerCenter();
      let max = oc.distance(outerCoordinates[0]);
      for (let index = 1; index < outerCoordinates.length; index++) {
        const dist = oc.distance(outer[index]);
        if (dist > max) max = dist;
      }
      return max;
    };

    this.coverInfo = () => {
      const propConfig = cabinet.propertyConfig();
      let center, length, width;
      if (propConfig.isInset()) {
        const offset = propConfig('Inset').is.value();
        const negOffset = -1 * offset;
        const doorThickness = 3 * 2.54/4;
        const projection = 3 * 2.54/64;
        const zOffset = (doorThickness + projection) / 2;
        center = offsetCenter(innerCenter, offset, negOffset, negOffset, offset, zOffset, 0);
        length = innerLength() - 2*offset;
        width = innerWidth() - 2*offset;
      } else if (propConfig.isReveal()) {
        throw new Error('not implemented: depends on negboring cabinets');
      } else {
        const offset = this.propertyConfig().overlay();
        const negOffset = -1 * offset;
        const doorThicknes = 3/4;
        const bumperThickness = 3/16;
        const zOffset = doorThicknes / 2 +  + bumperThickness;
        center = offsetCenter(innerCenter, negOffset, offset, offset, negOffset, 0, zOffset);
        length = innerLength() + 2*offset;
        width = innerWidth() + 2*offset;
      }

      return {center, length, width, rotation};
    }

    const assemToJson = this.toJson;
    this.toJson = () => {
      const json = assemToJson.apply(this);
      json.pattern = this.pattern().toJson();
      json.subassemblies = this.sections.map((section) => section.toJson());
      return json;
    }

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
