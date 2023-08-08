
const Vertex3D = require('../../../../three-d/objects/vertex.js');
const Polygon3D = require('../../../../three-d/objects/polygon.js');
const Line3D = require('../../../../three-d/objects/line.js');
const Plane = require('../../../../three-d/objects/plane.js');
const BiPolygon = require('../../../../three-d/objects/bi-polygon.js');
const KeyValue = require('../../../../../../../public/js/utils/object/key-value.js');
const Notification = require('../../../../../../../public/js/utils/collections/notification.js');
const Assembly = require('../../assembly.js');
const Cutter = require('../cutter.js');
const CSG = require('../../../../../public/js/3d-modeling/csg.js');
const DividerSection = require('./partition/divider.js');
const Pattern = require('../../../../division-patterns.js');
const Joint = require('../../../joint/joint.js');

const v = () => new Vertex3D();
class SectionProperties extends KeyValue{
  constructor(config, index, sections, pattern) {
    super({childrenAttribute: 'sections', parentAttribute: 'parentAssembly'})
    if (sections) {
      this.sections.merge(sections);
    }
    // TODO: consider getting rid of, sections and cover are the only ones that matter.
    this.subassemblies = [];
    const sectionCutters = [];


    // index ||= 0;
    const coordinates = {inner: [v(),v(),v(),v()], outer: [v(),v(),v(),v()]};
    let rotation, innerCenter, outerCenter, outerLength, innerLength, outerWidth, innerWidth = null;
    const temporaryInitialVals = {parent, _TEMPORARY: true};
    Object.getSet(this, temporaryInitialVals, 'parentAssembly');
    Object.getSet(this, {divideRight: false, config, index}, 'divider', 'cover');
    this.index = () => index;
    const instance = this;
    pattern ||= new Pattern('a');

    const keyValHash = this.hash;
    this.hash = () => {
      const cover = this.cover();
      let hash = (cover ? cover.hash() : 0) + pattern.toString().hash();
      hash += keyValHash();
      for (let index = 0; index < this.subassemblies.length; index++) {
        hash += this.subassemblies[index].hash(true);
      }
      for (let index = 0; index < this.sections.length; index++) {
        hash += this.sections[index].hash(true);
      }
      return hash;
    }

    this.divideRight = () =>
      this.parentAssembly().sectionCount && this.parentAssembly().sectionCount() !== index;
    this.partCode = () => 'S' + index;
    this.partName = () => {
      const orientation = this.vertical() ? 'V' : 'H';
      if (!(this.parentAssembly() instanceof SectionProperties)) return orientation;
      const pPartName = this.parentAssembly().partName();
      return `${pPartName}${index}.${orientation}`;
    }

    this.config = () => JSON.copy(config);
    this.outerPoly = () => new Polygon3D(this.coordinates().outer);
    this.innerPoly = () => new Polygon3D(this.coordinates().inner);
    this.coordinates = () => JSON.clone(coordinates);
    this.reverseInner = () => CSG.reverseRotateAll(this.coordinates().inner);
    this.reverseOuter = () => CSG.reverseRotateAll(this.coordinates().outer);
    this.part = () => false;
    this.included = () => false;
    this.joints = [];
    this.coverType = () => this.cover() && this.cover().constructor.name;
    this.vertical = (is) => {
      const curr = instance.value('vertical', is);
      if (is !== undefined && curr !== is) removeCachedValues();
      return curr;
    }
    const getPartFunc = (dir) => config[dir] instanceof Function ? config[dir] : () => instance.getAssembly(config[dir]);
    this.top = getPartFunc('top');
    this.bottom = getPartFunc('bottom');
    this.left = getPartFunc('left');
    this.right = getPartFunc('right');
    this.back = getPartFunc('back');
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

    this.root = () => {
      let curr = this;
      while(curr.parentAssembly() instanceof SectionProperties) curr = curr.parentAssembly();
      return curr;
    }

    this.innerDepth = () => {
      const cabinet = this.getCabinet();
      const back = this.back();
      if (back) return this.innerCenter().distance(back.position().center());
      return 4*2.54;
    };

    function offsetCenter(center, left, right, up, down, forward, backward) {
      center = JSON.copy(center);
      const offset = {
        x: (right - left) / 2,
        y: (up - down) / 2,
        z: (forward - backward) / -2
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
      originalPosition.z -= z;
      return CSG.rotate(originalPosition, rotation);
    }
    this.offsetRotatedPoint = offsetRotatedPoint;
    this.transRotate = CSG.transRotate;

    function offsetPoint(point, x, y, z) {
      const offset = {x,y,z};
      return CSG.transRotate(point, offset, instance.rotation());
    }
    this.offsetPoint = offsetPoint;

    this.childConfig = () => {
      const iv = this.isVertical;
      const index = this.sections.length;
      const vert = {
          top: this.top,
          bottom: this.bottom,
          left: () => index === 0 ? this.left() : this.sections[index-1].divider(),
          right: () => index === this.sections.length - 1 ? this.right() : this.sections[index].divider()
        };
      const hor = {
        left: this.left,
        right: this.right,
        top: () => index === 0 ? this.top() : this.sections[index-1].divider(),
        bottom: () => index === this.sections.length - 1 ? this.bottom() : this.sections[index].divider()
      };
      const conf = {
        rotation: config.rotation,
        back: this.back
      };
      const dirFunc = (dir) => conf[dir] = () => iv() ? vert[dir]() : hor[dir]();
      dirFunc('top');dirFunc('bottom');dirFunc('left');dirFunc('right');
      return conf;
    }

    function init () {
      if (instance.sections.length === 0) {
        instance.sections.push(new SectionProperties(instance.childConfig(), 1));
      }
    }

    this.init = init;
    this.dividerCount = () => this.sections.length - 1;
    this.sectionCount = () => this.sections.length || 1;
    this.children = () => this.sections;
    this.getSubassemblies = () => {
      const assems = Object.values(this.sections);
      assems.concatInPlace(sectionCutters);
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
      const subAssems = ({}).merge(this.subassemblies);
      sectionCutters.forEach(sc => subAssems[sc.partCode()] = sc);
      if (subAssems[partCode]) return subAssems[partCode];
      if (callingAssem !== undefined) {
        const children = Object.values(this.subassemblies);
        if (this.divideRight()) children.concatInPlace(divider);
        const cover = this.cover()
        if (cover) children.concatInPlace(cover);
        for (let index = 0; index < children.length; index += 1) {
          const assem = children[index].getAssembly(partCode, this);
          if (assem !== undefined) return assem;
        }
      }
      if (this.parentAssembly() !== undefined && this.parentAssembly() !== callingAssem)
        return this.parentAssembly().getAssembly(partCode, this);
      return undefined;
    }

    // TODO: innerOffset - proorly named and implemented values produced are in the ball park but not correct.
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
      updateCoords = false;
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
          if (index === 0) {
            startInner = dividerOffsetInfo[0].offset;
          } else {
            startInner = startOuter + dividerOffsetInfo[index].offset/2;
          }

          endInner = (startInner + patVal[index] - overlayOffset);
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
        const intersection = plane.intersection.line(line);
        const distance = line.startVertex.distance(intersection);
        return distance;
      }
      return 0;
    }

    this.coverage = (startOffset, endOffset) => {
      called.coverage++;
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
      called.dividerOffsetInfo++;
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
            const section = new SectionProperties(this.childConfig(), index + 2);
            this.sections.push(section);
            console.log(section);
          }
          if (diff !== 0) setSectionCoordinates();
          return diff !== 0;
        }
      }
      return false;
    }

    this.setPattern = (patternObj) => {
      if (patternObj instanceof Pattern) {
        pattern = patternObj;
      }
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
      called.coverInfo++;
      if (updateCoords) {
        setSectionCoordinates();
      }
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
        offset = propConfig.overlay() * 2;
        frontOffset = (doorThickness + bumperThickness);
        backOffset = bumperThickness;
      }

      frontOffset *= -1;
      backOffset *= -1;
      const offsetObj = {x: offset, y: offset};
      biPolygon = BiPolygon.fromPolygon(new Polygon3D(coords), frontOffset, backOffset, offsetObj);
      return {biPolygon, frontOffset, backOffset};
    }

    this.normal = () => this.coverInfo().biPolygon.normal()

    function addDividerJoints(point1, point2) {
      const c = instance.getCabinet();
      const divider = instance.divider();
      const panelThickness = divider.panelThickness();
      const jointOffset = instance.dividerJoint().maleOffset();
      const right = instance.right();
      const left = instance.left();
      const maxLen = Math.max(c.width(), c.length(), c.thickness());
      if (!(right instanceof DividerSection)) {
        Line3D.adjustVertices(point1, point2, maxLen, true);
      } else {
        const length = point1.distance(point2) + jointOffset - right.panelThickness()/2;
        Line3D.adjustVertices(point1, point2, length, true);
        instance.dividerJoint.zero(divider.panel(), right.panel());
      }
      if (!(left instanceof DividerSection)) {
        Line3D.adjustVertices(point2, point1, maxLen, true);
      } else {
       const length = point1.distance(point2) + jointOffset - left.panelThickness()/2;
        Line3D.adjustVertices(point2, point1, length, true);
        instance.dividerJoint.zero(divider.panel(), left.panel());
      }

    }

    this.dividerInfo = (panelThickness) => {
      called.dividerInfo++;
      const coverInfo = this.coverInfo();
      const normal = coverInfo.biPolygon.normal().inverse();
      const depth = this.innerDepth();
      const length = this.innerLength();
      const width = this.innerWidth();
      const innerCenter = this.innerCenter();
      const coordinates = this.coordinates();
      const divider = this.divider();
      if (!this.verticalDivisions()) {
        const outer = coordinates.outer;
        const point1 = outer[3];
        const point2 = outer[2];
        addDividerJoints(point1, point2);
        let depthVector = normal.scale(depth);
        const point3 = point2.translate(depthVector, true);
        const point4 = point1.translate(depthVector, true);
        const points = [point1, point2, point3, point4];
        const offset = divider.panelThickness() / 2;
        return BiPolygon.fromPolygon(new Polygon3D(points), offset, -offset);
      }
      const outer = coordinates.outer;
      const point1 = outer[1];
      const point2 = outer[2];
      addDividerJoints(point1, point2);
      let depthVector = normal.scale(depth);
      const point3 = point2.translate(depthVector, true);
      const point4 = point1.translate(depthVector, true);
      const points = [point1, point2, point3, point4];
      const offset = divider.panelThickness() / 2;
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

    let updateCoords;
    this.updateCoordinates = (newCoords) => {
      updateCoordinates(coordinates.outer, newCoords.outer) | updateCoordinates(coordinates.inner, newCoords.inner);
      removeCachedValues();
    }

    this.reevaluate = () => {
      updateCoords = true;
      removeCachedValues();
      setSectionCoordinates();
    }



    let dividerJoint;
    this.dividerJoint = (joint) => {
      if (joint instanceof Joint) dividerJoint = joint;
      if (dividerJoint) return dividerJoint.clone();
      return this.getCabinet().value('dividerJoint').clone();
    }

    const mapped = {};
    this.dividerJoint.zero = (male, female) => {
      const key = `${male.partCode()}=>${female.partCode()}`;
      if (mapped[key] === undefined) {
        const joint = this.dividerJoint();
        joint.maleOffset(0);
        joint.malePartCode(male.partCode());
        joint.femalePartCode(female.partCode());
        joint.parentAssemblyId(male.id());
        male.joints.push(joint);
        mapped[key] = true;
      }
    }

    let called = {coverage: 0, dividerOffsetInfo: 0, coverInfo: 0, dividerInfo: 0};
    this.setSection = (constructorIdOobject) => {
      let section = SectionProperties.new(constructorIdOobject);
      this.cover(section);
      console.log(called);
      if (section) {
        section.parentAssembly(this);
      }
    }

    const divider = new DividerSection(this);
    this.divider(divider);
    divider.parentAssembly(this);
    this.value('vertical', true);
    // TODO:updateFlag Use update flag instead;
    this.pattern().onChange(this.reevaluate);
    // this.vertical(true);
    // coordinates.onAfterChange(this.reevaluate);

    function buildCutters () {
      const cabinet = instance.getCabinet();
      const subAssems = Object.values(cabinet.subassemblies).filter((assem) => !assem.constructor.name.match(/^(Cutter|Auto|Section)/))
      const fromPoint = cabinet.buildCenter();
      for (let index = 0; index < subAssems.length; index++) {
        const reference = subAssems[index];
        const offset = instance.dividerJoint().maleOffset();
        const cutter = new Cutter.Reference(reference, fromPoint, offset);
        sectionCutters.push(cutter);
      }
    }

    this.addCutters = (divider) => {
      const root = this.root();
      if (root !== this) return root.addJoints(divider);
      if (sectionCutters.length === 0) buildCutters();
      for (let index = 0; index < sectionCutters.length; index++) {
        const cutter = sectionCutters[index];
        divider.panel().addJoints(new Joint(cutter.partCode(), divider.panel().partCode()));
      }
    }

    this.addJoints = (divider) => {
      const cabinet = instance.getCabinet();
      const panel = divider.panel();
      const subAssems = Object.values(cabinet.subassemblies).filter((assem) => !assem.constructor.name.match(/^(Cutter|Auto|Section)/))
      const joint = this.dividerJoint();
      for (let index = 0; index < subAssems.length; index++) {
        const assem = subAssems[index];
        this.dividerJoint.zero(panel, assem);
      }
      this.addCutters(divider);
    }
    setTimeout(() => this.addJoints(this.divider()));
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

SectionProperties.fromJson = (json) => {
  const sections = [];
  const pattern = Pattern.fromJson(json.pattern);
  for (let index = 0; index < json.subassemblies.length; index++) {
    const sectionJson = json.subassemblies[index];
    sections.push(Object.fromJson(sectionJson));
  }
  const sp  = new SectionProperties(json.config, json.index, sections, pattern);
  sp.value.all(json.value.values);
  sp.parentAssembly(json.parent);
  sp.cover(Object.fromJson(json.cover));
  if (sp.cover()) sp.cover().parentAssembly(sp);
  sp.divider(new DividerSection(sp));
  return sp;
}

const sections = [];
SectionProperties.addSection = (clazz) => sections.push(clazz);
SectionProperties.list = () => [].concat(sections);

Object.class.register(SectionProperties);
module.exports = SectionProperties;
